import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, widgetConfigs, discordConfigs } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

/** GET: Fetch project settings (widget + discord config) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [widget] = await db
    .select()
    .from(widgetConfigs)
    .where(eq(widgetConfigs.projectId, id))

  const [discord] = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, id))

  return NextResponse.json({ project, widget: widget || null, discord: discord || null })
}

/** PUT: Update project settings */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Update project name/domain
  if (body.name || body.domain !== undefined) {
    await db
      .update(projects)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.domain !== undefined && { domain: body.domain }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
  }

  // Update widget config
  if (body.widget) {
    await db
      .update(widgetConfigs)
      .set({
        ...(body.widget.primaryColor && { primaryColor: body.widget.primaryColor }),
        ...(body.widget.position && { position: body.widget.position }),
        ...(body.widget.welcomeMessage !== undefined && {
          welcomeMessage: body.widget.welcomeMessage,
        }),
        ...(body.widget.offlineMessage !== undefined && {
          offlineMessage: body.widget.offlineMessage,
        }),
      })
      .where(eq(widgetConfigs.projectId, id))
  }

  // Update discord channel selection
  if (body.discord?.channelId) {
    await db
      .update(discordConfigs)
      .set({
        channelId: body.discord.channelId,
        channelName: body.discord.channelName || null,
      })
      .where(eq(discordConfigs.projectId, id))
  }

  return NextResponse.json({ success: true })
}

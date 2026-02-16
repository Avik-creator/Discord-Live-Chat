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

  let widget = null
  try {
    const [w] = await db.select().from(widgetConfigs).where(eq(widgetConfigs.projectId, id))
    widget = w || null
  } catch {
    // bubble_shape column may not exist yet – fall back to selecting known columns
    const [w] = await db
      .select({
        id: widgetConfigs.id,
        projectId: widgetConfigs.projectId,
        primaryColor: widgetConfigs.primaryColor,
        position: widgetConfigs.position,
        welcomeMessage: widgetConfigs.welcomeMessage,
        offlineMessage: widgetConfigs.offlineMessage,
      })
      .from(widgetConfigs)
      .where(eq(widgetConfigs.projectId, id))
    widget = w ? { ...w, bubbleShape: "rounded" } : null
  }

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
    const widgetUpdate: Record<string, unknown> = {}
    if (body.widget.primaryColor) widgetUpdate.primaryColor = body.widget.primaryColor
    if (body.widget.position) widgetUpdate.position = body.widget.position
    if (body.widget.welcomeMessage !== undefined) widgetUpdate.welcomeMessage = body.widget.welcomeMessage
    if (body.widget.offlineMessage !== undefined) widgetUpdate.offlineMessage = body.widget.offlineMessage

    // First, try to save all fields including bubbleShape
    if (body.widget.bubbleShape) widgetUpdate.bubbleShape = body.widget.bubbleShape
    try {
      await db.update(widgetConfigs).set(widgetUpdate).where(eq(widgetConfigs.projectId, id))
    } catch {
      // bubble_shape column may not exist yet – save without it
      delete widgetUpdate.bubbleShape
      await db.update(widgetConfigs).set(widgetUpdate).where(eq(widgetConfigs.projectId, id))
    }
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

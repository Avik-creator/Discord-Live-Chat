import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, discordConfigs } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getBotInviteUrl } from "@/lib/discord"
import { nanoid } from "nanoid"

/** GET: Generate the Discord bot invite URL */
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

  const url = getBotInviteUrl(id)
  return NextResponse.json({ url })
}

/** POST: Save selected guild to project */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { guildId, guildName } = await req.json()

  if (!guildId || !guildName) {
    return NextResponse.json({ error: "Missing guildId or guildName" }, { status: 400 })
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Upsert discord config
  const existing = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, id))

  if (existing.length > 0) {
    await db
      .update(discordConfigs)
      .set({ guildId, guildName })
      .where(eq(discordConfigs.projectId, id))
  } else {
    await db.insert(discordConfigs).values({
      id: nanoid(12),
      projectId: id,
      guildId,
      guildName,
    })
  }

  return NextResponse.json({ ok: true })
}

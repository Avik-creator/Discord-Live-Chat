import { requireAuth, requireProject } from "@/lib/api/auth"
import { badRequest } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { projects, discordConfigs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getBotInviteUrl } from "@/lib/discord"
import { nanoid } from "nanoid"

/** GET: Generate the Discord bot invite URL */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project
  const url = getBotInviteUrl(id)
  return NextResponse.json({ url })
}

/** POST: Save selected guild to project */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project
  const { guildId, guildName } = await req.json()
  if (!guildId || !guildName) return badRequest("Missing guildId or guildName")

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

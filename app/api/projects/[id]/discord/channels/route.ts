import { requireAuth, requireProject } from "@/lib/api/auth"
import { badRequest, serverError } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { projects, discordConfigs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getGuildChannels } from "@/lib/discord"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project

  const [discordConfig] = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, id))

  if (!discordConfig) return badRequest("Discord not connected")

  try {
    const channels = await getGuildChannels(discordConfig.guildId)
    return NextResponse.json(channels)
  } catch {
    return serverError("Failed to fetch channels")
  }
}

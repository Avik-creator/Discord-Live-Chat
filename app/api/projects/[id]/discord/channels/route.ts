import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, discordConfigs } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getGuildChannels } from "@/lib/discord"

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

  const [discordConfig] = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, id))

  if (!discordConfig) {
    return NextResponse.json({ error: "Discord not connected" }, { status: 400 })
  }

  try {
    const channels = await getGuildChannels(discordConfig.guildId)
    return NextResponse.json(channels)
  } catch {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }
}

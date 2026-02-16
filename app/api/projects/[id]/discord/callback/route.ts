import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, discordConfigs } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

const DISCORD_API = "https://discord.com/api/v10"

/** GET: Discord bot OAuth callback -- saves guild info */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const { id } = await params
  const guildId = req.nextUrl.searchParams.get("guild_id")

  if (!guildId) {
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${id}/settings?error=no_guild`, req.url)
    )
  }

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Fetch guild info
  let guildName = "Unknown Server"
  try {
    const res = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })
    if (res.ok) {
      const guild = await res.json()
      guildName = guild.name
    }
  } catch {
    // Use fallback name
  }

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

  return NextResponse.redirect(
    new URL(`/dashboard/projects/${id}/settings?discord=connected`, req.url)
  )
}

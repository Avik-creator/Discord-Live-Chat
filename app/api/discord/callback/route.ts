import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, discordConfigs } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

const DISCORD_API = "https://discord.com/api/v10"

/**
 * Single Discord bot OAuth callback. Register this URL in Discord Developer Portal:
 * https://yourdomain.com/api/discord/callback
 * Invite URL must include state=projectId and redirect_uri pointing here.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const projectId = req.nextUrl.searchParams.get("state")
  const guildId = req.nextUrl.searchParams.get("guild_id")

  if (!projectId || !guildId) {
    const fallback = projectId
      ? `/dashboard/projects/${projectId}/settings?error=no_guild`
      : "/dashboard"
    return NextResponse.redirect(new URL(fallback, req.url))
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))

  if (!project) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

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

  const existing = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, projectId))

  if (existing.length > 0) {
    await db
      .update(discordConfigs)
      .set({ guildId, guildName })
      .where(eq(discordConfigs.projectId, projectId))
  } else {
    await db.insert(discordConfigs).values({
      id: nanoid(12),
      projectId,
      guildId,
      guildName,
    })
  }

  return NextResponse.redirect(
    new URL(`/dashboard/projects/${projectId}/settings?discord=connected`, req.url)
  )
}

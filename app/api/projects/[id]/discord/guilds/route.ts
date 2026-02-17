import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, account } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getBotGuilds, getUserGuilds, refreshDiscordToken } from "@/lib/discord"

/** GET: List all servers the user manages, marking which ones have the bot */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Get the user's Discord account from the account table
  const [discordAccount] = await db
    .select()
    .from(account)
    .where(
      and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "discord")
      )
    )

  // Fetch bot guilds (always available)
  let botGuildIds = new Set<string>()
  try {
    const botGuilds = await getBotGuilds()
    botGuildIds = new Set(botGuilds.map((g: { id: string }) => g.id))
  } catch {
    // Bot token might be invalid; continue with empty set
  }

  // If we have the user's access token, fetch their guilds
  if (discordAccount?.accessToken) {
    let accessToken = discordAccount.accessToken

    // Check if token might be expired and try to refresh
    const isExpired =
      discordAccount.accessTokenExpiresAt &&
      new Date(discordAccount.accessTokenExpiresAt) <= new Date()

    if (isExpired && discordAccount.refreshToken) {
      const refreshed = await refreshDiscordToken(discordAccount.refreshToken)
      if (refreshed) {
        accessToken = refreshed.access_token
        // Update the stored tokens in the database
        await db
          .update(account)
          .set({
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            accessTokenExpiresAt: new Date(
              Date.now() + refreshed.expires_in * 1000
            ),
            updatedAt: new Date(),
          })
          .where(eq(account.id, discordAccount.id))
      }
    }

    try {
      const userGuilds = await getUserGuilds(accessToken)

      // Merge: show all user-managed guilds, mark which ones have the bot
      const merged = userGuilds.map(
        (g: {
          id: string
          name: string
          icon: string | null
          owner: boolean
        }) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
          hasBot: botGuildIds.has(g.id),
        })
      )

      // Sort: bot-installed servers first, then alphabetical
      merged.sort(
        (
          a: { hasBot: boolean; name: string },
          b: { hasBot: boolean; name: string }
        ) => {
          if (a.hasBot !== b.hasBot) return a.hasBot ? -1 : 1
          return a.name.localeCompare(b.name)
        }
      )

      return NextResponse.json(merged)
    } catch {
      // Token might be invalid even after refresh — try refreshing once more
      if (discordAccount.refreshToken) {
        const refreshed = await refreshDiscordToken(
          discordAccount.refreshToken
        )
        if (refreshed) {
          await db
            .update(account)
            .set({
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token,
              accessTokenExpiresAt: new Date(
                Date.now() + refreshed.expires_in * 1000
              ),
              updatedAt: new Date(),
            })
            .where(eq(account.id, discordAccount.id))

          try {
            const userGuilds = await getUserGuilds(refreshed.access_token)
            const merged = userGuilds.map(
              (g: {
                id: string
                name: string
                icon: string | null
                owner: boolean
              }) => ({
                id: g.id,
                name: g.name,
                icon: g.icon,
                owner: g.owner,
                hasBot: botGuildIds.has(g.id),
              })
            )
            merged.sort(
              (
                a: { hasBot: boolean; name: string },
                b: { hasBot: boolean; name: string }
              ) => {
                if (a.hasBot !== b.hasBot) return a.hasBot ? -1 : 1
                return a.name.localeCompare(b.name)
              }
            )
            return NextResponse.json(merged)
          } catch {
            // Give up on user guilds, fall through to bot-only guilds
          }
        }
      }
    }
  }

  // Fallback: just return bot guilds (when user token is unavailable)
  try {
    const botGuilds = await getBotGuilds()
    return NextResponse.json(
      botGuilds.map(
        (g: { id: string; name: string; icon: string | null }) => ({
          ...g,
          owner: false,
          hasBot: true,
        })
      )
    )
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch guilds" },
      { status: 500 }
    )
  }
}

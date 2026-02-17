import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, widgetConfigs, discordConfigs, account } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { getUserGuilds, getBotGuilds, refreshDiscordToken } from "@/lib/discord"
import { SettingsTabs } from "./_components/settings-tabs"

type GuildEntry = {
  id: string
  name: string
  icon: string | null
  owner?: boolean
  hasBot?: boolean
}

/**
 * Fetch guilds for the server list. Tries user token first (shows all
 * admin/owner servers), falls back to bot-only guilds if user token fails.
 */
async function fetchGuilds(userId: string): Promise<GuildEntry[]> {
  // 1. Get bot guilds (always available via bot token)
  let botGuilds: { id: string; name: string; icon: string | null }[] = []
  const botGuildIds = new Set<string>()
  try {
    botGuilds = await getBotGuilds()
    for (const g of botGuilds) botGuildIds.add(g.id)
  } catch {
    // Bot token issue - continue with empty
  }

  // 2. Get the user's Discord account
  const [discordAccount] = await db
    .select()
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "discord"))
    )

  if (!discordAccount?.accessToken) {
    // No user token at all - return bot guilds as fallback
    return botGuilds.map((g) => ({ ...g, owner: false, hasBot: true }))
  }

  // 3. Try to get user guilds, refreshing token if needed
  const userGuilds = await tryGetUserGuilds(discordAccount, botGuildIds)

  if (userGuilds) return userGuilds

  // 4. Fallback: return bot guilds so the user at least sees something
  return botGuilds.map((g) => ({ ...g, owner: false, hasBot: true }))
}

/**
 * Attempt to fetch user guilds. If the token is expired or returns 401,
 * refresh and retry once. Returns null if all attempts fail.
 */
async function tryGetUserGuilds(
  discordAccount: {
    id: string
    accessToken: string | null
    refreshToken: string | null
    accessTokenExpiresAt: Date | null
  },
  botGuildIds: Set<string>
): Promise<GuildEntry[] | null> {
  let accessToken = discordAccount.accessToken!

  // Pre-emptive refresh if the stored expiry has passed
  const isExpired =
    discordAccount.accessTokenExpiresAt &&
    new Date(discordAccount.accessTokenExpiresAt) <= new Date()

  if (isExpired) {
    const refreshed = await attemptRefresh(discordAccount)
    if (refreshed) {
      accessToken = refreshed
    } else {
      return null
    }
  }

  // First attempt
  try {
    return mapUserGuilds(await getUserGuilds(accessToken), botGuildIds)
  } catch {
    // Token might be invalid even if not "expired" -- refresh and retry
    const refreshed = await attemptRefresh(discordAccount)
    if (!refreshed) return null

    try {
      return mapUserGuilds(await getUserGuilds(refreshed), botGuildIds)
    } catch {
      return null
    }
  }
}

async function attemptRefresh(
  discordAccount: {
    id: string
    refreshToken: string | null
  }
): Promise<string | null> {
  if (!discordAccount.refreshToken) return null

  const refreshed = await refreshDiscordToken(discordAccount.refreshToken)
  if (!refreshed) return null

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

  return refreshed.access_token
}

function mapUserGuilds(
  userGuilds: {
    id: string
    name: string
    icon: string | null
    owner: boolean
  }[],
  botGuildIds: Set<string>
): GuildEntry[] {
  const mapped = userGuilds.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    owner: g.owner,
    hasBot: botGuildIds.has(g.id),
  }))
  // Bot-installed servers first, then alphabetical
  mapped.sort((a, b) => {
    if (a.hasBot !== b.hasBot) return a.hasBot ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return mapped
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const { id } = await params

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) notFound()

  // Fetch widget config
  let widget = null
  try {
    const [w] = await db
      .select()
      .from(widgetConfigs)
      .where(eq(widgetConfigs.projectId, id))
    widget = w || null
  } catch {
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

  // Fetch discord config
  const [discord] = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, id))

  // Fetch guilds only when not connected yet
  const guilds = discord ? [] : await fetchGuilds(session.user.id)

  const widgetData = {
    primaryColor: widget?.primaryColor ?? "#5865F2",
    position: widget?.position ?? "bottom-right",
    welcomeMessage: widget?.welcomeMessage ?? "",
    offlineMessage: widget?.offlineMessage ?? "",
    bubbleShape:
      (widget as { bubbleShape?: string } | null)?.bubbleShape ?? "rounded",
  }

  const discordData = discord
    ? {
        guildId: discord.guildId,
        guildName: discord.guildName,
        channelId: discord.channelId ?? undefined,
        channelName: discord.channelName ?? undefined,
      }
    : null

  return (
    <SettingsTabs
      projectId={id}
      project={{ name: project.name, domain: project.domain }}
      widget={widgetData}
      discord={discordData}
      guilds={guilds}
    />
  )
}

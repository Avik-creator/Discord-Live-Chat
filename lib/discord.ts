const DISCORD_API = "https://discord.com/api/v10"

function botHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  }
}

/** Create a public thread from a message in a channel */
export async function createThread(
  channelId: string,
  name: string,
  firstMessage: string
) {
  // First, send a starter message in the channel
  const msgRes = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({
      embeds: [
        {
          title: `New chat: ${name}`,
          description: firstMessage,
          color: 0x5865f2,
          footer: { text: "Bridgecord - Reply in the thread below" },
        },
      ],
    }),
  })

  if (!msgRes.ok) {
    const err = await msgRes.text()
    throw new Error(`Failed to send starter message: ${err}`)
  }

  const msg = await msgRes.json()

  // Create a thread from that message
  const threadRes = await fetch(
    `${DISCORD_API}/channels/${channelId}/messages/${msg.id}/threads`,
    {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify({
        name: name.substring(0, 100),
        auto_archive_duration: 1440, // 24 hours
      }),
    }
  )

  if (!threadRes.ok) {
    const err = await threadRes.text()
    throw new Error(`Failed to create thread: ${err}`)
  }

  const thread = await threadRes.json()
  return { threadId: thread.id, messageId: msg.id }
}

/** Send a message in a thread */
export async function sendThreadMessage(
  threadId: string,
  content: string,
  username?: string
) {
  const displayContent = username
    ? `**${username}:** ${content}`
    : `**Visitor:** ${content}`

  const res = await fetch(`${DISCORD_API}/channels/${threadId}/messages`, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({ content: displayContent }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to send thread message: ${err}`)
  }

  const msg = await res.json()
  return { messageId: msg.id }
}

/** Get messages from a thread, optionally after a specific message ID */
export async function getThreadMessages(threadId: string, after?: string) {
  const params = new URLSearchParams({ limit: "50" })
  if (after) params.set("after", after)

  const res = await fetch(
    `${DISCORD_API}/channels/${threadId}/messages?${params}`,
    { headers: botHeaders() }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to get thread messages: ${err}`)
  }

  const msgs = await res.json()

  // Filter out bot messages (messages from the bot itself are visitor messages we sent)
  // Only return messages that are NOT from the bot
  const botId = await getBotUserId()

  return msgs
    .filter((m: { author: { id: string; bot?: boolean } }) => m.author.id !== botId)
    .map((m: { id: string; content: string; author: { username: string }; timestamp: string }) => ({
      id: m.id,
      content: m.content,
      author: m.author.username,
      timestamp: m.timestamp,
    }))
    .reverse() // Discord returns newest first, we want oldest first
}

let cachedBotId: string | null = null

async function getBotUserId() {
  if (cachedBotId) return cachedBotId

  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: botHeaders(),
  })

  if (!res.ok) return ""

  const bot = await res.json()
  cachedBotId = bot.id
  return bot.id
}

/** Get all guilds the bot is a member of */
export async function getBotGuilds() {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: botHeaders(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to get bot guilds: ${err}`)
  }

  const guilds = await res.json()
  return guilds.map((g: { id: string; name: string; icon: string | null }) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
  }))
}

/**
 * Get all guilds the user is in where they have MANAGE_GUILD permission.
 * Uses the user's OAuth access token (not the bot token).
 * Discord permission bit for MANAGE_GUILD = 0x20
 */
export async function getUserGuilds(accessToken: string) {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    return []
  }

  const guilds = await res.json()
  const MANAGE_GUILD = 0x20

  return guilds
    .filter(
      (g: { permissions: string; owner: boolean }) =>
        g.owner || (parseInt(g.permissions) & MANAGE_GUILD) !== 0
    )
    .map(
      (g: {
        id: string
        name: string
        icon: string | null
        owner: boolean
        approximate_member_count?: number
      }) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        memberCount: g.approximate_member_count,
      })
    )
}

/** Get text channels in a guild */
export async function getGuildChannels(guildId: string) {
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
    headers: botHeaders(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to get guild channels: ${err}`)
  }

  const channels = await res.json()

  // Filter to text channels only (type 0)
  return channels
    .filter((c: { type: number }) => c.type === 0)
    .map((c: { id: string; name: string; position: number }) => ({
      id: c.id,
      name: c.name,
      position: c.position,
    }))
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
}

/**
 * Generate the Discord OAuth URL for adding the bot to a server.
 * Uses the simpler bot invite flow -- no redirect_uri needed.
 * Discord will redirect back to the page that initiated the request,
 * and we include `state` with the projectId so the callback page can
 * identify which project to associate the guild with.
 *
 * Permissions: VIEW_CHANNEL, SEND_MESSAGES, EMBED_LINKS, READ_MESSAGE_HISTORY,
 *   CREATE_PUBLIC_THREADS, SEND_MESSAGES_IN_THREADS, MANAGE_THREADS
 */
export function getBotInviteUrl(projectId: string) {
  const permissions = "326417722368"

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    permissions,
    scope: "bot",
    disable_guild_select: "false",
  })

  // We use the guild_id from the callback URL query params.
  // Discord's bot invite flow without redirect_uri won't redirect back,
  // so we use a registered redirect_uri with response_type=code.
  // Instead, use the simpler approach: open in a popup and poll,
  // or use a custom redirect page. Simplest: don't use redirect_uri at all
  // and handle it client-side.

  return `https://discord.com/oauth2/authorize?${params}`
}

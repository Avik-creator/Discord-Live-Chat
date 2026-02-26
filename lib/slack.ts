const SLACK_API = "https://slack.com/api"

/**
 * Create headers for Slack API requests using a bot token
 */
function botHeaders(botToken: string) {
  return {
    Authorization: `Bearer ${botToken}`,
    "Content-Type": "application/json",
  }
}

/**
 * Exchange OAuth code for access token during app installation
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
  access_token: string
  team: { id: string; name: string }
  bot_user_id: string
} | null> {
  try {
    const res = await fetch(`${SLACK_API}/oauth.v2.access`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    })

    const data = await res.json()
    if (!data.ok) {
      console.error("[slack] OAuth exchange failed:", data.error)
      return null
    }

    return {
      access_token: data.access_token,
      team: data.team,
      bot_user_id: data.bot_user_id,
    }
  } catch (err) {
    console.error("[slack] OAuth exchange error:", err)
    return null
  }
}

/**
 * Join a Slack channel so the bot can post in it.
 * This is required for private channels and for public channels when
 * chat:write.public is not in scope. Returns true if already in channel or join succeeded.
 */
export async function joinSlackChannel(
  botToken: string,
  channelId: string
): Promise<void> {
  try {
    const res = await fetch(`${SLACK_API}/conversations.join`, {
      method: "POST",
      headers: botHeaders(botToken),
      body: JSON.stringify({ channel: channelId }),
    })
    const data = await res.json()
    // already_in_channel is fine — means the bot is already a member
    if (!data.ok && data.error !== "already_in_channel") {
      console.warn(`[slack] Could not join channel ${channelId}: ${data.error}`)
    } else {
      console.log(`[slack] Join channel ${channelId}: ${data.ok ? "joined" : data.error}`)
    }
  } catch (err) {
    console.warn(`[slack] Error joining channel ${channelId}:`, err)
  }
}

export async function createSlackThread(
  botToken: string,
  channelId: string,
  visitorName: string,
  firstMessage: string
): Promise<{ threadTs: string; messageTs: string }> {
  console.log(`[slack] Creating thread in channel ${channelId} for ${visitorName}`)

  // Ensure the bot is in the channel before posting
  await joinSlackChannel(botToken, channelId)

  // Post the initial message with an embed-like block
  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: "POST",
    headers: botHeaders(botToken),
    body: JSON.stringify({
      channel: channelId,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `\uD83D\uDCAC New chat: ${visitorName}`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: firstMessage,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "_Bridgecord - Reply in this thread_",
            },
          ],
        },
      ],
      text: `New chat from ${visitorName}: ${firstMessage}`, // Fallback text
    }),
  })

  const data = await res.json()
  console.log(`[slack] chat.postMessage response: ok=${data.ok}, error=${data.error}, ts=${data.ts}`)
  if (!data.ok) {
    throw new Error(`Failed to create Slack thread: ${data.error} (channel: ${channelId})`)
  }

  // The parent message's ts becomes our thread_ts
  return { threadTs: data.ts, messageTs: data.ts }
}

/**
 * Send a message in a Slack thread
 */
export async function sendSlackMessage(
  botToken: string,
  channelId: string,
  threadTs: string,
  content: string,
  username?: string
): Promise<{ messageTs: string }> {
  const prefix = username ? `*${username}:* ` : "*Visitor:* "
  const maxBody = 3000 - prefix.length // Slack allows 3000 chars in text
  const body =
    content.length > maxBody ? content.slice(0, maxBody - 1) + "…" : content
  const displayContent = `${prefix}${body}`

  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: "POST",
    headers: botHeaders(botToken),
    body: JSON.stringify({
      channel: channelId,
      thread_ts: threadTs,
      text: displayContent,
    }),
  })

  const data = await res.json()
  if (!data.ok) {
    throw new Error(`Failed to send Slack message: ${data.error}`)
  }

  return { messageTs: data.ts }
}

/**
 * Get messages from a Slack thread, optionally after a specific timestamp
 */
export async function getSlackThreadMessages(
  botToken: string,
  channelId: string,
  threadTs: string,
  botUserId: string,
  oldestTs?: string
): Promise<Array<{ ts: string; content: string; author: string }>> {
  const params: Record<string, string> = {
    channel: channelId,
    ts: threadTs,
    limit: "50",
  }
  if (oldestTs) params.oldest = oldestTs

  const res = await fetch(
    `${SLACK_API}/conversations.replies?${new URLSearchParams(params)}`,
    { headers: botHeaders(botToken) }
  )

  const data = await res.json()
  if (!data.ok) {
    throw new Error(`Failed to get Slack thread messages: ${data.error}`)
  }

  // Filter out bot's own messages and the parent message
  return data.messages
    .filter(
      (m: { user?: string; ts: string }) =>
        m.user !== botUserId && m.ts !== threadTs
    )
    .map((m: { ts: string; text: string; user: string }) => ({
      ts: m.ts,
      content: m.text,
      author: m.user,
    }))
}

/**
 * Get list of public channels in a workspace
 */
export async function getWorkspaceChannels(
  botToken: string
): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(
    `${SLACK_API}/conversations.list?${new URLSearchParams({
      types: "public_channel,private_channel",
      limit: "200",
    })}`,
    { headers: botHeaders(botToken) }
  )

  const data = await res.json()
  if (!data.ok) {
    throw new Error(`Failed to get workspace channels: ${data.error}`)
  }

  return data.channels
    .map((c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name,
    }))
    .sort((a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name)
    )
}

/**
 * Get workspace info using the bot token
 */
export async function getWorkspaceInfo(
  botToken: string
): Promise<{ id: string; name: string } | null> {
  const res = await fetch(`${SLACK_API}/team.info`, {
    headers: botHeaders(botToken),
  })

  const data = await res.json()
  if (!data.ok) {
    console.error("[slack] Failed to get workspace info:", data.error)
    return null
  }

  return {
    id: data.team.id,
    name: data.team.name,
  }
}

/**
 * Generate the Slack OAuth URL for installing the app to a workspace
 * 
 * Required scopes for the bot:
 * - channels:read       - List public channels
 * - channels:join       - Join public channels programmatically
 * - channels:history    - Read messages in public channels
 * - chat:write          - Send messages as bot
 * - chat:write.public   - Post to public channels without joining
 * - groups:read         - List private channels
 * - groups:history      - Read messages in private channels
 * - users:read          - Get user info for author names
 * - reactions:write     - Add emoji reactions to messages
 */
export function getSlackInstallUrl(projectId: string, redirectUri: string): string {
  const scopes = [
    "channels:read",
    "channels:join",
    "channels:history",
    "chat:write",
    "chat:write.public",
    "groups:read",
    "groups:history",
    "users:read",
    "reactions:write",
  ].join(",")
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: scopes,
    redirect_uri: redirectUri,
    state: projectId,
  })

  return `https://slack.com/oauth/v2/authorize?${params}`
}

/**
 * Verify Slack request signature for webhooks
 */
export function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) return false

  // Check timestamp is recent (within 5 minutes)
  const time = Math.floor(Date.now() / 1000)
  if (Math.abs(time - parseInt(timestamp)) > 60 * 5) {
    return false
  }

  const sigBasestring = `v0:${timestamp}:${body}`
  
  // Use Web Crypto API for HMAC
  const encoder = new TextEncoder()
  const key = encoder.encode(signingSecret)
  const message = encoder.encode(sigBasestring)
  
  // For server-side, we'll use Node's crypto
  const crypto = require("crypto")
  const hmac = crypto.createHmac("sha256", signingSecret)
  hmac.update(sigBasestring)
  const mySignature = `v0=${hmac.digest("hex")}`
  
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  )
}

/**
 * Delete a Slack thread by deleting the parent message.
 * Best-effort — does not throw on failure.
 */
export async function deleteSlackThread(
  botToken: string,
  channelId: string,
  threadTs: string
): Promise<void> {
  try {
    const res = await fetch(`${SLACK_API}/chat.delete`, {
      method: "POST",
      headers: botHeaders(botToken),
      body: JSON.stringify({ channel: channelId, ts: threadTs }),
    })
    const data = await res.json()
    if (!data.ok) {
      console.warn(`[slack] Failed to delete thread ${threadTs}: ${data.error}`)
    }
  } catch (err) {
    console.warn(`[slack] Error deleting thread ${threadTs}:`, err)
  }
}

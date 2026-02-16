/**
 * Redis-backed pub/sub for real-time message delivery across serverless functions.
 *
 * - `publish(conversationId, data)` is called by the Discord webhook and widget
 *   message POST routes to push events into a Redis channel.
 * - `subscribe(conversationId, onMessage)` is called by SSE stream endpoints to
 *   listen for events. It polls a Redis list (BLPOP is not supported on Upstash
 *   REST API), so we use a lightweight polling approach against a Redis list.
 *
 * The channel name is `chat:{conversationId}`.
 */

import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const CHANNEL_PREFIX = "bridgecord:chat:"
const MESSAGE_TTL = 60 // Seconds to keep messages in the list

/**
 * Publish a message event to a conversation channel.
 * Pushes the event JSON into a Redis list and trims old entries.
 */
export async function publishMessage(
  conversationId: string,
  data: Record<string, unknown>
) {
  const key = `${CHANNEL_PREFIX}${conversationId}`
  const payload = JSON.stringify({ ...data, _ts: Date.now() })

  await redis.rpush(key, payload)
  // Auto-expire the key so it cleans up if conversation goes idle
  await redis.expire(key, MESSAGE_TTL)
}

/**
 * Poll for new messages from a conversation channel.
 * Returns all messages pushed since `afterTimestamp`.
 * Cleans up consumed entries that are older than the TTL.
 */
export async function pollMessages(
  conversationId: string,
  afterTimestamp: number
): Promise<Record<string, unknown>[]> {
  const key = `${CHANNEL_PREFIX}${conversationId}`
  const raw = await redis.lrange(key, 0, -1)

  const results: Record<string, unknown>[] = []
  const toRemove: string[] = []

  for (const item of raw) {
    try {
      const parsed = typeof item === "string" ? JSON.parse(item) : item
      const ts = (parsed as { _ts?: number })._ts ?? 0

      if (ts > afterTimestamp) {
        results.push(parsed as Record<string, unknown>)
      } else if (Date.now() - ts > MESSAGE_TTL * 1000) {
        // Old message, mark for cleanup
        toRemove.push(typeof item === "string" ? item : JSON.stringify(item))
      }
    } catch {
      // skip malformed
    }
  }

  // Clean up old entries (best-effort, non-blocking)
  if (toRemove.length > 0) {
    for (const entry of toRemove) {
      redis.lrem(key, 1, entry).catch(() => {})
    }
  }

  return results
}

// Re-export for backward compat -- the old sseBus.emit() calls now use publishMessage
export const sseBus = {
  emit: publishMessage,
}

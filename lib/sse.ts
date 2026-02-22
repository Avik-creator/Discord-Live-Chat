/**
 * Redis-backed pub/sub for real-time message delivery across serverless functions.
 *
 * Uses Redis sorted sets (ZADD/ZRANGEBYSCORE) for reliable time-based message
 * retrieval. This is more efficient than plain lists because:
 * - Time-based queries are O(log N + M) instead of scanning all messages
 * - No race conditions with cleanup (ZREMRANGEBYSCORE is atomic)
 * - Messages are naturally ordered by timestamp
 *
 * Flow:
 * - `publishMessage(conversationId, data)` pushes an event into a Redis sorted set
 *   keyed by `bridgecord:chat:{conversationId}`, with the current timestamp as score.
 * - `pollMessages(conversationId, afterTimestamp)` retrieves all events with a score
 *   greater than `afterTimestamp`.
 * - Old entries are automatically pruned on each publish.
 */

import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const CHANNEL_PREFIX = "bridgecord:chat:"
const MESSAGE_TTL = 120 // Seconds to keep messages (2 minutes)

/**
 * Publish a message event to a conversation channel.
 * Uses a sorted set with timestamp as score for efficient time-based queries.
 */
export async function publishMessage(
  conversationId: string,
  data: Record<string, unknown>
) {
  const key = `${CHANNEL_PREFIX}${conversationId}`
  const ts = Date.now()
  const payload = JSON.stringify({ ...data, _ts: ts })

  // Add to sorted set with timestamp as score
  await redis.zadd(key, { score: ts, member: payload })

  // Trim messages older than TTL (best-effort cleanup)
  const cutoff = ts - MESSAGE_TTL * 1000
  await redis.zremrangebyscore(key, 0, cutoff)

  // Set key expiry so idle conversations auto-cleanup
  await redis.expire(key, MESSAGE_TTL)
}

/**
 * Poll for new messages from a conversation channel.
 * Returns all messages with a timestamp greater than `afterTimestamp`.
 * Uses ZRANGEBYSCORE for efficient range queries.
 */
export async function pollMessages(
  conversationId: string,
  afterTimestamp: number
): Promise<Record<string, unknown>[]> {
  const key = `${CHANNEL_PREFIX}${conversationId}`

  // Fetch all messages with score > afterTimestamp
  // Using (afterTimestamp means exclusive lower bound
  const raw = await redis.zremrangebyscore(key, afterTimestamp + 1, "+inf")

  const results: Record<string, unknown>[] = []

  for (const item of raw) {
    try {
      const parsed =
        typeof item === "string" ? JSON.parse(item) : (item as Record<string, unknown>)
      results.push(parsed)
    } catch {
      // skip malformed entries
    }
  }

  return results
}

// Backward-compat alias for older code that calls sseBus.emit()
export const sseBus = {
  emit: publishMessage,
}

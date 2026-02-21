import { pollMessages } from "@/lib/sse"

const POLL_INTERVAL_MS = 1500
const HEARTBEAT_INTERVAL_MS = 25000

export function createSSEStream(
  conversationId: string,
  signal: AbortSignal
): Response {
  const encoder = new TextEncoder()
  let lastTimestamp = Date.now()
  let alive = true

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      )

      const poll = async () => {
        while (alive) {
          try {
            const newMessages = await pollMessages(conversationId, lastTimestamp)
            for (const msg of newMessages) {
              const ts = (msg as { _ts?: number })._ts ?? Date.now()
              if (ts > lastTimestamp) lastTimestamp = ts
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
              )
            }
          } catch {
            // Redis poll failed, keep going
          }
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        }
      }

      poll()

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          alive = false
          clearInterval(heartbeat)
        }
      }, HEARTBEAT_INTERVAL_MS)

      signal.addEventListener("abort", () => {
        alive = false
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}

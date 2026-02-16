import { pollMessages } from "@/lib/sse"
import { db } from "@/lib/db"
import { conversations } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

export const maxDuration = 60 // Allow up to 60s on Vercel

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  const { projectId, id: conversationId } = await params

  // Verify conversation exists
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.projectId, projectId)
      )
    )

  if (!conversation) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()
  let lastTimestamp = Date.now()
  let alive = true

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      )

      // Poll Redis for new messages every 1.5 seconds
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

          // Wait 1.5 seconds before next poll
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }
      }

      poll()

      // Heartbeat every 25 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          alive = false
          clearInterval(heartbeat)
        }
      }, 25000)

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
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
      ...corsHeaders(),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}

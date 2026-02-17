import { auth } from "@/lib/auth"
import { pollMessages } from "@/lib/sse"
import { db } from "@/lib/db"
import { conversations, projects } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"

export const maxDuration = 60

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { id: projectId, conversationId } = await params

  // Verify project ownership
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))

  if (!project) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Verify conversation belongs to this project
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
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()
  let lastTimestamp = Date.now()
  let alive = true

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      )

      // Poll Redis for new messages every 800ms for near-real-time delivery
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

          await new Promise((resolve) => setTimeout(resolve, 800))
        }
      }

      poll()

      // Send heartbeat every 20 seconds to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          alive = false
          clearInterval(heartbeat)
        }
      }, 20000)

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
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}

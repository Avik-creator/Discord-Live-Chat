import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { conversations, messages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sseBus } from "@/lib/sse"

// This endpoint receives replies from Discord threads.
// In production, a Discord bot listens for MESSAGE_CREATE gateway events
// in threads and calls this endpoint to relay them to the widget.

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.DISCORD_BOT_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { threadId, content, authorName, authorAvatar } = body

  if (!threadId || !content) {
    return NextResponse.json({ error: "Missing threadId or content" }, { status: 400 })
  }

  // Find the conversation by its Discord thread ID
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.discordThreadId, threadId))
    .limit(1)

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  // Insert the message as an "agent" message
  const { nanoid } = await import("nanoid")
  const [msg] = await db
    .insert(messages)
    .values({
      id: nanoid(12),
      conversationId: conversation.id,
      sender: "agent",
      content,
    })
    .returning()

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date(), status: "active" })
    .where(eq(conversations.id, conversation.id))

  // Push SSE event to all connected clients for this conversation
  sseBus.emit(conversation.id, {
    type: "new_message",
    message: {
      id: msg.id,
      conversationId: conversation.id,
      sender: "agent",
      content,
      createdAt: new Date().toISOString(),
    },
  })

  return NextResponse.json({ success: true, message: msg })
}

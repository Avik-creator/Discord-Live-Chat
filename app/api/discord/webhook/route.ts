import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { conversations, messages, slackConfigs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sseBus } from "@/lib/sse"
import { sendSlackMessage } from "@/lib/slack"

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

  // Get Slack config to cross-post if connected
  const [slackConfig] = await db
    .select()
    .from(slackConfigs)
    .where(eq(slackConfigs.projectId, conversation.projectId))

  // Also send to Slack if this conversation has a Slack thread
  let slackMessageTs: string | null = null
  if (conversation.slackThreadTs && slackConfig?.channelId && slackConfig?.botToken) {
    try {
      const result = await sendSlackMessage(
        slackConfig.botToken,
        slackConfig.channelId,
        conversation.slackThreadTs,
        content,
        authorName || "Agent"
      )
      slackMessageTs = result.messageTs
    } catch (err) {
      console.error("[bridgecord] Failed to relay Discord reply to Slack:", err)
      // Continue - Slack failure shouldn't stop the flow
    }
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
      slackMessageTs,
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
      slackMessageTs,
      createdAt: new Date().toISOString(),
    },
  })

  return NextResponse.json({ success: true, message: msg })
}

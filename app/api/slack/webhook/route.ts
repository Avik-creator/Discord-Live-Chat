import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { conversations, messages, slackConfigs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sseBus } from "@/lib/sse"
import { verifySlackSignature } from "@/lib/slack"

/**
 * Webhook endpoint that receives events from Slack.
 * This handles:
 * 1. URL verification challenge (required for Event Subscriptions setup)
 * 2. Message events when agents reply in threads
 * 
 * Configure in Slack App Settings → Event Subscriptions:
 * Request URL: https://yourdomain.com/api/slack/webhook
 * Subscribe to bot events: message.channels
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const body = JSON.parse(rawBody)

  // Handle Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge })
  }

  // Verify request signature for security
  const signature = req.headers.get("x-slack-signature")
  const timestamp = req.headers.get("x-slack-request-timestamp")
  
  if (!signature || !timestamp || !verifySlackSignature(signature, timestamp, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // Handle event callbacks
  if (body.type === "event_callback") {
    const event = body.event

    // Only process thread replies (messages with thread_ts that's different from ts)
    if (
      event.type === "message" &&
      event.thread_ts &&
      event.ts !== event.thread_ts &&
      !event.bot_id // Ignore bot messages
    ) {
      await handleThreadReply(event)
    }
  }

  // Acknowledge the event immediately
  return NextResponse.json({ ok: true })
}

async function handleThreadReply(event: {
  channel: string
  thread_ts: string
  text: string
  user: string
  ts: string
}) {
  const { channel, thread_ts, text, user, ts } = event

  // Find the conversation by its Slack thread timestamp
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.slackThreadTs, thread_ts))
    .limit(1)

  if (!conversation) {
    // Not a conversation we're tracking
    return
  }

  // Get the Slack config to verify it's from the right workspace
  const [slackConfig] = await db
    .select()
    .from(slackConfigs)
    .where(eq(slackConfigs.projectId, conversation.projectId))

  if (!slackConfig || slackConfig.channelId !== channel) {
    // Channel mismatch
    return
  }

  // Don't process bot's own messages
  if (slackConfig.botUserId && user === slackConfig.botUserId) {
    return
  }

  // Check if we already have this message (deduplication)
  const existingMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.slackMessageTs, ts))

  if (existingMessages.length > 0) {
    return
  }

  // Insert the message as an "agent" message
  const { nanoid } = await import("nanoid")
  const [msg] = await db
    .insert(messages)
    .values({
      id: nanoid(12),
      conversationId: conversation.id,
      sender: "agent",
      content: text,
      slackMessageTs: ts,
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
      content: text,
      slackMessageTs: ts,
      createdAt: new Date().toISOString(),
    },
  })
}

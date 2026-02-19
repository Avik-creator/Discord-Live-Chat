import { db } from "@/lib/db"
import {
  conversations,
  messages,
  discordConfigs,
  projects,
} from "@/lib/db/schema"
import { and, eq, asc } from "drizzle-orm"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import {
  createThread,
  sendThreadMessage,
  getThreadMessages,
} from "@/lib/discord"
import { sseBus } from "@/lib/sse"
import { generateAIReply } from "@/lib/ai-reply"

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

/** GET: Fetch messages + sync from Discord */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  const { projectId, id: conversationId } = await params

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.projectId, projectId)
      )
    )

  if (!conversation) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders() }
    )
  }

  // Sync from Discord: fetch new agent replies from the thread
  if (conversation.discordThreadId) {
    try {
      // Get the last discord message ID we have
      const existingMsgs = await db
        .select({ discordMessageId: messages.discordMessageId })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.sender, "agent")
          )
        )
        .orderBy(asc(messages.createdAt))

      const lastDiscordId = existingMsgs
        .filter((m) => m.discordMessageId)
        .pop()?.discordMessageId

      const threadMsgs = await getThreadMessages(
        conversation.discordThreadId,
        lastDiscordId || undefined
      )

      // Insert new agent messages (from Discord users, not the bot)
      for (const msg of threadMsgs) {
        // Check if we already have this message
        const [exists] = await db
          .select({ id: messages.id })
          .from(messages)
          .where(eq(messages.discordMessageId, msg.id))

        if (!exists) {
          await db.insert(messages).values({
            id: nanoid(12),
            conversationId,
            sender: "agent",
            content: msg.content,
            discordMessageId: msg.id,
          })
        }
      }
    } catch {
      // Discord sync failed silently -- still return existing messages
    }
  }

  // Return all messages
  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  return NextResponse.json(allMessages, { headers: corsHeaders() })
}

/** POST: Visitor sends a message */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  const { projectId, id: conversationId } = await params
  const body = await req.json()
  const { content } = body

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Content required" },
      { status: 400, headers: corsHeaders() }
    )
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.projectId, projectId)
      )
    )

  if (!conversation) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders() }
    )
  }

  // Get Discord config for this project
  const [discordConfig] = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, projectId))

  const msgId = nanoid(12)
  let discordMessageId: string | null = null

  // Send to Discord
  if (discordConfig?.channelId) {
    try {
      if (!conversation.discordThreadId) {
        // First message: create a thread
        const visitorLabel =
          conversation.visitorName ||
          `Visitor ${conversation.visitorId.slice(0, 6)}`
        const result = await createThread(
          discordConfig.channelId,
          visitorLabel,
          content.trim()
        )

        // Update conversation with thread ID
        await db
          .update(conversations)
          .set({ discordThreadId: result.threadId, updatedAt: new Date() })
          .where(eq(conversations.id, conversationId))
      } else {
        // Subsequent message: post in existing thread
        const visitorLabel =
          conversation.visitorName ||
          `Visitor ${conversation.visitorId.slice(0, 6)}`
        const result = await sendThreadMessage(
          conversation.discordThreadId,
          content.trim(),
          visitorLabel
        )
        discordMessageId = result.messageId
      }
    } catch {
      // Discord send failed, but still save the message to DB
    }
  }

  // Save message to DB
  await db.insert(messages).values({
    id: msgId,
    conversationId,
    sender: "visitor",
    content: content.trim(),
    discordMessageId,
  })

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))

  // Push SSE event to all connected clients for this conversation
  sseBus.emit(conversationId, {
    type: "new_message",
    message: {
      id: msgId,
      conversationId,
      sender: "visitor",
      content: content.trim(),
      discordMessageId,
      createdAt: new Date().toISOString(),
    },
  })

  // Fire-and-forget: generate AI auto-reply if enabled
  // We don't await this so the visitor's message response is instant
  generateAIReply(conversationId, projectId).catch((err) =>
    console.error("[bridgecord] AI auto-reply error:", err)
  )

  return NextResponse.json({ id: msgId }, { status: 201, headers: corsHeaders() })
}

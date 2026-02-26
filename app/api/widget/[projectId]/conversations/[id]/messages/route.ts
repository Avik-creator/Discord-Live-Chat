import { corsHeaders } from "@/lib/api/cors"
import { db } from "@/lib/db"
import {
  conversations,
  messages,
  discordConfigs,
  slackConfigs,
} from "@/lib/db/schema"
import { and, eq, asc } from "drizzle-orm"
import { NextResponse, after } from "next/server"
import { nanoid } from "nanoid"
import {
  createThread,
  sendThreadMessage,
  getThreadMessages,
} from "@/lib/discord"
import {
  createSlackThread,
  sendSlackMessage,
  getSlackThreadMessages,
} from "@/lib/slack"
import { sseBus } from "@/lib/sse"
import { generateAIReply } from "@/lib/ai-reply"

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

/** GET: Fetch messages + sync from Discord and Slack */
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

  // Sync from Slack: fetch new agent replies from the thread
  if (conversation.slackThreadTs) {
    try {
      const [slackConfig] = await db
        .select()
        .from(slackConfigs)
        .where(eq(slackConfigs.projectId, projectId))

      if (slackConfig?.channelId && slackConfig.botUserId) {
        // Get the last slack message timestamp we have
        const existingMsgs = await db
          .select({ slackMessageTs: messages.slackMessageTs })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversationId),
              eq(messages.sender, "agent")
            )
          )
          .orderBy(asc(messages.createdAt))

        const lastSlackTs = existingMsgs
          .filter((m) => m.slackMessageTs)
          .pop()?.slackMessageTs

        const threadMsgs = await getSlackThreadMessages(
          slackConfig.botToken,
          slackConfig.channelId,
          conversation.slackThreadTs,
          slackConfig.botUserId,
          lastSlackTs || undefined
        )

        // Insert new agent messages
        for (const msg of threadMsgs) {
          // Check if we already have this message
          const [exists] = await db
            .select({ id: messages.id })
            .from(messages)
            .where(eq(messages.slackMessageTs, msg.ts))

          if (!exists) {
            await db.insert(messages).values({
              id: nanoid(12),
              conversationId,
              sender: "agent",
              content: msg.content,
              slackMessageTs: msg.ts,
            })
          }
        }
      }
    } catch {
      // Slack sync failed silently -- still return existing messages
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

  // Get platform configs for this project (fetch both in parallel)
  const [discordConfigResult, slackConfigResult] = await Promise.all([
    db.select().from(discordConfigs).where(eq(discordConfigs.projectId, projectId)),
    db.select().from(slackConfigs).where(eq(slackConfigs.projectId, projectId)),
  ])

  const discordConfig = discordConfigResult[0] ?? null
  const slackConfig = slackConfigResult[0] ?? null

  const msgId = nanoid(12)
  let discordMessageId: string | null = null
  let slackMessageTs: string | null = null
  const visitorLabel =
    conversation.visitorName ||
    `Visitor ${conversation.visitorId.slice(0, 6)}`

  // Track updates needed for conversation
  const conversationUpdates: Record<string, unknown> = { updatedAt: new Date() }

  // Send to Discord
  if (discordConfig?.channelId) {
    try {
      if (!conversation.discordThreadId) {
        // First message: create a thread
        const result = await createThread(
          discordConfig.channelId,
          visitorLabel,
          content.trim()
        )
        conversationUpdates.discordThreadId = result.threadId
      } else {
        // Subsequent message: post in existing thread
        const result = await sendThreadMessage(
          conversation.discordThreadId,
          content.trim(),
          visitorLabel
        )
        discordMessageId = result.messageId
      }
    } catch (err) {
      console.error("[bridgecord] Discord send failed:", err)
      // Discord send failed, but continue with other platforms
    }
  }

  // Send to Slack
  if (slackConfig?.channelId) {
    try {
      if (!conversation.slackThreadTs) {
        // First message: create a thread
        const result = await createSlackThread(
          slackConfig.botToken,
          slackConfig.channelId,
          visitorLabel,
          content.trim()
        )
        conversationUpdates.slackThreadTs = result.threadTs
      } else {
        // Subsequent message: post in existing thread
        const result = await sendSlackMessage(
          slackConfig.botToken,
          slackConfig.channelId,
          conversation.slackThreadTs,
          content.trim(),
          visitorLabel
        )
        slackMessageTs = result.messageTs
      }
    } catch (err) {
      console.error("[bridgecord] Slack send failed:", err instanceof Error ? err.message : err)
      // Slack send failed, but continue with response
    }
  }

  // Update conversation with any new thread IDs and timestamp
  await db
    .update(conversations)
    .set(conversationUpdates)
    .where(eq(conversations.id, conversationId))

  // Save message to DB
  await db.insert(messages).values({
    id: msgId,
    conversationId,
    sender: "visitor",
    content: content.trim(),
    discordMessageId,
    slackMessageTs,
  })

  // Push SSE event to all connected clients for this conversation
  sseBus.emit(conversationId, {
    type: "new_message",
    message: {
      id: msgId,
      conversationId,
      sender: "visitor",
      content: content.trim(),
      discordMessageId,
      slackMessageTs,
      createdAt: new Date().toISOString(),
    },
  })

  // Use after() to generate AI reply AFTER the response is sent
  // This keeps the serverless function alive until the AI reply completes,
  // unlike fire-and-forget which gets killed when the function terminates
  after(async () => {
    try {
      console.log("[bridgecord] Starting AI auto-reply for conversation:", conversationId)
      const aiMsgId = await generateAIReply(conversationId, projectId)
      if (aiMsgId) {
        console.log("[bridgecord] AI auto-reply sent:", aiMsgId)
      } else {
        console.log("[bridgecord] AI auto-reply skipped (disabled or empty)")
      }
    } catch (err) {
      console.error("[bridgecord] AI auto-reply error:", err)
    }
  })

  return NextResponse.json({ id: msgId }, { status: 201, headers: corsHeaders() })
}

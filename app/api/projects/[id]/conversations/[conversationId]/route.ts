import { requireAuth, requireProject } from "@/lib/api/auth"
import { badRequest } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { projects, conversations, messages, discordConfigs, slackConfigs } from "@/lib/db/schema"
import { and, eq, asc } from "drizzle-orm"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { sendThreadMessage } from "@/lib/discord"
import { sendSlackMessage } from "@/lib/slack"
import { sseBus } from "@/lib/sse"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id, conversationId } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.projectId, id)))
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  return NextResponse.json({ conversation, messages: msgs })
}

/** Dashboard agent reply -- also sends to Discord and Slack threads */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id, conversationId } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.projectId, id)))
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json()
  const { content } = body
  if (!content?.trim()) return badRequest("Content required")

  // Get platform configs for this project (fetch both in parallel)
  const [discordConfigResult, slackConfigResult] = await Promise.all([
    db.select().from(discordConfigs).where(eq(discordConfigs.projectId, id)),
    db.select().from(slackConfigs).where(eq(slackConfigs.projectId, id)),
  ])

  const discordConfig = discordConfigResult[0] ?? null
  const slackConfig = slackConfigResult[0] ?? null

  // Save to DB
  const msgId = nanoid(12)
  let discordMessageId: string | null = null
  let slackMessageTs: string | null = null
  const agentLabel = `Agent (${session.user.name || 'Support'})`

  // Send to Discord thread if one exists
  if (conversation.discordThreadId) {
    try {
      const result = await sendThreadMessage(
        conversation.discordThreadId,
        content.trim(),
        agentLabel
      )
      discordMessageId = result.messageId
    } catch {
      // Discord send failed, but we still save the message
    }
  }

  // Send to Slack thread if one exists
  if (conversation.slackThreadTs && slackConfig?.channelId && slackConfig?.botToken) {
    try {
      const result = await sendSlackMessage(
        slackConfig.botToken,
        slackConfig.channelId,
        conversation.slackThreadTs,
        content.trim(),
        agentLabel
      )
      slackMessageTs = result.messageTs
    } catch {
      // Slack send failed, but we still save the message
    }
  }

  await db.insert(messages).values({
    id: msgId,
    conversationId,
    sender: "agent",
    content: content.trim(),
    discordMessageId,
    slackMessageTs,
  })

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date(), status: "active" })
    .where(eq(conversations.id, conversationId))

  // Push SSE event so widget and other connected clients get real-time updates
  await sseBus.emit(conversationId, {
    type: "new_message",
    message: {
      id: msgId,
      conversationId,
      sender: "agent",
      content: content.trim(),
      discordMessageId,
      slackMessageTs,
      createdAt: new Date().toISOString(),
    },
  })

  return NextResponse.json({ id: msgId })
}

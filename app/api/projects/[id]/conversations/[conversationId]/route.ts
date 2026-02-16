import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, conversations, messages } from "@/lib/db/schema"
import { and, eq, asc } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { sendThreadMessage } from "@/lib/discord"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, conversationId } = await params

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

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

/** Dashboard agent reply -- also sends to Discord thread */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, conversationId } = await params
  const body = await req.json()
  const { content } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 })
  }

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.projectId, id)))

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Save to DB
  const msgId = nanoid(12)
  let discordMessageId: string | null = null

  // Also send to Discord thread if one exists
  if (conversation.discordThreadId) {
    try {
      const result = await sendThreadMessage(
        conversation.discordThreadId,
        content.trim(),
        `Agent (${session.user.name})`
      )
      discordMessageId = result.messageId
    } catch {
      // Discord send failed, but we still save the message
    }
  }

  await db.insert(messages).values({
    id: msgId,
    conversationId,
    sender: "agent",
    content: content.trim(),
    discordMessageId,
  })

  return NextResponse.json({ id: msgId })
}

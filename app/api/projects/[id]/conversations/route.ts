import { requireAuth, requireProject } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { conversations, messages } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project

  // Get conversations with last message
  const convos = await db
    .select({
      id: conversations.id,
      visitorId: conversations.visitorId,
      visitorName: conversations.visitorName,
      visitorEmail: conversations.visitorEmail,
      status: conversations.status,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: sql<number>`(SELECT COUNT(*) FROM messages WHERE messages.conversation_id = ${conversations.id})`,
      lastMessage: sql<string>`(SELECT content FROM messages WHERE messages.conversation_id = ${conversations.id} ORDER BY created_at DESC LIMIT 1)`,
    })
    .from(conversations)
    .where(eq(conversations.projectId, id))
    .orderBy(desc(conversations.updatedAt))

  return NextResponse.json(convos)
}

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, conversations, messages } from "@/lib/db/schema"
import { and, eq, desc, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

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

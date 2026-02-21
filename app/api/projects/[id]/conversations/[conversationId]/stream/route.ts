import { requireAuth, requireProject } from "@/lib/api/auth"
import { createSSEStream } from "@/lib/api/sse-stream"
import { db } from "@/lib/db"
import { conversations } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id: projectId, conversationId } = await params
  const project = await requireProject(projectId, session.user.id)
  if (project instanceof NextResponse) return project
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
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }
  return createSSEStream(conversationId, req.signal)
}

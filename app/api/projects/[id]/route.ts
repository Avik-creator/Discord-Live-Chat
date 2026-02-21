import { requireAuth, requireProject } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { projects, widgetConfigs, discordConfigs, conversations, messages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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
  return NextResponse.json(project)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project

  // Cascade delete: messages -> conversations -> widget_configs -> discord_configs -> project
  const projectConversations = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.projectId, id))

  for (const conv of projectConversations) {
    await db.delete(messages).where(eq(messages.conversationId, conv.id))
  }

  await db.delete(conversations).where(eq(conversations.projectId, id))
  await db.delete(widgetConfigs).where(eq(widgetConfigs.projectId, id))
  await db.delete(discordConfigs).where(eq(discordConfigs.projectId, id))
  await db.delete(projects).where(eq(projects.id, id))

  return NextResponse.json({ success: true })
}

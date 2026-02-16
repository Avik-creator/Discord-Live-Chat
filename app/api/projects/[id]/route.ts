import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, widgetConfigs, discordConfigs, conversations, messages } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(project)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

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

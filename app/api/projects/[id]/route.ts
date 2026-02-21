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

  // FK constraints have ON DELETE CASCADE, so deleting the project
  // automatically removes all related conversations, messages,
  // widget_configs, and discord_configs.
  await db.delete(projects).where(eq(projects.id, id))

  return NextResponse.json({ success: true })
}

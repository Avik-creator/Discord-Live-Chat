import { requireAuth, requireProject } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { projects, widgetConfigs, discordConfigs, slackConfigs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

/** GET: Fetch project settings (widget + discord config) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project

  const [widget = null] = await db
    .select()
    .from(widgetConfigs)
    .where(eq(widgetConfigs.projectId, id))

  const [discordRow] = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, id))

  const discord = discordRow
    ? {
        guildId: discordRow.guildId,
        guildName: discordRow.guildName,
        channelId: discordRow.channelId ?? null,
        channelName: discordRow.channelName ?? null,
      }
    : null

  const [slackRow] = await db
    .select()
    .from(slackConfigs)
    .where(eq(slackConfigs.projectId, id))

  const slack = slackRow
    ? {
        workspaceId: slackRow.workspaceId,
        workspaceName: slackRow.workspaceName,
        channelId: slackRow.channelId ?? null,
        channelName: slackRow.channelName ?? null,
      }
    : null

  return NextResponse.json({ project, widget: widget || null, discord, slack })
}

/** PUT: Update project settings */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project
  const body = await req.json()

  // Update project name/domain
  if (body.name || body.domain !== undefined) {
    await db
      .update(projects)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.domain !== undefined && { domain: body.domain }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
  }

  // Update widget config
  if (body.widget) {
    const widgetUpdate: Record<string, unknown> = {}
    if (body.widget.primaryColor) widgetUpdate.primaryColor = body.widget.primaryColor
    if (body.widget.position) widgetUpdate.position = body.widget.position
    if (body.widget.welcomeMessage !== undefined) widgetUpdate.welcomeMessage = body.widget.welcomeMessage
    if (body.widget.offlineMessage !== undefined) widgetUpdate.offlineMessage = body.widget.offlineMessage

    if (body.widget.bubbleShape) widgetUpdate.bubbleShape = body.widget.bubbleShape
    if (body.widget.aiEnabled !== undefined) widgetUpdate.aiEnabled = body.widget.aiEnabled
    if (body.widget.aiSystemPrompt !== undefined) widgetUpdate.aiSystemPrompt = body.widget.aiSystemPrompt
    if (body.widget.aiModel) widgetUpdate.aiModel = body.widget.aiModel

    await db.update(widgetConfigs).set(widgetUpdate).where(eq(widgetConfigs.projectId, id))
  }

  // Update discord channel selection
  if (body.discord?.channelId) {
    await db
      .update(discordConfigs)
      .set({
        channelId: body.discord.channelId,
        channelName: body.discord.channelName || null,
      })
      .where(eq(discordConfigs.projectId, id))
  }

  // Update slack channel selection
  if (body.slack?.channelId) {
    await db
      .update(slackConfigs)
      .set({
        channelId: body.slack.channelId,
        channelName: body.slack.channelName || null,
      })
      .where(eq(slackConfigs.projectId, id))
  }

  return NextResponse.json({ success: true })
}

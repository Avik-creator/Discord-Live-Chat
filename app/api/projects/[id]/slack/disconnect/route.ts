import { requireAuth, requireProject } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { conversations, slackConfigs } from "@/lib/db/schema"
import { eq, isNotNull, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { deleteSlackThread } from "@/lib/slack"

/**
 * DELETE /api/projects/[id]/slack/disconnect
 * Disconnect Slack: delete all Slack threads, clear conversation refs, remove config.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project

  // Get the slack config
  const [slackConfig] = await db
    .select()
    .from(slackConfigs)
    .where(eq(slackConfigs.projectId, id))

  if (!slackConfig) {
    return NextResponse.json({ error: "Slack not connected" }, { status: 400 })
  }

  // Find all conversations with Slack threads for this project
  const convosWithThreads = await db
    .select({ id: conversations.id, slackThreadTs: conversations.slackThreadTs })
    .from(conversations)
    .where(
      and(
        eq(conversations.projectId, id),
        isNotNull(conversations.slackThreadTs)
      )
    )

  // Delete each Slack thread (best-effort, in parallel)
  if (slackConfig.channelId) {
    await Promise.allSettled(
      convosWithThreads
        .filter((c) => c.slackThreadTs)
        .map((c) =>
          deleteSlackThread(
            slackConfig.botToken,
            slackConfig.channelId!,
            c.slackThreadTs!
          )
        )
    )
  }

  // Clear the slackThreadTs from all conversations
  await db
    .update(conversations)
    .set({ slackThreadTs: null })
    .where(eq(conversations.projectId, id))

  // Delete the slack config
  await db
    .delete(slackConfigs)
    .where(eq(slackConfigs.projectId, id))

  return NextResponse.json({ success: true })
}

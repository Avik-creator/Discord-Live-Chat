import { requireAuth, requireProject } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { conversations, discordConfigs } from "@/lib/db/schema"
import { eq, isNotNull, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { deleteDiscordThread, leaveGuild } from "@/lib/discord"

/**
 * DELETE /api/projects/[id]/discord/disconnect
 * Disconnect Discord: delete all Discord threads, clear conversation refs, remove config.
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

  // Get the discord config
  const [discordConfig] = await db
    .select()
    .from(discordConfigs)
    .where(eq(discordConfigs.projectId, id))

  if (!discordConfig) {
    return NextResponse.json({ error: "Discord not connected" }, { status: 400 })
  }

  // Make the bot leave the guild
  if (discordConfig.guildId) {
    await leaveGuild(discordConfig.guildId)
  }

  // Find all conversations with Discord threads for this project
  const convosWithThreads = await db
    .select({ id: conversations.id, discordThreadId: conversations.discordThreadId })
    .from(conversations)
    .where(
      and(
        eq(conversations.projectId, id),
        isNotNull(conversations.discordThreadId)
      )
    )

  // Delete each Discord thread (best-effort, in parallel)
  await Promise.allSettled(
    convosWithThreads
      .filter((c) => c.discordThreadId)
      .map((c) => deleteDiscordThread(c.discordThreadId!))
  )

  // Clear the discordThreadId from all conversations
  await db
    .update(conversations)
    .set({ discordThreadId: null })
    .where(eq(conversations.projectId, id))

  // Delete the discord config
  await db
    .delete(discordConfigs)
    .where(eq(discordConfigs.projectId, id))

  return NextResponse.json({ success: true })
}

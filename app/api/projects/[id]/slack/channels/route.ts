import { requireAuth, requireProject } from "@/lib/api/auth"
import { badRequest, serverError } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { slackConfigs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getWorkspaceChannels } from "@/lib/slack"

/**
 * Get list of channels in the connected Slack workspace
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project

  const [slackConfig] = await db
    .select()
    .from(slackConfigs)
    .where(eq(slackConfigs.projectId, id))

  if (!slackConfig) return badRequest("Slack not connected")

  try {
    const channels = await getWorkspaceChannels(slackConfig.botToken)
    return NextResponse.json(channels)
  } catch (err) {
    console.error("[slack] Failed to fetch channels:", err)
    return serverError("Failed to fetch channels")
  }
}

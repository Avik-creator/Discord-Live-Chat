import { requireAuth, requireProject } from "@/lib/api/auth"
import { NextResponse } from "next/server"
import { getSlackInstallUrl } from "@/lib/slack"

/**
 * Generate Slack app installation URL for a project
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")
  if (!base) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not set" },
      { status: 500 }
    )
  }
  
  const redirectUri = `${base}/api/slack/callback`
  const url = getSlackInstallUrl(id, redirectUri)
  return NextResponse.json({ url })
}

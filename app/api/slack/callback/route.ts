import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, slackConfigs } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { exchangeCodeForToken } from "@/lib/slack"

/**
 * Slack OAuth callback for app installation.
 * Register this URL in Slack App Settings → OAuth & Permissions → Redirect URLs:
 * https://yourdomain.com/api/slack/callback
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const code = req.nextUrl.searchParams.get("code")
  const projectId = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  // Handle user denial
  if (error) {
    const fallback = projectId
      ? `/dashboard/projects/${projectId}/settings?error=slack_denied`
      : "/dashboard"
    return NextResponse.redirect(new URL(fallback, req.url))
  }

  if (!code || !projectId) {
    const fallback = projectId
      ? `/dashboard/projects/${projectId}/settings?error=no_code`
      : "/dashboard"
    return NextResponse.redirect(new URL(fallback, req.url))
  }

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))

  if (!project) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Exchange code for token
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`
  const tokenData = await exchangeCodeForToken(code, redirectUri)

  if (!tokenData) {
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectId}/settings?error=slack_auth_failed`, req.url)
    )
  }

  // Check if config already exists
  const existing = await db
    .select()
    .from(slackConfigs)
    .where(eq(slackConfigs.projectId, projectId))

  if (existing.length > 0) {
    // Update existing config
    await db
      .update(slackConfigs)
      .set({
        workspaceId: tokenData.team.id,
        workspaceName: tokenData.team.name,
        botToken: tokenData.access_token,
        botUserId: tokenData.bot_user_id,
        // Clear channel selection when workspace changes
        channelId: null,
        channelName: null,
      })
      .where(eq(slackConfigs.projectId, projectId))
  } else {
    // Create new config
    await db.insert(slackConfigs).values({
      id: nanoid(12),
      projectId,
      workspaceId: tokenData.team.id,
      workspaceName: tokenData.team.name,
      botToken: tokenData.access_token,
      botUserId: tokenData.bot_user_id,
    })
  }

  return NextResponse.redirect(
    new URL(`/dashboard/projects/${projectId}/settings?slack=connected`, req.url)
  )
}

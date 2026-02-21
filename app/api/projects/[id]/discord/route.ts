import { requireAuth, requireProject } from "@/lib/api/auth"
import { NextResponse } from "next/server"
import { getBotInviteUrl } from "@/lib/discord"

/**
 * GET: Generate the Discord bot invite URL (with redirect so we auto-save the server).
 * Redirect URI must match exactly what you added in Discord Developer Portal → OAuth2 → Redirects
 * (e.g. http://localhost:3000/api/discord/callback — no trailing slash, http for localhost).
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
  const redirectUri = `${base}/api/discord/callback`
  const url = getBotInviteUrl(id, redirectUri, id)
  return NextResponse.json({ url })
}

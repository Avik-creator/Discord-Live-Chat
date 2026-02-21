import { requireAuth, requireProject } from "@/lib/api/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getBotInviteUrl } from "@/lib/discord"

/** GET: Generate the Discord bot invite URL (with redirect so we auto-save the server) */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project
  const origin = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("x-forwarded-host")}`
    : new URL(req.url).origin
  const redirectUri = `${origin}/api/discord/callback`
  const url = getBotInviteUrl(id, redirectUri, id)
  return NextResponse.json({ url })
}

import { requireAuth, requireProject } from "@/lib/api/auth"
import { badRequest } from "@/lib/api/errors"
import { crawlSite, getCrawlMeta } from "@/lib/crawler"
import { NextResponse } from "next/server"

/** POST: Trigger a site crawl for a project */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project
  if (!project.domain) {
    return badRequest(
      "No domain configured. Add a domain in project settings first."
    )
  }
  const result = await crawlSite(id, project.domain)
  return NextResponse.json(result)
}

/** GET: Get cached crawl metadata */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const project = await requireProject(id, session.user.id)
  if (project instanceof NextResponse) return project
  const meta = await getCrawlMeta(id)
  return NextResponse.json(meta || { pages: [], totalChars: 0, crawledAt: null })
}

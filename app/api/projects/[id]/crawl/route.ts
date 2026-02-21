import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { crawlSite, getCrawlMeta } from "@/lib/crawler"

/** POST: Trigger a site crawl for a project */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!project.domain) {
    return NextResponse.json(
      { error: "No domain configured. Add a domain in project settings first." },
      { status: 400 }
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const meta = await getCrawlMeta(id)
  return NextResponse.json(meta || { pages: [], totalChars: 0, crawledAt: null })
}

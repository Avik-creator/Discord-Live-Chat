import { corsHeaders } from "@/lib/api/cors"
import { db } from "@/lib/db"
import { conversations, projects } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

/** POST: Create or get existing conversation for a visitor */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const body = await req.json()
  const { visitorId, visitorName, visitorEmail } = body

  if (!visitorId) {
    return NextResponse.json(
      { error: "visitorId required" },
      { status: 400, headers: corsHeaders() }
    )
  }
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404, headers: corsHeaders() }
    )
  }

  // Check for existing conversation
  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.projectId, projectId),
        eq(conversations.visitorId, visitorId)
      )
    )

  if (existing) {
    return NextResponse.json({ conversationId: existing.id }, { headers: corsHeaders() })
  }

  // Create new conversation
  const conversationId = nanoid(12)
  await db.insert(conversations).values({
    id: conversationId,
    projectId,
    visitorId,
    visitorName: visitorName || null,
    visitorEmail: visitorEmail || null,
  })

  return NextResponse.json({ conversationId }, { status: 201, headers: corsHeaders() })
}

import { requireAuth } from "@/lib/api/auth"
import { badRequest } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { projects, widgetConfigs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(projects.createdAt)

  return NextResponse.json(userProjects)
}

export async function POST(req: Request) {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session

  const body = await req.json()
  const { name, domain } = body

  if (!name || typeof name !== "string") return badRequest("Name is required")
  if (!domain || typeof domain !== "string" || !domain.trim())
    return badRequest("Domain is required")

  const projectId = nanoid(12)
  const widgetConfigId = nanoid(12)

  await db.insert(projects).values({
    id: projectId,
    userId: session.user.id,
    name,
    domain: domain.trim(),
  })

  await db.insert(widgetConfigs).values({
    id: widgetConfigId,
    projectId,
  })

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))

  return NextResponse.json(project, { status: 201 })
}

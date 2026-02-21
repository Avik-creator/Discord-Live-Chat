import { requireAuth } from "@/lib/api/auth"
import { badRequest } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { projects, widgetConfigs } from "@/lib/db/schema"
import {
  createProjectSchema,
  normalizeProjectDomain,
} from "@/lib/validations/project"
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>
  const name = typeof raw.name === "string" ? raw.name.trim() : ""
  const domainInput =
    typeof raw.domain === "string" ? raw.domain.trim() : ""
  const parsed = createProjectSchema.safeParse({
    name,
    domain: domainInput ? normalizeProjectDomain(domainInput) : "",
  })

  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return badRequest(first?.message ?? "Invalid request")
  }

  const domain = parsed.data.domain.replace(/^https?:\/\//i, "").trim()
  const projectId = nanoid(12)
  const widgetConfigId = nanoid(12)

  await db.insert(projects).values({
    id: projectId,
    userId: session.user.id,
    name: parsed.data.name,
    domain,
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

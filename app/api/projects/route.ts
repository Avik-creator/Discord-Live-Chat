import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, widgetConfigs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(projects.createdAt)

  return NextResponse.json(userProjects)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, domain } = body

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  if (!domain || typeof domain !== "string" || !domain.trim()) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 })
  }

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

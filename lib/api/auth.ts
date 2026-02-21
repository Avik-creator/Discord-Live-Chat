import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects } from "@/lib/db/schema"
import type { InferSelectModel } from "drizzle-orm"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import type { NextResponse } from "next/server"
import { unauthorized } from "./errors"
import { notFound } from "./errors"

export type Session = Awaited<ReturnType<typeof auth.api.getSession>> extends infer R
  ? R extends { user: unknown } ? R : never
  : never

export type Project = InferSelectModel<typeof projects>

export async function requireAuth(): Promise<NonNullable<Session> | NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return unauthorized()
  return session
}

export async function requireProject(
  projectId: string,
  userId: string
): Promise<Project | NextResponse> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  if (!project) return notFound()
  return project
}

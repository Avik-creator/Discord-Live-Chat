import { db } from "@/lib/db"
import { widgetConfigs, projects } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  const [project] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, projectId))

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404, headers: corsHeaders() }
    )
  }

  const [widget] = await db
    .select()
    .from(widgetConfigs)
    .where(eq(widgetConfigs.projectId, projectId))

  return NextResponse.json(
    {
      projectName: project.name,
      primaryColor: widget?.primaryColor || "#5865F2",
      position: widget?.position || "bottom-right",
      welcomeMessage: widget?.welcomeMessage || "Hi! How can we help?",
      offlineMessage: widget?.offlineMessage || "We'll get back to you soon.",
    },
    { headers: corsHeaders() }
  )
}

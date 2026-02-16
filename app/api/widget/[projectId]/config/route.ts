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

  let widget: Record<string, unknown> | null = null
  try {
    const [w] = await db.select().from(widgetConfigs).where(eq(widgetConfigs.projectId, projectId))
    widget = w || null
  } catch {
    // bubble_shape column may not exist yet
    const [w] = await db
      .select({
        primaryColor: widgetConfigs.primaryColor,
        position: widgetConfigs.position,
        welcomeMessage: widgetConfigs.welcomeMessage,
        offlineMessage: widgetConfigs.offlineMessage,
      })
      .from(widgetConfigs)
      .where(eq(widgetConfigs.projectId, projectId))
    widget = w ? { ...w, bubbleShape: "rounded" } : null
  }

  return NextResponse.json(
    {
      projectName: project.name,
      primaryColor: (widget?.primaryColor as string) || "#5865F2",
      position: (widget?.position as string) || "bottom-right",
      welcomeMessage: (widget?.welcomeMessage as string) || "Hi! How can we help?",
      offlineMessage: (widget?.offlineMessage as string) || "We'll get back to you soon.",
      bubbleShape: (widget?.bubbleShape as string) || "rounded",
    },
    { headers: corsHeaders() }
  )
}

import { corsHeadersStream } from "@/lib/api/cors"
import { createSSEStream } from "@/lib/api/sse-stream"
import { db } from "@/lib/db"
import { conversations } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeadersStream() })
}

export const maxDuration = 60

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  const { projectId, id: conversationId } = await params
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.projectId, projectId)
      )
    )
  if (!conversation) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { ...corsHeadersStream(), "Content-Type": "application/json" } }
    )
  }
  const response = createSSEStream(conversationId, req.signal)
  return new Response(response.body, {
    status: response.status,
    headers: { ...response.headers, ...corsHeadersStream() },
  })
}

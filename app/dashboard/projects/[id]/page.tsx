import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, conversations, messages } from "@/lib/db/schema"
import { and, eq, desc, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { ConversationsList } from "./_components/conversations-list"

export default async function ProjectInboxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const { id } = await params

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

  if (!project) notFound()

  // Fetch conversations with message count and last message
  const convos = await db
    .select({
      id: conversations.id,
      visitorName: conversations.visitorName,
      visitorId: conversations.visitorId,
      status: conversations.status,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.projectId, id))
    .orderBy(desc(conversations.updatedAt))

  // Enrich with message count and last message
  const enriched = await Promise.all(
    convos.map(async (conv) => {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(eq(messages.conversationId, conv.id))

      const [lastMsg] = await db
        .select({ content: messages.content })
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1)

      return {
        ...conv,
        updatedAt: conv.updatedAt.toISOString(),
        messageCount: Number(countResult?.count ?? 0),
        lastMessage: lastMsg?.content ?? null,
      }
    })
  )

  return <ConversationsList projectId={id} initialConversations={enriched} />
}

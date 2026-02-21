import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, conversations, messages } from "@/lib/db/schema"
import { and, eq, desc, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { ConversationsList } from "./_components/conversations-list"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, User, ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function ProjectInboxPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: convos, isLoading } = useQuery({
    queryKey: ["conversations", id],
    queryFn: () =>
      fetch(`/api/projects/${id}/conversations`).then((r) => r.json()),
    refetchInterval: 5000,
  })

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

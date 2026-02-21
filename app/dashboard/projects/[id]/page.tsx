"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { ConversationsList } from "./_components/conversations-list"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"

export default function ProjectInboxPage() {
  const { id } = useParams<{ id: string }>()
  const { data: convos, isLoading } = useQuery({
    queryKey: ["conversations", id],
    queryFn: () =>
      fetch(`/api/projects/${id}/conversations`).then((r) => r.json()),
    refetchInterval: 5000,
  })

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="mt-2 h-24 w-full" />
        <Skeleton className="mt-2 h-24 w-full" />
      </Card>
    )
  }

  return (
    <ConversationsList
      projectId={id ?? ""}
      initialConversations={convos ?? []}
    />
  )
}

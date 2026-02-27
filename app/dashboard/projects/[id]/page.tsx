"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { ConversationsList } from "./_components/conversations-list"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"

function ConversationsListSkeleton() {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-border p-4">
            <Skeleton className="h-8 w-8 shrink-0 rounded-none" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-full max-w-[300px]" />
            </div>
            <div className="shrink-0 space-y-1 text-right">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function ProjectInboxPage() {
  const { id } = useParams<{ id: string }>()
  const { data: convos, isLoading } = useQuery({
    queryKey: ["conversations", id],
    queryFn: () =>
      fetch(`/api/projects/${id}/conversations`).then((r) => r.json()),
    refetchInterval: 5000,
  })

  if (isLoading) {
    return <ConversationsListSkeleton />
  }

  return (
    <ConversationsList
      projectId={id ?? ""}
      initialConversations={convos ?? []}
    />
  )
}

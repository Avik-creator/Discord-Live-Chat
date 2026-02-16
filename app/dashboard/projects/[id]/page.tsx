"use client"

import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProjectInboxPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: convos, isLoading } = useSWR(
    `/api/projects/${id}/conversations`,
    fetcher,
    { refreshInterval: 5000 }
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!convos?.length) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          No conversations yet
        </h2>
        <p className="text-sm text-muted-foreground">
          Install the widget on your site to start receiving messages.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {convos.map(
        (conv: {
          id: string
          visitorName: string | null
          visitorId: string
          status: string
          messageCount: number
          lastMessage: string | null
          updatedAt: string
        }) => (
          <Card
            key={conv.id}
            className="cursor-pointer px-4 py-3 transition-colors hover:border-primary/50"
            onClick={() =>
              router.push(
                `/dashboard/projects/${id}/conversations/${conv.id}`
              )
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {conv.visitorName || `Visitor ${conv.visitorId.slice(0, 6)}`}
                    </p>
                    <Badge
                      variant={conv.status === "open" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {conv.status}
                    </Badge>
                  </div>
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conv.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {conv.messageCount} msg{conv.messageCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </Card>
        )
      )}
    </div>
  )
}

"use client"

import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, User, ArrowRight } from "lucide-react"
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
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-18" />
        ))}
      </div>
    )
  }

  if (!convos?.length) {
    return (
      <Card className="flex flex-col items-center justify-center border-dashed py-20">
        <div className="flex h-12 w-12 items-center justify-center bg-accent">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-sm font-semibold text-foreground">
          No conversations yet
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Install the widget on your site to start receiving messages.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-1 stagger-children">
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
          <div
            key={conv.id}
            className="group flex cursor-pointer items-start gap-3 border-b border-border px-3 py-3 transition-all duration-200 hover:bg-accent/50 hover:pl-4"
            onClick={() =>
              router.push(
                `/dashboard/projects/${id}/conversations/${conv.id}`
              )
            }
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-accent">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-medium text-foreground">
                  {conv.visitorName ||
                    `Visitor ${conv.visitorId.slice(0, 6)}`}
                </p>
                <Badge
                  variant={conv.status === "open" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {conv.status}
                </Badge>
              </div>
              {conv.lastMessage && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {conv.lastMessage}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(conv.updatedAt), {
                  addSuffix: true,
                })}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {conv.messageCount} msg{conv.messageCount !== 1 ? "s" : ""}
              </p>
            </div>
            <ArrowRight className="mt-1.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )
      )}
    </div>
  )
}

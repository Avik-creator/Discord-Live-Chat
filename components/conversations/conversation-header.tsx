"use client"

import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

type ConversationHeaderProps = {
  visitorName: string | null
  visitorId: string
  visitorEmail: string | null
  status: string
}

export function ConversationHeader({
  visitorName,
  visitorId,
  visitorEmail,
  status,
}: ConversationHeaderProps) {
  const displayName =
    visitorName || `Visitor ${visitorId?.slice(0, 6) ?? ""}`

  return (
    <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
      <div className="flex h-9 w-9 items-center justify-center bg-accent">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-foreground">
            {displayName}
          </h2>
          <Badge
            variant={status === "open" ? "default" : "secondary"}
            className="text-[10px]"
          >
            {status}
          </Badge>
        </div>
        {visitorEmail && (
          <p className="text-[10px] text-muted-foreground">
            {visitorEmail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500"
          style={{ borderRadius: "50%" }}
        />
        <span className="text-[10px] text-muted-foreground">Live</span>
      </div>
    </div>
  )
}

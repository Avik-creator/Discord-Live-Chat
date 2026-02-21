"use client"

import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { User, Headphones } from "lucide-react"
import type { MessageData } from "@/hooks/use-conversations"
import { MarkdownContent } from "@/components/ui/markdown-content"

type MessageBubbleProps = {
  message: MessageData
  shouldAnimate: boolean
  onAnimationEnd: () => void
}

export function MessageBubble({
  message,
  shouldAnimate,
  onAnimationEnd,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-2.5",
        message.sender === "agent" ? "flex-row-reverse" : "",
        shouldAnimate ? "animate-slide-in-bottom" : ""
      )}
      onAnimationEnd={onAnimationEnd}
    >
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center",
          message.sender === "agent" ? "bg-foreground" : "bg-accent"
        )}
      >
        {message.sender === "agent" ? (
          <Headphones className="h-3 w-3 text-background" />
        ) : (
          <User className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[70%] px-3 py-2",
          message.sender === "agent"
            ? "bg-foreground text-background"
            : "bg-accent text-foreground"
        )}
      >
        {message.sender === "agent" ? (
          <MarkdownContent content={message.content} className="text-xs" />
        ) : (
          <p className="text-xs whitespace-pre-wrap">{message.content}</p>
        )}
        <p
          className={cn(
            "mt-1 text-[10px]",
            message.sender === "agent"
              ? "text-background/60"
              : "text-muted-foreground"
          )}
        >
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  )
}

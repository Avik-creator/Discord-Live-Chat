"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import type { MessageData } from "@/hooks/use-conversations"

type MessageListProps = {
  messages: MessageData[]
  animateIds: Set<string>
  clearAnimateId: (id: string) => void
}

export function MessageList({
  messages,
  animateIds,
  clearAnimateId,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  return (
    <ScrollArea className="h-[55vh] border border-border bg-card p-4">
      <div className="space-y-3">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            shouldAnimate={animateIds.has(msg.id)}
            onAnimationEnd={() => clearAnimateId(msg.id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}

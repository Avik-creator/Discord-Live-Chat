"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, User, Headphones, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ConversationPage() {
  const { id, conversationId } = useParams<{
    id: string
    conversationId: string
  }>()
  const { data, isLoading, mutate } = useSWR(
    `/api/projects/${id}/conversations/${conversationId}`,
    fetcher,
    { refreshInterval: 3000 }
  )
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [data?.messages])

  const handleSend = async () => {
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(
        `/api/projects/${id}/conversations/${conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: reply.trim() }),
        }
      )
      if (!res.ok) throw new Error()
      setReply("")
      await mutate()
    } catch {
      toast.error("Failed to send reply")
    } finally {
      setSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const conversation = data?.conversation
  const msgs = data?.messages ?? []

  return (
    <div className="flex flex-col">
      <Link
        href={`/dashboard/projects/${id}`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to conversations
      </Link>

      {/* Conversation header */}
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-9 w-9 items-center justify-center bg-accent">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-foreground">
              {conversation?.visitorName ||
                `Visitor ${conversation?.visitorId?.slice(0, 6) ?? ""}`}
            </h2>
            <Badge
              variant={
                conversation?.status === "open" ? "default" : "secondary"
              }
              className="text-[10px]"
            >
              {conversation?.status}
            </Badge>
          </div>
          {conversation?.visitorEmail && (
            <p className="text-[10px] text-muted-foreground">
              {conversation.visitorEmail}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="h-[55vh] border border-border bg-card p-4">
        <div className="space-y-3">
          {msgs.map(
            (msg: {
              id: string
              sender: string
              content: string
              createdAt: string
            }, index: number) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5 animate-slide-in-bottom",
                  msg.sender === "agent" ? "flex-row-reverse" : ""
                )}
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center",
                    msg.sender === "agent"
                      ? "bg-foreground"
                      : "bg-accent"
                  )}
                >
                  {msg.sender === "agent" ? (
                    <Headphones className="h-3 w-3 text-background" />
                  ) : (
                    <User className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[70%] px-3 py-2",
                    msg.sender === "agent"
                      ? "bg-foreground text-background"
                      : "bg-accent text-foreground"
                  )}
                >
                  <p className="text-xs">{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      msg.sender === "agent"
                        ? "text-background/60"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply input */}
      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Type a reply... (also sends to Discord)"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={sending}
          className="text-xs"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || !reply.trim()}
          className="shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="sr-only">Send reply</span>
        </Button>
      </div>
    </div>
  )
}

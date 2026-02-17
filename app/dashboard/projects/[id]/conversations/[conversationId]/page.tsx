"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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

interface MessageData {
  id: string
  sender: string
  content: string
  createdAt: string
}

export default function ConversationPage() {
  const { id, conversationId } = useParams<{
    id: string
    conversationId: string
  }>()
  const queryClient = useQueryClient()
  const [reply, setReply] = useState("")
  const [sseMessages, setSseMessages] = useState<MessageData[]>([])
  const [animateIds, setAnimateIds] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", id, conversationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${id}/conversations/${conversationId}`
      )
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(
        `/api/projects/${id}/conversations/${conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      )
      if (!res.ok) throw new Error("Failed to send")
      return res.json()
    },
    onSuccess: () => {
      setReply("")
      queryClient.invalidateQueries({
        queryKey: ["conversation", id, conversationId],
      })
    },
    onError: () => toast.error("Failed to send reply"),
  })

  // SSE with auto-reconnection
  useEffect(() => {
    if (!conversationId || !id) return

    let alive = true
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (!alive) return
      const eventSource = new EventSource(
        `/api/projects/${id}/conversations/${conversationId}/stream`
      )
      sseRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data)
          if (eventData.type === "new_message" && eventData.message) {
            setSseMessages((prev) => {
              if (prev.some((m) => m.id === eventData.message.id)) return prev
              return [...prev, eventData.message]
            })
            setAnimateIds((prev) => new Set(prev).add(eventData.message.id))
          }
        } catch {
          // silent
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        sseRef.current = null
        if (alive) {
          reconnectTimer = setTimeout(connect, 1000)
        }
      }
    }

    connect()

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", id, conversationId],
      })
    }, 4000)

    return () => {
      alive = false
      if (reconnectTimer) clearTimeout(reconnectTimer)
      sseRef.current?.close()
      sseRef.current = null
      clearInterval(pollInterval)
    }
  }, [conversationId, id, queryClient])

  // Merge API data with SSE messages
  const baseMessages: MessageData[] = data?.messages ?? []
  const mergedMessages = [...baseMessages]
  for (const sseMsg of sseMessages) {
    if (!mergedMessages.some((m) => m.id === sseMsg.id)) {
      mergedMessages.push(sseMsg)
    }
  }
  mergedMessages.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mergedMessages.length])

  const handleSend = () => {
    if (!reply.trim() || sendMutation.isPending) return
    sendMutation.mutate(reply.trim())
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

  return (
    <div className="flex flex-col">
      <Link
        href={`/dashboard/projects/${id}`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to conversations
      </Link>

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
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 animate-pulse bg-emerald-500"
            style={{ borderRadius: "50%" }}
          />
          <span className="text-[10px] text-muted-foreground">Live</span>
        </div>
      </div>

      <ScrollArea className="h-[55vh] border border-border bg-card p-4">
        <div className="space-y-3">
          {mergedMessages.map((msg) => {
            const shouldAnimate = animateIds.has(msg.id)
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5",
                  msg.sender === "agent" ? "flex-row-reverse" : "",
                  shouldAnimate ? "animate-slide-in-bottom" : ""
                )}
                onAnimationEnd={() => {
                  setAnimateIds((prev) => {
                    const next = new Set(prev)
                    next.delete(msg.id)
                    return next
                  })
                }}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center",
                    msg.sender === "agent" ? "bg-foreground" : "bg-accent"
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
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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
          disabled={sendMutation.isPending}
          className="text-xs"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sendMutation.isPending || !reply.trim()}
          className="shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="sr-only">Send reply</span>
        </Button>
      </div>
    </div>
  )
}

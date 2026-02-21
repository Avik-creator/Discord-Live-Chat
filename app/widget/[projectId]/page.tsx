"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Send, MessageSquare, User } from "lucide-react"
import { WidgetHeader } from "@/components/widget/widget-header"
import { WidgetInput } from "@/components/widget/widget-input"
import { MarkdownContent } from "@/components/ui/markdown-content"

interface Message {
  id: string
  sender: "visitor" | "agent"
  content: string
  createdAt: string
}

interface WidgetConfig {
  projectName: string
  primaryColor: string
  welcomeMessage: string
  offlineMessage: string
  bubbleShape: string
}

type BubbleShape = "rounded" | "sharp" | "pill" | "cloud"

function getVisitorId(): string {
  const key = "bridgecord_visitor_id"
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    localStorage.setItem(key, id)
  }
  return id
}

/** Get the CSS border-radius for each bubble shape */
function getBubbleRadius(shape: BubbleShape, sender: "visitor" | "agent") {
  switch (shape) {
    case "sharp":
      return "0px"
    case "pill":
      return "24px"
    case "cloud":
      return sender === "visitor"
        ? "18px 18px 4px 18px"
        : "18px 18px 18px 4px"
    case "rounded":
    default:
      return sender === "visitor"
        ? "16px 16px 4px 16px"
        : "16px 16px 16px 4px"
  }
}

/** Lighten a hex color for the agent bubble background */
function hexToLightBg(hex: string, opacity: number = 0.12): string {
  return `${hex}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`
}

export default function WidgetPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const visitorIdRef = useRef<string>(
    typeof window !== "undefined" ? getVisitorId() : ""
  )
  const sseRef = useRef<EventSource | null>(null)
  const [animateIds, setAnimateIds] = useState<Set<string>>(new Set())

  // Load config via TanStack Query
  const { data: config, isLoading: loading } = useQuery<WidgetConfig>({
    queryKey: ["widget-config", projectId],
    queryFn: () =>
      fetch(`/api/widget/${projectId}/config`).then((r) => r.json()),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  })

  // Initialize or resume conversation via TanStack Query
  const { data: conversationData } = useQuery({
    queryKey: ["widget-conversation", projectId, visitorIdRef.current],
    queryFn: () =>
      fetch(`/api/widget/${projectId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorIdRef.current }),
      }).then((r) => r.json()),
    enabled: !!config && !!visitorIdRef.current,
    staleTime: Infinity,
  })

  const conversationId = conversationData?.conversationId ?? null

  // Fetch initial messages then set up SSE
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return
    try {
      const res = await fetch(
        `/api/widget/${projectId}/conversations/${conversationId}/messages`
      )
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {
      // silent
    }
  }, [conversationId, projectId])

  // Set up SSE connection with auto-reconnection
  useEffect(() => {
    if (!conversationId) return

    // Load initial messages
    fetchMessages()

    let alive = true
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (!alive) return
      const eventSource = new EventSource(
        `/api/widget/${projectId}/conversations/${conversationId}/stream`
      )
      sseRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "new_message" && data.message) {
            setMessages((prev) => {
              // Deduplicate: skip if message already exists
              if (prev.some((m) => m.id === data.message.id)) return prev
              // Remove the optimistic temp message if this is the real one
              const filtered = prev.filter(
                (m) =>
                  !(
                    m.id.startsWith("temp-") &&
                    m.sender === data.message.sender &&
                    m.content === data.message.content
                  )
              )
              return [...filtered, data.message]
            })
            setAnimateIds((prev) => new Set(prev).add(data.message.id))
          }
        } catch {
          // silent
        }
      }

      eventSource.onerror = () => {
        // SSE disconnected (e.g. Vercel 60s timeout) -- auto-reconnect
        eventSource.close()
        sseRef.current = null
        if (alive) {
          reconnectTimer = setTimeout(connect, 1000)
        }
      }
    }

    connect()

    // Polling fallback: fetch messages every 4s to catch anything SSE missed
    const pollInterval = setInterval(() => {
      fetchMessages()
    }, 4000)

    return () => {
      alive = false
      if (reconnectTimer) clearTimeout(reconnectTimer)
      sseRef.current?.close()
      sseRef.current = null
      clearInterval(pollInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, projectId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending || !conversationId) return
    const content = input.trim()
    setInput("")
    setSending(true)

    // Optimistic add
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      sender: "visitor",
      content,
      createdAt: new Date().toISOString(),
    }
    setAnimateIds((prev) => new Set(prev).add(tempId))
    setMessages((prev) => [...prev, tempMsg])

    try {
      await fetch(
        `/api/widget/${projectId}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      )
      // SSE will push the real message, no need for another fetch
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  const primaryColor = config?.primaryColor || "#5865F2"
  const bubbleShape = (config?.bubbleShape || "rounded") as BubbleShape

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div
          className="h-6 w-6 animate-spin border-2 border-current border-t-transparent"
          style={{ color: primaryColor, borderRadius: "50%" }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <WidgetHeader
        projectName={config?.projectName ?? "Support"}
        primaryColor={primaryColor}
        bubbleShape={bubbleShape}
      />

      {/* Messages area */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {/* Welcome message */}
        {messages.length === 0 && config?.welcomeMessage && (
          <div className="flex gap-2.5 animate-slide-in-bottom">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center"
              style={{
                backgroundColor: hexToLightBg(primaryColor, 0.15),
                borderRadius: bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "50%" : "8px",
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" style={{ color: primaryColor }} />
            </div>
            <div
              className="max-w-[80%] px-3.5 py-2.5"
              style={{
                backgroundColor: hexToLightBg(primaryColor, 0.1),
                borderRadius: getBubbleRadius(bubbleShape, "agent"),
                border: `1px solid ${hexToLightBg(primaryColor, 0.15)}`,
              }}
            >
              <p className="text-[13px] leading-relaxed text-foreground">
                {config.welcomeMessage}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isVisitor = msg.sender === "visitor"
          const shouldAnimate = animateIds.has(msg.id)

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isVisitor ? "flex-row-reverse" : ""} ${shouldAnimate ? "animate-slide-in-bottom" : ""}`}
              onAnimationEnd={() => {
                setAnimateIds((prev) => {
                  const next = new Set(prev)
                  next.delete(msg.id)
                  return next
                })
              }}
            >
              {!isVisitor && (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center"
                  style={{
                    backgroundColor: hexToLightBg(primaryColor, 0.15),
                    borderRadius: bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "50%" : "8px",
                  }}
                >
                  <User className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                </div>
              )}
              <div
                className="max-w-[80%] px-3.5 py-2.5"
                style={{
                  backgroundColor: isVisitor ? primaryColor : hexToLightBg(primaryColor, 0.1),
                  color: isVisitor ? "#fff" : undefined,
                  borderRadius: getBubbleRadius(bubbleShape, msg.sender),
                  border: isVisitor ? "none" : `1px solid ${hexToLightBg(primaryColor, 0.15)}`,
                }}
              >
                {isVisitor ? (
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                    {msg.content}
                  </p>
                ) : (
                  <MarkdownContent
                    content={msg.content}
                    className={!isVisitor ? "text-foreground" : ""}
                  />
                )}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <WidgetInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={sending}
        primaryColor={primaryColor}
        bubbleShape={bubbleShape}
      />
    </div>
  )
}

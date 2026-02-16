"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"

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
}

function getVisitorId(): string {
  const key = "bridgecord_visitor_id"
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    localStorage.setItem(key, id)
  }
  return id
}

export default function WidgetPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const visitorIdRef = useRef<string>("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch(`/api/widget/${projectId}/config`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
    visitorIdRef.current = getVisitorId()
  }, [projectId])

  // Initialize or resume conversation
  useEffect(() => {
    if (!config) return
    const initConversation = async () => {
      try {
        const res = await fetch(`/api/widget/${projectId}/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: visitorIdRef.current }),
        })
        if (res.ok) {
          const data = await res.json()
          setConversationId(data.conversationId)
        }
      } catch {
        // silent
      }
    }
    initConversation()
  }, [config, projectId])

  // Poll for messages
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

  useEffect(() => {
    if (!conversationId) return
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [conversationId, fetchMessages])

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
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      sender: "visitor",
      content,
      createdAt: new Date().toISOString(),
    }
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
      await fetchMessages()
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  const primaryColor = config?.primaryColor || "#5865F2"

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ color: primaryColor }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.2)]">
          <svg
            className="h-4 w-4 text-[#fff]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#fff]">
            {config?.projectName || "Support"}
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.8)]">
            We typically reply in a few minutes
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Welcome message */}
        {messages.length === 0 && config?.welcomeMessage && (
          <div className="flex gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: primaryColor }}
            >
              <svg
                className="h-3.5 w-3.5 text-[#fff]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div className="max-w-[80%] rounded-lg bg-card border border-border px-3 py-2">
              <p className="text-sm text-foreground">{config.welcomeMessage}</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.sender === "visitor" ? "flex-row-reverse" : ""}`}
          >
            {msg.sender === "agent" && (
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: primaryColor }}
              >
                <svg
                  className="h-3.5 w-3.5 text-[#fff]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.sender === "visitor"
                  ? "text-[#fff]"
                  : "bg-card border border-border text-foreground"
              }`}
              style={
                msg.sender === "visitor"
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={sending}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-offset-0"
            style={{ focusRingColor: primaryColor } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#fff] transition-opacity disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
            style={{ color: primaryColor }}
          >
            Bridgecord
          </a>
        </p>
      </div>
    </div>
  )
}

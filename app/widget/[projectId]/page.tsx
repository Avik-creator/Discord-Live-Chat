"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Send, MessageSquare, User } from "lucide-react"

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
  const [prevCount, setPrevCount] = useState(0)
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
        setPrevCount(messages.length)
        setMessages(data)
      }
    } catch {
      // silent
    }
  }, [conversationId, projectId, messages.length])

  useEffect(() => {
    if (!conversationId) return
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

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
    setPrevCount(messages.length)
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
      <div className="flex h-screen items-center justify-center bg-background">
        <div
          className="h-6 w-6 animate-spin border-2 border-current border-t-transparent"
          style={{ color: primaryColor, borderRadius: "50%" }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background animate-fade-in">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 animate-fade-in-down"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex h-8 w-8 items-center justify-center bg-[rgba(255,255,255,0.15)]">
          <MessageSquare className="h-4 w-4 text-[#fff]" />
        </div>
        <div>
          <p className="text-xs font-bold tracking-wide text-[#fff]">
            {config?.projectName || "Support"}
          </p>
          <p className="text-[10px] text-[rgba(255,255,255,0.7)]">
            We typically reply in a few minutes
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {/* Welcome message */}
        {messages.length === 0 && config?.welcomeMessage && (
          <div className="flex gap-2 animate-slide-in-bottom">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquare className="h-3 w-3 text-[#fff]" />
            </div>
            <div className="max-w-[80%] border border-border bg-card px-3 py-2">
              <p className="text-xs text-foreground">
                {config.welcomeMessage}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isNew = index >= prevCount
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.sender === "visitor" ? "flex-row-reverse" : ""} ${isNew ? "animate-slide-in-bottom" : ""}`}
              style={isNew ? { animationDelay: `${(index - prevCount) * 50}ms` } : undefined}
            >
              {msg.sender === "agent" && (
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <User className="h-3 w-3 text-[#fff]" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2 ${
                  msg.sender === "visitor"
                    ? "text-[#fff]"
                    : "border border-border bg-card text-foreground"
                }`}
                style={
                  msg.sender === "visitor"
                    ? { backgroundColor: primaryColor }
                    : undefined
                }
              >
                <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
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
            className="flex-1 border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-foreground"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-[#fff] transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Powered by{" "}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            Bridgecord
          </a>
        </p>
      </div>
    </div>
  )
}

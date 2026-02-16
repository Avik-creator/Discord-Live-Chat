"use client"

import { useState, useEffect } from "react"
import { Send, MessageSquare } from "lucide-react"

const messages = [
  {
    from: "visitor",
    text: "Hey! Does Bridgecord work with Webflow?",
    delay: 0,
  },
  {
    from: "agent",
    text: "Absolutely! Just paste the script tag into your site settings. Takes about 2 minutes.",
    delay: 1800,
  },
  { from: "visitor", text: "Perfect, signing up now.", delay: 3400 },
]

export function ChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    messages.forEach((msg, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleMessages(i + 1)
        }, msg.delay + 600)
      )
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="w-full max-w-sm">
      {/* Widget container */}
      <div className="overflow-hidden border border-border bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-foreground px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center bg-background/15">
            <MessageSquare className="h-4 w-4 text-background" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-background">
              Acme Support
            </p>
            <p className="text-[10px] text-background/60">
              Typically replies in minutes
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex flex-col gap-3 p-5"
          style={{ minHeight: 220 }}
        >
          {messages.slice(0, visibleMessages).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "visitor" ? "justify-end" : "justify-start"} animate-slide-in-bottom`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 text-xs leading-relaxed transition-all duration-300 ${
                  msg.from === "visitor"
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {visibleMessages < messages.length && visibleMessages > 0 && (
            <div
              className={`flex ${messages[visibleMessages].from === "agent" ? "justify-start" : "justify-end"} animate-fade-in`}
            >
              <div className="flex gap-1 bg-secondary px-4 py-3">
                <span
                  className="h-1.5 w-1.5 animate-bounce bg-muted-foreground/50"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce bg-muted-foreground/50"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce bg-muted-foreground/50"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 bg-secondary px-4 py-2.5">
            <span className="flex-1 text-xs text-muted-foreground">
              Type a message...
            </span>
            <Send className="h-3.5 w-3.5 text-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}

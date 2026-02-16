"use client"

import { useState, useEffect } from "react"
import { Send } from "lucide-react"

const messages = [
  { from: "visitor", text: "Hey! Does Bridgecord work with Webflow?", delay: 0 },
  { from: "agent", text: "Absolutely! Just paste the script tag into your site settings. Takes about 2 minutes.", delay: 1800 },
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-primary px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
            <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-foreground">Acme Support</p>
            <p className="text-xs text-primary-foreground/70">Typically replies in minutes</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-3 p-5" style={{ minHeight: 220 }}>
          {messages.slice(0, visibleMessages).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "visitor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.from === "visitor"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-secondary-foreground"
                }`}
                style={{
                  animation: "fadeSlideUp 0.35s ease-out",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {visibleMessages < messages.length && visibleMessages > 0 && (
            <div className={`flex ${messages[visibleMessages].from === "agent" ? "justify-start" : "justify-end"}`}>
              <div className="flex gap-1 rounded-2xl bg-secondary px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5">
            <span className="flex-1 text-sm text-muted-foreground">Type a message...</span>
            <Send className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

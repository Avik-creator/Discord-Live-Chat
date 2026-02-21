"use client"

import { Send } from "lucide-react"

type BubbleShape = "rounded" | "sharp" | "pill" | "cloud"

type WidgetInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  primaryColor: string
  bubbleShape: BubbleShape
  placeholder?: string
}

export function WidgetInput({
  value,
  onChange,
  onSend,
  disabled,
  primaryColor,
  bubbleShape,
  placeholder = "Type a message...",
}: WidgetInputProps) {
  const inputRadius =
    bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "24px" : "8px"
  const buttonRadius =
    bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "50%" : "8px"

  return (
    <div
      className="border-t border-border bg-card/50 p-3 animate-fade-in-up backdrop-blur-sm"
      style={{ animationDelay: "200ms" }}
    >
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          disabled={disabled}
          className="flex-1 bg-background px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200"
          style={{
            borderRadius: inputRadius,
            border: "1px solid var(--border)",
          }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40"
          style={{
            backgroundColor: primaryColor,
            borderRadius: buttonRadius,
          }}
        >
          <Send className="h-4 w-4" />
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
  )
}

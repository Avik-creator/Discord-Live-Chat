"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

type ReplyInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export function ReplyInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Type a reply... (also sends to Discord)",
}: ReplyInputProps) {
  return (
    <div className="mt-3 flex gap-2">
      <Input
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
        className="text-xs"
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="shrink-0"
      >
        <Send className="h-3.5 w-3.5" />
        <span className="sr-only">Send reply</span>
      </Button>
    </div>
  )
}

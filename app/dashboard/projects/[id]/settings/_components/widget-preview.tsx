"use client"

import { MessageSquare, Send } from "lucide-react"

export function getPreviewRadius(shape: string, sender: "visitor" | "agent") {
  switch (shape) {
    case "sharp":
      return "0px"
    case "pill":
      return "14px"
    case "cloud":
      return sender === "visitor"
        ? "12px 12px 3px 12px"
        : "12px 12px 12px 3px"
    case "rounded":
    default:
      return sender === "visitor"
        ? "10px 10px 3px 10px"
        : "10px 10px 10px 3px"
  }
}

export const BUBBLE_SHAPES = [
  { value: "rounded", label: "Rounded" },
  { value: "sharp", label: "Sharp" },
  { value: "pill", label: "Pill" },
  { value: "cloud", label: "Cloud" },
] as const

export function WidgetPreview({
  primaryColor,
  welcomeMessage,
  position,
  bubbleShape,
}: {
  primaryColor: string
  welcomeMessage: string
  position: string
  bubbleShape: string
}) {
  const fabRadius =
    bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "50%" : "8px"
  const windowRadius =
    bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "16px" : "8px"

  return (
    <div className="relative h-80 w-full overflow-hidden border border-border bg-muted/30">
      <div className="absolute inset-0 p-4">
        <div className="h-2 w-20 bg-muted" />
        <div className="mt-3 h-1.5 w-32 bg-muted/60" />
        <div className="mt-2 h-1.5 w-28 bg-muted/40" />
        <div className="mt-6 h-8 w-full bg-muted/20" />
        <div className="mt-3 h-8 w-full bg-muted/20" />
        <div className="mt-3 h-8 w-3/4 bg-muted/20" />
      </div>

      <div
        className={`absolute bottom-3 ${
          position === "bottom-left" ? "left-3" : "right-3"
        } w-52`}
      >
        <div
          className="mb-2 overflow-hidden border border-border bg-card"
          style={{ borderRadius: windowRadius }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{
              backgroundColor: primaryColor,
              borderRadius:
                bubbleShape === "pill" ? "14px 14px 0 0" : undefined,
            }}
          >
            <MessageSquare className="h-3 w-3 text-white" />
            <span className="text-[9px] font-bold text-white">Chat</span>
          </div>
          <div className="space-y-1.5 p-2.5">
            <div className="flex gap-1.5">
              <div
                className="inline-block max-w-[75%] px-2 py-1 text-[8px]"
                style={{
                  backgroundColor: `${primaryColor}18`,
                  color: "var(--foreground)",
                  borderRadius: getPreviewRadius(bubbleShape, "agent"),
                  border: `1px solid ${primaryColor}25`,
                }}
              >
                {welcomeMessage?.slice(0, 40) || "Hi! How can we help?"}
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className="inline-block max-w-[75%] px-2 py-1 text-[8px] text-white"
                style={{
                  backgroundColor: primaryColor,
                  borderRadius: getPreviewRadius(bubbleShape, "visitor"),
                }}
              >
                I have a question!
              </div>
            </div>
            <div
              className="mt-1 flex items-center gap-1 border border-border bg-background px-2 py-1.5"
              style={{
                borderRadius:
                  bubbleShape === "sharp"
                    ? "0"
                    : bubbleShape === "pill"
                      ? "14px"
                      : "6px",
              }}
            >
              <span className="flex-1 text-[8px] text-muted-foreground">
                Type a message...
              </span>
              <Send className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center transition-all ${
            position === "bottom-left" ? "" : "ml-auto"
          }`}
          style={{ backgroundColor: primaryColor, borderRadius: fabRadius }}
        >
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  )
}

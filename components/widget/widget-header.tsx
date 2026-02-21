"use client"

import { MessageSquare } from "lucide-react"

type BubbleShape = "rounded" | "sharp" | "pill" | "cloud"

type WidgetHeaderProps = {
  projectName: string
  primaryColor: string
  bubbleShape: BubbleShape
  statusText?: string
}

export function WidgetHeader({
  projectName,
  primaryColor,
  bubbleShape,
  statusText = "Online",
}: WidgetHeaderProps) {
  const headerRadius =
    bubbleShape === "pill" ? "0 0 20px 20px" : undefined
  const iconRadius =
    bubbleShape === "sharp"
      ? "0"
      : bubbleShape === "pill"
        ? "50%"
        : "8px"

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 animate-fade-in-down"
      style={{
        backgroundColor: primaryColor,
        borderRadius: headerRadius,
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center"
        style={{
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: iconRadius,
        }}
      >
        <MessageSquare className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">
          {projectName || "Support"}
        </p>
        <p className="text-[11px] text-[rgba(255,255,255,0.75)]">
          We typically reply in a few minutes
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 animate-pulse-soft rounded-full"
          style={{ backgroundColor: "#4ade80" }}
        />
        <span className="text-[10px] text-[rgba(255,255,255,0.7)]">
          {statusText}
        </span>
      </div>
    </div>
  )
}

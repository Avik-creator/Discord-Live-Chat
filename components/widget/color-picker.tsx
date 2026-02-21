"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Check, Paintbrush } from "lucide-react"

const PRESET_COLORS = [
  { name: "Discord", value: "#5865F2" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Emerald", value: "#10B981" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Slate", value: "#64748B" },
]

export function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  const [customColor, setCustomColor] = useState(value)

  useEffect(() => {
    setCustomColor(value)
  }, [value])

  const handleCustomChange = (hex: string) => {
    setCustomColor(hex)
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-2.5 border border-border bg-card px-3 transition-colors hover:bg-accent"
        >
          <div
            className="h-4 w-4 border border-border"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-medium text-foreground">{value}</span>
          <Paintbrush className="ml-1 h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Presets
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => onChange(color.value)}
                className="group relative flex h-7 w-7 items-center justify-center border border-border transition-all hover:scale-110"
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {value === color.value && (
                  <Check className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>
        <Separator />
        <div className="p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Custom
          </p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value)
                onChange(e.target.value)
              }}
              className="h-8 w-8 cursor-pointer border border-border bg-transparent p-0"
            />
            <Input
              value={customColor}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="#5865F2"
              className="h-8 flex-1 text-xs"
              maxLength={7}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ColorPicker } from "./color-picker"
import {
  WidgetPreview,
  BUBBLE_SHAPES,
  getPreviewRadius,
} from "./widget-preview"

interface WidgetTabProps {
  projectId: string
  initialWidget: {
    primaryColor: string
    position: string
    welcomeMessage: string
    offlineMessage: string
    bubbleShape: string
  }
}

export function WidgetTab({ projectId, initialWidget }: WidgetTabProps) {
  const [primaryColor, setPrimaryColor] = useState(initialWidget.primaryColor)
  const [position, setPosition] = useState(initialWidget.position)
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialWidget.welcomeMessage
  )
  const [offlineMessage, setOfflineMessage] = useState(
    initialWidget.offlineMessage
  )
  const [bubbleShape, setBubbleShape] = useState(initialWidget.bubbleShape)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widget: {
            primaryColor,
            position,
            welcomeMessage,
            offlineMessage,
            bubbleShape,
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
    },
    onSuccess: () => toast.success("Widget settings saved"),
    onError: () => toast.error("Failed to save widget settings"),
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
              Appearance
            </CardTitle>
            <CardDescription className="text-xs">
              Customize how the chat widget looks on your website.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Brand Color</Label>
              <p className="text-[10px] text-muted-foreground">
                Pick a color that matches your brand. This is used for the chat
                button and message bubbles.
              </p>
              <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Bubble Shape</Label>
              <p className="text-[10px] text-muted-foreground">
                Choose the style of message bubbles in the chat.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BUBBLE_SHAPES.map((shape) => (
                  <button
                    key={shape.value}
                    type="button"
                    onClick={() => setBubbleShape(shape.value)}
                    className={`flex flex-col items-center gap-1.5 border p-3 transition-all hover:bg-accent/50 ${
                      bubbleShape === shape.value
                        ? "border-foreground bg-accent/30"
                        : "border-border"
                    }`}
                  >
                    <div className="flex w-full items-end justify-end">
                      <div
                        className="h-3 w-12"
                        style={{
                          backgroundColor: primaryColor,
                          borderRadius: getPreviewRadius(
                            shape.value,
                            "visitor"
                          ),
                        }}
                      />
                    </div>
                    <div className="flex w-full items-start">
                      <div
                        className="h-3 w-10"
                        style={{
                          backgroundColor: `${primaryColor}20`,
                          border: `1px solid ${primaryColor}30`,
                          borderRadius: getPreviewRadius(
                            shape.value,
                            "agent"
                          ),
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-foreground">
                      {shape.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-msg" className="text-xs">
                Welcome Message
              </Label>
              <Textarea
                id="welcome-msg"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                placeholder="Hi there! How can we help you today?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offline-msg" className="text-xs">
                Offline Message
              </Label>
              <Textarea
                id="offline-msg"
                value={offlineMessage}
                onChange={(e) => setOfflineMessage(e.target.value)}
                rows={2}
                placeholder="We're currently offline. Leave a message and we'll get back to you!"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
              Preview
            </CardTitle>
            <CardDescription className="text-xs">
              Live preview of how your widget will look.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <WidgetPreview
              primaryColor={primaryColor}
              welcomeMessage={welcomeMessage}
              position={position}
              bubbleShape={bubbleShape}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="text-xs"
        >
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}

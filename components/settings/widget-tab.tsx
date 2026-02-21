"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ColorPicker } from "@/components/widget/color-picker"
import { WidgetPreview, getPreviewRadius } from "@/components/widget/widget-preview"

const BUBBLE_SHAPES = [
  { value: "rounded", label: "Rounded", description: "Soft corners with a tail" },
  { value: "sharp", label: "Sharp", description: "Square, no border-radius" },
  { value: "pill", label: "Pill", description: "Fully rounded capsule" },
  { value: "cloud", label: "Cloud", description: "Asymmetric speech bubble" },
] as const

export function WidgetTab({
  primaryColor,
  setPrimaryColor,
  position,
  setPosition,
  bubbleShape,
  setBubbleShape,
  welcomeMessage,
  setWelcomeMessage,
  offlineMessage,
  setOfflineMessage,
  onSave,
  saving,
}: {
  primaryColor: string
  setPrimaryColor: (v: string) => void
  position: string
  setPosition: (v: string) => void
  bubbleShape: string
  setBubbleShape: (v: string) => void
  welcomeMessage: string
  setWelcomeMessage: (v: string) => void
  offlineMessage: string
  setOfflineMessage: (v: string) => void
  onSave: () => void
  saving: boolean
}) {
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
                          borderRadius: getPreviewRadius(shape.value, "visitor"),
                        }}
                      />
                    </div>
                    <div className="flex w-full items-start">
                      <div
                        className="h-3 w-10"
                        style={{
                          backgroundColor: `${primaryColor}20`,
                          border: `1px solid ${primaryColor}30`,
                          borderRadius: getPreviewRadius(shape.value, "agent"),
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
        <Button size="sm" onClick={onSave} disabled={saving} className="text-xs">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}

"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Check,
  ExternalLink,
  Hash,
  RefreshCw,
  Paintbrush,
  MessageSquare,
  Send,
} from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Guild = {
  id: string
  name: string
  icon: string | null
  owner?: boolean
  hasBot?: boolean
}

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

function ColorPicker({
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

const BUBBLE_SHAPES = [
  { value: "rounded", label: "Rounded", description: "Soft corners with a tail" },
  { value: "sharp", label: "Sharp", description: "Square, no border-radius" },
  { value: "pill", label: "Pill", description: "Fully rounded capsule" },
  { value: "cloud", label: "Cloud", description: "Asymmetric speech bubble" },
] as const

function getPreviewRadius(shape: string, sender: "visitor" | "agent") {
  switch (shape) {
    case "sharp": return "0px"
    case "pill": return "14px"
    case "cloud": return sender === "visitor" ? "12px 12px 3px 12px" : "12px 12px 12px 3px"
    case "rounded": default: return sender === "visitor" ? "10px 10px 3px 10px" : "10px 10px 10px 3px"
  }
}

function WidgetPreview({
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
  const fabRadius = bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "50%" : "8px"
  const windowRadius = bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "16px" : "8px"
  return (
    <div className="relative h-80 w-full overflow-hidden border border-border bg-muted/30">
      {/* Fake website background */}
      <div className="absolute inset-0 p-4">
        <div className="h-2 w-20 bg-muted" />
        <div className="mt-3 h-1.5 w-32 bg-muted/60" />
        <div className="mt-2 h-1.5 w-28 bg-muted/40" />
        <div className="mt-6 h-8 w-full bg-muted/20" />
        <div className="mt-3 h-8 w-full bg-muted/20" />
        <div className="mt-3 h-8 w-3/4 bg-muted/20" />
      </div>

      {/* Chat widget preview */}
      <div
        className={`absolute bottom-3 ${
          position === "bottom-left" ? "left-3" : "right-3"
        } w-52`}
      >
        {/* Chat window */}
        <div
          className="mb-2 overflow-hidden border border-border bg-card"
          style={{ borderRadius: windowRadius }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{
              backgroundColor: primaryColor,
              borderRadius: bubbleShape === "pill" ? "14px 14px 0 0" : undefined,
            }}
          >
            <MessageSquare className="h-3 w-3 text-white" />
            <span className="text-[9px] font-bold text-white">Chat</span>
          </div>
          <div className="space-y-1.5 p-2.5">
            {/* Agent bubble */}
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
            {/* Visitor bubble */}
            <div className="flex justify-end">
              <div
                className="inline-block max-w-[75%] px-2 py-1 text-[8px] text-white"
                style={{
                  backgroundColor: primaryColor,
                  borderRadius: getPreviewRadius(bubbleShape, "visitor"),
                }}
              >
                {"I have a question!"}
              </div>
            </div>
            {/* Input */}
            <div
              className="mt-1 flex items-center gap-1 border border-border bg-background px-2 py-1.5"
              style={{
                borderRadius: bubbleShape === "sharp" ? "0" : bubbleShape === "pill" ? "14px" : "6px",
              }}
            >
              <span className="flex-1 text-[8px] text-muted-foreground">
                Type a message...
              </span>
              <Send className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* FAB */}
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

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  const {
    data: settings,
    isLoading,
    mutate,
  } = useSWR(`/api/projects/${id}/settings`, fetcher)
  const { data: channels } = useSWR(
    settings?.discord?.guildId
      ? `/api/projects/${id}/discord/channels`
      : null,
    fetcher
  )

  const [projectName, setProjectName] = useState("")
  const [domain, setDomain] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#5865F2")
  const [position, setPosition] = useState("bottom-right")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [offlineMessage, setOfflineMessage] = useState("")
  const [bubbleShape, setBubbleShape] = useState("rounded")
  const [channelId, setChannelId] = useState("")
  const [saving, setSaving] = useState(false)

  // Guild selection state
  const [showGuildPicker, setShowGuildPicker] = useState(false)
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loadingGuilds, setLoadingGuilds] = useState(false)
  const [savingGuild, setSavingGuild] = useState(false)

  useEffect(() => {
    if (settings) {
      setProjectName(settings.project?.name || "")
      setDomain(settings.project?.domain || "")
      setPrimaryColor(settings.widget?.primaryColor || "#5865F2")
      setPosition(settings.widget?.position || "bottom-right")
      setWelcomeMessage(settings.widget?.welcomeMessage || "")
      setOfflineMessage(settings.widget?.offlineMessage || "")
      setBubbleShape(settings.widget?.bubbleShape || "rounded")
      setChannelId(settings.discord?.channelId || "")
    }
  }, [settings])

  const handleOpenBotInvite = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/discord`)
      const data = await res.json()
      window.open(data.url, "_blank", "noopener,noreferrer")
      toast.info(
        "After adding the bot, click 'Refresh Servers' to select your server."
      )
      setShowGuildPicker(true)
    } catch {
      toast.error("Failed to generate Discord invite link")
    }
  }

  const fetchGuilds = async () => {
    setLoadingGuilds(true)
    try {
      const res = await fetch(`/api/projects/${id}/discord/guilds`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGuilds(data)
      if (data.length === 0) {
        toast.info(
          "No servers found. Make sure you've added the bot first."
        )
      }
    } catch {
      toast.error("Failed to fetch servers")
    } finally {
      setLoadingGuilds(false)
    }
  }

  const handleSelectGuild = async (guild: Guild) => {
    setSavingGuild(true)
    try {
      const res = await fetch(`/api/projects/${id}/discord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId: guild.id, guildName: guild.name }),
      })
      if (!res.ok) throw new Error()
      await mutate()
      setShowGuildPicker(false)
      toast.success(`Connected to ${guild.name}!`)
    } catch {
      toast.error("Failed to save server selection")
    } finally {
      setSavingGuild(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const selectedChannel = channels?.find(
        (c: { id: string; name: string }) => c.id === channelId
      )
      const res = await fetch(`/api/projects/${id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          domain,
          widget: { primaryColor, position, welcomeMessage, offlineMessage, bubbleShape },
          discord: channelId
            ? { channelId, channelName: selectedChannel?.name }
            : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      await mutate()
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList>
        <TabsTrigger value="general" className="text-xs">
          General
        </TabsTrigger>
        <TabsTrigger value="discord" className="text-xs">
          Discord
        </TabsTrigger>
        <TabsTrigger value="widget" className="text-xs">
          Widget
        </TabsTrigger>
      </TabsList>

      {/* General tab */}
      <TabsContent value="general" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
              Project
            </CardTitle>
            <CardDescription className="text-xs">
              General project configuration.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-xs">
                Project Name
              </Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-domain" className="text-xs">
                Domain
              </Label>
              <Input
                id="project-domain"
                placeholder="myapp.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                The domain where your chat widget will be installed.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </TabsContent>

      {/* Discord tab */}
      <TabsContent value="discord" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
              Discord Connection
            </CardTitle>
            <CardDescription className="text-xs">
              Connect your Discord server to receive and reply to messages.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-4">
            {settings?.discord?.guildId ? (
              <>
                <div className="flex items-center gap-3 border border-border bg-accent/50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center bg-[#5865F2]">
                    <svg
                      className="h-4 w-4 text-[#fff]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">
                      {settings.discord.guildName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Connected
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[10px]"
                  >
                    <Check className="h-2.5 w-2.5" />
                    Connected
                  </Badge>
                </div>

                {/* Channel selector */}
                <div className="space-y-2">
                  <Label className="text-xs">Chat Channel</Label>
                  <p className="text-[10px] text-muted-foreground">
                    New conversations will create threads in this channel.
                  </p>
                  <Select value={channelId} onValueChange={setChannelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {channels?.map(
                        (ch: { id: string; name: string }) => (
                          <SelectItem key={ch.id} value={ch.id}>
                            <div className="flex items-center gap-2">
                              <Hash className="h-3 w-3 text-muted-foreground" />
                              {ch.name}
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setShowGuildPicker(true)
                    fetchGuilds()
                  }}
                >
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Change Server
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  No Discord server connected yet. Follow these two steps:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-foreground text-[10px] font-bold text-background">
                      1
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        Add the bot to your server
                      </p>
                      <p className="mb-2 text-[10px] text-muted-foreground">
                        This opens Discord in a new tab. Select the server
                        you want to use.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleOpenBotInvite}
                        className="gap-1.5 text-xs"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Add Bot to Server
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-foreground text-[10px] font-bold text-background">
                      2
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        Select your server
                      </p>
                      <p className="mb-2 text-[10px] text-muted-foreground">
                        {
                          "After adding the bot, click below to pick which server to use."
                        }
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowGuildPicker(true)
                          fetchGuilds()
                        }}
                        className="gap-1.5 text-xs"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Load My Servers
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </TabsContent>

      {/* Widget tab */}
      <TabsContent value="widget" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Widget settings */}
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
                  Pick a color that matches your brand. This is used for the
                  chat button and message bubbles.
                </p>
                <ColorPicker
                  value={primaryColor}
                  onChange={setPrimaryColor}
                />
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
                      {/* Mini bubble preview */}
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

          {/* Live preview */}
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
            onClick={handleSave}
            disabled={saving}
            className="text-xs"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </TabsContent>

      {/* Guild picker dialog */}
      <Dialog open={showGuildPicker} onOpenChange={setShowGuildPicker}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-sm font-semibold">
                Select a Server
              </DialogTitle>
              <DialogDescription className="text-xs">
                Choose which Discord server to connect to this project.
              </DialogDescription>
            </DialogHeader>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchGuilds}
              disabled={loadingGuilds}
              className="h-8 w-8 p-0"
              title="Refresh servers"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingGuilds ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh servers</span>
            </Button>
          </div>

          <div className="px-3 py-3">
            {loadingGuilds ? (
              <div className="space-y-2 px-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : guilds.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <svg
                    className="h-5 w-5 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">
                    No servers found
                  </p>
                  <p className="mt-1 max-w-[240px] text-[11px] leading-relaxed text-muted-foreground">
                    The bot hasn&apos;t been added to any servers yet. Add it
                    first, then click the refresh button above.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleOpenBotInvite}
                  className="mt-1 gap-1.5 text-xs"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Add Bot to Server
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="max-h-60 space-y-0.5 overflow-y-auto">
                {guilds.map((guild) => {
                  const isConnected =
                    settings?.discord?.guildId === guild.id
                  const iconUrl = guild.icon
                    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}?size=64`
                    : null
                  return (
                    <button
                      key={guild.id}
                      onClick={() => handleSelectGuild(guild)}
                      disabled={savingGuild}
                      className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all hover:bg-accent/60 disabled:opacity-50 ${
                        isConnected ? "bg-accent/40" : ""
                      }`}
                    >
                      {/* Server icon */}
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt={guild.name}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5865F2] text-sm font-bold text-white">
                          {guild.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Server info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {guild.name}
                        </p>
                        {isConnected && (
                          <p className="text-[10px] text-emerald-500">
                            Currently connected
                          </p>
                        )}
                      </div>

                      {/* Selection indicator */}
                      {isConnected ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0 gap-1 text-[9px]"
                        >
                          <Check className="h-2.5 w-2.5" />
                          Active
                        </Badge>
                      ) : (
                        <span className="shrink-0 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          Select
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {guilds.length > 0 && (
            <div className="border-t border-border px-5 py-3">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Don&apos;t see your server?{" "}
                <button
                  type="button"
                  onClick={handleOpenBotInvite}
                  className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2 transition-colors hover:text-foreground/80"
                >
                  Add the bot
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>{" "}
                to another server, then refresh.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}

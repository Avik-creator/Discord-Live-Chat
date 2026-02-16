"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Check, ExternalLink, Hash, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Guild = { id: string; name: string; icon: string | null }

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: settings, isLoading, mutate } = useSWR(
    `/api/projects/${id}/settings`,
    fetcher
  )
  const { data: channels } = useSWR(
    settings?.discord?.guildId ? `/api/projects/${id}/discord/channels` : null,
    fetcher
  )

  const [projectName, setProjectName] = useState("")
  const [domain, setDomain] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#5865F2")
  const [position, setPosition] = useState("bottom-right")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [offlineMessage, setOfflineMessage] = useState("")
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
      setChannelId(settings.discord?.channelId || "")
    }
  }, [settings])

  const handleOpenBotInvite = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/discord`)
      const data = await res.json()
      window.open(data.url, "_blank", "noopener,noreferrer")
      // After opening, show the guild picker so user can select which server
      toast.info("After adding the bot, click 'Refresh Servers' to select your server.")
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
        toast.info("No servers found. Make sure you've added the bot first.")
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
          widget: { primaryColor, position, welcomeMessage, offlineMessage },
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
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Project</CardTitle>
          <CardDescription>General project configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-domain">Domain</Label>
            <Input
              id="project-domain"
              placeholder="myapp.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Discord Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Discord</CardTitle>
          <CardDescription>
            Connect your Discord server to receive and reply to messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.discord?.guildId ? (
            <>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]">
                  <svg className="h-5 w-5 text-[#fff]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {settings.discord.guildName}
                  </p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
              </div>

              {/* Channel selector */}
              <div className="space-y-2">
                <Label>Chat Channel</Label>
                <p className="text-xs text-muted-foreground">
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
                            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
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
                onClick={() => { setShowGuildPicker(true); fetchGuilds() }}
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Change Server
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No Discord server connected yet. Follow these two steps:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">1</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Add the bot to your server</p>
                    <p className="text-xs text-muted-foreground mb-2">This opens Discord in a new tab. Select the server you want to use.</p>
                    <Button size="sm" onClick={handleOpenBotInvite} className="gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                      Add Bot to Server
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">2</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Select your server</p>
                    <p className="text-xs text-muted-foreground mb-2">{"After adding the bot, click below to pick which server to use."}</p>
                    <Button size="sm" variant="outline" onClick={() => { setShowGuildPicker(true); fetchGuilds() }} className="gap-2">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Load My Servers
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guild picker dialog */}
          {showGuildPicker && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Select a Server</h4>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={fetchGuilds} disabled={loadingGuilds}>
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingGuilds ? "animate-spin" : ""}`} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowGuildPicker(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
              {loadingGuilds ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : guilds.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No servers found. Make sure you have added the bot to your Discord server first.
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {guilds.map((guild) => (
                    <button
                      key={guild.id}
                      onClick={() => handleSelectGuild(guild)}
                      disabled={savingGuild}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {guild.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{guild.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Widget Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Widget Appearance</CardTitle>
          <CardDescription>
            Customize how the chat widget looks on your website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#5865F2"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcome-msg">Welcome Message</Label>
            <Textarea
              id="welcome-msg"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offline-msg">Offline Message</Label>
            <Textarea
              id="offline-msg"
              value={offlineMessage}
              onChange={(e) => setOfflineMessage(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}

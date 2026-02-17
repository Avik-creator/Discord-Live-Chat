"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
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
import { Check, ExternalLink, Hash, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Guild = {
  id: string
  name: string
  icon: string | null
  owner?: boolean
  hasBot?: boolean
}

type Channel = {
  id: string
  name: string
}

interface DiscordTabProps {
  projectId: string
  initialGuild: { guildId: string; guildName: string; channelId?: string; channelName?: string } | null
  initialGuilds: Guild[]
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

export function DiscordTab({ projectId, initialGuild, initialGuilds }: DiscordTabProps) {
  const queryClient = useQueryClient()
  const [channelId, setChannelId] = useState(initialGuild?.channelId ?? "")
  const [connectingGuildId, setConnectingGuildId] = useState<string | null>(null)

  // Guilds query - uses server-side data as initial, refreshable
  const guildsQuery = useQuery<Guild[]>({
    queryKey: ["guilds", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/discord/guilds`)
      if (!res.ok) throw new Error("Failed to fetch guilds")
      return res.json()
    },
    initialData: initialGuilds,
    staleTime: 60 * 1000,
  })

  // Channels query - only when connected to a guild
  const channelsQuery = useQuery<Channel[]>({
    queryKey: ["channels", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/discord/channels`)
      if (!res.ok) throw new Error("Failed to fetch channels")
      return res.json()
    },
    enabled: !!initialGuild?.guildId,
  })

  // Connect guild mutation
  const connectMutation = useMutation({
    mutationFn: async (guild: Guild) => {
      setConnectingGuildId(guild.id)
      const res = await fetch(`/api/projects/${projectId}/discord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId: guild.id, guildName: guild.name }),
      })
      if (!res.ok) throw new Error("Failed to connect")
      return guild
    },
    onSuccess: (guild) => {
      toast.success(`Connected to ${guild.name}!`)
      // Force a full page refresh to get new server-side data
      window.location.reload()
    },
    onError: () => {
      toast.error("Failed to connect to server")
      setConnectingGuildId(null)
    },
  })

  // Save channel mutation
  const saveChannelMutation = useMutation({
    mutationFn: async () => {
      const selectedChannel = channelsQuery.data?.find((c) => c.id === channelId)
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discord: { channelId, channelName: selectedChannel?.name },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
    },
    onSuccess: () => toast.success("Channel saved"),
    onError: () => toast.error("Failed to save channel"),
  })

  const handleAddBot = async (guildId?: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/discord`)
      const data = await res.json()
      let url = data.url as string
      if (guildId) {
        url += `&guild_id=${guildId}&disable_guild_select=true`
      }
      window.open(url, "_blank", "noopener,noreferrer")
      toast.info("After adding the bot, click the refresh button to update the list.")
    } catch {
      toast.error("Failed to generate invite link")
    }
  }

  const guilds = guildsQuery.data ?? []

  // Connected state
  if (initialGuild?.guildId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
              Discord Connection
            </CardTitle>
            <CardDescription className="text-xs">
              Your project is connected to a Discord server.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-3 border border-border bg-accent/50 p-3">
              <div className="flex h-9 w-9 items-center justify-center bg-[#5865F2]">
                <DiscordIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">
                  {initialGuild.guildName}
                </p>
                <p className="text-[10px] text-muted-foreground">Connected</p>
              </div>
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Check className="h-2.5 w-2.5" />
                Connected
              </Badge>
            </div>

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
                  {channelsQuery.data?.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        {ch.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-[10px] text-muted-foreground">
              To use a different server, create a new project.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => saveChannelMutation.mutate()}
            disabled={saveChannelMutation.isPending || !channelId}
            className="text-xs"
          >
            {saveChannelMutation.isPending ? "Saving..." : "Save Channel"}
          </Button>
        </div>
      </div>
    )
  }

  // Not connected -- show server list inline
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
                Select a Server
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Choose a server where you have admin or owner access. The bot
                will be connected to this server.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["guilds", projectId] })
              }
              disabled={guildsQuery.isFetching}
              className="h-8 w-8 shrink-0 p-0"
              title="Refresh servers"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${guildsQuery.isFetching ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {guildsQuery.isLoading ? (
            <div className="space-y-2 p-4">
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
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <DiscordIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">
                  No servers found
                </p>
                <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-muted-foreground">
                  You don&apos;t manage any Discord servers, or your session may
                  have expired. Try logging out and back in.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {guilds.map((guild) => {
                const hasBot = guild.hasBot !== false
                const isConnecting = connectingGuildId === guild.id
                const iconUrl = guild.icon
                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}?size=64`
                  : null

                return (
                  <div
                    key={guild.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    {/* Server icon */}
                    <div className="relative shrink-0">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt={guild.name}
                          className={`h-10 w-10 rounded-full object-cover ${!hasBot ? "grayscale" : ""}`}
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                            hasBot ? "bg-[#5865F2]" : "bg-muted-foreground/40"
                          }`}
                        >
                          {guild.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {hasBot && (
                        <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                      )}
                    </div>

                    {/* Server info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {guild.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {guild.owner ? "Owner" : "Admin"}
                        {hasBot ? " · Bot installed" : ""}
                      </p>
                    </div>

                    {/* Action */}
                    {hasBot ? (
                      <Button
                        size="sm"
                        className="shrink-0 text-[10px] h-7 px-3"
                        onClick={() => connectMutation.mutate(guild)}
                        disabled={connectMutation.isPending}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1 text-[10px] h-7 px-3"
                        onClick={() => handleAddBot(guild.id)}
                      >
                        Add Bot
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {guilds.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  Bot installed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
                  Bot not installed
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

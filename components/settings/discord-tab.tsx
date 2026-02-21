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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Check, ExternalLink, Hash, RefreshCw } from "lucide-react"

type DiscordInfo = {
  guildId: string
  guildName: string
  channelId: string | null
  channelName: string | null
}

type Channel = { id: string; name: string }

export function DiscordTab({
  discord,
  channels,
  channelId,
  setChannelId,
  onOpenBotInvite,
  onOpenGuildPicker,
  onSave,
  saving,
}: {
  discord: DiscordInfo | null
  channels: Channel[] | undefined
  channelId: string
  setChannelId: (v: string) => void
  onOpenBotInvite: () => void
  onOpenGuildPicker: () => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-6">
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
          {discord?.guildId ? (
            <>
              <div className="flex items-center gap-3 border border-border bg-accent/50 p-3">
                <div className="flex h-9 w-9 items-center justify-center bg-[#5865F2]">
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    {discord.guildName}
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
                    {channels?.map((ch) => (
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
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={onOpenGuildPicker}
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
                      This opens Discord in a new tab. Select the server you
                      want to use.
                    </p>
                    <Button
                      size="sm"
                      onClick={onOpenBotInvite}
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
                      After adding the bot, click below to pick which server to
                      use.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onOpenGuildPicker}
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
        <Button size="sm" onClick={onSave} disabled={saving} className="text-xs">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}

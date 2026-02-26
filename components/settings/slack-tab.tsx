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
import { Check, ExternalLink, Hash, Unplug } from "lucide-react"

type SlackInfo = {
  workspaceId: string
  workspaceName: string
  channelId: string | null
  channelName: string | null
}

type Channel = { id: string; name: string }

const SlackIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
)

export function SlackTab({
  slack,
  channels,
  channelId,
  setChannelId,
  onOpenSlackInstall,
  onDisconnect,
  isDisconnecting,
}: {
  slack: SlackInfo | null
  channels: Channel[] | undefined
  channelId: string
  setChannelId: (v: string) => void
  onOpenSlackInstall: () => void
  onDisconnect: () => void
  isDisconnecting: boolean
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            Slack Connection
          </CardTitle>
          <CardDescription className="text-xs">
            Connect your Slack workspace to receive and reply to messages.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-4">
          {slack?.workspaceId ? (
            <>
              <div className="flex items-center gap-3 border border-border bg-accent/50 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4A154B]">
                  <SlackIcon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    {slack.workspaceName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Connected</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnect}
                  disabled={isDisconnecting}
                  className="gap-1 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Unplug className="h-3 w-3" />
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Chat Channel</Label>
                <p className="text-[10px] text-muted-foreground">
                  New conversations will create threads in this channel.
                </p>
                <Select value={channelId || undefined} onValueChange={setChannelId}>
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
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                No Slack workspace connected yet. Click the button below to install the app to your workspace. After you authorize in Slack, you'll be brought back here and it will be connected automatically.
              </p>
              <Button
                size="sm"
                onClick={onOpenSlackInstall}
                className="gap-1.5 text-xs"
              >
                <SlackIcon className="h-3.5 w-3.5" />
                Add to Slack
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

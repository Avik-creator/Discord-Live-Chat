"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Check, ExternalLink, RefreshCw } from "lucide-react"
import type { Guild } from "@/hooks/use-settings"

export function GuildPickerDialog({
  open,
  onOpenChange,
  guilds,
  loading,
  onRefresh,
  onSelectGuild,
  savingGuild,
  currentGuildId,
  onOpenBotInvite,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  guilds: Guild[]
  loading: boolean
  onRefresh: () => void
  onSelectGuild: (guild: Guild) => void
  savingGuild: boolean
  currentGuildId: string | undefined
  onOpenBotInvite: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-semibold">
              Select a Server
            </DialogTitle>
            <DialogDescription className="text-xs">
              All servers you manage are shown below.
            </DialogDescription>
          </DialogHeader>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
            title="Refresh servers"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refresh servers</span>
          </Button>
        </div>

        <div className="px-3 py-3">
          {loading ? (
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
                  You don&apos;t manage any Discord servers, or your session may
                  have expired. Try logging out and back in.
                </p>
              </div>
              <Button
                size="sm"
                onClick={onOpenBotInvite}
                className="mt-1 gap-1.5 text-xs"
              >
                Add Bot to Server
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="max-h-72 space-y-0.5 overflow-y-auto">
              {guilds.map((guild) => {
                const isConnected = currentGuildId === guild.id
                const hasBot = guild.hasBot !== false
                const iconUrl = guild.icon
                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}?size=64`
                  : null

                return (
                  <div
                    key={guild.id}
                    className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-all ${
                      isConnected
                        ? "bg-accent/40"
                        : hasBot
                          ? "hover:bg-accent/60"
                          : "opacity-70 hover:opacity-100"
                    }`}
                  >
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {guild.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {isConnected
                          ? "Currently connected"
                          : hasBot
                            ? "Bot installed"
                            : "Bot not installed"}
                      </p>
                    </div>
                    {isConnected ? (
                      <Badge
                        variant="secondary"
                        className="shrink-0 gap-1 text-[9px]"
                      >
                        <Check className="h-2.5 w-2.5" />
                        Active
                      </Badge>
                    ) : hasBot ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-[10px] h-7 px-2.5 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => onSelectGuild(guild)}
                        disabled={savingGuild}
                      >
                        Switch here
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 gap-1 text-[10px] h-7 px-2.5"
                        onClick={onOpenBotInvite}
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
        </div>

        {guilds.length > 0 && (
          <div className="border-t border-border px-5 py-3">
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
      </DialogContent>
    </Dialog>
  )
}

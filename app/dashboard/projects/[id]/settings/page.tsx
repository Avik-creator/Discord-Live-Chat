"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  useProjectSettings,
  useSaveSettings,
  useCrawlMeta,
  useCrawlSite,
  type SaveSettingsPayload,
} from "@/hooks/use-settings"
import { GeneralTab } from "@/components/settings/general-tab"
import { DiscordTab } from "@/components/settings/discord-tab"
import { WidgetTab } from "@/components/settings/widget-tab"
import { AITab } from "@/components/settings/ai-tab"
import { useSettingsStore } from "@/stores/settings-store"
import { settingsFormSchema } from "@/lib/validations/settings"

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { data: settings, isLoading: settingsLoading } = useProjectSettings(id)
  const saveSettings = useSaveSettings(id)

  useEffect(() => {
    if (searchParams.get("discord") === "connected" && id) {
      queryClient.invalidateQueries({ queryKey: ["settings", id] })
      toast.success("Discord server connected!")
    }
  }, [searchParams, id, queryClient])
  const { data: channels } = useQuery({
    queryKey: ["channels", id, settings?.discord?.guildId],
    queryFn: () =>
      fetch(`/api/projects/${id}/discord/channels`).then((r) => r.json()),
    enabled: !!id && !!settings?.discord?.guildId,
  })
  const { data: crawlMeta } = useCrawlMeta(id)
  const crawlSite = useCrawlSite(id)

  const {
    projectName,
    setProjectName,
    domain,
    setDomain,
    primaryColor,
    setPrimaryColor,
    position,
    setPosition,
    welcomeMessage,
    setWelcomeMessage,
    offlineMessage,
    setOfflineMessage,
    bubbleShape,
    setBubbleShape,
    aiEnabled,
    setAiEnabled,
    aiSystemPrompt,
    setAiSystemPrompt,
    aiModel,
    setAiModel,
    channelId,
    setChannelId,
    hydrate,
  } = useSettingsStore()

  // Only hydrate when we have settings from the API (avoid flashing empty form)
  useEffect(() => {
    if (settings) hydrate(settings)
  }, [settings, hydrate])

  const handleSave = () => {
    const selectedChannel = channels?.find(
      (c: { id: string; name: string }) => c.id === channelId
    )
    const rawPayload = {
      name: projectName.trim(),
      domain: domain.trim(),
      widget: {
        primaryColor,
        position,
        welcomeMessage,
        offlineMessage,
        bubbleShape,
        aiEnabled,
        aiSystemPrompt,
        aiModel,
      },
      ...(channelId.trim() && {
        discord: {
          channelId: channelId.trim(),
          channelName: selectedChannel?.name,
        },
      }),
    }

    const parsed = settingsFormSchema.safeParse(rawPayload)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      const msg =
        firstError?.message ?? "Please check the form and try again."
      toast.error(msg)
      return
    }

    const payload: SaveSettingsPayload = {
      name: parsed.data.name,
      domain: parsed.data.domain,
      widget: parsed.data.widget,
      ...(parsed.data.discord?.channelId && {
        discord: {
          channelId: parsed.data.discord.channelId,
          channelName: parsed.data.discord.channelName,
        },
      }),
    }
    saveSettings.mutate(payload)
  }

  const handleOpenBotInvite = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/discord`)
      const data = await res.json()
      window.location.href = data.url
    } catch {
      toast.error("Failed to generate Discord invite link")
    }
  }

  if (settingsLoading || !settings) {
    return <SettingsLoadingSkeleton />
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
        <TabsTrigger value="ai" className="text-xs">
          AI Auto-Reply
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <GeneralTab
          projectName={projectName}
          setProjectName={setProjectName}
          domain={domain}
          setDomain={setDomain}
          onSave={handleSave}
          saving={saveSettings.isPending}
        />
      </TabsContent>

      <TabsContent value="discord" className="space-y-6">
        <DiscordTab
          discord={settings?.discord ?? null}
          channels={channels}
          channelId={channelId}
          setChannelId={setChannelId}
          onOpenBotInvite={handleOpenBotInvite}
          onSave={handleSave}
          saving={saveSettings.isPending}
        />
      </TabsContent>

      <TabsContent value="widget" className="space-y-6">
        <WidgetTab
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          position={position}
          setPosition={setPosition}
          bubbleShape={bubbleShape}
          setBubbleShape={setBubbleShape}
          welcomeMessage={welcomeMessage}
          setWelcomeMessage={setWelcomeMessage}
          offlineMessage={offlineMessage}
          setOfflineMessage={setOfflineMessage}
          onSave={handleSave}
          saving={saveSettings.isPending}
        />
      </TabsContent>

      <TabsContent value="ai" className="space-y-6">
        <AITab
          aiEnabled={aiEnabled}
          setAiEnabled={setAiEnabled}
          aiModel={aiModel}
          setAiModel={setAiModel}
          aiSystemPrompt={aiSystemPrompt}
          setAiSystemPrompt={setAiSystemPrompt}
          domain={domain}
          crawlMeta={crawlMeta}
          onCrawlSite={() => crawlSite.mutate()}
          crawling={crawlSite.isPending}
          onSave={handleSave}
          saving={saveSettings.isPending}
        />
      </TabsContent>

    </Tabs>
  )
}

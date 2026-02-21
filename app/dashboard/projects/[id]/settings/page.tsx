"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  useProjectSettings,
  useSaveSettings,
  useCrawlMeta,
  useCrawlSite,
  useDiscordGuilds,
  useSelectGuild,
  type SaveSettingsPayload,
} from "@/hooks/use-settings"
import { GeneralTab } from "@/components/settings/general-tab"
import { DiscordTab } from "@/components/settings/discord-tab"
import { WidgetTab } from "@/components/settings/widget-tab"
import { AITab } from "@/components/settings/ai-tab"
import { GuildPickerDialog } from "@/components/settings/guild-picker-dialog"
import { useSettingsStore } from "@/stores/settings-store"

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  const { data: settings, isLoading } = useProjectSettings(id)
  const saveSettings = useSaveSettings(id)
  const { data: channels } = useQuery({
    queryKey: ["channels", id, settings?.discord?.guildId],
    queryFn: () =>
      fetch(`/api/projects/${id}/discord/channels`).then((r) => r.json()),
    enabled: !!id && !!settings?.discord?.guildId,
  })
  const { data: crawlMeta } = useCrawlMeta(id)
  const crawlSite = useCrawlSite(id)
  const { guilds, loading: loadingGuilds, fetchGuilds } = useDiscordGuilds(id)
  const selectGuild = useSelectGuild(id)

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
    showGuildPicker,
    setShowGuildPicker,
    hydrate,
  } = useSettingsStore()

  useEffect(() => {
    hydrate(settings ?? null)
  }, [settings, hydrate])

  const handleSave = () => {
    if (!domain.trim()) {
      toast.error("Domain is required")
      return
    }
    const selectedChannel = channels?.find(
      (c: { id: string; name: string }) => c.id === channelId
    )
    const payload: SaveSettingsPayload = {
      name: projectName,
      domain,
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
      ...(channelId && {
        discord: {
          channelId,
          channelName: selectedChannel?.name,
        },
      }),
    }
    saveSettings.mutate(payload)
  }

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

  const handleOpenGuildPicker = () => {
    setShowGuildPicker(true)
    fetchGuilds()
  }

  const handleSelectGuild = (guild: { id: string; name: string }) => {
    selectGuild.mutate(guild, {
      onSuccess: () => setShowGuildPicker(false),
    })
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
          onOpenGuildPicker={handleOpenGuildPicker}
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

      <GuildPickerDialog
        open={showGuildPicker}
        onOpenChange={setShowGuildPicker}
        guilds={guilds}
        loading={loadingGuilds}
        onRefresh={fetchGuilds}
        onSelectGuild={handleSelectGuild}
        savingGuild={selectGuild.isPending}
        currentGuildId={settings?.discord?.guildId}
        onOpenBotInvite={handleOpenBotInvite}
      />
    </Tabs>
  )
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
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
import { DEFAULT_GROQ_MODEL_ID } from "@/lib/groq-models"

const DEFAULT_AI_PROMPT =
  "You are a friendly and helpful customer support assistant. Answer the visitor's question concisely. If you don't know the answer, let them know a human agent will follow up."

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

  const [projectName, setProjectName] = useState("")
  const [domain, setDomain] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#5865F2")
  const [position, setPosition] = useState("bottom-right")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [offlineMessage, setOfflineMessage] = useState("")
  const [bubbleShape, setBubbleShape] = useState("rounded")
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiSystemPrompt, setAiSystemPrompt] = useState(DEFAULT_AI_PROMPT)
  const [aiModel, setAiModel] = useState(DEFAULT_GROQ_MODEL_ID)
  const [channelId, setChannelId] = useState("")
  const [showGuildPicker, setShowGuildPicker] = useState(false)

  useEffect(() => {
    if (settings) {
      setProjectName(settings.project?.name || "")
      setDomain(settings.project?.domain || "")
      setPrimaryColor(settings.widget?.primaryColor || "#5865F2")
      setPosition(settings.widget?.position || "bottom-right")
      setWelcomeMessage(settings.widget?.welcomeMessage || "")
      setOfflineMessage(settings.widget?.offlineMessage || "")
      setBubbleShape(settings.widget?.bubbleShape || "rounded")
      setAiEnabled(settings.widget?.aiEnabled ?? false)
      setAiSystemPrompt(settings.widget?.aiSystemPrompt || DEFAULT_AI_PROMPT)
      setAiModel(settings.widget?.aiModel || DEFAULT_GROQ_MODEL_ID)
      setChannelId(settings.discord?.channelId || "")
    }
  }, [settings])

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

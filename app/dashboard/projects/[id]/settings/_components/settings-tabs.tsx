"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralTab } from "./general-tab"
import { DiscordTab } from "./discord-tab"
import { WidgetTab } from "./widget-tab"

type Guild = {
  id: string
  name: string
  icon: string | null
  owner?: boolean
  hasBot?: boolean
}

interface SettingsTabsProps {
  projectId: string
  project: { name: string; domain: string | null }
  widget: {
    primaryColor: string
    position: string
    welcomeMessage: string
    offlineMessage: string
    bubbleShape: string
  }
  discord: {
    guildId: string
    guildName: string
    channelId?: string
    channelName?: string
  } | null
  guilds: Guild[]
}

export function SettingsTabs({
  projectId,
  project,
  widget,
  discord,
  guilds,
}: SettingsTabsProps) {
  return (
    <Tabs defaultValue="discord" className="space-y-6">
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

      <TabsContent value="general">
        <GeneralTab
          projectId={projectId}
          initialName={project.name}
          initialDomain={project.domain ?? ""}
        />
      </TabsContent>

      <TabsContent value="discord">
        <DiscordTab
          projectId={projectId}
          initialGuild={discord}
          initialGuilds={guilds}
        />
      </TabsContent>

      <TabsContent value="widget">
        <WidgetTab projectId={projectId} initialWidget={widget} />
      </TabsContent>
    </Tabs>
  )
}

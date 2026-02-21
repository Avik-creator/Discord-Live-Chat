"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export type SettingsData = {
  project: { name: string; domain: string | null }
  widget: {
    primaryColor: string
    position: string
    welcomeMessage: string
    offlineMessage: string
    bubbleShape: string
    aiEnabled: boolean
    aiSystemPrompt: string
    aiModel: string
  } | null
  discord: {
    guildId: string
    guildName: string
    channelId: string | null
    channelName: string | null
  } | null
}

export function useProjectSettings(projectId: string | undefined) {
  return useQuery({
    queryKey: ["settings", projectId],
    queryFn: async (): Promise<SettingsData> => {
      const res = await fetch(`/api/projects/${projectId}/settings`)
      if (!res.ok) throw new Error("Failed to fetch settings")
      return res.json()
    },
    enabled: !!projectId,
  })
}

export type SaveSettingsPayload = {
  name: string
  domain: string
  widget: {
    primaryColor: string
    position: string
    welcomeMessage: string
    offlineMessage: string
    bubbleShape: string
    aiEnabled: boolean
    aiSystemPrompt: string
    aiModel: string
  }
  discord?: { channelId: string; channelName?: string }
}

export function useSaveSettings(projectId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveSettingsPayload) => {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", projectId] })
      toast.success("Settings saved")
    },
    onError: () => {
      toast.error("Failed to save settings")
    },
  })
}

export type CrawlMeta = {
  pages: { url: string; title: string; charCount: number }[]
  totalChars: number
  crawledAt: string | null
}

export function useCrawlMeta(projectId: string | undefined) {
  return useQuery({
    queryKey: ["crawl", projectId],
    queryFn: async (): Promise<CrawlMeta> => {
      const res = await fetch(`/api/projects/${projectId}/crawl`)
      if (!res.ok) throw new Error("Failed to fetch crawl meta")
      return res.json()
    },
    enabled: !!projectId,
  })
}

export function useCrawlSite(projectId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/crawl`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Crawl failed")
      }
      return res.json() as Promise<{ pages: unknown[] }>
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["crawl", projectId] })
      toast.success(`Crawled ${result.pages.length} page(s) successfully`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to crawl site")
    },
  })
}


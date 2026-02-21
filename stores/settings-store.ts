import { create } from "zustand"
import { DEFAULT_GROQ_MODEL_ID, getValidGroqModelId } from "@/lib/groq-models"
import type { SettingsData } from "@/hooks/use-settings"

const DEFAULT_AI_PROMPT =
  "You are a friendly and helpful customer support assistant. Answer the visitor's question concisely. If you don't know the answer, let them know a human agent will follow up."

export type SettingsFormState = {
  projectName: string
  domain: string
  primaryColor: string
  position: string
  welcomeMessage: string
  offlineMessage: string
  bubbleShape: string
  aiEnabled: boolean
  aiSystemPrompt: string
  aiModel: string
  channelId: string
  showGuildPicker: boolean
}

const getInitialState = (): SettingsFormState => ({
  projectName: "",
  domain: "",
  primaryColor: "#5865F2",
  position: "bottom-right",
  welcomeMessage: "",
  offlineMessage: "",
  bubbleShape: "rounded",
  aiEnabled: false,
  aiSystemPrompt: DEFAULT_AI_PROMPT,
  aiModel: DEFAULT_GROQ_MODEL_ID,
  channelId: "",
  showGuildPicker: false,
})

type SettingsStore = SettingsFormState & {
  setProjectName: (v: string) => void
  setDomain: (v: string) => void
  setPrimaryColor: (v: string) => void
  setPosition: (v: string) => void
  setWelcomeMessage: (v: string) => void
  setOfflineMessage: (v: string) => void
  setBubbleShape: (v: string) => void
  setAiEnabled: (v: boolean) => void
  setAiSystemPrompt: (v: string) => void
  setAiModel: (v: string) => void
  setChannelId: (v: string) => void
  setShowGuildPicker: (v: boolean) => void
  hydrate: (settings: SettingsData | null) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...getInitialState(),

  setProjectName: (projectName) => set({ projectName }),
  setDomain: (domain) => set({ domain }),
  setPrimaryColor: (primaryColor) => set({ primaryColor }),
  setPosition: (position) => set({ position }),
  setWelcomeMessage: (welcomeMessage) => set({ welcomeMessage }),
  setOfflineMessage: (offlineMessage) => set({ offlineMessage }),
  setBubbleShape: (bubbleShape) => set({ bubbleShape }),
  setAiEnabled: (aiEnabled) => set({ aiEnabled }),
  setAiSystemPrompt: (aiSystemPrompt) => set({ aiSystemPrompt }),
  setAiModel: (aiModel) => set({ aiModel }),
  setChannelId: (channelId) => set({ channelId }),
  setShowGuildPicker: (showGuildPicker) => set({ showGuildPicker }),

  hydrate: (settings) => {
    if (!settings) {
      set(getInitialState())
      return
    }
    set({
      projectName: settings.project?.name || "",
      domain: settings.project?.domain || "",
      primaryColor: settings.widget?.primaryColor || "#5865F2",
      position: settings.widget?.position || "bottom-right",
      welcomeMessage: settings.widget?.welcomeMessage || "",
      offlineMessage: settings.widget?.offlineMessage || "",
      bubbleShape: settings.widget?.bubbleShape || "rounded",
      aiEnabled: settings.widget?.aiEnabled ?? false,
      aiSystemPrompt: settings.widget?.aiSystemPrompt || DEFAULT_AI_PROMPT,
      aiModel: getValidGroqModelId(settings.widget?.aiModel),
      channelId: settings.discord?.channelId || "",
    })
  },

  reset: () => set(getInitialState()),
}))

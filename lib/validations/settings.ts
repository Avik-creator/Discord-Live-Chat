import { z } from "zod"
import { GROQ_MODELS } from "@/lib/groq-models"

const groqModelIds = GROQ_MODELS.map((m) => m.id)

export const settingsFormSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name is too long"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(253, "Domain is too long")
    .refine(
      (v) => {
        if (!v) return false
        try {
          new URL(v.startsWith("http") ? v : `https://${v}`)
          return true
        } catch {
          return false
        }
      },
      { message: "Enter a valid domain (e.g. example.com)" }
    ),
  widget: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    position: z.enum(["bottom-left", "bottom-right", "top-left", "top-right"]),
    welcomeMessage: z.string().max(500),
    offlineMessage: z.string().max(500),
    bubbleShape: z.enum(["rounded", "sharp", "pill", "cloud"]),
    aiEnabled: z.boolean(),
    aiSystemPrompt: z.string().max(4000),
    aiModel: z.string().refine((id) => groqModelIds.includes(id), {
      message: "Invalid AI model",
    }),
  }),
  discord: z
    .object({
      channelId: z.string().min(1),
      channelName: z.string().optional(),
    })
    .optional(),
})

export type SettingsFormValues = z.infer<typeof settingsFormSchema>

/** Normalize domain for validation (allow with or without protocol) */
export function normalizeDomainForValidation(domain: string): string {
  const trimmed = domain.trim()
  if (!trimmed) return trimmed
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
}

import { z } from "zod"
import { GROQ_MODELS } from "@/lib/groq-models"

const groqModelIds = GROQ_MODELS.map((m) => m.id)

const DOMAIN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/

/** Strip protocol, port, path — keep only the hostname. */
function extractDomain(input: string): string {
  let value = input.trim().toLowerCase()
  value = value.replace(/^https?:\/\//, "")
  value = value.split(/[/:?#]/)[0]
  value = value.replace(/\.$/, "")
  return value
}

export const settingsFormSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name is too long"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(253, "Domain is too long")
    .transform(extractDomain)
    .refine((d) => DOMAIN_REGEX.test(d), {
      message: "Enter a valid domain (e.g. example.com)",
    }),
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

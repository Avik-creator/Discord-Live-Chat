import { z } from "zod"

const domainRefine = (v: string) => {
  if (!v || !v.trim()) return false
  try {
    new URL(v.startsWith("http") ? v : `https://${v}`)
    return true
  } catch {
    return false
  }
}

/** Schema for creating a project (name + domain required). */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name is too long"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(253, "Domain is too long")
    .refine(domainRefine, {
      message: "Enter a valid domain (e.g. example.com)",
    }),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

/** Normalize domain for validation (allow with or without protocol). */
export function normalizeProjectDomain(domain: string): string {
  const trimmed = domain.trim()
  if (!trimmed) return trimmed
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
}

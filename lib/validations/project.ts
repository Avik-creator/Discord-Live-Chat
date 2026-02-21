import { z } from "zod"

/**
 * Matches a valid domain like example.com, sub.example.co.uk, my-app.io
 * - Each label: alphanumeric + hyphens, no leading/trailing hyphen, 1-63 chars
 * - At least two labels (host + TLD)
 * - TLD: letters only, 2-63 chars
 */
const DOMAIN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/

/** Strip protocol, trailing slash, path, port — keep only the hostname. */
function extractDomain(input: string): string {
  let value = input.trim().toLowerCase()
  // Remove protocol
  value = value.replace(/^https?:\/\//, "")
  // Remove port, path, query, fragment
  value = value.split(/[/:?#]/)[0]
  // Remove trailing dot (FQDN)
  value = value.replace(/\.$/, "")
  return value
}

export const createProjectSchema = z.object({
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
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

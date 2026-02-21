/**
 * Site crawler utility.
 *
 * Crawls a domain's pages, extracts clean text content, and caches it in
 * Upstash Redis so the AI auto-reply has real-time knowledge of the site.
 *
 * Flow:
 * 1. Try to find /sitemap.xml -- parse URLs from it.
 * 2. If no sitemap, fall back to crawling the homepage and extracting internal links.
 * 3. Fetch each page, strip HTML to plain text, truncate to keep within token limits.
 * 4. Store the aggregated context in Redis with a configurable TTL (default 1 hour).
 */

import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const CACHE_PREFIX = "bridgecord:site:"
const CACHE_TTL = 3600 // 1 hour
const MAX_PAGES = 15 // Max pages to crawl
const MAX_CHARS_PER_PAGE = 3000 // Truncate each page's text
const MAX_TOTAL_CHARS = 30000 // Total context limit (~7500 tokens)

export interface CrawlResult {
  pages: { url: string; title: string; charCount: number }[]
  totalChars: number
  crawledAt: string
}

/**
 * Strip HTML tags and collapse whitespace into clean readable text.
 */
function htmlToText(html: string): string {
  return html
    // Remove script/style/noscript blocks entirely
    .replace(/<(script|style|noscript|svg|head)[^>]*>[\s\S]*?<\/\1>/gi, "")
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Replace block-level tags with newlines
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article|header|footer)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Remove all remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode common entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Collapse whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim()
}

/**
 * Extract the <title> from an HTML string.
 */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? match[1].trim() : ""
}

/**
 * Parse URLs from a sitemap XML string.
 */
function parseSitemap(xml: string): string[] {
  const urls: string[] = []
  const regex = /<loc>\s*(.*?)\s*<\/loc>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(xml)) !== null) {
    const url = match[1].trim()
    // Skip images, PDFs, and other non-page resources
    if (!/\.(jpg|jpeg|png|gif|svg|pdf|zip|mp4|mp3|css|js)(\?|$)/i.test(url)) {
      urls.push(url)
    }
  }
  return urls
}

/**
 * Extract internal links from an HTML page.
 */
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl)
  const links: string[] = []
  const regex = /href=["']([^"'#]+)["']/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl)
      if (
        url.hostname === base.hostname &&
        !url.pathname.match(/\.(jpg|jpeg|png|gif|svg|pdf|zip|mp4|mp3|css|js)$/i) &&
        !links.includes(url.origin + url.pathname)
      ) {
        links.push(url.origin + url.pathname)
      }
    } catch {
      // skip invalid URLs
    }
  }
  return links
}

/**
 * Fetch a URL with a timeout. Returns null on failure.
 */
async function safeFetch(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Bridgecord-Crawler/1.0",
        Accept: "text/html, application/xml, text/xml",
      },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/**
 * Crawl a domain, extract page content, and cache it in Redis.
 * Returns the crawl result with page metadata.
 */
export async function crawlSite(
  projectId: string,
  domain: string
): Promise<CrawlResult> {
  // Normalize domain to a full URL
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`
  const origin = new URL(baseUrl).origin

  // 1. Try to find pages via sitemap
  let pageUrls: string[] = []

  const sitemapXml = await safeFetch(`${origin}/sitemap.xml`)
  if (sitemapXml && sitemapXml.includes("<loc>")) {
    pageUrls = parseSitemap(sitemapXml)
  }

  // 2. If no sitemap, crawl the homepage and extract links
  if (pageUrls.length === 0) {
    const homepageHtml = await safeFetch(origin)
    if (homepageHtml) {
      pageUrls = [origin, ...extractInternalLinks(homepageHtml, origin)]
    }
  }

  // Deduplicate and limit
  pageUrls = [...new Set(pageUrls)].slice(0, MAX_PAGES)

  // 3. Fetch each page and extract text
  const pages: { url: string; title: string; text: string; charCount: number }[] = []
  let totalChars = 0

  const fetchPromises = pageUrls.map(async (url) => {
    const html = await safeFetch(url)
    if (!html) return null

    const title = extractTitle(html) || url
    let text = htmlToText(html)
    if (text.length > MAX_CHARS_PER_PAGE) {
      text = text.slice(0, MAX_CHARS_PER_PAGE) + "..."
    }

    return { url, title, text, charCount: text.length }
  })

  const results = await Promise.all(fetchPromises)
  for (const result of results) {
    if (!result || totalChars >= MAX_TOTAL_CHARS) continue
    // Truncate if adding this page would exceed total limit
    if (totalChars + result.charCount > MAX_TOTAL_CHARS) {
      result.text = result.text.slice(0, MAX_TOTAL_CHARS - totalChars) + "..."
      result.charCount = result.text.length
    }
    pages.push(result)
    totalChars += result.charCount
  }

  // 4. Build context string and cache in Redis
  const contextParts = pages.map(
    (p) => `--- Page: ${p.title} (${p.url}) ---\n${p.text}`
  )
  const contextString = contextParts.join("\n\n")
  const crawledAt = new Date().toISOString()

  const cacheKey = `${CACHE_PREFIX}${projectId}`
  await redis.set(
    cacheKey,
    JSON.stringify({ context: contextString, crawledAt }),
    { ex: CACHE_TTL }
  )

  // Also store page metadata for the UI
  const metaKey = `${CACHE_PREFIX}${projectId}:meta`
  const meta: CrawlResult = {
    pages: pages.map((p) => ({ url: p.url, title: p.title, charCount: p.charCount })),
    totalChars,
    crawledAt,
  }
  await redis.set(metaKey, JSON.stringify(meta), { ex: CACHE_TTL })

  return meta
}

/**
 * Get the cached site context for a project.
 * If the cache has expired, triggers a background re-crawl automatically
 * using the project's domain so the AI always has fresh site knowledge.
 * Returns the context string or null if not cached and no domain is set.
 */
export async function getSiteContext(
  projectId: string
): Promise<string | null> {
  const cacheKey = `${CACHE_PREFIX}${projectId}`
  const raw = await redis.get<string>(cacheKey)

  if (raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
      return (parsed as { context: string }).context || null
    } catch {
      return null
    }
  }

  // Cache expired or missing -- auto-recrawl in background if domain exists
  // We use a lock key to prevent multiple simultaneous re-crawls
  const lockKey = `${CACHE_PREFIX}${projectId}:recrawl-lock`
  const locked = await redis.set(lockKey, "1", { ex: 120, nx: true })

  if (locked) {
    // Fire-and-forget: recrawl in the background
    recrawlInBackground(projectId).catch((err) =>
      console.error("[bridgecord] Background recrawl failed:", err)
    )
  }

  return null
}

/**
 * Background re-crawl: looks up the project domain from the DB and re-crawls.
 */
async function recrawlInBackground(projectId: string): Promise<void> {
  // Dynamic import to avoid circular dependency with db
  const { db } = await import("@/lib/db")
  const { projects } = await import("@/lib/db/schema")
  const { eq } = await import("drizzle-orm")

  const [project] = await db
    .select({ domain: projects.domain })
    .from(projects)
    .where(eq(projects.id, projectId))

  if (!project?.domain) return

  await crawlSite(projectId, project.domain)
}

/**
 * Get the cached crawl metadata for a project.
 */
export async function getCrawlMeta(
  projectId: string
): Promise<CrawlResult | null> {
  const metaKey = `${CACHE_PREFIX}${projectId}:meta`
  const raw = await redis.get<string>(metaKey)
  if (!raw) return null

  try {
    return typeof raw === "string" ? JSON.parse(raw) : (raw as CrawlResult)
  } catch {
    return null
  }
}

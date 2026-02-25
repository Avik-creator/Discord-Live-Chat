/**
 * Site crawler utility.
 *
 * Crawls a domain's pages, extracts clean text content, chunks it, and caches
 * in Upstash Redis. The AI receives only relevant chunks per query instead
 * of the full dump.
 *
 * Flow:
 * 1. Try to find /sitemap.xml -- parse URLs from it.
 * 2. If no sitemap, fall back to crawling the homepage and extracting internal links.
 * 3. Fetch each page, strip HTML to plain text, chunk with overlap.
 * 4. Store chunks in Redis for keyword-based retrieval.
 */

import { Redis } from "@upstash/redis"
import { chunkText, type SiteChunk } from "@/lib/chunks"
import { generateEmbedding, generateEmbeddings } from "@/lib/embeddings"
import { index } from "@/lib/vector-store"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const CACHE_PREFIX = "bridgecord:site:"
const CACHE_TTL = 3600 // 1 hour
const MAX_PAGES = 30 // Max pages to crawl
const MAX_CHARS_PER_PAGE = 4000 // Per page before truncation (then chunked)
const MAX_TOTAL_CHARS = 80000 // Total raw text across pages before we stop adding
const MAX_CONCURRENT = 3 // Limit concurrent requests
const MAX_RETRIES = 2 // Retry failed requests
const CRAWL_DELAY_MS = 500 // Delay between batches

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
 * Normalize URL - remove fragments, trailing slashes, and query params that aren't meaningful
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove trailing slash (except for root)
    let path = parsed.pathname.replace(/\/+$/, "") || "/"
    // Keep only essential query params (like ?lang=en)
    const importantParams = ["lang", "locale", "language"]
    const searchParams = new URLSearchParams()
    for (const [key, value] of parsed.searchParams) {
      if (importantParams.includes(key.toLowerCase())) {
        searchParams.append(key, value)
      }
    }
    return `${parsed.origin}${path}${searchParams.toString() ? "?" + searchParams.toString() : ""}`
  } catch {
    return url
  }
}

/**
 * Check if URL is allowed by robots.txt
 */
const robotsCache = new Map<string, Set<string>>()
async function isAllowedByRobots(url: string): Promise<boolean> {
  const origin = new URL(url).origin
  const robotsUrl = `${origin}/robots.txt`
  
  let disallowed: Set<string>
  if (robotsCache.has(origin)) {
    disallowed = robotsCache.get(origin)!
  } else {
    try {
      const res = await fetch(robotsUrl, { headers: { "User-Agent": "Bridgecord-Crawler/1.0" } })
      if (!res.ok) {
        disallowed = new Set()
      } else {
        const text = await res.text()
        disallowed = new Set()
        const lines = text.split("\n")
        let userAgent = ""
        for (const line of lines) {
          const trimmed = line.trim().toLowerCase()
          if (trimmed.startsWith("user-agent:")) {
            userAgent = trimmed.substring(11).trim()
          } else if (trimmed.startsWith("disallow:") && (userAgent === "" || userAgent === "bridgecord-crawler/1.0" || userAgent === "*")) {
            const path = trimmed.substring(9).trim()
            if (path) disallowed.add(path)
          }
        }
      }
      robotsCache.set(origin, disallowed)
    } catch {
      disallowed = new Set()
      robotsCache.set(origin, disallowed)
    }
  }
  
  const path = new URL(url).pathname
  for (const disallow of disallowed) {
    if (path.startsWith(disallow)) return false
  }
  return true
}

/**
 * Fetch a URL with timeout and retry logic. Returns null on failure.
 */
async function safeFetch(url: string, timeoutMs = 8000): Promise<string | null> {
  // Check robots.txt first
  if (!(await isAllowedByRobots(url))) {
    return null
  }
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  return null
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

  // 1. Try to find pages via sitemap (including sitemap index)
  let pageUrls: string[] = []

  const sitemapXml = await safeFetch(`${origin}/sitemap.xml`)
  if (sitemapXml && sitemapXml.includes("<loc>")) {
    // Check if it's a sitemap index
    if (sitemapXml.includes("<sitemapindex")) {
      const sitemapUrls = parseSitemap(sitemapXml)
      for (const smUrl of sitemapUrls.slice(0, 5)) {
        const smContent = await safeFetch(smUrl)
        if (smContent) {
          pageUrls.push(...parseSitemap(smContent))
        }
      }
    } else {
      pageUrls = parseSitemap(sitemapXml)
    }
  }

  // 2. If no sitemap, crawl the homepage and extract links
  if (pageUrls.length === 0) {
    const homepageHtml = await safeFetch(origin)
    if (homepageHtml) {
      pageUrls = [origin, ...extractInternalLinks(homepageHtml, origin)]
    }
  }

  // Deduplicate, normalize, and limit
  pageUrls = [...new Set(pageUrls.map(normalizeUrl))].slice(0, MAX_PAGES)

  // 3. Fetch each page and extract text (with concurrency limit)
  const pages: { url: string; title: string; text: string; charCount: number }[] = []
  let totalChars = 0

  for (let i = 0; i < pageUrls.length; i += MAX_CONCURRENT) {
    const batch = pageUrls.slice(i, i + MAX_CONCURRENT)
    
    const fetchPromises = batch.map(async (url) => {
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
      if (totalChars + result.charCount > MAX_TOTAL_CHARS) {
        result.text = result.text.slice(0, MAX_TOTAL_CHARS - totalChars) + "..."
        result.charCount = result.text.length
      }
      pages.push(result)
      totalChars += result.charCount
    }

    // Add delay between batches to be respectful
    if (i + MAX_CONCURRENT < pageUrls.length) {
      await new Promise((r) => setTimeout(r, CRAWL_DELAY_MS))
    }
  }

  // 4. Chunk each page's text and collect all chunks
  const allChunks: SiteChunk[] = []
  for (const p of pages) {
    const pageChunks = chunkText(p.text)
    pageChunks.forEach((text, i) => {
      const id = `${projectId}:${encodeURIComponent(p.url)}:${i}`
      allChunks.push({
        id,
        text,
        url: p.url,
        title: p.title,
      })
    })
  }

  // 5. Clear old vectors and generate new embeddings
  if (allChunks.length > 0) {
    try {
      const namespace = `crawl:${projectId}`
      
      // Delete old vectors for this project
      try {
        await index.delete({ filter: `projectId = "${projectId}"` }, { namespace })
      } catch {
        // Index may be empty, continue
      }

      const texts = allChunks.map((c) => c.text)
      const embeddings = await generateEmbeddings(texts)

      const vectors = allChunks.map((chunk, i) => ({
        id: chunk.id,
        vector: embeddings[i],
        metadata: {
          text: chunk.text,
          url: chunk.url,
          title: chunk.title,
          projectId,
        } as Record<string, unknown>,
      }))

      await index.upsert(vectors as Parameters<typeof index.upsert>[0], { namespace })
    } catch (err) {
      console.error("[bridgecord] Failed to generate embeddings:", err)
    }
  }

  const crawledAt = new Date().toISOString()

  const chunksKey = `${CACHE_PREFIX}${projectId}:chunks`
  await redis.set(chunksKey, JSON.stringify(allChunks), { ex: CACHE_TTL })

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
 * Get the cached site context for a project (legacy full-context form).
 * Prefer getRelevantSiteContext(projectId, query) so the AI gets only relevant chunks.
 * If the cache has expired, triggers a background re-crawl.
 * Returns the context string or null if not cached.
 */
export async function getSiteContext(
  projectId: string
): Promise<string | null> {
  const chunksKey = `${CACHE_PREFIX}${projectId}:chunks`
  const raw = await redis.get<string>(chunksKey)
  if (raw) {
    try {
      const chunks: SiteChunk[] =
        typeof raw === "string" ? JSON.parse(raw) : (raw as SiteChunk[])
      if (Array.isArray(chunks) && chunks.length > 0) {
        const parts = chunks
          .slice(0, 15)
          .map((c) => `--- ${c.title} (${c.url}) ---\n${c.text}`)
        return parts.join("\n\n")
      }
    } catch {
      // fall through
    }
  }

  const lockKey = `${CACHE_PREFIX}${projectId}:recrawl-lock`
  const locked = await redis.set(lockKey, "1", { ex: 120, nx: true })
  if (locked) {
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

export interface CrawlSearchResult {
  id: string
  text: string
  url: string
  title: string
  score: number
}

export async function searchCrawledContent(
  projectId: string,
  query: string,
  limit: number = 5
): Promise<CrawlSearchResult[]> {
  try {
    const queryEmbedding = await generateEmbedding(query)
    const namespace = `crawl:${projectId}`

    const results = await index.query({
      vector: queryEmbedding,
      topK: limit,
      includeVectors: false,
      includeMetadata: true,
    })

    return results.map((r) => ({
      id: String(r.id),
      text: (r.metadata as { text?: string })?.text ?? "",
      url: (r.metadata as { url?: string })?.url ?? "",
      title: (r.metadata as { title?: string })?.title ?? "",
      score: r.score,
    }))
  } catch (err) {
    console.error("[bridgecord] Search failed:", err)
    return []
  }
}

/**
 * Chunking and retrieval for crawled site content.
 * Chunks are stored in Redis (and optionally Upstash Vector) so the AI
 * receives only relevant chunks per query instead of the full dump.
 */

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 80
const MAX_CHUNKS_TO_SEND = 10
const MAX_CONTEXT_CHARS = 8000

export type SiteChunk = {
  id: string
  text: string
  url: string
  title: string
}

/**
 * Split text into overlapping chunks for better retrieval.
 * Prefers paragraph boundaries when possible.
 */
export function chunkText(
  text: string,
  options: { size?: number; overlap?: number } = {}
): string[] {
  const size = options.size ?? CHUNK_SIZE
  const overlap = options.overlap ?? CHUNK_OVERLAP
  const chunks: string[] = []

  // First split by double newline (paragraphs)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

  let current = ""
  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (current.length + trimmed.length + 2 <= size) {
      current = current ? `${current}\n\n${trimmed}` : trimmed
      continue
    }
    // Flush current if we have content
    if (current) {
      chunks.push(current)
      const overlapStart = Math.max(0, current.length - overlap)
      current = current.slice(overlapStart)
    }
    // If single paragraph is longer than size, split by sentences or fixed size
    if (trimmed.length > size) {
      const subChunks = fixedSizeChunks(trimmed, size, overlap)
      for (let i = 0; i < subChunks.length; i++) {
        if (i === subChunks.length - 1 && subChunks[i].length < size * 0.6) {
          current = subChunks[i]
        } else {
          chunks.push(subChunks[i])
        }
      }
    } else {
      current = trimmed
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function fixedSizeChunks(
  text: string,
  size: number,
  overlap: number
): string[] {
  const out: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + size, text.length)
    let slice = text.slice(start, end)
    if (end < text.length) {
      const lastSpace = slice.lastIndexOf(" ")
      if (lastSpace > size * 0.5) {
        end = start + lastSpace + 1
        slice = text.slice(start, end)
      }
    }
    out.push(slice.trim())
    start = end - (end < text.length ? overlap : 0)
  }
  return out
}

/**
 * Score a chunk by how many query terms (words) it contains.
 * Returns a simple relevance score for keyword fallback when Vector is not used.
 */
function keywordScore(chunkText: string, query: string): number {
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)
  if (words.length === 0) return 0
  const lower = chunkText.toLowerCase()
  let hits = 0
  for (const w of words) {
    if (lower.includes(w)) hits++
  }
  return hits / words.length
}

/**
 * Get only the chunks relevant to the current query.
 * Uses Upstash Vector semantic search when configured, otherwise
 * Redis-stored chunks + keyword scoring.
 */
export async function getRelevantSiteContext(
  projectId: string,
  query: string,
  options: { topK?: number; maxChars?: number } = {}
): Promise<string | null> {
  const topK = options.topK ?? MAX_CHUNKS_TO_SEND
  const maxChars = options.maxChars ?? MAX_CONTEXT_CHARS

  const { Redis } = await import("@upstash/redis")
  const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })

  const chunksKey = `bridgecord:site:${projectId}:chunks`
  const raw = await redis.get<string>(chunksKey)
  if (!raw) return null

  let chunks: SiteChunk[]
  try {
    chunks = typeof raw === "string" ? JSON.parse(raw) : (raw as SiteChunk[])
  } catch {
    return null
  }
  if (!Array.isArray(chunks) || chunks.length === 0) return null

  const queryTrimmed = query.trim()
  let selected: SiteChunk[] = []

  if (
    process.env.UPSTASH_VECTOR_REST_URL &&
    process.env.UPSTASH_VECTOR_REST_TOKEN &&
    queryTrimmed.length > 0
  ) {
    try {
      const { Index } = await import("@upstash/vector")
      const index = new Index()
      const namespace = `project_${projectId}`
      const results = await index.query({
        data: queryTrimmed,
        topK,
        includeMetadata: true,
        includeData: true,
      }, { namespace } as { namespace: string })

      if (results && results.length > 0) {
        const idSet = new Set(results.map((r) => r.id))
        selected = chunks.filter((c) => idSet.has(c.id))
        if (
          selected.length === 0 &&
          results[0].metadata &&
          typeof results[0].id === "string"
        ) {
          selected = results
            .filter(
              (r) =>
                r.data &&
                typeof r.data === "string" &&
                typeof r.id === "string"
            )
            .map((r) => ({
              id: r.id as string,
              text: r.data as string,
              url: (r.metadata as { url?: string })?.url ?? "",
              title: (r.metadata as { title?: string })?.title ?? "",
            }))
        }
      }
    } catch (err) {
      console.error("[bridgecord] Vector query failed, falling back to keyword:", err)
    }
  }

  if (selected.length === 0 && queryTrimmed.length > 0) {
    const scored = chunks.map((c) => ({
      chunk: c,
      score: keywordScore(c.text, queryTrimmed),
    }))
    scored.sort((a, b) => b.score - a.score)
    selected = scored
      .filter((s) => s.score > 0)
      .slice(0, topK)
      .map((s) => s.chunk)
  }

  if (selected.length === 0) {
    selected = chunks.slice(0, topK)
  }

  let total = 0
  const parts: string[] = []
  for (const c of selected) {
    if (total + c.text.length > maxChars) break
    parts.push(`--- ${c.title} (${c.url}) ---\n${c.text}`)
    total += c.text.length
  }

  if (parts.length === 0) return null
  return parts.join("\n\n")
}

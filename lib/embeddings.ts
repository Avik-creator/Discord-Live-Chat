import { google } from "@ai-sdk/google"
import { embed, embedMany } from "ai"

const EMBEDDING_MODEL = "gemini-embedding-001"
const DIMENSIONS = 768

/**
 * Embed a single text string (e.g. a user query).
 * Uses Google's text-embedding-004 model via the AI SDK.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embedding(EMBEDDING_MODEL),
    value: text,
    providerOptions: {
      google: {
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: DIMENSIONS,
      },
    },
  })
  return embedding
}

/**
 * Embed multiple text strings in a batch (e.g. crawled chunks).
 * Uses Google's text-embedding-004 model via the AI SDK.
 */
export async function embedChunks(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const { embeddings } = await embedMany({
    model: google.embedding(EMBEDDING_MODEL),
    values: texts,
    providerOptions: {
      google: {
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: DIMENSIONS,
      },
    },
  })
  return embeddings
}

/** The dimension count used by our embedding model (for creating the Upstash Vector index). */
export const EMBEDDING_DIMENSIONS = DIMENSIONS

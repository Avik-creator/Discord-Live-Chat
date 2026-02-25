import { Index } from "@upstash/vector";
import { generateEmbedding, generateEmbeddings } from "./embeddings";

export type MemoryMetadata = {
  userId: string;
  tier: "short" | "long";
  content: string;
  createdAt: number;
};

const index = new Index<MemoryMetadata>({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export { index };

export async function storeMemory(
  content: string,
  userId: string,
  tier: "short" | "long",
  memoryId: string
): Promise<void> {
  const embedding = await generateEmbedding(content);

  await index.upsert({
    id: memoryId,
    vector: embedding,
    metadata: {
      userId,
      tier,
      content,
      createdAt: Date.now(),
    },
  });
}

export async function storeMemories(
  memories: Array<{
    id: string;
    content: string;
    userId: string;
    tier: "short" | "long";
  }>
): Promise<void> {
  const contents = memories.map((m) => m.content);
  const embeddings = await generateEmbeddings(contents);

  const upserts = memories.map((memory, i) => ({
    id: memory.id,
    vector: embeddings[i],
    metadata: {
      userId: memory.userId,
      tier: memory.tier,
      content: memory.content,
      createdAt: Date.now(),
    } as MemoryMetadata,
  }));

  await Promise.all(upserts.map((u) => index.upsert(u)));
}

export async function searchMemories(
  query: string,
  userId: string,
  tier: "short" | "long",
  limit: number = 10
): Promise<Array<{ id: string; content: string; score: number }>> {
  const queryEmbedding = await generateEmbedding(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK: limit,
    filter: `userId = "${userId}" AND tier = "${tier}"`,
    includeVectors: false,
    includeMetadata: true,
  });

  return results.map((r) => ({
    id: String(r.id),
    content: r.metadata?.content ?? "",
    score: r.score,
  }));
}

export async function updateMemoryVector(
  memoryId: string,
  content: string,
  userId: string,
  tier: "short" | "long"
): Promise<void> {
  await storeMemory(content, userId, tier, memoryId);
}

export async function deleteMemory(memoryId: string): Promise<void> {
  await index.delete(memoryId);
}

export async function deleteMemories(memoryIds: string[]): Promise<void> {
  await Promise.all(memoryIds.map((id) => index.delete(id)));
}

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const CLOUDFLARE_EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error(
      "Cloudflare credentials not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN"
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${CLOUDFLARE_EMBEDDING_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare API failed: ${data.errors?.[0]?.message}`);
  }

  return data.result.data[0] ?? [];
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error(
      "Cloudflare credentials not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN"
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${CLOUDFLARE_EMBEDDING_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: texts, pooling: "mean" }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare API failed: ${data.errors?.[0]?.message}`);
  }

  // Response format: { result: { data: [[...], [...]], shape: [count, dims] } }
  const embeddings = data.result.data;
  if (!Array.isArray(embeddings)) {
    throw new Error("Invalid embedding response format");
  }

  return embeddings;
}

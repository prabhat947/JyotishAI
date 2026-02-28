/**
 * Text embedder using OpenRouter (text-embedding-3-small via OpenAI)
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

/**
 * Generate embedding for a text chunk
 */
export async function embedText(text: string): Promise<number[]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Batch embed multiple texts
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  // OpenRouter supports batch embeddings
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    throw new Error(`Batch embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.map((item: any) => item.embedding);
}

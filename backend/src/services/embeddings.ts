import OpenAI from "openai";

const MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const MAX_TEXT_LENGTH = 4000;
const CACHE_LIMIT = 500;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache = new Map<string, number[]>();

export function embeddingsEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function clampText(text: string): string {
  if (text.length <= MAX_TEXT_LENGTH) return text;
  return text.slice(0, MAX_TEXT_LENGTH);
}

function cacheGet(text: string): number[] | undefined {
  if (!cache.has(text)) return undefined;
  const value = cache.get(text);
  if (value) {
    cache.delete(text);
    cache.set(text, value);
  }
  return value;
}

function cacheSet(text: string, embedding: number[]): void {
  cache.set(text, embedding);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest) cache.delete(oldest);
  }
}

export async function getTextEmbedding(text: string): Promise<number[]> {
  const trimmed = clampText(text.trim());
  if (!trimmed) return [];

  const cached = cacheGet(trimmed);
  if (cached) return cached;

  const result = await openai.embeddings.create({
    model: MODEL,
    input: trimmed,
  });

  const embedding = result.data[0]?.embedding ?? [];
  cacheSet(trimmed, embedding);
  return embedding;
}

export async function getTextEmbeddings(texts: string[]): Promise<number[][]> {
  const cleaned = texts.map((text) => clampText(text.trim()));
  if (cleaned.length === 0) return [];

  const result = await openai.embeddings.create({
    model: MODEL,
    input: cleaned,
  });

  return result.data.map((item) => item.embedding ?? []);
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

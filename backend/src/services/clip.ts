/**
 * Client for FashionCLIP image embeddings via local clip-service.
 *
 * Calls the local FastAPI service (default http://localhost:5111)
 * to generate 512-dim image embeddings.
 *
 * Optional env var:
 *   CLIP_SERVICE_URL – base URL of the clip service (default: http://localhost:5111)
 */

const CLIP_SERVICE_URL = process.env.CLIP_SERVICE_URL ?? "http://localhost:5111";

export function clipEnabled(): boolean {
  return true;
}

interface ClipEmbedResponse {
  embedding: number[];
  dimensions: number;
}

export async function getImageEmbedding(
  imageBase64: string
): Promise<number[]> {
  const res = await fetch(`${CLIP_SERVICE_URL}/embed/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64: imageBase64 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `CLIP service error ${res.status}: ${text.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as ClipEmbedResponse;
  return data.embedding;
}

export async function getImageEmbeddingFromUrl(
  url: string
): Promise<number[]> {
  const res = await fetch(`${CLIP_SERVICE_URL}/embed/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `CLIP service error ${res.status}: ${text.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as ClipEmbedResponse;
  return data.embedding;
}

/**
 * Client for the FashionCLIP Python embedding service.
 *
 * The service must be running at CLIP_SERVICE_URL (default http://localhost:5111).
 */

const CLIP_SERVICE_URL =
  process.env.CLIP_SERVICE_URL ?? "http://localhost:5111";

export function clipEnabled(): boolean {
  return Boolean(process.env.CLIP_SERVICE_URL);
}

export async function getImageEmbedding(
  imageBase64: string
): Promise<number[]> {
  const response = await fetch(`${CLIP_SERVICE_URL}/embed/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64: imageBase64 }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Clip service error ${response.status}: ${text.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

export async function getImageEmbeddingFromUrl(
  url: string
): Promise<number[]> {
  const response = await fetch(`${CLIP_SERVICE_URL}/embed/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Clip service error ${response.status}: ${text.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

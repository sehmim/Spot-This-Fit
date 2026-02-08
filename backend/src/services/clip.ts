/**
 * Client for FashionCLIP image embeddings via Replicate.
 *
 * Uses the Replicate HTTP API to run a custom FashionCLIP model
 * and return 512-dim embeddings.
 *
 * Required env vars:
 *   REPLICATE_API_TOKEN  – your Replicate API token
 *   REPLICATE_MODEL_ID   – e.g. "your-username/fashion-clip"
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN ?? "";
const REPLICATE_MODEL_ID =
  process.env.REPLICATE_MODEL_ID ?? "";

export function clipEnabled(): boolean {
  return Boolean(REPLICATE_API_TOKEN && REPLICATE_MODEL_ID);
}

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: number[] | null;
  error: string | null;
  urls: { get: string };
}

async function replicateRequest(
  path: string,
  body?: Record<string, unknown>
): Promise<Response> {
  const res = await fetch(`https://api.replicate.com/v1${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res;
}

async function runPrediction(
  input: Record<string, string>
): Promise<number[]> {
  // Use the "wait" mode — Replicate blocks until the prediction is done
  const res = await replicateRequest(`/models/${REPLICATE_MODEL_ID}/predictions`, {
    input,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Replicate API error ${res.status}: ${text.slice(0, 300)}`
    );
  }

  const prediction = (await res.json()) as ReplicatePrediction;

  if (prediction.status === "failed") {
    throw new Error(`Replicate prediction failed: ${prediction.error}`);
  }

  if (!prediction.output || !Array.isArray(prediction.output)) {
    throw new Error("Replicate returned no embedding output");
  }

  return prediction.output;
}

export async function getImageEmbedding(
  imageBase64: string
): Promise<number[]> {
  return runPrediction({ image_base64: imageBase64 });
}

export async function getImageEmbeddingFromUrl(
  url: string
): Promise<number[]> {
  return runPrediction({ image_url: url });
}

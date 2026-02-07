import { ApifyClient } from "apify-client";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APIFY_ACTOR_ID =
  process.env.APIFY_ACTOR_ID ?? "alpha-scraper/instagram---reels---scraper";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEOS_DIR = path.resolve(__dirname, "../../../videos");

interface ApifyFormat {
  type?: string;
  url?: string;
  duration?: number;
  width?: number;
  height?: number;
}

interface ApifyItem {
  formats?: ApifyFormat[];
  duration?: number;
  video_url?: string;
  videoUrl?: string;
}

export interface ReelVideoSource {
  directUrl: string;
  durationSeconds?: number;
}

export async function fetchReelVideoSource(
  reelUrl: string
): Promise<ReelVideoSource> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error("[apify] Missing APIFY_API_TOKEN");
    throw new Error("APIFY_TOKEN_MISSING");
  }

  const client = new ApifyClient({ token });
  const normalizedUrl = reelUrl.endsWith("/") ? reelUrl : `${reelUrl}/`;
  console.info("[apify] Starting actor run", {
    actorId: APIFY_ACTOR_ID,
    normalizedUrl,
  });
  const run = await client.actor(APIFY_ACTOR_ID).call({
    startUrls: [{ url: normalizedUrl }],
  });
  console.info("[apify] Actor run complete", {
    runId: run.id,
    datasetId: run.defaultDatasetId,
  });

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit: 1 });

  if (!items.length) {
    console.error("[apify] No items returned from dataset", {
      datasetId: run.defaultDatasetId,
    });
    throw new Error("APIFY_NO_ITEMS");
  }

  const item = items[0] as ApifyItem;
  const formats = Array.isArray(item.formats) ? item.formats : [];
  const videoFormats = formats.filter(
    (format) => format?.type === "video" && typeof format.url === "string"
  );

  const mp4Format = videoFormats.find((format) =>
    format?.url?.toLowerCase().includes(".mp4")
  );
  const preferredFormat =
    mp4Format ??
    videoFormats[0] ??
    formats.find((format) => typeof format?.url === "string");

  const directUrl =
    item.video_url ??
    item.videoUrl ??
    preferredFormat?.url;

  if (!directUrl) {
    console.error("[apify] No direct video URL found", {
      hasFormats: formats.length > 0,
      keys: Object.keys(item),
    });
    throw new Error("APIFY_NO_VIDEO_URL");
  }

  const durationSeconds =
    typeof item.duration === "number"
      ? item.duration
      : typeof preferredFormat?.duration === "number"
        ? preferredFormat.duration
        : undefined;

  return { directUrl, durationSeconds };
}

export async function downloadVideoToDisk(sourceUrl: string) {
  await mkdir(VIDEOS_DIR, { recursive: true });

  const extension = path.extname(new URL(sourceUrl).pathname) || ".mp4";
  const fileName = `${randomUUID()}${extension}`;
  const filePath = path.join(VIDEOS_DIR, fileName);

  console.info("[apify] Downloading video", {
    sourceUrl,
    fileName,
  });
  const response = await fetch(sourceUrl);
  if (!response.ok || !response.body) {
    console.error("[apify] Failed to download video", {
      status: response.status,
      ok: response.ok,
    });
    throw new Error("DOWNLOAD_FAILED");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyStream = Readable.fromWeb(response.body as any);
  await pipeline(bodyStream, createWriteStream(filePath));

  console.info("[apify] Video written to disk", { filePath });
  return { fileName, filePath };
}

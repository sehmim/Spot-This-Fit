import { stat } from "node:fs/promises";
import { sql } from "../db/connection.js";

export interface CachedVideo {
  id: number;
  platform: string;
  video_id: string;
  original_url: string;
  local_path: string;
  public_url: string;
  duration_seconds: number | null;
  created_at: string;
}

export async function getCachedVideo(
  platform: string,
  videoId: string
): Promise<CachedVideo | null> {
  if (!sql) return null;

  const rows = await sql<CachedVideo[]>`
    SELECT
      id,
      platform,
      video_id,
      original_url,
      local_path,
      public_url,
      duration_seconds,
      created_at
    FROM video_cache
    WHERE platform = ${platform} AND video_id = ${videoId}
    LIMIT 1
  `;

  const cached = rows[0];
  if (!cached) return null;

  try {
    await stat(cached.local_path);
    return cached;
  } catch {
    return null;
  }
}

export async function upsertCachedVideo(input: {
  platform: string;
  videoId: string;
  originalUrl: string;
  localPath: string;
  publicUrl: string;
  durationSeconds?: number;
}): Promise<CachedVideo | null> {
  if (!sql) return null;

  const durationSeconds =
    typeof input.durationSeconds === "number"
      ? Math.round(input.durationSeconds)
      : null;

  const rows = await sql<CachedVideo[]>`
    INSERT INTO video_cache (
      platform,
      video_id,
      original_url,
      local_path,
      public_url,
      duration_seconds
    )
    VALUES (
      ${input.platform},
      ${input.videoId},
      ${input.originalUrl},
      ${input.localPath},
      ${input.publicUrl},
      ${durationSeconds}
    )
    ON CONFLICT (platform, video_id)
    DO UPDATE SET
      original_url = EXCLUDED.original_url,
      local_path = EXCLUDED.local_path,
      public_url = EXCLUDED.public_url,
      duration_seconds = EXCLUDED.duration_seconds
    RETURNING
      id,
      platform,
      video_id,
      original_url,
      local_path,
      public_url,
      duration_seconds,
      created_at
  `;

  return rows[0] ?? null;
}

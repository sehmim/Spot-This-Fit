import type { Request, Response } from "express";
import {
  validateVideoUrl,
  type ApiResponse,
  type ApiError,
  type VideoDownloadResponse,
} from "@spotthisfit/shared";
import {
  fetchReelVideoSource,
  downloadVideoToDisk,
} from "../services/apify.js";
import {
  getCachedVideo,
  upsertCachedVideo,
} from "../services/video-cache.js";

const MAX_DURATION_SECONDS = 30;

function sendError(res: Response, status: number, code: string, message: string) {
  const error: ApiError = {
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
  console.error("[downloadVideo] Error response", {
    status,
    code,
    message,
  });
  res.status(status).json(error);
}

function isInstagramReelUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return /\/reel\/[A-Za-z0-9_-]+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

export async function downloadVideo(req: Request, res: Response) {
  const { url } = req.body as { url?: string };
  console.info("[downloadVideo] Request received", { url });

  if (!url) {
    sendError(res, 400, "MISSING_URL", "Video URL is required");
    return;
  }

  const validation = validateVideoUrl(url);
  if (!validation.isValid) {
    sendError(
      res,
      400,
      "INVALID_URL",
      "URL is not a supported video link. Try Instagram, TikTok, YouTube, or Facebook."
    );
    return;
  }

  if (validation.platform !== "instagram") {
    sendError(
      res,
      400,
      "UNSUPPORTED_PLATFORM",
      "Only Instagram Reels are supported right now."
    );
    return;
  }

  if (!isInstagramReelUrl(url)) {
    sendError(
      res,
      400,
      "REELS_ONLY",
      "Only Instagram Reels are supported right now."
    );
    return;
  }

  try {
    console.info("[downloadVideo] Validation passed", {
      platform: validation.platform,
      videoId: validation.videoId,
    });

    const cached = await getCachedVideo(validation.platform, validation.videoId);
    if (cached) {
      console.info("[downloadVideo] Cache hit", {
        platform: validation.platform,
        videoId: validation.videoId,
        publicUrl: cached.public_url,
      });
      const data: VideoDownloadResponse = {
        videoUrl: cached.public_url,
        originalUrl: cached.original_url,
      };

      const response: ApiResponse<VideoDownloadResponse> = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
      return;
    }

    console.info("[downloadVideo] Cache miss; fetching via Apify", {
      platform: validation.platform,
      videoId: validation.videoId,
    });

    const { directUrl, durationSeconds } = await fetchReelVideoSource(url);

    console.info("[downloadVideo] Apify resolved video source", {
      durationSeconds,
      hasDirectUrl: Boolean(directUrl),
    });

    if (
      typeof durationSeconds === "number" &&
      durationSeconds > MAX_DURATION_SECONDS
    ) {
      sendError(
        res,
        400,
        "VIDEO_TOO_LONG",
        "Video must be 30 seconds or less."
      );
      return;
    }

    const { fileName, filePath } = await downloadVideoToDisk(directUrl);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const localUrl = `${baseUrl}/videos/${fileName}`;

    console.info("[downloadVideo] Video downloaded", {
      fileName,
      filePath,
      publicUrl: localUrl,
    });

    await upsertCachedVideo({
      platform: validation.platform,
      videoId: validation.videoId,
      originalUrl: url,
      localPath: filePath,
      publicUrl: localUrl,
      durationSeconds,
    });

    console.info("[downloadVideo] Cache stored", {
      platform: validation.platform,
      videoId: validation.videoId,
    });

    const data: VideoDownloadResponse = {
      videoUrl: localUrl,
      originalUrl: url,
    };

    const response: ApiResponse<VideoDownloadResponse> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("[downloadVideo] Unhandled error", {
      url,
      error,
    });
    if (error instanceof Error) {
      if (error.message === "APIFY_TOKEN_MISSING") {
        sendError(
          res,
          500,
          "APIFY_NOT_CONFIGURED",
          "Apify API token is not configured."
        );
        return;
      }
      if (error.message === "APIFY_NO_ITEMS") {
        sendError(
          res,
          502,
          "DOWNLOAD_FAILED",
          "No reel data returned from the downloader."
        );
        return;
      }
      if (error.message === "APIFY_NO_VIDEO_URL") {
        sendError(
          res,
          502,
          "DOWNLOAD_FAILED",
          "No downloadable video URL was returned."
        );
        return;
      }
      if (error.message === "DOWNLOAD_FAILED") {
        sendError(
          res,
          502,
          "DOWNLOAD_FAILED",
          "Failed to download video."
        );
        return;
      }
    }

    sendError(res, 500, "INTERNAL_ERROR", "Failed to download video.");
  }
}

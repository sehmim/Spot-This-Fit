import type { Request, Response } from "express";
import { validateVideoUrl } from "@spotthisfit/shared";
import type { ApiResponse, ApiError, VideoUrl, VideoMeta } from "@spotthisfit/shared";
import { MOCK_VIDEO_META } from "../mock-data/video-meta";

export async function validateVideo(req: Request, res: Response) {
  const { url } = req.body as { url: string };

  if (!url) {
    const error: ApiError = {
      success: false,
      error: { code: "MISSING_URL", message: "Video URL is required" },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(error);
    return;
  }

  const result = validateVideoUrl(url);

  // Simulate delay
  await new Promise((r) => setTimeout(r, 300));

  if (!result.isValid) {
    const error: ApiError = {
      success: false,
      error: {
        code: "INVALID_URL",
        message: "URL is not a supported video link. Try Instagram, TikTok, YouTube, or Facebook.",
      },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(error);
    return;
  }

  const response: ApiResponse<VideoUrl> = {
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

export async function getVideoMeta(req: Request, res: Response) {
  const videoId = req.params.videoId as string;

  // Simulate delay
  await new Promise((r) => setTimeout(r, 800));

  // Try to match by platform, otherwise return default
  const platform = req.query.platform as string | undefined;
  const meta: VideoMeta = {
    ...(MOCK_VIDEO_META[platform || "default"] || MOCK_VIDEO_META.default),
    videoId,
  };

  const response: ApiResponse<VideoMeta> = {
    success: true,
    data: meta,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

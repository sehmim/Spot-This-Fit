import type { Request, Response } from "express";
import type {
  ApiResponse,
  ApiError,
  VideoDownloadResponse,
} from "@spotthisfit/shared";

const MOCK_VIDEO_URL = "http://localhost:4000/videos/test.mp4";
const MOCK_DOWNLOAD_DELAY_MS = 2000;

export async function downloadVideo(req: Request, res: Response) {
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

  // Simulate Apify download delay
  await new Promise((r) => setTimeout(r, MOCK_DOWNLOAD_DELAY_MS));

  const data: VideoDownloadResponse = {
    videoUrl: MOCK_VIDEO_URL,
    originalUrl: url,
  };

  const response: ApiResponse<VideoDownloadResponse> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

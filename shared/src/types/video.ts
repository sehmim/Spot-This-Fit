export type Platform = "instagram" | "tiktok" | "youtube" | "facebook";

export interface VideoUrl {
  raw: string;
  platform: Platform;
  videoId: string;
  isValid: boolean;
}

export interface VideoMeta {
  videoId: string;
  platform: Platform;
  title: string;
  thumbnailUrl: string;
  duration: number;
  author: string;
  authorAvatar: string;
}

export interface TimeRange {
  id: string;
  start: number;
  end: number;
  label?: string;
}

export interface HighlightRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoDownloadRequest {
  url: string;
}

export interface VideoDownloadResponse {
  videoUrl: string;
  originalUrl: string;
}

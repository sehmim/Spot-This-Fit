import type { Platform, VideoUrl } from "../types/video.js";
import { URL_PATTERNS } from "../constants/platforms.js";

export function validateVideoUrl(raw: string): VideoUrl {
  const trimmed = raw.trim();

  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        raw: trimmed,
        platform: platform as Platform,
        videoId: match[1],
        isValid: true,
      };
    }
  }

  return {
    raw: trimmed,
    platform: "instagram",
    videoId: "",
    isValid: false,
  };
}

export function extractPlatform(url: string): Platform | null {
  const result = validateVideoUrl(url);
  return result.isValid ? result.platform : null;
}

import type { Platform } from "../types/video";

export const SUPPORTED_PLATFORMS: Record<
  Platform,
  { name: string; icon: string; color: string }
> = {
  instagram: { name: "Instagram", icon: "instagram", color: "#E4405F" },
  tiktok: { name: "TikTok", icon: "music", color: "#000000" },
  youtube: { name: "YouTube", icon: "youtube", color: "#FF0000" },
  facebook: { name: "Facebook", icon: "facebook", color: "#1877F2" },
};

export const URL_PATTERNS: Record<Platform, RegExp> = {
  instagram:
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/,
  tiktok:
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
  youtube:
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  facebook:
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:[\w.-]+\/videos\/|watch\/?\?v=)(\d+)/,
};

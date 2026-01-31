import type { VideoMeta } from "@spotthisfit/shared";

export const MOCK_VIDEO_META: Record<string, VideoMeta> = {
  default: {
    videoId: "mock_video_001",
    platform: "instagram",
    title: "Summer OOTD - Casual Street Style",
    thumbnailUrl: "https://picsum.photos/seed/video-thumb/720/1280",
    duration: 45,
    author: "fashionista_daily",
    authorAvatar: "https://picsum.photos/seed/avatar1/100/100",
  },
  instagram: {
    videoId: "mock_ig_001",
    platform: "instagram",
    title: "What I Wore This Week | Summer Edition",
    thumbnailUrl: "https://picsum.photos/seed/ig-thumb/720/1280",
    duration: 30,
    author: "style.with.sarah",
    authorAvatar: "https://picsum.photos/seed/avatar2/100/100",
  },
  tiktok: {
    videoId: "mock_tt_001",
    platform: "tiktok",
    title: "Get Ready With Me - NYC Brunch",
    thumbnailUrl: "https://picsum.photos/seed/tt-thumb/720/1280",
    duration: 60,
    author: "nyc.outfits",
    authorAvatar: "https://picsum.photos/seed/avatar3/100/100",
  },
  youtube: {
    videoId: "mock_yt_001",
    platform: "youtube",
    title: "Thrift Haul - Found Designer Pieces!",
    thumbnailUrl: "https://picsum.photos/seed/yt-thumb/1280/720",
    duration: 55,
    author: "ThriftQueenTV",
    authorAvatar: "https://picsum.photos/seed/avatar4/100/100",
  },
  facebook: {
    videoId: "mock_fb_001",
    platform: "facebook",
    title: "Spring Wardrobe Essentials",
    thumbnailUrl: "https://picsum.photos/seed/fb-thumb/720/1280",
    duration: 40,
    author: "The Fashion Edit",
    authorAvatar: "https://picsum.photos/seed/avatar5/100/100",
  },
};

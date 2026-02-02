// Types
export type {
  Platform,
  VideoUrl,
  VideoMeta,
  TimeRange,
  HighlightRegion,
  VideoDownloadRequest,
  VideoDownloadResponse,
} from "./types/video.js";

export type {
  ConfidenceLevel,
  ProductCategory,
  Product,
  ProductMatch,
} from "./types/product.js";

export type {
  SearchStatus,
  SearchRequest,
  SearchProgress,
  SearchResponse,
  FrameSearchRequest,
  SSEEventType,
  SSEProductEvent,
  SSEStatusEvent,
  SSECompleteEvent,
  SSEErrorEvent,
  SSEEvent,
} from "./types/search.js";

export type {
  EmailCaptureRequest,
  EmailCaptureResponse,
} from "./types/user.js";

export type { ApiResponse, ApiError, ApiResult } from "./types/api.js";

// Constants
export { SUPPORTED_PLATFORMS, URL_PATTERNS } from "./constants/platforms.js";
export { STATUS_MESSAGES, CONFIDENCE_THRESHOLDS } from "./constants/processing.js";

// Validators
export { validateVideoUrl, extractPlatform } from "./validators/url.js";

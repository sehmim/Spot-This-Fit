// Types
export type {
  Platform,
  VideoUrl,
  VideoMeta,
  TimeRange,
  HighlightRegion,
  VideoDownloadRequest,
  VideoDownloadResponse,
} from "./types/video";

export type {
  ConfidenceLevel,
  ProductCategory,
  Product,
  ProductMatch,
} from "./types/product";

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
} from "./types/search";

export type {
  EmailCaptureRequest,
  EmailCaptureResponse,
} from "./types/user";

export type { ApiResponse, ApiError, ApiResult } from "./types/api";

// Constants
export { SUPPORTED_PLATFORMS, URL_PATTERNS } from "./constants/platforms";
export { STATUS_MESSAGES, CONFIDENCE_THRESHOLDS } from "./constants/processing";

// Validators
export { validateVideoUrl, extractPlatform } from "./validators/url";

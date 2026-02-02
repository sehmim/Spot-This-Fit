import type { TimeRange, VideoUrl, HighlightRegion } from "./video";
import type { ProductMatch, Product } from "./product";

export type SearchStatus =
  | "validating"
  | "analyzing_frames"
  | "identifying_products"
  | "finding_prices"
  | "complete"
  | "error";

export interface SearchRequest {
  videoUrl: string;
  timeRanges: TimeRange[];
  query?: string;
}

export interface SearchProgress {
  searchId: string;
  status: SearchStatus;
  progress: number;
  message: string;
}

export interface SearchResponse {
  searchId: string;
  videoUrl: VideoUrl;
  results: ProductMatch;
  processedAt: string;
  timeRangesAnalyzed: number;
}

export interface FrameSearchRequest {
  frameImage: string;
  highlight?: HighlightRegion;
  description?: string;
  videoUrl?: string;
}

export type SSEEventType = "product" | "status" | "complete" | "error";

export interface SSEProductEvent {
  type: "product";
  data: Product;
}

export interface SSEStatusEvent {
  type: "status";
  data: {
    message: string;
    retailersSearched: number;
    code?: string;
    params?: Record<string, string | number>;
  };
}

export interface SSECompleteEvent {
  type: "complete";
  data: {
    totalProducts: number;
  };
}

export interface SSEErrorEvent {
  type: "error";
  data: {
    message: string;
  };
}

export type SSEEvent =
  | SSEProductEvent
  | SSEStatusEvent
  | SSECompleteEvent
  | SSEErrorEvent;

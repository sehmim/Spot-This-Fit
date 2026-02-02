import type { SearchStatus } from "../types/search.js";

export const STATUS_MESSAGES: Record<SearchStatus, string> = {
  validating: "Validating video URL...",
  analyzing_frames: "Analyzing video frames...",
  identifying_products: "Identifying products with AI...",
  finding_prices: "Finding the best prices...",
  complete: "Done! Here are your results.",
  error: "Something went wrong. Please try again.",
};

export const CONFIDENCE_THRESHOLDS = {
  high: 80,
  medium: 50,
  low: 0,
} as const;

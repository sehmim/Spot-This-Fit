import type { ProductMatch } from "@spotthisfit/shared";
import { MOCK_PRODUCTS } from "./products.js";

export function buildMockResults(timeRangeCount: number): ProductMatch {
  // Return a subset of products as "requested" matches and rest as "suggestions"
  const requested = MOCK_PRODUCTS.slice(0, Math.min(timeRangeCount * 2 + 1, 6));
  const suggestions = MOCK_PRODUCTS.slice(6, 12);

  return {
    requested,
    suggestions,
  };
}

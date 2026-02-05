import { v4 as uuidv4 } from "uuid";
import type { Product, ConfidenceLevel } from "@spotthisfit/shared";

const DEFAULT_CONFIDENCE: ConfidenceLevel = "low";
const DEFAULT_CONFIDENCE_SCORE = 35;

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(value: string | null | undefined): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter((token) => token.length > 2);
}

export function scoreListingMatch(
  aiProduct: Product,
  listing: {
    name?: string | null;
    brand?: string | null;
    description?: string | null;
    color?: string | null;
    model?: string | null;
  }
): number {
  const aiBrand = normalizeText(aiProduct.brand);
  const aiModel = normalizeText(aiProduct.exactModel);
  const aiColor = normalizeText(aiProduct.color);

  const listingBrand = normalizeText(listing.brand);
  const listingText = normalizeText(
    `${listing.name ?? ""} ${listing.description ?? ""} ${listing.brand ?? ""}`
  );

  let score = 0;

  if (aiBrand && aiBrand !== "unknown") {
    if (listingBrand && listingBrand.includes(aiBrand)) {
      score += 4;
    } else if (listingBrand) {
      score -= 2;
    }
  }

  if (aiModel && listingText.includes(aiModel)) {
    score += 4;
  }

  if (aiColor && listingText.includes(aiColor)) {
    score += 1;
  }

  const tokens = new Set([
    ...tokenize(aiProduct.name),
    ...tokenize(aiProduct.searchQuery),
  ]);
  for (const token of tokens) {
    if (listingText.includes(token)) {
      score += 1;
    }
  }

  return score;
}

export function isStrongMatch(score: number, threshold = 3): boolean {
  return score >= threshold;
}

export function buildSeedProduct(
  query: string,
  overrides: Partial<Product> = {}
): Product {
  const base: Product = {
    id: uuidv4(),
    name: query,
    brand: "Unknown",
    category: "other",
    imageUrl: "",
    price: 0,
    currency: "USD",
    shopUrl: "#",
    retailer: "Unknown",
    confidence: DEFAULT_CONFIDENCE,
    confidenceScore: DEFAULT_CONFIDENCE_SCORE,
    description: "",
    searchQuery: query,
  };

  return {
    ...base,
    ...overrides,
    searchQuery: overrides.searchQuery ?? base.searchQuery,
  };
}

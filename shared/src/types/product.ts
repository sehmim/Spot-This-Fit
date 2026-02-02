export type ConfidenceLevel = "high" | "medium" | "low";

export type ProductCategory =
  | "top"
  | "bottom"
  | "dress"
  | "outerwear"
  | "shoes"
  | "accessory"
  | "bag"
  | "jewelry"
  | "other";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  imageUrl: string;
  price: number;
  currency: string;
  originalPrice?: number;
  shopUrl: string;
  retailer: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  matchedTimeRange?: string;
  description?: string;

  // Affiliate / provider fields
  affiliateUrl?: string;
  onSale?: boolean;
  saleDiscount?: number;
  merchantName?: string;
  merchantLogo?: string;
  size?: string;
  availability?: string;

  // AI identification
  isHighlighted?: boolean;
  searchQuery?: string;
  color?: string;
  material?: string;
  exactModel?: string;
}

export interface ProductMatch {
  requested: Product[];
  suggestions: Product[];
}

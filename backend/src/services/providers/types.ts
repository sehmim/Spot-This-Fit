import type { Product } from "@spotthisfit/shared";

/**
 * A product provider enriches AI-detected products with real retail
 * listings (images, prices, affiliate URLs, merchant data).
 *
 * Implementations must be swappable — the active provider is chosen
 * via the PRODUCT_PROVIDER env variable.
 */
export interface EnrichOptions {
  /** The original uploaded frame image as base64, used for image-based search. */
  frameImage?: string;
  /** Optional bounding box the user drew to highlight a specific item. */
  highlight?: { x: number; y: number; width: number; height: number };
}

export interface ProductProvider {
  /** Human-readable provider name (for logging). */
  readonly name: string;

  /**
   * Enrich a list of AI-detected products with real retail data.
   *
   * Yields one enriched Product at a time so the caller can stream
   * results to the client via SSE as each product is resolved.
   */
  enrichProducts(
    products: Product[],
    options?: EnrichOptions
  ): AsyncGenerator<Product>;

  /**
   * Optional paginated search for additional product suggestions.
   * Returns standardized Product objects for infinite scroll results.
   */
  searchSuggestions?(
    query: string,
    options: ProductSearchOptions
  ): Promise<ProductSuggestionResult>;
}

export interface ProductSearchOptions {
  limit: number;
  offset?: number;
}

export interface ProductSuggestionResult {
  products: Product[];
  nextOffset?: number | null;
  totalCount?: number;
}

// ── affiliate.com API types ────────────────────────────────────────

export interface AffiliateComConfig {
  apiUrl: string;
  token: string;
  affiliateId: string;
  subId: string;
  networkId: string;
}

export interface AffiliateComSearchFilter {
  field: string;
  value: string | boolean | number;
  operator: "=" | "LIKE" | "NOT LIKE" | ">" | "<" | ">=" | "<=" | "!=";
}

export interface AffiliateComRequestBody {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  networks?: Record<string, { affiliate_id: string; sub_id: string }>;
  search?: AffiliateComSearchFilter[];
}

export interface AffiliateComProduct {
  id: string;
  barcode: string | null;
  name: string;
  description: string;
  commission_url: string;
  direct_url: string;
  image_url: string;
  urls: {
    outclick: string | null;
    direct: string | null;
    affiliate: string | null;
    shopnomix: string | null;
  };
  currency: string;
  regular_price: number; // cents
  final_price: number; // cents
  on_sale: boolean;
  sale_discount: number;
  availability: string;
  stock_quantity: number | null;
  commissionable_status: string;
  mpn: string | null;
  sku: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  color: string | null;
  gender: string | null;
  material: string | null;
  country: string | null;
  condition: string | null;
  genre: string | null;
  manufacturer: string | null;
  model: string | null;
  author: string | null;
  artist: string | null;
  tags: string[];
  network: { id: number; name: string; logo_url: string } | null;
  merchant: { id: number; name: string; logo_url: string } | null;
  updated_at: string;
  started_at: string;
}

export interface AffiliateComResponse {
  meta: {
    total: number;
    from: number;
    to: number;
    current_page: number;
    last_page: number;
    per_page: number;
    fields: string[];
    after: string | null;
    sort_by: string;
    sort_order: string;
    trace_id: string;
  };
  data: AffiliateComProduct[];
}

// ── CJ Product Feed API types ──────────────────────────────────────

export interface CjConfig {
  apiUrl: string;
  token: string;
  companyId: string;
  partnerStatus: "JOINED" | "NOT_JOINED";
  availability: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER" | "BACKORDER";
  sortBy?: "PRICE" | "LAST_UPDATED";
  sortOrder?: "ASC" | "DESC";
  limit: number;
  advertiserCountries?: string[];
  currency?: string;
  sid: string;
}

export interface CjAmountWithCurrency {
  amount: string | number;
  currency?: string | null;
}

export interface CjLinkCode {
  clickUrl?: string | null;
  imageUrl?: string | null;
}

export interface CjProduct {
  id: string;
  title?: string | null;
  description: string;
  brand?: string | null;
  imageLink?: string | null;
  additionalImageLink?: string[] | null;
  link?: string | null;
  mobileLink?: string | null;
  linkCode?: CjLinkCode | null;
  advertiserName: string;
  advertiserId: string;
  advertiserCountry?: string | null;
  price: CjAmountWithCurrency;
  salePrice?: CjAmountWithCurrency | null;
}

export interface CjProductsResult {
  resultList: CjProduct[];
  totalCount: number;
  limit: number;
  count: number;
  nextPage?: string | null;
}

export interface CjGraphQlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// ── Awin API types ──────────────────────────────────────────────────

export interface AwinConfig {
  apiKey: string;
  feedIds: string[];
  language: string;
  compression: "gzip" | "zip" | "none";
  refreshIntervalMs: number;
  columns: string[];
  localFeedPath?: string; // Path to local CSV file (bypasses API)
}

export interface AwinProduct {
  // Core identifiers
  aw_product_id: string;
  product_name: string;
  merchant_product_id?: string;

  // Brand info
  brand_name?: string;
  brand_id?: string;

  // Images
  aw_image_url: string;
  merchant_image_url?: string;
  large_image?: string;
  alternate_image?: string;
  alternate_image_two?: string;
  alternate_image_three?: string;
  merchant_thumb_url?: string;
  aw_thumb_url?: string;

  // Pricing
  search_price: string;
  store_price?: string;
  rrp_price?: string;
  saving?: string;
  savings_percent?: string;
  currency: string;
  display_price?: string;
  delivery_cost?: string;

  // Links
  aw_deep_link: string;
  merchant_deep_link: string;

  // Merchant info
  merchant_name: string;
  merchant_id?: string;

  // Description & content
  description: string;
  product_short_description?: string;
  specifications?: string;
  keywords?: string;

  // Categories
  merchant_category?: string;
  category_name: string;
  category_id?: string;
  merchant_product_category_path?: string;
  product_type?: string;

  // Product attributes
  colour?: string;
  condition?: string;
  product_model?: string;
  model_number?: string;

  // Fashion-specific fields
  "Fashion:suitable_for"?: string;
  "Fashion:category"?: string;
  "Fashion:size"?: string;
  "Fashion:material"?: string;
  "Fashion:pattern"?: string;
  "Fashion:swatch"?: string;

  // Stock & availability
  in_stock?: string;
  stock_quantity?: string;
  stock_status?: string;
  size_stock_status?: string;

  // Reviews & ratings
  average_rating?: string;
  rating?: string;
  reviews?: string;

  // Additional info
  language?: string;
  last_updated?: string;
  data_feed_id?: string;
  ean?: string;
  mpn?: string;

  // Allow additional dynamic fields
  [key: string]: string | undefined;
}

export interface AwinSearchResult {
  product: AwinProduct;
  score: number;
  feedId: string;
}

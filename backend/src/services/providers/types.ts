import type { Product } from "@spotthisfit/shared";

/**
 * A product provider enriches AI-detected products with real retail
 * listings (images, prices, affiliate URLs, merchant data).
 *
 * Implementations must be swappable — the active provider is chosen
 * via the PRODUCT_PROVIDER env variable.
 */
export interface ProductProvider {
  /** Human-readable provider name (for logging). */
  readonly name: string;

  /**
   * Enrich a list of AI-detected products with real retail data.
   *
   * Yields one enriched Product at a time so the caller can stream
   * results to the client via SSE as each product is resolved.
   */
  enrichProducts(products: Product[]): AsyncGenerator<Product>;
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

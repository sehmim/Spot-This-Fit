import type { Product } from "@spotthisfit/shared";
import type {
  ProductProvider,
  CjConfig,
  CjGraphQlResponse,
  CjProduct,
  CjProductsResult,
} from "./types.js";

const CJ_QUERY_WITH_SORT = `
  query Products(
    $companyId: ID!
    $keywords: [String!]
    $limit: Int
    $offset: Int
    $partnerStatus: PartnerStatus
    $availability: Availability
    $sortBy: SortBy
    $sortOrder: SortOrder
    $advertiserCountries: [String!]
    $currency: String
  ) {
    products(
      companyId: $companyId
      keywords: $keywords
      limit: $limit
      offset: $offset
      partnerStatus: $partnerStatus
      availability: $availability
      sortBy: $sortBy
      sortOrder: $sortOrder
      advertiserCountries: $advertiserCountries
      currency: $currency
    ) {
      resultList {
        id
        title
        description
        brand
        imageLink
        additionalImageLink
        link
        mobileLink
        linkCode(pid: $companyId) {
          clickUrl
        }
        advertiserName
        advertiserId
        advertiserCountry
        price {
          amount
          currency
        }
        salePrice {
          amount
          currency
        }
      }
      totalCount
      limit
      count
      nextPage
    }
  }
`;

const CJ_QUERY_NO_SORT = `
  query Products(
    $companyId: ID!
    $keywords: [String!]
    $limit: Int
    $offset: Int
    $partnerStatus: PartnerStatus
    $availability: Availability
    $advertiserCountries: [String!]
    $currency: String
  ) {
    products(
      companyId: $companyId
      keywords: $keywords
      limit: $limit
      offset: $offset
      partnerStatus: $partnerStatus
      availability: $availability
      advertiserCountries: $advertiserCountries
      currency: $currency
    ) {
      resultList {
        id
        title
        description
        brand
        imageLink
        additionalImageLink
        link
        mobileLink
        linkCode(pid: $companyId) {
          clickUrl
        }
        advertiserName
        advertiserId
        advertiserCountry
        price {
          amount
          currency
        }
        salePrice {
          amount
          currency
        }
      }
      totalCount
      limit
      count
      nextPage
    }
  }
`;

const DEFAULT_LIMIT = 5;

const PARTNER_STATUSES = ["JOINED", "NOT_JOINED"] as const;
const AVAILABILITY = ["IN_STOCK", "OUT_OF_STOCK", "PREORDER", "BACKORDER"] as const;
const SORT_BY = ["PRICE", "LAST_UPDATED"] as const;
const SORT_ORDER = ["ASC", "DESC"] as const;

function pickEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[]
): T | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase() as T;
  return allowed.includes(normalized) ? normalized : undefined;
}

function parseList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function loadConfig(): CjConfig {
  const rawLimit = Number(process.env.CJ_PRODUCT_LIMIT ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT;

  return {
    apiUrl: process.env.CJ_API_URL ?? "https://ads.api.cj.com/query",
    token: process.env.CJ_AUTH_TOKEN ?? "",
    companyId: process.env.CJ_COMPANY_ID ?? "",
    partnerStatus: pickEnum(
      process.env.CJ_PARTNER_STATUS,
      PARTNER_STATUSES,
    ) ?? "JOINED",
    availability: pickEnum(
      process.env.CJ_AVAILABILITY,
      AVAILABILITY,
    ) ?? "IN_STOCK",
    sortBy: pickEnum(process.env.CJ_SORT_BY, SORT_BY),
    sortOrder: pickEnum(process.env.CJ_SORT_ORDER, SORT_ORDER),
    limit,
    advertiserCountries: parseList(process.env.CJ_ADVERTISER_COUNTRIES),
    currency: process.env.CJ_CURRENCY ?? undefined,
    sid: process.env.CJ_SID ?? "",
  };
}

function parseAmount(amount: unknown): number | null {
  if (typeof amount === "number") return amount;
  if (typeof amount === "string") {
    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function appendSid(url: string | undefined, sid: string): string | undefined {
  if (!url || !sid) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("sid")) {
      parsed.searchParams.set("sid", sid);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function buildAffiliateUrl(
  listing: CjProduct,
  cfg: CjConfig
): string | undefined {
  const base =
    listing.linkCode?.clickUrl ??
    listing.link ??
    listing.mobileLink ??
    undefined;
  return appendSid(base, cfg.sid);
}

function mapToProduct(
  listing: CjProduct,
  aiProduct: Product,
  cfg: CjConfig
): Product {
  const basePrice = parseAmount(listing.price?.amount);
  const salePrice = parseAmount(listing.salePrice?.amount);
  const hasSale =
    salePrice !== null &&
    basePrice !== null &&
    salePrice > 0 &&
    salePrice < basePrice;

  const finalPrice =
    (hasSale ? salePrice : basePrice) ?? aiProduct.price;
  const originalPrice = hasSale ? basePrice ?? undefined : undefined;
  const saleDiscount =
    hasSale && basePrice
      ? Math.round(((basePrice - salePrice) / basePrice) * 100)
      : undefined;

  const imageUrl =
    listing.imageLink ??
    listing.additionalImageLink?.[0] ??
    aiProduct.imageUrl;

  const affiliateUrl = buildAffiliateUrl(listing, cfg);
  const shopUrl =
    listing.link ??
    listing.mobileLink ??
    affiliateUrl ??
    aiProduct.shopUrl;

  return {
    id: aiProduct.id,
    confidence: aiProduct.confidence,
    confidenceScore: aiProduct.confidenceScore,
    isHighlighted: aiProduct.isHighlighted,
    searchQuery: aiProduct.searchQuery,
    category: aiProduct.category,
    matchedTimeRange: aiProduct.matchedTimeRange,

    name: listing.title ?? aiProduct.name,
    brand: listing.brand ?? aiProduct.brand,
    imageUrl,
    price: finalPrice,
    originalPrice,
    currency:
      listing.salePrice?.currency ??
      listing.price?.currency ??
      aiProduct.currency,
    shopUrl,
    affiliateUrl,
    retailer: listing.advertiserName ?? "Unknown",
    description: listing.description ?? aiProduct.description,
    onSale: hasSale,
    saleDiscount,
    merchantName: listing.advertiserName ?? undefined,
    availability:
      cfg.availability === "IN_STOCK" ? "in_stock" : undefined,
  };
}

async function searchProducts(
  query: string,
  cfg: CjConfig
): Promise<CjProduct[]> {
  const variables: {
    companyId: string;
    keywords: string[];
    limit: number;
    partnerStatus: CjConfig["partnerStatus"];
    availability: CjConfig["availability"];
    advertiserCountries?: string[];
    currency?: string;
    sortBy?: CjConfig["sortBy"];
    sortOrder?: CjConfig["sortOrder"];
  } = {
    companyId: cfg.companyId,
    keywords: [query],
    limit: cfg.limit,
    partnerStatus: cfg.partnerStatus,
    availability: cfg.availability,
    advertiserCountries: cfg.advertiserCountries,
    currency: cfg.currency,
  };
  const useSorting = Boolean(cfg.sortBy && cfg.sortOrder);
  if (useSorting) {
    variables.sortBy = cfg.sortBy;
    variables.sortOrder = cfg.sortOrder;
  }
  const queryText = useSorting ? CJ_QUERY_WITH_SORT : CJ_QUERY_NO_SORT;

  const token = cfg.token.startsWith("Bearer ")
    ? cfg.token
    : `Bearer ${cfg.token}`;

  const res = await fetch(cfg.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ query: queryText, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `CJ Product Feed API error ${res.status}: ${text.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as CjGraphQlResponse<{
    products: CjProductsResult;
  }>;

  if (json.errors?.length) {
    const message = json.errors.map((err) => err.message).join("; ");
    throw new Error(`CJ Product Feed API error: ${message}`);
  }

  return json.data?.products?.resultList ?? [];
}

function pickBestMatch(
  listings: CjProduct[],
  aiProduct: Product
): CjProduct | null {
  if (listings.length === 0) return null;
  if (listings.length === 1) return listings[0];

  const aiBrand = aiProduct.brand.toLowerCase();
  const aiName = aiProduct.name.toLowerCase();

  let best = listings[0];
  let bestScore = -1;

  for (const listing of listings) {
    let score = 0;
    const listBrand = (listing.brand ?? "").toLowerCase();
    const listName = (listing.title ?? "").toLowerCase();

    if (listBrand && aiBrand !== "unknown" && listBrand.includes(aiBrand)) {
      score += 3;
    }

    const aiWords = aiName.split(/\s+/);
    const matchingWords = aiWords.filter(
      (word) => word.length > 2 && listName.includes(word)
    );
    score += matchingWords.length;

    if (score > bestScore) {
      bestScore = score;
      best = listing;
    }
  }

  return best;
}

export class CjProductFeedProvider implements ProductProvider {
  readonly name = "cj-product-feed";

  async *enrichProducts(products: Product[]): AsyncGenerator<Product> {
    const cfg = loadConfig();

    if (!cfg.token || !cfg.companyId) {
      console.warn(
        "[cj-product-feed] Missing CJ_AUTH_TOKEN or CJ_COMPANY_ID; returning AI products only."
      );
      for (const product of products) {
        yield { ...product, retailer: "CJ not configured" };
      }
      return;
    }

    for (const product of products) {
      const query = product.searchQuery ?? `${product.brand} ${product.name}`;

      try {
        const results = await searchProducts(query, cfg);
        const listing = pickBestMatch(results, product);
        console.log(
          `[cj-product-feed] Found ${results.length} results for "${query}"`
        );

        if (listing) {
          yield mapToProduct(listing, product, cfg);
        } else {
          yield { ...product, retailer: "No listing found" };
        }
      } catch (err) {
        console.error(
          `[cj-product-feed] Enrichment failed for "${query}":`,
          err
        );
        yield { ...product, retailer: "Search failed" };
      }
    }
  }
}

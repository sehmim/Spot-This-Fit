import type { Product, ProductCategory } from "@spotthisfit/shared";
import type {
  ProductProvider,
  AffiliateComConfig,
  AffiliateComRequestBody,
  AffiliateComResponse,
  AffiliateComProduct,
} from "./types";

// ── Config ─────────────────────────────────────────────────────────

function loadConfig(): AffiliateComConfig {
  return {
    apiUrl: process.env.AFFILIATE_COM_API_URL ?? "https://api.affiliate.com",
    token: process.env.AFFILIATE_COM_TOKEN ?? "",
    affiliateId: process.env.AFFILIATE_COM_AFFILIATE_ID ?? "",
    subId: process.env.AFFILIATE_COM_SUB_ID ?? "",
    networkId: process.env.AFFILIATE_COM_NETWORK_ID ?? "",
  };
}

function isMockMode(): boolean {
  const cfg = loadConfig();
  return !cfg.token;
}

// ── Category mapping (affiliate.com → our ProductCategory) ─────────

const CATEGORY_KEYWORDS: Record<string, ProductCategory> = {
  shoe: "shoes",
  sneaker: "shoes",
  boot: "shoes",
  sandal: "shoes",
  heel: "shoes",
  loafer: "shoes",
  dress: "dress",
  jacket: "outerwear",
  coat: "outerwear",
  blazer: "outerwear",
  vest: "outerwear",
  pant: "bottom",
  jean: "bottom",
  trouser: "bottom",
  short: "bottom",
  skirt: "bottom",
  shirt: "top",
  blouse: "top",
  sweater: "top",
  hoodie: "top",
  tank: "top",
  polo: "top",
  bag: "bag",
  purse: "bag",
  backpack: "bag",
  tote: "bag",
  necklace: "jewelry",
  bracelet: "jewelry",
  earring: "jewelry",
  ring: "jewelry",
  watch: "accessory",
  hat: "accessory",
  cap: "accessory",
  sunglasses: "accessory",
  belt: "accessory",
  scarf: "accessory",
};

// ── Mock data generation ───────────────────────────────────────────

const MOCK_MERCHANTS = [
  { id: 1001, name: "Nordstrom", logo_url: "https://logo.clearbit.com/nordstrom.com" },
  { id: 1002, name: "ASOS", logo_url: "https://logo.clearbit.com/asos.com" },
  { id: 1003, name: "Zara", logo_url: "https://logo.clearbit.com/zara.com" },
  { id: 1004, name: "H&M", logo_url: "https://logo.clearbit.com/hm.com" },
  { id: 1005, name: "Nike", logo_url: "https://logo.clearbit.com/nike.com" },
  { id: 1006, name: "Uniqlo", logo_url: "https://logo.clearbit.com/uniqlo.com" },
  { id: 1007, name: "Foot Locker", logo_url: "https://logo.clearbit.com/footlocker.com" },
  { id: 1008, name: "SSENSE", logo_url: "https://logo.clearbit.com/ssense.com" },
  { id: 1009, name: "Revolve", logo_url: "https://logo.clearbit.com/revolve.com" },
  { id: 1010, name: "Levi's", logo_url: "https://logo.clearbit.com/levi.com" },
];

const MOCK_NETWORK = {
  id: 100,
  name: "Affiliate.com",
  logo_url: "https://logo.clearbit.com/affiliate.com",
};

const MOCK_IMAGES: Record<ProductCategory, string[]> = {
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=500&fit=crop",
  ],
  top: [
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&h=500&fit=crop",
  ],
  bottom: [
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop",
  ],
  outerwear: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=400&h=500&fit=crop",
  ],
  dress: [
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop",
  ],
  bag: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=500&fit=crop",
  ],
  accessory: [
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&h=500&fit=crop",
  ],
  jewelry: [
    "https://images.unsplash.com/photo-1515562141589-67f0d569b6f4?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop",
  ],
  other: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockListing(product: Product): AffiliateComProduct {
  const merchant = pickRandom(MOCK_MERCHANTS);
  const images = MOCK_IMAGES[product.category] ?? MOCK_IMAGES.other;
  const imageUrl = pickRandom(images);

  // Generate realistic price in cents (2000 - 25000 = $20 - $250)
  const finalPrice = 2000 + Math.floor(Math.random() * 23000);
  const onSale = Math.random() > 0.5;
  const saleDiscount = onSale ? 10 + Math.floor(Math.random() * 40) : 0;
  const regularPrice = onSale
    ? Math.round(finalPrice / (1 - saleDiscount / 100))
    : finalPrice;

  const searchQuery = product.searchQuery ?? `${product.brand} ${product.name}`;
  const productId = `prod_${Date.now()}${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: productId,
    barcode: null,
    name: product.name,
    description:
      product.description ?? `${product.brand} ${product.name} — ${product.color ?? ""}`.trim(),
    commission_url: `https://outclick.co/a/mock-${productId}?affiliate_id=mock&sub_id=mock`,
    direct_url: `https://${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/p/${productId}`,
    image_url: imageUrl,
    urls: {
      outclick: `https://outclick.co/a/mock-${productId}?affiliate_id=mock&sub_id=mock`,
      direct: `https://${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/p/${productId}`,
      affiliate: null,
      shopnomix: null,
    },
    currency: "CAD",
    regular_price: regularPrice,
    final_price: finalPrice,
    on_sale: onSale,
    sale_discount: saleDiscount,
    availability: "in_stock",
    stock_quantity: 5 + Math.floor(Math.random() * 50),
    commissionable_status: "confirmed_commissionable",
    mpn: null,
    sku: `SKU-${productId.slice(-8).toUpperCase()}`,
    brand: product.brand !== "Unknown" ? product.brand : null,
    category: product.category,
    size: product.category === "shoes" ? pickRandom(["7", "8", "9", "10", "11"]) : null,
    color: product.color ?? null,
    gender: null,
    material: product.material ?? null,
    country: "CA",
    condition: "new",
    genre: null,
    manufacturer: product.brand !== "Unknown" ? product.brand : null,
    model: product.exactModel ?? null,
    author: null,
    artist: null,
    tags: [product.category, product.color ?? ""].filter(Boolean),
    network: MOCK_NETWORK,
    merchant,
    updated_at: new Date().toISOString().replace("T", " ").slice(0, 19),
    started_at: new Date().toISOString().replace("T", " ").slice(0, 19),
  };
}

// ── Response mapping ───────────────────────────────────────────────

function mapToProduct(
  listing: AffiliateComProduct,
  aiProduct: Product
): Product {
  const cfg = loadConfig();
  const affiliateId = cfg.affiliateId || "mock";
  const subId = cfg.subId || "mock";

  // Replace placeholders in commission URL
  const commissionUrl = listing.commission_url
    .replace("@@@", affiliateId)
    .replace("###", subId);

  return {
    // Preserve AI identification metadata
    id: aiProduct.id,
    confidence: aiProduct.confidence,
    confidenceScore: aiProduct.confidenceScore,
    isHighlighted: aiProduct.isHighlighted,
    searchQuery: aiProduct.searchQuery,
    category: aiProduct.category, // AI category is more consistent
    matchedTimeRange: aiProduct.matchedTimeRange,

    // Enriched from provider
    name: listing.name || aiProduct.name,
    brand: listing.brand ?? aiProduct.brand,
    imageUrl: listing.image_url,
    price: listing.final_price / 100, // cents → dollars
    originalPrice:
      listing.on_sale ? listing.regular_price / 100 : undefined,
    currency: listing.currency,
    shopUrl: listing.direct_url,
    affiliateUrl: commissionUrl,
    retailer: listing.merchant?.name ?? "Unknown",
    description: listing.description || aiProduct.description,
    color: listing.color ?? aiProduct.color,
    material: listing.material ?? aiProduct.material,
    exactModel: listing.model ?? aiProduct.exactModel,
    onSale: listing.on_sale,
    saleDiscount: listing.on_sale ? listing.sale_discount : undefined,
    merchantName: listing.merchant?.name,
    merchantLogo: listing.merchant?.logo_url,
    size: listing.size ?? undefined,
    availability: listing.availability,
  };
}

// ── Real API call ──────────────────────────────────────────────────

async function searchProducts(
  query: string,
  cfg: AffiliateComConfig
): Promise<AffiliateComProduct[]> {
  const body: AffiliateComRequestBody = {
    per_page: 5,
    sort_by: "final_price",
    sort_order: "asc",
    networks: {
      [cfg.networkId]: {
        affiliate_id: cfg.affiliateId,
        sub_id: cfg.subId,
      },
    },
    search: [
      {
        field: "name||description",
        value: query,
        operator: "LIKE",
      },
      {
        field: "availability",
        value: "in_stock",
        operator: "=",
      },
    ],
  };

  const res = await fetch(`${cfg.apiUrl}/v1/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${cfg.token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `affiliate.com API error ${res.status}: ${text.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as AffiliateComResponse;
  return json.data;
}

/**
 * Pick the best match from a list of affiliate.com results for a
 * given AI-detected product.  Simple heuristic: prefer brand match,
 * then name overlap.
 */
function pickBestMatch(
  listings: AffiliateComProduct[],
  aiProduct: Product
): AffiliateComProduct | null {
  if (listings.length === 0) return null;
  if (listings.length === 1) return listings[0];

  const aiBrand = aiProduct.brand.toLowerCase();
  const aiName = aiProduct.name.toLowerCase();

  let best = listings[0];
  let bestScore = 0;

  for (const listing of listings) {
    let score = 0;
    const listBrand = (listing.brand ?? "").toLowerCase();
    const listName = listing.name.toLowerCase();

    // Brand match
    if (listBrand && aiBrand !== "unknown" && listBrand.includes(aiBrand)) {
      score += 3;
    }

    // Name word overlap
    const aiWords = aiName.split(/\s+/);
    const matchingWords = aiWords.filter((w) =>
      w.length > 2 && listName.includes(w)
    );
    score += matchingWords.length;

    if (score > bestScore) {
      bestScore = score;
      best = listing;
    }
  }

  return best;
}

// ── Provider implementation ────────────────────────────────────────

export class AffiliateComProvider implements ProductProvider {
  readonly name = "affiliate.com";

  async *enrichProducts(products: Product[]): AsyncGenerator<Product> {
    const mock = isMockMode();
    const cfg = loadConfig();

    for (const product of products) {
      const query = product.searchQuery ?? `${product.brand} ${product.name}`;

      try {
        let listing: AffiliateComProduct | null;

        if (mock) {
          // Simulate network latency
          await new Promise((r) =>
            setTimeout(r, 200 + Math.random() * 300)
          );
          listing = generateMockListing(product);
          console.log(
            `[affiliate.com:mock] Generated listing for "${query}"`
          );
        } else {
          const results = await searchProducts(query, cfg);
          listing = pickBestMatch(results, product);
          console.log(
            `[affiliate.com] Found ${results.length} results for "${query}"`
          );
        }

        if (listing) {
          yield mapToProduct(listing, product);
        } else {
          // No match — yield the AI product as-is with a fallback URL
          yield { ...product, retailer: "No listing found" };
        }
      } catch (err) {
        console.error(
          `[affiliate.com] Enrichment failed for "${query}":`,
          err
        );
        // Yield AI product as fallback so the stream doesn't break
        yield { ...product, retailer: "Search failed" };
      }
    }
  }
}

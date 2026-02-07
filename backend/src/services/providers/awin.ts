import type { Product } from "@spotthisfit/shared";
import type {
  ProductProvider,
  ProductSearchOptions,
  ProductSuggestionResult,
  EnrichOptions,
  AwinProduct,
} from "./types.js";
import { AwinProductStore } from "./awin-product-store.js";
import { buildSeedProduct, scoreListingMatch } from "./match-utils.js";
import { embeddingsEnabled, getTextEmbedding } from "../embeddings.js";
import { clipEnabled, getImageEmbedding } from "../clip.js";
import { cropImage } from "../image-crop.js";

function isMockMode(): boolean {
  // Not mock mode if DATABASE_URL is set
  if (process.env.DATABASE_URL) return false;
  return true;
}

// Extract brand from description (format: "Brand: XYZ, Type: ...")
function extractBrandFromDescription(description: string): string {
  const brandMatch = description.match(/Brand:\s*([^,]+)/i);
  return brandMatch ? brandMatch[1].trim() : "";
}

function parsePriceValue(
  value: string | undefined
): { amount: number | null; currency?: string } {
  if (!value) return { amount: null };
  const trimmed = value.trim();
  const currencyMatch = trimmed.match(/^[A-Za-z]{3}/);
  const amountMatch = trimmed.match(/([0-9]+(?:[.,][0-9]{2})?)/);
  const amount = amountMatch
    ? Number(amountMatch[1].replace(/,/g, ""))
    : NaN;

  return {
    amount: Number.isFinite(amount) ? amount : null,
    currency: currencyMatch ? currencyMatch[0] : undefined,
  };
}

function mapToProduct(awinProduct: AwinProduct, aiProduct: Product): Product {
  const searchPrice = parsePriceValue(awinProduct.search_price).amount;
  const storePrice = parsePriceValue(awinProduct.store_price).amount;
  const displayPrice = parsePriceValue(awinProduct.display_price);
  const rrpPrice = parsePriceValue(awinProduct.rrp_price ?? "").amount;
  const savingsPercent = parseFloat(awinProduct.savings_percent ?? "");

  const finalPrice =
    storePrice ??
    displayPrice.amount ??
    searchPrice ??
    aiProduct.price;
  const currency =
    awinProduct.currency || displayPrice.currency || aiProduct.currency;

  // Determine if on sale: either RRP > search price, or savings_percent exists
  const hasSale =
    (rrpPrice !== null && rrpPrice > finalPrice) ||
    (!isNaN(savingsPercent) && savingsPercent > 0);

  const saleDiscount = !isNaN(savingsPercent) && savingsPercent > 0
    ? Math.round(savingsPercent)
    : hasSale && rrpPrice !== null
      ? Math.round(((rrpPrice - finalPrice) / rrpPrice) * 100)
      : undefined;

  // Brand - prefer direct brand_name field, fallback to extraction from description
  const brand = awinProduct.brand_name ||
                extractBrandFromDescription(awinProduct.description) ||
                aiProduct.brand;

  // Image URL priority: large_image > merchant_image_url > aw_image_url (if valid) > placeholder
  const awImageUrl = awinProduct.aw_image_url || "";
  const isNoImage = awImageUrl.includes("noimage") || awImageUrl.length < 20;
  const validAwImage = !isNoImage ? awImageUrl : "";
  const imageUrl =
    awinProduct.large_image ||
    awinProduct.merchant_image_url ||
    validAwImage ||
    `https://placehold.co/400x500/f5f5f5/666?text=${encodeURIComponent(awinProduct.product_name?.slice(0, 20) || "Product")}`;

  // Color - prefer direct colour field, fallback to AI detection
  const color = awinProduct.colour || aiProduct.color;

  // Material - from Fashion:material field
  const material = awinProduct["Fashion:material"] &&
                   awinProduct["Fashion:material"] !== "Not specified"
    ? awinProduct["Fashion:material"]
    : aiProduct.material;

  // Size - from Fashion:size field
  const size = awinProduct["Fashion:size"] &&
               awinProduct["Fashion:size"] !== "Standard"
    ? awinProduct["Fashion:size"]
    : aiProduct.size;

  // Stock availability
  const inStock = awinProduct.in_stock === "1" || awinProduct.stock_status === "in stock";
  const availability = inStock ? "in_stock" :
                       awinProduct.stock_status === "out of stock" ? "out_of_stock" :
                       undefined;

  // Description - prefer product_short_description if available, otherwise full description
  const description = awinProduct.product_short_description ||
                      awinProduct.description ||
                      aiProduct.description;

  return {
    // Preserve AI metadata
    id: aiProduct.id,
    confidence: aiProduct.confidence,
    confidenceScore: aiProduct.confidenceScore,
    isHighlighted: aiProduct.isHighlighted,
    searchQuery: aiProduct.searchQuery,
    category: aiProduct.category,
    matchedTimeRange: aiProduct.matchedTimeRange,

    // Enriched from Awin
    name: awinProduct.product_name || aiProduct.name,
    brand,
    imageUrl,
    price: finalPrice,
    originalPrice: hasSale ? rrpPrice ?? undefined : undefined,
    currency,
    shopUrl: awinProduct.merchant_deep_link || awinProduct.aw_deep_link,
    affiliateUrl: awinProduct.aw_deep_link,
    retailer: awinProduct.merchant_name || "Awin",
    description,
    color,
    material,
    size,
    onSale: hasSale,
    saleDiscount,
    merchantName: awinProduct.merchant_name,
    availability,
    exactModel: awinProduct.product_model || awinProduct.model_number || aiProduct.exactModel,
  };
}

function generateMockListing(product: Product): AwinProduct {
  const price = (50 + Math.random() * 200).toFixed(2);
  const rrp = (parseFloat(price) * (1 + Math.random() * 0.3)).toFixed(2);

  const merchants = ["Nordstrom", "ASOS", "Zara", "H&M", "Net-a-Porter"];

  return {
    aw_product_id: `awin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    product_name: product.name,
    brand_name: product.brand !== "Unknown" ? product.brand : "",
    aw_image_url: product.imageUrl,
    search_price: price,
    rrp_price: rrp,
    currency: "USD",
    aw_deep_link: `https://awin.example.com/link/${product.id}`,
    merchant_deep_link: `https://merchant.example.com/product/${product.id}`,
    merchant_name: merchants[Math.floor(Math.random() * merchants.length)],
    description: product.description ?? "",
    category_name: product.category,
    colour: product.color,
    in_stock: "1",
  };
}

export class AwinProvider implements ProductProvider {
  readonly name = "awin";
  private store: AwinProductStore | null = null;

  async *enrichProducts(
    products: Product[],
    options?: EnrichOptions
  ): AsyncGenerator<Product> {
    const mock = isMockMode();

    if (mock) {
      console.log(
        "[awin:mock] Running in mock mode (no DATABASE_URL)"
      );
      for (const product of products) {
        await new Promise((r) => setTimeout(r, 150 + Math.random() * 200));
        const mockListing = generateMockListing(product);
        yield mapToProduct(mockListing, product);
      }
      return;
    }

    // Ensure store is ready
    if (!this.store) {
      this.store = new AwinProductStore();
    }

    try {
      await this.store.ensureReady();
    } catch (err) {
      console.error("[awin] Database not ready, returning AI products:", err);
      for (const product of products) {
        yield { ...product, retailer: "Awin database unavailable" };
      }
      return;
    }

    const useClip = clipEnabled() && !!options?.frameImage;

    for (const product of products) {
      const baseQuery = product.searchQuery ?? `${product.brand} ${product.name}`;
      const query = product.exactModel && !baseQuery.includes(product.exactModel)
        ? `${baseQuery} ${product.exactModel}`
        : baseQuery;

      try {
        let results: { product: AwinProduct; score: number }[] = [];

        // Strategy 1: Image-based search via FashionCLIP
        if (useClip) {
          try {
            let imageBase64: string;

            // If user drew a highlight box and this is the highlighted product, crop it
            if (product.isHighlighted && options.highlight) {
              imageBase64 = await cropImage(options.frameImage!, options.highlight);
              console.log(`[awin] Cropped highlighted region for "${product.name}"`);
            } else {
              // Use the full frame image for non-highlighted items
              imageBase64 = options.frameImage!.includes(",")
                ? options.frameImage!.split(",")[1]
                : options.frameImage!;
            }

            const embedding = await getImageEmbedding(imageBase64);
            results = await this.store.searchProductsImageVector(embedding, 8, 0);
            console.log(
              `[awin] Image vector search found ${results.length} results for "${product.name}"`
            );
          } catch (err) {
            console.warn(
              "[awin] Image vector search failed, falling back to text:",
              err
            );
          }
        }

        // Strategy 2: Text embedding search (fallback)
        if (results.length === 0 && embeddingsEnabled()) {
          try {
            const embedding = await getTextEmbedding(query);
            results = await this.store.searchProductsVector(embedding, 8, 0);
            console.log(
              `[awin] Text vector search found ${results.length} results for "${query}"`
            );
          } catch (err) {
            console.warn(
              "[awin] Text vector search failed, falling back to full-text:",
              err
            );
          }
        }

        // Strategy 3: Full-text search (final fallback)
        if (results.length === 0) {
          results = await this.store.searchProducts(query, 5, 0);
          console.log(
            `[awin] Full-text search found ${results.length} results for "${query}"`
          );
        }

        if (results.length > 0) {
          const best = this.pickBestMatch(results, product);
          yield mapToProduct(best.product, product);
        } else {
          yield { ...product, retailer: "No Awin listing found" };
        }
      } catch (err) {
        console.error(`[awin] Search failed for "${query}":`, err);
        yield { ...product, retailer: "Awin search failed" };
      }
    }
  }

  private pickBestMatch(
    results: { product: AwinProduct; score: number }[],
    aiProduct: Product
  ): { product: AwinProduct; score: number } {
    let best = results[0];
    let bestScore = results[0].score;

    for (const result of results) {
      const listingScore = scoreListingMatch(aiProduct, {
        name: result.product.product_name,
        brand:
          result.product.brand_name ||
          extractBrandFromDescription(result.product.description),
        description: result.product.description,
        color: result.product.colour,
        model: result.product.product_model ?? result.product.model_number,
      });
      const totalScore = result.score + listingScore;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        best = result;
      }
    }

    return best;
  }

  async searchSuggestions(
    query: string,
    { limit, offset = 0 }: ProductSearchOptions
  ): Promise<ProductSuggestionResult> {
    const mock = isMockMode();

    if (mock) {
      const products = Array.from({ length: limit }, (_, index) => {
        const seed = buildSeedProduct(query);
        const listing = generateMockListing(seed);
        return mapToProduct(listing, {
          ...seed,
          id: `${seed.id}-${offset + index}`,
        });
      });

      return {
        products,
        nextOffset: offset + products.length,
      };
    }

    if (!this.store) {
      this.store = new AwinProductStore();
    }

    await this.store.ensureReady();
    let results: { product: AwinProduct; score: number }[] = [];
    if (embeddingsEnabled()) {
      try {
        const embedding = await getTextEmbedding(query);
        results = await this.store.searchProductsVector(
          embedding,
          limit,
          offset
        );
      } catch (err) {
        console.warn(
          "[awin] Vector suggestions failed, falling back to full-text:",
          err
        );
      }
    }
    if (results.length === 0) {
      results = await this.store.searchProducts(query, limit, offset);
    }
    const products = results.map((result) => {
      const seed = buildSeedProduct(query, {
        id: result.product.aw_product_id,
        name: result.product.product_name,
        brand:
          result.product.brand_name ||
          extractBrandFromDescription(result.product.description) ||
          "Unknown",
        currency: result.product.currency || "USD",
      });
      return mapToProduct(result.product, seed);
    });

    return {
      products,
      nextOffset: products.length === limit ? offset + products.length : null,
    };
  }
}

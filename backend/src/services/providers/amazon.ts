import type { Product, ProductCategory } from "@spotthisfit/shared";
import type {
  ProductProvider,
  ProductSearchOptions,
  ProductSuggestionResult,
} from "./types.js";
import { buildSeedProduct } from "./match-utils.js";

const AMAZON_ASSOCIATE_TAG =
  process.env.AMAZON_ASSOCIATE_TAG ?? "checkthisfit-20";
const AMAZON_CA_BASE = "https://www.amazon.ca";

const CATEGORY_NODES: Partial<Record<ProductCategory, string>> = {
  shoes: "2983395011",
  dress: "2983378011",
  outerwear: "2983367011",
  top: "1975277011",
  bottom: "2983373011",
  bag: "2603387011",
  accessory: "2474948011",
  jewelry: "6205511011",
};

function buildAffiliateUrl(product: Product): string {
  const query = product.searchQuery ?? `${product.brand} ${product.name}`;
  const params = new URLSearchParams({
    k: query,
    tag: AMAZON_ASSOCIATE_TAG,
  });
  const categoryNode = CATEGORY_NODES[product.category];
  if (categoryNode) {
    params.set("rh", `n:${categoryNode}`);
  }
  return `${AMAZON_CA_BASE}/s?${params.toString()}`;
}

export class AmazonProvider implements ProductProvider {
  readonly name = "amazon";

  async *enrichProducts(products: Product[]): AsyncGenerator<Product> {
    for (const product of products) {
      const affiliateUrl = buildAffiliateUrl(product);
      yield {
        ...product,
        affiliateUrl,
        shopUrl: affiliateUrl,
        retailer: "Amazon.ca",
      };
    }
  }

  async searchSuggestions(
    query: string,
    { offset = 0 }: ProductSearchOptions
  ): Promise<ProductSuggestionResult> {
    if (offset > 0) {
      return { products: [], nextOffset: null };
    }

    const seed = buildSeedProduct(query, {
      name: query,
      brand: "Amazon",
      retailer: "Amazon.ca",
    });
    const affiliateUrl = buildAffiliateUrl(seed);

    return {
      products: [
        {
          ...seed,
          shopUrl: affiliateUrl,
          affiliateUrl,
        },
      ],
      nextOffset: null,
    };
  }
}

import type { ProductProvider } from "./providers/types.js";
import { AffiliateComProvider } from "./providers/affiliate-com.js";
import { AmazonProvider } from "./providers/amazon.js";
import { CjProductFeedProvider } from "./providers/cj-product-feed.js";
import { AwinProvider } from "./providers/awin.js";

type ProviderName = "cj" | "affiliate_com" | "amazon" | "awin";

const providers: Record<ProviderName, () => ProductProvider> = {
  cj: () => new CjProductFeedProvider(),
  affiliate_com: () => new AffiliateComProvider(),
  amazon: () => new AmazonProvider(),
  awin: () => new AwinProvider(),
};

let cached: ProductProvider | null = null;

/**
 * Returns the active product provider based on the PRODUCT_PROVIDER
 * environment variable.  Defaults to "cj".
 *
 * The instance is cached for the lifetime of the process.
 */
export function getProductProvider(): ProductProvider {
  if (cached) return cached;

  const name = (process.env.PRODUCT_PROVIDER ?? "cj") as ProviderName;
  const factory = providers[name];

  if (!factory) {
    console.warn(
      `[enrichment] Unknown PRODUCT_PROVIDER "${name}", falling back to cj`
    );
    cached = new CjProductFeedProvider();
  } else {
    cached = factory();
  }

  console.log(`[enrichment] Using product provider: ${cached.name}`);
  return cached;
}

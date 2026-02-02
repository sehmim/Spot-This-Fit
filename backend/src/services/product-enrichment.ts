import type { ProductProvider } from "./providers/types";
import { AffiliateComProvider } from "./providers/affiliate-com";
import { AmazonProvider } from "./providers/amazon";

type ProviderName = "affiliate_com" | "amazon";

const providers: Record<ProviderName, () => ProductProvider> = {
  affiliate_com: () => new AffiliateComProvider(),
  amazon: () => new AmazonProvider(),
};

let cached: ProductProvider | null = null;

/**
 * Returns the active product provider based on the PRODUCT_PROVIDER
 * environment variable.  Defaults to "affiliate_com".
 *
 * The instance is cached for the lifetime of the process.
 */
export function getProductProvider(): ProductProvider {
  if (cached) return cached;

  const name = (process.env.PRODUCT_PROVIDER ?? "affiliate_com") as ProviderName;
  const factory = providers[name];

  if (!factory) {
    console.warn(
      `[enrichment] Unknown PRODUCT_PROVIDER "${name}", falling back to affiliate_com`
    );
    cached = new AffiliateComProvider();
  } else {
    cached = factory();
  }

  console.log(`[enrichment] Using product provider: ${cached.name}`);
  return cached;
}

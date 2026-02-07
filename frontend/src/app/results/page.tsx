"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { X, ImageIcon, SlidersHorizontal } from "lucide-react";
import { useProductStream } from "@/hooks/use-product-stream";
import { SearchStatus } from "@/components/results/search-status";
import { ProductDetailDrawer } from "@/components/results/product-detail-drawer";
import { EmailCaptureInline } from "@/components/results/email-capture-inline";
import { SaveAllButton } from "@/components/results/save-all-button";
import { ShareButton } from "@/components/results/share-button";
import { FindMoreCta } from "@/components/results/find-more-cta";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCurrencyLocale } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n/locale-provider";
import type { Product, ApiResponse } from "@spotthisfit/shared";

const MIN_MAIN_PRODUCTS = 4;
const SUGGESTION_PAGE_SIZE = 24;
const IMAGE_HEIGHT_CLASS = "h-[260px] sm:h-[300px] md:h-[320px]";

type SuggestionResponse = ApiResponse<{
  products: Product[];
  nextOffset?: number | null;
  totalCount?: number;
}>;

function SimilarProductCard({
  product,
  highlightLabel,
}: {
  product: Product;
  highlightLabel?: string | null;
}) {
  const { locale } = useLocale();
  const t = useTranslations();
  const setSelectedProduct = useResultsStore((s) => s.setSelectedProduct);
  const formatter = new Intl.NumberFormat(
    getCurrencyLocale(locale, product.currency),
    {
      style: "currency",
      currency: product.currency,
    },
  );
  const priceLabel =
    product.price > 0
      ? formatter.format(product.price)
      : t("results.priceUnavailable");
  const originalLabel =
    product.originalPrice && product.originalPrice > product.price
      ? formatter.format(product.originalPrice)
      : null;

  return (
    <button
      type="button"
      className="block h-full w-full text-left"
      onClick={() => setSelectedProduct(product)}
    >
      <Card className="group h-full overflow-hidden border-muted/60 bg-card/50 shadow-none transition-colors hover:border-foreground/20">
        <div className={cn("relative w-full bg-muted/40", IMAGE_HEIGHT_CLASS)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
          {highlightLabel && (
            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
              {highlightLabel}
            </span>
          )}
        </div>
        <CardContent className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </p>
            <span className="truncate text-[10px] text-muted-foreground">
              {product.retailer}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold",
                product.price <= 0 && "text-muted-foreground",
              )}
            >
              {priceLabel}
            </span>
            {originalLabel && (
              <span className="text-[10px] text-muted-foreground line-through">
                {originalLabel}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function DetectedItemCard({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card/60 p-2">
      <div className="size-10 overflow-hidden rounded-md bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold">{product.name}</p>
        <p className="text-[10px] uppercase text-muted-foreground">
          {product.category}
        </p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const searchId = useSearchStore((s) => s.searchId);
  const sourceImage = useSearchStore((s) => s.selectedFrame);
  const selectedProduct = useResultsStore((s) => s.selectedProduct);
  const setSelectedProduct = useResultsStore((s) => s.setSelectedProduct);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestionsOffset, setSuggestionsOffset] = useState(0);
  const [suggestionsHasMore, setSuggestionsHasMore] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (!searchId) {
      router.replace("/");
    }
  }, [searchId, router]);

  const {
    products,
    isStreaming,
    streamStatus,
    retailersSearched,
    streamComplete,
    error,
  } = useProductStream(searchId);

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setSelectedProduct(null);
    },
    [setSelectedProduct],
  );

  // Split: highlighted product first in the main grid, rest in carousel
  const { mainProducts } = useMemo(() => {
    const highlighted = products.filter((p) => p.isHighlighted);
    const others = products.filter((p) => !p.isHighlighted);

    if (highlighted.length === 0) {
      return { mainProducts: products, otherProducts: [] };
    }

    const needed = Math.max(0, MIN_MAIN_PRODUCTS - highlighted.length);
    return {
      mainProducts: [...highlighted, ...others.slice(0, needed)],
    };
  }, [products]);

  const primaryProduct =
    products.find((product) => product.isHighlighted) ?? products[0] ?? null;
  const primaryQuery = primaryProduct?.searchQuery ?? null;

  const suggestionAnchorRef = useRef<HTMLDivElement | null>(null);

  const combinedProducts = useMemo(() => {
    const seen = new Set<string>();
    const merged: Product[] = [];
    for (const item of [...products, ...suggestions]) {
      const key = item.id || item.affiliateUrl || item.shopUrl;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      merged.push(item);
    }
    return merged;
  }, [mainProducts, suggestions]);

  const sortedProducts = useMemo(() => {
    if (sortBy === "price_asc") {
      return [...combinedProducts].sort(
        (a, b) => (a.price || 0) - (b.price || 0),
      );
    }
    if (sortBy === "price_desc") {
      return [...combinedProducts].sort(
        (a, b) => (b.price || 0) - (a.price || 0),
      );
    }
    return combinedProducts;
  }, [combinedProducts, sortBy]);

  const fetchSuggestions = useCallback(
    async (overrideOffset?: number) => {
      if (!primaryQuery || suggestionsLoading || !suggestionsHasMore) return;
      const offset =
        overrideOffset !== undefined ? overrideOffset : suggestionsOffset;
    setSuggestionsLoading(true);
    try {
      const res = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(primaryQuery)}&limit=${SUGGESTION_PAGE_SIZE}&offset=${offset}`,
      );
      const data = (await res.json()) as SuggestionResponse;
      if (!data.success) {
        setSuggestionsHasMore(false);
        return;
      }
      setSuggestions((prev) => [...prev, ...data.data.products]);
      setSuggestionsOffset(data.data.nextOffset ?? 0);
      setSuggestionsHasMore(Boolean(data.data.nextOffset));
    } catch {
      setSuggestionsHasMore(false);
    } finally {
      setSuggestionsLoading(false);
    }
    },
    [primaryQuery, suggestionsLoading, suggestionsHasMore, suggestionsOffset],
  );

  useEffect(() => {
    setSuggestions([]);
    setSuggestionsOffset(0);
    setSuggestionsHasMore(true);
    if (primaryQuery) {
      fetchSuggestions(0);
    }
  }, [primaryQuery, fetchSuggestions]);

  useEffect(() => {
    const node = suggestionAnchorRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchSuggestions();
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchSuggestions]);

  if (!searchId) return null;

  return (
    <PageTransition>
      <div className="px-4 py-6 sm:px-6 lg:mx-auto lg:max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="flex flex-col gap-4">
            <SearchStatus
              status={streamStatus}
              isStreaming={isStreaming}
              retailersSearched={retailersSearched}
              streamComplete={streamComplete}
            />

            <EmailCaptureInline />

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            {sourceImage && (
              <div className="rounded-xl border bg-card/60 p-3">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push("/search/frame")}
                  >
                    {t("results.editImage")}
                  </Button>
                  <ShareButton />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">
                {t("results.detectedItems.title")}
              </h2>
              {mainProducts.slice(0, 6).map((product) => (
                <DetectedItemCard key={product.id} product={product} />
              ))}
            </div>

            <div className="rounded-xl border bg-card/40 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <SlidersHorizontal className="size-4" />
                {t("results.filters")}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("results.filtersHint")}
              </p>
            </div>
          </aside>

          <main className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold">
                  {t("results.similarProducts.title")}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t("results.similarProducts.subtitle")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">
                  {t("results.sort")}
                </label>
                <select
                  className="rounded-md border bg-transparent px-2 py-1 text-xs"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="relevance">{t("results.sortRelevance")}</option>
                  <option value="price_asc">{t("results.sortPriceLow")}</option>
                  <option value="price_desc">{t("results.sortPriceHigh")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {sortedProducts.map((product, index) => (
                <SimilarProductCard
                  key={product.id}
                  product={product}
                  highlightLabel={
                    index === 0
                      ? t("results.similarProducts.mostSimilar")
                      : index < 4
                        ? t("results.similarProducts.verySimilar")
                        : null
                  }
                />
              ))}
            </div>

            {suggestionsLoading && (
              <p className="text-xs text-muted-foreground">
                {t("results.loadingMore")}
              </p>
            )}

            <div ref={suggestionAnchorRef} />

            {streamComplete && products.length > 0 && (
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <SaveAllButton />
                  <ShareButton />
                </div>
                <FindMoreCta />
              </div>
            )}
          </main>
        </div>
      </div>

      <ProductDetailDrawer
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={handleDrawerOpenChange}
      />

      {/* Source image preview thumbnail */}
      {sourceImage && (
        <div className="fixed bottom-4 right-4 z-40 lg:hidden">
          {previewDismissed ? (
            /* Collapsed bubble to reopen */
            <button
              type="button"
              onClick={() => setPreviewDismissed(false)}
              className="flex size-10 items-center justify-center rounded-full border bg-card shadow-lg transition-transform hover:scale-110"
            >
              <ImageIcon className="size-4 text-muted-foreground" />
            </button>
          ) : (
            /* Expanded preview */
            <div
              className="relative overflow-hidden rounded-lg border bg-card shadow-lg transition-all duration-200"
              style={{ width: previewExpanded ? 200 : 100, height: previewExpanded ? 400 : 200 }}
            >
              <button
                type="button"
                className="block h-full w-full"
                onClick={() => setPreviewExpanded((v) => !v)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sourceImage}
                  alt="Source"
                  className="h-full w-full object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDismissed(true)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white transition-colors hover:bg-black/80"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}

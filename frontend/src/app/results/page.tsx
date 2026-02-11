"use client";

import { Suspense, useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { VideoFrameStrip } from "@/components/results/video-frame-strip";
import { useImageSearch } from "@/hooks/use-image-search";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCurrencyLocale } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n/locale-provider";
import type { Product, ApiResponse } from "@spotthisfit/shared";
import { useCurrencyStore, type Currency } from "@/stores/currency-store";
import { getVideoSearchById } from "@/lib/video-search-db";

const MIN_MAIN_PRODUCTS = 4;
const SUGGESTION_PAGE_SIZE = 24;
const IMAGE_HEIGHT_CLASS = "h-[180px] sm:h-[260px] md:h-[300px] lg:h-[320px]";

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
  const displayCurrency = useCurrencyStore((s) => s.currency);
  const convert = useCurrencyStore((s) => s.convert);
  const convertedPrice = convert(product.price, product.currency);
  const convertedOriginal = product.originalPrice
    ? convert(product.originalPrice, product.currency)
    : undefined;
  const formatter = new Intl.NumberFormat(
    getCurrencyLocale(locale, displayCurrency),
    {
      style: "currency",
      currency: displayCurrency,
    },
  );
  const priceLabel =
    convertedPrice > 0
      ? formatter.format(convertedPrice)
      : t("results.priceUnavailable");
  const originalLabel =
    convertedOriginal && convertedOriginal > convertedPrice
      ? formatter.format(convertedOriginal)
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
        <CardContent className="flex flex-col gap-1.5 p-2 sm:gap-2 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-[9px] uppercase tracking-wide text-muted-foreground sm:text-[10px]">
              {product.brand}
            </p>
            <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
              {product.retailer}
            </span>
          </div>
          <h3 className="line-clamp-2 text-xs font-semibold leading-tight sm:text-sm">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-between gap-1">
            <span
              className={cn(
                "text-xs font-semibold sm:text-sm",
                convertedPrice <= 0 && "text-muted-foreground",
              )}
            >
              {priceLabel}
            </span>
            {originalLabel && (
              <span className="text-[9px] text-muted-foreground line-through sm:text-[10px]">
                {originalLabel}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function CurrencySelector() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  return (
    <select
      className="rounded-md border bg-transparent px-2 py-1 text-xs"
      value={currency}
      onChange={(e) => setCurrency(e.target.value as Currency)}
    >
      <option value="USD">USD ($)</option>
      <option value="CAD">CAD (C$)</option>
      <option value="GBP">GBP (&pound;)</option>
      <option value="EUR">EUR (&euro;)</option>
    </select>
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

function ResultsPageContent() {
  const searchId = useSearchStore((s) => s.searchId);
  const sourceImage = useSearchStore((s) => s.selectedFrame);
  const videoFrames = useSearchStore((s) => s.videoFrames);
  const setVideoFrames = useSearchStore((s) => s.setVideoFrames);
  const setSelectedFrame = useSearchStore((s) => s.setSelectedFrame);
  const selectedProduct = useResultsStore((s) => s.selectedProduct);
  const setSelectedProduct = useResultsStore((s) => s.setSelectedProduct);
  const setProducts = useResultsStore((s) => s.setProducts);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestionsOffset, setSuggestionsOffset] = useState(0);
  const [suggestionsHasMore, setSuggestionsHasMore] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeFrame, setActiveFrame] = useState<string | null>(sourceImage);
  const [frameSearching, setFrameSearching] = useState(false);
  const frameProductCache = useRef<Map<string, Product[]>>(new Map());
  const [loadingFromDb, setLoadingFromDb] = useState(false);
  const hasLoadedFromDb = useRef(false);
  const imageSearch = useImageSearch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("q");
  const runId = searchParams.get("id");
  const keysParam = searchParams.get("keys");
  const hasRunIdParam = Boolean(runId && keysParam);
  const hasLoadedRunId = useRef(false);
  const t = useTranslations();

  const SCREENSHOT_WORKER = "https://instag-playwright.shadidhaque2014.workers.dev";
  const RESULTS_WORKER = "https://vertorize-img-results.shadidhaque2014.workers.dev";

  const hasVideoFrames = videoFrames.length > 0;

  // Load frames from Firestore when arriving via ?q= param (e.g. shared link)
  useEffect(() => {
    if (!queryId || hasVideoFrames || hasLoadedFromDb.current) return;
    hasLoadedFromDb.current = true;
    setLoadingFromDb(true);

    (async () => {
      try {
        const result = await getVideoSearchById(queryId);
        if (!result) return;

        setVideoFrames(result.frames);
        const middleFrame = result.frames[Math.floor(result.frames.length / 2)];
        setActiveFrame(middleFrame);
        setSelectedFrame(middleFrame);
        setFrameSearching(true);
        imageSearch.searchByUrl(middleFrame);
      } catch {
        // Firestore lookup failed — page will show empty state
      } finally {
        setLoadingFromDb(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  // Load frames from ?id= + ?keys= params, then search for products via image
  useEffect(() => {
    if (!runId || !keysParam || hasLoadedRunId.current) return;
    hasLoadedRunId.current = true;

    const keys = keysParam.split(",").map((k) => decodeURIComponent(k));
    const frameUrls = keys.map((key) => `${SCREENSHOT_WORKER}/?key=${encodeURIComponent(key)}`);
    setVideoFrames(frameUrls);

    const middleFrame = frameUrls[Math.floor(frameUrls.length / 2)];
    setActiveFrame(middleFrame);
    setSelectedFrame(middleFrame);
    setFrameSearching(true);
    imageSearch.searchByUrl(middleFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, keysParam]);

  // Direct results from Pinecone image search (no streaming)
  const directProducts = useResultsStore((s) => s.streamedProducts);
  const directComplete = useResultsStore((s) => s.streamComplete);

  const hasDirectResults = !searchId && directProducts.length > 0;

  // Seed the cache with the initial products for the initially selected frame
  useEffect(() => {
    if (sourceImage && directProducts.length > 0 && !frameProductCache.current.has(sourceImage)) {
      frameProductCache.current.set(sourceImage, directProducts);
    }
  }, [sourceImage, directProducts]);

  // Handle frame search completion
  useEffect(() => {
    if (imageSearch.stage === "done" && imageSearch.products.length > 0 && activeFrame) {
      frameProductCache.current.set(activeFrame, imageSearch.products);
      setProducts(imageSearch.products);
      setSelectedFrame(activeFrame);
      setFrameSearching(false);
      // Reset suggestions for new products
      setSuggestions([]);
      setSuggestionsOffset(0);
      setSuggestionsHasMore(true);
    }
    if (imageSearch.stage === "error") {
      setFrameSearching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSearch.stage]);

  const handleFrameSelect = useCallback(
    (frameUrl: string) => {
      if (frameUrl === activeFrame) return;
      setActiveFrame(frameUrl);

      const cached = frameProductCache.current.get(frameUrl);
      if (cached) {
        setProducts(cached);
        setSelectedFrame(frameUrl);
        // Reset suggestions for cached products
        setSuggestions([]);
        setSuggestionsOffset(0);
        setSuggestionsHasMore(true);
        return;
      }

      setFrameSearching(true);
      imageSearch.searchByUrl(frameUrl);
    },
    [activeFrame, setProducts, setSelectedFrame, imageSearch],
  );

  useEffect(() => {
    if (!searchId && !hasDirectResults && !queryId && !hasRunIdParam) {
      router.replace("/");
    }
  }, [searchId, hasDirectResults, queryId, hasRunIdParam, router]);

  const stream = useProductStream(searchId);

  // Use direct results if no searchId, otherwise use stream
  const products = hasDirectResults ? directProducts : stream.products;
  const isStreaming = hasDirectResults ? false : stream.isStreaming;
  const streamStatus = hasDirectResults
    ? `Found ${directProducts.length} similar products`
    : stream.streamStatus;
  const retailersSearched = hasDirectResults
    ? directProducts.length
    : stream.retailersSearched;
  const streamComplete = hasDirectResults ? true : stream.streamComplete;
  const error = hasDirectResults ? null : stream.error;

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
  }, [products, suggestions]);

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

  if (!searchId && !hasDirectResults && !queryId && !hasRunIdParam) return null;

  // Show loading state when loading from ?id= param
  if (hasRunIdParam && frameSearching && !hasDirectResults) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
          <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-lg font-semibold">Loading your results...</h2>
            <p className="text-sm text-muted-foreground">
              Finding the best matches for you
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={cn("px-3 py-4 sm:px-6 sm:py-6 lg:mx-auto lg:max-w-6xl", hasVideoFrames && "pb-28")}>
        {/* Mobile: compact header with source image + status */}
        <div className="mb-4 flex items-center gap-3 lg:hidden">
          {sourceImage && (
            <div className="size-14 shrink-0 overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sourceImage}
                alt="Source"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <SearchStatus
              status={streamStatus}
              isStreaming={isStreaming}
              retailersSearched={retailersSearched}
              streamComplete={streamComplete}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 lg:hidden">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Desktop sidebar — hidden on mobile */}
          <aside className="hidden lg:flex lg:flex-col lg:gap-4">
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

          {/* Main product grid */}
          <main className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold sm:text-xl">
                  {t("results.similarProducts.title")}
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {t("results.similarProducts.subtitle")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <CurrencySelector />
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

            <div className="relative">
              {frameSearching && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Finding products for this frame...</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
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
            </div>

            {suggestionsLoading && (
              <p className="text-xs text-muted-foreground">
                {t("results.loadingMore")}
              </p>
            )}

            <div ref={suggestionAnchorRef} />

            {streamComplete && products.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:mt-6">
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

      {/* Video frame strip — bottom of viewport */}
      {hasVideoFrames && (
        <VideoFrameStrip
          frames={videoFrames}
          activeFrame={activeFrame}
          onFrameSelect={handleFrameSelect}
          isLoading={frameSearching}
        />
      )}

      {/* Floating source image preview — mobile only */}
      {sourceImage && !hasVideoFrames && (
        <div className="fixed bottom-4 right-4 z-40 lg:hidden">
          {previewDismissed ? (
            <button
              type="button"
              onClick={() => setPreviewDismissed(false)}
              className="flex size-10 items-center justify-center rounded-full border bg-card shadow-lg transition-transform hover:scale-110"
            >
              <ImageIcon className="size-4 text-muted-foreground" />
            </button>
          ) : (
            <div
              className="relative overflow-hidden rounded-lg border bg-card shadow-lg transition-all duration-200"
              style={{ width: previewExpanded ? 160 : 72, height: previewExpanded ? 280 : 72 }}
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

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsPageContent />
    </Suspense>
  );
}

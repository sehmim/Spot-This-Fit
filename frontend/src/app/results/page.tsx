"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { X } from "lucide-react";
import { useProductStream } from "@/hooks/use-product-stream";
import { SearchStatus } from "@/components/results/search-status";
import { StreamingProductGrid } from "@/components/results/streaming-product-grid";
import { OtherProductsCarousel } from "@/components/results/other-products-carousel";
import { ProductDetailDrawer } from "@/components/results/product-detail-drawer";
import { EmailCaptureInline } from "@/components/results/email-capture-inline";
import { SaveAllButton } from "@/components/results/save-all-button";
import { ShareButton } from "@/components/results/share-button";
import { FindMoreCta } from "@/components/results/find-more-cta";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/layout/page-transition";

const MIN_MAIN_PRODUCTS = 4;

export default function ResultsPage() {
  const searchId = useSearchStore((s) => s.searchId);
  const sourceImage = useSearchStore((s) => s.selectedFrame);
  const selectedProduct = useResultsStore((s) => s.selectedProduct);
  const setSelectedProduct = useResultsStore((s) => s.setSelectedProduct);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const router = useRouter();

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
  const { mainProducts, otherProducts } = useMemo(() => {
    const highlighted = products.filter((p) => p.isHighlighted);
    const others = products.filter((p) => !p.isHighlighted);

    if (highlighted.length === 0) {
      return { mainProducts: products, otherProducts: [] };
    }

    const needed = Math.max(0, MIN_MAIN_PRODUCTS - highlighted.length);
    return {
      mainProducts: [...highlighted, ...others.slice(0, needed)],
      otherProducts: others.slice(needed),
    };
  }, [products]);

  if (!searchId) return null;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:mx-auto md:max-w-3xl lg:max-w-5xl">
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

        <StreamingProductGrid
          products={mainProducts}
          isStreaming={isStreaming}
          skeletonCount={4}
        />

        {otherProducts.length > 0 && (
          <>
            <Separator />
            <OtherProductsCarousel products={otherProducts} />
          </>
        )}

        {streamComplete && products.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <SaveAllButton />
              <ShareButton />
            </div>
            <FindMoreCta />
          </>
        )}
      </div>

      <ProductDetailDrawer
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={handleDrawerOpenChange}
      />

      {/* Source image preview thumbnail */}
      {sourceImage && !previewDismissed && (
        <div className="fixed bottom-4 right-4 z-40">
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
        </div>
      )}
    </PageTransition>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useProductStream } from "@/hooks/use-product-stream";
import { SearchStatus } from "@/components/results/search-status";
import { StreamingProductGrid } from "@/components/results/streaming-product-grid";
import { OtherProductsCarousel } from "@/components/results/other-products-carousel";
import { EmailCaptureInline } from "@/components/results/email-capture-inline";
import { SaveAllButton } from "@/components/results/save-all-button";
import { ShareButton } from "@/components/results/share-button";
import { FindMoreCta } from "@/components/results/find-more-cta";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/layout/page-transition";

export default function ResultsPage() {
  const searchId = useSearchStore((s) => s.searchId);
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

  // Split: highlighted product first in the main grid, rest in carousel
  const { mainProducts, otherProducts } = useMemo(() => {
    const highlighted = products.filter((p) => p.isHighlighted);
    const others = products.filter((p) => !p.isHighlighted);
    return {
      mainProducts: highlighted.length > 0 ? highlighted : products,
      otherProducts: highlighted.length > 0 ? others : [],
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
    </PageTransition>
  );
}

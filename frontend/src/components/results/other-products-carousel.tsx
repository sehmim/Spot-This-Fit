"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencyLocale } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n/locale-provider";
import { useResultsStore } from "@/stores/results-store";
import type { Product } from "@spotthisfit/shared";

// Compact card for the carousel — smaller than the main ProductCard
function CompactProductCard({ product }: { product: Product }) {
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
      <Card className="group h-full overflow-hidden border-muted/60 bg-card/50 shadow-none transition-colors cursor-pointer hover:border-foreground/20">
        <div className="relative aspect-square w-full bg-muted/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <CardContent className="flex flex-col gap-1.5 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </p>
            <span className="truncate text-[10px] text-muted-foreground">
              {product.retailer}
            </span>
          </div>
          <h4 className="line-clamp-2 text-xs font-semibold leading-tight">
            {product.name}
          </h4>
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

interface OtherProductsCarouselProps {
  products: Product[];
}

export function OtherProductsCarousel({
  products,
}: OtherProductsCarouselProps) {
  const t = useTranslations();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const countLabel =
    products.length === 1
      ? t("results.otherProducts.count_one", { count: products.length })
      : t("results.otherProducts.count_other", { count: products.length });

  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {t("results.otherProducts.title")}
          </h2>
          <p className="text-xs text-muted-foreground">{countLabel}</p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={scrollPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={scrollNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-0 flex-shrink-0"
              style={{ flexBasis: "45%", maxWidth: "180px" }}
            >
              <CompactProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

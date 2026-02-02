"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidenceBadge } from "./confidence-badge";
import { cn } from "@/lib/utils";
import { getCurrencyLocale } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n/locale-provider";
import { useResultsStore } from "@/stores/results-store";
import type { Product } from "@spotthisfit/shared";

const MIN_PRODUCTS = 4;
const MAX_PRODUCTS = 6;
const IMAGE_HEIGHT_CLASS = "h-[200px] sm:h-[220px] md:h-[240px]";

function MinimalProductCard({ product }: { product: Product }) {
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
      <Card
        className={cn(
          "group h-full overflow-hidden border-muted/60 bg-card/50 shadow-none transition-colors cursor-pointer hover:border-foreground/20",
          product.isHighlighted && "ring-1 ring-foreground/20",
        )}
      >
        <div className={cn("relative w-full bg-muted/50", IMAGE_HEIGHT_CLASS)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute right-2 top-2 opacity-90">
            <ConfidenceBadge
              level={product.confidence}
              score={product.confidenceScore}
            />
          </div>
        </div>
        <CardContent className="flex flex-col gap-1.5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </p>
            <span className="truncate text-[10px] text-muted-foreground">
              {product.retailer}
            </span>
          </div>
          <h3 className="line-clamp-2 text-xs font-semibold leading-tight">
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

function SkeletonCard() {
  return (
    <Card className="overflow-hidden border-muted/60 bg-card/50 shadow-none">
      <Skeleton className={cn("w-full rounded-none", IMAGE_HEIGHT_CLASS)} />
      <CardContent className="flex flex-col gap-2 p-3">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}

interface StreamingProductGridProps {
  products: Product[];
  isStreaming: boolean;
  skeletonCount?: number;
}

export function StreamingProductGrid({
  products,
  isStreaming,
  skeletonCount = 4,
}: StreamingProductGridProps) {
  const visibleProducts = products.slice(0, MAX_PRODUCTS);
  const clampedSkeletons = Math.min(
    MAX_PRODUCTS,
    Math.max(MIN_PRODUCTS, skeletonCount),
  );
  const remainingSkeletons = isStreaming
    ? Math.max(0, clampedSkeletons - visibleProducts.length)
    : 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {visibleProducts.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
          >
            <MinimalProductCard product={product} />
          </motion.div>
        ))}
      </AnimatePresence>

      {Array.from({ length: remainingSkeletons }).map((_, i) => (
        <div key={`skeleton-${i}`}>
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

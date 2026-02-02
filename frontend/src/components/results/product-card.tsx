"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "./confidence-badge";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { Product } from "@spotthisfit/shared";
import { getCurrencyLocale } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n/locale-provider";
import { useResultsStore } from "@/stores/results-store";

export function ProductCard({ product }: { product: Product }) {
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
      className="block w-full text-left"
      onClick={() => setSelectedProduct(product)}
    >
      <Card
        className={cn(
          "group overflow-hidden border-muted/60 bg-card/50 shadow-none transition-colors cursor-pointer hover:border-foreground/20",
          product.isHighlighted && "ring-1 ring-foreground/20",
        )}
      >
        <div className="relative h-[200px] w-full bg-muted/50 sm:h-[220px] md:h-[240px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute top-2 right-2">
            <ConfidenceBadge
              level={product.confidence}
              score={product.confidenceScore}
            />
          </div>
          {product.isHighlighted && (
            <div className="absolute top-2 left-2">
              <Badge className="gap-1 bg-blue-600 text-[10px] text-white hover:bg-blue-600">
                <Sparkles className="size-3" />
                {t("results.highlightedBadge")}
              </Badge>
            </div>
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
          <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
          {product.exactModel && (
            <p className="font-mono text-[10px] text-muted-foreground">
              {product.exactModel}
            </p>
          )}
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
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </CardContent>
      </Card>
    </button>
  );
}

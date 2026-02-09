"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "./confidence-badge";
import { cn } from "@/lib/utils";
import { getCurrencyLocale } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n/locale-provider";
import { ArrowLeft, ExternalLink, Sparkles, Tag } from "lucide-react";
import type { Product } from "@spotthisfit/shared";

interface ProductDetailDrawerProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AvailabilityBadge({
  availability,
}: {
  availability: string | undefined;
}) {
  const t = useTranslations();
  if (!availability) return null;

  const map: Record<string, { key: Parameters<typeof t>[0]; className: string }> = {
    in_stock: {
      key: "drawer.inStock",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    low_stock: {
      key: "drawer.lowStock",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    out_of_stock: {
      key: "drawer.outOfStock",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const info = map[availability];
  if (!info) return null;

  return (
    <Badge variant="outline" className={cn("text-[10px]", info.className)}>
      {t(info.key)}
    </Badge>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

export function ProductDetailDrawer({
  product,
  open,
  onOpenChange,
}: ProductDetailDrawerProps) {
  const { locale } = useLocale();
  const t = useTranslations();

  if (!product) return null;

  const formatter = new Intl.NumberFormat(
    getCurrencyLocale(locale, product.currency),
    { style: "currency", currency: product.currency },
  );

  const priceLabel =
    product.price > 0 ? formatter.format(product.price) : t("results.priceUnavailable");
  const originalLabel =
    product.originalPrice && product.originalPrice > product.price
      ? formatter.format(product.originalPrice)
      : null;

  const productUrl = product.affiliateUrl ?? product.shopUrl;
  const hasUrl = productUrl && productUrl !== "#";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md [&>button:last-of-type]:hidden"
      >
        {/* Back button */}
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 z-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            aria-label={t("drawer.back") || "Back"}
          >
            <ArrowLeft className="size-5" />
          </Button>
        </SheetClose>

        {/* Product image */}
        <div className="relative w-full max-h-[60vh] shrink-0 bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain"
          />

          {/* Badges overlay */}
          <div className="absolute top-3 right-3">
            <ConfidenceBadge
              level={product.confidence}
              score={product.confidenceScore}
            />
          </div>
          {product.isHighlighted && (
            <div className="absolute top-3 left-3">
              <Badge className="gap-1 bg-blue-600 text-[10px] text-white hover:bg-blue-600">
                <Sparkles className="size-3" />
                {t("results.highlightedBadge")}
              </Badge>
            </div>
          )}
          {product.onSale && product.saleDiscount && (
            <div className="absolute bottom-3 left-3">
              <Badge className="gap-1 bg-red-600 text-xs text-white hover:bg-red-600">
                <Tag className="size-3" />
                {t("drawer.sale", { discount: product.saleDiscount })}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          <SheetHeader className="gap-1 text-left">
            {/* Brand + Retailer */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {product.brand}
              </p>
              <AvailabilityBadge availability={product.availability} />
            </div>
            <SheetTitle className="text-lg leading-tight">
              {product.name}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Product details for {product.name}
            </SheetDescription>
          </SheetHeader>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span
              className={cn(
                "text-2xl font-bold",
                product.price <= 0 && "text-muted-foreground",
              )}
            >
              {priceLabel}
            </span>
            {originalLabel && (
              <span className="text-sm text-muted-foreground line-through">
                {originalLabel}
              </span>
            )}
          </div>

          {/* Merchant */}
          {product.merchantName && (
            <div className="flex items-center gap-2">
              {product.merchantLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.merchantLogo}
                  alt={product.merchantName}
                  className="size-5 rounded-sm object-contain"
                />
              )}
              <span className="text-xs text-muted-foreground">
                {t("drawer.soldBy")} {product.merchantName}
              </span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Details */}
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
            <DetailRow label={t("drawer.color")} value={product.color} />
            <DetailRow label={t("drawer.material")} value={product.material} />
            <DetailRow label={t("drawer.size")} value={product.size} />
            <DetailRow label={t("drawer.model")} value={product.exactModel} />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Shop button */}
          {hasUrl && (
            <Button asChild size="lg" className="w-full gap-2">
              <a href={productUrl} target="_blank" rel="noopener noreferrer">
                {t("drawer.shopNow")}
                <ExternalLink className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

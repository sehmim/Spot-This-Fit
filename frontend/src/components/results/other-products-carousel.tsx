"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ExternalLink, Star } from "lucide-react";
import type { Product } from "@spotthisfit/shared";

// Compact card for the carousel — smaller than the main ProductCard
function CompactProductCard({ product }: { product: Product }) {
  const isAmazon = product.retailer === "Amazon.ca";

  return (
    <Card className="h-full overflow-hidden">
      <div className="relative aspect-square w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        {product.amazonPrime && (
          <div className="absolute bottom-1.5 left-1.5">
            <span className="inline-flex items-center rounded bg-[#232F3E] px-1 py-0.5 text-[9px] font-bold leading-tight text-white">
              prime
            </span>
          </div>
        )}
      </div>
      <CardContent className="flex flex-col gap-1 p-2.5">
        <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </p>
        <h4 className="line-clamp-2 text-xs font-semibold leading-tight">
          {product.name}
        </h4>
        <div className="flex items-center gap-1.5">
          {product.price > 0 && (
            <span className="text-sm font-bold">
              ${product.price.toFixed(2)}
            </span>
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        {product.amazonRating != null && (
          <div className="flex items-center gap-1">
            <Star className="size-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] text-muted-foreground">
              {product.amazonRating.toFixed(1)}
            </span>
          </div>
        )}
        {(product.affiliateUrl || (product.shopUrl !== "#" && isAmazon)) && (
          <Button
            asChild
            size="sm"
            className="mt-1 h-7 w-full gap-1 bg-[#FF9900] text-[10px] text-black hover:bg-[#e88b00]"
          >
            <a
              href={product.affiliateUrl ?? product.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Amazon.ca
              <ExternalLink className="size-2.5" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface OtherProductsCarouselProps {
  products: Product[];
}

export function OtherProductsCarousel({
  products,
}: OtherProductsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Other products in this video
          </h2>
          <p className="text-xs text-muted-foreground">
            {products.length} more item{products.length !== 1 ? "s" : ""}{" "}
            spotted
          </p>
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

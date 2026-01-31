import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "./confidence-badge";
import { PriceDisplay } from "./price-display";
import { ExternalLink, Star, Sparkles } from "lucide-react";
import type { Product } from "@spotthisfit/shared";

function StarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className="size-3 fill-amber-400 text-amber-400"
          />
        ))}
        {hasHalf && (
          <div className="relative">
            <Star className="size-3 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star className="size-3 fill-amber-400 text-amber-400" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="size-3 text-gray-300" />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">
        {rating.toFixed(1)} ({reviewCount.toLocaleString()})
      </span>
    </div>
  );
}

function PrimeBadge() {
  return (
    <span className="inline-flex items-center rounded bg-[#232F3E] px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white">
      prime
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const isAmazon = product.retailer === "Amazon.ca";
  const hasAffiliate = product.affiliateUrl || (product.shopUrl !== "#" && isAmazon);

  return (
    <Card className={`overflow-hidden ${product.isHighlighted ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}>
      <div className="relative aspect-[3/4] w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
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
              Highlighted
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="flex flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
        {product.exactModel && (
          <p className="font-mono text-[10px] text-muted-foreground">
            {product.exactModel}
          </p>
        )}
        {product.price > 0 ? (
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            currency={product.currency}
          />
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            Price not available
          </p>
        )}
        {product.amazonRating != null && product.amazonReviewCount != null && (
          <StarRating
            rating={product.amazonRating}
            reviewCount={product.amazonReviewCount}
          />
        )}
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {isAmazon && (
            <span className="text-[10px] font-medium text-muted-foreground">
              Amazon.ca
            </span>
          )}
          {product.amazonPrime && <PrimeBadge />}
        </div>
        {hasAffiliate ? (
          <Button
            asChild
            className="mt-1 w-full gap-2 bg-[#FF9900] text-black hover:bg-[#e88b00]"
            size="sm"
          >
            <a
              href={product.affiliateUrl ?? product.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Amazon.ca
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        ) : product.shopUrl !== "#" ? (
          <Button asChild className="mt-1 w-full gap-2" size="sm">
            <a
              href={product.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Shop Now
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

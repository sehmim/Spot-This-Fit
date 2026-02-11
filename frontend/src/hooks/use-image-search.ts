"use client";

import { useState, useCallback } from "react";
import type { Product, ProductCategory } from "@spotthisfit/shared";

const VECTORIZE_URL =
  "https://vertorize-img-get-similar-products.shadidhaque2014.workers.dev";

type SearchStage = "idle" | "analyzing" | "finding_matches" | "done" | "error";

export interface WorkerProduct {
  id: string;
  data: string; // JSON-encoded product data
}

interface WorkerResponse {
  ok: boolean;
  products: WorkerProduct[];
}

interface ParsedProductData {
  id: string;
  title: string;
  link: string;
  image_link: string;
  additional_image_link?: string;
  availability?: string;
  price?: string;
  sale_price?: string;
  gender?: string;
  size?: string;
  google_product_category?: string;
}

function parsePrice(priceStr?: string): { amount: number; currency: string } {
  if (!priceStr) return { amount: 0, currency: "USD" };
  const match = priceStr.match(/([\d.]+)\s*([A-Z]{3})?/);
  if (!match) return { amount: 0, currency: "USD" };
  return { amount: parseFloat(match[1]) || 0, currency: match[2] || "USD" };
}

function inferCategory(title: string): ProductCategory {
  const t = title.toLowerCase();
  if (/\b(shoe|sneaker|boot|loafer|sandal|trainer|heel|flat|slipper)\b/.test(t)) return "shoes";
  if (/\b(jacket|coat|blazer|parka|hoodie|vest|windbreaker)\b/.test(t)) return "outerwear";
  if (/\b(pants?|trousers?|jeans|shorts|chinos?|joggers?|leggings|skirt)\b/.test(t)) return "bottom";
  if (/\b(shirt|blouse|top|polo|tee|t-shirt|sweater|jumper|cardigan)\b/.test(t)) return "top";
  if (/\b(dress|gown|romper|jumpsuit)\b/.test(t)) return "dress";
  if (/\b(bag|handbag|backpack|purse|tote)\b/.test(t)) return "bag";
  return "other";
}

export function mapWorkerProduct(wp: WorkerProduct, index: number): Product {
  const data: ParsedProductData = JSON.parse(wp.data);
  const { amount: price, currency } = parsePrice(data.price);
  const { amount: salePrice } = parsePrice(data.sale_price);
  const onSale = salePrice > 0 && salePrice < price;

  return {
    id: data.id,
    name: data.title,
    brand: "Unknown",
    category: inferCategory(data.title),
    imageUrl: data.image_link,
    price: onSale ? salePrice : price,
    currency,
    originalPrice: onSale ? price : undefined,
    shopUrl: data.link,
    affiliateUrl: data.link,
    retailer: "Awin",
    confidence: index < 3 ? "high" : index < 8 ? "medium" : "low",
    confidenceScore: Math.max(10, 100 - index * 7),
    onSale,
    availability: data.availability,
    size: data.size || undefined,
    color: data.gender || undefined,
  };
}

interface UseImageSearchReturn {
  stage: SearchStage;
  products: Product[];
  error: string | null;
  searchByUrl: (imageUrl: string) => Promise<void>;
  reset: () => void;
}

export function useImageSearch(): UseImageSearchReturn {
  const [stage, setStage] = useState<SearchStage>("idle");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStage("idle");
    setProducts([]);
    setError(null);
  }, []);

  const searchByUrl = useCallback(async (imageUrl: string) => {
    setStage("analyzing");
    setError(null);
    setProducts([]);

    const minDelay = new Promise((r) => setTimeout(r, 1000));

    try {
      const apiCall = fetch(VECTORIZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ img_url: imageUrl, top_k: 15 }),
      });

      await minDelay;
      setStage("finding_matches");

      const res = await apiCall;
      if (!res.ok) throw new Error("Vectorize service error");

      const data = (await res.json()) as WorkerResponse;
      if (!data.ok) throw new Error("Vectorize service returned an error");

      await new Promise((r) => setTimeout(r, 750));

      setProducts(data.products.map(mapWorkerProduct));
      setStage("done");
    } catch {
      setError("Something went wrong while searching. Please try again.");
      setStage("error");
    }
  }, []);

  return { stage, products, error, searchByUrl, reset };
}

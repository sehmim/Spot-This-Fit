"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, Product } from "@spotthisfit/shared";

type SearchStage = "idle" | "analyzing" | "finding_matches" | "done" | "error";

interface UseImageSearchReturn {
  stage: SearchStage;
  products: Product[];
  error: string | null;
  searchByBase64: (base64: string) => Promise<void>;
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

  const runSearch = useCallback(
    async (body: { image?: string; imageUrl?: string }) => {
      setStage("analyzing");
      setError(null);
      setProducts([]);

      const minDelay = new Promise((r) => setTimeout(r, 2000));

      try {
        const apiCall = apiClient.post<ApiResponse<{ products: Product[] }>>(
          "/api/search/image",
          body
        );

        await minDelay;
        setStage("finding_matches");

        const res = await apiCall;

        await new Promise((r) => setTimeout(r, 1500));

        setProducts(res.data.products);
        setStage("done");
      } catch {
        setError("Something went wrong while searching. Please try again.");
        setStage("error");
      }
    },
    []
  );

  const searchByBase64 = useCallback(
    (base64: string) => runSearch({ image: base64 }),
    [runSearch]
  );

  const searchByUrl = useCallback(
    (imageUrl: string) => runSearch({ imageUrl }),
    [runSearch]
  );

  return { stage, products, error, searchByBase64, searchByUrl, reset };
}

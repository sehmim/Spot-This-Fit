"use client";

import { useEffect, useRef } from "react";
import { useResultsStore } from "@/stores/results-store";
import type { SSEEvent, Product } from "@spotthisfit/shared";
import { useTranslations } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Translator = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

function translateStreamStatus(
  code: string,
  params: Record<string, string | number> | undefined,
  t: Translator,
) {
  switch (code) {
    case "analyzing_image":
      return t("results.searchStatus.analyzingImage");
    case "identified_products":
      return t("results.searchStatus.identifiedProducts", {
        count: params?.count ?? 0,
      });
    case "ai_failed":
      return t("results.searchStatus.aiFailed");
    case "found_product":
      return t("results.searchStatus.foundProduct", {
        product: params?.product ?? "",
      });
    default:
      return null;
  }
}

export function useProductStream(searchId: string | null) {
  const t = useTranslations();
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const addStreamedProduct = useResultsStore((s) => s.addStreamedProduct);
  const setIsStreaming = useResultsStore((s) => s.setIsStreaming);
  const setStreamStatus = useResultsStore((s) => s.setStreamStatus);
  const setRetailersSearched = useResultsStore((s) => s.setRetailersSearched);
  const setStreamComplete = useResultsStore((s) => s.setStreamComplete);
  const setError = useResultsStore((s) => s.setError);
  const resetStream = useResultsStore((s) => s.resetStream);

  const streamedProducts = useResultsStore((s) => s.streamedProducts);
  const isStreaming = useResultsStore((s) => s.isStreaming);
  const streamStatus = useResultsStore((s) => s.streamStatus);
  const retailersSearched = useResultsStore((s) => s.retailersSearched);
  const streamComplete = useResultsStore((s) => s.streamComplete);
  const error = useResultsStore((s) => s.error);

  const eventSourceRef = useRef<EventSource | null>(null);
  const connectedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!searchId) return;
    // Prevent duplicate connections for same searchId
    if (connectedForRef.current === searchId) return;
    connectedForRef.current = searchId;

    resetStream();
    setIsStreaming(true);
    setStreamStatus(tRef.current("results.searchStatus.connecting"));

    const es = new EventSource(`${API_BASE}/api/search/${searchId}/stream`);
    eventSourceRef.current = es;

    es.addEventListener("status", (e: MessageEvent) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        if (event.type === "status") {
          const localizedStatus = event.data.code
            ? translateStreamStatus(
                event.data.code,
                event.data.params,
                tRef.current,
              )
            : null;
          setStreamStatus(localizedStatus ?? event.data.message);
          setRetailersSearched(event.data.retailersSearched);
        }
      } catch {
        // Ignore parse errors
      }
    });

    es.addEventListener("product", (e: MessageEvent) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        if (event.type === "product") {
          addStreamedProduct(event.data as Product);
        }
      } catch {
        // Ignore parse errors
      }
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        if (event.type === "complete") {
          setStreamComplete(true);
          setIsStreaming(false);
          setStreamStatus(
            tRef.current("results.searchStatus.foundProducts", {
              count: event.data.totalProducts,
            })
          );
        }
      } catch {
        // Ignore parse errors
      }
      es.close();
    });

    es.onerror = () => {
      setError(tRef.current("results.searchStatus.connectionLost"));
      setIsStreaming(false);
      es.close();
    };

    return () => {
      es.close();
      connectedForRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchId]);

  return {
    products: streamedProducts,
    isStreaming,
    streamStatus,
    retailersSearched,
    streamComplete,
    error,
  };
}

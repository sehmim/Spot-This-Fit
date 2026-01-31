"use client";

import { useEffect, useRef } from "react";
import { useResultsStore } from "@/stores/results-store";
import type { SSEEvent, Product } from "@spotthisfit/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function useProductStream(searchId: string | null) {
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
    setStreamStatus("Connecting to search engine...");

    const es = new EventSource(`${API_BASE}/api/search/${searchId}/stream`);
    eventSourceRef.current = es;

    es.addEventListener("status", (e: MessageEvent) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        if (event.type === "status") {
          setStreamStatus(event.data.message);
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
          setStreamStatus(`Found ${event.data.totalProducts} products`);
        }
      } catch {
        // Ignore parse errors
      }
      es.close();
    });

    es.onerror = () => {
      setError("Connection lost. Please try again.");
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

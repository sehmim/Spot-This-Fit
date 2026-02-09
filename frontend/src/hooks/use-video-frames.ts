"use client";

import { useState, useCallback, useRef } from "react";

const WORKER_URL = "https://instag-playwright.shadidhaque2014.workers.dev";

interface UseVideoFramesReturn {
  frames: string[];
  isLoading: boolean;
  error: string | null;
  fetchFrames: (videoUrl: string, count?: number) => Promise<void>;
  reset: () => void;
}

export function useVideoFrames(): UseVideoFramesReturn {
  const [frames, setFrames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setFrames([]);
    setIsLoading(false);
    setError(null);
  }, []);

  const fetchFrames = useCallback(async (videoUrl: string, count = 6) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setFrames([]);

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl, count, prefix: "insta" }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Failed to fetch video previews");

      const data = (await res.json()) as { keys: string[] };
      const imageUrls = data.keys.map(
        (key: string) => `${WORKER_URL}/?key=${encodeURIComponent(key)}`
      );
      setFrames(imageUrls);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        "Failed to extract video frames. Please check the URL and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { frames, isLoading, error, fetchFrames, reset };
}

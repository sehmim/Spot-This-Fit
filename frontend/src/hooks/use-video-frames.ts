"use client";

import { useState, useCallback, useRef } from "react";

const WORKER_URL = "https://instag-playwright.shadidhaque2014.workers.dev";

interface UseVideoFramesReturn {
  frames: string[];
  keys: string[];
  runId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchFrames: (videoUrl: string, count?: number) => Promise<void>;
  reset: () => void;
}

export function useVideoFrames(): UseVideoFramesReturn {
  const [frames, setFrames] = useState<string[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setFrames([]);
    setKeys([]);
    setRunId(null);
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
    setKeys([]);
    setRunId(null);

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl, count, prefix: "insta" }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Failed to fetch video previews");

      const data = (await res.json()) as { runId: string; keys: string[] };
      const imageUrls = data.keys.map(
        (key: string) => `${WORKER_URL}/?key=${encodeURIComponent(key)}`
      );
      setRunId(data.runId);
      setKeys(data.keys);
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

  return { frames, keys, runId, isLoading, error, fetchFrames, reset };
}

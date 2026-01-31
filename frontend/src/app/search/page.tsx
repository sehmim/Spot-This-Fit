"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { Loader2, ArrowRight, Link2 } from "lucide-react";
import type { ApiResponse, VideoDownloadResponse } from "@spotthisfit/shared";

/**
 * Try to derive an embeddable preview URL from a pasted link.
 * Instagram and TikTok don't allow iframes, so we just show the
 * raw URL as a clickable thumbnail / oembed-style card.
 * For our mock flow the backend always returns a local .mp4,
 * but we can still show a quick preview of the pasted link.
 */
function getVideoPreviewUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Allow any http(s) URL — the backend will validate
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
  } catch {
    // not a valid URL yet
  }
  return null;
}

export default function SearchPage() {
  const router = useRouter();
  const inputUrl = useSearchStore((s) => s.inputUrl);
  const setInputUrl = useSearchStore((s) => s.setInputUrl);
  const setDownloadedVideoUrl = useSearchStore((s) => s.setDownloadedVideoUrl);
  const isDownloading = useSearchStore((s) => s.isDownloading);
  const setIsDownloading = useSearchStore((s) => s.setIsDownloading);
  const downloadError = useSearchStore((s) => s.downloadError);
  const setDownloadError = useSearchStore((s) => s.setDownloadError);
  const [url, setUrl] = useState(inputUrl || "");

  const previewUrl = useMemo(() => getVideoPreviewUrl(url.trim()), [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setIsDownloading(true);
    setDownloadError(null);
    setInputUrl(trimmed);

    try {
      const res = await apiClient.post<ApiResponse<VideoDownloadResponse>>(
        "/api/video/download",
        { url: trimmed }
      );
      setDownloadedVideoUrl(res.data.videoUrl);
      router.push("/search/frame");
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Failed to download video"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:mx-auto md:max-w-2xl lg:max-w-3xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Find products from a video</h1>
          <p className="text-sm text-muted-foreground">
            Paste an Instagram or TikTok video link to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Video URL
            </label>
            <div className="relative">
              <Input
                type="url"
                placeholder="https://www.instagram.com/reel/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-11 pl-10 text-base"
                disabled={isDownloading}
              />
              <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {downloadError && (
            <p className="text-sm text-destructive">{downloadError}</p>
          )}

          {/* Video preview */}
          {previewUrl && !isDownloading && (
            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="flex items-center gap-3 p-3">
                <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                  <Link2 className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{previewUrl}</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      try {
                        return new URL(previewUrl).hostname;
                      } catch {
                        return "Video link";
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isDownloading && (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Downloading video...</p>
              <p className="text-xs text-muted-foreground">
                This usually takes a few seconds
              </p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full gap-2 text-base"
            disabled={isDownloading || !url.trim()}
          >
            {isDownloading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                Next
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </PageTransition>
  );
}

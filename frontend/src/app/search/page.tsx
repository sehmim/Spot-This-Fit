"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { Loader2, ArrowRight, Link2, ImagePlus, X } from "lucide-react";
import type { ApiResponse, VideoDownloadResponse } from "@spotthisfit/shared";
import { useTranslations } from "@/components/i18n/locale-provider";
import { getErrorMessage } from "@/lib/error-messages";

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
  const t = useTranslations();
  const router = useRouter();
  const inputUrl = useSearchStore((s) => s.inputUrl);
  const setInputUrl = useSearchStore((s) => s.setInputUrl);
  const setDownloadedVideoUrl = useSearchStore((s) => s.setDownloadedVideoUrl);
  const isDownloading = useSearchStore((s) => s.isDownloading);
  const setIsDownloading = useSearchStore((s) => s.setIsDownloading);
  const downloadError = useSearchStore((s) => s.downloadError);
  const setDownloadError = useSearchStore((s) => s.setDownloadError);
  const setSearchId = useSearchStore((s) => s.setSearchId);
  const setSelectedFrame = useSearchStore((s) => s.setSelectedFrame);
  const resetStream = useResultsStore((s) => s.resetStream);
  const [url, setUrl] = useState(inputUrl || "");

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        getErrorMessage(err, t, { fallbackKey: "errors.downloadFailed" })
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearUpload = useCallback(() => {
    setUploadedImage(null);
    setUploadFileName("");
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImageSearch = async () => {
    if (!uploadedImage) return;
    setIsUploading(true);
    setUploadError(null);
    resetStream();

    try {
      const res = await apiClient.post<ApiResponse<{ searchId: string }>>(
        "/api/search/frame",
        { frameImage: uploadedImage }
      );
      setSelectedFrame(uploadedImage);
      setSearchId(res.data.searchId);
      router.push("/results");
    } catch (err) {
      setUploadError(
        getErrorMessage(err, t, { fallbackKey: "search.upload.error" })
      );
      setIsUploading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:mx-auto md:max-w-2xl lg:max-w-3xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{t("search.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("search.subtitle")}
          </p>
        </div>

        {/* Video URL form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("search.form.videoUrlLabel")}
            </label>
            <div className="relative">
              <Input
                type="url"
                placeholder={t("search.form.placeholder")}
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
                        return t("search.form.previewFallback");
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
              <p className="text-sm font-medium">
                {t("search.form.downloadingTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("search.form.downloadingSubtitle")}
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
                {t("search.form.downloadingButton")}
              </>
            ) : (
              <>
                {t("search.form.next")}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">
            {t("search.divider")}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Image upload */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              {t("search.upload.label")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("search.upload.hint")}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          {!uploadedImage ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted/30"
            >
              <ImagePlus className="size-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("search.upload.label")}
              </span>
            </button>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage}
                  alt={uploadFileName}
                  className="max-h-64 w-full object-contain bg-muted/30"
                />
                <button
                  type="button"
                  onClick={clearUpload}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="px-3 py-2">
                <p className="truncate text-xs text-muted-foreground">
                  {uploadFileName}
                </p>
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

          <Button
            type="button"
            size="lg"
            className="h-12 w-full gap-2 text-base"
            disabled={!uploadedImage || isUploading}
            onClick={handleImageSearch}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("search.upload.analyzing")}
              </>
            ) : (
              <>
                <ImagePlus className="size-4" />
                {t("search.upload.button")}
              </>
            )}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}

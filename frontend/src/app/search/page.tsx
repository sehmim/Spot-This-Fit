"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { Loader2, ImagePlus, X, Link2 } from "lucide-react";
import type { ApiResponse } from "@spotthisfit/shared";
import { useTranslations } from "@/components/i18n/locale-provider";
import { getErrorMessage } from "@/lib/error-messages";

export default function SearchPage() {
  const t = useTranslations();
  const router = useRouter();
  const setSearchId = useSearchStore((s) => s.setSearchId);
  const setSelectedFrame = useSearchStore((s) => s.setSelectedFrame);
  const resetStream = useResultsStore((s) => s.resetStream);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Video URL state
  const [videoUrl, setVideoUrl] = useState("");
  const [isVideoSearching, setIsVideoSearching] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

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

  const handleVideoSearch = async () => {
    if (!videoUrl.trim()) return;
    setIsVideoSearching(true);
    setVideoError(null);
    resetStream();

    try {
      const res = await apiClient.post<ApiResponse<{ searchId: string }>>(
        "/api/search/frame",
        { frameImage: "", videoUrl: videoUrl.trim() }
      );
      setSearchId(res.data.searchId);
      router.push("/results");
    } catch (err) {
      setVideoError(
        getErrorMessage(err, t, { fallbackKey: "search.upload.error" })
      );
      setIsVideoSearching(false);
    }
  };

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

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">
            {t("search.divider")}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Video URL search */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              {t("search.form.videoUrlLabel")}
            </label>
          </div>
          <div className="relative">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setVideoError(null);
              }}
              placeholder={t("search.form.placeholder")}
              className="flex h-11 w-full items-center rounded-md border bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {videoError && (
            <p className="text-sm text-destructive">{videoError}</p>
          )}

          <Button
            type="button"
            size="lg"
            className="h-12 w-full gap-2 text-base"
            disabled={!videoUrl.trim() || isVideoSearching}
            onClick={handleVideoSearch}
          >
            {isVideoSearching ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("search.upload.analyzing")}
              </>
            ) : (
              <>
                <Link2 className="size-4" />
                {t("search.form.next")}
              </>
            )}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}

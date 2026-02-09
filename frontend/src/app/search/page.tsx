"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/layout/page-transition";
import { ImagePlus, X, Link2 } from "lucide-react";
import { useTranslations } from "@/components/i18n/locale-provider";

export default function SearchPage() {
  const t = useTranslations();
  const router = useRouter();
  const inputUrl = useSearchStore((s) => s.inputUrl);
  const setInputUrl = useSearchStore((s) => s.setInputUrl);
  const setSearchMode = useSearchStore((s) => s.setSearchMode);
  const setUploadedImage = useSearchStore((s) => s.setUploadedImage);
  const setVideoPreviewUrl = useSearchStore((s) => s.setVideoPreviewUrl);
  const resetStream = useResultsStore((s) => s.resetStream);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState(inputUrl);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setLocalImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearUpload = useCallback(() => {
    setLocalImage(null);
    setUploadFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImageSearch = () => {
    if (!localImage) return;
    resetStream();
    setUploadedImage(localImage);
    setSearchMode("image");
    router.push("/search/preview");
  };

  const handleVideoSearch = () => {
    if (!videoUrl.trim()) return;
    resetStream();
    setInputUrl(videoUrl.trim());
    setVideoPreviewUrl(videoUrl.trim());
    setSearchMode("video");
    router.push("/search/preview");
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
            <label className="text-sm font-medium text-foreground cursor-pointer">
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

          {!localImage ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted/30"
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
                  src={localImage}
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

          <Button
            type="button"
            size="lg"
            className="h-12 w-full gap-2 text-base"
            disabled={!localImage}
            onClick={handleImageSearch}
          >
            <ImagePlus className="size-4" />
            {t("search.upload.button")}
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

        {/* Video URL */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              {t("search.form.videoUrlLabel")}
            </label>
            <p className="text-xs text-muted-foreground">
              Paste a video link to extract frames and find similar products
            </p>
          </div>
          <div className="relative">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={t("search.form.placeholder")}
              className="h-11 pl-10"
            />
            <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button
            type="button"
            size="lg"
            className="h-12 w-full gap-2 text-base"
            disabled={!videoUrl.trim()}
            onClick={handleVideoSearch}
          >
            <Link2 className="size-4" />
            {t("search.form.next")}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}

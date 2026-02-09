"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/layout/page-transition";
import { Link2 } from "lucide-react";
import { useTranslations } from "@/components/i18n/locale-provider";

export default function SearchPage() {
  const t = useTranslations();
  const router = useRouter();
  const inputUrl = useSearchStore((s) => s.inputUrl);
  const setInputUrl = useSearchStore((s) => s.setInputUrl);
  const setSearchMode = useSearchStore((s) => s.setSearchMode);
  const setVideoPreviewUrl = useSearchStore((s) => s.setVideoPreviewUrl);
  const resetStream = useResultsStore((s) => s.resetStream);

  const [videoUrl, setVideoUrl] = useState(inputUrl);

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

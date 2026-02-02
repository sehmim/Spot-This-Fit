"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { apiClient } from "@/lib/api-client";
import { FrameHighlighter } from "@/components/search/frame-highlighter";
import { ProductDescriptionInput } from "@/components/search/product-description-input";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import type { ApiResponse } from "@spotthisfit/shared";
import { useTranslations } from "@/components/i18n/locale-provider";
import { getErrorMessage } from "@/lib/error-messages";

export default function HighlightPage() {
  const t = useTranslations();
  const router = useRouter();
  const selectedFrame = useSearchStore((s) => s.selectedFrame);
  const inputUrl = useSearchStore((s) => s.inputUrl);
  const highlight = useSearchStore((s) => s.highlight);
  const description = useSearchStore((s) => s.description);
  const setHighlight = useSearchStore((s) => s.setHighlight);
  const setDescription = useSearchStore((s) => s.setDescription);
  const setSearchId = useSearchStore((s) => s.setSearchId);
  const resetStream = useResultsStore((s) => s.resetStream);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFrame) {
      router.replace("/search/frame");
    }
  }, [selectedFrame, router]);

  if (!selectedFrame) return null;

  const canSubmit = highlight && description.trim().length > 0;

  const handleSearch = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    resetStream();

    try {
      const res = await apiClient.post<ApiResponse<{ searchId: string }>>(
        "/api/search/frame",
        {
          frameImage: selectedFrame,
          highlight,
          description: description.trim(),
          videoUrl: inputUrl,
        }
      );
      setSearchId(res.data.searchId);
      router.push("/results");
    } catch (err) {
      setError(
        getErrorMessage(err, t, {
          fallbackKey: "highlight.error.startSearchFailed",
        })
      );
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:mx-auto md:max-w-2xl lg:max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{t("highlight.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("highlight.subtitle")}
            </p>
          </div>
        </div>

        <FrameHighlighter
          frameImage={selectedFrame}
          highlight={highlight}
          onHighlightChange={setHighlight}
        />

        {highlight && (
          <p className="text-xs text-muted-foreground">
            {t("highlight.selectedNote")}
          </p>
        )}

        <ProductDescriptionInput
          value={description}
          onChange={setDescription}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleSearch}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {t("highlight.submit")}
        </Button>
      </div>
    </PageTransition>
  );
}

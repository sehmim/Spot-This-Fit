"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/i18n/locale-provider";

export function ShareButton() {
  const t = useTranslations();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("results.share.title"),
          text: t("results.share.text"),
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("results.share.toast"));
    }
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleShare}>
      <Share2 className="size-4" />
      {t("results.share.label")}
    </Button>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/i18n/locale-provider";

export function SaveAllButton() {
  const t = useTranslations();

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={() => toast.success(t("results.saveAll.toast"))}
    >
      <Bookmark className="size-4" />
      {t("results.saveAll.label")}
    </Button>
  );
}

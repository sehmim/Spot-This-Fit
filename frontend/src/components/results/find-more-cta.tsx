"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useTranslations } from "@/components/i18n/locale-provider";

export function FindMoreCta() {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-6 text-center">
      <p className="text-sm font-medium">{t("results.findMore.title")}</p>
      <p className="text-xs text-muted-foreground">
        {t("results.findMore.subtitle")}
      </p>
      <div className="mt-2 flex gap-2">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/search">
            {t("results.findMore.searchAgain")}
          </Link>
        </Button>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/search">
            <Search className="size-3.5" />
            {t("results.findMore.tryNewVideo")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

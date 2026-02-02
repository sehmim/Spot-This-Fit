"use client";

import { Badge } from "@/components/ui/badge";
import type { ConfidenceLevel } from "@spotthisfit/shared";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/i18n/locale-provider";

const styles: Record<ConfidenceLevel, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

export function ConfidenceBadge({
  level,
  score,
}: {
  level: ConfidenceLevel;
  score: number;
}) {
  const t = useTranslations();
  return (
    <Badge variant="outline" className={cn("text-[10px]", styles[level])}>
      {t("results.confidenceMatch", { score })}
    </Badge>
  );
}

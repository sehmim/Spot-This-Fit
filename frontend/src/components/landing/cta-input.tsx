"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/components/i18n/locale-provider";

export function CtaInput() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <section className="flex w-full max-w-lg flex-col items-center gap-3">
      <Button
        size="lg"
        className="h-12 min-w-[180px] gap-2 text-base cursor-pointer"
        onClick={() => router.push("/search")}
      >
        {t("landing.cta.button")}
        <ArrowRight className="size-4" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {t("landing.cta.supporting")}
      </p>
    </section>
  );
}

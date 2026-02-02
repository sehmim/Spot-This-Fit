"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useSearchStore } from "@/stores/search-store";
import { useTranslations } from "@/components/i18n/locale-provider";

export function CtaInput() {
  const t = useTranslations();
  const [url, setUrl] = useState("");
  const router = useRouter();
  const setInputUrl = useSearchStore((s) => s.setInputUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setInputUrl(url.trim());
    router.push("/search");
  };

  return (
    <section className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="url"
          placeholder={t("landing.cta.placeholder")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 flex-1 text-base"
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 min-w-[140px] gap-2"
          disabled={!url.trim()}
        >
          {t("landing.cta.button")}
          <ArrowRight className="size-4" />
        </Button>
      </form>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t("landing.cta.supporting")}
      </p>
    </section>
  );
}

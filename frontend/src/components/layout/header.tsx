"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { locales } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n/locale-provider";

export function Header() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations();
  const languageLabels = {
    en: t("header.language.en"),
    fr: t("header.language.fr"),
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:mx-auto md:max-w-5xl">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="size-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            {t("header.brand")}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="sr-only">{t("header.languageLabel")}</span>
          <div className="flex items-center rounded-full border bg-background/80 p-0.5">
            {locales.map((option) => {
              const isActive = option === locale;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocale(option)}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {languageLabels[option]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

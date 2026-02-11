"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { locales } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

export function Header() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const isResultsPage = pathname === "/results";
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languageLabels: Record<string, string> = {
    en: t("header.language.en"),
    fr: t("header.language.fr"),
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:mx-auto md:max-w-5xl">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-blank.png"
            alt={t("header.brand")}
            width={440}
            height={164}
            priority
            className="h-14 w-auto sm:h-16"
          />
          <span className="sr-only">{t("header.brand")}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/blog"
            className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            {t("header.blog")}
          </Link>
          {!isResultsPage && (
            <Button size="sm" className="gap-1.5 rounded-full cursor-pointer" asChild>
              <Link href="/search">
                {t("landing.cta.button")}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={t("header.languageLabel")}
              className="flex items-center gap-1 rounded-full border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {locale.toUpperCase()}
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[120px] overflow-hidden rounded-lg border bg-background shadow-lg">
                {locales.map((option) => {
                  const isActive = option === locale;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setLocale(option);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {languageLabels[option]}
                      {isActive && (
                        <span className="ml-auto text-[10px] text-primary">
                          ●
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

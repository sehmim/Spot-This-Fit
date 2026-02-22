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
  const isHomePage = pathname === "/";
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
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-sm",
        isHomePage
          ? "border-white/8 bg-[#0a0a0a]/90"
          : "border-border bg-background/80",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:mx-auto md:max-w-5xl">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-blank.png"
            alt={t("header.brand")}
            width={440}
            height={164}
            priority
            className={cn("h-14 w-auto sm:h-16", isHomePage && "opacity-80")}
          />
          <span className="sr-only">{t("header.brand")}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/blog"
            className={cn(
              "hidden text-xs font-semibold uppercase tracking-wider transition-colors sm:inline-flex",
              isHomePage
                ? "text-white/40 hover:text-white/80"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("header.blog")}
          </Link>
          <a
            href="https://instagram.com/spotthis_"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="gap-1.5 rounded-full cursor-pointer bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 border-0">
              Check a Reel
              <ArrowRight className="size-3.5" />
            </Button>
          </a>
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={t("header.languageLabel")}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                isHomePage
                  ? "border-white/10 bg-white/5 text-white/50 hover:text-white/80"
                  : "border-border bg-background/80 text-muted-foreground hover:text-foreground",
              )}
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
              <div
                className={cn(
                  "absolute right-0 top-full z-50 mt-1.5 min-w-[120px] overflow-hidden rounded-lg border shadow-lg",
                  isHomePage
                    ? "border-white/10 bg-[#1a1a1a]"
                    : "border-border bg-background",
                )}
              >
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
                        "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors",
                        isHomePage
                          ? "text-white/50 hover:bg-white/5 hover:text-white/80"
                          : "text-muted-foreground hover:bg-muted",
                        isActive && (isHomePage ? "text-white/80" : "text-foreground"),
                      )}
                    >
                      {languageLabels[option]}
                      {isActive && (
                        <span className="ml-auto text-[10px] text-violet-400">
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

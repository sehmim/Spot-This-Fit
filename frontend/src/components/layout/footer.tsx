"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "@/components/i18n/locale-provider";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t bg-[#1A1A2E]">
      <div className="mx-auto flex min-h-[160px] flex-col items-center gap-6 px-4 py-12 text-sm text-muted-foreground sm:px-6 md:max-w-5xl md:flex-row md:justify-between md:py-16">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-blank.png"
              alt={t("header.brand")}
              width={460}
              height={172}
              className="h-14 w-auto sm:h-16"
            />
          </Link>
          <nav className="flex flex-wrap justify-center gap-6 md:justify-start">
          <Link
            href="/blog"
            className="transition-colors hover:text-foreground"
          >
            {t("footer.blog")}
          </Link>
          <Link
            href="/how-it-works"
            className="transition-colors hover:text-foreground"
          >
            {t("footer.howItWorks")}
          </Link>
          <Link
            href="/guides/how-to-find-outfits-from-videos"
            className="transition-colors hover:text-foreground"
          >
            {t("footer.videoGuide")}
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            {t("footer.terms")}
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            {t("footer.privacy")}
          </Link>
          <Link href="/contact" className="transition-colors hover:text-foreground">
            {t("footer.contact")}
          </Link>
          </nav>
        </div>
        <p>{t("footer.copyright")}</p>
      </div>
    </footer>
  );
}

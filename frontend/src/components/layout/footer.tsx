"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "@/components/i18n/locale-provider";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-white/8 bg-[#0a0a0a]">
      <div className="mx-auto flex min-h-[120px] flex-col items-center gap-4 px-4 py-10 text-sm text-white/30 sm:px-6 md:max-w-5xl md:flex-row md:justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-blank.png"
            alt={t("header.brand")}
            width={460}
            height={172}
            className="h-10 w-auto opacity-60 sm:h-12"
          />
        </Link>
        <nav className="flex flex-wrap justify-center gap-6 md:justify-start">
          <Link href="/terms" className="transition-colors hover:text-white/70">
            {t("footer.terms")}
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-white/70">
            {t("footer.privacy")}
          </Link>
          <Link href="/contact" className="transition-colors hover:text-white/70">
            {t("footer.contact")}
          </Link>
        </nav>
        <p className="text-xs">{t("footer.copyright")}</p>
      </div>
    </footer>
  );
}

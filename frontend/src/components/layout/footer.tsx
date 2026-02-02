"use client";

import Link from "next/link";
import { useTranslations } from "@/components/i18n/locale-provider";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex flex-col items-center gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:max-w-5xl md:flex-row md:justify-between">
        <nav className="flex gap-6">
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
        <p>{t("footer.copyright")}</p>
      </div>
    </footer>
  );
}

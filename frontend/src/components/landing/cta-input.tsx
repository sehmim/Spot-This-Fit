"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function CtaInput() {
  const t = useTranslations();
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section
        ref={ref}
        className="flex w-full max-w-lg flex-col items-center gap-3"
      >
        <Button
          size="lg"
          className="h-12 min-w-[200px] gap-2 rounded-full text-sm font-semibold uppercase tracking-wider cursor-pointer"
          onClick={() => router.push("/search")}
        >
          {t("landing.cta.button")}
          <ArrowRight className="size-4" />
        </Button>
        <p className="text-center text-xs text-primary/80">
          {t("landing.cta.supporting")}
        </p>
      </section>

      {/* Floating CTA when hero button scrolls out of view */}
      <Button
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-12 gap-2 rounded-full px-6 text-sm font-semibold uppercase tracking-wider shadow-lg cursor-pointer transition-all duration-300",
          visible
            ? "pointer-events-none translate-y-4 opacity-0"
            : "translate-y-0 opacity-100",
        )}
        onClick={() => router.push("/search")}
      >
        {t("landing.cta.button")}
        <ArrowRight className="size-4" />
      </Button>
    </>
  );
}

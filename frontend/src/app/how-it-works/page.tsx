import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function HowItWorksPage() {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);

  const steps = [
    {
      title: t("howItWorksPage.steps.step1.title"),
      body: t("howItWorksPage.steps.step1.body"),
    },
    {
      title: t("howItWorksPage.steps.step2.title"),
      body: t("howItWorksPage.steps.step2.body"),
    },
    {
      title: t("howItWorksPage.steps.step3.title"),
      body: t("howItWorksPage.steps.step3.body"),
    },
    {
      title: t("howItWorksPage.steps.step4.title"),
      body: t("howItWorksPage.steps.step4.body"),
    },
  ];

  const supportedInputs = [
    {
      title: t("howItWorksPage.supportItems.photoTitle"),
      body: t("howItWorksPage.supportItems.photoBody"),
    },
    {
      title: t("howItWorksPage.supportItems.videoTitle"),
      body: t("howItWorksPage.supportItems.videoBody"),
    },
    {
      title: t("howItWorksPage.supportItems.linkTitle"),
      body: t("howItWorksPage.supportItems.linkBody"),
    },
  ];

  const outputs = [
    t("howItWorksPage.outputsItems.item1"),
    t("howItWorksPage.outputsItems.item2"),
    t("howItWorksPage.outputsItems.item3"),
    t("howItWorksPage.outputsItems.item4"),
  ];

  const tips = [
    t("howItWorksPage.tipsItems.item1"),
    t("howItWorksPage.tipsItems.item2"),
    t("howItWorksPage.tipsItems.item3"),
    t("howItWorksPage.tipsItems.item4"),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {t("howItWorksPage.eyebrow")}
        </p>
        <h1 className="text-3xl font-bold">{t("howItWorksPage.title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("howItWorksPage.subtitle")}
        </p>
      </header>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {t("howItWorksPage.flowTitle")}
          </h2>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("howItWorksPage.flowTiming")}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("howItWorksPage.flowIntro")}
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border bg-muted/20 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("howItWorksPage.stepLabel", { number: index + 1 })}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">
          {t("howItWorksPage.supportTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("howItWorksPage.supportIntro")}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {supportedInputs.map((item) => (
            <div key={item.title} className="rounded-2xl border p-5">
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">
          {t("howItWorksPage.outputsTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("howItWorksPage.outputsIntro")}
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {outputs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">
          {t("howItWorksPage.tipsTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("howItWorksPage.tipsIntro")}
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border bg-[#F7E7CE]/70 p-6">
        <h2 className="text-xl font-semibold">
          {t("howItWorksPage.ctaTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("howItWorksPage.ctaBody")}
        </p>
        <Button asChild size="lg" className="mt-5 rounded-full">
          <Link href="/search">{t("howItWorksPage.ctaButton")}</Link>
        </Button>
      </section>
    </div>
  );
}

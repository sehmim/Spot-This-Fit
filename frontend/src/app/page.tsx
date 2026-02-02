import { HeroSection } from "@/components/landing/hero-section";
import { DemoVideo } from "@/components/landing/demo-video";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PlatformLogos } from "@/components/landing/platform-logos";
import { CtaInput } from "@/components/landing/cta-input";
import { Separator } from "@/components/ui/separator";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function LandingPage() {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);
  const steps = [
    {
      title: t("landing.howItWorks.step1.title"),
      description: t("landing.howItWorks.step1.description"),
    },
    {
      title: t("landing.howItWorks.step2.title"),
      description: t("landing.howItWorks.step2.description"),
    },
    {
      title: t("landing.howItWorks.step3.title"),
      description: t("landing.howItWorks.step3.description"),
    },
  ];
  const platformLabels = {
    instagram: t("landing.platforms.instagram"),
    tiktok: t("landing.platforms.tiktok"),
    youtube: t("landing.platforms.youtube"),
    facebook: t("landing.platforms.facebook"),
  };
  const problemItems = [
    t("landing.problem.item1"),
    t("landing.problem.item2"),
    t("landing.problem.item3"),
  ];
  const useCases = [
    t("landing.useCases.item1"),
    t("landing.useCases.item2"),
    t("landing.useCases.item3"),
    t("landing.useCases.item4"),
    t("landing.useCases.item5"),
  ];

  return (
    <div className="flex flex-col items-center gap-12 px-4 py-10 sm:px-6 md:px-8 lg:py-16">
      <HeroSection
        titleLine1={t("landing.hero.titleLine1")}
        titleLine2={t("landing.hero.titleLine2")}
        subheading={t("landing.hero.subheading")}
        subtitle={t("landing.hero.subtitle")}
      />
      <CtaInput />
      <DemoVideo label={t("landing.demo.label")} />
      <Separator className="max-w-md" />
      <HowItWorks title={t("landing.howItWorks.title")} steps={steps} />
      <section className="w-full max-w-3xl rounded-2xl border bg-muted/20 p-6 text-left">
        <h2 className="text-lg font-semibold sm:text-xl">
          {t("landing.problem.title")}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {problemItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="w-full max-w-3xl rounded-2xl border bg-background p-6 text-left">
        <h2 className="text-lg font-semibold sm:text-xl">
          {t("landing.useCases.title")}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {useCases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <PlatformLogos
        title={t("landing.platforms.title")}
        labels={platformLabels}
      />
      <p className="max-w-3xl text-center text-sm text-muted-foreground">
        {t("landing.keywords")}
      </p>
    </div>
  );
}

import { HeroSection } from "@/components/landing/hero-section";
import { DemoVideo } from "@/components/landing/demo-video";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PlatformLogos } from "@/components/landing/platform-logos";
import { CtaInput } from "@/components/landing/cta-input";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { getSiteUrl } from "@/lib/site";

export default async function LandingPage() {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Spot This Fit",
    url: siteUrl,
    description: t("metadata.description"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const appStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Spot This Fit",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: t("metadata.description"),
    url: siteUrl,
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appStructuredData) }}
      />
      {/* Block 1: Hero + CTA */}
      <div
        className="relative flex min-h-[calc(100dvh-64px)] flex-col items-center overflow-hidden px-4 sm:px-6 md:px-8"
        style={{ backgroundColor: "#F7E7CE" }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_60%] opacity-30 sm:object-center motion-reduce:hidden"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#F7E7CE]/80 via-[#F7E7CE]/40 to-[#F7E7CE]/80" />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
          <HeroSection
            titleLine1={t("landing.hero.titleLine1")}
            titleLine2={t("landing.hero.titleLine2")}
            subheadingLine1={t("landing.hero.subheadingLine1")}
            subheadingLine2={t("landing.hero.subheadingLine2")}
          />
          <CtaInput />
        </div>
        <p className="relative z-10 mb-8 w-full px-4 text-center text-[10px] font-semibold uppercase tracking-wider text-primary/80 sm:text-xs sm:tracking-widest">
          {t("landing.hero.subtitle")}
        </p>
      </div>

      {/* Block 2: How It Works */}
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6 md:px-8 text-white"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <HowItWorks title={t("landing.howItWorks.title")} subtitle={t("landing.howItWorks.subtitle")} steps={steps} />
      </div>

      {/* Block 3: Demo Video */}
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6 md:px-8 text-[#1A1A2E] mt-12"
        style={{ backgroundColor: "white" }}
      >
        <DemoVideo
          label={t("landing.demo.label")}
          title={t("landing.demo.title")}
          subtitle={t("landing.demo.subtitle")}
        />
      </div>

      {/* Block 4: Style Obsessions + Use Cases + Platforms */}
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6 md:px-8"
        style={{ backgroundColor: "#F7E7CE" }}
      >
        <section style={{ backgroundColor: "white" }}  className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white/70 p-6 text-left bg-white">
          <h2 className="text-lg font-semibold uppercase sm:text-xl">
            {t("landing.problem.title")}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {problemItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section style={{ backgroundColor: "white" }} className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white/70 p-6 text-left">
          <h2 className="text-lg font-semibold uppercase sm:text-xl">
            {t("landing.useCases.title")}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section style={{ backgroundColor: "white" }}  className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white/70 p-6 text-left bg-white">
          <PlatformLogos
            title={t("landing.platforms.title")}
            labels={platformLabels}
          />
          <p className="mt-4 text-xs text-muted-foreground">
            {t("landing.keywords")}
          </p>
        </section>
      </div>
    </div>
  );
}

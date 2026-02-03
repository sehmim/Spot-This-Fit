import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function HowToFindOutfitsFromVideosPage() {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);

  const tldrItems = [
    t("guideVideoOutfits.tldrItems.item1"),
    t("guideVideoOutfits.tldrItems.item2"),
    t("guideVideoOutfits.tldrItems.item3"),
    t("guideVideoOutfits.tldrItems.item4"),
  ];

  const sections = [
    {
      title: t("guideVideoOutfits.section1.title"),
      body: t("guideVideoOutfits.section1.body"),
      items: [
        t("guideVideoOutfits.section1.items.item1"),
        t("guideVideoOutfits.section1.items.item2"),
        t("guideVideoOutfits.section1.items.item3"),
      ],
    },
    {
      title: t("guideVideoOutfits.section2.title"),
      body: t("guideVideoOutfits.section2.body"),
      items: [
        t("guideVideoOutfits.section2.items.item1"),
        t("guideVideoOutfits.section2.items.item2"),
        t("guideVideoOutfits.section2.items.item3"),
      ],
    },
    {
      title: t("guideVideoOutfits.section3.title"),
      body: t("guideVideoOutfits.section3.body"),
      items: [
        t("guideVideoOutfits.section3.items.item1"),
        t("guideVideoOutfits.section3.items.item2"),
        t("guideVideoOutfits.section3.items.item3"),
      ],
    },
    {
      title: t("guideVideoOutfits.section4.title"),
      body: t("guideVideoOutfits.section4.body"),
      items: [
        t("guideVideoOutfits.section4.items.item1"),
        t("guideVideoOutfits.section4.items.item2"),
        t("guideVideoOutfits.section4.items.item3"),
      ],
    },
    {
      title: t("guideVideoOutfits.section5.title"),
      body: t("guideVideoOutfits.section5.body"),
      items: [
        t("guideVideoOutfits.section5.items.item1"),
        t("guideVideoOutfits.section5.items.item2"),
        t("guideVideoOutfits.section5.items.item3"),
      ],
    },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {t("guideVideoOutfits.eyebrow")}
        </p>
        <h1 className="text-3xl font-bold">{t("guideVideoOutfits.title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("guideVideoOutfits.subtitle")}
        </p>
      </header>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {t("guideVideoOutfits.intro")}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {t("guideVideoOutfits.supportNote")}
      </p>

      <section className="mt-8 rounded-2xl border bg-muted/20 p-6">
        <h2 className="text-lg font-semibold">
          {t("guideVideoOutfits.tldrTitle")}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {tldrItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border bg-[#F7E7CE]/70 p-6">
        <h2 className="text-xl font-semibold">
          {t("guideVideoOutfits.outroTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("guideVideoOutfits.outroBody")}
        </p>
        <Button asChild size="lg" className="mt-5 rounded-full">
          <Link href="/search">{t("guideVideoOutfits.outroButton")}</Link>
        </Button>
      </section>
    </article>
  );
}

import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function TermsPage() {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);

  const sections = [
    { title: t("terms.affiliateTitle"), body: t("terms.affiliateBody") },
    { title: t("terms.useTitle"), body: t("terms.useBody") },
    { title: t("terms.accuracyTitle"), body: t("terms.accuracyBody") },
    { title: t("terms.thirdPartyTitle"), body: t("terms.thirdPartyBody") },
    { title: t("terms.ipTitle"), body: t("terms.ipBody") },
    { title: t("terms.liabilityTitle"), body: t("terms.liabilityBody") },
    { title: t("terms.changesTitle"), body: t("terms.changesBody") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{t("terms.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("terms.lastUpdated")}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {t("terms.intro")}
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

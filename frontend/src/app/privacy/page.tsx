import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function PrivacyPage() {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);

  const sections = [
    { title: t("privacy.collectTitle"), body: t("privacy.collectBody") },
    { title: t("privacy.useTitle"), body: t("privacy.useBody") },
    { title: t("privacy.sharingTitle"), body: t("privacy.sharingBody") },
    { title: t("privacy.cookiesTitle"), body: t("privacy.cookiesBody") },
    { title: t("privacy.retentionTitle"), body: t("privacy.retentionBody") },
    { title: t("privacy.rightsTitle"), body: t("privacy.rightsBody") },
    { title: t("privacy.changesTitle"), body: t("privacy.changesBody") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{t("privacy.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("privacy.lastUpdated")}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {t("privacy.intro")}
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

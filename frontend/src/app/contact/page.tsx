import { Mail } from "lucide-react";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function ContactPage() {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{t("contact.title")}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {t("contact.intro")}
      </p>

      <div className="mt-8 rounded-lg border bg-muted/20 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{t("contact.emailLabel")}</p>
            <a
              href={`mailto:${t("contact.emailValue")}`}
              className="text-sm text-primary hover:underline"
            >
              {t("contact.emailValue")}
            </a>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {t("contact.responseNote")}
        </p>
      </div>
    </div>
  );
}

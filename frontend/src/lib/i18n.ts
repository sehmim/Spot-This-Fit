import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "stf_locale";

type Dictionary = typeof en;
export type TranslationKey = keyof Dictionary;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  fr,
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function formatMessage(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function createTranslator(locale: Locale) {
  const dictionary = getDictionary(locale);
  return function t<Key extends TranslationKey>(
    key: Key,
    params?: Record<string, string | number>,
  ): string {
    const template = dictionary[key] ?? String(key);
    return formatMessage(template, params);
  };
}

export function getCurrencyLocale(locale: Locale, currency: string): string {
  if (currency === "CAD") {
    return locale === "fr" ? "fr-CA" : "en-CA";
  }
  if (currency === "USD") {
    return locale === "fr" ? "fr-FR" : "en-US";
  }
  return locale === "fr" ? "fr-FR" : "en-US";
}

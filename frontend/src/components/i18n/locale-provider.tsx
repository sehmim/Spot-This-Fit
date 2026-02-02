"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  createTranslator,
  defaultLocale,
  LOCALE_COOKIE,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

type Translator = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Translator;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? defaultLocale,
  );

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
      document.documentElement.lang = next;
      router.refresh();
    },
    [locale, router],
  );

  const t = useMemo(() => createTranslator(locale), [locale]);
  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useTranslations() {
  return useLocale().t;
}

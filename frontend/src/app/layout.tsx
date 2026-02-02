import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);
  const title = t("metadata.title");
  const description = t("metadata.description");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookies();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LocaleProvider initialLocale={locale}>
          <TooltipProvider>
            <Header />
            <main className="min-h-[calc(100dvh-64px)]">{children}</main>
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { getSiteUrl } from "@/lib/site";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);
  const title = t("metadata.title");
  const description = t("metadata.description");
  const siteUrl = getSiteUrl();
  return {
    metadataBase: siteUrl,
    title,
    description,
    alternates: {
      canonical: "/",
    },
    keywords: [
      "fashion search",
      "outfit finder",
      "find clothes from video",
      "find clothes from photo",
      "tiktok outfit finder",
      "reels outfit finder",
      "shop the look",
      "style search",
      "image to product",
      "fashion AI",
    ],
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: "/logo-blank.png",
      apple: "/logo-blank.png",
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: siteUrl.toString(),
      siteName: "Spot This Fit",
      images: [
        {
          url: "/logo-blank.png",
          width: 1536,
          height: 1024,
          alt: "Spot This Fit logo",
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/logo-blank.png"],
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
        <Script
          id="hotjar"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:6636994,hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');",
          }}
        />
        <LocaleProvider initialLocale={locale}>
          <TooltipProvider>
            <Header />
            <main className="min-h-[calc(100dvh-64px)]">{children}</main>
            <Footer />
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

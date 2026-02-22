import { getSiteUrl } from "@/lib/site";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata = {
  title: "Spot This | Is That Reel Real? AI Detection for Instagram",
  description:
    "Instantly check if an Instagram reel is AI-generated, detect deepfakes, and fact-check claims — all by sending a DM.",
};

export default function Page() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Spot This",
    url: siteUrl,
    description: "AI detection, deepfake scanning, and fact-checking for Instagram reels and posts.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}

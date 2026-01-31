import { HeroSection } from "@/components/landing/hero-section";
import { DemoVideo } from "@/components/landing/demo-video";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PlatformLogos } from "@/components/landing/platform-logos";
import { CtaInput } from "@/components/landing/cta-input";
import { Separator } from "@/components/ui/separator";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center gap-12 px-4 py-10 sm:px-6 md:px-8 lg:py-16">
      <HeroSection />
      <CtaInput />
      <DemoVideo />
      <Separator className="max-w-md" />
      <HowItWorks />
      <PlatformLogos />
    </div>
  );
}

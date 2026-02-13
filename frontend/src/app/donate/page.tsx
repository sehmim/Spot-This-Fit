import { Heart, Shield, Eye, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donate | Spot This",
  description:
    "Support Spot This — help keep our free AI detection tool running for everyone.",
};

const PAYPAL_LINK =
  "https://paypal.me/Sehmim?locale.x=en_US&country.x=CA";

export default function DonatePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Heart className="size-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Support Spot This</h1>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Spot This helps you detect whether a reel or post on Instagram was
        AI-generated. We believe everyone deserves to know what&apos;s real and
        what&apos;s not — and we want to keep this tool free and accessible to
        all.
      </p>

      {/* Cost breakdown */}
      <div className="mt-8 rounded-lg border bg-muted/20 p-6">
        <h2 className="text-lg font-semibold">Why we need your help</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Spot This relies on an AI detection library that costs{" "}
          <span className="font-medium text-foreground">$29/month USD</span>.
          Right now, this comes entirely out of pocket. Your donation — no
          matter how small — directly helps cover this cost and keeps the app
          running as a free public service.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-md border bg-background p-4">
            <Eye className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">AI Detection</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Powered by a professional-grade detection library
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border bg-background p-4">
            <Shield className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Free for Everyone</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No paywalls, no subscriptions — just truth
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border bg-background p-4">
            <Heart className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Community-Funded</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Kept alive by people who care about authenticity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Donate CTA */}
      <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
        <h2 className="text-lg font-semibold">Make a Donation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every contribution helps keep Spot This running. Thank you for
          supporting a more authentic internet.
        </p>
        <a
          href={PAYPAL_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Donate via PayPal
          <ExternalLink className="size-4" />
        </a>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Donations are processed securely through PayPal. Thank you for your
        generosity.
      </p>
    </div>
  );
}

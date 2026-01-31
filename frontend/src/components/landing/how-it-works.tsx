import { Link2, Clock, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Link2,
    title: "Paste a link",
    description: "Drop any video URL from Instagram, TikTok, YouTube, or Facebook.",
  },
  {
    icon: Clock,
    title: "Pick the moment",
    description: "Scrub to where the product appears and tell us what you see.",
  },
  {
    icon: ShoppingBag,
    title: "Shop instantly",
    description: "AI identifies the product and finds the best prices for you.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full max-w-3xl">
      <h2 className="mb-6 text-center text-xl font-semibold sm:text-2xl">
        How it works
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="size-6 text-primary" />
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

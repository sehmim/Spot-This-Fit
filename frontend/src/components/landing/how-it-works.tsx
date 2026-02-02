import { Link2, Clock, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stepIcons = [Link2, Clock, ShoppingBag] as const;

interface HowItWorksStep {
  title: string;
  description: string;
}

interface HowItWorksProps {
  title: string;
  subtitle: string;
  steps: HowItWorksStep[];
}

export function HowItWorks({ title, subtitle, steps }: HowItWorksProps) {
  return (
    <section className="w-full max-w-3xl">
      <h2 className="text-center text-3xl font-bold uppercase tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-3 mb-8 text-center text-xs font-semibold uppercase tracking-widest text-white/50 sm:text-sm">
        {subtitle}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = stepIcons[i] ?? Link2;
          return (
            <Card key={i} className="border-none bg-white text-[#1A1A2E]">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#1A1A2E]/10">
                  <Icon className="size-6 text-[#1A1A2E]" />
                </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-[#1A1A2E]/60">
                {step.description}
              </p>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </section>
  );
}

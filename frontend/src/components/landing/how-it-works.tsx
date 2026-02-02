import { Link2, Clock, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stepIcons = [Link2, Clock, ShoppingBag] as const;

interface HowItWorksStep {
  title: string;
  description: string;
}

interface HowItWorksProps {
  title: string;
  steps: HowItWorksStep[];
}

export function HowItWorks({ title, steps }: HowItWorksProps) {
  return (
    <section className="w-full max-w-3xl">
      <h2 className="mb-6 text-center text-xl font-semibold sm:text-2xl">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = stepIcons[i] ?? Link2;
          return (
            <Card key={i} className="border-none bg-muted/50">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
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

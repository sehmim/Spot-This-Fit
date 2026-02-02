interface HeroSectionProps {
  titleLine1: string;
  titleLine2: string;
  subheading: string;
  subtitle: string;
}

export function HeroSection({
  titleLine1,
  titleLine2,
  subheading,
  subtitle,
}: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        {titleLine1}
        <br />
        <span className="text-primary">{titleLine2}</span>
      </h1>
      <h2 className="text-base font-semibold text-muted-foreground sm:text-lg">
        {subheading}
      </h2>
      <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
        {subtitle}
      </p>
    </section>
  );
}

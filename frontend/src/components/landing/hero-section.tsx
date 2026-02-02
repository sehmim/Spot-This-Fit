interface HeroSectionProps {
  titleLine1: string;
  titleLine2: string;
  subheadingLine1: string;
  subheadingLine2: string;
}

export function HeroSection({
  titleLine1,
  titleLine2,
  subheadingLine1,
  subheadingLine2,
}: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-4xl font-bold uppercase tracking-tight sm:text-5xl lg:text-6xl">
        {titleLine1}
        {titleLine2 && (
          <>
            <br className="sm:hidden" />{" "}
            <span className="text-primary">{titleLine2}</span>
          </>
        )}
      </h1>
      {(subheadingLine1 || subheadingLine2) && (
        <p className="max-w-lg text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm">
          {subheadingLine1}
          <br />
          {subheadingLine2}
        </p>
      )}
    </section>
  );
}

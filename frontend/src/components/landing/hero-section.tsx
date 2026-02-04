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
    <section className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-5xl font-bold uppercase tracking-tight sm:text-5xl lg:text-6xl mb-2">
        {titleLine1}
        {titleLine2 && (
          <>
            <br className="sm:hidden" />{" "}
            <span className="text-primary">{titleLine2}</span>
          </>
        )}
      </h1>
      {(subheadingLine1 || subheadingLine2) && (
        <p className="mb-12 max-w-lg text-xs font-semibold uppercase tracking-widest text-primary/80 sm:text-sm">
          {(subheadingLine1 || subheadingLine2) && (
            <span className="hidden sm:inline">
              {[subheadingLine1, subheadingLine2].filter(Boolean).join(" ")}
            </span>
          )}
          {subheadingLine1 && (
            <span className="block sm:hidden">{subheadingLine1}</span>
          )}
          {subheadingLine2 && (
            <span className="block sm:hidden">{subheadingLine2}</span>
          )}
        </p>
      )}
    </section>
  );
}

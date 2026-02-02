interface DemoVideoProps {
  label: string;
  title: string;
  subtitle: string;
}

export function DemoVideo({ label, title, subtitle }: DemoVideoProps) {
  return (
    <section className="flex flex-col items-center gap-4">
      <h2 className="text-center text-3xl font-bold uppercase tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="max-w-md text-center text-xs font-semibold uppercase tracking-widest text-[#1A1A2E]/50 sm:text-sm">
        {subtitle}
      </p>
      <div className="relative aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-2xl bg-[#1A1A2E] sm:max-w-md lg:max-w-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/demo.gif"
          alt={label}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </section>
  );
}

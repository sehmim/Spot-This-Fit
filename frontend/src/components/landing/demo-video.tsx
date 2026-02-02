interface DemoVideoProps {
  label: string;
}

export function DemoVideo({ label }: DemoVideoProps) {
  return (
    <section className="w-full max-w-md sm:max-w-lg">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-[9/16]">
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

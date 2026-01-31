export function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        Spot any outfit.
        <br />
        <span className="text-primary">Shop in seconds.</span>
      </h1>
      <p className="max-w-md text-base text-muted-foreground sm:text-lg">
        Paste a video link from Instagram, TikTok, YouTube, or Facebook and
        let AI find every product for you.
      </p>
    </section>
  );
}

export function DemoVideo() {
  return (
    <section className="w-full max-w-md sm:max-w-lg">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-video">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="size-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Demo Video</span>
        </div>
      </div>
    </section>
  );
}

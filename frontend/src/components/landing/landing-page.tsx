"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { Bot, ScanFace, SearchCheck, ArrowRight, Instagram, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Bot,
    label: "AI Detection",
    title: "Is that reel AI-generated?",
    description:
      "Frame-by-frame analysis powered by Sightengine and GPT-4o flags synthetic video, AI voiceovers, and generated imagery — with a plain-English summary.",
  },
  {
    icon: ScanFace,
    label: "Deepfake Scan",
    title: "Real face or digital clone?",
    description:
      "Detect face-swaps, voice clones, and digitally altered likenesses in videos before you share or believe what you see.",
  },
  {
    icon: SearchCheck,
    label: "Fact Check",
    title: "Does the claim hold up?",
    description:
      "Extract assertions from a reel or post and cross-reference them against verifiable sources — so you know what's real before it reaches your feed.",
  },
];

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function DemoVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggle = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      {/* Mute toggle — bottom-right like Instagram */}
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80"
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
    </div>
  );
}

function HowItWorksStep({
  number,
  title,
  body,
}: {
  number: number;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-sm font-semibold tabular-nums text-white">
          {number}
        </div>
        {number < 3 && <div className="mt-2 w-px flex-1 bg-white/10" />}
      </div>
      <div className="pb-10">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/50">{body}</p>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="flex flex-col bg-[#0a0a0a] text-white">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
        {/* subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <Instagram className="size-3" />
              Instagram AI Verification
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Is that reel{" "}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                real?
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.14}>
            <p className="max-w-md text-base leading-relaxed text-white/50 sm:text-lg">
              Send any Instagram reel or post to{" "}
              <span className="font-semibold text-white/80">@spotthis_</span> and get
              an instant verdict — AI-generated, deepfake, or fact-checked.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <a
                href="https://instagram.com/spotthis_"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 hover:brightness-110"
                >
                  <Instagram className="size-4" />
                  DM us on Instagram
                </Button>
              </a>
              <a href="#how-it-works">
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-12 gap-1.5 rounded-full text-sm font-semibold text-white/60 hover:text-white"
                >
                  See how it works
                  <ArrowRight className="size-4" />
                </Button>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
              What we detect
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three reasons not to believe everything you see
            </h2>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeIn key={f.label} delay={i * 0.1}>
                  <div className="flex h-full flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-colors hover:border-white/15">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10">
                      <Icon className="size-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400/80">
                        {f.label}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold leading-snug">
                        {f.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/45">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DEMO VIDEOS ───────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6" id="demo">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
              See it in action
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              A DM. A verdict.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-white/45">
              Send any Instagram link and get a detailed AI analysis report back in seconds.
            </p>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Demo 1 */}
            <FadeIn delay={0.05}>
              <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]">
                <DemoVideoPlayer src="/spot_this_demo.mp4" />
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-400/80">
                    AI Detection
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    Instantly flags AI-generated content with a detailed breakdown of what was detected.
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Demo 2 */}
            <FadeIn delay={0.12}>
              <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]">
                <DemoVideoPlayer src="/spot_this_demo_2.mp4" />
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-400/80">
                    Full Report
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    Get a confidence score, deepfake analysis, and fact-check — all in one reply.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6" id="how-it-works">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <FadeIn>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                  How it works
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Three steps. Zero effort.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/45">
                  No apps to install, no accounts to create. Just Instagram DMs.
                </p>
              </FadeIn>
            </div>

            <div className="mt-2">
              <FadeIn delay={0.08}>
                <HowItWorksStep
                  number={1}
                  title="Find a reel or post"
                  body="Come across something suspicious? Copy the Instagram link or use the share button."
                />
              </FadeIn>
              <FadeIn delay={0.14}>
                <HowItWorksStep
                  number={2}
                  title="DM it to @spotthis_"
                  body="Send the link as a direct message. Our bot picks it up instantly from the queue."
                />
              </FadeIn>
              <FadeIn delay={0.2}>
                <HowItWorksStep
                  number={3}
                  title="Get your verdict"
                  body="We run AI detection, deepfake scanning, and fact-checking — then reply with a clear, plain-English report."
                />
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="px-4 py-28 sm:px-6">
        <FadeIn className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <div className="pointer-events-none absolute h-[320px] w-[320px] rounded-full bg-violet-600/10 blur-[80px]" />
          <p className="relative text-xs font-semibold uppercase tracking-widest text-white/30">
            Stop the scroll
          </p>
          <h2 className="relative text-4xl font-bold tracking-tight sm:text-5xl">
            Don&apos;t share what you can&apos;t verify.
          </h2>
          <p className="relative max-w-sm text-sm leading-relaxed text-white/45">
            Misinformation spreads because people trust what looks real. Now you don&apos;t have to guess.
          </p>
          <a
            href="https://instagram.com/spotthis_"
            target="_blank"
            rel="noopener noreferrer"
            className="relative"
          >
            <Button
              size="lg"
              className="h-13 gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-900/40 hover:brightness-110"
            >
              <Instagram className="size-5" />
              DM @spotthis_
            </Button>
          </a>
        </FadeIn>
      </section>
    </div>
  );
}

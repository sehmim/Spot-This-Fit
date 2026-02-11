"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface VideoFrameStripProps {
  frames: string[];
  activeFrame: string | null;
  onFrameSelect: (frameUrl: string) => void;
  isLoading?: boolean;
}

export function VideoFrameStrip({
  frames,
  activeFrame,
  onFrameSelect,
  isLoading,
}: VideoFrameStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll the active frame into view on mount
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeFrame]);

  if (frames.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="relative mx-auto max-w-3xl px-3 py-3 sm:py-3">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}
        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto scrollbar-none sm:gap-2"
        >
          {frames.map((url) => {
            const isActive = activeFrame === url;
            return (
              <button
                key={url}
                ref={isActive ? activeRef : undefined}
                type="button"
                onClick={() => onFrameSelect(url)}
                className={cn(
                  "shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                  isActive
                    ? "border-primary ring-2 ring-primary/30 scale-105"
                    : "border-muted opacity-60 hover:opacity-100 hover:border-muted-foreground/40",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Video frame"
                  className="h-36 w-24 object-cover sm:h-20 sm:w-[52px]"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, ShoppingBag, Video } from "lucide-react";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { useVideoFrames } from "@/hooks/use-video-frames";
import { useImageSearch } from "@/hooks/use-image-search";
import { getVideoSearchByUrl, saveVideoSearch } from "@/lib/video-search-db";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";

type Stage =
  | "fetching_frames"
  | "analyzing"
  | "finding_matches"
  | "error";

const STAGE_CONFIG: Record<
  Exclude<Stage, "error">,
  { icon: typeof Loader2; label: string; sublabel: string }
> = {
  fetching_frames: {
    icon: Video,
    label: "Getting previews from the video",
    sublabel: "Extracting key frames from your video...",
  },
  analyzing: {
    icon: Sparkles,
    label: "Analyzing the contents of the photo",
    sublabel: "Our AI is identifying clothing and accessories...",
  },
  finding_matches: {
    icon: ShoppingBag,
    label: "Finding the best matches with great deals",
    sublabel: "Searching across thousands of products...",
  },
};

function PulsingDots() {
  return (
    <span className="inline-flex gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block size-1.5 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

function StageIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i < current
              ? "bg-primary"
              : i === current
                ? "bg-primary/50"
                : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function PreviewPage() {
  const router = useRouter();
  const searchMode = useSearchStore((s) => s.searchMode);
  const videoPreviewUrl = useSearchStore((s) => s.videoPreviewUrl);
  const setSelectedFrame = useSearchStore((s) => s.setSelectedFrame);
  const setVideoFrames = useSearchStore((s) => s.setVideoFrames);
  const setSearchDocId = useSearchStore((s) => s.setSearchDocId);
  const setProducts = useResultsStore((s) => s.setProducts);

  const videoFrames = useVideoFrames();
  const imageSearch = useImageSearch();

  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const hasAutoSelected = useRef(false);

  // Derive the visual stage from hook states
  const stage: Stage = (() => {
    if (videoFrames.error || imageSearch.error) return "error";
    if (videoFrames.isLoading) return "fetching_frames";
    if (imageSearch.stage === "analyzing") return "analyzing";
    if (imageSearch.stage === "finding_matches") return "finding_matches";
    return "fetching_frames";
  })();

  const errorMessage = videoFrames.error || imageSearch.error;

  // Redirect if no search mode set
  useEffect(() => {
    if (!searchMode) {
      router.replace("/search");
    }
  }, [searchMode, router]);

  // Video flow: check Firestore cache first, then fetch frames if not cached
  useEffect(() => {
    if (searchMode !== "video" || !videoPreviewUrl || hasStarted.current) return;
    hasStarted.current = true;

    (async () => {
      try {
        const cached = await getVideoSearchByUrl(videoPreviewUrl);
        if (cached) {
          setDocId(cached.id);
          setSearchDocId(cached.id);
          // Use cached frames directly — skip the worker
          setVideoFrames(cached.frames);
          const middleFrame = cached.frames[Math.floor(cached.frames.length / 2)];
          setSelectedPreview(middleFrame);
          hasAutoSelected.current = true;
          imageSearch.searchByUrl(middleFrame);
          return;
        }
      } catch {
        // Firestore lookup failed — proceed with worker
      }
      videoFrames.fetchFrames(videoPreviewUrl);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode, videoPreviewUrl]);

  // Auto-select middle frame, save to Firestore, and start search when frames arrive from worker
  useEffect(() => {
    if (videoFrames.frames.length === 0 || hasAutoSelected.current) return;
    hasAutoSelected.current = true;
    const middleFrame = videoFrames.frames[Math.floor(videoFrames.frames.length / 2)];
    setSelectedPreview(middleFrame);
    setVideoFrames(videoFrames.frames);
    imageSearch.searchByUrl(middleFrame, videoFrames.runId ?? undefined);

    // Save frames to Firestore (fire-and-forget, non-blocking)
    if (videoPreviewUrl) {
      saveVideoSearch(videoPreviewUrl, videoFrames.frames)
        .then((id) => {
          setDocId(id);
          setSearchDocId(id);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFrames.frames]);

  // Navigate to results when search completes
  useEffect(() => {
    if (imageSearch.stage !== "done") return;
    if (selectedPreview) setSelectedFrame(selectedPreview);
    setProducts(imageSearch.products);

    // Build URL: prefer runId+keys (D1-cached), fall back to Firestore docId
    let url = "/results";
    if (videoFrames.runId && videoFrames.keys.length > 0) {
      const keysParam = videoFrames.keys.map((k) => encodeURIComponent(k)).join(",");
      url = `/results?id=${videoFrames.runId}&keys=${keysParam}`;
    } else if (docId) {
      url = `/results?q=${docId}`;
    }
    router.push(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSearch.stage]);

  const handleRetry = () => {
    hasStarted.current = false;
    videoFrames.reset();
    imageSearch.reset();
    if (videoPreviewUrl) {
      hasStarted.current = true;
      videoFrames.fetchFrames(videoPreviewUrl);
    }
  };

  const totalSteps = 3;
  const currentStep =
    stage === "fetching_frames"
      ? 0
      : stage === "analyzing"
        ? 1
        : stage === "finding_matches"
          ? 2
          : 0;

  if (!searchMode) return null;

  // Error state
  if (stage === "error") {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {errorMessage}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/search")}>
              Back to Search
            </Button>
            <Button onClick={handleRetry}>Try Again</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Loading stages (fetching_frames, analyzing, finding_matches)
  const config = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
  const StageIcon = config.icon;

  return (
    <PageTransition>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
        {/* Source image preview */}
        {selectedPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="size-28 overflow-hidden rounded-2xl border-2 border-muted bg-muted/30 shadow-lg sm:size-36"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPreview}
              alt="Source"
              className="h-full w-full object-cover"
            />
          </motion.div>
        )}

        {/* Animated spinner */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute size-20 rounded-full border-2 border-primary/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute size-14 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.2, 0.7] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />
          <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/10">
            <StageIcon className="size-6 text-primary" />
          </div>
        </div>

        {/* Stage text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <h2 className="text-lg font-semibold sm:text-xl">
              {config.label}
              <PulsingDots />
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {config.sublabel}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <StageIndicator current={currentStep} total={totalSteps} />
        </div>

        {/* Subtle loading bar */}
        <div className="w-full max-w-xs overflow-hidden rounded-full bg-muted">
          <motion.div
            key={stage}
            className="h-1 rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: stage === "fetching_frames" ? 12 : 4, ease: "easeInOut" }}
          />
        </div>
      </div>
    </PageTransition>
  );
}

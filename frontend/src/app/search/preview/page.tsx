"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ImagePlus, Sparkles, ShoppingBag, Video } from "lucide-react";
import { useSearchStore } from "@/stores/search-store";
import { useResultsStore } from "@/stores/results-store";
import { useVideoFrames } from "@/hooks/use-video-frames";
import { useImageSearch } from "@/hooks/use-image-search";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";

type Stage =
  | "fetching_frames"
  | "select_frame"
  | "analyzing"
  | "finding_matches"
  | "error";

const STAGE_CONFIG: Record<
  Exclude<Stage, "select_frame" | "error">,
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
  const uploadedImage = useSearchStore((s) => s.uploadedImage);
  const videoPreviewUrl = useSearchStore((s) => s.videoPreviewUrl);
  const setSelectedFrame = useSearchStore((s) => s.setSelectedFrame);
  const setProducts = useResultsStore((s) => s.setProducts);

  const videoFrames = useVideoFrames();
  const imageSearch = useImageSearch();

  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const hasStarted = useRef(false);

  // Derive the visual stage from hook states
  const stage: Stage = (() => {
    if (videoFrames.error || imageSearch.error) return "error";
    if (videoFrames.isLoading) return "fetching_frames";
    if (searchMode === "video" && videoFrames.frames.length > 0 && imageSearch.stage === "idle")
      return "select_frame";
    if (imageSearch.stage === "analyzing") return "analyzing";
    if (imageSearch.stage === "finding_matches") return "finding_matches";
    if (searchMode === "video") return "fetching_frames";
    return "analyzing";
  })();

  const errorMessage = videoFrames.error || imageSearch.error;

  // Redirect if no search mode set
  useEffect(() => {
    if (!searchMode) {
      router.replace("/search");
    }
  }, [searchMode, router]);

  // Video flow: fetch frames on mount
  useEffect(() => {
    if (searchMode !== "video" || !videoPreviewUrl || hasStarted.current) return;
    hasStarted.current = true;
    videoFrames.fetchFrames(videoPreviewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode, videoPreviewUrl]);

  // Image flow: start search on mount
  useEffect(() => {
    if (searchMode !== "image" || !uploadedImage || hasStarted.current) return;
    hasStarted.current = true;
    imageSearch.searchByBase64(uploadedImage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode, uploadedImage]);

  // Navigate to results when search completes
  useEffect(() => {
    if (imageSearch.stage !== "done") return;
    const source = searchMode === "image" ? uploadedImage : selectedPreview;
    if (source) setSelectedFrame(source);
    setProducts(imageSearch.products);
    router.push("/results");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSearch.stage]);

  const handleFrameConfirm = () => {
    if (!selectedPreview) return;
    imageSearch.searchByUrl(selectedPreview);
  };

  const handleRetry = () => {
    hasStarted.current = false;
    videoFrames.reset();
    imageSearch.reset();
    if (searchMode === "video" && videoPreviewUrl) {
      hasStarted.current = true;
      videoFrames.fetchFrames(videoPreviewUrl);
    } else if (searchMode === "image" && uploadedImage) {
      hasStarted.current = true;
      imageSearch.searchByBase64(uploadedImage);
    }
  };

  const totalSteps = searchMode === "video" ? 4 : 2;
  const currentStep =
    stage === "fetching_frames"
      ? 0
      : stage === "select_frame"
        ? 1
        : stage === "analyzing"
          ? searchMode === "video"
            ? 2
            : 0
          : stage === "finding_matches"
            ? searchMode === "video"
              ? 3
              : 1
            : 0;

  if (!searchMode) return null;

  // Frame selection UI
  if (stage === "select_frame") {
    return (
      <PageTransition>
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:mx-auto md:max-w-2xl lg:max-w-3xl">
          <div className="w-full max-w-sm mx-auto">
            <StageIndicator current={currentStep} total={totalSteps} />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-xl font-semibold">Select a frame</h2>
            <p className="text-sm text-muted-foreground">
              Choose the frame that best shows the outfit you want to find
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {videoFrames.frames.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setSelectedPreview(url)}
                className={`overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                  selectedPreview === url
                    ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                    : "border-muted hover:border-muted-foreground/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Video frame"
                  className="aspect-[9/16] w-full object-cover"
                />
              </button>
            ))}
          </div>

          <Button
            type="button"
            size="lg"
            className="h-12 w-full gap-2 text-base"
            disabled={!selectedPreview}
            onClick={handleFrameConfirm}
          >
            <ImagePlus className="size-4" />
            Find Similar Products
          </Button>
        </div>
      </PageTransition>
    );
  }

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
        {(uploadedImage || selectedPreview) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="size-28 overflow-hidden rounded-2xl border-2 border-muted bg-muted/30 shadow-lg sm:size-36"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedImage || selectedPreview || ""}
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
            className="h-1 rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 8, ease: "easeInOut" }}
          />
        </div>
      </div>
    </PageTransition>
  );
}

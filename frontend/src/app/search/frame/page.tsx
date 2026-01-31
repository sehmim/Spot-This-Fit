"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/search-store";
import { VideoFrameSelector } from "@/components/search/video-frame-selector";
import { PageTransition } from "@/components/layout/page-transition";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FramePage() {
  const router = useRouter();
  const downloadedVideoUrl = useSearchStore((s) => s.downloadedVideoUrl);
  const setSelectedFrame = useSearchStore((s) => s.setSelectedFrame);

  useEffect(() => {
    if (!downloadedVideoUrl) {
      router.replace("/search");
    }
  }, [downloadedVideoUrl, router]);

  if (!downloadedVideoUrl) return null;

  const handleFrameSelected = (base64: string) => {
    setSelectedFrame(base64);
    router.push("/search/highlight");
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:mx-auto md:max-w-2xl lg:max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Select a frame</h1>
            <p className="text-sm text-muted-foreground">
              Play the video and pause on the product you want to find
            </p>
          </div>
        </div>

        <VideoFrameSelector
          videoUrl={downloadedVideoUrl}
          onFrameSelected={handleFrameSelected}
        />
      </div>
    </PageTransition>
  );
}

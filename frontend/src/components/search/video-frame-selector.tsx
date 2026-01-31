"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Camera } from "lucide-react";

interface VideoFrameSelectorProps {
  videoUrl: string;
  onFrameSelected: (base64: string) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoFrameSelector({
  videoUrl,
  onFrameSelected,
}: VideoFrameSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setIsReady(true);
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!video.paused) {
      video.pause();
      setIsPlaying(false);
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    onFrameSelected(base64);
  }, [onFrameSelected]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          crossOrigin="anonymous"
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="w-full"
          onClick={togglePlay}
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {isReady && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="ml-0.5 size-4" />
              )}
            </button>
            <Slider
              min={0}
              max={duration}
              step={0.1}
              value={[currentTime]}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <Button size="lg" className="w-full gap-2" onClick={captureFrame}>
            <Camera className="size-4" />
            Select this frame
          </Button>
        </div>
      )}
    </div>
  );
}

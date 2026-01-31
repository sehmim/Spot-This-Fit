"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { HighlightRegion } from "@spotthisfit/shared";

interface FrameHighlighterProps {
  frameImage: string;
  highlight: HighlightRegion | null;
  onHighlightChange: (region: HighlightRegion) => void;
}

interface Point {
  x: number;
  y: number;
}

export function FrameHighlighter({
  frameImage,
  highlight,
  onHighlightChange,
}: FrameHighlighterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentRect, setCurrentRect] = useState<HighlightRegion | null>(
    highlight
  );
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const getPosition = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    },
    []
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      const pos = getPosition(clientX, clientY);
      if (!pos) return;
      setIsDrawing(true);
      setStartPoint(pos);
      setCurrentRect(null);
    },
    [getPosition]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawing || !startPoint) return;
      const pos = getPosition(clientX, clientY);
      if (!pos) return;

      setCurrentRect({
        x: Math.min(startPoint.x, pos.x),
        y: Math.min(startPoint.y, pos.y),
        width: Math.abs(pos.x - startPoint.x),
        height: Math.abs(pos.y - startPoint.y),
      });
    },
    [isDrawing, startPoint, getPosition]
  );

  const handleEnd = useCallback(() => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    setStartPoint(null);

    if (currentRect.width > 0.02 && currentRect.height > 0.02) {
      onHighlightChange(currentRect);
    }
  }, [isDrawing, currentRect, onHighlightChange]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => handleStart(e.clientX, e.clientY),
    [handleStart]
  );
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove]
  );
  const onMouseUp = useCallback(() => handleEnd(), [handleEnd]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    },
    [handleStart]
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    [handleMove]
  );
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleEnd();
    },
    [handleEnd]
  );

  // Draw highlight overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rectToDraw = currentRect || highlight;
    if (!rectToDraw) return;

    const w = canvas.width;
    const h = canvas.height;

    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, w, h);

    // Clear selection area
    const rx = rectToDraw.x * w;
    const ry = rectToDraw.y * h;
    const rw = rectToDraw.width * w;
    const rh = rectToDraw.height * h;
    ctx.clearRect(rx, ry, rw, rh);

    // Dashed border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(rx, ry, rw, rh);

    // Corner handles
    ctx.setLineDash([]);
    ctx.fillStyle = "#3b82f6";
    const hs = 6;
    [
      [rx, ry],
      [rx + rw, ry],
      [rx, ry + rh],
      [rx + rw, ry + rh],
    ].forEach(([cx, cy]) => {
      ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
    });
  }, [currentRect, highlight, canvasSize]);

  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!img || !container || !canvas) return;

    const displayWidth = container.clientWidth;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const displayHeight = displayWidth / aspectRatio;

    setCanvasSize({ width: displayWidth, height: displayHeight });
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }, []);

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={frameImage}
        alt="Selected video frame"
        className="w-full rounded-xl"
        onLoad={handleImageLoad}
        draggable={false}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair rounded-xl touch-none"
        style={{
          width: canvasSize.width || "100%",
          height: canvasSize.height || "auto",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {!highlight && !currentRect && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-black/60 px-4 py-2 text-sm font-medium text-white">
            Draw a box around the product
          </div>
        </div>
      )}
    </div>
  );
}

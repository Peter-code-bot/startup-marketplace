"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

function isVideo(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url.split("?")[0] ?? "");
}

const MIN_H = 200;
const MAX_H = 700;
const DEFAULT_H = 400;
const STORAGE_KEY = "vicino-gallery-height";

interface ProductGalleryProps {
  images: string[];
  title: string;
  isOwner?: boolean;
}

export function ProductGallery({ images, title, isOwner = false }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [height, setHeight] = useState(DEFAULT_H);
  const resizing = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHeight(Math.min(MAX_H, Math.max(MIN_H, parseInt(saved))));
    } catch {}
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      resizing.current = true;
      startY.current = e.clientY;
      startH.current = height;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [height]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return;
    const delta = e.clientY - startY.current;
    setHeight(Math.min(MAX_H, Math.max(MIN_H, startH.current + delta)));
  }, []);

  const onPointerUp = useCallback(() => {
    if (!resizing.current) return;
    resizing.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    try {
      localStorage.setItem(STORAGE_KEY, String(height));
    } catch {}
  }, [height]);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <span className="text-4xl mb-2">📷</span>
        <span className="text-sm">Sin imagen</span>
      </div>
    );
  }

  const current = images[selected] ?? images[0]!;

  return (
    <div>
      {/* Resizable main image/video */}
      <div
        style={{ height }}
        className="relative md:rounded-3xl overflow-hidden bg-cream-dark dark:bg-neutral-900 border-x-0 md:border border-border/40 w-full"
      >
        {isVideo(current) ? (
          <video
            key={current}
            src={current}
            controls
            preload="metadata"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <Image
            key={current}
            src={current}
            alt={title}
            fill
            className="object-contain"
            priority={selected === 0}
          />
        )}
      </div>

      {/* Resize handle — only for product owner */}
      {isOwner && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex items-center justify-center w-full h-6 cursor-ns-resize group touch-none"
        >
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/25 group-hover:bg-bone group-active:bg-bone transition-colors" />
        </div>
      )}

      {/* Thumbnails — fixed below handle */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-4 md:px-0">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                selected === i
                  ? "border-bone ring-1 ring-bone/50"
                  : "border-transparent hover:border-bone/30"
              )}
            >
              {isVideo(url) ? (
                <>
                  <video src={url} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-3 h-3 text-white fill-white" />
                  </div>
                </>
              ) : (
                <Image src={url} alt="" fill className="object-cover" sizes="64px" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

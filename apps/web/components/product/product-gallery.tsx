"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

function isVideo(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url.split("?")[0] ?? "");
}

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <span className="text-4xl mb-2">📷</span>
        <span className="text-sm">Sin imagen</span>
      </div>
    );
  }

  const current = images[selected] ?? images[0]!;

  return (
    <div className="space-y-3">
      {/* Main image/video */}
      <div className="relative aspect-square md:aspect-[4/3] md:rounded-3xl overflow-hidden bg-cream-dark dark:bg-neutral-900 border-x-0 md:border border-border/40 w-full">
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
            className="object-cover"
            priority={selected === 0}
          />
        )}
      </div>

      {/* Thumbnails — only if 2+ media */}
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
                  <video src={url} preload="metadata" className="w-full h-full object-cover" />
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

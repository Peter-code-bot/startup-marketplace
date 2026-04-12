"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Pencil, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function isVideo(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url.split("?")[0] ?? "");
}

interface ImageSize {
  colSpan: number;
  rowSpan: number;
}

const SIZE_PRESETS = [
  { label: "S", colSpan: 1, rowSpan: 1 },
  { label: "M", colSpan: 2, rowSpan: 1 },
  { label: "L", colSpan: 2, rowSpan: 2 },
  { label: "XL", colSpan: 3, rowSpan: 2 },
] as const;

interface ProductGalleryProps {
  images: string[];
  title: string;
  isOwner?: boolean;
  productId?: string;
  savedSizes?: ImageSize[] | null;
}

export function ProductGallery({
  images,
  title,
  isOwner = false,
  productId,
  savedSizes,
}: ProductGalleryProps) {
  const defaultSizes = images.map((_, i) => ({
    colSpan: i === 0 ? 3 : 1,
    rowSpan: i === 0 ? 2 : 1,
  }));
  const [sizes, setSizes] = useState<ImageSize[]>(savedSizes ?? defaultSizes);
  const [originalSizes, setOriginalSizes] = useState<ImageSize[]>(sizes);
  const [editMode, setEditMode] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground rounded-xl bg-cream-dark dark:bg-neutral-900">
        <span className="text-4xl mb-2">📷</span>
        <span className="text-sm">Sin imagen</span>
      </div>
    );
  }

  if (images.length === 1) {
    const url = images[0]!;
    return (
      <div className="relative aspect-[4/3] md:rounded-3xl overflow-hidden bg-cream-dark dark:bg-neutral-900 border-x-0 md:border border-border/40">
        {isVideo(url) ? (
          <video src={url} controls preload="metadata" className="w-full h-full object-contain bg-black" />
        ) : (
          <Image src={url} alt={title} fill className="object-cover" priority />
        )}
      </div>
    );
  }

  async function handleSave() {
    if (productId) {
      const supabase = createClient();
      await supabase.from("products_services").update({ gallery_sizes: sizes }).eq("id", productId);
    }
    setEditMode(false);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5 auto-rows-[140px] md:rounded-xl overflow-hidden">
        {images.map((url, i) => {
          const size = sizes[i] ?? { colSpan: 1, rowSpan: 1 };
          return (
            <div
              key={i}
              className={cn("relative overflow-hidden cursor-pointer", editMode && "border-2 border-dashed border-bone/40")}
              style={{ gridColumn: `span ${Math.min(size.colSpan, 3)}`, gridRow: `span ${size.rowSpan}` }}
              onClick={() => !editMode && setLightbox(i)}
            >
              {isVideo(url) ? (
                <>
                  <video src={url} preload="metadata" muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </>
              ) : (
                <Image src={url} alt={title} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
              )}
              {editMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="flex gap-1.5">
                    {SIZE_PRESETS.map((p) => (
                      <button key={p.label} type="button"
                        onClick={(e) => { e.stopPropagation(); const u = [...sizes]; u[i] = { colSpan: p.colSpan, rowSpan: p.rowSpan }; setSizes(u); }}
                        className={cn("w-8 h-8 rounded-md text-xs font-bold transition-all",
                          size.colSpan === p.colSpan && size.rowSpan === p.rowSpan ? "bg-bone text-bone-contrast scale-110" : "bg-white/20 text-white hover:bg-white/40")}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isOwner && !editMode && (
        <button onClick={() => { setOriginalSizes([...sizes]); setEditMode(true); }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Pencil className="w-3 h-3" /> Editar diseño
        </button>
      )}

      {editMode && (
        <div className="flex gap-2">
          <button onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-bone text-bone-contrast hover:bg-bone-dark text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> Guardar
          </button>
          <button onClick={() => { setSizes([...originalSizes]); setEditMode(false); }}
            className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
        </div>
      )}

      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(null)}>
            <X className="w-8 h-8" />
          </button>
          {isVideo(images[lightbox]!) ? (
            <video src={images[lightbox]} controls autoPlay className="max-w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={images[lightbox]} alt={title} className="max-w-full max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
}

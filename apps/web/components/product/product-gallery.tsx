"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Pencil, Grid2X2, LayoutGrid, Columns2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function isVideo(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url.split("?")[0] ?? "");
}

function MediaItem({ url, alt, fill, className }: { url: string; alt: string; fill?: boolean; className?: string }) {
  if (isVideo(url)) {
    return <video src={url} controls preload="metadata" className={cn("object-cover", className)} />;
  }
  return fill
    ? <Image src={url} alt={alt} fill className={cn("object-cover", className)} />
    : <img src={url} alt={alt} className={cn("object-cover", className)} />;
}

const LAYOUTS = [
  { id: "single", label: "Simple", icon: Square, minImages: 1 },
  { id: "grid-2", label: "Doble", icon: Columns2, minImages: 2 },
  { id: "featured-left", label: "Destacada", icon: LayoutGrid, minImages: 3 },
  { id: "mosaic", label: "Mosaico", icon: Grid2X2, minImages: 4 },
] as const;

interface ProductGalleryProps {
  images: string[];
  title: string;
  isOwner?: boolean;
  productId?: string;
  savedLayout?: string;
}

export function ProductGallery({ images, title, isOwner = false, productId, savedLayout = "single" }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [layout, setLayout] = useState(savedLayout);
  const [editMode, setEditMode] = useState(false);
  const [tempLayout, setTempLayout] = useState(savedLayout);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground rounded-xl bg-cream-dark dark:bg-neutral-900">
        <span className="text-4xl mb-2">📷</span>
        <span className="text-sm">Sin imagen</span>
      </div>
    );
  }

  const current = images[selected] ?? images[0]!;
  const effectiveLayout = images.length === 1 ? "single" : layout;

  async function handleSave() {
    if (productId) {
      const supabase = createClient();
      await supabase.from("products_services").update({ gallery_layout: tempLayout }).eq("id", productId);
    }
    setLayout(tempLayout);
    setEditMode(false);
  }

  // Grid layouts for 2+ images
  if (!editMode && effectiveLayout !== "single" && images.length > 1) {
    return (
      <div className="relative">
        {isOwner && (
          <button onClick={() => { setEditMode(true); setTempLayout(layout); }}
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs hover:bg-black/80 transition-colors">
            <Pencil className="w-3 h-3" /> Editar
          </button>
        )}
        {effectiveLayout === "grid-2" && (
          <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden" style={{ height: 350 }}>
            {images.slice(0, 2).map((url, i) => (
              <div key={i} className="relative cursor-pointer" onClick={() => { setSelected(i); setLayout("single"); }}>
                <MediaItem url={url} alt={title} fill />
              </div>
            ))}
          </div>
        )}
        {effectiveLayout === "featured-left" && (
          <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden" style={{ height: 400 }}>
            <div className="col-span-2 relative cursor-pointer" onClick={() => { setSelected(0); setLayout("single"); }}>
              <MediaItem url={images[0]!} alt={title} fill />
            </div>
            <div className="flex flex-col gap-1.5">
              {images.slice(1, 3).map((url, i) => (
                <div key={i} className="relative flex-1 cursor-pointer" onClick={() => { setSelected(i + 1); setLayout("single"); }}>
                  <MediaItem url={url} alt={title} fill />
                </div>
              ))}
            </div>
          </div>
        )}
        {effectiveLayout === "mosaic" && (
          <div className="space-y-1.5 rounded-xl overflow-hidden">
            <div className="relative cursor-pointer" style={{ height: 260 }} onClick={() => { setSelected(0); setLayout("single"); }}>
              <MediaItem url={images[0]!} alt={title} fill />
            </div>
            <div className="grid grid-cols-3 gap-1.5" style={{ height: 140 }}>
              {images.slice(1, 4).map((url, i) => (
                <div key={i} className="relative cursor-pointer" onClick={() => { setSelected(i + 1); setLayout("single"); }}>
                  <MediaItem url={url} alt={title} fill />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single image view (default) + thumbnails
  return (
    <div>
      {isOwner && images.length > 1 && !editMode && (
        <button onClick={() => { setEditMode(true); setTempLayout(layout); }}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs hover:bg-black/80 transition-colors">
          <Pencil className="w-3 h-3" /> Editar
        </button>
      )}

      <div className="relative aspect-[4/3] md:rounded-3xl overflow-hidden bg-cream-dark dark:bg-neutral-900 border-x-0 md:border border-border/40 w-full">
        {isVideo(current) ? (
          <video key={current} src={current} controls preload="metadata" className="w-full h-full object-contain bg-black" />
        ) : (
          <Image key={current} src={current} alt={title} fill className="object-cover" priority={selected === 0} />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-4 md:px-0 mt-3">
          {images.map((url, i) => (
            <button key={i} type="button" onClick={() => setSelected(i)}
              className={cn("relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                selected === i ? "border-bone ring-1 ring-bone/50" : "border-transparent hover:border-bone/30")}>
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

      {/* Layout editor */}
      {editMode && (
        <div className="mt-4 p-4 rounded-xl border border-dashed border-bone/40 bg-bone/5 space-y-4">
          <p className="text-sm font-medium">Elige el diseño de tu galería:</p>
          <div className="flex gap-3">
            {LAYOUTS.filter((l) => images.length >= l.minImages).map((l) => (
              <button key={l.id} type="button" onClick={() => setTempLayout(l.id)}
                className={cn("p-3 rounded-xl border-2 text-center transition-all flex-1",
                  tempLayout === l.id ? "border-bone bg-bone/10" : "border-border hover:border-bone/40")}>
                <l.icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs">{l.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 py-2 rounded-lg bg-bone text-bone-contrast hover:bg-bone-dark text-sm font-medium transition-colors">
              ✓ Guardar diseño
            </button>
            <button onClick={() => { setTempLayout(layout); setEditMode(false); }}
              className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

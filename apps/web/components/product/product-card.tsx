"use client";

import Link from "next/link";
import Image from "next/image";
import { SellerBadge } from "@/components/shared/seller-badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { PriceDisplay } from "@/components/shared/price-display";
import type { TrustLevel } from "@vicino/shared";
import { Heart } from "lucide-react";

interface ProductCardProps {
  id: string;
  titulo: string;
  precio: number;
  imagen: string | null;
  categoria: string;
  slug: string;
  vendedor: {
    nombre: string;
    trust_level: TrustLevel;
  };
  rating: number;
  reviewsCount: number;
}

export function ProductCard({
  titulo,
  precio,
  imagen,
  categoria,
  slug,
  vendedor,
  rating,
  reviewsCount,
}: ProductCardProps) {
  return (
    <Link
      href={`/${categoria}/${slug}`}
      className="group block rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-terracotta/15"
      id={`product-${slug}`}
    >
      {/* Image Container — 4:3 ratio */}
      <div className="aspect-[4/3] relative bg-cream-dark dark:bg-neutral-800 overflow-hidden">
        {imagen ? (
          <Image
            src={imagen}
            alt={titulo}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="text-3xl block mb-1">📷</span>
              <span className="text-xs text-muted-foreground">Sin imagen</span>
            </div>
          </div>
        )}

        {/* Price Badge — glassmorphism bottom-left */}
        <div className="absolute bottom-2 left-2">
          <div className="px-2.5 py-1 rounded-lg bg-charcoal/70 dark:bg-charcoal-light/80 backdrop-blur-md text-white">
            <PriceDisplay amount={precio} size="sm" className="font-heading font-bold text-white" />
          </div>
        </div>

        {/* Favorite Button — top-right translucent */}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-white/90 hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Favorite logic handled by parent/store
          }}
          aria-label="Agregar a favoritos"
        >
          <Heart className="w-4 h-4 text-charcoal/70 dark:text-white/80" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-terracotta transition-colors duration-200">
          {titulo}
        </h3>

        {/* Seller info */}
        <div className="flex items-center gap-1.5">
          {vendedor.trust_level !== "nuevo" && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-trust flex-shrink-0" />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {vendedor.nombre}
          </span>
          <SellerBadge level={vendedor.trust_level} showLabel={false} size="sm" />
        </div>

        {/* Rating */}
        {rating > 0 && (
          <RatingStars rating={rating} count={reviewsCount} size="sm" />
        )}
      </div>
    </Link>
  );
}

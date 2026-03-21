import Link from "next/link";
import Image from "next/image";
import { SellerBadge } from "@/components/shared/seller-badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { PriceDisplay } from "@/components/shared/price-display";
import type { TrustLevel } from "@vicino/shared";

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
      className="group block rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="aspect-square relative bg-muted">
        {imagen ? (
          <Image
            src={imagen}
            alt={titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Sin imagen
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <PriceDisplay amount={precio} size="md" />
        <h3 className="text-sm font-medium line-clamp-2 leading-tight">
          {titulo}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground truncate">
            {vendedor.nombre}
          </span>
          <SellerBadge level={vendedor.trust_level} showLabel={false} size="sm" />
        </div>
        {rating > 0 && (
          <RatingStars rating={rating} count={reviewsCount} size="sm" />
        )}
      </div>
    </Link>
  );
}

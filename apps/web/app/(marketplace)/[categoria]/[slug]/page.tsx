import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SellerBadge } from "@/components/shared/seller-badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { PriceDisplay } from "@/components/shared/price-display";
import { MessageCircle, Heart, MapPin, Truck } from "lucide-react";
import type { TrustLevel } from "@vicino/shared";

interface Props {
  params: Promise<{ categoria: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products_services")
    .select("titulo, descripcion, imagen_principal, precio")
    .eq("slug", slug)
    .single();

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.titulo,
    description: product.descripcion?.slice(0, 160),
    openGraph: {
      title: `${product.titulo} — VICINO`,
      description: product.descripcion?.slice(0, 160),
      images: product.imagen_principal ? [product.imagen_principal] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products_services")
    .select(
      `
      *,
      profiles!inner(
        id, nombre, foto, trust_level, metodos_pago_aceptados,
        average_rating_as_seller, reviews_count_as_seller, total_sales
      )
    `
    )
    .eq("slug", slug)
    .eq("estatus", "disponible")
    .single();

  if (!product) notFound();

  const seller = Array.isArray(product.profiles)
    ? product.profiles[0]
    : product.profiles;

  // Get reviews for this product (buyer_to_seller only)
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comentario, created_at, review_type, respuesta, respuesta_fecha,
      profiles!reviewer_id(nombre, foto, trust_level)
    `
    )
    .eq("product_id", product.id)
    .eq("review_type", "buyer_to_seller")
    .eq("visible", true)
    .order("created_at", { ascending: false })
    .limit(10);

  // Increment view count (fire and forget)
  supabase
    .from("products_services")
    .update({ vistas_count: (product.vistas_count ?? 0) + 1 })
    .eq("id", product.id)
    .then();

  const deliveryLabel =
    product.tipo_entrega === "pickup"
      ? "Recoger en punto"
      : product.tipo_entrega === "envio"
        ? "Envío"
        : "Pickup o envío";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Image */}
      <div className="aspect-square md:aspect-video relative rounded-lg overflow-hidden bg-muted max-h-96">
        {product.imagen_principal ? (
          <Image
            src={product.imagen_principal}
            alt={product.titulo}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-4">
        <PriceDisplay amount={Number(product.precio)} size="lg" />
        <h1 className="text-xl font-bold">{product.titulo}</h1>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {product.ubicacion && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {product.ubicacion}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            {deliveryLabel}
          </span>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-line">
          {product.descripcion}
        </p>

        {seller?.metodos_pago_aceptados && (
          <div className="text-sm">
            <span className="font-medium">Métodos de pago: </span>
            <span className="text-muted-foreground">
              {seller.metodos_pago_aceptados}
            </span>
          </div>
        )}
      </div>

      {/* Seller info */}
      <div className="flex items-center gap-3 p-4 rounded-lg border">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {seller?.foto ? (
            <Image
              src={seller.foto}
              alt={seller.nombre ?? ""}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <span className="text-lg">
              {seller?.nombre?.charAt(0)?.toUpperCase() ?? "V"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/vendedor/${seller?.id}`}
              className="font-medium text-sm hover:underline truncate"
            >
              {seller?.nombre ?? "Vendedor"}
            </Link>
            <SellerBadge
              level={(seller?.trust_level as TrustLevel) ?? "nuevo"}
              size="sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RatingStars
              rating={Number(seller?.average_rating_as_seller ?? 0)}
              count={Number(seller?.reviews_count_as_seller ?? 0)}
              size="sm"
            />
            <span>· {seller?.total_sales ?? 0} ventas</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 sticky bottom-20 md:bottom-4 bg-background py-3">
        <Link
          href={`/chat?seller=${seller?.id}&product=${product.id}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <MessageCircle className="h-4 w-4" />
          Me interesa — Chatear
        </Link>
        <button className="flex items-center justify-center w-12 rounded-md border hover:bg-accent">
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Reseñas ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.map((review) => {
              const reviewer = Array.isArray(review.profiles)
                ? review.profiles[0]
                : review.profiles;
              return (
                <div key={review.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {reviewer?.nombre ?? "Usuario"}
                    </span>
                    <RatingStars rating={review.rating} size="sm" />
                  </div>
                  {review.comentario && (
                    <p className="text-sm text-muted-foreground">
                      {review.comentario}
                    </p>
                  )}
                  {review.respuesta && (
                    <div className="ml-4 pl-3 border-l text-sm">
                      <span className="font-medium">
                        Respuesta del vendedor:
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {review.respuesta}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

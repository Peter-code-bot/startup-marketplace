"use client";

import Link from "next/link";
import { MapPin, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyProducts } from "@/hooks/useNearbyProducts";
import { RADIUS_DEFAULT_METERS } from "@/lib/geo/radius";
import { ProductCarousel } from "@/components/home/product-carousel";
import type { TrustLevel } from "@vicino/shared";

export function LocationBar() {
  const { state } = useGeolocation();
  const position = state.status === "success" ? state.position : null;

  // La seccion se llama "Cerca de ti" y pedia 1.000 m ESCRITOS A MANO,
  // ignorando el radio que el usuario configuro. En Puebla eso son unas pocas
  // cuadras: una publicacion a 3 km quedaba fuera de la unica seccion que
  // promete ensenar lo que tienes cerca, sin ningun aviso de que habia un
  // radio distinto al elegido.
  //
  // useGeolocation ya guarda el radio del usuario (y lo persiste en la cookie
  // vicino_radius). RADIUS_DEFAULT_METERS es el mismo default que usa el feed
  // principal, asi que las dos superficies hablan por fin del mismo alcance.
  const radioMetros = position?.radius ?? RADIUS_DEFAULT_METERS;

  const { products, loading } = useNearbyProducts({
    position,
    radiusMeters: radioMetros,
  });

  return (
    <div className="space-y-4">
      {/* Grid de productos cercanos — solo visible cuando hay posición */}
      {position && (
        <div>
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[color:var(--brand-hi)]" />
              <h2 className="font-heading text-xl font-bold text-[color:var(--fg)]">Cerca de ti</h2>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-[color:var(--fg-muted)]" />
              )}
            </div>
            {products.length > 0 && (
              <div className="mt-1 flex justify-end">
                <Link
                  href="/buscar"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-hi)] transition-colors hover:text-[color:var(--brand)]"
                >
                  Ver más
                </Link>
              </div>
            )}
          </div>

          {products.length > 0 ? (
            // Los badges de categoria ya salen, y RESULTO NO NECESITAR NADA DE
            // SQL. El TODO que vivia aqui daba tres pasos y el primero era
            // "CREATE OR REPLACE FUNCTION nearby_products", diferido "para no
            // mezclar schema work con render-only".
            //
            // Ese paso sobraba: esta superficie hace tiempo que dejo de llamar
            // a nearby_products —que quedo huerfana— y llama a
            // search_nearby_products_v4 con sort_by_distance, cuya rama esta
            // literalmente rotulada "Rama 1: Cerca de Ti" en la funcion. Y esa
            // funcion YA devuelve product_categories en cada fila.
            //
            // O sea que los badges no faltaban por falta de datos: los datos
            // llegaban y se tiraban en el mapeo de getNearbyProducts. Se pagaba
            // el agregado en la base y se descartaba antes de la pantalla.
            <ProductCarousel
              products={products.map((p) => ({
                id: p.id,
                titulo: p.titulo,
                precio: p.precio,
                imagen_principal: p.imagen_principal,
                categoria: p.categoria,
                slug: p.slug,
                product_categories: p.product_categories,
                profiles: {
                  nombre: p.vendedor_nombre,
                  trust_level: p.vendedor_trust,
                  average_rating: p.vendedor_rating,
                  reviews_count: p.vendedor_reviews,
                },
              }))}
            />
          ) : !loading ? (
            <p className="py-4 text-sm text-[color:var(--fg-muted)]">
              {/* El «1 km» estaba escrito a mano y llevaba mintiendo desde que
                  esta seccion dejo de pedir 1.000 m y paso a usar el radio del
                  usuario: con el default de 10 km, el aviso se equivocaba por
                  diez. Ahora dice el radio que de verdad se consulto. */}
              Sin publicaciones en un radio de{" "}
              {radioMetros >= 1000
                ? `${Number.isInteger(radioMetros / 1000) ? radioMetros / 1000 : (radioMetros / 1000).toFixed(1)} km`
                : `${radioMetros} m`}
              .{" "}
              <Link
                href="/buscar"
                className="font-medium text-[color:var(--brand-hi)] hover:underline"
              >
                Explorar todo
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

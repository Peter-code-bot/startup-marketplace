import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/product-card";
import { CATEGORIES } from "@vicino/shared";
import type { TrustLevel } from "@vicino/shared";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products_services")
    .select(
      `
      id,
      titulo,
      precio,
      imagen_principal,
      categoria,
      slug,
      creador_id,
      profiles!inner(nombre, trust_level, average_rating_as_seller, reviews_count_as_seller)
    `
    )
    .eq("estatus", "disponible")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Categories */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Categorías</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/buscar?category=${cat.slug}`}
              className="flex flex-col items-center gap-1.5 min-w-[72px] text-center"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                <span className="text-lg">
                  {cat.slug === "comida" && "🍽️"}
                  {cat.slug === "ropa" && "👕"}
                  {cat.slug === "tecnologia" && "💻"}
                  {cat.slug === "hogar" && "🏠"}
                  {cat.slug === "belleza" && "✨"}
                  {cat.slug === "salud" && "❤️"}
                  {cat.slug === "educacion" && "🎓"}
                  {cat.slug === "transporte" && "🚗"}
                  {cat.slug === "eventos" && "🎉"}
                  {cat.slug === "mascotas" && "🐾"}
                  {cat.slug === "servicios-profesionales" && "💼"}
                  {cat.slug === "otros" && "📦"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recientes</h2>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map((product) => {
              const profile = Array.isArray(product.profiles)
                ? product.profiles[0]
                : product.profiles;
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  titulo={product.titulo}
                  precio={Number(product.precio)}
                  imagen={product.imagen_principal}
                  categoria={product.categoria}
                  slug={product.slug ?? product.id}
                  vendedor={{
                    nombre: profile?.nombre ?? "Vendedor",
                    trust_level: (profile?.trust_level as TrustLevel) ?? "nuevo",
                  }}
                  rating={Number(profile?.average_rating_as_seller ?? 0)}
                  reviewsCount={Number(profile?.reviews_count_as_seller ?? 0)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🏪</p>
            <p className="text-lg font-medium">
              Bienvenido a VICINO
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Tu mercado de confianza. Aún no hay productos publicados. ¡Sé el
              primero en vender!
            </p>
            <Link
              href="/vender"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Publicar producto
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
import { SkeletonPanel } from "@/components/shared/loading-skeletons";

/**
 * recharts pesa 379.377 B sin comprimir (112.827 B gzip) y es el 43 % de los
 * bytes de esta ruta. Con el import estatico viajaba en el chunk de la pagina,
 * asi que el vendedor no veia NADA —ni los numeros, que ya vienen resueltos del
 * servidor— hasta que terminaba de bajarse la libreria de graficas.
 *
 * Cargandolo asi, las cifras y las tablas se pintan de inmediato y la grafica
 * aterriza despues, sobre su esqueleto. Es el unico sitio del repo que importa
 * recharts, comprobado con grep, asi que el chunk sale limpio.
 */
const AnalyticsCharts = dynamic(
  () => import("./analytics-charts").then((m) => m.AnalyticsCharts),
  { loading: () => <SkeletonPanel etiqueta="Cargando las graficas" /> },
);

export const metadata = { title: "Estadísticas" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sales last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentSales } = await supabase
    .from("sale_confirmations")
    .select("completed_at, precio_acordado, products_services(titulo)")
    .eq("seller_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", thirtyDaysAgo.toISOString())
    .order("completed_at", { ascending: true });

  // Aggregate by day
  const salesByDay: Record<string, number> = {};
  const productSales: Record<string, number> = {};

  recentSales?.forEach((s) => {
    if (s.completed_at) {
      const day = s.completed_at.slice(0, 10);
      salesByDay[day] = (salesByDay[day] ?? 0) + 1;
    }
    const product = Array.isArray(s.products_services)
      ? s.products_services[0]
      : s.products_services;
    const name = product?.titulo ?? "Producto";
    productSales[name] = (productSales[name] ?? 0) + 1;
  });

  const dailyData = Object.entries(salesByDay).map(([date, count]) => ({
    date,
    ventas: count,
  }));

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, ventas: count }));

  return (
    <div className="space-y-6 min-w-0">
      <h1 className="text-xl font-bold truncate">Estadísticas</h1>
      <div className="w-full min-w-0">
        <AnalyticsCharts dailyData={dailyData} topProducts={topProducts} />
      </div>
    </div>
  );
}

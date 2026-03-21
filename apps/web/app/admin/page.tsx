import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@vicino/shared";
import { Users, Package, Handshake, TrendingUp } from "lucide-react";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { count: totalSellers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("es_vendedor", true);

  const { count: activeProducts } = await supabase
    .from("products_services")
    .select("id", { count: "exact", head: true })
    .eq("estatus", "disponible");

  const { data: allSales } = await supabase
    .from("sale_confirmations")
    .select("precio_acordado")
    .eq("status", "completed");

  const totalSales = allSales?.length ?? 0;
  const totalValue = allSales?.reduce((s, r) => s + Number(r.precio_acordado), 0) ?? 0;

  // This month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlySales } = await supabase
    .from("sale_confirmations")
    .select("precio_acordado")
    .eq("status", "completed")
    .gte("completed_at", startOfMonth.toISOString());

  const monthCount = monthlySales?.length ?? 0;

  // Pending verifications
  const { count: pendingVerifications } = await supabase
    .from("seller_verification")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // Open disputes
  const { count: openDisputes } = await supabase
    .from("disputes")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "under_review"]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs">Usuarios</span>
          </div>
          <p className="text-2xl font-bold">{totalUsers ?? 0}</p>
          <p className="text-xs text-muted-foreground">{totalSellers ?? 0} vendedores</p>
        </div>

        <div className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="text-xs">Productos activos</span>
          </div>
          <p className="text-2xl font-bold">{activeProducts ?? 0}</p>
        </div>

        <div className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Handshake className="h-4 w-4" />
            <span className="text-xs">Ventas totales</span>
          </div>
          <p className="text-2xl font-bold">{totalSales}</p>
          <p className="text-xs text-muted-foreground">{formatPrice(totalValue)}</p>
        </div>

        <div className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Ventas este mes</span>
          </div>
          <p className="text-2xl font-bold">{monthCount}</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {(pendingVerifications ?? 0) > 0 && (
          <a
            href="/admin/verifications"
            className="block rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
          >
            {pendingVerifications} verificaciones pendientes de revisión →
          </a>
        )}
        {(openDisputes ?? 0) > 0 && (
          <a
            href="/admin/disputes"
            className="block rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
          >
            {openDisputes} disputas abiertas →
          </a>
        )}
      </div>
    </div>
  );
}

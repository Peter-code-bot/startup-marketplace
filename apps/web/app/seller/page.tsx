import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SellerBadge } from "@/components/shared/seller-badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatPrice } from "@vicino/shared";
import { TRUST_LEVELS } from "@vicino/shared";
import type { TrustLevel } from "@vicino/shared";
import { Package, Handshake, Star, TrendingUp } from "lucide-react";

export const metadata = { title: "Dashboard vendedor" };

export default async function SellerOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("trust_level, trust_points, average_rating_as_seller, reviews_count_as_seller, total_sales")
    .eq("id", user.id)
    .single();

  // Sales this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlySales } = await supabase
    .from("sale_confirmations")
    .select("precio_acordado")
    .eq("seller_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", startOfMonth.toISOString());

  const monthCount = monthlySales?.length ?? 0;
  const monthTotal = monthlySales?.reduce((sum, s) => sum + Number(s.precio_acordado), 0) ?? 0;

  // Active listings
  const { count: activeListings } = await supabase
    .from("products_services")
    .select("id", { count: "exact", head: true })
    .eq("creador_id", user.id)
    .eq("estatus", "disponible");

  // Pending reviews (completed sales without seller_to_buyer review)
  const { data: completedSales } = await supabase
    .from("sale_confirmations")
    .select("id")
    .eq("seller_id", user.id)
    .eq("status", "completed");

  const { data: sellerReviews } = await supabase
    .from("reviews")
    .select("sale_confirmation_id")
    .eq("reviewer_id", user.id)
    .eq("review_type", "seller_to_buyer");

  const reviewedIds = new Set(sellerReviews?.map((r) => r.sale_confirmation_id) ?? []);
  const pendingReviews = completedSales?.filter((s) => !reviewedIds.has(s.id)).length ?? 0;

  const trustLevel = (profile?.trust_level as TrustLevel) ?? "nuevo";
  const trustConfig = TRUST_LEVELS[trustLevel];
  const nextLevel = Object.entries(TRUST_LEVELS).find(
    ([, v]) => v.minPoints > (profile?.trust_points ?? 0)
  );
  const progressPercent = nextLevel
    ? Math.min(100, ((profile?.trust_points ?? 0) / nextLevel[1].minPoints) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Handshake className="h-4 w-4" />
            <span className="text-xs">Ventas este mes</span>
          </div>
          <p className="text-2xl font-bold">{monthCount}</p>
          <p className="text-xs text-muted-foreground">{formatPrice(monthTotal)}</p>
        </div>

        <div className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="text-xs">Listings activos</span>
          </div>
          <p className="text-2xl font-bold">{activeListings ?? 0}</p>
        </div>

        <div className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            <span className="text-xs">Rating</span>
          </div>
          <RatingStars
            rating={Number(profile?.average_rating_as_seller ?? 0)}
            count={Number(profile?.reviews_count_as_seller ?? 0)}
          />
        </div>

        <div className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Total ventas</span>
          </div>
          <p className="text-2xl font-bold">{profile?.total_sales ?? 0}</p>
        </div>
      </div>

      {/* Trust level progress */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Nivel de confianza</span>
            <SellerBadge level={trustLevel} />
          </div>
          <span className="text-xs text-muted-foreground">
            {profile?.trust_points ?? 0} pts
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {nextLevel && (
          <p className="text-xs text-muted-foreground">
            {nextLevel[1].minPoints - (profile?.trust_points ?? 0)} pts más para{" "}
            <strong>{nextLevel[1].label}</strong>
          </p>
        )}
      </div>

      {/* Pending reviews alert */}
      {pendingReviews > 0 && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Tienes <strong>{pendingReviews}</strong> reseñas pendientes de dejar.{" "}
            <a href="/seller/reviews" className="underline">
              Ir a reviews →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SellerSidebar } from "@/components/layout/seller-sidebar";
import { SellerBadge } from "@/components/shared/seller-badge";
import type { TrustLevel } from "@vicino/shared";
import Link from "next/link";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/seller");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_negocio, nombre, trust_level")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold text-xl">
            VICINO
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-sm">
            {profile?.nombre_negocio ?? profile?.nombre ?? "Mi tienda"}
          </span>
          <SellerBadge
            level={(profile?.trust_level as TrustLevel) ?? "nuevo"}
            size="sm"
          />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:block w-48 shrink-0">
          <SellerSidebar />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

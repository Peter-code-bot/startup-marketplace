"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Handshake,
  Star,
  BarChart3,
  ShieldCheck,
  Tag,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/seller", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/seller/listings", label: "Listings", icon: Package },
  { href: "/seller/ventas", label: "Ventas", icon: Handshake },
  { href: "/seller/reviews", label: "Reviews", icon: Star },
  { href: "/seller/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/seller/verificacion", label: "Verificación", icon: ShieldCheck },
  { href: "/seller/cupones", label: "Cupones", icon: Tag },
] as const;

export function SellerSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5 hidden md:flex">
      {NAV_ITEMS.map((item) => {
        const { href, label, icon: Icon } = item;
        const exact = "exact" in item ? item.exact : false;
        const isActive = exact
          ? pathname === href
          : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
              isActive
                ? "bg-terracotta-50 dark:bg-terracotta/10 text-terracotta font-semibold"
                : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-terracotta rounded-r-md" />
            )}
            <div className="flex items-center gap-3">
              <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive && "fill-terracotta/10")} />
              {label}
            </div>
            {isActive && (
              <ChevronRight className="h-4 w-4 opacity-50" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

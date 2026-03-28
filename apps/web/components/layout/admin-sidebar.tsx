"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, AlertTriangle, Flag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/verifications", label: "Verificaciones", icon: ShieldCheck },
  { href: "/admin/disputes", label: "Disputas", icon: AlertTriangle },
  { href: "/admin/moderation", label: "Moderación", icon: Flag },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5 hidden md:flex">
      {NAV_ITEMS.map((item) => {
        const { href, label, icon: Icon } = item;
        const exact = "exact" in item ? item.exact : false;
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
              isActive
                ? "bg-terracotta/10 text-terracotta font-semibold"
                : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-terracotta rounded-r-md" />
            )}
            <div className="flex items-center gap-3">
              <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive && "fill-terracotta/20")} />
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

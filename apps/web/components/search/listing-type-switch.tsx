"use client";

import { ShoppingCart, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export type ListingType = "producto" | "servicio";

interface ListingTypeSwitchProps {
  value?: ListingType | null;
  onChange: (type: ListingType | null) => void;
  className?: string;
}

export function ListingTypeSwitch({
  value,
  onChange,
  className,
}: ListingTypeSwitchProps) {
  function toggle(type: ListingType) {
    onChange(value === type ? null : type);
  }

  return (
    <div
      role="tablist"
      aria-label="Filtrar por tipo de publicación"
      className={cn("flex bg-muted rounded-full p-1 w-full", className)}
    >
      <button
        role="tab"
        aria-selected={value === "producto"}
        onClick={() => toggle("producto")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm transition-all",
          value === "producto"
            ? "bg-primary text-primary-foreground shadow-sm font-medium"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ShoppingCart className="h-4 w-4" />
        <span>Productos</span>
      </button>
      <button
        role="tab"
        aria-selected={value === "servicio"}
        onClick={() => toggle("servicio")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm transition-all",
          value === "servicio"
            ? "bg-primary text-primary-foreground shadow-sm font-medium"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Briefcase className="h-4 w-4" />
        <span>Servicios</span>
      </button>
    </div>
  );
}

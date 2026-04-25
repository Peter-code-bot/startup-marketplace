"use client";

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
      className={cn(
        "inline-flex bg-card border border-border rounded-full p-1",
        className
      )}
    >
      <button
        role="tab"
        aria-selected={value === "producto"}
        onClick={() => toggle("producto")}
        className={cn(
          "px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all",
          value === "producto"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Productos
      </button>
      <button
        role="tab"
        aria-selected={value === "servicio"}
        onClick={() => toggle("servicio")}
        className={cn(
          "px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all",
          value === "servicio"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Servicios
      </button>
    </div>
  );
}

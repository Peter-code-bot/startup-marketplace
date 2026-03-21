"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPrice, formatDate } from "@vicino/shared";

interface SaleItem {
  id: string;
  precio_acordado: number;
  cantidad: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  buyer_id: string;
  seller_id: string;
  products_services: { id: string; titulo: string; imagen_principal: string | null } | { id: string; titulo: string; imagen_principal: string | null }[] | null;
  buyer?: { nombre: string } | { nombre: string }[] | null;
  seller?: { nombre: string } | { nombre: string }[] | null;
}

interface HistorialTabsProps {
  ventas: SaleItem[];
  compras: SaleItem[];
  reviewedSales: Set<string>;
  currentUserId: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_confirmation: { label: "Pendiente", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
  completed: { label: "Completada", color: "text-green-600 bg-green-50 dark:bg-green-950/50" },
  cancelled: { label: "Cancelada", color: "text-red-600 bg-red-50 dark:bg-red-950/50" },
  expired: { label: "Expirada", color: "text-gray-500 bg-gray-50 dark:bg-gray-950/50" },
};

export function HistorialTabs({
  ventas,
  compras,
  reviewedSales,
  currentUserId,
}: HistorialTabsProps) {
  const [tab, setTab] = useState<"ventas" | "compras">("ventas");
  const items = tab === "ventas" ? ventas : compras;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab("ventas")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "ventas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Mis ventas ({ventas.length})
        </button>
        <button
          onClick={() => setTab("compras")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "compras"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Mis compras ({compras.length})
        </button>
      </div>

      {/* Items */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const product = Array.isArray(item.products_services)
              ? item.products_services[0]
              : item.products_services;
            const otherUser = tab === "ventas"
              ? (Array.isArray(item.buyer) ? item.buyer[0] : item.buyer)
              : (Array.isArray(item.seller) ? item.seller[0] : item.seller);

            const reviewType = tab === "ventas" ? "seller_to_buyer" : "buyer_to_seller";
            const hasReviewed = reviewedSales.has(`${item.id}-${reviewType}`);
            const canReview = item.status === "completed" && !hasReviewed;
            const status = STATUS_LABELS[item.status] ?? { label: item.status, color: "" };

            return (
              <div key={item.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate">
                    {product?.titulo ?? "Producto"}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {tab === "ventas" ? "Comprador" : "Vendedor"}:{" "}
                    {otherUser?.nombre ?? "Usuario"}
                  </span>
                  <span>{formatDate(item.created_at)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    {formatPrice(item.precio_acordado)}
                    {item.cantidad > 1 && ` x${item.cantidad}`}
                  </span>

                  {canReview && (
                    <Link
                      href={`/historial/review?sale=${item.id}&type=${reviewType}&product=${product?.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Dejar reseña →
                    </Link>
                  )}

                  {hasReviewed && (
                    <span className="text-xs text-green-600">✓ Reseña dejada</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 space-y-2">
          <p className="text-4xl">{tab === "ventas" ? "📦" : "🛍️"}</p>
          <p className="font-medium">
            {tab === "ventas" ? "Sin ventas aún" : "Sin compras aún"}
          </p>
        </div>
      )}
    </div>
  );
}

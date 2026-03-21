"use client";

import { useState } from "react";
import { toggleCoupon, deleteCoupon } from "./actions";

interface CouponActionsProps {
  id: string;
  activo: boolean;
}

export function CouponActions({ id, activo }: CouponActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await toggleCoupon(id, !activo);
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este cupón?")) return;
    setLoading(true);
    await deleteCoupon(id);
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {activo ? "Desactivar" : "Activar"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}

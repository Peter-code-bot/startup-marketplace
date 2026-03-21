"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleProductStatus, deleteProduct } from "@/app/(marketplace)/vender/actions";

interface ListingActionsProps {
  id: string;
  estatus: string;
}

export function ListingActions({ id, estatus }: ListingActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    const newStatus = estatus === "disponible" ? "pausado" : "disponible";
    await toggleProductStatus(id, newStatus);
    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este listing?")) return;
    setLoading(true);
    await deleteProduct(id);
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {estatus === "disponible" ? "Pausar" : "Activar"}
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

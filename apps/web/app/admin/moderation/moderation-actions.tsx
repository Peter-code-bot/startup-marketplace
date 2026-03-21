"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hideReview, approveReview } from "./actions";

export function ModerationActions({ id, visible }: { id: string; visible: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleHide() {
    setLoading(true);
    await hideReview(id);
    router.refresh();
    setLoading(false);
  }

  async function handleApprove() {
    setLoading(true);
    await approveReview(id);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      {visible ? (
        <button
          onClick={handleHide}
          disabled={loading}
          className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
        >
          Ocultar review
        </button>
      ) : (
        <button
          onClick={handleApprove}
          disabled={loading}
          className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
        >
          Restaurar
        </button>
      )}
      <button
        onClick={handleApprove}
        disabled={loading}
        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        Quitar reporte
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { respondToReview } from "./actions";

export function RespondForm({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-primary hover:underline"
      >
        Responder
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!respuesta.trim()) return;
    setLoading(true);
    await respondToReview(reviewId, respuesta.trim());
    router.refresh();
    setLoading(false);
    setOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        placeholder="Tu respuesta..."
        maxLength={1000}
        className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={loading || !respuesta.trim()}
        className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
      >
        {loading ? "..." : "Enviar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-muted-foreground"
      >
        Cancelar
      </button>
    </form>
  );
}

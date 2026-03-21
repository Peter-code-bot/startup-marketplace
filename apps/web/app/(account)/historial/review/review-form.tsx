"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  saleConfirmationId: string;
  productId: string;
  reviewedId: string;
  reviewType: "buyer_to_seller" | "seller_to_buyer";
}

export function ReviewForm({
  saleConfirmationId,
  productId,
  reviewedId,
  reviewType,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Selecciona una calificación");
      return;
    }

    setError("");
    setLoading(true);

    const { error: insertError } = await supabase.from("reviews").insert({
      sale_confirmation_id: saleConfirmationId,
      product_id: productId,
      reviewer_id: (await supabase.auth.getUser()).data.user?.id,
      reviewed_id: reviewedId,
      review_type: reviewType,
      rating,
      comentario: comentario.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/historial");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Star rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Calificación</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  star <= (hoveredRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted hover:text-amber-300"
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-muted-foreground">
            {rating === 5 && "Excelente"}
            {rating === 4 && "Muy bueno"}
            {rating === 3 && "Bueno"}
            {rating === 2 && "Regular"}
            {rating === 1 && "Malo"}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label htmlFor="comentario" className="text-sm font-medium">
          Comentario{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Comparte tu experiencia..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar reseña"}
      </button>
    </form>
  );
}

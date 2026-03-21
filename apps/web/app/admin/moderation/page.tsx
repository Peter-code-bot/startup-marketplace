import { createClient } from "@/lib/supabase/server";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatDate } from "@vicino/shared";
import { ModerationActions } from "./moderation-actions";

export const metadata = { title: "Admin — Moderación" };

export default async function ModerationPage() {
  const supabase = await createClient();

  const { data: reportedReviews } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comentario, motivo_reporte, visible, created_at,
      reviewer:profiles!reviewer_id(nombre),
      reviewed:profiles!reviewed_id(nombre)
    `
    )
    .eq("reportada", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Moderación</h1>

      <h2 className="text-sm font-medium text-muted-foreground">Reviews reportadas</h2>

      {reportedReviews && reportedReviews.length > 0 ? (
        <div className="space-y-3">
          {reportedReviews.map((r) => {
            const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
            const reviewed = Array.isArray(r.reviewed) ? r.reviewed[0] : r.reviewed;
            return (
              <div key={r.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {reviewer?.nombre ?? "?"} → {reviewed?.nombre ?? "?"}
                    </span>
                    <RatingStars rating={r.rating} size="sm" />
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                </div>
                {r.comentario && <p className="text-sm">{r.comentario}</p>}
                {r.motivo_reporte && (
                  <p className="text-xs text-red-600">Motivo: {r.motivo_reporte}</p>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${r.visible ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
                  >
                    {r.visible ? "Visible" : "Oculta"}
                  </span>
                  <ModerationActions id={r.id} visible={r.visible} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 space-y-2">
          <p className="text-4xl">✅</p>
          <p className="font-medium">Sin contenido reportado</p>
        </div>
      )}
    </div>
  );
}

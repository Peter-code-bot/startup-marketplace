"use server";

import { createClient } from "@/lib/supabase/server";

export async function respondToReview(reviewId: string, respuesta: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("reviews")
    .update({
      respuesta,
      respuesta_fecha: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("reviewed_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

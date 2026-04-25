"use server";

import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  return isAdmin ? user : null;
}

export async function hideReview(reviewId: string) {
  if (!(await requireAdmin())) return { error: "No autorizado" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ visible: false })
    .eq("id", reviewId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function approveReview(reviewId: string) {
  if (!(await requireAdmin())) return { error: "No autorizado" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ reportada: false, visible: true })
    .eq("id", reviewId);
  if (error) return { error: error.message };
  return { success: true };
}

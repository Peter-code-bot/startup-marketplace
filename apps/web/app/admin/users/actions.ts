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

export async function assignRole(userId: string, role: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const supabase = await createClient();
  const { error } = await supabase.from("user_roles").insert({
    user_id: userId,
    role,
  });
  if (error && error.code !== "23505") return { error: error.message };
  return { success: true };
}

export async function removeRole(userId: string, role: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  if (error) return { error: error.message };
  return { success: true };
}

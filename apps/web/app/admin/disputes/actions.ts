"use server";

import { createClient } from "@/lib/supabase/server";

export async function resolveDispute(disputeId: string, resolution: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("disputes")
    .update({
      status: resolution,
      resolucion: resolution,
      admin_id: user?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", disputeId);

  if (error) return { error: error.message };
  return { success: true };
}

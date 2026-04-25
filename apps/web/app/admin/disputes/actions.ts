"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  resolution: z.enum(["resolved_buyer", "resolved_seller", "resolved_partial", "dismissed"]),
});

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

export async function resolveDispute(disputeId: string, resolution: string) {
  const parsed = resolveDisputeSchema.safeParse({ disputeId, resolution });
  if (!parsed.success) return { error: "Datos inválidos" };

  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("disputes")
    .update({
      status: resolution,
      resolucion: resolution,
      admin_id: admin.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.disputeId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "resolve_dispute",
    target_type: "dispute",
    target_id: parsed.data.disputeId,
    metadata: { resolution },
  });

  return { success: true };
}

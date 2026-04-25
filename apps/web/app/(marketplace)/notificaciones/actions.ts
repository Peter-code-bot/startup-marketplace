"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

export async function markAsRead(notificationId: string) {
  if (!uuidSchema.safeParse(notificationId).success) return { error: "ID inválido" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  await supabase
    .from("notifications")
    .update({ leida: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/notificaciones");
  return { success: true };
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  await supabase
    .from("notifications")
    .update({ leida: true })
    .eq("user_id", user.id)
    .eq("leida", false);

  revalidatePath("/notificaciones");
  return { success: true };
}

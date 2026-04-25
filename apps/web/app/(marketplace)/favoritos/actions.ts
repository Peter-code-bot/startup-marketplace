"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

export async function toggleFavorite(productId: string) {
  if (!uuidSchema.safeParse(productId).success) return { error: "ID inválido" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("producto_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("favorites")
      .insert({ usuario_id: user.id, producto_id: productId });
  }

  revalidatePath("/favoritos");
  return { isFavorite: !existing };
}

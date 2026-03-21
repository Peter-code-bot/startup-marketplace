"use server";

import { createClient } from "@/lib/supabase/server";

export async function approveVerification(verificationId: string, userId: string) {
  const supabase = await createClient();

  // Update seller_verification
  const { error: verError } = await supabase
    .from("seller_verification")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", verificationId);

  if (verError) return { error: verError.message };

  // Update profile verification status + trust points for INE verification
  await supabase
    .from("profiles")
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      trust_points: 30, // Will be added via trigger if we had one, manually set for now
    })
    .eq("id", userId);

  // Upsert trust_level_verification
  const { data: existing } = await supabase
    .from("trust_level_verification")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("trust_level_verification")
      .update({
        id_verified: true,
        selfie_verified: true,
        selfie_match_verified: true,
        current_level: "verificado",
        level_1_completed_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } else {
    await supabase.from("trust_level_verification").insert({
      user_id: userId,
      id_verified: true,
      selfie_verified: true,
      selfie_match_verified: true,
      current_level: "verificado",
      level_1_completed_at: new Date().toISOString(),
    });
  }

  return { success: true };
}

export async function rejectVerification(verificationId: string, note: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("seller_verification")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewer_note: note || null,
    })
    .eq("id", verificationId);

  if (error) return { error: error.message };
  return { success: true };
}

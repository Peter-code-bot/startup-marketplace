"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getOrCreateChat(sellerId: string, productId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: chatId, error } = await supabase.rpc("get_or_create_chat", {
    p_comprador_id: user.id,
    p_vendedor_id: sellerId,
    p_producto_id: productId ?? null,
  });

  if (error) return { error: error.message };
  return { chatId: chatId as string };
}

export async function sendMessage(chatId: string, texto: string) {
  if (!texto || typeof texto !== "string") return { error: "Mensaje inválido" };
  // Strip HTML tags without entity-encoding: chat renders as plain text so React handles XSS
  const safeTexto = texto.trim().replace(/<[^>]*>/g, "");
  if (!safeTexto || safeTexto.length > 2000) return { error: "Mensaje inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    autor_id: user.id,
    texto: safeTexto,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function markAsRead(chatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.rpc("mark_messages_as_read", {
    p_chat_id: chatId,
    p_user_id: user.id,
  });
}

export async function createSaleConfirmation(data: {
  productId: string;
  buyerId: string;
  sellerId: string;
  chatId: string;
  precioAcordado: number;
  cantidad: number;
  metodoPago?: string;
  notas?: string;
  tipoEntrega: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // Prevent duplicate active confirmations
  const { data: existing } = await supabase
    .from("sale_confirmations")
    .select("id")
    .eq("chat_id", data.chatId)
    .eq("status", "pending_confirmation")
    .maybeSingle();

  if (existing) return { error: "Ya hay una confirmación en curso para este chat." };

  const { data: confirmation, error } = await supabase
    .from("sale_confirmations")
    .insert({
      product_id: data.productId,
      buyer_id: data.buyerId,
      seller_id: data.sellerId,
      chat_id: data.chatId,
      precio_acordado: data.precioAcordado,
      cantidad: data.cantidad,
      metodo_pago: data.metodoPago ?? null,
      notas: data.notas ?? null,
      tipo_entrega: data.tipoEntrega,
      initiated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Ya hay una confirmación en curso." };
    return { error: error.message };
  }

  // Send auto-message in chat
  const initiatorIsbuyer = user.id === data.buyerId;
  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", user.id)
    .single();

  const { data: product } = await supabase
    .from("products_services")
    .select("titulo")
    .eq("id", data.productId)
    .single();

  await supabase.from("messages").insert({
    chat_id: data.chatId,
    autor_id: user.id,
    texto: `🤝 ${profile?.nombre ?? "Alguien"} ha iniciado una confirmación de venta por "${product?.titulo}" — $${data.precioAcordado} MXN. Confirma para completar la venta.`,
  });

  return { confirmation };
}

export async function confirmSale(saleConfirmationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // Get the confirmation to determine which field to update
  const { data: sc } = await supabase
    .from("sale_confirmations")
    .select("buyer_id, seller_id, chat_id, product_id, precio_acordado")
    .eq("id", saleConfirmationId)
    .single();

  if (!sc) return { error: "Confirmación no encontrada" };

  const isBuyer = user.id === sc.buyer_id;
  const updates = isBuyer
    ? { buyer_confirmed: true, buyer_confirmed_at: new Date().toISOString() }
    : { seller_confirmed: true, seller_confirmed_at: new Date().toISOString() };

  const { error } = await supabase
    .from("sale_confirmations")
    .update(updates)
    .eq("id", saleConfirmationId)
    .eq("status", "pending_confirmation");

  if (error) return { error: error.message };

  // Check if both confirmed now
  const { data: updated } = await supabase
    .from("sale_confirmations")
    .select("status")
    .eq("id", saleConfirmationId)
    .single();

  if (updated?.status === "completed" && sc.chat_id) {
    const { data: product } = await supabase
      .from("products_services")
      .select("titulo")
      .eq("id", sc.product_id)
      .single();

    await supabase.from("messages").insert({
      chat_id: sc.chat_id,
      autor_id: user.id,
      texto: `✅ ¡Venta confirmada en VICINO! "${product?.titulo}" — $${sc.precio_acordado} MXN. ¡Gracias a ambos! Deja tu reseña 👇`,
    });
  }

  return { success: true };
}

export async function cancelSale(saleConfirmationId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("sale_confirmations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancel_reason: reason ?? null,
    })
    .eq("id", saleConfirmationId)
    .eq("status", "pending_confirmation");

  if (error) return { error: error.message };
  return { success: true };
}

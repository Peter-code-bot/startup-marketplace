import { z } from "zod";

export const createSaleConfirmationSchema = z.object({
  product_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  chat_id: z.string().uuid().optional(),
  precio_acordado: z.number().positive("El precio debe ser mayor a 0"),
  cantidad: z.number().int().positive().default(1),
  metodo_pago: z.string().max(200).optional(),
  notas: z.string().max(1000).optional(),
  tipo_entrega: z.enum(["pickup", "envio"]).default("pickup"),
});

export const confirmSaleSchema = z.object({
  sale_confirmation_id: z.string().uuid(),
});

export const cancelSaleSchema = z.object({
  sale_confirmation_id: z.string().uuid(),
  cancel_reason: z.string().max(500).optional(),
});

export type CreateSaleConfirmationInput = z.infer<typeof createSaleConfirmationSchema>;
export type ConfirmSaleInput = z.infer<typeof confirmSaleSchema>;
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;

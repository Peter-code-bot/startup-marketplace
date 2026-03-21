import { z } from "zod";

export const updateProfileSchema = z.object({
  nombre: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  ubicacion: z.string().max(200).optional(),
});

export const sellerOnboardingSchema = z.object({
  nombre_negocio: z.string().min(2, "Mínimo 2 caracteres").max(100),
  descripcion_negocio: z.string().min(10).max(1000),
  categoria_negocio: z.string().min(1, "Selecciona una categoría"),
  telefono: z.string().min(10, "Teléfono inválido").max(15),
  metodos_pago_aceptados: z.string().min(1, "Indica cómo aceptas pagos").max(500),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SellerOnboardingInput = z.infer<typeof sellerOnboardingSchema>;

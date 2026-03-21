import { z } from "zod";

export const createCouponSchema = z.object({
  codigo: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  tipo_descuento: z.enum(["porcentaje", "monto_fijo"]),
  valor: z.number().positive("El valor debe ser mayor a 0"),
  fecha_expiracion: z.string().optional(),
  usos_maximos: z.number().int().positive().optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

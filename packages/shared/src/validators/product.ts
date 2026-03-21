import { z } from "zod";

export const createProductSchema = z.object({
  titulo: z.string().min(3, "Mínimo 3 caracteres").max(120),
  descripcion: z.string().min(10, "Mínimo 10 caracteres").max(5000),
  precio: z.number().positive("El precio debe ser mayor a 0").max(999999),
  tipo: z.enum(["producto", "servicio"]),
  categoria: z.string().min(1, "Selecciona una categoría"),
  ubicacion: z.string().optional(),
  tipo_entrega: z.enum(["pickup", "envio", "ambos"]).default("pickup"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

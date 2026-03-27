"use client";

import { useState } from "react";
import { CATEGORIES } from "@vicino/shared";
import { createProduct } from "./actions";

export function ProductForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await createProduct(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tipo */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo</label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="producto"
              defaultChecked
              className="accent-primary"
            />
            <span className="text-sm">Producto</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="servicio"
              className="accent-primary"
            />
            <span className="text-sm">Servicio</span>
          </label>
        </div>
      </div>

      {/* Titulo */}
      <div className="space-y-2">
        <label htmlFor="titulo" className="text-sm font-medium">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          minLength={3}
          maxLength={120}
          placeholder="¿Qué vendes?"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Descripcion */}
      <div className="space-y-2">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          placeholder="Describe tu producto o servicio en detalle..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      </div>

      {/* Precio */}
      <div className="space-y-2">
        <label htmlFor="precio" className="text-sm font-medium">
          Precio (MXN)
        </label>
        <input
          id="precio"
          name="precio"
          type="number"
          required
          min={1}
          max={999999}
          step="0.01"
          placeholder="0.00"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <label htmlFor="categoria" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecciona una categoría</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ubicacion */}
      <div className="space-y-2">
        <label htmlFor="ubicacion" className="text-sm font-medium">
          Ubicación{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          id="ubicacion"
          name="ubicacion"
          type="text"
          placeholder="Ej: Puebla, Puebla"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Tipo de entrega */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de entrega</label>
        <select
          name="tipo_entrega"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="pickup">Recoger en punto</option>
          <option value="envio">Envío</option>
          <option value="ambos">Ambos</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Publicando..." : "Publicar"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "./actions";

interface ProfileFormProps {
  profile: {
    nombre: string;
    email: string;
    foto: string | null;
    bio: string | null;
    ubicacion: string | null;
    es_vendedor: boolean;
    nombre_negocio: string | null;
    descripcion_negocio: string | null;
    metodos_pago_aceptados: string | null;
    trust_level: string;
    user_id: string | null;
  } | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [esVendedor, setEsVendedor] = useState(profile?.es_vendedor ?? false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    setLoading(true);

    const result = await updateProfile(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-600 dark:text-green-400">
          Perfil actualizado
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {profile?.email} · ID: {profile?.user_id ?? "—"}
      </div>

      <div className="space-y-2">
        <label htmlFor="nombre" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={profile?.nombre ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="foto" className="text-sm font-medium">
          URL de foto de perfil{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          id="foto"
          name="foto"
          type="url"
          defaultValue={profile?.foto ?? ""}
          placeholder="https://..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile?.bio ?? ""}
          placeholder="Cuéntanos sobre ti..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="ubicacion" className="text-sm font-medium">
          Ubicación{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          id="ubicacion"
          name="ubicacion"
          type="text"
          defaultValue={profile?.ubicacion ?? ""}
          placeholder="Ej: Puebla, Puebla"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Seller toggle */}
      <div className="rounded-lg border p-4 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="es_vendedor"
            checked={esVendedor}
            onChange={(e) => setEsVendedor(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <div>
            <span className="text-sm font-medium">Activar modo vendedor</span>
            <p className="text-xs text-muted-foreground">
              Publica productos y servicios en VICINO
            </p>
          </div>
        </label>

        {esVendedor && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <label htmlFor="nombre_negocio" className="text-sm font-medium">
                Nombre del negocio
              </label>
              <input
                id="nombre_negocio"
                name="nombre_negocio"
                type="text"
                defaultValue={profile?.nombre_negocio ?? ""}
                placeholder="Mi Tienda"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="descripcion_negocio" className="text-sm font-medium">
                Descripción del negocio{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                id="descripcion_negocio"
                name="descripcion_negocio"
                rows={2}
                defaultValue={profile?.descripcion_negocio ?? ""}
                placeholder="¿Qué vendes?"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-y"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="metodos_pago_aceptados" className="text-sm font-medium">
                Métodos de pago aceptados
              </label>
              <input
                id="metodos_pago_aceptados"
                name="metodos_pago_aceptados"
                type="text"
                defaultValue={profile?.metodos_pago_aceptados ?? ""}
                placeholder="Efectivo, transferencia, MercadoPago..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Link
              href="/seller/verificacion"
              className="inline-flex text-xs text-primary hover:underline"
            >
              Verificar identidad para subir de nivel →
            </Link>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useLogout } from "@/hooks/use-logout";
import { LogOut } from "lucide-react";

export function LogoutSection() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const logout = useLogout();

  async function handleConfirm() {
    setLoading(true);
    await logout();
  }

  if (confirming) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 p-4 bg-red-50/50 dark:bg-red-950/10">
        <p className="text-sm font-medium text-foreground mb-1">¿Cerrar sesión?</p>
        <p className="text-xs text-muted-foreground mb-4">
          Tendrás que volver a iniciar sesión la próxima vez.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            aria-label="Confirmar cierre de sesión"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {loading ? "Cerrando..." : "Sí, cerrar sesión"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Cerrar sesión"
      className="flex items-center gap-3 w-full rounded-xl border border-red-200 dark:border-red-800 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cancelAppointment } from "@/app/(marketplace)/citas/[id]/actions";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelAppointment(appointmentId);
      if (!result.ok) {
        toast.error(result.message ?? "No se pudo cancelar la cita");
        return;
      }
      toast.success("Cita cancelada");
      setShowConfirm(false);
      router.refresh();
    });
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 bg-card border border-destructive/40 text-destructive font-semibold hover:bg-destructive/10 transition-colors"
      >
        <X size={18} />
        Cancelar cita
      </button>
    );
  }

  return (
    <div className="bg-destructive/5 border border-destructive/30 rounded-2xl p-4 space-y-3">
      <p className="text-sm text-foreground font-medium">¿Seguro que quieres cancelar?</p>
      <p className="text-xs text-muted-foreground">Esta acción no se puede deshacer.</p>
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="flex-1 rounded-full py-2.5 bg-background border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          No, mantener
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="flex-1 rounded-full py-2.5 bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Cancelando..." : "Sí, cancelar"}
        </button>
      </div>
    </div>
  );
}

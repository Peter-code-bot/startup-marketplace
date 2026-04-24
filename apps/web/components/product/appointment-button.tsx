"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { AppointmentScheduler } from "./appointment-scheduler";

interface AppointmentButtonProps {
  product: {
    id: string;
    titulo: string;
    creador_id: string;
    appointment_start_time: string;
    appointment_end_time: string;
    appointment_duration_minutes: number;
  };
}

export function AppointmentButton({ product }: AppointmentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl bg-gold/10 border border-gold/30 px-6 py-3 text-sm font-semibold text-gold hover:bg-gold/20 active:scale-95 transition-all duration-200"
      >
        <Calendar className="h-4 w-4" />
        Agendar cita
      </button>
      <AppointmentScheduler product={product} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

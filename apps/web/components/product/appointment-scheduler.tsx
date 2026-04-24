"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Clock, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentSchedulerProps {
  product: {
    id: string;
    titulo: string;
    creador_id: string;
    appointment_start_time: string;
    appointment_end_time: string;
    appointment_duration_minutes: number;
  };
  open: boolean;
  onClose: () => void;
}

export function AppointmentScheduler({ product, open, onClose }: AppointmentSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [month, setMonth] = useState(new Date());
  const supabase = createClient();

  // Generate time slots
  function getSlots() {
    const slots: string[] = [];
    const [sh, sm] = (product.appointment_start_time ?? "09:00").split(":").map(Number);
    const [eh, em] = (product.appointment_end_time ?? "18:00").split(":").map(Number);
    const dur = product.appointment_duration_minutes ?? 60;
    let cur = (sh ?? 9) * 60 + (sm ?? 0);
    const end = (eh ?? 18) * 60 + (em ?? 0);
    while (cur + dur <= end) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      cur += dur;
    }
    return slots;
  }

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    supabase
      .from("appointments")
      .select("appointment_start")
      .eq("product_id", product.id)
      .eq("appointment_date", selectedDate)
      .eq("status", "confirmed")
      .then(({ data }) => {
        setBookedSlots(data?.map((a) => a.appointment_start.slice(0, 5)) ?? []);
      });
  }, [selectedDate, product.id]);

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    const [h, m] = selectedSlot.split(":").map(Number);
    const endMin = (h ?? 0) * 60 + (m ?? 0) + (product.appointment_duration_minutes ?? 60);
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

    const { error } = await supabase.from("appointments").insert({
      product_id: product.id,
      buyer_id: user.id,
      seller_id: product.creador_id,
      appointment_date: selectedDate,
      appointment_start: selectedSlot,
      appointment_end: endTime,
      notes: notes.trim() || null,
    });

    setLoading(false);
    if (error) return;
    setSuccess(true);
    setTimeout(onClose, 2000);
  }

  // Calendar helpers
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const today = new Date().toISOString().split("T")[0];

  const slots = getSlots();
  const morning = slots.filter((s) => parseInt(s) < 12);
  const afternoon = slots.filter((s) => parseInt(s) >= 12 && parseInt(s) < 18);
  const evening = slots.filter((s) => parseInt(s) >= 18);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border/40 px-4 py-3 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg">Agendar cita</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <span className="text-4xl">✅</span>
            <h3 className="font-heading font-bold text-lg">¡Cita agendada!</h3>
            <p className="text-sm text-muted-foreground">{selectedDate} a las {selectedSlot}</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">{product.titulo}</p>

            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
                  className="p-1 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-medium capitalize">
                  {month.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
                  className="p-1 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => <span key={d}>{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isPast = dateStr < (today ?? "");
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button key={day} disabled={isPast}
                      onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                      className={cn("w-full aspect-square rounded-lg text-sm font-medium transition-colors",
                        isPast && "text-muted-foreground/30 cursor-not-allowed",
                        isSelected ? "bg-bone text-bone-contrast" : !isPast && "hover:bg-muted"
                      )}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="space-y-3">
                {[{ label: "Mañana", slots: morning }, { label: "Tarde", slots: afternoon }, { label: "Noche", slots: evening }]
                  .filter((g) => g.slots.length > 0)
                  .map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.slots.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = slot === selectedSlot;
                          return (
                            <button key={slot} disabled={isBooked}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                isBooked && "bg-red-500/10 text-red-400 line-through cursor-not-allowed",
                                isSelected ? "bg-bone text-bone-contrast" : !isBooked && "bg-muted hover:bg-accent"
                              )}>
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Notes + confirm */}
            {selectedSlot && (
              <div className="space-y-3 pt-2">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales (opcional)"
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-bone"
                />
                <button onClick={handleConfirm} disabled={loading}
                  className="w-full py-3 rounded-xl bg-bone text-bone-contrast font-semibold hover:bg-bone-dark disabled:opacity-50 transition-colors">
                  {loading ? "Agendando..." : `Confirmar ${selectedDate} a las ${selectedSlot}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

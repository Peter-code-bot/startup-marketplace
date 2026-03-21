"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveVerification, rejectVerification } from "./actions";

export function VerificationActions({ id, userId }: { id: string; userId: string }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    setLoading(true);
    await approveVerification(id, userId);
    router.refresh();
    setLoading(false);
  }

  async function handleReject() {
    setLoading(true);
    await rejectVerification(id, note);
    router.refresh();
    setLoading(false);
    setShowReject(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="rounded-md bg-green-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50"
        >
          Aprobar
        </button>
        <button
          onClick={() => setShowReject(!showReject)}
          disabled={loading}
          className="rounded-md border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
        >
          Rechazar
        </button>
      </div>
      {showReject && (
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Motivo del rechazo..."
            className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
          />
          <button
            onClick={handleReject}
            disabled={loading}
            className="rounded-md bg-red-600 text-white px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Confirmar rechazo
          </button>
        </div>
      )}
    </div>
  );
}

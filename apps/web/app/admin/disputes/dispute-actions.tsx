"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveDispute } from "./actions";

export function DisputeActions({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handle(resolution: string) {
    setLoading(true);
    await resolveDispute(id, resolution);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle("resolved_buyer")}
        disabled={loading}
        className="rounded-md bg-green-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50"
      >
        A favor del comprador
      </button>
      <button
        onClick={() => handle("resolved_seller")}
        disabled={loading}
        className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        A favor del vendedor
      </button>
      <button
        onClick={() => handle("closed")}
        disabled={loading}
        className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
      >
        Cerrar sin acción
      </button>
    </div>
  );
}

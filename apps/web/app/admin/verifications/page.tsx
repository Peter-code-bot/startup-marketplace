import { createClient } from "@/lib/supabase/server";
import { VerificationActions } from "./verification-actions";

export const metadata = { title: "Admin — Verificaciones" };

export default async function VerificationsPage() {
  const supabase = await createClient();

  const { data: verifications } = await supabase
    .from("seller_verification")
    .select("*, profiles!user_id(nombre, email, trust_level)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Verificaciones pendientes</h1>

      {verifications && verifications.length > 0 ? (
        <div className="space-y-4">
          {verifications.map((v) => {
            const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
            return (
              <div key={v.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{profile?.nombre ?? "Usuario"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-600 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                    Pendiente
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {v.selfie_url && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Selfie</p>
                      <a href={v.selfie_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        Ver imagen →
                      </a>
                    </div>
                  )}
                  {v.ine_front_url && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">INE frente</p>
                      <a href={v.ine_front_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        Ver imagen →
                      </a>
                    </div>
                  )}
                  {v.ine_back_url && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">INE reverso</p>
                      <a href={v.ine_back_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        Ver imagen →
                      </a>
                    </div>
                  )}
                </div>

                <VerificationActions id={v.id} userId={v.user_id} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 space-y-2">
          <p className="text-4xl">✅</p>
          <p className="font-medium">Sin verificaciones pendientes</p>
        </div>
      )}
    </div>
  );
}

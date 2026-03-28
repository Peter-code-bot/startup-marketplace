import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { Settings } from "lucide-react";

export const metadata = { title: "Mi perfil — VICINO" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/perfil");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "nombre, email, foto, bio, ubicacion, es_vendedor, nombre_negocio, descripcion_negocio, metodos_pago_aceptados, trust_level, user_id"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Configuración de Perfil</h1>
          <p className="text-sm text-muted-foreground">Administra tu información pública y modo vendedor</p>
        </div>
      </div>
      
      <ProfileForm profile={profile} />
    </div>
  );
}

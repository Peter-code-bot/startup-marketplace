import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Mi perfil" };

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
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Mi perfil</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}

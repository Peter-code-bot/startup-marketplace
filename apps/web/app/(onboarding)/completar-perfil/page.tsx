import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompletarPerfil } from "./completar-perfil";
import type { PasoOnboarding } from "./actions";

const PASOS_VALIDOS: PasoOnboarding[] = ["perfil", "intereses", "ubicacion"];

function pasoSeguro(valor: string | null): PasoOnboarding {
  // Un valor raro no puede dejar la pantalla en blanco: se cae al primer paso.
  // La columna tiene un CHECK que ya lo impide, pero esto se lee del cliente y
  // el CHECK vive en la base — la pantalla no debe depender de eso para pintar.
  return PASOS_VALIDOS.includes(valor as PasoOnboarding)
    ? (valor as PasoOnboarding)
    : "perfil";
}

export default async function CompletarPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, bio, foto, intereses, onboarding_paso, has_seen_onboarding")
    .eq("id", user.id)
    .single();

  // Quien ya termino no vuelve a pasar por aqui. El onboarding nuevo es solo
  // para registros nuevos: a los perfiles que ya existian no se les interrumpe.
  if (profile?.has_seen_onboarding) redirect("/");

  return (
    <CompletarPerfil
      pasoInicial={pasoSeguro(profile?.onboarding_paso ?? null)}
      // El nombre YA viene del registro (signUp lo manda en full_name), asi que
      // este campo arranca lleno y no se le pide dos veces lo mismo.
      nombreInicial={profile?.nombre ?? ""}
      bioInicial={profile?.bio ?? ""}
      fotoInicial={profile?.foto ?? ""}
      interesesIniciales={profile?.intereses ?? []}
    />
  );
}

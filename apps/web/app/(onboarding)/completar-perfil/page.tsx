import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nombre, bio, foto, intereses, onboarding_paso, has_seen_onboarding")
    .eq("id", user.id)
    .single();

  // El error se MIRA, no se ignora. Antes solo se desestructuraba `data`, asi
  // que un fallo de la consulta —una red intermitente, o un 42501 el dia que
  // alguien anada una columna sin GRANT— era indistinguible de un perfil vacio:
  // la pantalla rebobinaba al paso 1 con todos los campos en blanco y, al
  // continuar, el COALESCE del RPC conservaba lo de antes pero la persona
  // reescribia su nombre creyendo que se habia perdido.
  //
  // Se manda a /bienvenida y no se pinta un paso en blanco: alli el guard
  // vuelve a leer el perfil y decide, y si el fallo era transitorio la persona
  // continua donde iba.
  if (error || !profile) {
    Sentry.captureException(error ?? new Error("perfil ausente en /completar-perfil"), {
      tags: { action: "completar_perfil_cargar" },
      contexts: { supabase: { code: error?.code, details: error?.details } },
    });
    redirect("/bienvenida");
  }

  // Quien ya termino no vuelve a pasar por aqui. El onboarding nuevo es solo
  // para registros nuevos: a los perfiles que ya existian no se les interrumpe.
  if (profile.has_seen_onboarding) redirect("/");

  return (
    <CompletarPerfil
      pasoInicial={pasoSeguro(profile.onboarding_paso)}
      // El nombre YA viene del registro (signUp lo manda en full_name), asi que
      // este campo arranca lleno y no se le pide dos veces lo mismo.
      nombreInicial={profile.nombre ?? ""}
      bioInicial={profile.bio ?? ""}
      fotoInicial={profile.foto ?? ""}
      interesesIniciales={profile.intereses ?? []}
    />
  );
}

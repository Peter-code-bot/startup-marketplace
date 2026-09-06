import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { AltaVendedor } from "./alta-vendedor";

export const metadata = { title: "Empieza a vender — VICINO" };

/**
 * Ruta dedicada del alta de vendedor.
 *
 * Antes, las tres entradas que decían «quiero vender» desembocaban en
 * /perfil/editar, la pantalla genérica de editar perfil, donde la casilla que
 * había que marcar estaba por debajo de seis campos. Ese era el item 7 del
 * backlog: una pantalla muda.
 *
 * Quien YA es vendedor no tiene nada que hacer aquí: se le manda a publicar,
 * que es lo que venía a hacer.
 */
export default async function AltaVendedorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/empezar-a-vender");

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("nombre, es_vendedor, alta_vendedor_paso, has_seen_onboarding")
    .eq("id", user.id)
    .single();

  // Se reporta y NO se redirige. Con perfil nulo las ramas de abajo usan
  // `perfil?.`, asi que la pantalla se pinta y el alta sigue siendo posible: la
  // activacion no depende de esta lectura, la hace el RPC contra auth.uid().
  //
  // Antes el error se tragaba, y eso tenia un efecto concreto: un vendedor ya
  // asentado —que deberia salir de aqui por el redirect de abajo— se quedaba
  // viendo el alta entera otra vez, porque `perfil` nulo hace fallar esa
  // comprobacion en silencio.
  if (error) {
    Sentry.captureException(error, {
      tags: { action: "alta_vendedor_cargar_perfil" },
      contexts: { supabase: { code: error.code, details: error.details } },
    });
  }

  // alta_vendedor_paso vale 'publicacion' justo después de activar y se limpia
  // al publicar el primer producto, así que distingue al recién activado
  // —que tiene que ver su bienvenida— del vendedor asentado.
  if (perfil?.es_vendedor && !perfil?.alta_vendedor_paso) {
    redirect("/");
  }

  // Quien YA termino el onboarding no vuelve a pasar por los pasos
  // compartidos: /completar-perfil lo devolveria al home, y la pantalla final
  // del alta acabaria rebotandolo ahi sin el empujon a publicar que le acababa
  // de prometer. Con esto ese caso termina en /vender, como antes.
  return (
    <AltaVendedor
      nombre={perfil?.nombre ?? null}
      yaCompletoOnboarding={perfil?.has_seen_onboarding ?? false}
    />
  );
}

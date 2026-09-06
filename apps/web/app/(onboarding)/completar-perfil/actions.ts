"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";

export type CaminoOnboarding = "explorar" | "vender";
export type PasoOnboarding = "perfil" | "intereses" | "ubicacion";

interface GuardarPasoInput {
  camino?: CaminoOnboarding;
  paso?: PasoOnboarding;
  nombre?: string;
  bio?: string;
  foto?: string;
  intereses?: string[];
}

/**
 * Guarda UN paso del onboarding sin tocar lo que guardaron los anteriores.
 *
 * Va por RPC y no por un update normal porque `authenticated` solo tiene
 * UPDATE sobre (foto, fcm_token) en profiles — los privilegios de esa tabla se
 * dan columna por columna. Nombre, bio e intereses son inalcanzables desde el
 * cliente por cualquier otra via.
 *
 * El COALESCE vive dentro de la funcion (20260905100000): omitir un campo
 * significa «no lo toques», nunca «borralo». Es lo que permite que el paso 3
 * llame sin mandar lo del paso 2.
 */
export async function guardarPasoOnboarding(input: GuardarPasoInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Los topes de longitud se comprueban AQUI y no solo con el maxLength de los
  // inputs. Un `maxLength` es una comodidad del navegador, no una defensa: esta
  // funcion es una server action, o sea un endpoint HTTP, y se puede llamar sin
  // pasar por la pantalla. Sin esto, `bio` es una columna de texto sin limite y
  // cualquiera con sesion puede escribir megabytes en su perfil.
  //
  // El resto de validaciones (camino, paso, 1-5 intereses, que el slug exista)
  // ya viven dentro del RPC, que es el sitio correcto porque no se puede
  // rodear. Estas dos estan aqui porque la funcion no las mira.
  if (input.nombre !== undefined && input.nombre.length > 60) {
    return { error: "Ese nombre es demasiado largo." };
  }
  if (input.bio !== undefined && input.bio.length > 160) {
    return { error: "Esa descripción es demasiado larga." };
  }

  const { error } = await supabase.rpc("guardar_paso_onboarding", {
    p_camino: input.camino,
    p_paso: input.paso,
    p_nombre: input.nombre,
    p_bio: input.bio,
    p_foto: input.foto,
    p_intereses: input.intereses,
  });

  if (error) {
    // El detalle tecnico se queda en el servidor. Postgres nombra la columna o
    // la policy que rechazo en `details`, y perderlo obliga a diagnosticar a
    // ciegas — ya paso con el 42501 de modo_precio.
    Sentry.captureException(error, {
      tags: { action: "guardar_paso_onboarding" },
      contexts: { supabase: { code: error.code, details: error.details } },
    });

    // 22023 son las validaciones de la propia funcion (camino o paso
    // invalidos, mas de 5 intereses, slug inexistente). Ese mensaje SI es para
    // la persona: lo escribimos nosotros y dice algo accionable.
    if (error.code === "22023") return { error: error.message };
    if (error.code === "P0002") {
      return {
        error:
          "Tu perfil aún no está listo. Espera unos segundos e intenta de nuevo; si persiste, contáctanos.",
      };
    }
    return { error: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
  }

  revalidatePath("/completar-perfil");
  return { success: true };
}

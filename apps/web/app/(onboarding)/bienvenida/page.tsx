import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingOptions } from "./onboarding-options";

export default async function BienvenidaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Already-onboarded users have nothing to do here. A missing profile row
  // still renders the page: completeOnboarding surfaces it as a visible error.
  const { data: profile } = await supabase
    .from("profiles")
    .select("has_seen_onboarding, onboarding_camino, onboarding_paso, es_vendedor")
    .eq("id", user.id)
    .single();

  if (profile?.has_seen_onboarding) redirect("/");

  // ESTA PANTALLA ES ADEMAS EL PUNTO DE REANUDACION.
  //
  // El layout del marketplace manda aqui a todo el que tenga
  // has_seen_onboarding en false, y esa bandera ya no se gasta al principio
  // sino al terminar el ultimo paso. O sea que quien abandona a mitad y vuelve
  // a abrir la app aterriza aqui — y volver a ensenarle los dos botones seria
  // pedirle que elija otra vez algo que ya eligio, y perder su avance.
  //
  // El orden importa: primero el paso, que es lo mas avanzado que puede haber.
  if (profile?.onboarding_paso) redirect("/completar-perfil");

  // Ya es vendedor pero sin paso marcado. Es la ventana entre
  // activar_modo_vendedor y guardar_paso_onboarding: si la segunda falla,
  // es_vendedor queda en true y onboarding_paso en null. Sin esta rama esa
  // persona volveria a los dos botones y al tocar «Quiero vender» aterrizaria
  // otra vez en un alta que ya completo.
  //
  // Se mira es_vendedor y NO onboarding_camino. Reenviar por el camino elegido
  // era justo lo que encerraba a quien tocaba «Quiero vender» y se arrepentia:
  // /bienvenida lo devolvia al alta en cada visita y no habia forma de salir.
  // Un camino elegido es una intencion; ser vendedor es un hecho, y solo un
  // hecho deberia poder redirigir en bucle.
  if (profile?.es_vendedor) redirect("/completar-perfil");

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-8">
      <div className="mb-6 flex items-center justify-center">
        <Image 
          src="/vicino-logo-light-v2.png" 
          alt="VICINO Logo" 
          width={120} 
          height={120} 
          className="object-contain show-in-light"
          priority
        />
        <Image 
          src="/vicino-logo-dark.png" 
          alt="VICINO Logo" 
          width={120} 
          height={120} 
          className="object-contain show-in-dark"
          priority
        />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-outfit text-center font-semibold">
        ¡Bienvenido a VICINO!
      </h1>
      <p className="text-base text-muted-foreground text-center mt-3 mb-10">
        Compra y vende cerca de ti
      </p>
      
      <div className="w-full max-w-sm">
        <OnboardingOptions />
      </div>
    </div>
  );
}

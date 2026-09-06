"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { guardarPasoOnboarding } from "@/app/(onboarding)/completar-perfil/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Los dos botones ya NO dan el onboarding por terminado.
 *
 * Antes los dos llamaban a completeOnboarding, que consume una bandera de UN
 * SOLO USO. O sea que quien tocaba «Quiero explorar» entraba a la app sin
 * nombre, sin foto, sin descripcion y sin intereses, y no podia volver a
 * elegir nunca. Ahora solo registran QUE CAMINO se eligio; la bandera se gasta
 * al final del ultimo paso.
 */
export function OnboardingOptions() {
  const [isPending, startTransition] = useTransition();
  // Cual de los dos se toco, para que solo ese muestre el spinner. `isPending`
  // es uno solo para los dos botones: sin esto, tocar uno pone a girar los dos
  // y parece que la app hace dos cosas a la vez.
  const [tocado, setTocado] = useState<"vender" | "explorar" | null>(null);
  const router = useRouter();

  function elegir(camino: "vender" | "explorar") {
    setTocado(camino);
    startTransition(async () => {
      const result = await guardarPasoOnboarding(
        camino === "explorar"
          ? // Explorar entra directo a los pasos compartidos.
            { camino, paso: "perfil" }
          : // Vender NO guarda paso todavia, a proposito: antes de los pasos
            // compartidos le tocan categoria, tipo y —si es negocio— sus datos.
            // Si se guardara «perfil» aqui y la persona cerrara la app en mitad
            // del alta, al volver la mandariamos a los pasos compartidos y se
            // saltaria el alta entera.
            { camino },
      );
      if (result.error) {
        setTocado(null);
        toast.error(result.error);
        return;
      }
      router.push(camino === "explorar" ? "/completar-perfil" : "/empezar-a-vender");
    });
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={() => elegir("vender")}
        loading={isPending && tocado === "vender"}
        disabled={isPending}
        variant="primary"
        size="lg"
        className="w-full py-4 text-lg h-auto font-medium rounded-xl !bg-[#121212] !text-white !shadow-none dark:!bg-[#F4F1EB] dark:!text-[#121212]"
      >
        Quiero vender
      </Button>

      <Button
        onClick={() => elegir("explorar")}
        loading={isPending && tocado === "explorar"}
        disabled={isPending}
        variant="primary"
        size="lg"
        className="w-full py-4 text-lg h-auto font-medium rounded-xl !bg-brand-hi !text-white !shadow-none"
      >
        Quiero explorar
      </Button>
    </div>
  );
}

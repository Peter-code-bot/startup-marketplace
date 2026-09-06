"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { parsePaymentMethods } from "@/lib/payment-methods";

/**
 * Cuantos metodos se ven sin desplegar. SIEMPRE uno, sea cual sea el total.
 *
 * Antes eran tres, con el argumento de que esconder uno o dos cuesta un toque
 * y no ahorra sitio. El argumento medía mal el problema: la fila no es solo
 * para los metodos de pago, y tres chips de ancho variable —«Transferencia
 * bancaria» mide el triple que «Efectivo»— la desbordan y empujan al resto de
 * la informacion del perfil. Uno visible da una altura de fila constante, que
 * no depende de que combinacion de los nueve metodos del selector eligio cada
 * vendedor.
 */
const CHIPS_VISIBLES = 1;

const CLASE_CHIP =
  "rounded-full px-2.5 py-1 text-xs font-semibold product-card-tab shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]";

/**
 * El boton NO reutiliza CLASE_CHIP a proposito. `.product-card-tab` fija
 * `color` fuera de toda capa de CSS, asi que le gana a cualquier utilidad de
 * color de Tailwind: una clase de texto encima seria letra muerta y el boton
 * se pintaria identico a un chip estatico. Con su propia superficie y un
 * chevron se distingue de lo que solo se lee.
 */
const CLASE_BOTON =
  "inline-flex items-center gap-1 rounded-full bg-[color:var(--bg-elev-2)] px-2.5 py-1 text-xs font-semibold text-[color:var(--fg-muted)] transition-opacity hover:opacity-80";

interface MetodosPagoChipsProps {
  metodosPagoAceptados: string | null;
}

/**
 * Pinta los metodos de pago del vendedor como chips sueltos, pensados para
 * vivir dentro de una fila `flex-wrap` ya existente: por eso devuelve un
 * fragmento y no su propio contenedor.
 *
 * Usa parsePaymentMethods en vez de un `split(",")` a pelo porque la columna
 * es TEXT libre: sin el filtro, una cadena vacia o una coma de sobra pintaba
 * un chip en blanco.
 */
export function MetodosPagoChips({ metodosPagoAceptados }: MetodosPagoChipsProps) {
  const [expandido, setExpandido] = useState(false);
  const metodos = parsePaymentMethods(metodosPagoAceptados);

  if (metodos.length === 0) return null;

  const colapsado = metodos.length > CHIPS_VISIBLES && !expandido;
  const visibles = colapsado ? metodos.slice(0, CHIPS_VISIBLES) : metodos;
  const ocultos = metodos.length - visibles.length;

  return (
    <>
      {visibles.map((metodo) => (
        <span key={metodo} className={CLASE_CHIP}>
          {metodo}
        </span>
      ))}

      {metodos.length > CHIPS_VISIBLES && (
        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className={CLASE_BOTON}
          aria-expanded={expandido}
          aria-label={
            colapsado
              ? `Ver ${ocultos} método${ocultos === 1 ? "" : "s"} de pago más`
              : "Ver menos métodos de pago"
          }
        >
          {colapsado ? `+${ocultos}` : "Ver menos"}
          <ChevronDown
            aria-hidden="true"
            className={`h-3 w-3 transition-transform duration-200 ${expandido ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </>
  );
}

// Prueba de la guarda de redireccion del login.
//
//   ./node_modules/.bin/tsx scripts/test-destino-seguro.ts
//
// Existe porque una redireccion abierta no se ve: la pagina carga, el usuario
// llega a otro sitio y nadie se entera salvo quien lo explota. Los casos que
// deben PASAR importan tanto como los que deben bloquearse: una guarda
// demasiado estricta rompe el flujo de venta, que es justo lo que venia a
// arreglar.

import { destinoSeguro } from "../apps/web/lib/auth/destino-seguro.ts";

const B = String.fromCharCode(92);
// Construidos y no escritos, por el mismo motivo que B: un escape mal puesto
// en un literal no da error, solo deja de probar lo que creias probar.
const TAB = String.fromCharCode(9);
const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const NUL = String.fromCharCode(0);

const casos: Array<[string, string | null | undefined, string]> = [
  ["sin parametro", null, "/"],
  ["cadena vacia", "", "/"],
  ["indefinido", undefined, "/"],
  ["ruta interna simple", "/vender", "/vender"],
  ["ruta interna con subruta", "/perfil/editar", "/perfil/editar"],
  ["ruta con query", "/perfil/editar?prompt=seller-mode", "/perfil/editar?prompt=seller-mode"],
  ["dominio absoluto", "https://evil.example", "/"],
  ["protocolo relativo", "//evil.example", "/"],
  ["barra invertida", "/" + B + B + "evil.example", "/"],
  ["barra invertida en medio", "/vender" + B + "x", "/"],
  ["sin barra inicial", "vender", "/"],
  ["javascript:", "javascript:alert(1)", "/"],
  ["data:", "data:text/html,x", "/"],
  // Los navegadores tiran estos caracteres de la URL antes de resolverla, asi
  // que "/<TAB>/evil.example" acaba siendo "//evil.example" — otro dominio.
  // Pasaban las tres guardas originales sin despeinarse.
  ["tabulador antes del host", "/" + TAB + "/evil.example", "/"],
  ["salto de linea antes del host", "/" + LF + "/evil.example", "/"],
  ["retorno de carro antes del host", "/" + CR + "/evil.example", "/"],
  ["tabulador en medio de una ruta buena", "/perfil" + TAB + "/editar", "/"],
  ["nulo", "/vender" + NUL, "/"],
];

let fallos = 0;
for (const [nombre, entrada, esperado] of casos) {
  const real = destinoSeguro(entrada);
  const ok = real === esperado;
  if (!ok) fallos += 1;
  console.log(
    (ok ? "  ok   " : "  FALLA") +
      " " + nombre.padEnd(26) +
      " -> " + JSON.stringify(real) +
      (ok ? "" : "   esperaba " + JSON.stringify(esperado)),
  );
}

console.log("");
console.log(
  fallos === 0
    ? casos.length + "/" + casos.length + " casos pasan."
    : fallos + " caso(s) FALLAN.",
);
process.exit(fallos === 0 ? 0 : 1);

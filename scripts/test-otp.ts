// Pruebas del flujo de codigo de verificacion por correo.
//
//   ./node_modules/.bin/tsx scripts/test-otp.ts
//
// Cubre las dos piezas que no se pueden probar mirando la pantalla: como se
// limpia lo que la gente PEGA en las casillas, y que recuerda el dispositivo
// entre que alguien sale a su app de correo y vuelve.
//
// Lo que se pega es la mitad del caso de uso real. En Android no hay
// autorrelleno de codigos desde el correo, asi que el camino normal es
// seleccionar el codigo en Gmail y pegarlo; y lo que llega en el portapapeles
// casi nunca son seis digitos limpios.

import {
  LARGO_CODIGO,
  normalizarCorreo,
  segundosDeEspera,
  soloDigitos,
} from "../apps/web/lib/auth/otp-formato.ts";
import {
  borrarPendiente,
  guardarPendiente,
  leerPendiente,
  leerPendienteDesde,
  leerPendienteServidor,
  limpiarSiVencio,
  suscribirPendiente,
  VIGENCIA_MS,
} from "../apps/web/lib/auth/verificacion-pendiente.ts";

let fallos = 0;

function comprobar(nombre: string, real: unknown, esperado: unknown): void {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos += 1;
  console.log(
    (ok ? "  ok   " : "  FALLA") +
      " " +
      nombre.padEnd(44) +
      " -> " +
      JSON.stringify(real) +
      (ok ? "" : "   esperaba " + JSON.stringify(esperado)),
  );
}

console.log("\nsoloDigitos — lo que llega en el portapapeles");
comprobar("codigo limpio", soloDigitos("123456"), "123456");
comprobar("con espacios", soloDigitos("123 456"), "123456");
comprobar("con guion", soloDigitos("123-456"), "123456");
comprobar("con salto de linea detras", soloDigitos("123456\n"), "123456");
comprobar("con espacios alrededor", soloDigitos("  123456  "), "123456");
comprobar("frase entera del correo", soloDigitos("Tu codigo es 123456."), "123456");
comprobar("mas de seis digitos", soloDigitos("12345678"), "123456");
comprobar("linea de dominio pegada", soloDigitos("@vicinomarket.com #123456"), "123456");
comprobar("solo letras", soloDigitos("abcdef"), "");
comprobar("cadena vacia", soloDigitos(""), "");
comprobar("largo declarado", LARGO_CODIGO, 6);

console.log("\nnormalizarCorreo — la clave de las cuotas");
comprobar("mayusculas", normalizarCorreo("Juan@Ejemplo.COM"), "juan@ejemplo.com");
comprobar("espacios", normalizarCorreo("  juan@ejemplo.com "), "juan@ejemplo.com");
comprobar("ya normalizado", normalizarCorreo("juan@ejemplo.com"), "juan@ejemplo.com");

console.log("\nsegundosDeEspera — lo que dice GoTrue");
comprobar(
  "mensaje tipico",
  segundosDeEspera("For security purposes, you can only request this after 44 seconds."),
  44,
);
comprobar("un segundo, en singular", segundosDeEspera("only request this after 1 second."), 1);
comprobar("mensaje sin numero", segundosDeEspera("Email rate limit exceeded"), undefined);
comprobar("cadena vacia", segundosDeEspera(""), undefined);

// --- Store de verificacion pendiente -------------------------------------
//
// Se monta un localStorage y un window de mentira antes de la PRIMERA LLAMADA.
// El modulo del store no toca `window` al evaluarse, solo dentro de sus
// funciones, asi que importarlo arriba del todo no lo despierta.

const almacen = new Map<string, string>();
let ahora = 1_000_000;

(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (k: string) => almacen.get(k) ?? null,
    setItem: (k: string, v: string) => void almacen.set(k, v),
    removeItem: (k: string) => void almacen.delete(k),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

const DateReal = Date.now;
Date.now = () => ahora;

console.log("\nverificacion pendiente — memoria entre salir al correo y volver");

comprobar("arranca vacio", leerPendiente(), null);
comprobar("el servidor nunca tiene nada", leerPendienteServidor(), null);

guardarPendiente("juan@ejemplo.com");
comprobar("guarda y lee", leerPendiente(), "juan@ejemplo.com");

// La instantanea tiene que ser estable entre renders: si devolviera un objeto
// nuevo cada vez, React se daria por cambiado en cada render y no pararia.
comprobar("misma instantanea dos veces", leerPendiente() === leerPendiente(), true);

ahora += VIGENCIA_MS - 1000;
comprobar("un segundo antes de vencer sigue viva", leerPendiente(), "juan@ejemplo.com");

ahora += 2000;
comprobar("pasada la vigencia se ignora", leerPendiente(), null);
comprobar("pero el rastro sigue en el almacen", almacen.has("vicino_verificacion_pendiente"), true);

limpiarSiVencio();
comprobar("limpiarSiVencio lo tira", almacen.has("vicino_verificacion_pendiente"), false);

// No debe tirar lo vigente: quien vuelve dentro de plazo tiene que encontrarlo.
guardarPendiente("ana@ejemplo.com");
limpiarSiVencio();
comprobar("limpiarSiVencio respeta lo vigente", leerPendiente(), "ana@ejemplo.com");

borrarPendiente();
comprobar("borrar deja vacio", leerPendiente(), null);

// Avisar a quien escucha es lo que repinta la pantalla. Sin esto, guardar el
// correo no cambiaria nada en la interfaz y el formulario se quedaria puesto.
let avisos = 0;
const desuscribir = suscribirPendiente(() => {
  avisos += 1;
});
guardarPendiente("bea@ejemplo.com");
comprobar("guardar avisa", avisos, 1);
borrarPendiente();
comprobar("borrar avisa", avisos, 2);
desuscribir();
guardarPendiente("cris@ejemplo.com");
comprobar("tras desuscribir ya no avisa", avisos, 2);

// JSON escrito por una version anterior, o corrompido a mano.
almacen.set("vicino_verificacion_pendiente", "{no es json");
comprobar("json corrupto se lee como vacio", leerPendiente(), null);
almacen.set("vicino_verificacion_pendiente", JSON.stringify({ email: 123, desde: ahora }));
comprobar("forma equivocada se lee como vacio", leerPendiente(), null);
almacen.set("vicino_verificacion_pendiente", JSON.stringify({ email: "", desde: ahora }));
comprobar("correo vacio se lee como vacio", leerPendiente(), null);

// Modo privado, o almacenamiento bloqueado por politica del navegador.
const ventana = (globalThis as Record<string, unknown>).window as {
  localStorage: {
    getItem: (k: string) => string | null;
    setItem: (k: string, v: string) => void;
  };
};

// ESCRITURA bloqueada. Es el caso de Safari con «Bloquear todas las cookies» y
// el de un WebView con el almacenamiento apagado, y hasta ahora el doble de
// prueba siempre escribia bien, asi que este camino no se probaba nunca.
// Importa porque guardarPendiente devuelve si pudo escribir, y de ese booleano
// depende que el registro tenga un respaldo en memoria en vez de quedarse
// mudo: cuenta creada, correo enviado y la pantalla sin cambiar.
const setItemBueno = ventana.localStorage.setItem;
ventana.localStorage.setItem = () => {
  throw new Error("QuotaExceededError");
};
comprobar("escritura bloqueada devuelve false", guardarPendiente("dani@ejemplo.com"), false);
comprobar("y no queda nada guardado", leerPendiente(), null);
ventana.localStorage.setItem = setItemBueno;
comprobar("escritura restablecida devuelve true", guardarPendiente("eva@ejemplo.com"), true);
borrarPendiente();

ventana.localStorage.getItem = () => {
  throw new Error("SecurityError");
};
comprobar("almacenamiento bloqueado no revienta", leerPendiente(), null);
comprobar("y leerPendienteDesde tampoco", leerPendienteDesde(), null);

Date.now = DateReal;

console.log(
  "\n" + (fallos === 0 ? "Todo en orden." : fallos + " prueba(s) fallando.") + "\n",
);
process.exit(fallos === 0 ? 0 : 1);

/**
 * Reglas de formato del código de verificación.
 *
 * Viven aparte de quien las usa porque las usan los dos lados: el componente
 * que limpia lo que se pega en las casillas y la acción de servidor que decide
 * si lo recibido es un intento. Si cada lado se escribiera su propia versión,
 * el día que una acepte algo que la otra rechaza el fallo aparecería como
 * "el código correcto dice que es incorrecto", que es de los caros de leer.
 *
 * Y viven en un módulo normal, no en el de "use server": desde un archivo de
 * acciones de servidor no se pueden exportar funciones síncronas, así que
 * probarlas exigiría o duplicarlas o levantar Next entero.
 */

/** Dígitos del código. Tiene que coincidir con mailer_otp_length en la config
 *  de Auth de Supabase (ver scripts/aplicar-config-otp.mjs). */
export const LARGO_CODIGO = 6;

/**
 * Deja solo dígitos y recorta al largo del código.
 *
 * Lo que se pega casi nunca es "123456": es "123 456", "123-456", el código con
 * un salto de línea detrás, o el párrafo entero del correo seleccionado de
 * más. Todo eso tiene que acabar en el mismo sitio.
 */
export function soloDigitos(entrada: string): string {
  return entrada.replace(/[^0-9]/g, "").slice(0, LARGO_CODIGO);
}

/**
 * Misma cubeta para "Juan@X.com" y "juan@x.com".
 *
 * No es cosmético: el correo es la clave de las cuotas de intentos y de
 * reenvíos. Sin normalizar, cambiar una mayúscula estrena cuota, y el límite
 * contra fuerza bruta se esquiva escribiendo el mismo correo de otra forma.
 */
export function normalizarCorreo(email: string): string {
  return email.trim().toLowerCase();
}

/** Los segundos que pide esperar GoTrue, si los dice. Su cuenta manda sobre la
 *  nuestra: es quien sabe cuándo se mandó el último correo. */
export function segundosDeEspera(mensaje: string): number | undefined {
  const m = /after ([0-9]+) seconds?/i.exec(mensaje);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Motivo estable del fallo al verificar o reenviar. La pantalla decide qué
 * hacer con cada uno sin tener que leer el texto en inglés de GoTrue.
 *
 * Vive aquí y no junto a las acciones de servidor porque en un archivo con
 * "use server" el compilador convierte CADA exportación en una acción
 * invocable por la red, y un tipo no tiene ningún valor al que apuntar en
 * tiempo de ejecución: la página revienta con un 500 que ni tsc, ni lint, ni
 * el build detectan, y que además se pinta bien.
 */
export type MotivoOtp = "invalido" | "vencido" | "limite" | "espera" | "desconocido";

export type ResultadoOtp =
  | { ok: true }
  | { ok: false; motivo: MotivoOtp; mensaje: string; segundos?: number };

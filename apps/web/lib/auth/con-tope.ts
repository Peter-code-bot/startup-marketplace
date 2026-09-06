/**
 * Tope de tiempo para una acción de servidor.
 *
 * Una server action no se puede cancelar: no acepta AbortSignal. Si la conexión
 * se cae a mitad, el fetch se queda colgado hasta que lo tumbe el sistema
 * operativo, y en un móvil eso son minutos. Durante ese rato la pantalla que
 * hizo la llamada se queda con su spinner, sus campos deshabilitados y ningún
 * botón: la única salida es cerrar la app. Eso le pasa a alguien que está
 * intentando darse de alta, o sea en el peor momento posible.
 *
 * Veinte segundos es holgadísimo para una acción que normalmente responde por
 * debajo del segundo, y corto comparado con los ~2 minutos que tarda el sistema
 * en rendirse.
 *
 * OJO con lo que este helper NO hace: no cancela nada. Si la petición acaba
 * cuajando después del tope, el servidor ya hizo su trabajo y el navegador ya
 * guardó las cookies que vinieran en la respuesta. Por eso quien lo use tiene
 * que tratar el tope como «no sé qué pasó», no como «no pasó»: lo correcto tras
 * un tope suele ser refrescar y dejar que el servidor diga en qué estado está.
 */

export const TOPE_ACCION_MS = 20_000;

/** Lo que lanza conTope al agotarse el plazo. Se distingue por el mensaje. */
export const MOTIVO_TOPE = "tope";

export function esTope(err: unknown): boolean {
  return err instanceof Error && err.message === MOTIVO_TOPE;
}

export function conTope<T>(promesa: Promise<T>, ms: number = TOPE_ACCION_MS): Promise<T> {
  let reloj: ReturnType<typeof setTimeout>;
  return Promise.race([
    promesa,
    new Promise<never>((_, rechazar) => {
      reloj = setTimeout(() => rechazar(new Error(MOTIVO_TOPE)), ms);
    }),
    // El finally limpia el temporizador también cuando gana la promesa buena:
    // sin él, cada intento deja un setTimeout vivo hasta que venza el plazo.
  ]).finally(() => clearTimeout(reloj)) as Promise<T>;
}

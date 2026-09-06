/**
 * Memoria de "esta persona está a mitad de verificar su correo".
 *
 * El reporte pedía un "token intermedio" para que la app recordara quién está
 * verificando aunque se cierre y se vuelva a abrir. Con Supabase Auth ese token
 * no hace falta y no debe existir: el código ya está atado al correo del lado
 * del servidor, así que emitir un JWT propio solo añadiría una credencial más
 * que robar, sin comprar nada. Lo único que hay que recordar en el dispositivo
 * es A QUÉ CORREO se mandó el código — un dato que la persona acaba de teclear.
 *
 * Va en localStorage y no en sessionStorage porque sessionStorage no sobrevive
 * a que el sistema mate la app en segundo plano, que es justo el caso que se
 * quería cubrir: salir a la app de correo y volver.
 *
 * Caduca junto con el código (10 min). Sin caducidad, un teléfono compartido
 * conservaría el correo de quien lo usó antes y le abriría a la siguiente
 * persona una pantalla de código con un correo ajeno en pantalla.
 *
 * Está montado como store de useSyncExternalStore y no como useState + efecto
 * a propósito. Leer localStorage en el primer render del cliente y en el
 * servidor da respuestas distintas, y eso es un desajuste de hidratación:
 * el servidor pinta el formulario, el cliente pinta las casillas, React se
 * queja y una de las dos versiones se descarta. getServerSnapshot devuelve
 * null siempre, que es la única respuesta honesta desde el servidor.
 */

const CLAVE = "vicino_verificacion_pendiente";

/** Igual que mailer_otp_exp en la config de Auth. Si uno cambia, cambia el otro. */
export const VIGENCIA_MS = 10 * 60 * 1000;

interface VerificacionPendiente {
  email: string;
  desde: number;
}

const oyentes = new Set<() => void>();

function notificar(): void {
  for (const oyente of oyentes) oyente();
}

/** Devuelve el dato guardado sin juzgar su vigencia. No escribe nada. */
function leerCrudo(): VerificacionPendiente | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;

    const dato: unknown = JSON.parse(crudo);
    if (
      typeof dato !== "object" ||
      dato === null ||
      typeof (dato as VerificacionPendiente).email !== "string" ||
      typeof (dato as VerificacionPendiente).desde !== "number" ||
      !(dato as VerificacionPendiente).email
    ) {
      return null;
    }
    return dato as VerificacionPendiente;
  } catch {
    // Modo privado, almacenamiento bloqueado, JSON corrupto de una versión
    // anterior, o `window` inexistente durante el prerenderizado.
    return null;
  }
}

/**
 * Instantánea para useSyncExternalStore.
 *
 * Tiene que ser PURA: React la llama en cada render, y borrar aquí lo caducado
 * sería escribir durante el render. La limpieza vive en limpiarSiVencio().
 * Devuelve un string o null, no un objeto, para que React pueda compararla por
 * valor — un objeto nuevo en cada llamada haría que React se diera por
 * cambiado en cada render y no parara nunca.
 */
export function leerPendiente(): string | null {
  const dato = leerCrudo();
  if (!dato) return null;
  if (Date.now() - dato.desde > VIGENCIA_MS) return null;
  return dato.email;
}

/** En el servidor no hay dispositivo, así que no hay nada pendiente. */
export function leerPendienteServidor(): null {
  return null;
}

/**
 * Cuándo se mandó el código que está vivo ahora mismo, o null si no hay ninguno.
 *
 * Va aparte de leerPendiente() y NO entra en la instantánea de
 * useSyncExternalStore a propósito: la instantánea tiene que comparar por valor
 * y ser estable entre renders, y un número que avanza con cada reenvío la
 * volvería inestable. Esto se lee una sola vez, al montar la pantalla del
 * código, para sembrar el contador de reenvío con lo que queda de verdad en
 * lugar de 60 s de oficio.
 */
export function leerPendienteDesde(): number | null {
  const dato = leerCrudo();
  if (!dato) return null;
  if (Date.now() - dato.desde > VIGENCIA_MS) return null;
  return dato.desde;
}

export function suscribirPendiente(alCambiar: () => void): () => void {
  // El evento `storage` solo lo dispara OTRA pestaña. Cubre el caso de tener
  // el registro abierto dos veces: al terminar en una, la otra se entera.
  if (oyentes.size === 0) window.addEventListener("storage", notificar);
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
    if (oyentes.size === 0) window.removeEventListener("storage", notificar);
  };
}

/**
 * Guarda (o vuelve a sellar) el correo pendiente. Devuelve si se pudo escribir.
 *
 * El booleano NO es decorativo: en Safari con «Bloquear todas las cookies», en
 * un WebView con el almacenamiento apagado, o con la cuota llena, el setItem
 * lanza. Sin ese aviso, quien llama cree que ya está y se queda esperando a que
 * la pantalla cambie sola — y la pantalla no cambia, porque el store sigue
 * vacío. Quien llama necesita saberlo para tirar de un respaldo en memoria.
 *
 * Llamarlo otra vez con el mismo correo es la forma de refrescar `desde` tras
 * un reenvío: el código nuevo trae 10 minutos frescos y el rastro tiene que
 * caducar con él, no con el primero.
 */
export function guardarPendiente(email: string): boolean {
  let guardado = false;
  try {
    const dato: VerificacionPendiente = { email, desde: Date.now() };
    window.localStorage.setItem(CLAVE, JSON.stringify(dato));
    guardado = true;
  } catch {
    // Perder la memoria degrada el reingreso; romper la pantalla no es opción.
  }
  notificar();
  return guardado;
}

export function borrarPendiente(): void {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // Mismo motivo que en guardarPendiente.
  }
  notificar();
}

/**
 * Tira el rastro caducado. Se llama desde un efecto, nunca desde un render.
 *
 * leerPendiente() ya ignora lo vencido, así que esto no cambia lo que se ve:
 * existe para que un correo no se quede indefinidamente escrito en el
 * almacenamiento de un teléfono que puede no ser de quien lo escribió.
 */
export function limpiarSiVencio(): void {
  const dato = leerCrudo();
  if (!dato) return;
  if (Date.now() - dato.desde <= VIGENCIA_MS) return;
  borrarPendiente();
}

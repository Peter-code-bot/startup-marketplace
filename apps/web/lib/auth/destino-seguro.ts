/**
 * Destino interno seguro a partir de un ?next= que viene de la URL.
 *
 * Vive en su propio modulo para poder probarse. Un parametro de redireccion
 * que se obedece a ciegas es una redireccion abierta: basta //otro.example
 * para que el navegador lo lea como otro dominio y mande ahi al usuario
 * recien autenticado. El fallo no se ve en pantalla, solo lo ve quien lo
 * explota.
 */
export function destinoSeguro(next: string | null | undefined): string {
  if (!next) return "/";

  // Un caracter de control descalifica la ruta entera.
  //
  // Los navegadores TIRAN el tabulador y los saltos de linea de una URL antes
  // de resolverla. Asi que un "/<TAB>/evil.example" pasaba las tres guardas de
  // abajo —empieza por una barra, no por dos, y no lleva barra invertida— y el
  // navegador lo convertia despues en "//evil.example", que es otro dominio.
  // Redireccion abierta, y de las caras: este valor se obedece justo despues
  // de crear la cuenta, con la sesion ya emitida.
  //
  // Se RECHAZA en vez de limpiar, porque limpiar obliga a acertar la lista
  // exacta de caracteres que cada navegador decide ignorar, y esa lista no la
  // controlamos nosotros. Una ruta interna legitima nunca lleva caracteres de
  // control, asi que rechazar no le cierra la puerta a ningun caso real.
  if (tieneCaracterDeControl(next)) return "/";

  // Tiene que ser una ruta interna.
  if (!next.startsWith("/")) return "/";
  // //host y /\/host se leen como otro dominio.
  if (next.startsWith("//")) return "/";
  // Algunos navegadores normalizan la barra invertida a barra: /\/host
  // acabaria siendo //host.
  if (next.includes(BARRA_INVERTIDA)) return "/";
  return next;
}

/**
 * Cualquier cosa por debajo del espacio (tabulador, salto de linea, retorno de
 * carro, nulo...) mas el DEL.
 *
 * Se comparan codigos y no se usa una expresion regular por el mismo motivo
 * que BARRA_INVERTIDA de abajo: un escape mal puesto dentro de una clase de
 * caracteres no da error, solo deja de casar, y una guarda que deja de casar
 * en silencio es peor que no tenerla.
 */
function tieneCaracterDeControl(valor: string): boolean {
  for (let i = 0; i < valor.length; i += 1) {
    const codigo = valor.charCodeAt(i);
    if (codigo < 32 || codigo === 127) return true;
  }
  return false;
}

/** Construida y no escrita: escapar barras dentro de literales es donde mas
 *  facil es equivocarse, y el error no falla, solo cambia lo que casa. */
const BARRA_INVERTIDA = String.fromCharCode(92);

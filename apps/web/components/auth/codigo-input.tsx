"use client";

// Seis casillas de codigo que por dentro son UN SOLO input.
//
// La tentacion es poner seis <input> y saltar de uno a otro con JS. Se ve
// igual y se rompe en todo lo demas: el autocompletado de iOS rellena solo la
// primera casilla, pegar reparte mal, el borrado hacia atras se pelea con el
// foco, y el teclado de Android propone palabras. Aqui hay un input real que
// cubre toda la fila, invisible pero presente, y seis cajas que solo PINTAN lo
// que ese input tiene. Asi el pegado, el borrado, la seleccion y el
// autocompletado son los nativos del sistema, que es justo lo que se queria.
//
// El input se esconde con text-transparent + caret-transparent, NO con
// opacity-0 ni visibility:hidden: las heuristicas de autorrelleno de Safari
// saltan los campos que no se pintan, y el Paso 4 del flujo depende justo de
// que no lo salten.

import { useCallback, useEffect, useRef } from "react";
import { LARGO_CODIGO, soloDigitos } from "@/lib/auth/otp-formato";

interface CodigoInputProps {
  valor: string;
  onChange: (valor: string) => void;
  /** Se dispara una sola vez por codigo completo, no en cada re-render. */
  onCompleto: (valor: string) => void;
  deshabilitado?: boolean;
  error?: boolean;
  /** Etiqueta accesible; se lee, no se pinta. */
  etiqueta?: string;
}

export function CodigoInput({
  valor,
  onChange,
  onCompleto,
  deshabilitado = false,
  error = false,
  etiqueta = "Código de verificación de 6 dígitos",
}: CodigoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Recuerda el ultimo codigo ya entregado. Sin esto, cualquier re-render con
  // el codigo completo (un cambio de estado del padre, por ejemplo) volveria a
  // llamar a onCompleto y a enviar el mismo codigo dos veces.
  const ultimoEntregado = useRef<string | null>(null);

  // Foco al montar: en movil abre el teclado, y el autorrelleno de codigo de
  // iOS solo se ofrece sobre el campo enfocado.
  useEffect(() => {
    if (deshabilitado) return;
    inputRef.current?.focus();
  }, [deshabilitado]);

  useEffect(() => {
    if (valor.length < LARGO_CODIGO) {
      // Al borrar se rearma: si vuelve a completar, se entrega otra vez.
      ultimoEntregado.current = null;
      return;
    }
    if (ultimoEntregado.current === valor) return;
    ultimoEntregado.current = valor;
    onCompleto(valor);
  }, [valor, onCompleto]);

  const alCambiar = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Un pegado trae "123 456", "123-456" o el correo entero seleccionado de
      // mas. Nos quedamos con los digitos y con los seis primeros.
      const limpio = soloDigitos(e.target.value);
      onChange(limpio);
    },
    [onChange],
  );

  // Pegar SUSTITUYE, nunca concatena.
  //
  // Sin esto habia un fallo feo: como el cursor vive siempre al final, pegar
  // con casillas ya escritas anadia al final, y soloDigitos se queda con los
  // SEIS PRIMEROS digitos del resultado. O sea que quien tecleaba "12", se
  // rendia y pegaba "135790" acababa con "121357" — un codigo que nadie
  // escribio — y como ya son seis digitos se ENVIABA SOLO. El error decia
  // "codigo incorrecto" y la persona no tenia forma de saber por que.
  //
  // Es el camino normal en Android, donde no hay autorrelleno desde el correo
  // y pegar es lo que hace todo el mundo.
  const alPegar = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      onChange(soloDigitos(e.clipboardData.getData("text")));
    },
    [onChange],
  );

  // El cursor vive siempre al final. Si alguien toca en medio de la fila y
  // escribe, sin esto el digito se insertaria por el medio y la fila mentiria
  // sobre lo que hay escrito.
  const alSeleccionar = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const fin = el.value.length;
    // Una seleccion que cubre TODO se respeta: es lo que hace un
    // "seleccionar todo" antes de reescribir, y colapsarla al final
    // convertiria el reemplazo en una concatenacion.
    if (el.selectionStart === 0 && el.selectionEnd === fin && fin > 0) return;
    if (el.selectionStart !== fin || el.selectionEnd !== fin) {
      el.setSelectionRange(fin, fin);
    }
  }, []);

  const casillaActiva = Math.min(valor.length, LARGO_CODIGO - 1);

  return (
    <div
      className="relative"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        // type="text" y no "number": number acepta "e", "+" y "-", pinta
        // flechitas y en algunos Android abre el teclado equivocado.
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        // SIN maxLength, y es deliberado. El navegador aplica maxLength al
        // pegar, y lo aplica sobre los CARACTERES CRUDOS, antes de que este
        // componente vea nada: pegar "123 456" llegaria como "123 45" (cinco
        // digitos) y pegar la linea entera del correo, "@vicinomarket.com
        // #135790", llegaria como "@vicin", o sea vacia. Justo los dos pegados
        // que mas se van a dar. El limite lo pone soloDigitos(), que recorta
        // DESPUES de tirar lo que no son numeros, y como el input es controlado
        // su valor no puede pasar de seis de todos modos.
        value={valor}
        disabled={deshabilitado}
        aria-label={etiqueta}
        aria-invalid={error}
        onChange={alCambiar}
        onPaste={alPegar}
        onSelect={alSeleccionar}
        onClick={alSeleccionar}
        onFocus={alSeleccionar}
        // El anillo de foco va en la CASILLA activa, no en este input: pintarlo
        // aqui dibuja un rectangulo verde alrededor de las seis, o sea alrededor
        // de un control que no se ve, y se lee como un segundo campo.
        //
        // Va en style y no en una clase porque la regla :focus-visible de
        // globals.css esta FUERA de @layer, y el CSS sin capa le gana a
        // cualquier utilidad de Tailwind por mucha especificidad que tenga:
        // outline-none aqui no hacia absolutamente nada. Un estilo en linea si
        // gana, porque juega en otro origen de la cascada.
        //
        // No se pierde accesibilidad: el foco sigue anunciandose (aria-label) y
        // sigue viendose, en la casilla que toca.
        style={{ outline: "none" }}
        // text-base son 16px: por debajo de eso Safari hace zoom al enfocar y
        // la pantalla salta.
        className="absolute inset-0 z-10 h-full w-full cursor-default appearance-none border-0 bg-transparent p-0 text-base text-transparent caret-transparent selection:bg-transparent disabled:cursor-not-allowed"
      />

      {/* gap-1.5 y no gap-2: en 375 px de ancho cada casilla se queda en unos
          40 px, y cada pixel de hueco se lo quita al digito. */}
      <div className="grid grid-cols-6 gap-1.5" aria-hidden="true">
        {Array.from({ length: LARGO_CODIGO }, (_, i) => {
          const digito = valor[i] ?? "";
          const esActiva = !deshabilitado && i === casillaActiva && valor.length < LARGO_CODIGO;
          return (
            <div
              key={i}
              data-activa={esActiva || undefined}
              className={[
                // rounded-md y no rounded-xl: --r-xl son 22 px en este sistema,
                // que en un input ancho queda bien pero en una casilla de 40 px
                // satura el radio y la pinta como una elipse.
                "flex h-14 items-center justify-center rounded-md border bg-auth-input text-2xl font-semibold tabular-nums text-auth-text transition-all duration-150",
                error
                  ? "border-[color:var(--danger)] shadow-[inset_0_0_0_1px_rgba(255,59,48,0.25)]"
                  : esActiva
                    ? "border-primary/60 ring-2 ring-primary/20"
                    : "border-border/50",
                deshabilitado ? "opacity-60" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {digito || (esActiva ? <span className="h-6 w-px animate-pulse bg-primary" /> : null)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

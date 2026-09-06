#!/usr/bin/env node
/**
 * Pasa el correo de confirmación de VICINO de enlace mágico a código de 6
 * dígitos, contra la Management API de Supabase.
 *
 *   node scripts/aplicar-config-otp.mjs --ver     # solo lee y compara
 *   node scripts/aplicar-config-otp.mjs           # aplica código + plantilla
 *
 * Y con el SMTP propio (PowerShell). La clave NO se teclea en la línea de
 * comandos: PSReadLine persiste cada línea escrita en ConsoleHost_history.txt,
 * asignaciones de $env: incluidas, así que un `$env:RESEND_SMTP_PASS = "re_..."`
 * deja la credencial en un fichero de texto plano que sobrevive a la sesión.
 *
 *   $s = Read-Host "Clave de Resend" -AsSecureString
 *   $env:RESEND_SMTP_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
 *       [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
 *   node scripts/aplicar-config-otp.mjs
 *   Remove-Item Env:\RESEND_SMTP_PASS
 *
 * Qué toca y por qué:
 *
 *   mailer_otp_length  8 -> 6    Ocho casillas no caben cómodas en 360 px y el
 *                                reporte pide seis. El espacio de seis dígitos
 *                                sigue siendo inalcanzable con 10 intentos por
 *                                cuarto de hora.
 *   mailer_otp_exp  3600 -> 600  Diez minutos. Una hora es una hora en la que
 *                                un correo reenviado o filtrado sigue valiendo
 *                                para entrar.
 *                                OJO: es UN SOLO campo para TODO el correo de
 *                                Auth. No gobierna solo el código de registro:
 *                                también el enlace de recuperación de
 *                                contraseña, el de invitación y el de cambio de
 *                                correo. Bajarlo a 600 recorta el enlace de
 *                                /forgot-password de 60 a 10 minutos, y GoTrue
 *                                no ofrece un vencimiento separado por flujo.
 *                                Si eso resulta corto para la bandeja de
 *                                entrada, el número a mover es éste y afecta
 *                                también al código.
 *   plantilla + asunto           El cuerpo pasa a llevar el código, y termina
 *                                en la línea "@dominio #código" que es lo que
 *                                mira iOS para ofrecer el autorrelleno.
 *
 * Y, si hay RESEND_SMTP_PASS, el SMTP propio. Esto último no es cosmético:
 * sin SMTP propio, Supabase impone DOS correos por hora para todo el proyecto,
 * así que hoy la tercera persona que se registra en una hora no recibe nada.
 *
 * La clave de Resend no se escribe en este archivo ni se pasa por argumento
 * (los argumentos quedan en el historial del shell). Solo se lee del entorno.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOLO_VER = process.argv.includes("--ver");

// Una bandera que no reconocemos ABORTA, no se ignora.
//
// Este script escribe en la configuracion de producción, y el modo por defecto
// es escribir. O sea que `--dry`, `--check` o cualquier variante razonable que
// alguien teclee de memoria en vez de `--ver` no avisaría de nada: aplicaría el
// cambio y lo llamaría éxito. El fallo se descubre en la bandeja de entrada de
// los usuarios.
const DESCONOCIDAS = process.argv.slice(2).filter((a) => a !== "--ver");
if (DESCONOCIDAS.length > 0) {
  console.error(
    `No entiendo ${DESCONOCIDAS.join(" ")}. La única bandera es --ver (leer y comparar, sin aplicar).\n` +
      "Sin banderas, este script ESCRIBE en la configuración de producción.",
  );
  process.exit(1);
}

const DOMINIO = "vicinomarket.com";

// La línea del final es la que hace funcionar el Paso 4 en iOS 17+: Mail busca
// exactamente "@dominio #código" como ÚLTIMA línea del correo, comprueba que el
// dominio sea el mismo que el del sitio donde está el campo, y solo entonces
// ofrece el código en el teclado. Cualquier cosa escrita debajo la anula, así
// que ahí no va nada más.
const PLANTILLA = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
  <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#1F5A4E;">Tu código de VICINO</h1>
  <p style="font-size:15px;line-height:1.5;margin:0 0 24px;color:#555555;">Escríbelo en la app para confirmar tu cuenta.</p>
  <p style="font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;margin:0 0 24px;padding:18px 0;background:#F4ECE0;border-radius:12px;color:#1F5A4E;">{{ .Token }}</p>
  <p style="font-size:14px;line-height:1.5;margin:0 0 20px;color:#555555;">Vence en 10 minutos. Si tú no creaste una cuenta en VICINO, ignora este correo.</p>
  <p style="font-size:13px;line-height:1.5;margin:0 0 28px;color:#888888;">¿No puedes escribirlo? <a href="{{ .ConfirmationURL }}" style="color:#1F5A4E;">Confirma desde este enlace</a>.</p>
  <p style="font-size:12px;color:#aaaaaa;margin:0;">@${DOMINIO} #{{ .Token }}</p>
</div>`;

function leerEnv(ruta, clave) {
  try {
    const linea = readFileSync(join(RAIZ, ruta), "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(clave + "="));
    if (!linea) return null;
    return linea.slice(clave.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return null;
  }
}

const token = process.env.SUPABASE_ACCESS_TOKEN ?? leerEnv(".env", "SUPABASE_ACCESS_TOKEN");
if (!token) {
  console.error("Falta SUPABASE_ACCESS_TOKEN (ni en el entorno ni en .env de la raíz).");
  process.exit(1);
}

// El ref sale de la URL del proyecto en vez de estar escrito a mano: si algún
// día se apunta a otro proyecto, el script va solo y no aplica cambios de
// producción sobre el proyecto equivocado.
const urlSupabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? leerEnv("apps/web/.env.local", "NEXT_PUBLIC_SUPABASE_URL");
const ref = urlSupabase ? new URL(urlSupabase).hostname.split(".")[0] : null;
if (!ref) {
  console.error("No pude deducir el ref del proyecto de NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const cabeceras = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const cambios = {
  mailer_otp_length: 6,
  mailer_otp_exp: 600,
  mailer_subjects_confirmation: "Tu código de VICINO",
  mailer_templates_confirmation_content: PLANTILLA,
};

const clave = process.env.RESEND_SMTP_PASS;
if (clave) {
  Object.assign(cambios, {
    smtp_host: "smtp.resend.com",
    // CADENA, no número: el OpenAPI de la Management API declara smtp_port como
    // {"type":"string"}. Mandando 465 el validador rechaza el body entero y,
    // como el PATCH es atómico, no se aplica NADA del bloque — ni el host, ni
    // el usuario, ni el techo de correos. Y el fallo se leería como «no cuajó»
    // sin decir por qué.
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: clave,
    smtp_admin_email: process.env.SMTP_REMITENTE ?? `no-reply@${DOMINIO}`,
    smtp_sender_name: "VICINO",
    // Solo tiene sentido subirlo con SMTP propio: con el servicio interno de
    // Supabase el techo real son 2/h y este número no lo cambia.
    rate_limit_email_sent: 60,
  });
}

function resumir(v) {
  if (typeof v === "string" && v.length > 70) return JSON.stringify(v.slice(0, 70) + "...");
  return JSON.stringify(v);
}

const resAntes = await fetch(API, { headers: cabeceras });
if (!resAntes.ok) {
  console.error(`No pude leer la config: ${resAntes.status} ${await resAntes.text()}`);
  process.exit(1);
}
const antes = await resAntes.json();

console.log(`Proyecto ${ref}\n`);
for (const [k, v] of Object.entries(cambios)) {
  // La clave nunca se imprime, ni la vieja ni la nueva. Y se marca siempre
  // como cambio: comparar dos "***" diria "igual" aunque antes no hubiera nada,
  // que es justo el caso que interesa ver.
  const esClave = k === "smtp_pass";
  const previo = esClave ? (antes[k] ? "(ya había una)" : null) : antes[k];
  const nuevo = esClave ? "(la del entorno)" : v;
  const igual = esClave ? false : JSON.stringify(previo) === JSON.stringify(v);
  console.log(`  ${igual ? "=" : "~"} ${k}`);
  if (!igual) {
    console.log(`      antes: ${resumir(previo)}`);
    console.log(`      ahora: ${resumir(nuevo)}`);
  }
}

if (clave) {
  // Aviso, no bloqueo: la decisión es de Pedro, pero no puede tomarse sin esto
  // delante. Subir el techo de correos SIN los limitadores puestos deja
  // reenviarCodigo() abierto a llenarle el buzón a cualquiera: hoy lo único
  // que lo frena es justamente el techo de 2/h que este cambio levanta.
  console.log(`
  !! ANTES DE APLICAR EL SMTP: comprueba que UPSTASH_REDIS_REST_URL y
     UPSTASH_REDIS_REST_TOKEN estén puestas en Vercel (producción).

     Sin ellas los limitadores de lib/rate-limit.ts son un no-op (se comprobó
     el 27-ago-2026 y sigue documentado dentro de ese archivo), y este cambio
     sube rate_limit_email_sent de 2 a 60 por hora. Las dos cosas van juntas:
     el techo bajo es hoy la única defensa contra el mail bombing por reenvío
     de código.`);
}

if (!clave) {
  console.log(
    "\n  ! Sin RESEND_SMTP_PASS: NO se toca el SMTP, así que sigue el techo de\n" +
      "    2 correos por hora en todo el proyecto. Ver la cabecera de este archivo.",
  );
}

if (SOLO_VER) {
  console.log("\n--ver: no se aplicó nada.");
  process.exit(0);
}

const res = await fetch(API, {
  method: "PATCH",
  headers: cabeceras,
  body: JSON.stringify(cambios),
});

if (!res.ok) {
  console.error(`\nFALLÓ: ${res.status} ${await res.text()}`);
  process.exit(1);
}

// Se relee en vez de fiarse del 200: un PATCH aceptado y una config guardada no
// son lo mismo, y aquí lo que importa es lo segundo.
const despues = await (await fetch(API, { headers: cabeceras })).json();
let discrepancias = 0;
for (const [k, v] of Object.entries(cambios)) {
  if (k === "smtp_pass") continue;
  if (JSON.stringify(despues[k]) !== JSON.stringify(v)) {
    discrepancias += 1;
    console.error(`  NO CUAJÓ ${k}: quedó ${resumir(despues[k])}`);
  }
}

console.log(discrepancias === 0 ? "\nAplicado y verificado." : `\n${discrepancias} campos no cuajaron.`);
process.exit(discrepancias === 0 ? 0 : 1);

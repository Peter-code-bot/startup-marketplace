"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { fuzzCoordinate } from "./fuzz";
import { enforce, getClientIp, readHeavyRateLimit } from "@/lib/rate-limit";
import {
  consultarProductosCercanos,
  type ConsultaCercanosParams,
  type ConsultaCercanosResult,
} from "./consulta-cercanos";

// AQUI NO SE RE-EXPORTA EL TIPO NearbyProduct, y no es un descuido.
//
// Estaba `export type { NearbyProduct }` y tumbaba la pagina con un 500:
// «ReferenceError: NearbyProduct is not defined». Un archivo "use server" no
// es un modulo normal — el compilador recorre sus exportaciones para
// convertirlas en acciones invocables, y ahi un tipo no tiene ningun valor en
// tiempo de ejecucion al que apuntar.
//
// Lo peor del fallo es como se presentaba: la pagina se PINTABA bien y solo la
// consola confesaba el 500. Quien importe el tipo, que lo tome de
// ./consulta-cercanos, que es donde vive.

type GetNearbyParams = ConsultaCercanosParams;
type GetNearbyResult = ConsultaCercanosResult;

export async function getNearbyProducts(
  params: GetNearbyParams,
): Promise<GetNearbyResult> {
  // Throttle by IP — this is an unauthenticated heavy read, so the rate limit
  // protects against scraping the proximity surface. 60/min is well above
  // any reasonable UI cadence.
  //
  // El limite vive AQUI y no en consultarProductosCercanos a proposito: esta
  // funcion es alcanzable desde el navegador y la otra no. El render del
  // servidor llama directamente a la consulta, porque limitar por IP durante
  // el SSR gastaria el presupuesto del propio usuario en cada carga de pagina.
  const ip = getClientIp(await headers());
  const rate = await enforce(readHeavyRateLimit, `read:${ip}`);
  if (!rate.ok) return { products: [], error: rate.error };

  return consultarProductosCercanos(params);
}

interface GetNearbyVendorCountParams {
  lat: number;
  lng: number;
  radiusMeters?: number;
}

interface GetNearbyVendorCountResult {
  count: number;
  error?: string;
}

/**
 * SIN CONSUMIDOR desde el 5-sep-2026. Se deja porque funciona y esta cuidada
 * —rate limit, coordenadas difuminadas y cuenta por RPC en vez de traerse cien
 * filas— no porque la use alguien.
 *
 * Su unico llamador era ZoneCard, que guardaba el resultado en un `useState` y
 * NUNCA lo pintaba: era una ida de red por cada carga del home, y por cada
 * cambio de posicion, para tirar el resultado a la basura. Al quitar esa
 * llamada se quedo huerfana.
 *
 * Si vuelve a hacer falta (un «N vendedores cerca» en la pildora de zona, que
 * es para lo que nacio), el sitio natural es pasarlo desde el servidor junto a
 * `hayUbicacionEnServidor`, no volver a pedirlo desde un efecto del cliente.
 */
export async function getNearbyVendorCount(
  params: GetNearbyVendorCountParams,
): Promise<GetNearbyVendorCountResult> {
  if (!Number.isFinite(params.lat) || !Number.isFinite(params.lng)) {
    return { count: 0, error: "Coordenadas inválidas" };
  }
  if (Math.abs(params.lat) > 90 || Math.abs(params.lng) > 180) {
    return { count: 0, error: "Coordenadas fuera de rango" };
  }

  const ip = getClientIp(await headers());
  const rate = await enforce(readHeavyRateLimit, `read:${ip}`);
  if (!rate.ok) return { count: 0, error: rate.error };

  const radius = Math.min(Math.max(params.radiusMeters ?? 5000, 100), 50_000);
  const snapped = fuzzCoordinate(params.lat, params.lng);
  const snappedRadius = Math.ceil(radius / 100) * 100 + 100;

  const supabase = await createClient();
  // count_nearby_vendors devuelve un entero. Antes se pedian hasta CIEN filas
  // completas al RPC del feed —cada una con su objeto de perfil y su agregado
  // de categorias— para contar en el cliente, y ademas se contaba por NOMBRE:
  // dos vendedores homonimos contaban como uno, y con mas de cien productos en
  // el radio la cuenta se quedaba corta en silencio. El RPC del feed no
  // devuelve el identificador del vendedor, asi que desde aqui no habia forma
  // de contarlo bien: era la herramienta equivocada.
  const { data, error } = await supabase.rpc("count_nearby_vendors", {
    user_lat: snapped.lat,
    user_lng: snapped.lng,
    radius_meters: snappedRadius,
  });

  if (error) return { count: 0, error: error.message };

  return { count: typeof data === "number" ? data : 0 };
}

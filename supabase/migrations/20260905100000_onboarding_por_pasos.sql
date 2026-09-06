-- Onboarding por pasos: donde va la persona, que camino eligio y que le interesa.
--
-- APLICADO A MANO el 5-sep-2026, via la Management API del proyecto
-- oxxdkwywprkfghhbnoto. Igual que 20260903240000, este archivo es la CONSTANCIA
-- de lo que YA corre en la base, no algo pendiente. NO lo apliques de nuevo.
-- (Es idempotente —IF NOT EXISTS y DROP CONSTRAINT IF EXISTS en todo— pero el
-- ledger de migraciones sigue sin reconciliar, asi que `supabase db push` NO es
-- el camino.)
--
-- El bloque VERIFY del final se corrio entero y paso, incluido lo que de verdad
-- importa: que la segunda llamada NO borra lo que guardo la primera.
--
-- ---------------------------------------------------------------------------
-- POR QUE HACE FALTA
--
-- Hoy el onboarding no recoge un solo dato. Los dos botones de /bienvenida
-- llaman a complete_user_onboarding y mandan a la app: quien toca «Quiero
-- explorar» entra sin nombre, sin foto, sin descripcion y sin intereses, y no
-- puede volver a elegir nunca porque la bandera es de un solo uso.
--
-- has_seen_onboarding NO sirve para gobernar cuatro pasos: es booleana y de un
-- solo uso, y ya gobierna otra cosa (la redireccion a /bienvenida). Y tampoco
-- se puede reutilizar alta_vendedor_paso: esa columna ya carga dos trabajos
-- —el aviso del perfil y la llave del guard del alta— y meterle un tercero la
-- rompe. Van columnas nuevas.
--
-- ---------------------------------------------------------------------------
-- LA UBICACION NO ESTA AQUI, Y ES DELIBERADO
--
-- El plan la daba por dato de base. No lo es: el feed filtra por la cookie
-- `vicino_location` (mas localStorage `vicino_last_location`), que escribe
-- hooks/useGeolocation.ts. El paso de ubicacion del onboarding reutiliza el
-- selector de zona que YA existe (components/home/change-location-sheet.tsx,
-- con su buscador de colonia y setManualPosition), asi que se resuelve entero
-- en el cliente y no necesita ni columna ni funcion.
--
-- Anadir aqui una escritura a profiles.ubicacion_lat/lng habria sido una
-- segunda fuente de verdad para el mismo dato, con el riesgo de que el feed y
-- el perfil discrepen. Si algun dia se quiere persistir la colonia en el
-- perfil, que sea su propia migracion y con una sola fuente decidida.
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- 1. Donde va y por donde entro.
--
-- Dos columnas y no una: el camino decide QUE pasos tocan (el vendedor pasa
-- por categoria y tipo antes del perfil) y el paso decide DONDE se reanuda.
-- Colapsarlas en un solo TEXT obligaria a codificar el par en la cadena.
--
-- NULL en paso = o no ha empezado, o ya termino. Se distingue con
-- has_seen_onboarding, que sigue siendo el que dice «esto ya acabo» y se
-- escribe al final del ultimo paso, no al principio como hoy.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists onboarding_camino text;

alter table public.profiles
  add column if not exists onboarding_paso text;

alter table public.profiles
  drop constraint if exists profiles_onboarding_camino_check;

alter table public.profiles
  add constraint profiles_onboarding_camino_check
  check (onboarding_camino is null or onboarding_camino in ('explorar', 'vender'));

alter table public.profiles
  drop constraint if exists profiles_onboarding_paso_check;

alter table public.profiles
  add constraint profiles_onboarding_paso_check
  check (onboarding_paso is null or onboarding_paso in ('perfil', 'intereses', 'ubicacion'));

comment on column public.profiles.onboarding_camino is
  'Camino elegido en /bienvenida: explorar o vender. NULL = aun no eligio.';

comment on column public.profiles.onboarding_paso is
  'Paso pendiente del onboarding. NULL = sin empezar o ya terminado (lo desempata has_seen_onboarding).';

-- ---------------------------------------------------------------------------
-- 2. Intereses.
--
-- Arreglo de slugs y no tabla aparte: los slugs son ya la llave que usan el
-- catalogo de categorias y el mapa de iconos, asi que ordenar el feed por
-- intereses no necesita ningun join.
--
-- El tope de 5 se vigila en la constraint y no solo en la pantalla: una
-- pantalla se puede saltar llamando al RPC a pelo, una constraint no.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists intereses text[];

alter table public.profiles
  drop constraint if exists profiles_intereses_check;

alter table public.profiles
  add constraint profiles_intereses_check
  check (
    intereses is null
    or (array_length(intereses, 1) between 1 and 5
        and array_position(intereses, null) is null)
  );

comment on column public.profiles.intereses is
  'Slugs de categoria que le interesan. 1 a 5. NULL = perfil anterior al onboarding por pasos; todo lo que los use debe caer al orden por defecto.';

-- ---------------------------------------------------------------------------
-- 3. Grants.
--
-- REGLA DURA DEL REPO: profiles otorga privilegios COLUMNA POR COLUMNA, y una
-- columna nueva nace SIN NINGUNO. Sin el GRANT SELECT, cualquier consulta que
-- incluya la columna muere ENTERA con 42501 — no la columna, la consulta. Es
-- exactamente la causa raiz de la saga de onboarding anterior.
--
-- SELECT si, UPDATE no: las tres columnas las escribe el SECURITY DEFINER de
-- abajo. authenticated solo tiene UPDATE sobre (foto, fcm_token) y asi se
-- queda.
-- ---------------------------------------------------------------------------

grant select (onboarding_camino) on public.profiles to authenticated;
grant select (onboarding_paso)   on public.profiles to authenticated;
grant select (intereses)         on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 4. La escritura.
--
-- COALESCE en TODO, y es el punto entero de esta funcion: guardar por pasos
-- significa que el paso 3 la llama sin mandar lo del paso 2. La funcion que ya
-- existe para el perfil (update_profile_and_pause_products) hace asignacion
-- directa y SOBRESCRITURA COMPLETA — llamarla desde el paso 3 borraria el
-- paso 2. Omitir un dato aqui significa «no lo toques», nunca «borralo».
-- Mismo patron que activar_modo_vendedor (20260903240000).
--
-- Los intereses se validan contra el catalogo real. Sin esto, un slug
-- inventado entra al arreglo y luego no pinta icono ni ordena nada, fallando
-- en silencio meses despues y lejos de aqui.
-- ---------------------------------------------------------------------------

create or replace function public.guardar_paso_onboarding(
  p_camino    text    default null,
  p_paso      text    default null,
  p_nombre    text    default null,
  p_bio       text    default null,
  p_foto      text    default null,
  p_intereses text[]  default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
DECLARE
  v_uid UUID := auth.uid();
  v_invalido TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Necesitas iniciar sesion.' USING ERRCODE = '42501';
  END IF;

  IF p_camino IS NOT NULL AND p_camino NOT IN ('explorar', 'vender') THEN
    RAISE EXCEPTION 'Camino de onboarding invalido.' USING ERRCODE = '22023';
  END IF;

  IF p_paso IS NOT NULL AND p_paso NOT IN ('perfil', 'intereses', 'ubicacion') THEN
    RAISE EXCEPTION 'Paso de onboarding invalido.' USING ERRCODE = '22023';
  END IF;

  IF p_intereses IS NOT NULL THEN
    IF array_length(p_intereses, 1) IS NULL
       OR array_length(p_intereses, 1) < 1
       OR array_length(p_intereses, 1) > 5 THEN
      RAISE EXCEPTION 'Elige entre 1 y 5 intereses.' USING ERRCODE = '22023';
    END IF;

    -- Un slug que no existe en el catalogo activo no entra. Se nombra el
    -- culpable en el mensaje: si algun dia falla, que no haya que adivinarlo.
    SELECT s INTO v_invalido
      FROM unnest(p_intereses) AS s
     WHERE NOT EXISTS (
       SELECT 1 FROM categories c WHERE c.slug = s AND c.activo
     )
     LIMIT 1;

    IF v_invalido IS NOT NULL THEN
      RAISE EXCEPTION 'Esa categoria no existe: %', v_invalido USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE profiles
     SET onboarding_camino = COALESCE(p_camino, onboarding_camino),
         onboarding_paso   = COALESCE(p_paso, onboarding_paso),
         nombre            = COALESCE(NULLIF(btrim(p_nombre), ''), nombre),
         bio               = COALESCE(NULLIF(btrim(p_bio), ''), bio),
         foto              = COALESCE(NULLIF(btrim(p_foto), ''), foto),
         intereses         = COALESCE(p_intereses, intereses)
   WHERE id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontro tu perfil.' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'camino', COALESCE(p_camino, (SELECT onboarding_camino FROM profiles WHERE id = v_uid)),
    'paso',   COALESCE(p_paso,   (SELECT onboarding_paso   FROM profiles WHERE id = v_uid))
  );
END;
$function$;

-- La firma va COMPLETA en el grant. Con argumentos por defecto Postgres puede
-- tener varias sobrecargas y un grant a la firma equivocada deja la funcion
-- inaccesible con un 42501 que parece de RLS.
grant execute on function public.guardar_paso_onboarding(text, text, text, text, text, text[])
  to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- VERIFY (correr despues de aplicar, en el mismo editor):
--
--   -- 1. Las tres columnas existen y authenticated puede LEERLAS pero no escribirlas.
--   SELECT c,
--          has_column_privilege('authenticated','public.profiles',c,'SELECT') AS lee,
--          has_column_privilege('authenticated','public.profiles',c,'UPDATE') AS escribe
--     FROM unnest(ARRAY['onboarding_camino','onboarding_paso','intereses']) AS c;
--   -- esperado: lee = true en las tres, escribe = false en las tres.
--
--   -- 2. La funcion existe con la firma exacta y es ejecutable.
--   SELECT has_function_privilege(
--     'authenticated',
--     'public.guardar_paso_onboarding(text,text,text,text,text,text[])',
--     'EXECUTE');
--   -- esperado: true
--
--   -- 3. El COALESCE respeta lo ya guardado (este es EL punto de la funcion).
--   --    Correr como el usuario real, con ROLLBACK para no ensuciar nada.
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claims = '{"sub":"<uuid-de-prueba>","role":"authenticated"}';
--     SELECT public.guardar_paso_onboarding(p_nombre => 'Prueba', p_paso => 'intereses');
--     SELECT public.guardar_paso_onboarding(p_intereses => ARRAY['<slug-real>'], p_paso => 'ubicacion');
--     SELECT nombre, intereses, onboarding_paso FROM profiles WHERE id = '<uuid-de-prueba>';
--     -- esperado: nombre SIGUE siendo 'Prueba' (la segunda llamada no lo borro).
--   ROLLBACK;
--
--   -- 4. Un slug inventado se rechaza.
--   SELECT public.guardar_paso_onboarding(p_intereses => ARRAY['no-existe-jamas']);
--   -- esperado: error 22023 'Esa categoria no existe: no-existe-jamas'
-- ---------------------------------------------------------------------------

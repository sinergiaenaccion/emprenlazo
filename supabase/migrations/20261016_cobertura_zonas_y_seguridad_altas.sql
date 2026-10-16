-- Emprenlazo: cobertura por zonas habilitadas y corrección de seguridad en altas.
-- Ejecutar en Supabase SQL Editor después de schema.sql.
-- Ejecutar DESPUÉS de 20261011_merchant_accounts_catalog.sql (agrega owner_id) o antes, según el orden en que se hayan aplicado.
-- No borra datos. No crea tablas de catálogo de productos (eso queda pendiente de decisión).

-- 1) Zonas habilitadas. Cada zona tiene un recuadro aproximado (bbox).
--    Los recuadros son aproximados y se ajustan con límites oficiales antes de decidir
--    si un comercio entra o no en una zona. Algunos recuadros se superponen.
create table if not exists public.zonas (
  id text primary key,
  nombre text not null,
  tipo text not null check (tipo in ('barrio', 'localidad')),
  grupo text not null,
  habilitada boolean not null default false,
  centro_lat double precision not null,
  centro_lng double precision not null,
  bbox_sur double precision not null,
  bbox_norte double precision not null,
  bbox_oeste double precision not null,
  bbox_este double precision not null,
  created_at timestamptz not null default now(),
  check (bbox_sur < bbox_norte and bbox_oeste < bbox_este)
);

alter table public.zonas enable row level security;

drop policy if exists "zonas_lectura_habilitadas" on public.zonas;
create policy "zonas_lectura_habilitadas"
  on public.zonas for select
  to anon, authenticated
  using (habilitada = true);

-- Carga inicial de la primera etapa: zona norte de Córdoba capital y Sierras Chicas.
-- on conflict do nothing: no pisa cambios hechos después desde el panel de Supabase.
insert into public.zonas (
  id, nombre, tipo, grupo, habilitada,
  centro_lat, centro_lng, bbox_sur, bbox_norte, bbox_oeste, bbox_este
) values
  ('unquillo', 'Unquillo', 'localidad', 'sierras_chicas', true, -31.2338964, -64.3182906, -31.2638964, -31.2038964, -64.3482906, -64.2882906),
  ('mendiolaza', 'Mendiolaza', 'localidad', 'sierras_chicas', true, -31.2686776, -64.2995018, -31.2986776, -31.2386776, -64.3295018, -64.2695018),
  ('villa-allende', 'Villa Allende', 'localidad', 'sierras_chicas', true, -31.2947833, -64.2987330, -31.3247833, -31.2647833, -64.3287330, -64.2687330),
  ('saldan', 'Saldán', 'localidad', 'sierras_chicas', true, -31.3169654, -64.3101406, -31.3469654, -31.2869654, -64.3401406, -64.2801406),
  ('la-calera', 'La Calera', 'localidad', 'sierras_chicas', true, -31.3454024, -64.3377462, -31.3754024, -31.3154024, -64.3677462, -64.3077462),
  ('villa-warcalde', 'Villa Warcalde', 'barrio', 'cordoba_norte', true, -31.3415758, -64.2931318, -31.3525758, -31.3305758, -64.3041318, -64.2821318),
  ('los-boulevares', 'Los Boulevares', 'barrio', 'cordoba_norte', true, -31.3433450, -64.2256220, -31.3543450, -31.3323450, -64.2366220, -64.2146220),
  ('jardin-claret', 'Jardín Claret', 'barrio', 'cordoba_norte', true, -31.3469338, -64.2400417, -31.3579338, -31.3359338, -64.2510417, -64.2290417),
  ('villa-belgrano', 'Villa Belgrano', 'barrio', 'cordoba_norte', true, -31.3576184, -64.2513770, -31.3686184, -31.3466184, -64.2623770, -64.2403770),
  ('arguello', 'Argüello', 'barrio', 'cordoba_norte', true, -31.3476928, -64.2643446, -31.3586928, -31.3366928, -64.2753446, -64.2533446),
  ('cerro-de-las-rosas', 'Cerro de las Rosas', 'barrio', 'cordoba_norte', true, -31.3761497, -64.2302497, -31.3871497, -31.3651497, -64.2412497, -64.2192497),
  ('alto-verde', 'Alto Verde', 'barrio', 'cordoba_norte', true, -31.3733291, -64.2177592, -31.3843291, -31.3623291, -64.2287592, -64.2067592),
  ('villa-cabrera', 'Villa Cabrera', 'barrio', 'cordoba_norte', true, -31.3851503, -64.2172850, -31.3961503, -31.3741503, -64.2282850, -64.2062850),
  ('alta-cordoba', 'Alta Córdoba', 'barrio', 'cordoba_norte', true, -31.3909536, -64.1838494, -31.4019536, -31.3799536, -64.1948494, -64.1728494)
on conflict (id) do nothing;

-- 2) Cada ficha queda asociada a una zona. zona (texto) se mantiene por compatibilidad.
alter table public.emprendimientos
  add column if not exists zona_id text references public.zonas(id);

-- 3) Altas públicas: solo fichas pendientes, sin dueño asignado y sin dirección pública.
--    La asignación de owner_id se hace solo después de verificar al titular, desde el servidor.
drop policy if exists "emprendimientos_alta_pendiente" on public.emprendimientos;
create policy "emprendimientos_alta_pendiente"
  on public.emprendimientos for insert
  to anon, authenticated
  with check (
    estado = 'pendiente'
    and owner_id is null
    and direccion_publica is null
  );

-- 4) Lectura pública: solo columnas necesarias para el directorio.
--    No exponen owner_id ni direccion_publica, aunque se consulte la API REST directamente.
revoke select on public.emprendimientos from anon, authenticated;
grant select (
  id, nombre, categoria, descripcion, zona, zona_id,
  lat, lng, whatsapp, instagram, imagen_url, created_at
) on public.emprendimientos to anon, authenticated;

-- 5) Las políticas de productos (migración 20261011) consultan emprendimientos.
--    Con la lectura por columnas, esas consultas fallarían para anon y authenticated.
--    Se resuelven con funciones SECURITY DEFINER que devuelven solo un booleano,
--    sin exponer datos de la ficha.
create or replace function public.emprendimiento_publicado(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.emprendimientos e
    where e.id = p_id and e.estado = 'aprobado'
  )
$$;

create or replace function public.emprendimiento_es_mio(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.emprendimientos e
    where e.id = p_id and e.owner_id = auth.uid()
  )
$$;

revoke all on function public.emprendimiento_publicado(uuid) from public;
grant execute on function public.emprendimiento_publicado(uuid) to anon, authenticated;
revoke all on function public.emprendimiento_es_mio(uuid) from public;
grant execute on function public.emprendimiento_es_mio(uuid) to anon, authenticated;

drop policy if exists "publico_ve_productos_publicados" on public.productos;
create policy "publico_ve_productos_publicados"
  on public.productos for select
  to anon, authenticated
  using (estado = 'publicado' and public.emprendimiento_publicado(emprendimiento_id));

drop policy if exists "comerciante_crea_productos_propios" on public.productos;
create policy "comerciante_crea_productos_propios"
  on public.productos for insert
  to authenticated
  with check (public.emprendimiento_es_mio(emprendimiento_id));

drop policy if exists "comerciante_ve_productos_propios" on public.productos;
create policy "comerciante_ve_productos_propios"
  on public.productos for select
  to authenticated
  using (public.emprendimiento_es_mio(emprendimiento_id));

drop policy if exists "comerciante_edita_productos_propios" on public.productos;
create policy "comerciante_edita_productos_propios"
  on public.productos for update
  to authenticated
  using (public.emprendimiento_es_mio(emprendimiento_id))
  with check (public.emprendimiento_es_mio(emprendimiento_id));

drop policy if exists "comerciante_borra_productos_propios" on public.productos;
create policy "comerciante_borra_productos_propios"
  on public.productos for delete
  to authenticated
  using (public.emprendimiento_es_mio(emprendimiento_id));

-- Nota: el catálogo de productos (migración 20261011) sigue pendiente de decisión para el MVP.
-- Esta migración solo ajusta sus políticas para que sigan funcionando con la nueva lectura por columnas.

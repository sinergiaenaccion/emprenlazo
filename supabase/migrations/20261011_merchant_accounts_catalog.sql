-- Emprenlazo: base para cuentas de comerciantes, horarios y catálogo independiente.
-- Ejecutar en Supabase SQL Editor después del esquema inicial.
-- Esta migración no activa pagos ni logística propia.

create extension if not exists pgcrypto;

-- Vincular cada ficha comercial con una cuenta autenticada.
alter table public.emprendimientos
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists horario_publico jsonb not null default '{}'::jsonb,
  add column if not exists acepta_retiro boolean not null default true,
  add column if not exists ofrece_entrega_propia boolean not null default false,
  add column if not exists direccion_publica text,
  add column if not exists localidad text,
  add column if not exists codigo_postal text;

create index if not exists emprendimientos_owner_id_idx
  on public.emprendimientos(owner_id);
create index if not exists emprendimientos_estado_categoria_idx
  on public.emprendimientos(estado, categoria);

-- Perfil privado de la cuenta comerciante.
create table if not exists public.perfiles_comerciante (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nombre_responsable text not null check (char_length(nombre_responsable) between 2 and 120),
  email_contacto text,
  telefono_contacto text,
  acepta_terminos_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.perfiles_comerciante enable row level security;

drop policy if exists "comerciante_lee_su_perfil" on public.perfiles_comerciante;
create policy "comerciante_lee_su_perfil"
  on public.perfiles_comerciante for select
  to authenticated using (auth.uid() = user_id);

drop policy if exists "comerciante_crea_su_perfil" on public.perfiles_comerciante;
create policy "comerciante_crea_su_perfil"
  on public.perfiles_comerciante for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists "comerciante_edita_su_perfil" on public.perfiles_comerciante;
create policy "comerciante_edita_su_perfil"
  on public.perfiles_comerciante for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Catálogo de productos independiente de la ficha del emprendimiento.
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  emprendimiento_id uuid not null references public.emprendimientos(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 120),
  descripcion text check (char_length(descripcion) <= 1000),
  precio numeric(12,2) check (precio is null or precio >= 0),
  moneda text not null default 'ARS' check (moneda in ('ARS')),
  imagen_url text,
  stock_disponible boolean not null default true,
  estado text not null default 'borrador' check (estado in ('borrador','publicado','pausado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists productos_emprendimiento_idx
  on public.productos(emprendimiento_id);
create index if not exists productos_estado_idx
  on public.productos(estado);

alter table public.productos enable row level security;

drop policy if exists "publico_ve_productos_publicados" on public.productos;
create policy "publico_ve_productos_publicados"
  on public.productos for select
  to anon, authenticated
  using (
    estado = 'publicado'
    and exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id
        and e.estado = 'aprobado'
    )
  );

drop policy if exists "comerciante_crea_productos_propios" on public.productos;
create policy "comerciante_crea_productos_propios"
  on public.productos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id
        and e.owner_id = auth.uid()
    )
  );

drop policy if exists "comerciante_ve_productos_propios" on public.productos;
create policy "comerciante_ve_productos_propios"
  on public.productos for select
  to authenticated
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id
        and e.owner_id = auth.uid()
    )
  );

drop policy if exists "comerciante_edita_productos_propios" on public.productos;
create policy "comerciante_edita_productos_propios"
  on public.productos for update
  to authenticated
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id
        and e.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id
        and e.owner_id = auth.uid()
    )
  );

drop policy if exists "comerciante_borra_productos_propios" on public.productos;
create policy "comerciante_borra_productos_propios"
  on public.productos for delete
  to authenticated
  using (
    exists (
      select 1 from public.emprendimientos e
      where e.id = productos.emprendimiento_id
        and e.owner_id = auth.uid()
    )
  );

-- Nota operativa: el alta pública existente sigue creando fichas pendientes.
-- La asignación de owner_id debe hacerse solo después de autenticación/verificación
-- y de validar que el usuario es dueño de la ficha; no confiar en un ID enviado por el cliente.

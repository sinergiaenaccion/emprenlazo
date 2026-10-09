-- Emprenlazo: esquema inicial. Ejecutar en Supabase → SQL Editor.

create table if not exists public.categorias (
  id text primary key,
  nombre text not null
);

insert into public.categorias (id, nombre) values
  ('gastronomia', 'Gastronomía'),
  ('belleza', 'Belleza y bienestar'),
  ('indumentaria', 'Indumentaria'),
  ('servicios', 'Servicios'),
  ('oficios', 'Oficios'),
  ('educacion', 'Educación'),
  ('tecnologia', 'Tecnología'),
  ('otros', 'Otros')
on conflict (id) do nothing;

create table if not exists public.emprendimientos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 80),
  categoria text not null references public.categorias(id),
  descripcion text check (char_length(descripcion) <= 500),
  zona text not null,
  lat double precision not null,
  lng double precision not null,
  whatsapp text check (whatsapp ~ '^[0-9]{8,15}$'),
  instagram text check (char_length(instagram) <= 31),
  imagen_url text,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  created_at timestamptz not null default now()
);

alter table public.categorias enable row level security;
alter table public.emprendimientos enable row level security;

drop policy if exists "categorias_lectura_publica" on public.categorias;
create policy "categorias_lectura_publica" on public.categorias for select using (true);

drop policy if exists "emprendimientos_lectura_aprobados" on public.emprendimientos;
create policy "emprendimientos_lectura_aprobados" on public.emprendimientos for select using (estado = 'aprobado');

drop policy if exists "emprendimientos_alta_pendiente" on public.emprendimientos;
create policy "emprendimientos_alta_pendiente" on public.emprendimientos for insert with check (estado = 'pendiente');
-- ============================================================
-- CALAIRE-APP — Schema Supabase
-- Ejecutar en el SQL Editor del proyecto Supabase
-- ============================================================

-- Habilitar extensión uuid
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- rondas
-- ------------------------------------------------------------
create table if not exists rondas (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,
  nombre      text not null,
  estado      text not null default 'borrador' check (estado in ('borrador','activa','cerrada')),
  created_at  timestamptz not null default now()
);

alter table rondas enable row level security;

-- Solo admin puede ver/modificar rondas (rol evaluado en app-layer)
create policy "admin_all_rondas" on rondas
  for all using (true) with check (true);

-- ------------------------------------------------------------
-- ronda_contaminantes
-- ------------------------------------------------------------
create table if not exists ronda_contaminantes (
  id           uuid primary key default gen_random_uuid(),
  ronda_id     uuid not null references rondas(id) on delete cascade,
  contaminante text not null check (contaminante in ('CO','SO2','O3','NO','NO2')),
  niveles      integer not null check (niveles >= 1),
  replicas     integer not null default 2 check (replicas in (2,3)),
  unique (ronda_id, contaminante)
);

alter table ronda_contaminantes enable row level security;

create policy "admin_all_contaminantes" on ronda_contaminantes
  for all using (true) with check (true);

-- ------------------------------------------------------------
-- ronda_participantes
-- ------------------------------------------------------------
create table if not exists ronda_participantes (
  id              uuid primary key default gen_random_uuid(),
  ronda_id        uuid not null references rondas(id) on delete cascade,
  workos_user_id  text not null,
  invitado_at     timestamptz not null default now(),
  unique (ronda_id, workos_user_id)
);

alter table ronda_participantes enable row level security;

-- Participante puede ver sus propias asignaciones (validado por workos_user_id en app-layer)
create policy "participante_sus_asignaciones" on ronda_participantes
  for select using (true);

create policy "admin_gestiona_participantes" on ronda_participantes
  for all using (true) with check (true);

-- ------------------------------------------------------------
-- envios
-- ------------------------------------------------------------
create table if not exists envios (
  id              uuid primary key default gen_random_uuid(),
  ronda_id        uuid not null references rondas(id) on delete cascade,
  workos_user_id  text not null,
  contaminante    text not null check (contaminante in ('CO','SO2','O3','NO','NO2')),
  nivel           integer not null check (nivel >= 1),
  valores         float[] not null,
  promedio        float,
  incertidumbre   float,
  submitted_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (ronda_id, workos_user_id, contaminante, nivel)
);

alter table envios enable row level security;

create policy "participante_sus_envios" on envios
  for all using (true) with check (true);

-- Trigger: actualiza updated_at en cada modificación
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger envios_updated_at
  before update on envios
  for each row execute function set_updated_at();

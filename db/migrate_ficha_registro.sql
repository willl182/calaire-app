-- ============================================================
-- Migración F-PSEA-05A — Hoja de Registro del Participante
-- Ejecutar en el SQL Editor del proyecto Supabase
-- ============================================================

-- Requiere: set_updated_at() ya definida en schema.sql

-- ------------------------------------------------------------
-- fichas_registro  (1:1 con ronda_participantes)
-- ------------------------------------------------------------
create table if not exists fichas_registro (
  id                       uuid primary key default gen_random_uuid(),
  ronda_participante_id    uuid not null references ronda_participantes(id) on delete cascade,

  -- Sección 2: Datos del participante
  nombre_laboratorio       text,
  nombre_responsable       text,
  cargo                    text,
  ciudad                   text,
  departamento             text,
  telefono                 text,

  -- Sección 6: Logística
  transporte               text,
  hora_llegada             text,
  estacionamiento          boolean not null default false,
  observaciones            text,

  -- Sección 7: Declaraciones
  dec_datos_correctos      boolean not null default false,
  dec_acepta_condiciones   boolean not null default false,
  dec_compromisos          boolean not null default false,
  dec_firma_autorizada     boolean not null default false,
  nombre_firma             text,

  estado                   text not null default 'borrador'
                             check (estado in ('borrador', 'enviado')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  unique (ronda_participante_id)
);

alter table fichas_registro enable row level security;

create policy "all_fichas_registro" on fichas_registro
  for all using (true) with check (true);

create trigger fichas_registro_updated_at
  before update on fichas_registro
  for each row execute function set_updated_at();

create index if not exists fichas_registro_rp_idx
  on fichas_registro (ronda_participante_id);

-- ------------------------------------------------------------
-- fichas_registro_acompanantes  (0-N por ficha)
-- ------------------------------------------------------------
create table if not exists fichas_registro_acompanantes (
  id                  uuid primary key default gen_random_uuid(),
  ficha_id            uuid not null references fichas_registro(id) on delete cascade,
  sort_order          integer not null,
  nombre_completo     text not null default '',
  documento_identidad text not null default '',
  rol                 text not null default ''
);

alter table fichas_registro_acompanantes enable row level security;

create policy "all_fichas_acompanantes" on fichas_registro_acompanantes
  for all using (true) with check (true);

create index if not exists fichas_acompanantes_ficha_idx
  on fichas_registro_acompanantes (ficha_id);

-- ------------------------------------------------------------
-- fichas_registro_analizadores  (0-N por ficha)
-- ------------------------------------------------------------
create table if not exists fichas_registro_analizadores (
  id                      uuid primary key default gen_random_uuid(),
  ficha_id                uuid not null references fichas_registro(id) on delete cascade,
  sort_order              integer not null,
  analito                 text not null default '',
  fabricante              text not null default '',
  modelo                  text not null default '',
  numero_serie            text not null default '',
  metodo_epa              text not null default '',
  fecha_ultima_calibracion date,
  tipo_verificacion       text not null default '',
  incertidumbre_declarada text not null default '',
  unidad_salida           text not null default ''
);

alter table fichas_registro_analizadores enable row level security;

create policy "all_fichas_analizadores" on fichas_registro_analizadores
  for all using (true) with check (true);

create index if not exists fichas_analizadores_ficha_idx
  on fichas_registro_analizadores (ficha_id);

-- ------------------------------------------------------------
-- fichas_registro_instrumentos  (0-N por ficha)
-- ------------------------------------------------------------
create table if not exists fichas_registro_instrumentos (
  id           uuid primary key default gen_random_uuid(),
  ficha_id     uuid not null references fichas_registro(id) on delete cascade,
  sort_order   integer not null,
  equipo       text not null default '',
  marca_modelo text not null default '',
  numero_serie text not null default '',
  cantidad     integer not null default 1 check (cantidad >= 1)
);

alter table fichas_registro_instrumentos enable row level security;

create policy "all_fichas_instrumentos" on fichas_registro_instrumentos
  for all using (true) with check (true);

create index if not exists fichas_instrumentos_ficha_idx
  on fichas_registro_instrumentos (ficha_id);

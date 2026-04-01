-- ============================================================
-- USIL Ventures OS — Schema
-- ============================================================

-- ------------------------------------------------------------
-- startups
-- ------------------------------------------------------------
create table public.startups (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  generacion       text,
  tipo             text,                   -- 'Innovadores' | 'Dinámicos' | etc.
  estado           text,                   -- 'activa' | 'inactiva'
  riesgo           text,                   -- 'bajo' | 'medio' | 'alto'
  cantidad_hitos   integer,
  drive_url        text not null,          -- obligatorio
  cdch_url         text,                   -- opcional
  objetivo_general text,
  created_at       timestamptz default now()
);

-- ------------------------------------------------------------
-- startup_contacts
-- uno o más contactos por startup
-- ------------------------------------------------------------
create table public.startup_contacts (
  id           uuid primary key default gen_random_uuid(),
  startup_id   uuid not null references public.startups (id) on delete cascade,
  responsable  text,
  correo       text,
  celular      text,
  created_at   timestamptz default now()
);

-- ------------------------------------------------------------
-- startup_hitos
-- hitos/milestones ordenados por startup
-- ------------------------------------------------------------
create table public.startup_hitos (
  id           uuid primary key default gen_random_uuid(),
  startup_id   uuid not null references public.startups (id) on delete cascade,
  nombre       text,
  descripcion  text,
  orden        integer,                    -- 1, 2, 3 …
  estado       text,                       -- 'pendiente' | 'en_progreso' | 'completado'
  fecha_inicio date,
  fecha_fin    date,
  created_at   timestamptz default now()
);

-- ------------------------------------------------------------
-- hito_activities
-- actividades individuales dentro de un hito
-- ------------------------------------------------------------
create table public.hito_activities (
  id           uuid primary key default gen_random_uuid(),
  hito_id      uuid not null references public.startup_hitos (id) on delete cascade,
  descripcion  text,
  estado       text,                       -- 'pendiente' | 'completado'
  fecha        date,
  notas        text,
  created_at   timestamptz default now()
);

-- ------------------------------------------------------------
-- pendientes
-- tareas internas; pueden o no estar ligadas a una startup
-- ------------------------------------------------------------
create table public.pendientes (
  id           uuid primary key default gen_random_uuid(),
  startup_id   uuid references public.startups (id) on delete set null,
  titulo       text,
  descripcion  text,
  estado       text default 'pendiente',  -- 'pendiente' | 'completado'
  fecha_limite date,
  created_at   timestamptz default now()
);

-- ------------------------------------------------------------
-- reuniones
-- pueden o no estar ligadas a una startup
-- ------------------------------------------------------------
create table public.reuniones (
  id           uuid primary key default gen_random_uuid(),
  startup_id   uuid references public.startups (id) on delete set null,
  titulo       text,
  descripcion  text,
  fecha        timestamptz,
  link         text,
  notas        text,
  created_at   timestamptz default now()
);

-- ============================================================
-- Row Level Security — solo usuarios autenticados
-- ============================================================

alter table public.startups          enable row level security;
alter table public.startup_contacts  enable row level security;
alter table public.startup_hitos     enable row level security;
alter table public.hito_activities   enable row level security;
alter table public.pendientes        enable row level security;
alter table public.reuniones         enable row level security;

-- startups
create policy "authenticated read startups"
  on public.startups for select
  to authenticated using (true);

create policy "authenticated write startups"
  on public.startups for all
  to authenticated using (true) with check (true);

-- startup_contacts
create policy "authenticated read contacts"
  on public.startup_contacts for select
  to authenticated using (true);

create policy "authenticated write contacts"
  on public.startup_contacts for all
  to authenticated using (true) with check (true);

-- startup_hitos
create policy "authenticated read hitos"
  on public.startup_hitos for select
  to authenticated using (true);

create policy "authenticated write hitos"
  on public.startup_hitos for all
  to authenticated using (true) with check (true);

-- hito_activities
create policy "authenticated read activities"
  on public.hito_activities for select
  to authenticated using (true);

create policy "authenticated write activities"
  on public.hito_activities for all
  to authenticated using (true) with check (true);

-- pendientes
create policy "authenticated read pendientes"
  on public.pendientes for select
  to authenticated using (true);

create policy "authenticated write pendientes"
  on public.pendientes for all
  to authenticated using (true) with check (true);

-- reuniones
create policy "authenticated read reuniones"
  on public.reuniones for select
  to authenticated using (true);

create policy "authenticated write reuniones"
  on public.reuniones for all
  to authenticated using (true) with check (true);

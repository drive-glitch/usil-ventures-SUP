-- ============================================================
-- Indicadores estructurados por hito + checklist documental
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Tabla de indicadores de éxito por hito
create table public.hito_indicadores (
  id         uuid primary key default gen_random_uuid(),
  hito_id    uuid not null references public.startup_hitos(id) on delete cascade,
  nombre     text,
  unidad     text,           -- "S/", "%", "usuarios", etc.
  meta       numeric default 0,
  actual     numeric default 0,
  orden      integer default 1,
  created_at timestamptz default now()
);

alter table public.hito_indicadores enable row level security;

create policy "authenticated all hito_indicadores"
  on public.hito_indicadores for all
  to authenticated using (true) with check (true);

-- Checklist documental en cada hito (vale 20% del avance)
alter table public.startup_hitos
  add column if not exists doc_tecnica    boolean default false,
  add column if not exists doc_financiera boolean default false,
  add column if not exists doc_reporte    boolean default false;

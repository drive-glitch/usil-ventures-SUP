-- ============================================================
-- USIL Ventures OS — Alteraciones para modal de creación
-- Ejecutar DESPUÉS de 01_schema.sql
-- ============================================================

-- startup_contacts: diferenciar responsable vs ejecutivo ProInnóvate
alter table public.startup_contacts
  add column if not exists rol text;   -- 'responsable' | 'ejecutivo_proinnóvate'

-- startup_hitos: agregar campo de indicadores
alter table public.startup_hitos
  add column if not exists indicadores text;

-- ============================================================
-- Agrega columnas a reuniones + bucket de storage
-- Ejecutar en Supabase SQL Editor
-- ============================================================

alter table public.reuniones add column if not exists acuerdos       text;
alter table public.reuniones add column if not exists proximos_pasos text;
alter table public.reuniones add column if not exists screenshot_url text;

-- ── Storage bucket para screenshots ──────────────────────────
insert into storage.buckets (id, name, public)
values ('reuniones-screenshots', 'reuniones-screenshots', true)
on conflict (id) do nothing;

-- Usuarios autenticados pueden subir
create policy "authenticated upload reuniones"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'reuniones-screenshots');

-- Lectura pública (para mostrar las imágenes)
create policy "public read reuniones screenshots"
  on storage.objects for select
  using (bucket_id = 'reuniones-screenshots');

-- Usuarios autenticados pueden borrar sus propios archivos
create policy "authenticated delete reuniones"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'reuniones-screenshots');

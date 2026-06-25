-- ============================================================
-- FletApp — Almacenamiento de documentos por envío
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Bucket privado para documentos de envíos
insert into storage.buckets (id, name, public)
values ('shipment-docs', 'shipment-docs', false)
on conflict (id) do nothing;

-- 2. Seguridad: cada usuario solo accede a su propia carpeta
--    Ruta de archivos: {user_id}/{ref_envio}/{archivo}
--    storage.foldername(name)[1] = user_id

drop policy if exists "own docs select" on storage.objects;
create policy "own docs select" on storage.objects
  for select to authenticated
  using (bucket_id = 'shipment-docs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own docs insert" on storage.objects;
create policy "own docs insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shipment-docs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own docs delete" on storage.objects;
create policy "own docs delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'shipment-docs' and (storage.foldername(name))[1] = auth.uid()::text);

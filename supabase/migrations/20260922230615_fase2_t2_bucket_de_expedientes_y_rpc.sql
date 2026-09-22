-- Fase 2, Tarea 2: donde viven los papeles del transportista.
--
-- Bucket aparte del de envios: el expediente de un transportista no es del
-- embarcador y no debe caer bajo las mismas politicas por carpeta.

insert into storage.buckets (id, name, public)
values ('carrier-docs', 'carrier-docs', false)
on conflict (id) do nothing;

-- Solo el operador toca el expediente. Cuando exista login de transportista se
-- agrega una politica que lo deje ver y subir SU propia carpeta.
create policy "carrier-docs: el operador lee"
  on storage.objects for select
  using (bucket_id = 'carrier-docs' and (select public.es_operador()));

create policy "carrier-docs: el operador sube"
  on storage.objects for insert
  with check (bucket_id = 'carrier-docs' and (select public.es_operador()));

create policy "carrier-docs: el operador reemplaza"
  on storage.objects for update
  using (bucket_id = 'carrier-docs' and (select public.es_operador()));


-- El navegador no escribe en carrier_documents: no hay politica de INSERT.
-- Sube el archivo al bucket y registra la fila por aqui.
create or replace function public.registrar_documento(
  tipo        text,
  storage_path text,
  carrier     uuid default null,
  vehiculo    uuid default null,
  conductor   uuid default null,
  vence_el    date default null
)
returns public.carrier_documents
language plpgsql security definer set search_path = 'public'
as $$
declare d public.carrier_documents;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede registrar documentos' using errcode = '42501';
  end if;

  if (carrier is not null)::int + (vehiculo is not null)::int + (conductor is not null)::int <> 1 then
    raise exception 'El documento pertenece a exactamente un transportista, una unidad o un operador'
      using errcode = '22023';
  end if;

  if not exists (select 1 from document_types where clave = tipo) then
    raise exception 'Tipo de documento desconocido: %', tipo using errcode = '22023';
  end if;

  if coalesce(trim(storage_path), '') = '' then
    raise exception 'Falta la ruta del archivo' using errcode = '22023';
  end if;

  -- Reemplazar un documento del mismo tipo para el mismo dueno es normal:
  -- la poliza se renueva, la tarjeta de circulacion cambia. Se sustituye la
  -- fila anterior en vez de acumular versiones que nadie va a revisar.
  delete from carrier_documents
   where tipo = registrar_documento.tipo
     and carrier_id is not distinct from carrier
     and vehicle_id is not distinct from vehiculo
     and driver_id  is not distinct from conductor;

  insert into carrier_documents (tipo, carrier_id, vehicle_id, driver_id, storage_path, vence_el)
  values (registrar_documento.tipo, carrier, vehiculo, conductor,
          trim(storage_path), registrar_documento.vence_el)
  returning * into d;

  return d;
end; $$;

revoke execute on function public.registrar_documento(text, text, uuid, uuid, uuid, date) from public, anon;
grant execute on function public.registrar_documento(text, text, uuid, uuid, uuid, date) to authenticated;

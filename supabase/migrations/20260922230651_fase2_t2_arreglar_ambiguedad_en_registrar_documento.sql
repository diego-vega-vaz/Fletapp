-- `where tipo = registrar_documento.tipo` era ambiguo: `tipo` podia ser la
-- columna o el parametro, y Postgres se niega a adivinar. Se califican las
-- dos columnas con el nombre de la tabla.
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

  if not exists (select 1 from document_types dt where dt.clave = registrar_documento.tipo) then
    raise exception 'Tipo de documento desconocido: %', registrar_documento.tipo using errcode = '22023';
  end if;

  if coalesce(trim(registrar_documento.storage_path), '') = '' then
    raise exception 'Falta la ruta del archivo' using errcode = '22023';
  end if;

  -- Reemplazar un documento del mismo tipo para el mismo dueno es normal:
  -- la poliza se renueva, la tarjeta de circulacion cambia. Se sustituye la
  -- fila anterior en vez de acumular versiones que nadie va a revisar.
  delete from carrier_documents cd
   where cd.tipo = registrar_documento.tipo
     and cd.carrier_id is not distinct from registrar_documento.carrier
     and cd.vehicle_id is not distinct from registrar_documento.vehiculo
     and cd.driver_id  is not distinct from registrar_documento.conductor;

  insert into carrier_documents (tipo, carrier_id, vehicle_id, driver_id, storage_path, vence_el)
  values (registrar_documento.tipo, registrar_documento.carrier, registrar_documento.vehiculo,
          registrar_documento.conductor, trim(registrar_documento.storage_path),
          registrar_documento.vence_el)
  returning * into d;

  return d;
end; $$;

revoke execute on function public.registrar_documento(text, text, uuid, uuid, uuid, date) from public, anon;
grant execute on function public.registrar_documento(text, text, uuid, uuid, uuid, date) to authenticated;

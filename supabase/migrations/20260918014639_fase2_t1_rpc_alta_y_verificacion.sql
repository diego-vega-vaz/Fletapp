-- Altas y verificacion. Todo exige operador y lo valida el servidor.

create or replace function public.alta_transportista(
  razon_social text,
  rfc          text default null,
  contacto     text default null,
  telefono     text default null,
  email        text default null,
  nombre_corto text default null
)
returns public.carriers
language plpgsql security definer set search_path = 'public'
as $$
declare c public.carriers;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede dar de alta transportistas' using errcode = '42501';
  end if;
  if coalesce(trim(razon_social), '') = '' then
    raise exception 'La razon social es obligatoria' using errcode = '22023';
  end if;

  insert into carriers (razon_social, rfc, contacto, telefono, email, nombre_corto)
  values (trim(razon_social), nullif(upper(trim(rfc)), ''), nullif(trim(contacto), ''),
          nullif(trim(telefono), ''), nullif(lower(trim(email)), ''), nullif(trim(nombre_corto), ''))
  returning * into c;
  return c;
end; $$;

create or replace function public.alta_unidad(
  carrier   uuid,
  placas    text,
  tipo      text default null,
  num_economico text default null,
  marca text default null, modelo text default null, anio int default null
)
returns public.vehicles
language plpgsql security definer set search_path = 'public'
as $$
declare v public.vehicles;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede dar de alta unidades' using errcode = '42501';
  end if;
  if coalesce(trim(placas), '') = '' then
    raise exception 'Las placas son obligatorias' using errcode = '22023';
  end if;

  insert into vehicles (carrier_id, placas, tipo, num_economico, marca, modelo, anio)
  values (carrier, upper(trim(placas)), nullif(trim(tipo), ''), nullif(trim(num_economico), ''),
          nullif(trim(marca), ''), nullif(trim(modelo), ''), anio)
  returning * into v;
  return v;
end; $$;

create or replace function public.alta_operador(
  carrier uuid,
  nombre  text,
  licencia_federal text default null,
  telefono text default null
)
returns public.drivers
language plpgsql security definer set search_path = 'public'
as $$
declare d public.drivers;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede dar de alta conductores' using errcode = '42501';
  end if;
  if coalesce(trim(nombre), '') = '' then
    raise exception 'El nombre es obligatorio' using errcode = '22023';
  end if;

  insert into drivers (carrier_id, nombre, licencia_federal, telefono)
  values (carrier, trim(nombre), nullif(upper(trim(licencia_federal)), ''), nullif(trim(telefono), ''))
  returning * into d;
  return d;
end; $$;


-- Revisar un documento del expediente. Rechazar exige motivo: un "rechazado"
-- sin razon es una llamada telefonica que alguien va a tener que hacer igual.
create or replace function public.revisar_documento(
  documento uuid,
  aprobado  boolean,
  motivo    text default null,
  vence_el  date default null
)
returns public.carrier_documents
language plpgsql security definer set search_path = 'public'
as $$
declare d public.carrier_documents;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede revisar documentos' using errcode = '42501';
  end if;
  if not aprobado and coalesce(trim(motivo), '') = '' then
    raise exception 'Rechazar un documento exige motivo' using errcode = '22023';
  end if;

  update carrier_documents
     set estatus = case when aprobado then 'aprobado' else 'rechazado' end::estatus_documento,
         motivo_rechazo = case when aprobado then null else trim(motivo) end,
         vence_el = coalesce(revisar_documento.vence_el, carrier_documents.vence_el),
         revisado_por = auth.uid(),
         revisado_en = now()
   where id = documento
  returning * into d;

  if not found then
    raise exception 'Documento no encontrado' using errcode = 'P0002';
  end if;
  return d;
end; $$;


-- Que le falta a un transportista para quedar verificado.
-- Devuelve renglones; si no devuelve ninguno, esta completo.
create or replace function public.faltantes_transportista(carrier uuid)
returns table (ambito text, entidad_id uuid, entidad text, tipo text, nombre text, motivo text)
language sql stable security definer set search_path = 'public'
as $$
  -- Documentos requeridos del transportista
  select 'carrier', c.id, c.razon_social, dt.clave, dt.nombre,
         case when d.id is null then 'falta'
              when d.estatus <> 'aprobado' then 'sin aprobar'
              else 'vencido' end
  from carriers c
  cross join document_types dt
  left join carrier_documents d
    on d.carrier_id = c.id and d.tipo = dt.clave and d.estatus = 'aprobado'
   and (d.vence_el is null or d.vence_el >= current_date)
  where c.id = carrier and dt.aplica_a = 'carrier' and dt.requerido and d.id is null

  union all
  -- De cada unidad
  select 'vehicle', v.id, v.placas, dt.clave, dt.nombre,
         case when d.id is null then 'falta' else 'vencido' end
  from vehicles v
  cross join document_types dt
  left join carrier_documents d
    on d.vehicle_id = v.id and d.tipo = dt.clave and d.estatus = 'aprobado'
   and (d.vence_el is null or d.vence_el >= current_date)
  where v.carrier_id = carrier and dt.aplica_a = 'vehicle' and dt.requerido and d.id is null

  union all
  -- De cada operador
  select 'driver', dr.id, dr.nombre, dt.clave, dt.nombre,
         case when d.id is null then 'falta' else 'vencido' end
  from drivers dr
  cross join document_types dt
  left join carrier_documents d
    on d.driver_id = dr.id and d.tipo = dt.clave and d.estatus = 'aprobado'
   and (d.vence_el is null or d.vence_el >= current_date)
  where dr.carrier_id = carrier and dt.aplica_a = 'driver' and dt.requerido and d.id is null;
$$;


-- Verificar. No es un boton que pinta de verde: si falta un papel, falla y
-- dice cual. Esa es toda la diferencia entre verificar y decir que verificas.
create or replace function public.verificar_transportista(carrier uuid)
returns public.carriers
language plpgsql security definer set search_path = 'public'
as $$
declare
  c public.carriers;
  faltan int;
  detalle text;
  n_unidades int;
  n_operadores int;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede verificar transportistas' using errcode = '42501';
  end if;

  select count(*) into n_unidades   from vehicles where carrier_id = carrier;
  select count(*) into n_operadores from drivers  where carrier_id = carrier;
  if n_unidades = 0 or n_operadores = 0 then
    raise exception 'Un transportista verificado necesita al menos una unidad y un operador dados de alta'
      using errcode = '22023';
  end if;

  select count(*), string_agg(nombre || ' (' || entidad || ': ' || motivo || ')', '; ')
    into faltan, detalle
  from public.faltantes_transportista(carrier);

  if faltan > 0 then
    raise exception 'Faltan % documentos: %', faltan, detalle using errcode = '22023';
  end if;

  update carriers
     set estatus = 'verificado', verificado_en = now(), verificado_por = auth.uid()
   where id = carrier
  returning * into c;

  if not found then
    raise exception 'Transportista no encontrado' using errcode = 'P0002';
  end if;
  return c;
end; $$;


create or replace function public.suspender_transportista(carrier uuid, motivo text)
returns public.carriers
language plpgsql security definer set search_path = 'public'
as $$
declare c public.carriers;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede suspender transportistas' using errcode = '42501';
  end if;
  if coalesce(trim(motivo), '') = '' then
    raise exception 'Suspender exige motivo' using errcode = '22023';
  end if;

  update carriers
     set estatus = 'suspendido',
         notas = coalesce(notas || E'\n', '') || to_char(now(), 'YYYY-MM-DD') || ' suspendido: ' || trim(motivo)
   where id = carrier
  returning * into c;

  if not found then
    raise exception 'Transportista no encontrado' using errcode = 'P0002';
  end if;
  return c;
end; $$;


do $$
declare f text;
begin
  foreach f in array array[
    'alta_transportista(text,text,text,text,text,text)',
    'alta_unidad(uuid,text,text,text,text,text,int)',
    'alta_operador(uuid,text,text,text)',
    'revisar_documento(uuid,boolean,text,date)',
    'faltantes_transportista(uuid)',
    'verificar_transportista(uuid)',
    'suspender_transportista(uuid,text)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

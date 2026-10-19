-- Conecta las dos mitades del marketplace.
--
-- EL PROBLEMA (encontrado el 16 oct 2026 al ensayar el flujo completo)
--
-- asignar_unidad() recibia el transportista como TEXTO LIBRE y escribia
-- shipments.carrier, .plate y .driver. Nunca escribia shipments.carrier_id.
--
-- Pero todo el lado del transportista filtra por carrier_id: sus politicas de
-- lectura y reportar_avance(), que exige s.carrier_id = public.mi_carrier().
--
-- Consecuencia: un envio asignado desde la consola JAMAS le aparecia al
-- transportista, y el transportista NUNCA podia reportar avance.
--
-- Segundo problema del texto libre: nada impedia asignarle un envio a un
-- transportista inexistente, o existente pero NO verificado.
--
-- NOTA DE APLICACION: en esta base cualquier DROP FUNCTION se queda colgado
-- (ver decisiones.md, 19 oct 2026). Por eso la version vieja no se borra: se
-- reemplaza por un cuerpo que lanza error y manda a la nueva firma.

create or replace function public.asignar_unidad(
  envio_id uuid,
  carrier  uuid,
  unidad   uuid,
  operador uuid default null
)
returns public.shipments
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  s public.shipments;
  c public.carriers;
  v public.vehicles;
  d public.drivers;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede asignar unidad' using errcode = '42501';
  end if;

  select * into c from public.carriers where id = carrier;
  if not found then
    raise exception 'Ese transportista no existe' using errcode = 'P0002';
  end if;
  if c.estatus is distinct from 'verificado' then
    raise exception 'El transportista % no esta verificado (estatus: %). Un envio solo se asigna a transportistas verificados',
      c.razon_social, coalesce(c.estatus, 'sin estatus') using errcode = '22023';
  end if;

  select * into v from public.vehicles where id = unidad;
  if not found then
    raise exception 'Esa unidad no existe' using errcode = 'P0002';
  end if;
  if v.carrier_id is distinct from carrier then
    raise exception 'La unidad % no es de %', v.placas, c.razon_social using errcode = '22023';
  end if;

  if operador is not null then
    select * into d from public.drivers where id = operador;
    if not found then
      raise exception 'Ese operador no existe' using errcode = 'P0002';
    end if;
    if d.carrier_id is distinct from carrier then
      raise exception 'El operador % no es de %', d.nombre, c.razon_social using errcode = '22023';
    end if;
  end if;

  update public.shipments
     set carrier_id = carrier,
         carrier    = c.razon_social,
         plate      = v.placas,
         driver     = d.nombre
   where id = envio_id
  returning * into s;

  if s.id is null then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (envio_id, s.status,
          'Unidad asignada: ' || c.razon_social || ' - placas ' || v.placas
            || coalesce(' - operador ' || d.nombre, ''),
          auth.uid());

  return s;
end;
$function$;

revoke execute on function public.asignar_unidad(uuid, uuid, uuid, uuid) from public;
revoke execute on function public.asignar_unidad(uuid, uuid, uuid, uuid) from anon;

-- La firma vieja no se puede borrar (DROP FUNCTION se cuelga en esta base).
-- Se deja inservible para que nadie asigne por texto libre sin darse cuenta.
create or replace function public.asignar_unidad(
  envio_id        uuid,
  transportista   text,
  operador_nombre text,
  placas          text
)
returns public.shipments
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  raise exception 'Esta version de asignar_unidad() quedo retirada el 19 oct 2026. Usa asignar_unidad(envio_id uuid, carrier uuid, unidad uuid, operador uuid), que escribe carrier_id y exige transportista verificado'
    using errcode = '0A000';
end;
$function$;

revoke execute on function public.asignar_unidad(uuid, text, text, text) from public;
revoke execute on function public.asignar_unidad(uuid, text, text, text) from anon;
revoke execute on function public.asignar_unidad(uuid, text, text, text) from authenticated;

-- Sobra de un diagnostico del 19 oct 2026; tampoco se puede borrar.
create or replace function public.ping_prueba_ddl() returns int
language sql immutable as $$ select 1 $$;
comment on function public.ping_prueba_ddl() is 'Resto de diagnostico (19 oct 2026). No se usa. No se puede borrar porque DROP FUNCTION se cuelga en esta base.';
revoke execute on function public.ping_prueba_ddl() from public;
revoke execute on function public.ping_prueba_ddl() from anon;
revoke execute on function public.ping_prueba_ddl() from authenticated;
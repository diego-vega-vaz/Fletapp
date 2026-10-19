-- Arregla asignar_unidad(uuid,uuid,uuid,uuid), aplicada horas antes hoy mismo.
--
-- El ensayo de punta a punta (tests/ensayo-operacion.sql) la reprobo:
--   ERROR: column reference "carrier" is ambiguous
-- El parametro se llama "carrier" y shipments tambien tiene una columna
-- "carrier", asi que el UPDATE no sabia a cual se referia y la asignacion
-- fallaba entera. Nunca llego a correr en la app: la consola de operacion se
-- suelta en este mismo despliegue.
--
-- Se conservan los nombres de los parametros porque son los que manda el
-- frontend por RPC; adentro se copian a variables locales con prefijo.

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
  v_envio    uuid := envio_id;
  v_carrier  uuid := carrier;
  v_unidad   uuid := unidad;
  v_operador uuid := operador;
  s public.shipments;
  c public.carriers;
  v public.vehicles;
  d public.drivers;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede asignar unidad' using errcode = '42501';
  end if;

  select * into c from public.carriers where id = v_carrier;
  if not found then
    raise exception 'Ese transportista no existe' using errcode = 'P0002';
  end if;
  if c.estatus is distinct from 'verificado' then
    raise exception 'El transportista % no esta verificado (estatus: %). Un envio solo se asigna a transportistas verificados',
      c.razon_social, coalesce(c.estatus, 'sin estatus') using errcode = '22023';
  end if;

  select * into v from public.vehicles where id = v_unidad;
  if not found then
    raise exception 'Esa unidad no existe' using errcode = 'P0002';
  end if;
  if v.carrier_id is distinct from v_carrier then
    raise exception 'La unidad % no es de %', v.placas, c.razon_social using errcode = '22023';
  end if;

  if v_operador is not null then
    select * into d from public.drivers where id = v_operador;
    if not found then
      raise exception 'Ese operador no existe' using errcode = 'P0002';
    end if;
    if d.carrier_id is distinct from v_carrier then
      raise exception 'El operador % no es de %', d.nombre, c.razon_social using errcode = '22023';
    end if;
  end if;

  update public.shipments
     set carrier_id = v_carrier,
         carrier    = c.razon_social,
         plate      = v.placas,
         driver     = d.nombre
   where id = v_envio
  returning * into s;

  if s.id is null then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (v_envio, s.status,
          'Unidad asignada: ' || c.razon_social || ' - placas ' || v.placas
            || coalesce(' - operador ' || d.nombre, ''),
          auth.uid());

  return s;
end;
$function$;

revoke execute on function public.asignar_unidad(uuid, uuid, uuid, uuid) from public;
revoke execute on function public.asignar_unidad(uuid, uuid, uuid, uuid) from anon;
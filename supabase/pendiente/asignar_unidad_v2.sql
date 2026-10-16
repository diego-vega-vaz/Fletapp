-- PENDIENTE DE APLICAR. Ver supabase/pendiente/LEEME.md
--
-- Por que no esta aplicada todavia: cambia la FIRMA de asignar_unidad(), asi
-- que aplicarla sin actualizar al mismo tiempo src/lib/roles.ts y la consola
-- de operacion deja la consola llamando a una funcion que ya no existe. Las
-- dos cosas se sueltan juntas, en el mismo despliegue.
--
-- ───────────────────────────────────────────────────────────────────────────
-- EL PROBLEMA (encontrado el 16 oct 2026 al ensayar el flujo completo)
--
-- asignar_unidad() no conectaba las dos mitades del marketplace. Recibia el
-- transportista como TEXTO LIBRE y escribia shipments.carrier, .plate y
-- .driver. Nunca escribia shipments.carrier_id.
--
-- Pero todo el lado del transportista filtra por carrier_id: sus politicas de
-- lectura y reportar_avance(), que exige s.carrier_id = public.mi_carrier().
--
-- Consecuencia: un envio asignado desde la consola JAMAS le aparece al
-- transportista, y el transportista NUNCA puede reportar avance. Las dos
-- mitades se construyeron en tareas distintas y el enlace nunca se hizo. Como
-- no se ha operado un envio real, no habia salido.
--
-- Segundo problema del texto libre: nada impide asignarle un envio a un
-- transportista inexistente, o existente pero NO verificado. "Transportistas
-- verificados" es la promesa central del producto y no estaba sostenida en el
-- unico punto donde importa.
-- ───────────────────────────────────────────────────────────────────────────

drop function if exists public.asignar_unidad(uuid, text, text, text);

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

  if not found then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (envio_id, s.status,
          'Unidad asignada: ' || c.razon_social || ' · placas ' || v.placas
            || coalesce(' · operador ' || d.nombre, ''),
          auth.uid());

  return s;
end;
$function$;

revoke execute on function public.asignar_unidad(uuid, uuid, uuid, uuid) from public;
revoke execute on function public.asignar_unidad(uuid, uuid, uuid, uuid) from anon;

-- El operador ofrece un envio a un transportista verificado, con su monto.
--
-- Reglas:
--  - Solo el operador ofrece.
--  - Solo a transportistas verificados. Misma regla que asignar_unidad():
--    la promesa de "transportistas verificados" se sostiene en los dos lados.
--  - No se puede ofrecer un envio que ya tiene camion asignado.
--  - No puede haber dos ofertas vivas del mismo envio (lo impide un indice).
--  - Si el envio ya tiene costo_transportista capturado y el monto ofrecido
--    es distinto, se actualiza el costo y por lo tanto la comision. El
--    dinero que vale es el que se ofrecio de verdad, no el que se estimo.
--  - El monto no puede dejar la comision en cero o negativa.

create or replace function public.ofrecer_envio(
  envio_id uuid,
  carrier  uuid,
  monto    numeric,
  nota     text default null,
  horas    integer default 24
)
returns public.carrier_offers
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_envio   uuid := envio_id;
  v_carrier uuid := carrier;
  v_monto   numeric := monto;
  s public.shipments;
  c public.carriers;
  o public.carrier_offers;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede ofrecer un envio' using errcode = '42501';
  end if;

  select * into s from public.shipments where id = v_envio;
  if not found then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  if s.carrier_id is not null then
    raise exception 'Ese envio ya tiene transportista asignado' using errcode = '22023';
  end if;

  select * into c from public.carriers where id = v_carrier;
  if not found then
    raise exception 'Ese transportista no existe' using errcode = 'P0002';
  end if;
  if c.estatus is distinct from 'verificado' then
    raise exception 'El transportista % no esta verificado (estatus: %). Un envio solo se ofrece a transportistas verificados',
      c.razon_social, coalesce(c.estatus, 'sin estatus') using errcode = '22023';
  end if;

  if v_monto is null or v_monto <= 0 then
    raise exception 'El monto para el transportista tiene que ser mayor a cero'
      using errcode = '22023';
  end if;

  if s.price is not null and s.price - v_monto <= 0 then
    raise exception 'Con ese monto la comision seria % y el flete perderia dinero',
      to_char(s.price - v_monto, 'FM999999999.00') using errcode = '22023';
  end if;

  if exists (select 1 from public.carrier_offers
              where shipment_id = v_envio and estatus = 'ofrecida') then
    raise exception 'Ese envio ya tiene una oferta esperando respuesta. Cancelala antes de ofrecerlo a otro'
      using errcode = '22023';
  end if;

  insert into public.carrier_offers
    (shipment_id, carrier_id, monto, nota, ofrecida_por, vence_en)
  values
    (v_envio, v_carrier, v_monto, nullif(trim(coalesce(nota,'')),''), auth.uid(),
     now() + make_interval(hours => greatest(coalesce(horas, 24), 1)))
  returning * into o;

  -- El monto ofrecido manda sobre el costo estimado: es el que se va a pagar.
  update public.shipments
     set costo_transportista = v_monto,
         comision            = case when price is not null then price - v_monto end
   where id = v_envio;

  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (v_envio, s.status,
          'Ofrecido a ' || c.razon_social || ' por '
            || to_char(v_monto, 'FM999,999,999.00') || ' MXN',
          auth.uid());

  return o;
end;
$function$;

create or replace function public.cancelar_oferta(oferta_id uuid)
returns public.carrier_offers
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_id uuid := oferta_id; o public.carrier_offers;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede cancelar una oferta' using errcode = '42501';
  end if;
  update public.carrier_offers
     set estatus = 'cancelada', respondida_en = now()
   where id = v_id and estatus = 'ofrecida'
  returning * into o;
  if o.id is null then
    raise exception 'Esa oferta ya no esta esperando respuesta' using errcode = '22023';
  end if;
  return o;
end;
$function$;

revoke execute on function public.ofrecer_envio(uuid, uuid, numeric, text, integer) from public;
revoke execute on function public.ofrecer_envio(uuid, uuid, numeric, text, integer) from anon;
revoke execute on function public.cancelar_oferta(uuid) from public;
revoke execute on function public.cancelar_oferta(uuid) from anon;

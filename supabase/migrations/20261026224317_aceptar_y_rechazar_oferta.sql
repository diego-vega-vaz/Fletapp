-- El transportista responde desde su telefono.
--
-- Al aceptar elige SU unidad y SU chofer, que es lo unico del proceso que
-- solo el sabe: cual tiene libre. Ahi mismo queda asignado el envio y se
-- registra lo que se le va a pagar, partido en anticipo y liquidacion.
--
-- El porcentaje del anticipo es un parametro con 60 por omision porque el
-- esquema espejo 60/40 NO esta confirmado con ningun transportista
-- (pregunta abierta del 27 sep 2026). La liquidacion es monto MENOS anticipo,
-- no un 40% recalculado, para que las dos partes sumen exactamente el monto.

create or replace function public.aceptar_oferta(
  oferta_id  uuid,
  unidad     uuid,
  chofer     uuid default null,
  pct_anticipo numeric default 60
)
returns public.shipments
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_oferta uuid := oferta_id;
  v_unidad uuid := unidad;
  v_chofer uuid := chofer;
  v_pct    numeric := coalesce(pct_anticipo, 60);
  o public.carrier_offers;
  s public.shipments;
  c public.carriers;
  veh public.vehicles;
  cho public.drivers;
  v_anticipo numeric;
  v_mio uuid := public.mi_carrier();
begin
  if v_mio is null then
    raise exception 'Solo un transportista puede responder una oferta' using errcode = '42501';
  end if;

  select * into o from public.carrier_offers where id = v_oferta;
  if not found then
    raise exception 'Oferta no encontrada' using errcode = 'P0002';
  end if;
  if o.carrier_id <> v_mio then
    raise exception 'Esa oferta no es tuya' using errcode = '42501';
  end if;
  if o.estatus <> 'ofrecida' then
    raise exception 'Esa oferta ya esta en %', o.estatus using errcode = '22023';
  end if;
  if o.vence_en is not null and o.vence_en < now() then
    raise exception 'Esa oferta ya vencio' using errcode = '22023';
  end if;

  if v_pct <= 0 or v_pct >= 100 then
    raise exception 'El porcentaje de anticipo tiene que estar entre 1 y 99' using errcode = '22023';
  end if;

  select * into c   from public.carriers where id = o.carrier_id;
  select * into veh from public.vehicles where id = v_unidad;
  if not found then
    raise exception 'Esa unidad no existe' using errcode = 'P0002';
  end if;
  if veh.carrier_id is distinct from o.carrier_id then
    raise exception 'Esa unidad no es tuya' using errcode = '42501';
  end if;

  if v_chofer is not null then
    select * into cho from public.drivers where id = v_chofer;
    if not found then
      raise exception 'Ese chofer no existe' using errcode = 'P0002';
    end if;
    if cho.carrier_id is distinct from o.carrier_id then
      raise exception 'Ese chofer no es tuyo' using errcode = '42501';
    end if;
  end if;

  update public.shipments
     set carrier_id = o.carrier_id,
         carrier    = c.razon_social,
         plate      = veh.placas,
         driver     = cho.nombre
   where id = o.shipment_id
  returning * into s;

  if s.id is null then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  update public.carrier_offers
     set estatus = 'aceptada', respondida_en = now()
   where id = v_oferta;

  -- Lo que se le debe, partido. La liquidacion es el resto exacto.
  v_anticipo := round(o.monto * v_pct / 100);

  insert into public.carrier_payables (shipment_id, carrier_id, tipo, monto)
  values (o.shipment_id, o.carrier_id, 'anticipo', v_anticipo)
  on conflict (shipment_id, tipo) do nothing;

  if o.monto - v_anticipo > 0 then
    insert into public.carrier_payables (shipment_id, carrier_id, tipo, monto)
    values (o.shipment_id, o.carrier_id, 'liquidacion', o.monto - v_anticipo)
    on conflict (shipment_id, tipo) do nothing;
  end if;

  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (o.shipment_id, s.status,
          c.razon_social || ' acepto el envio - placas ' || veh.placas
            || coalesce(' - chofer ' || cho.nombre, ''),
          auth.uid());

  return s;
end;
$function$;

create or replace function public.rechazar_oferta(oferta_id uuid, motivo text default null)
returns public.carrier_offers
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_oferta uuid := oferta_id;
  o public.carrier_offers;
  c public.carriers;
  v_mio uuid := public.mi_carrier();
begin
  if v_mio is null then
    raise exception 'Solo un transportista puede responder una oferta' using errcode = '42501';
  end if;

  select * into o from public.carrier_offers where id = v_oferta;
  if not found then
    raise exception 'Oferta no encontrada' using errcode = 'P0002';
  end if;
  if o.carrier_id <> v_mio then
    raise exception 'Esa oferta no es tuya' using errcode = '42501';
  end if;
  if o.estatus <> 'ofrecida' then
    raise exception 'Esa oferta ya esta en %', o.estatus using errcode = '22023';
  end if;

  update public.carrier_offers
     set estatus = 'rechazada', respondida_en = now(),
         motivo_rechazo = nullif(trim(coalesce(motivo,'')),'')
   where id = v_oferta
  returning * into o;

  select * into c from public.carriers where id = o.carrier_id;

  -- El rechazo queda escrito. Un transportista que rechaza seguido es un
  -- dato del negocio, no un accidente.
  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (o.shipment_id,
          (select status from public.shipments where id = o.shipment_id),
          c.razon_social || ' rechazo el envio'
            || coalesce(': ' || o.motivo_rechazo, ''),
          auth.uid());

  return o;
end;
$function$;

-- Marca un pago al transportista como hecho. No mueve dinero: deja constancia
-- de una transferencia que un humano hizo en el banco, con su referencia.
create or replace function public.marcar_pago_transportista(
  pago_id uuid, referencia text default null
)
returns public.carrier_payables
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_id uuid := pago_id; p public.carrier_payables;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede marcar un pago' using errcode = '42501';
  end if;
  if coalesce(trim(referencia), '') = '' then
    raise exception 'Escribe la referencia de la transferencia. Un pago sin comprobante no es un pago'
      using errcode = '22023';
  end if;
  update public.carrier_payables
     set estatus = 'pagado', pagado_en = now(), pagado_por = auth.uid(),
         referencia = trim(referencia)
   where id = v_id and estatus = 'por_pagar'
  returning * into p;
  if p.id is null then
    raise exception 'Ese pago ya no esta por pagar' using errcode = '22023';
  end if;
  return p;
end;
$function$;

revoke execute on function public.aceptar_oferta(uuid, uuid, uuid, numeric) from public;
revoke execute on function public.aceptar_oferta(uuid, uuid, uuid, numeric) from anon;
revoke execute on function public.rechazar_oferta(uuid, text) from public;
revoke execute on function public.rechazar_oferta(uuid, text) from anon;
revoke execute on function public.marcar_pago_transportista(uuid, text) from public;
revoke execute on function public.marcar_pago_transportista(uuid, text) from anon;

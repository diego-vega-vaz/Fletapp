-- accept_quote deja de aceptar cualquier cotizacion: solo las que un humano
-- aprobo. Sin esto, la pantalla de aprobacion seria decorativa — bastaria
-- llamar al RPC desde la consola del navegador para saltarsela.

create or replace function public.accept_quote(quote_id uuid)
returns uuid
language plpgsql security definer set search_path = 'public'
as $$
declare
  q   quotes%rowtype;
  sid uuid;
begin
  select * into q from quotes where id = quote_id and user_id = auth.uid();
  if not found then raise exception 'Quote not found'; end if;

  if q.status = 'accepted' then
    raise exception 'Esa cotizacion ya fue aceptada' using errcode = '22023';
  end if;

  if q.status = 'por_aprobar' then
    raise exception 'Esa cotizacion todavia esta en revision' using errcode = '22023';
  end if;

  if q.status = 'rechazada' then
    raise exception 'Esa cotizacion fue rechazada: %', coalesce(q.motivo_rechazo, 'sin motivo registrado')
      using errcode = '22023';
  end if;

  if q.status <> 'aprobada' then
    raise exception 'Esa cotizacion no esta disponible (esta en %)', q.status
      using errcode = '22023';
  end if;

  if q.expires_at is not null and q.expires_at < now() then
    raise exception 'Esa cotizacion ya vencio' using errcode = '22023';
  end if;

  insert into shipments (
    user_id, quote_id, ref_id, origin, origin_code, dest, dest_code,
    containers, weight, cargo, price, paid, status, current_location
  ) values (
    auth.uid(), q.id, q.ref_id, q.origin, q.origin_code, q.dest, q.dest_code,
    q.containers, q.weight, q.cargo_desc, q.price, 0, 'waiting', q.origin
  ) returning id into sid;

  insert into shipment_events (shipment_id, status, ubicacion, nota, autor_id)
  values (sid, 'waiting', q.origin,
          'Cotizacion aceptada. Pendiente asignar transportista y unidad.',
          auth.uid());

  -- Anticipo 60% al confirmar la orden (acuerdo del 15 sep 2026).
  -- El 40% restante se factura por separado; su momento de cobro sigue
  -- sin definirse, asi que no se crea aqui.
  insert into invoices (user_id, shipment_id, concept, amount, status, due_at)
  values (
    auth.uid(), sid,
    'Anticipo 60% · flete ' || coalesce(q.origin_code, q.origin)
      || ' a ' || coalesce(q.dest_code, q.dest),
    round(q.price * 0.60),
    'pending',
    to_char(now() + interval '3 days', 'DD Mon YYYY')
  );

  update quotes set status = 'accepted' where id = quote_id;
  return sid;
end;
$$;

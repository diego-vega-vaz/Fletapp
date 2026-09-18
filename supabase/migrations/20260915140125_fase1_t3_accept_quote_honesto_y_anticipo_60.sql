-- Tres cosas mal en la version anterior:
--   1. Inventaba el transportista ('Freightways MX') y una ETA de 20 horas
--      para cualquier ruta del pais. Dato falso presentado como real.
--   2. El anticipo era 50%. En la junta del 15 sep se acordo 60%.
--   3. Creaba el envio ya 'transit' sin que nadie hubiera asignado camion.
-- Ahora nace en 'waiting', sin transportista, y el anticipo es del 60%.

create or replace function public.accept_quote(quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = 'public'
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

revoke execute on function public.accept_quote(uuid) from public, anon;
grant execute on function public.accept_quote(uuid) to authenticated;

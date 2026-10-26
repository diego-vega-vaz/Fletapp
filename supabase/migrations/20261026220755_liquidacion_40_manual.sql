-- El 40% que faltaba del ciclo del dinero.
--
-- El anticipo del 60% ya se crea solo al aceptar la cotizacion. El 40%
-- restante no existia en ningun lado, asi que un envio entregado se quedaba
-- cobrado a medias y nadie lo veia.
--
-- CUANDO se cobra la liquidacion es decision de Quique y sigue abierta. Por
-- eso NO se automatiza: la crea el operador cuando toca, con un boton. Eso
-- ademas es el acuerdo de humanos en el circuito. Cuando se cierre la regla
-- ("al entregar", "a 15 dias"), esto se vuelve un disparador, no un rediseno.
--
-- La unica regla dura es de aritmetica, no de negocio: la liquidacion es el
-- precio MENOS lo que se facturo de anticipo, no un 40% recalculado. Asi
-- anticipo + liquidacion da exactamente el precio y no se pierde un peso en
-- el redondeo.

alter table public.invoices
  add column if not exists tipo text;

comment on column public.invoices.tipo is
  'anticipo | liquidacion. Null en las facturas viejas, anteriores al 26 oct 2026.';

update public.invoices
   set tipo = 'anticipo'
 where tipo is null and concept like 'Anticipo 60%%';

create unique index if not exists invoices_una_por_tipo
  on public.invoices (shipment_id, tipo)
  where shipment_id is not null and tipo is not null;

comment on index public.invoices_una_por_tipo is
  'Un envio no puede tener dos anticipos ni dos liquidaciones. Lo impide la base, no el boton.';

create or replace function public.facturar_liquidacion(envio_id uuid)
returns public.invoices
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_envio     uuid := envio_id;
  s           public.shipments;
  f           public.invoices;
  v_anticipo  numeric;
  v_resto     numeric;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede facturar la liquidacion' using errcode = '42501';
  end if;

  select * into s from public.shipments where id = v_envio;
  if not found then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  if s.price is null or s.price <= 0 then
    raise exception 'Ese envio no tiene precio' using errcode = '22023';
  end if;

  if exists (select 1 from public.invoices
              where shipment_id = v_envio and tipo = 'liquidacion') then
    raise exception 'Ese envio ya tiene su liquidacion facturada' using errcode = '22023';
  end if;

  select coalesce(sum(amount), 0) into v_anticipo
    from public.invoices
   where shipment_id = v_envio and tipo = 'anticipo';

  v_resto := s.price - v_anticipo;

  if v_resto <= 0 then
    raise exception 'No queda saldo por facturar: el precio es % y ya se facturaron %',
      s.price, v_anticipo using errcode = '22023';
  end if;

  insert into public.invoices (user_id, shipment_id, concept, amount, status, tipo, due_at)
  values (
    s.user_id, v_envio,
    'Liquidacion - flete ' || coalesce(s.origin_code, s.origin)
      || ' a ' || coalesce(s.dest_code, s.dest),
    v_resto,
    'pending',
    'liquidacion',
    to_char(now() + interval '15 days', 'DD Mon YYYY')
  ) returning * into f;

  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (v_envio, s.status,
          'Liquidacion facturada por ' || to_char(v_resto, 'FM999,999,999.00') || ' MXN',
          auth.uid());

  return f;
end;
$function$;

revoke execute on function public.facturar_liquidacion(uuid) from public;
revoke execute on function public.facturar_liquidacion(uuid) from anon;

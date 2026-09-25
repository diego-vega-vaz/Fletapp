-- Que ve el transportista, y que puede hacer.
--
-- Lo que NO ve, a proposito: el precio del flete. Cuanto se le paga a el
-- depende de la figura fiscal y del tarifario, y ninguna de las dos esta
-- decidida. Enseñarle el precio que paga el embarcador seria enseñarle la
-- comision antes de que exista un acuerdo sobre la comision.

-- `mi_carrier()` en su propia funcion stable: las politicas la llaman varias
-- veces por consulta y asi Postgres la evalua una vez.
create or replace function public.mi_carrier()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select c.id from public.carriers c where c.user_id = (select auth.uid()) limit 1;
$$;

grant execute on function public.mi_carrier() to authenticated;

create policy "shipments: el transportista ve los suyos"
  on public.shipments for select
  to authenticated
  using (carrier_id is not null and carrier_id = (select public.mi_carrier()));

create policy "shipment_events: el transportista ve los de sus envios"
  on public.shipment_events for select
  to authenticated
  using (exists (
    select 1 from public.shipments s
     where s.id = shipment_events.shipment_id
       and s.carrier_id is not null
       and s.carrier_id = (select public.mi_carrier())
  ));

create policy "carriers: el transportista ve el suyo"
  on public.carriers for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "vehicles: el transportista ve las suyas"
  on public.vehicles for select
  to authenticated
  using (carrier_id = (select public.mi_carrier()));

create policy "drivers: el transportista ve los suyos"
  on public.drivers for select
  to authenticated
  using (carrier_id = (select public.mi_carrier()));

-- Reportar avance. Tres hitos, no un selector de estatus libre: el
-- transportista no tiene por que conocer el vocabulario interno, y darle
-- 'cancelado' o 'demorado' es darle decisiones comerciales que no le tocan.
create or replace function public.reportar_avance(
  envio_id  uuid,
  hito      text,
  ubicacion text default null,
  nota      text default null
)
returns public.shipment_events
language plpgsql security definer set search_path = 'public'
as $$
declare
  s  public.shipments;
  ev public.shipment_events;
  nuevo text;
  texto text;
begin
  select * into s from shipments where id = envio_id;
  if not found then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  if s.carrier_id is null or s.carrier_id is distinct from public.mi_carrier() then
    raise exception 'Ese envio no esta asignado a tu empresa' using errcode = '42501';
  end if;

  if s.status in ('delivered','cancelled') then
    raise exception 'Ese envio ya esta cerrado' using errcode = '22023';
  end if;

  if hito = 'sali' then
    nuevo := 'transit'; texto := 'El operador reporto que salio';
  elsif hito = 'voy_en_camino' then
    nuevo := 'transit'; texto := 'Reporte en ruta';
  elsif hito = 'llegue' then
    nuevo := 'transit'; texto := 'El operador reporto que llego al destino';
  elsif hito = 'entregue' then
    nuevo := 'delivered'; texto := 'El operador reporto la entrega';
  else
    raise exception 'Hito no valido: %', coalesce(hito, 'null') using errcode = '22023';
  end if;

  update shipments
     set status = nuevo,
         current_location = coalesce(nullif(trim(reportar_avance.ubicacion), ''), current_location)
   where id = envio_id;

  insert into shipment_events (shipment_id, status, ubicacion, nota, autor_id)
  values (envio_id, nuevo,
          nullif(trim(reportar_avance.ubicacion), ''),
          texto || case when coalesce(trim(reportar_avance.nota), '') <> ''
                        then ': ' || trim(reportar_avance.nota) else '' end,
          auth.uid())
  returning * into ev;

  return ev;
end; $$;

revoke execute on function public.reportar_avance(uuid, text, text, text) from public, anon;
grant execute on function public.reportar_avance(uuid, text, text, text) to authenticated;

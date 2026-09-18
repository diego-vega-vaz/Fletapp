-- Bitacora de envios. Sustituye a la columna `progress`, que era un numero
-- que nadie actualizaba. Aqui cada cambio queda con autor y fecha.
create table public.shipment_events (
  id          uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status      text,
  ubicacion   text,
  nota        text,
  autor_id    uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create index shipment_events_shipment_idx
  on public.shipment_events (shipment_id, created_at desc);

comment on table public.shipment_events is
  'Historial manual de estatus. Mientras no haya GPS, esta es la unica fuente de verdad del avance de un envio. Solo la escribe el RPC.';

alter table public.shipment_events enable row level security;

-- Sin politicas de escritura: solo entra por el RPC o por service role.
create policy "shipment_events: el dueno del envio los ve"
  on public.shipment_events for select
  using (exists (
    select 1 from public.shipments s
    where s.id = shipment_events.shipment_id and s.user_id = auth.uid()
  ));

create policy "shipment_events: el operador ve todos"
  on public.shipment_events for select
  using ((select public.es_operador()));


-- Unica via por la que un humano mueve un envio desde el navegador.
-- Toca status y ubicacion. NO toca price ni paid: el dinero no se mueve
-- desde el navegador, ni siquiera siendo operador.
create or replace function public.mover_envio(
  envio_id       uuid,
  nuevo_status   text,
  nueva_ubicacion text default null,
  nota           text default null
)
returns public.shipment_events
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  ev public.shipment_events;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede mover un envio'
      using errcode = '42501';
  end if;

  if nuevo_status is null or nuevo_status not in
     ('waiting','transit','delayed','delivered','cancelled') then
    raise exception 'Estatus no valido: %', coalesce(nuevo_status, 'null')
      using errcode = '22023';
  end if;

  update public.shipments
     set status           = nuevo_status,
         current_location = coalesce(nueva_ubicacion, current_location)
   where id = envio_id;

  if not found then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  insert into public.shipment_events (shipment_id, status, ubicacion, nota, autor_id)
  values (envio_id, nuevo_status, nueva_ubicacion, nota, auth.uid())
  returning * into ev;

  return ev;
end;
$$;

revoke execute on function public.mover_envio(uuid, text, text, text) from public, anon;
grant execute on function public.mover_envio(uuid, text, text, text) to authenticated;


-- Asignar transportista y unidad. Quique dijo que el anticipo se cobra
-- "que se confirme el nombre del transportista y las placas de la unidad",
-- asi que esto es precondicion del cobro, no un adorno.
create or replace function public.asignar_unidad(
  envio_id     uuid,
  transportista text,
  operador_nombre text,
  placas       text
)
returns public.shipments
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  s public.shipments;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede asignar unidad'
      using errcode = '42501';
  end if;

  if coalesce(trim(transportista), '') = '' or coalesce(trim(placas), '') = '' then
    raise exception 'Transportista y placas son obligatorios'
      using errcode = '22023';
  end if;

  update public.shipments
     set carrier = trim(transportista),
         driver  = nullif(trim(operador_nombre), ''),
         plate   = trim(placas)
   where id = envio_id
  returning * into s;

  if not found then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (envio_id, s.status,
          'Unidad asignada: ' || trim(transportista) || ' · placas ' || trim(placas),
          auth.uid());

  return s;
end;
$$;

revoke execute on function public.asignar_unidad(uuid, text, text, text) from public, anon;
grant execute on function public.asignar_unidad(uuid, text, text, text) to authenticated;

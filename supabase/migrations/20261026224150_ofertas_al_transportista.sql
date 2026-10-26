-- La otra mitad de la conversacion: el transportista ya puede decir que no.
--
-- Hasta hoy el operador asignaba el envio y punto. El transportista se
-- enteraba de que traia carga, nunca la aceptaba, y sobre todo nunca veia
-- cuanto se le iba a pagar: su pantalla no mostraba ningun precio, por diseno,
-- porque el precio que existia era el del embarcador y ese no es asunto suyo.
--
-- Ahora hay una oferta de por medio. El operador ofrece el envio a un
-- transportista verificado con SU monto; el transportista la ve en su telefono
-- con la ruta y el dinero, y acepta o rechaza. Si acepta, el elige que unidad
-- y que chofer manda, que es algo que solo el sabe.

create table if not exists public.carrier_offers (
  id             uuid primary key default gen_random_uuid(),
  shipment_id    uuid not null references public.shipments(id) on delete cascade,
  carrier_id     uuid not null references public.carriers(id)  on delete cascade,
  monto          numeric not null check (monto > 0),
  estatus        text    not null default 'ofrecida'
                 check (estatus in ('ofrecida','aceptada','rechazada','cancelada')),
  nota           text,
  motivo_rechazo text,
  ofrecida_por   uuid references auth.users(id),
  ofrecida_en    timestamptz not null default now(),
  respondida_en  timestamptz,
  vence_en       timestamptz
);

comment on table public.carrier_offers is
  'Oferta de un envio a un transportista, con el monto que se le pagaria. El transportista la acepta o la rechaza desde su telefono.';
comment on column public.carrier_offers.monto is
  'Lo que se le paga al transportista. No es el precio del embarcador: ese no se le muestra.';

-- Un envio no puede tener dos ofertas vivas al mismo tiempo. Si eso pasara,
-- dos transportistas podrian aceptar el mismo flete.
create unique index if not exists carrier_offers_una_viva
  on public.carrier_offers (shipment_id)
  where estatus = 'ofrecida';

create unique index if not exists carrier_offers_una_aceptada
  on public.carrier_offers (shipment_id)
  where estatus = 'aceptada';

create index if not exists carrier_offers_por_carrier
  on public.carrier_offers (carrier_id, estatus);

alter table public.carrier_offers enable row level security;

-- El transportista ve SOLO sus ofertas. El operador las ve todas.
-- Nadie escribe directo: sin politicas de insert/update/delete la tabla es de
-- solo lectura para cualquiera que entre por la aplicacion. Todo cambio pasa
-- por las funciones, que validan.
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'carrier_offers'
       and policyname = 'ofertas: el transportista ve las suyas'
  ) then
    create policy "ofertas: el transportista ve las suyas"
      on public.carrier_offers for select to authenticated
      using (carrier_id = public.mi_carrier() or public.es_operador());
  end if;
end $$;

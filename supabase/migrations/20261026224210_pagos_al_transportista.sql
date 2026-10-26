-- Lo que FleetWeb le debe al transportista.
--
-- Hasta hoy el dinero solo existia de un lado: lo que el embarcador nos paga.
-- Lo que nosotros le pagamos al transportista no estaba en ningun lado, asi
-- que no habia forma de saber a quien se le debe ni cuanto.
--
-- OJO, decision abierta del 27 sep 2026: el esquema espejo 60/40 al
-- transportista NO esta confirmado con ningun transportista — todavia no se
-- recluta a ninguno. Por eso el porcentaje del anticipo es un parametro con
-- 60 por omision, no una constante. El dia que uno exija 50/50 o pago contra
-- entrega, se cambia el numero y nada mas.
--
-- CUANDO se paga tampoco esta definido. Esta tabla registra lo que se debe,
-- no ordena transferencias: no hay pasarela conectada. Marcar un pago como
-- pagado es un acto del operador que deja constancia de algo que paso en el
-- banco, no un cobro.

create table if not exists public.carrier_payables (
  id            uuid primary key default gen_random_uuid(),
  shipment_id   uuid not null references public.shipments(id) on delete cascade,
  carrier_id    uuid not null references public.carriers(id)  on delete cascade,
  tipo          text not null check (tipo in ('anticipo','liquidacion')),
  monto         numeric not null check (monto > 0),
  estatus       text not null default 'por_pagar'
                check (estatus in ('por_pagar','pagado','cancelado')),
  referencia    text,
  creado_en     timestamptz not null default now(),
  pagado_en     timestamptz,
  pagado_por    uuid references auth.users(id)
);

comment on table public.carrier_payables is
  'Cuentas por pagar al transportista. Registra lo que se le debe; no mueve dinero, no hay pasarela.';
comment on column public.carrier_payables.referencia is
  'Referencia de la transferencia que hizo el humano en el banco. Es la prueba de que se pago.';

create unique index if not exists carrier_payables_uno_por_tipo
  on public.carrier_payables (shipment_id, tipo);

create index if not exists carrier_payables_por_carrier
  on public.carrier_payables (carrier_id, estatus);

alter table public.carrier_payables enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname='public' and tablename='carrier_payables'
       and policyname='pagos: el transportista ve los suyos'
  ) then
    create policy "pagos: el transportista ve los suyos"
      on public.carrier_payables for select to authenticated
      using (carrier_id = public.mi_carrier() or public.es_operador());
  end if;
end $$;

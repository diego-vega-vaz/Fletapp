-- Fase 2, tarea 5, paso 4: alertas de lo que va tarde.
--
-- Lo que esto NO hace: no sabe donde esta el camion. No hay rastreo; eso es
-- la Fase 4. Lo unico que puede afirmar con honestidad es que algo NO ha
-- pasado: nadie asigno unidad, se paso la fecha comprometida, o nadie ha
-- tocado la bitacora en mucho rato. Tres ausencias, cero invenciones.

alter table public.shipments
  add column if not exists compromiso_en timestamptz;

comment on column public.shipments.compromiso_en is
  'Fecha y hora de entrega comprometida con el embarcador. La fija el operador; `eta` es texto libre heredado y no sirve para comparar.';

create or replace function public.fijar_compromiso(
  envio_id uuid,
  cuando   timestamptz
)
returns public.shipments
language plpgsql security definer set search_path = 'public'
as $$
declare s public.shipments;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede fijar la fecha compromiso' using errcode = '42501';
  end if;

  update public.shipments set compromiso_en = cuando
   where id = envio_id
  returning * into s;

  if not found then
    raise exception 'Envio no encontrado' using errcode = 'P0002';
  end if;

  insert into public.shipment_events (shipment_id, status, nota, autor_id)
  values (envio_id, s.status,
          case when cuando is null then 'Se quito la fecha compromiso'
               else 'Fecha compromiso: ' || to_char(cuando, 'DD/MM/YYYY HH24:MI') end,
          auth.uid());

  return s;
end; $$;

-- Umbrales. Son un punto de partida mio, no una politica de servicio: cuando
-- Quique diga en cuanto tiempo se debe asignar un camion y cada cuanto debe
-- reportar el operador, se cambian aqui.
create or replace function public.envios_en_riesgo()
returns table (
  shipment_id uuid,
  ref_id      text,
  origin      text,
  dest        text,
  status      text,
  carrier     text,
  motivo      text,
  detalle     text,
  horas       numeric
)
language sql stable security definer set search_path = 'public'
as $$
  select * from (
    with vivos as (
      select * from shipments
       where status not in ('delivered','cancelled')
    ),
    ultimo_evento as (
      select e.shipment_id as sid, max(e.created_at) as visto
        from shipment_events e
       group by e.shipment_id
    )
    -- 1. Lleva mas de 24 horas esperando camion.
    select s.id as shipment_id, s.ref_id, s.origin, s.dest, s.status, s.carrier,
           'sin_camion'::text as motivo,
           ('Aceptado hace ' || round(extract(epoch from (now() - s.created_at))/3600) ||
            ' h y sigue sin transportista asignado')::text as detalle,
           round(extract(epoch from (now() - s.created_at))/3600, 1) as horas
      from vivos s
     where s.status = 'waiting'
       and coalesce(trim(s.carrier), '') = ''
       and s.created_at < now() - interval '24 hours'

    union all

    -- 2. Se paso la fecha que se le prometio al cliente.
    select s.id, s.ref_id, s.origin, s.dest, s.status, s.carrier,
           'compromiso_vencido'::text,
           ('Se comprometio para el ' || to_char(s.compromiso_en, 'DD/MM HH24:MI') ||
            ' y no esta entregado')::text,
           round(extract(epoch from (now() - s.compromiso_en))/3600, 1)
      from vivos s
     where s.compromiso_en is not null
       and s.compromiso_en < now()

    union all

    -- 3. Va en ruta pero nadie ha reportado nada en 24 horas. No dice que este
    --    perdido: dice que no sabemos, que es justo el problema.
    select s.id, s.ref_id, s.origin, s.dest, s.status, s.carrier,
           'sin_movimiento'::text,
           ('En transito y sin movimiento en la bitacora desde hace ' ||
            round(extract(epoch from (now() - coalesce(u.visto, s.created_at)))/3600) || ' h')::text,
           round(extract(epoch from (now() - coalesce(u.visto, s.created_at)))/3600, 1)
      from vivos s
      left join ultimo_evento u on u.sid = s.id
     where s.status in ('transit','delayed')
       and coalesce(u.visto, s.created_at) < now() - interval '24 hours'
  ) r
  order by r.horas desc;
$$;

revoke execute on function public.fijar_compromiso(uuid, timestamptz) from public, anon;
revoke execute on function public.envios_en_riesgo() from public, anon;
grant execute on function public.fijar_compromiso(uuid, timestamptz) to authenticated;
grant execute on function public.envios_en_riesgo() to authenticated;

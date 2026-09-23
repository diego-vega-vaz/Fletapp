-- envios_en_riesgo() es security definer: se salta la RLS a proposito, porque
-- el operador necesita ver los envios de todos. Pero sin un filtro de rol
-- dentro, cualquier usuario autenticado podia llamarla y leer los envios de
-- los demas. El grant a authenticated no alcanza como control: el permiso de
-- ejecutar no es el permiso de ver.

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
         and public.es_operador()
    ),
    ultimo_evento as (
      select e.shipment_id as sid, max(e.created_at) as visto
        from shipment_events e
       group by e.shipment_id
    )
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

    select s.id, s.ref_id, s.origin, s.dest, s.status, s.carrier,
           'compromiso_vencido'::text,
           ('Se comprometio para el ' || to_char(s.compromiso_en, 'DD/MM HH24:MI') ||
            ' y no esta entregado')::text,
           round(extract(epoch from (now() - s.compromiso_en))/3600, 1)
      from vivos s
     where s.compromiso_en is not null
       and s.compromiso_en < now()

    union all

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

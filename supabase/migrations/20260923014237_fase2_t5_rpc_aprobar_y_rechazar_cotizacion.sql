-- Aprobar, ajustar y rechazar. Solo operador, y lo valida el servidor.

create or replace function public.aprobar_cotizacion(
  cotizacion   uuid,
  precio_final numeric default null,
  nota         text    default null
)
returns public.quotes
language plpgsql security definer set search_path = 'public'
as $$
declare q public.quotes;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede aprobar una cotizacion' using errcode = '42501';
  end if;

  select * into q from quotes where id = cotizacion;
  if not found then
    raise exception 'Cotizacion no encontrada' using errcode = 'P0002';
  end if;

  if q.status <> 'por_aprobar' then
    raise exception 'Esa cotizacion ya no esta por aprobar (esta en %)', q.status
      using errcode = '22023';
  end if;

  if precio_final is not null and precio_final <= 0 then
    raise exception 'El precio tiene que ser mayor a cero' using errcode = '22023';
  end if;

  -- Ajustar el precio sin decir por que es exactamente el dato que despues
  -- hace falta para saber si el calculo automatico sirve o no.
  if precio_final is not null and precio_final <> q.precio_sugerido
     and coalesce(trim(nota), '') = '' then
    raise exception 'Si cambias el precio sugerido tienes que escribir por que'
      using errcode = '22023';
  end if;

  update quotes
     set price       = coalesce(precio_final, precio_sugerido, price),
         status      = 'aprobada',
         aprobada_por = auth.uid(),
         aprobada_en  = now(),
         ajuste_nota  = nullif(trim(coalesce(nota, '')), ''),
         -- El reloj de las 24 horas corre desde que el cliente la puede ver,
         -- no desde que se calculo. Si no, una cotizacion podria nacer vencida
         -- nada mas porque el operador tardo en revisarla.
         expires_at   = now() + interval '24 hours'
   where id = cotizacion
  returning * into q;

  return q;
end; $$;

create or replace function public.rechazar_cotizacion(
  cotizacion uuid,
  motivo     text
)
returns public.quotes
language plpgsql security definer set search_path = 'public'
as $$
declare q public.quotes;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede rechazar una cotizacion' using errcode = '42501';
  end if;

  if coalesce(trim(motivo), '') = '' then
    raise exception 'Rechazar sin motivo no le sirve a nadie' using errcode = '22023';
  end if;

  select * into q from quotes where id = cotizacion;
  if not found then
    raise exception 'Cotizacion no encontrada' using errcode = 'P0002';
  end if;

  if q.status <> 'por_aprobar' then
    raise exception 'Esa cotizacion ya no esta por aprobar (esta en %)', q.status
      using errcode = '22023';
  end if;

  update quotes
     set status         = 'rechazada',
         motivo_rechazo = trim(motivo),
         aprobada_por   = auth.uid(),
         aprobada_en    = now()
   where id = cotizacion
  returning * into q;

  return q;
end; $$;

revoke execute on function public.aprobar_cotizacion(uuid, numeric, text) from public, anon;
revoke execute on function public.rechazar_cotizacion(uuid, text) from public, anon;
grant execute on function public.aprobar_cotizacion(uuid, numeric, text) to authenticated;
grant execute on function public.rechazar_cotizacion(uuid, text) to authenticated;

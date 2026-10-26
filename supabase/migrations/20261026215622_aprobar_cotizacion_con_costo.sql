-- aprobar_cotizacion() ahora captura tambien lo que cuesta el transportista.
--
-- Reglas, todas del lado del servidor:
--  - El costo tiene que ser mayor a cero.
--  - Si la comision sale negativa o cero, se rechaza. Aprobar un flete que
--    pierde dinero tiene que ser una decision consciente, no un dedazo.
--  - Se puede aprobar sin costo todavia (null), porque al principio el
--    operador cotiza antes de llamar al transportista. Pero entonces el
--    envio nace sin comision registrada y eso se ve.

create or replace function public.aprobar_cotizacion(
  cotizacion    uuid,
  precio_final  numeric default null,
  nota          text    default null,
  costo         numeric default null
)
returns public.quotes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  q         public.quotes;
  v_precio  numeric;
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

  v_precio := coalesce(precio_final, q.precio_sugerido, q.price);

  if costo is not null then
    if costo <= 0 then
      raise exception 'El costo del transportista tiene que ser mayor a cero'
        using errcode = '22023';
    end if;
    if v_precio - costo <= 0 then
      raise exception 'Con ese costo la comision seria % y el flete perderia dinero. Sube el precio o baja el costo',
        to_char(v_precio - costo, 'FM999999999.00') using errcode = '22023';
    end if;
  end if;

  update quotes
     set price               = v_precio,
         costo_transportista = coalesce(costo, costo_transportista),
         status              = 'aprobada',
         aprobada_por        = auth.uid(),
         aprobada_en         = now(),
         ajuste_nota         = nullif(trim(coalesce(nota, '')), ''),
         -- El reloj de las 24 horas corre desde que el cliente la puede ver,
         -- no desde que se calculo.
         expires_at          = now() + interval '24 hours'
   where id = cotizacion
  returning * into q;

  return q;
end;
$function$;

revoke execute on function public.aprobar_cotizacion(uuid, numeric, text, numeric) from public;
revoke execute on function public.aprobar_cotizacion(uuid, numeric, text, numeric) from anon;

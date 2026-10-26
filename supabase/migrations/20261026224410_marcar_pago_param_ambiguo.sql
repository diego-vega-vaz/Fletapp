-- Mismo tropiezo que con asignar_unidad() el 19 oct: el parametro se llama
-- igual que la columna ("referencia") y el UPDATE no sabe a cual se refiere.
-- Lo cazo el ensayo antes de que llegara a la app. Se arregla copiando el
-- parametro a una variable local con prefijo, como en los otros casos.

create or replace function public.marcar_pago_transportista(
  pago_id uuid, referencia text default null
)
returns public.carrier_payables
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id  uuid := pago_id;
  v_ref text := nullif(trim(coalesce(referencia, '')), '');
  p public.carrier_payables;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede marcar un pago' using errcode = '42501';
  end if;
  if v_ref is null then
    raise exception 'Escribe la referencia de la transferencia. Un pago sin comprobante no es un pago'
      using errcode = '22023';
  end if;
  update public.carrier_payables
     set estatus    = 'pagado',
         pagado_en  = now(),
         pagado_por = auth.uid(),
         referencia = v_ref
   where id = v_id and estatus = 'por_pagar'
  returning * into p;
  if p.id is null then
    raise exception 'Ese pago ya no esta por pagar' using errcode = '22023';
  end if;
  return p;
end;
$function$;

revoke execute on function public.marcar_pago_transportista(uuid, text) from public;
revoke execute on function public.marcar_pago_transportista(uuid, text) from anon;

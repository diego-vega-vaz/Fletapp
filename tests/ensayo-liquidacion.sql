-- Ensayo de la liquidacion del 40%. Corre entero y hace ROLLBACK.
--
-- El precio de prueba es 9999 a proposito: 9999 * 0.60 = 5999.4, que redondea
-- a 5999. Si la liquidacion se calculara como "40% del precio" daria 4000 (sic)
-- pero 5999 + 4000 = 9999 solo por suerte. Con precios distintos se pierde o
-- se gana un peso. Por eso la liquidacion es precio MENOS anticipo, y el
-- paso 3 es el que lo vigila.

begin;
create temp table r (paso text, esperado text, obtenido text, ok boolean) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
 ('cccccccc-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb3@ensayo.test','x',now(),now(),now(),'{}','{}'),
 ('cccccccc-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','op3@ensayo.test','x',now(),now(),now(),'{}','{}');
update public.user_roles set rol='operador' where user_id='cccccccc-0000-0000-0000-000000000002';

do $$
declare
  qid uuid; sid uuid; e text; f public.invoices; n numeric; c int;
  OP  constant text := '{"sub":"cccccccc-0000-0000-0000-000000000002","role":"authenticated"}';
  EMB constant text := '{"sub":"cccccccc-0000-0000-0000-000000000001","role":"authenticated"}';
begin
  insert into public.quotes (user_id, origin, dest, containers, price, precio_sugerido, status)
  values ('cccccccc-0000-0000-0000-000000000001','CDMX','Monterrey','2',9999,9999,'por_aprobar')
  returning id into qid;
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  perform public.aprobar_cotizacion(qid, 9999, null, 7000);
  reset role;
  perform set_config('request.jwt.claims', EMB, true); set local role authenticated;
  sid := public.accept_quote(qid);
  reset role;

  select amount into n from public.invoices where shipment_id=sid and tipo='anticipo';
  insert into r values ('1. anticipo marcado como anticipo','5999', coalesce(n::text,'null'), n=5999);

  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  select * into f from public.facturar_liquidacion(sid);
  reset role;
  insert into r values ('2. liquidacion = precio - anticipo','4000', f.amount::text, f.amount=4000);

  select sum(amount) into n from public.invoices where shipment_id=sid;
  insert into r values ('3. anticipo + liquidacion = precio exacto','9999', n::text, n=9999);

  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin perform public.facturar_liquidacion(sid); e := 'la dejo';
  exception when others then e := 'rechazada'; end;
  reset role;
  insert into r values ('4. no se puede facturar dos veces','rechazada', e, e='rechazada');

  perform set_config('request.jwt.claims', EMB, true); set local role authenticated;
  begin perform public.facturar_liquidacion(sid); e := 'la dejo';
  exception when others then e := 'rechazada'; end;
  reset role;
  insert into r values ('5. el embarcador no puede facturarse solo','rechazada', e, e='rechazada');

  select count(*) into c from public.shipment_events
   where shipment_id=sid and nota like 'Liquidacion facturada%';
  insert into r values ('6. queda asiento en la bitacora','1', c::text, c=1);
end $$;

select paso, esperado, obtenido, case when ok then 'ok' else 'FALLA' end as resultado from r order by paso;
rollback;

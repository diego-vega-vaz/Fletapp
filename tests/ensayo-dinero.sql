-- Ensayo del dinero: costo del transportista, comision y anticipo.
-- Corre entero y hace ROLLBACK: no deja basura.
--
-- Existe porque hasta el 26 oct 2026 la comision no era un dato en ningun
-- lado: el margen del negocio era una cuenta mental. Estas ocho pruebas
-- fijan las reglas para que nadie las afloje por accidente.

begin;
create temp table r (paso text, esperado text, obtenido text, ok boolean) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
 ('bbbbbbbb-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb2@ensayo.test','x',now(),now(),now(),'{}','{}'),
 ('bbbbbbbb-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','op2@ensayo.test','x',now(),now(),now(),'{}','{}');
update public.user_roles set rol='operador' where user_id='bbbbbbbb-0000-0000-0000-000000000002';

do $$
declare
  qid uuid; sid uuid; e text; q public.quotes; s public.shipments; n numeric;
  OP  constant text := '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}';
  EMB constant text := '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}';
begin
  insert into public.quotes (user_id, origin, dest, containers, price, precio_sugerido, status)
  values ('bbbbbbbb-0000-0000-0000-000000000001','CDMX','Monterrey','2',10000,10000,'por_aprobar')
  returning id into qid;

  -- A. Un flete que pierde dinero no se aprueba por accidente
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin perform public.aprobar_cotizacion(qid, 10000, null, 12000); e := 'la acepto';
  exception when others then e := 'rechazada'; end;
  reset role;
  insert into r values ('A. rechaza costo mayor al precio','rechazada', e, e='rechazada');

  -- B. Un costo en cero suele ser un campo vacio mal mandado
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin perform public.aprobar_cotizacion(qid, 10000, null, 0); e := 'la acepto';
  exception when others then e := 'rechazada'; end;
  reset role;
  insert into r values ('B. rechaza costo cero','rechazada', e, e='rechazada');

  -- C. La comision la calcula la base, no el navegador
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  select * into q from public.aprobar_cotizacion(qid, 10000, null, 7500);
  reset role;
  insert into r values ('C. comision = precio - costo','2500', q.comision::text, q.comision = 2500);

  -- D. El envio se lleva su propia copia
  perform set_config('request.jwt.claims', EMB, true); set local role authenticated;
  sid := public.accept_quote(qid);
  reset role;
  select * into s from public.shipments where id = sid;
  insert into r values ('D. el envio copia costo y comision','7500 / 2500',
    coalesce(s.costo_transportista::text,'null')||' / '||coalesce(s.comision::text,'null'),
    s.costo_transportista = 7500 and s.comision = 2500);

  -- E. Un envio es un hecho, no una vista de la cotizacion
  update public.quotes set costo_transportista = 9000 where id = qid;
  select * into s from public.shipments where id = sid;
  insert into r values ('E. el envio no se mueve si cambia la cotizacion','2500',
    s.comision::text, s.comision = 2500);

  -- F. El anticipo del 60% sigue saliendo igual
  select amount into n from public.invoices where shipment_id = sid;
  insert into r values ('F. anticipo 60% del precio','6000', coalesce(n::text,'null'), n = 6000);

  -- G. La llamada vieja de 3 argumentos no se rompio
  insert into public.quotes (user_id, origin, dest, containers, price, precio_sugerido, status)
  values ('bbbbbbbb-0000-0000-0000-000000000001','CDMX','Queretaro','1',5000,5000,'por_aprobar')
  returning id into qid;
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin
    select * into q from public.aprobar_cotizacion(cotizacion => qid, precio_final => 5000, nota => null);
    e := 'ok';
  exception when others then e := sqlerrm; end;
  reset role;
  insert into r values ('G. llamada de 3 argumentos sigue sirviendo','ok', e, e='ok');

  -- H. Sin costo, la comision es nula. No cero: nula. Cero seria mentira.
  insert into r values ('H. sin costo, la comision queda nula','null',
    coalesce(q.comision::text,'null'), q.comision is null);
end $$;

select paso, esperado, obtenido, case when ok then 'ok' else 'FALLA' end as resultado from r order by paso;
rollback;

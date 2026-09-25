-- Prueba de regresion del acceso del transportista (Fase 2, tarea 4).
-- Corre entera y hace ROLLBACK: no deja basura. Todas las filas deben salir ok = true.
--
--   supabase db execute --file tests/transportista-acceso.sql
--
-- La mitad de estas pruebas son de AISLAMIENTO: que un transportista no vea
-- los envios de otro. Es lo unico que hace posible que varios transportistas
-- usen la misma plataforma sin verse entre ellos, y es lo que mas caro sale
-- si se rompe en silencio.

begin;
create temp table r (prueba text, esperado text, obtenido text, ok boolean) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb@p.test','x',now(),now(),now(),'{}','{}'),
 ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','op@p.test','x',now(),now(),now(),'{}','{}'),
 ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tr@p.test','x',now(),now(),now(),'{}','{}'),
 ('55555555-5555-5555-5555-555555555555','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tr2@p.test','x',now(),now(),now(),'{}','{}');
update public.user_roles set rol='operador' where user_id='33333333-3333-3333-3333-333333333333';

do $$
declare e text; n int; cid uuid; cid2 uuid; cod text; sid uuid; rolx text; st text;
begin
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select id into cid  from public.alta_transportista('Transportes Prueba SA','TPR010101AB1');
  select id into cid2 from public.alta_transportista('Otro Transportista SA','OTR010101AB1');
  reset role;

  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.invitar_transportista(cid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('embarcador invita','rechazado',e,e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  cod := public.invitar_transportista(cid);
  reset role;
  insert into r values ('operador genera codigo','8 chars', coalesce(cod,'null'), length(coalesce(cod,''))=8);

  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.canjear_invitacion('NOEXISTE'); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('codigo inventado','rechazado',e,e='rechazado');

  -- En minusculas tambien: el codigo se dicta por telefono y nadie escribe
  -- con mayusculas en el celular.
  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  perform public.canjear_invitacion(lower(cod));
  reset role;
  select user_id::text into e from carriers where id = cid;
  insert into r values ('canje vincula la cuenta','el usuario', coalesce(e,'null'), e='44444444-4444-4444-4444-444444444444');
  select ur.rol::text into rolx from user_roles ur where ur.user_id='44444444-4444-4444-4444-444444444444';
  insert into r values ('el rol lo pone el servidor','transportista', rolx, rolx='transportista');

  perform set_config('request.jwt.claims','{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.canjear_invitacion(cod); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('codigo reusado','rechazado',e,e='rechazado');

  insert into shipments (user_id, origin, dest, price, status, carrier_id, carrier, ref_id)
  values ('11111111-1111-1111-1111-111111111111','CDMX','Monterrey',9500,'waiting',cid,'Transportes Prueba SA','ENV-T-1')
  returning id into sid;

  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from shipments where id = sid;
  reset role;
  insert into r values ('el transportista ve su envio','1', n::text, n=1);

  perform set_config('request.jwt.claims','{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from shipments where id = sid;
  reset role;
  insert into r values ('un tercero no ve ese envio','0', n::text, n=0);

  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from carriers where id = cid2;
  reset role;
  insert into r values ('no ve otros transportistas','0', n::text, n=0);

  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  perform public.reportar_avance(sid, 'sali', 'CDMX');
  reset role;
  select s.status into st from shipments s where s.id = sid;
  insert into r values ('sali mueve a transito','transit', st, st='transit');

  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.reportar_avance(sid, 'cancelado'); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('hito inventado','rechazado',e,e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.reportar_avance(sid, 'entregue'); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('reportar sobre envio ajeno','rechazado',e,e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  perform public.reportar_avance(sid, 'entregue', 'Monterrey', 'Recibio Luis Mendoza');
  reset role;
  select s.status into st from shipments s where s.id = sid;
  insert into r values ('entregue cierra el envio','delivered', st, st='delivered');

  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.reportar_avance(sid, 'sali'); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('reportar sobre envio cerrado','rechazado',e,e='rechazado');

  select count(*) into n from shipment_events ev
   where ev.shipment_id = sid and ev.autor_id = '44444444-4444-4444-4444-444444444444';
  insert into r values ('la bitacora guarda quien reporto','2', n::text, n=2);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  cod := public.invitar_transportista(cid2);
  reset role;
  perform set_config('request.jwt.claims','{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.canjear_invitacion(cod); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('una cuenta en dos transportistas','rechazado',e,e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.invitar_transportista(cid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('invitar a uno ya vinculado','rechazado',e,e='rechazado');

  update carrier_invites ci set expira_en = now() - interval '1 day' where ci.codigo = cod;
  perform set_config('request.jwt.claims','{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.canjear_invitacion(cod); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('codigo vencido','rechazado',e,e='rechazado');
end $$;

select * from r;
rollback;

-- Prueba de regresion de la aprobacion humana de cotizaciones y de las
-- alertas de lo que va tarde (Fase 2, tarea 5).
-- Corre entera y hace ROLLBACK: no deja basura. Todas las filas deben salir ok = true.
--
--   supabase db execute --file tests/cotizaciones-aprobacion.sql
--   (o pegarla en el SQL editor del proyecto)

begin;
create temp table r (prueba text, esperado text, obtenido text, ok boolean) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb@p.test','x',now(),now(),now(),'{}','{}'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','otro@p.test','x',now(),now(),now(),'{}','{}'),
 ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','op@p.test','x',now(),now(),now(),'{}','{}');
update public.user_roles set rol='operador' where user_id='33333333-3333-3333-3333-333333333333';

do $$
declare e text; e2 text; n int; qid uuid; qid2 uuid; sid uuid; q public.quotes; p numeric;
begin
  insert into quotes (user_id, origin, dest, containers, price, precio_sugerido, status)
  values ('11111111-1111-1111-1111-111111111111','CDMX','Monterrey','2',7018,7018,'por_aprobar')
  returning id into qid;

  -- 1. Sin aprobacion humana no hay venta. Esta es la prueba que hace que la
  --    pantalla de aprobacion no sea decorativa.
  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.accept_quote(qid); e:='PASO';
  exception when others then e:=sqlerrm; end;
  reset role;
  insert into r values ('aceptar sin aprobacion','en revision',e, e like '%revision%');

  -- 2. El que pide el flete no es el que aprueba el precio del flete.
  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.aprobar_cotizacion(qid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('embarcador aprueba su cotizacion','rechazado',e,e='rechazado');

  -- 3 y 4. Ajustar el precio a ciegas, o dejarlo en cero.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.aprobar_cotizacion(qid, 9500, null); e:='PASO';
  exception when others then e:='rechazado'; end;
  begin perform public.aprobar_cotizacion(qid, 0, 'porque si'); e2:='PASO';
  exception when others then e2:='rechazado'; end;
  reset role;
  insert into r values ('ajustar precio sin nota','rechazado',e,e='rechazado');
  insert into r values ('precio en cero','rechazado',e2,e2='rechazado');

  -- 5. Aprobar con ajuste. El sugerido se conserva: es el dato que despues
  --    dice si la formula automatica sirve o no.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  q := public.aprobar_cotizacion(qid, 9500, 'Casetas de la 57 subieron y el transportista cobra mas en viernes');
  reset role;
  insert into r values ('aprobar con ajuste','aprobada', q.status, q.status='aprobada');
  insert into r values ('precio ajustado','9500', q.price::text, q.price=9500);
  insert into r values ('sugerido se conserva','7018', q.precio_sugerido::text, q.precio_sugerido=7018);
  insert into r values ('queda quien aprobo','operador', coalesce(q.aprobada_por::text,'null'), q.aprobada_por='33333333-3333-3333-3333-333333333333');

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.aprobar_cotizacion(qid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('aprobar dos veces','rechazado',e,e='rechazado');

  -- 6. Ya aprobada si se acepta, y el envio nace con el precio APROBADO,
  --    no con el que calculo el servidor.
  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  sid := public.accept_quote(qid);
  reset role;
  select price into p from shipments where id = sid;
  insert into r values ('aceptar tras aprobar','uuid', coalesce(sid::text,'null'), sid is not null);
  insert into r values ('el envio nace con el precio aprobado','9500', p::text, p=9500);

  -- 7. Rechazar exige motivo, y el motivo le llega al embarcador.
  insert into quotes (user_id, origin, dest, containers, price, precio_sugerido, status)
  values ('11111111-1111-1111-1111-111111111111','CDMX','Tijuana','1',5000,5000,'por_aprobar')
  returning id into qid2;
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.rechazar_cotizacion(qid2, '   '); e:='PASO';
  exception when others then e:='rechazado'; end;
  perform public.rechazar_cotizacion(qid2, 'Ruta fuera del corredor inicial');
  reset role;
  insert into r values ('rechazar sin motivo','rechazado',e,e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.accept_quote(qid2); e:='PASO';
  exception when others then e:=sqlerrm; end;
  reset role;
  insert into r values ('aceptar una rechazada','dice el motivo',e, e like '%corredor inicial%');

  begin update quotes set status='promocion' where id=qid2; e:='PASO';
  exception when others then e:='rechazado'; end;
  insert into r values ('status inventado','rechazado',e,e='rechazado');

  -- 8. Las alertas son solo del operador. envios_en_riesgo() es security
  --    definer: sin el filtro de rol adentro, cualquiera leeria los envios
  --    de los demas.
  perform set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.envios_en_riesgo();
  reset role;
  insert into r values ('un tercero ve alertas','0', n::text, n=0);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.envios_en_riesgo() where shipment_id = sid;
  reset role;
  insert into r values ('envio nuevo no alerta','0', n::text, n=0);

  update shipments set created_at = now() - interval '30 hours' where id = sid;
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.envios_en_riesgo()
   where shipment_id = sid and motivo = 'sin_camion';
  reset role;
  insert into r values ('30 h sin camion','1', n::text, n=1);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  perform public.fijar_compromiso(sid, now() - interval '3 hours');
  select count(*) into n from public.envios_en_riesgo()
   where shipment_id = sid and motivo = 'compromiso_vencido';
  reset role;
  insert into r values ('compromiso vencido','1', n::text, n=1);

  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.fijar_compromiso(sid, now()); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('embarcador fija compromiso','rechazado',e,e='rechazado');

  -- 9. Entregado deja de alertar. Sin esto la lista se llena de ruido viejo
  --    y el operador deja de mirarla, que es peor que no tenerla.
  update shipments set status='delivered' where id = sid;
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.envios_en_riesgo() where shipment_id = sid;
  reset role;
  insert into r values ('entregado deja de alertar','0', n::text, n=0);
end $$;

select * from r;
rollback;

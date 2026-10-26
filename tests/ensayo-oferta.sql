-- Ensayo de la oferta al transportista y de lo que se le debe.
-- Corre entero y hace ROLLBACK: no deja basura.
--
-- Cierra las dos tareas que quedaron pendientes de la reunion del 27 sep:
-- que el transportista vea SU monto y pueda aceptarlo o rechazarlo, y que
-- quede registrado el anticipo y la liquidacion de su lado.
--
-- Los pasos 14 y 15 son los que importan de verdad para el negocio: el
-- embarcador NO puede ver ni lo que se le paga al transportista ni la oferta.
-- Si alguno de esos dos sale en FALLA, el cliente puede calcular la comision.

begin;
create temp table r (paso text, esperado text, obtenido text, ok boolean) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
 ('dddddddd-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb4@e.test','x',now(),now(),now(),'{}','{}'),
 ('dddddddd-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','op4@e.test','x',now(),now(),now(),'{}','{}'),
 ('dddddddd-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tr4@e.test','x',now(),now(),now(),'{}','{}'),
 ('dddddddd-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tr5@e.test','x',now(),now(),now(),'{}','{}');
update public.user_roles set rol='operador' where user_id='dddddddd-0000-0000-0000-000000000002';

do $$
declare
  cid uuid; vid uuid; did uuid; cod text; qid uuid; sid uuid; oid uuid;
  cid2 uuid; e text; n numeric; c int; s public.shipments; o public.carrier_offers;
  OP   constant text := '{"sub":"dddddddd-0000-0000-0000-000000000002","role":"authenticated"}';
  TR   constant text := '{"sub":"dddddddd-0000-0000-0000-000000000003","role":"authenticated"}';
  TR2  constant text := '{"sub":"dddddddd-0000-0000-0000-000000000004","role":"authenticated"}';
  EMB  constant text := '{"sub":"dddddddd-0000-0000-0000-000000000001","role":"authenticated"}';
  doc record;
begin
  -- montaje: un transportista verificado con unidad y chofer, y otro sin papeles
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  select id into cid from public.alta_transportista('Fletes del Bajio SA','FBA010101AB1');
  select id into vid from public.alta_unidad(cid,'AB-123-CD','caja_seca_53','EC-01');
  select id into did from public.alta_operador(cid,'Jose Ramirez','LF-998877');
  for doc in select clave, aplica_a from public.document_types where requerido loop
    if doc.aplica_a='carrier' then perform public.registrar_documento(doc.clave,'e/'||doc.clave||'.pdf',cid,null,null,current_date+365);
    elsif doc.aplica_a='vehicle' then perform public.registrar_documento(doc.clave,'e/'||doc.clave||'.pdf',null,vid,null,current_date+365);
    else perform public.registrar_documento(doc.clave,'e/'||doc.clave||'.pdf',null,null,did,current_date+365); end if;
  end loop;
  for doc in select id from public.carrier_documents where carrier_id=cid or vehicle_id=vid or driver_id=did loop
    perform public.revisar_documento(doc.id,true,null,current_date+365);
  end loop;
  perform public.verificar_transportista(cid);
  cod := public.invitar_transportista(cid);
  select id into cid2 from public.alta_transportista('Fletes Sin Papeles SA','FSP020202XY2');
  reset role;
  perform set_config('request.jwt.claims', TR, true); set local role authenticated;
  perform public.canjear_invitacion(cod);
  reset role;

  insert into public.quotes (user_id,origin,dest,containers,price,precio_sugerido,status)
  values ('dddddddd-0000-0000-0000-000000000001','CDMX','Monterrey','2',10000,10000,'por_aprobar') returning id into qid;
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  perform public.aprobar_cotizacion(qid,10000,null,7000);
  reset role;
  perform set_config('request.jwt.claims', EMB, true); set local role authenticated;
  sid := public.accept_quote(qid);
  reset role;

  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin perform public.ofrecer_envio(sid, cid2, 7000); e:='lo acepto';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('1. no se ofrece a transportista sin verificar','rechazado', e, e='rechazado');

  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin perform public.ofrecer_envio(sid, cid, 12000); e:='lo acepto';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('2. rechaza monto que supera el precio','rechazado', e, e='rechazado');

  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  select * into o from public.ofrecer_envio(sid, cid, 6800, 'Sale manana 7am');
  reset role;
  oid := o.id;
  insert into r values ('3. la oferta se crea','ofrecida', o.estatus, o.estatus='ofrecida');

  select comision into n from public.shipments where id=sid;
  insert into r values ('4. la comision se recalcula con el monto ofrecido','3200', coalesce(n::text,'null'), n=3200);

  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin perform public.ofrecer_envio(sid, cid, 6500); e:='lo acepto';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('5. no deja dos ofertas vivas','rechazado', e, e='rechazado');

  perform set_config('request.jwt.claims', TR2, true); set local role authenticated;
  begin perform public.aceptar_oferta(oid, vid, did); e:='la acepto';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('6. un transportista ajeno no la responde','rechazado', e, e='rechazado');

  perform set_config('request.jwt.claims', TR, true); set local role authenticated;
  select count(*) into c from public.carrier_offers where id=oid;
  reset role;
  insert into r values ('7. el transportista ve su oferta','1', c::text, c=1);

  perform set_config('request.jwt.claims', TR, true); set local role authenticated;
  select * into s from public.aceptar_oferta(oid, vid, did);
  reset role;
  insert into r values ('8. al aceptar queda asignado','asignado', coalesce(s.carrier_id::text,'null'), s.carrier_id = cid);

  select monto into n from public.carrier_payables where shipment_id=sid and tipo='anticipo';
  insert into r values ('9. anticipo 60% de 6800','4080', coalesce(n::text,'null'), n=4080);
  select sum(monto) into n from public.carrier_payables where shipment_id=sid;
  insert into r values ('10. anticipo + liquidacion = el monto exacto','6800', coalesce(n::text,'null'), n=6800);

  perform set_config('request.jwt.claims', TR, true); set local role authenticated;
  begin perform public.reportar_avance(sid,'sali','Patio CDMX',null); e:='ok';
  exception when others then e:=sqlerrm; end;
  reset role;
  insert into r values ('11. ya puede reportar avance','ok', e, e='ok');

  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin
    perform public.marcar_pago_transportista((select id from public.carrier_payables where shipment_id=sid and tipo='anticipo'), '');
    e:='lo dejo';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('12. no se marca pagado sin referencia','rechazado', e, e='rechazado');

  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  perform public.marcar_pago_transportista((select id from public.carrier_payables where shipment_id=sid and tipo='anticipo'), 'SPEI 8842190');
  reset role;
  select count(*) into c from public.carrier_payables where shipment_id=sid and estatus='pagado';
  insert into r values ('13. con referencia queda pagado','1', c::text, c=1);

  perform set_config('request.jwt.claims', EMB, true); set local role authenticated;
  select count(*) into c from public.carrier_payables where shipment_id=sid;
  reset role;
  insert into r values ('14. el embarcador no ve el pago al transportista','0', c::text, c=0);

  perform set_config('request.jwt.claims', EMB, true); set local role authenticated;
  select count(*) into c from public.carrier_offers where shipment_id=sid;
  reset role;
  insert into r values ('15. el embarcador no ve la oferta','0', c::text, c=0);
end $$;

select paso, esperado, obtenido, case when ok then 'ok' else 'FALLA' end as resultado from r order by length(paso), paso;
rollback;

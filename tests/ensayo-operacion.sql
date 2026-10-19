-- Ensayo del flujo completo de operacion, de punta a punta.
-- Corre entero y hace ROLLBACK: no deja basura.
--
--   supabase db execute --file tests/ensayo-operacion.sql
--
-- A diferencia de las otras pruebas, que verifican aislamiento y rechazos,
-- esta recorre el camino feliz en el orden en que ocurre en la vida real:
-- alta del transportista, expediente, verificacion, invitacion, canje, envio,
-- asignacion y los cuatro hitos. Existe porque cada pieza se construyo en una
-- tarea distinta y nunca se habian corrido juntas.
--
-- HISTORIA: el 16 oct 2026 esta prueba reprobo los pasos 6 a 11. El hallazgo
-- fue que asignar_unidad() no escribia shipments.carrier_id, y todo el lado
-- del transportista filtra por carrier_id: un envio asignado jamas le llegaba
-- al transportista. El 19 oct se arreglo (migraciones 20261019112032 y
-- 20261019112640) y desde entonces los 12 pasos salen en ok.
--
-- Si algun paso sale en FALLA, las dos mitades del marketplace volvieron a
-- desconectarse. No es una prueba cosmetica.

begin;
create temp table r (paso text, esperado text, obtenido text, ok boolean) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
 ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb@ensayo.test','x',now(),now(),now(),'{}','{}'),
 ('aaaaaaaa-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','op@ensayo.test','x',now(),now(),now(),'{}','{}'),
 ('aaaaaaaa-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tr@ensayo.test','x',now(),now(),now(),'{}','{}');
update public.user_roles set rol='operador' where user_id='aaaaaaaa-0000-0000-0000-000000000002';

do $$
declare
  cid uuid; vid uuid; did uuid; cod text; qid uuid; sid uuid;
  e text; n int; t text; cstat text;
  OP  constant text := '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}';
  TR  constant text := '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';
  EMB constant text := '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
  doc record;
begin
  -- 1. El operador da de alta al transportista, su unidad y su operador
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  select id into cid from public.alta_transportista('Fletes del Bajio SA de CV','FBA010101AB1');
  select id into vid from public.alta_unidad(cid,'AB-123-CD','caja_seca_53','EC-01');
  select id into did from public.alta_operador(cid,'Jose Ramirez','LF-998877');
  reset role;
  insert into r values ('1. alta de transportista, unidad y operador','3 ids',
    coalesce(cid::text,'null'), cid is not null and vid is not null and did is not null);

  -- 2. Expediente: se registran y aprueban todos los documentos requeridos
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  for doc in select clave, aplica_a from public.document_types where requerido loop
    if doc.aplica_a = 'carrier' then
      perform public.registrar_documento(doc.clave, 'ensayo/'||doc.clave||'.pdf', cid, null, null, current_date + 365);
    elsif doc.aplica_a = 'vehicle' then
      perform public.registrar_documento(doc.clave, 'ensayo/'||doc.clave||'.pdf', null, vid, null, current_date + 365);
    else
      perform public.registrar_documento(doc.clave, 'ensayo/'||doc.clave||'.pdf', null, null, did, current_date + 365);
    end if;
  end loop;
  for doc in select id from public.carrier_documents
             where carrier_id = cid or vehicle_id = vid or driver_id = did loop
    perform public.revisar_documento(doc.id, true, null, current_date + 365);
  end loop;
  select count(*) into n from public.faltantes_transportista(cid);
  reset role;
  insert into r values ('2. expediente completo y aprobado','0 faltantes', n::text, n = 0);

  -- 3. Verificacion
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  perform public.verificar_transportista(cid);
  reset role;
  select estatus into cstat from public.carriers where id = cid;
  insert into r values ('3. transportista verificado','verificado', coalesce(cstat,'null'), cstat = 'verificado');

  -- 4. Invitacion y canje: la cuenta del transportista queda vinculada
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  cod := public.invitar_transportista(cid);
  reset role;
  perform set_config('request.jwt.claims', TR, true); set local role authenticated;
  perform public.canjear_invitacion(cod);
  reset role;
  select user_id::text into e from public.carriers where id = cid;
  insert into r values ('4. el transportista canjea su codigo','su cuenta vinculada',
    coalesce(e,'null'), e = 'aaaaaaaa-0000-0000-0000-000000000003');

  -- 5. Cotizacion aprobada y aceptada: nace el envio
  insert into public.quotes (user_id, origin, dest, containers, price, precio_sugerido, status)
  values ('aaaaaaaa-0000-0000-0000-000000000001','Ciudad de Mexico','Monterrey','2',3712,3712,'por_aprobar')
  returning id into qid;
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  perform public.aprobar_cotizacion(qid, 3712, null);
  reset role;
  perform set_config('request.jwt.claims', EMB, true); set local role authenticated;
  sid := public.accept_quote(qid);
  reset role;
  insert into r values ('5. cotizacion aprobada y aceptada','un envio',
    coalesce(sid::text,'null'), sid is not null);

  -- 6. El operador asigna la unidad
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin
    perform public.asignar_unidad(sid, cid, vid, did);
    e := 'ok';
  exception when others then e := sqlerrm; end;
  reset role;
  insert into r values ('6. el operador asigna la unidad','ok', e, e = 'ok');

  -- 7. EL ENLACE. Sin carrier_id, el transportista no ve nada.
  select carrier_id::text into t from public.shipments where id = sid;
  insert into r values ('7. el envio queda ligado al transportista', coalesce(cid::text,'?'),
    coalesce(t,'null'), t is not distinct from cid::text);

  -- 8. El transportista ve su envio
  perform set_config('request.jwt.claims', TR, true); set local role authenticated;
  select count(*) into n from public.shipments where id = sid;
  reset role;
  insert into r values ('8. el transportista ve su envio','1', n::text, n = 1);

  -- 9. Los cuatro hitos
  perform set_config('request.jwt.claims', TR, true); set local role authenticated;
  begin
    perform public.reportar_avance(sid,'sali','Patio CDMX',null);
    perform public.reportar_avance(sid,'voy_en_camino','Queretaro',null);
    perform public.reportar_avance(sid,'llegue','Monterrey',null);
    perform public.reportar_avance(sid,'entregue','Monterrey','Recibio almacen');
    e := 'ok';
  exception when others then e := sqlerrm; end;
  reset role;
  insert into r values ('9. el transportista reporta los 4 hitos','ok', e, e = 'ok');

  -- 10. El envio cierra entregado y con bitacora
  select status into t from public.shipments where id = sid;
  select count(*) into n from public.shipment_events where shipment_id = sid;
  insert into r values ('10. el envio queda entregado','delivered', coalesce(t,'null'), t = 'delivered');
  insert into r values ('11. la bitacora tiene los movimientos','5 o mas', n::text, n >= 5);

  -- 12. La promesa central del producto: solo transportistas verificados
  perform set_config('request.jwt.claims', OP, true); set local role authenticated;
  begin
    select id into cid from public.alta_transportista('Fletes Sin Papeles SA','FSP020202XY2');
    perform public.asignar_unidad(sid, cid, vid, did);
    e := 'lo acepto';
  exception when others then e := 'rechazado'; end;
  reset role;
  insert into r values ('12. rechaza transportista no verificado','rechazado', e, e = 'rechazado');
end $$;

select paso, esperado, obtenido, case when ok then 'ok' else 'FALLA' end as resultado from r order by length(paso), paso;
rollback;

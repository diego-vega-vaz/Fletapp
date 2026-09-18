-- Prueba de regresion del lado transportista (Fase 2, tarea 1).
-- Corre entera y hace ROLLBACK: no deja basura. Todas las filas deben salir ok = true.
--
--   supabase db execute --file tests/carriers.sql
--   (o pegarla en el SQL editor del proyecto)

begin;
create temp table r (prueba text, esperado text, obtenido text, ok boolean) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb@p.test','x',now(),now(),now(),'{}','{}'),
 ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','op@p.test','x',now(),now(),now(),'{}','{}');
update public.user_roles set rol='operador' where user_id='33333333-3333-3333-3333-333333333333';

do $$
declare e text; n int; cid uuid; vid uuid; did uuid; docid uuid; t record;
begin
  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.alta_transportista('Pirata SA'); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('embarcador da de alta transportista','rechazado',e,e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select id into cid from public.alta_transportista('Transportes del Pacifico SA de CV','TPA010101AB1','Luis','5555','l@t.mx');
  reset role;
  insert into r values ('operador da de alta transportista','uuid', coalesce(cid::text,'null'), cid is not null);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.verificar_transportista(cid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('verificar sin unidades','rechazado',e,e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select id into vid from public.alta_unidad(cid,'ab-123-cd','Tracto');
  select id into did from public.alta_operador(cid,'Juan Perez','LF998877');
  reset role;
  insert into r values ('alta unidad y operador','ok', coalesce(vid::text,'x')||'/'||coalesce(did::text,'x'), vid is not null and did is not null);

  select count(*) into n from public.faltantes_transportista(cid);
  insert into r values ('faltantes antes de cargar papeles','>0', n::text, n > 0);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.verificar_transportista(cid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('verificar con papeles faltantes','rechazado',e,e='rechazado');

  for t in select clave, aplica_a, vence from document_types where requerido loop
    insert into carrier_documents (tipo, carrier_id, vehicle_id, driver_id, storage_path, estatus,
                                   vence_el, revisado_por, revisado_en)
    values (t.clave,
            case when t.aplica_a='carrier' then cid end,
            case when t.aplica_a='vehicle' then vid end,
            case when t.aplica_a='driver'  then did end,
            'prueba/'||t.clave||'.pdf', 'aprobado',
            case when t.vence then current_date + 200 end,
            '33333333-3333-3333-3333-333333333333', now());
  end loop;
  select count(*) into n from public.faltantes_transportista(cid);
  insert into r values ('faltantes con todo aprobado','0', n::text, n = 0);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.verificar_transportista(cid); e:='ok';
  exception when others then e:='fallo: '||sqlerrm; end;
  reset role;
  insert into r values ('verificar con expediente completo','ok',e,e='ok');
  select estatus::text into e from carriers where id=cid;
  insert into r values ('estatus del transportista','verificado',e,e='verificado');

  update carrier_documents set vence_el = current_date - 1
   where carrier_id = cid and tipo = 'poliza_rc';
  select count(*) into n from public.faltantes_transportista(cid);
  insert into r values ('poliza vencida reaparece','1', n::text, n = 1);

  select id into docid from carrier_documents where carrier_id = cid limit 1;
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.revisar_documento(docid, false, null); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('rechazar sin motivo','rechazado',e,e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  -- Acotado al transportista de esta prueba: contar todos asume base vacia,
  -- y el dia que haya transportistas reales la prueba fallaria por nada.
  select count(*) into n from public.carriers where id = cid;
  reset role;
  insert into r values ('embarcador ve el transportista','0', n::text, n = 0);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.alta_unidad(cid,'AB123CD','Caja'); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('placas duplicadas (con y sin guiones)','rechazado',e,e='rechazado');
end $$;

select * from r;
rollback;

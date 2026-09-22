-- Prueba de regresion del expediente documental (Fase 2, tarea 2):
-- registrar_documento() y como cuentan los papeles para la verificacion.
-- Corre entera y hace ROLLBACK: no deja basura. Todas las filas deben salir ok = true.
--
--   supabase db execute --file tests/carriers-expediente.sql
--   (o pegarla en el SQL editor del proyecto)
--
-- Lo que NO prueba, a proposito: la subida real al bucket carrier-docs.
-- Eso vive en Storage, no en Postgres, y se prueba desde la pantalla.

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
declare e text; n int; cid uuid; vid uuid; d public.carrier_documents; d2 public.carrier_documents;
begin
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select id into cid from public.alta_transportista('Fletes de Prueba SA de CV','FPR010101AB1');
  select id into vid from public.alta_unidad(cid,'XY-987-ZW','Caja');
  reset role;

  -- 1. El embarcador no registra documentos. Es la mitad del marketplace que
  --    no le toca ver.
  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.registrar_documento('constancia_fiscal','x/y.pdf', cid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('embarcador registra documento','rechazado',e,e='rechazado');

  -- 2. Un documento cuelga de exactamente un dueno. Dos duenos es un dato
  --    que despues nadie sabe interpretar.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.registrar_documento('constancia_fiscal','x/y.pdf', cid, vid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('documento con dos duenos','rechazado',e,e='rechazado');

  -- 3. Ni cero duenos.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.registrar_documento('constancia_fiscal','x/y.pdf'); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('documento sin dueno','rechazado',e,e='rechazado');

  -- 4. El tipo tiene que existir en document_types. Si no, el expediente se
  --    llena de papeles que la verificacion nunca va a mirar.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.registrar_documento('constancia_inventada','x/y.pdf', cid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('tipo de documento inventado','rechazado',e,e='rechazado');

  -- 5. Sin ruta no hay archivo que revisar.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.registrar_documento('constancia_fiscal','   ', cid); e:='PASO';
  exception when others then e:='rechazado'; end;
  reset role;
  insert into r values ('ruta vacia','rechazado',e,e='rechazado');

  -- 6. Registro valido.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  d := public.registrar_documento('constancia_fiscal','carriers/'||cid||'/constancia_fiscal-1.pdf', cid);
  reset role;
  insert into r values ('registro valido','uuid', coalesce(d.id::text,'null'), d.id is not null);

  -- 7. Nace pendiente. Nadie se aprueba sus propios papeles.
  insert into r values ('nace pendiente','pendiente', d.estatus::text, d.estatus::text = 'pendiente');

  -- 8. Pendiente sigue contando como faltante.
  select count(*) into n from public.faltantes_transportista(cid)
   where tipo = 'constancia_fiscal';
  insert into r values ('pendiente sigue faltando','1', n::text, n = 1);

  -- 9. Renovar reemplaza, no acumula. La poliza se renueva cada ano; guardar
  --    todas las versiones solo hace que nadie sepa cual es la vigente.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  d2 := public.registrar_documento('constancia_fiscal','carriers/'||cid||'/constancia_fiscal-2.pdf', cid);
  reset role;
  select count(*) into n from carrier_documents
   where carrier_id = cid and tipo = 'constancia_fiscal';
  insert into r values ('renovar no duplica','1', n::text, n = 1);

  select count(*) into n from carrier_documents where id = d.id;
  insert into r values ('la fila nueva sustituye a la vieja','0', n::text, n = 0);

  -- 10. Aprobado deja de faltar.
  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  perform public.revisar_documento(d2.id, true, null);
  reset role;
  select count(*) into n from public.faltantes_transportista(cid)
   where tipo = 'constancia_fiscal';
  insert into r values ('aprobado deja de faltar','0', n::text, n = 0);

end $$;

select * from r;
rollback;

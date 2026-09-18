-- Prueba de regresion de RLS y roles. Se corre entera y hace ROLLBACK al final:
-- no deja basura en la base. Todas las filas deben salir con ok = true.
--
--   supabase db execute --file tests/rls.sql
--   (o pegarla en el SQL editor del proyecto)
--
-- Si alguna sale false, algo se abrio. No lo "arregles" en el front.

begin;

create temp table resultados (prueba text, esperado text, obtenido text, ok boolean) on commit drop;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb1@prueba.test','x',now(),now(),now(),'{}','{"full_name":"Embarcador Uno"}'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','emb2@prueba.test','x',now(),now(),now(),'{}','{"full_name":"Embarcador Dos"}'),
 ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','quique@prueba.test','x',now(),now(),now(),'{}','{"full_name":"Quique"}');

update public.user_roles set rol='operador' where user_id='33333333-3333-3333-3333-333333333333';

insert into public.shipments (id, user_id, origin, dest, price, paid, status)
values ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','CDMX','Manzanillo',40000,0,'waiting');

do $$
declare n int; e text;
begin
  perform set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.shipments;
  reset role;
  insert into resultados values ('embarcador ajeno ve envios','0',n::text, n=0);

  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.shipments;
  reset role;
  insert into resultados values ('el dueno ve su envio','1',n::text, n=1);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.shipments;
  reset role;
  insert into resultados values ('el operador ve el envio','1',n::text, n=1);

  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin
    update public.user_roles set rol='operador' where user_id='11111111-1111-1111-1111-111111111111';
    get diagnostics n = row_count;
    e := 'filas afectadas: '||n;
  exception when others then e := 'rechazado'; n := 0;
  end;
  reset role;
  insert into resultados values ('embarcador se auto-asciende','0 filas', e, n=0);

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin
    update public.shipments set price=1, paid=40000 where id='aaaaaaaa-0000-0000-0000-000000000001';
    get diagnostics n = row_count;
    e := 'filas afectadas: '||n;
  exception when others then e := 'rechazado'; n := 0;
  end;
  reset role;
  insert into resultados values ('operador cambia precio directo','0 filas', e, n=0);

  perform set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin
    perform public.mover_envio('aaaaaaaa-0000-0000-0000-000000000001','delivered');
    e := 'PASO';
  exception when others then e := 'rechazado';
  end;
  reset role;
  insert into resultados values ('embarcador mueve envio','rechazado', e, e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin
    perform public.mover_envio('aaaaaaaa-0000-0000-0000-000000000001','transit','Queretaro');
    e := 'ok';
  exception when others then e := 'rechazado: '||sqlerrm;
  end;
  reset role;
  insert into resultados values ('operador mueve envio','ok', e, e='ok');

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin
    perform public.mover_envio('aaaaaaaa-0000-0000-0000-000000000001','pagado_ya');
    e := 'PASO';
  exception when others then e := 'rechazado';
  end;
  reset role;
  insert into resultados values ('estatus inventado','rechazado', e, e='rechazado');

  perform set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  begin
    perform public.asignar_unidad('aaaaaaaa-0000-0000-0000-000000000001','Transportes X','Juan','');
    e := 'PASO';
  exception when others then e := 'rechazado';
  end;
  reset role;
  insert into resultados values ('asignar sin placas','rechazado', e, e='rechazado');

  select price::text into e from public.shipments where id='aaaaaaaa-0000-0000-0000-000000000001';
  insert into resultados values ('precio intacto tras todo','40000', e, e='40000');
end $$;

select * from resultados;

rollback;

-- Fase 1, Tarea 3: roles.
-- El rol NO vive en profiles a proposito: profiles tiene UPDATE abierto al
-- dueno, asi que un rol ahi seria auto-asignable desde la consola del
-- navegador. Es el mismo agujero que tenia recordPayment.
-- Esta tabla no tiene ninguna politica de INSERT/UPDATE/DELETE: solo el
-- service role la escribe.

create type public.rol_usuario as enum ('embarcador', 'transportista', 'operador');

create table public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  rol        public.rol_usuario not null default 'embarcador',
  asignado_en timestamptz not null default now()
);

comment on table public.user_roles is
  'Rol de cada usuario. Solo lo escribe el service role. El navegador nunca puede cambiarlo.';

alter table public.user_roles enable row level security;

create policy "user_roles: leer el propio"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Helper para las politicas. SECURITY DEFINER + search_path vacio para no
-- recursar sobre la RLS de user_roles y para no depender del search_path
-- de quien llama.
create or replace function public.es_operador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and rol = 'operador'
  );
$$;

create or replace function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.user_roles where user_id = (select auth.uid());
$$;

revoke execute on function public.es_operador() from public, anon;
revoke execute on function public.rol_actual() from public, anon;
grant execute on function public.es_operador() to authenticated;
grant execute on function public.rol_actual() to authenticated;

-- Todo usuario nuevo nace embarcador. Subir a operador o transportista es un
-- acto manual del service role, nunca un self-service.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.profiles (id, full_name, company)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company'
  );

  insert into public.user_roles (user_id, rol)
  values (new.id, 'embarcador')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Backfill: cualquier usuario que ya existiera queda como embarcador.
insert into public.user_roles (user_id, rol)
select id, 'embarcador' from auth.users
on conflict (user_id) do nothing;

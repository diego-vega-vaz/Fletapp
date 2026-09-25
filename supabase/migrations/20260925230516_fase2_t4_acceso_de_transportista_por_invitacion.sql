-- Fase 2, tarea 4 (primera mitad): que el transportista pueda entrar.
--
-- Como se vincula una cuenta a un transportista: por codigo de invitacion que
-- genera el operador. La alternativa era buscar al usuario por correo desde
-- una funcion security definer, y eso convierte la tabla de usuarios en un
-- directorio consultable. Con cinco transportistas, un codigo por WhatsApp
-- sobra.
--
-- Un transportista = una cuenta, por ahora (carriers.user_id). Cuando alguno
-- necesite despachador aparte del dueno se convierte en tabla de miembros;
-- inventarla hoy es diseñar para un problema que nadie tiene.

create table if not exists public.carrier_invites (
  codigo      text primary key,
  carrier_id  uuid not null references public.carriers(id) on delete cascade,
  creada_por  uuid references auth.users(id),
  creada_en   timestamptz not null default now(),
  expira_en   timestamptz not null default now() + interval '7 days',
  usada_por   uuid references auth.users(id),
  usada_en    timestamptz
);

alter table public.carrier_invites enable row level security;

-- Nadie lee esta tabla desde el navegador, ni el operador. El codigo se
-- entrega en la respuesta del RPC que lo crea y ya.
create policy "solo el operador ve las invitaciones"
  on public.carrier_invites for select
  to authenticated
  using ((select public.es_operador()));

create or replace function public.invitar_transportista(carrier uuid)
returns text
language plpgsql security definer set search_path = 'public'
as $$
declare
  c public.carriers;
  cod text;
  -- Sin I, O, 0 ni 1: este codigo se dicta por telefono.
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if not public.es_operador() then
    raise exception 'Solo el operador puede invitar a un transportista' using errcode = '42501';
  end if;

  select * into c from carriers where id = carrier;
  if not found then
    raise exception 'Transportista no encontrado' using errcode = 'P0002';
  end if;

  if c.user_id is not null then
    raise exception 'Ese transportista ya tiene una cuenta vinculada' using errcode = '22023';
  end if;

  loop
    cod := '';
    for i in 1..8 loop
      cod := cod || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from carrier_invites ci where ci.codigo = cod);
  end loop;

  insert into carrier_invites (codigo, carrier_id, creada_por)
  values (cod, carrier, auth.uid());

  return cod;
end; $$;

create or replace function public.canjear_invitacion(codigo text)
returns public.carriers
language plpgsql security definer set search_path = 'public'
as $$
declare
  inv public.carrier_invites;
  c   public.carriers;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesion' using errcode = '42501';
  end if;

  select * into inv from carrier_invites ci
   where ci.codigo = upper(trim(canjear_invitacion.codigo));
  if not found then
    raise exception 'Ese codigo no existe' using errcode = 'P0002';
  end if;

  if inv.usada_por is not null then
    raise exception 'Ese codigo ya se uso' using errcode = '22023';
  end if;

  if inv.expira_en < now() then
    raise exception 'Ese codigo ya vencio. Pide uno nuevo.' using errcode = '22023';
  end if;

  -- Una cuenta no puede quedar de los dos lados del marketplace.
  if exists (select 1 from carriers x where x.user_id = auth.uid() and x.id <> inv.carrier_id) then
    raise exception 'Esta cuenta ya esta vinculada a otro transportista' using errcode = '22023';
  end if;

  update carriers set user_id = auth.uid()
   where id = inv.carrier_id and user_id is null
  returning * into c;

  if not found then
    raise exception 'Ese transportista ya tiene una cuenta vinculada' using errcode = '22023';
  end if;

  update carrier_invites set usada_por = auth.uid(), usada_en = now()
   where carrier_invites.codigo = inv.codigo;

  -- El rol lo pone el servidor al canjear, nunca el navegador. Se respeta un
  -- rol de operador ya existente: degradar a un operador porque canjeo un
  -- codigo seria un candado contra uno mismo.
  update user_roles set rol = 'transportista'
   where user_id = auth.uid() and rol <> 'operador';

  return c;
end; $$;

revoke execute on function public.invitar_transportista(uuid) from public, anon;
revoke execute on function public.canjear_invitacion(text) from public, anon;
grant execute on function public.invitar_transportista(uuid) to authenticated;
grant execute on function public.canjear_invitacion(text) to authenticated;

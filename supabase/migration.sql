-- ============================================================
-- FletApp — Schema completo
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. PERFILES ─────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  company     text,
  rfc         text,
  phone       text,
  updated_at  timestamptz default now()
);

-- ── 2. COTIZACIONES ─────────────────────────────────────────
create sequence if not exists quote_seq start 1000;

create table if not exists quotes (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users on delete cascade not null,
  ref_id           text unique default ('RES-' || to_char(now(),'YYYY') || '-' || lpad(nextval('quote_seq')::text,5,'0')),
  origin           text not null,
  origin_code      text,
  dest             text not null,
  dest_code        text,
  cargo_type       text,
  containers       text,
  weight           text,
  cargo_desc       text,
  special          jsonb default '{}',
  customs          text,
  operation        text,
  incoterm         text,
  price            numeric,
  status           text default 'pending',   -- pending | accepted | expired
  expires_at       timestamptz default (now() + interval '24 hours'),
  created_at       timestamptz default now()
);

-- ── 3. ENVÍOS ───────────────────────────────────────────────
create table if not exists shipments (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users on delete cascade not null,
  quote_id         uuid references quotes,
  ref_id           text unique,
  origin           text not null,
  origin_code      text,
  dest             text not null,
  dest_code        text,
  containers       text,
  weight           text,
  cargo            text,
  price            numeric not null,
  paid             numeric default 0,
  status           text default 'transit',   -- transit | waiting | delivered | delayed
  depart_at        text,
  eta              text,
  eta_short        text,
  distance         text,
  duration         text,
  progress         numeric default 0,
  current_location text,
  carrier          text,
  driver           text,
  plate            text,
  created_at       timestamptz default now()
);

-- ── 4. FACTURAS ─────────────────────────────────────────────
create sequence if not exists invoice_seq start 1000;

create table if not exists invoices (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade not null,
  shipment_id  uuid references shipments,
  ref_id       text unique default ('A-' || to_char(now(),'YYYY') || '-' || lpad(nextval('invoice_seq')::text,4,'0')),
  uuid_cfdi    text default (gen_random_uuid()::text),
  concept      text,
  amount       numeric,
  status       text default 'pending',   -- pending | paid | overdue
  method       text,
  issued_at    text default to_char(now(),'DD Mon YYYY'),
  due_at       text,
  created_at   timestamptz default now()
);

-- ── 5. TICKETS DE SOPORTE ───────────────────────────────────
create sequence if not exists ticket_seq start 1000;

create table if not exists tickets (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  ticket_number text unique default ('#' || nextval('ticket_seq')::text),
  subject       text not null,
  category      text default 'General',
  priority      text default 'Media',
  status        text default 'open',   -- open | in_progress | resolved | closed
  shipment_ref  text,
  description   text,
  agent_name    text default 'Soporte FletApp',
  created_at    timestamptz default now()
);

create table if not exists ticket_messages (
  id          uuid default gen_random_uuid() primary key,
  ticket_id   uuid references tickets on delete cascade not null,
  is_user     boolean default true,
  author_name text,
  body        text not null,
  created_at  timestamptz default now()
);

-- ── 6. ROW LEVEL SECURITY ────────────────────────────────────
alter table profiles         enable row level security;
alter table quotes           enable row level security;
alter table shipments        enable row level security;
alter table invoices         enable row level security;
alter table tickets          enable row level security;
alter table ticket_messages  enable row level security;

-- Profiles
create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Quotes
create policy "own quotes" on quotes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Shipments
create policy "own shipments" on shipments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Invoices
create policy "own invoices" on invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tickets
create policy "own tickets" on tickets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ticket messages (via ticket ownership)
create policy "own ticket messages" on ticket_messages for all using (
  exists (select 1 from tickets where tickets.id = ticket_id and tickets.user_id = auth.uid())
);

-- ── 7. AUTO-CREAR PERFIL AL REGISTRARSE ─────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, company)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 8. FUNCIÓN PARA ACEPTAR COTIZACIÓN → CREAR ENVÍO ────────
create or replace function public.accept_quote(quote_id uuid)
returns uuid language plpgsql security definer as $$
declare
  q   quotes%rowtype;
  sid uuid;
  rn  text;
begin
  select * into q from quotes where id = quote_id and user_id = auth.uid();
  if not found then raise exception 'Quote not found'; end if;

  rn := q.ref_id;  -- reuse same ref_id for the shipment

  insert into shipments (
    user_id, quote_id, ref_id, origin, origin_code, dest, dest_code,
    containers, weight, cargo, price, paid, status,
    depart_at, eta, eta_short, distance, duration, progress, current_location
  ) values (
    auth.uid(), q.id, rn, q.origin, q.origin_code, q.dest, q.dest_code,
    q.containers, q.weight, q.cargo_desc, q.price, 0, 'transit',
    to_char(now() + interval '1 hour', 'DD Mon, HH12:MI AM'),
    to_char(now() + interval '20 hours', 'DD Mon, HH12:MI AM'),
    to_char(now() + interval '20 hours', 'HH12:MI AM'),
    '—', '—', 0, q.origin
  ) returning id into sid;

  -- Create advance invoice (50%)
  insert into invoices (user_id, shipment_id, concept, amount, status, due_at)
  values (
    auth.uid(), sid,
    'Flete ' || q.origin_code || ' → ' || q.dest_code || ' (anticipo 50%)',
    round(q.price * 0.5),
    'pending',
    to_char(now() + interval '3 days', 'DD Mon YYYY')
  );

  update quotes set status = 'accepted' where id = quote_id;
  return sid;
end;
$$;

-- ── 9. ENDURECIMIENTO: restringir ejecución de funciones ─────
-- El trigger handle_new_user NO debe ser llamable vía API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- accept_quote solo para usuarios autenticados
revoke execute on function public.accept_quote(uuid) from public, anon;
grant  execute on function public.accept_quote(uuid) to authenticated;

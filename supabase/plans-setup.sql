-- ============================================================
-- FleetApp — Planes de suscripción
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Agrega el plan al perfil (free | pro | empresa)
alter table profiles add column if not exists plan text default 'free';
alter table profiles add column if not exists plan_renews_at timestamptz;

-- Asegura que los perfiles existentes tengan plan
update profiles set plan = 'free' where plan is null;

-- ── Datos fiscales para CFDI 4.0 ──────────────────────────────
alter table profiles add column if not exists regimen_fiscal text;
alter table profiles add column if not exists uso_cfdi text;
alter table profiles add column if not exists cp_fiscal text;
alter table profiles add column if not exists domicilio_fiscal text;

-- ── Guardar el celular capturado en el registro ───────────────
-- Actualiza el trigger para copiar también el teléfono desde el registro
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, company, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ── Rebrand: FletApp → FleetApp en datos existentes ───────────
alter table tickets alter column agent_name set default 'Soporte FleetApp';
update tickets set agent_name = 'Soporte FleetApp' where agent_name = 'Soporte FletApp';

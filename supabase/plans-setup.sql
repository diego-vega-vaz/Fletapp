-- ============================================================
-- FletApp — Planes de suscripción
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

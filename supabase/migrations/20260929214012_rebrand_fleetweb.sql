-- Rebrand: FleetApp -> FleetWeb
--
-- Quique pidio el cambio de nombre el 29 sep 2026. En la base la marca solo
-- aparece en un lugar: el default de tickets.agent_name.
--
-- Hallazgo de paso: el default en produccion decia 'Soporte FletApp', no
-- 'Soporte FleetApp'. Las dos lineas de rebrand que estan escritas en
-- supabase/plans-setup.sql nunca se aplicaron a la base real. Es el mismo
-- patron que los revoke de la Fase 0: escrito en un .sql, jamas ejecutado.
-- Por eso los cambios de datos van como migracion y no como archivo suelto.

alter table public.tickets
  alter column agent_name set default 'Soporte FleetWeb';

update public.tickets
   set agent_name = 'Soporte FleetWeb'
 where agent_name in ('Soporte FletApp', 'Soporte FleetApp');

update public.ticket_messages
   set author_name = 'Soporte FleetWeb'
 where author_name in ('Soporte FletApp', 'Soporte FleetApp');
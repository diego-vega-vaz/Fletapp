-- Fase 2, tarea 5, paso 1: una cotizacion la libera una persona.
--
-- Hasta hoy el circuito era: la Edge Function calcula el precio y el
-- embarcador lo acepta solo. El precio sale de calcPrice, que todavia es
-- contenedores x $1,600 + $350 de casetas: no sabe distancia, ni ruta, ni lo
-- que cobra el transportista. Dejar que ese numero se convierta en un
-- compromiso de venta sin que nadie lo mire es la forma mas facil de mover
-- carga perdiendo dinero.
--
-- Estados de una cotizacion a partir de aqui:
--   por_aprobar -> aprobada  -> accepted   (el embarcador la acepta)
--               -> rechazada
-- El embarcador NO ve precio aceptable mientras este en por_aprobar.

alter table public.quotes
  add column if not exists precio_sugerido numeric,
  add column if not exists aprobada_por    uuid references auth.users(id),
  add column if not exists aprobada_en     timestamptz,
  add column if not exists ajuste_nota     text,
  add column if not exists motivo_rechazo  text;

-- El precio que hoy esta guardado fue calculado por el servidor: ese es el
-- sugerido. A partir de ahora `price` puede diferir si un humano lo ajusta, y
-- guardar los dos es lo que permite aprender del patron mas adelante.
update public.quotes set precio_sugerido = price where precio_sugerido is null;

-- Las cotizaciones que ya existian el embarcador ya las vio con su precio.
-- Mandarlas a por_aprobar seria reescribir la historia.
update public.quotes set status = 'aprobada' where status = 'pending';

alter table public.quotes drop constraint if exists quotes_status_valido;
alter table public.quotes add constraint quotes_status_valido
  check (status in ('por_aprobar','aprobada','rechazada','accepted','expired'));

comment on column public.quotes.precio_sugerido is
  'Lo que calculo el servidor. `price` es lo que se le ofrece al cliente. Si difieren, hubo ajuste humano y ajuste_nota dice por que.';

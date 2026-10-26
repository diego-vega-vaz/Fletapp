-- El dinero deja de ser un solo numero.
--
-- Hasta hoy una cotizacion tenia "price" y nada mas. No existia en ningun
-- lado lo que se le paga al transportista, asi que tampoco existia la
-- comision: el margen del negocio no era un dato, era una cuenta mental.
--
-- Decision pendiente de Quique: el PORCENTAJE de comision y quien la paga.
-- Por eso aqui no se fija ningun porcentaje. La comision es una resta:
-- lo que cobra FleetWeb menos lo que cuesta el transportista. El operador
-- captura el costo caso por caso, que es el acuerdo de "humanos en el
-- circuito" hasta tener 30 envios reales. Cuando haya tarifario y se cierre
-- el porcentaje, esto se vuelve una sugerencia automatica, no un cambio de
-- estructura.

alter table public.quotes
  add column if not exists costo_transportista numeric;

comment on column public.quotes.costo_transportista is
  'Lo que se le paga al transportista por este flete. Lo captura el operador al aprobar. Null = todavia no se sabe.';

alter table public.quotes
  add column if not exists comision numeric
  generated always as (price - costo_transportista) stored;

comment on column public.quotes.comision is
  'Calculada: price - costo_transportista. No se escribe a mano, no se puede desincronizar.';

alter table public.shipments
  add column if not exists costo_transportista numeric,
  add column if not exists comision numeric;

comment on column public.shipments.costo_transportista is
  'Copia del costo al momento de aceptar. Se congela: si la cotizacion cambia despues, el envio no.';
comment on column public.shipments.comision is
  'Copia de la comision al momento de aceptar. Se congela igual que el costo.';

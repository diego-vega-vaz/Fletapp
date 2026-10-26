-- Quedaron dos aprobar_cotizacion(): la vieja de 3 argumentos y la nueva de 4
-- con default en el cuarto. Una llamada con 3 argumentos es ambigua entre las
-- dos y Postgres la rechaza con "function is not unique".
--
-- No se puede quitar el default (Postgres exige DROP) ni se puede dropear (en
-- esta base DROP FUNCTION se cuelga, ver decisiones.md 19 oct 2026). Pero
-- ALTER FUNCTION ... RENAME TO si funciona: se renombra la vieja y deja de
-- estorbar. Las llamadas de 3 argumentos caen sola en la nueva, que trae
-- default en el cuarto, asi que el frontend sigue funcionando sin cambios.

alter function public.aprobar_cotizacion(uuid, numeric, text)
  rename to aprobar_cotizacion_retirada_20261026;

comment on function public.aprobar_cotizacion_retirada_20261026(uuid, numeric, text) is
  'Version anterior, sin costo de transportista. Retirada el 26 oct 2026. No se usa. No se puede borrar porque DROP FUNCTION se cuelga en esta base.';

revoke execute on function public.aprobar_cotizacion_retirada_20261026(uuid, numeric, text) from public;
revoke execute on function public.aprobar_cotizacion_retirada_20261026(uuid, numeric, text) from anon;
revoke execute on function public.aprobar_cotizacion_retirada_20261026(uuid, numeric, text) from authenticated;
revoke execute on function public.aprobar_cotizacion(uuid, numeric, text, numeric) from public;
revoke execute on function public.aprobar_cotizacion(uuid, numeric, text, numeric) from anon;

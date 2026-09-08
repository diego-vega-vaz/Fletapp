-- ─────────────────────────────────────────────────────────────
-- Fase 0 · Tarea 1 — Quitar el CFDI falso
-- 7 sep 2026
--
-- La tabla invoices generaba uuid_cfdi con gen_random_uuid(): un folio
-- fiscal inventado, indistinguible de uno real, presentado en la UI como
-- CFDI 4.0. Esta migración:
--   1) elimina el default, para que ninguna factura nueva nazca con folio falso
--   2) borra los folios ya generados, que no corresponden a ningún timbrado
--
-- A partir de aquí, uuid_cfdi se llena ÚNICAMENTE desde el servidor con el
-- folio que devuelve el PAC. Null significa "sin timbrar", que es la verdad.
--
-- APLICADA en produccion el 7 sep 2026 (proyecto srhfhqbxdrethdwiejoz).
-- ─────────────────────────────────────────────────────────────

alter table invoices alter column uuid_cfdi drop default;

update invoices set uuid_cfdi = null where uuid_cfdi is not null;

comment on column invoices.uuid_cfdi is
  'Folio fiscal (UUID) del CFDI timbrado por el PAC. Solo lo escribe el servidor. Null = sin timbrar.';

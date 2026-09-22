# Bitácora de decisiones técnicas — FleetApp

Por qué se eligió cada cosa. En cuatro meses nadie se va a acordar, y el
cliente sí va a preguntar.

Formato: qué se decidió, qué alternativas había, por qué. Se anota **el mismo
día** que se toma la decisión.

---

## 2026-09-07 · uuid_cfdi deja de tener valor por defecto

**Decisión.** `invoices.uuid_cfdi` pierde el `default gen_random_uuid()::text`.
El folio fiscal lo escribe únicamente el servidor con la respuesta del PAC.
`null` significa "sin timbrar".

**Alternativas.** Dejar el default y filtrar en la interfaz. Se descartó: el
problema no era mostrarlo, era generarlo. Un folio inventado en la base es
indistinguible de uno real para cualquiera que consulte la tabla después.

**Por qué.** Presentar folios fiscales inventados como CFDI 4.0 es la
exposición legal más fácil de eliminar del proyecto y no costaba nada.

---

## 2026-09-07 · Facturas pasan a llamarse comprobantes

**Decisión.** En toda la interfaz, "Factura" → "Comprobante", con un aviso
visible de que no tienen validez fiscal. También se quitaron los botones de
descarga de PDF y XML, que no descargaban nada, y una CLABE de ejemplo que
aparecía como cuenta de cobro real.

**Alternativas.** Ocultar la sección completa hasta tener PAC. Se descartó:
el registro de cobros sí sirve hoy; lo que no existe es el timbrado.

**Por qué.** Principio del proyecto: nunca presentar como real algo que no lo
es. La CLABE era lo más grave — alguien podía transferir dinero ahí.

---

## 2026-09-07 · El navegador lee, el servidor escribe

**Decisión.** Se eliminan todas las políticas RLS "for all". Ninguna tabla
acepta `UPDATE` ni `DELETE` desde el navegador, salvo el perfil propio.
Cotizaciones y tickets se pueden crear y leer. Envíos y facturas, sólo leer.

**Consecuencia aceptada.** `recordPayment()` en `src/lib/db.ts` deja de
funcionar. Es intencional: marcaba facturas como pagadas sin que existiera
pasarela. Ese flujo se reescribe contra la pasarela real en Fase 3.

**Alternativas.** Restringir sólo `shipments` e `invoices`, como decía el plan
original. Se amplió al encontrar que `quotes` tenía el mismo hueco y era peor:
un usuario podía crear su cotización, cambiarle el precio a $1 desde la consola
y aceptarla. Como `accept_quote` es `SECURITY DEFINER` y lee el precio
guardado, ese precio manipulado se convertía en un envío real.

**Además.** Se aplicaron los `revoke` de funciones que ya estaban escritos en
`migration.sql` pero **nunca se habían aplicado a la base**. `handle_new_user`,
que es un trigger, era invocable por cualquiera desde la API pública.

> Nota operativa: el contenido de `migration.sql` no coincidía con el estado
> real de la base. Conviene asumir que hay más diferencias y verificar contra
> la base antes de confiar en ese archivo.

---

## 2026-09-14 · Un solo formateador de dinero

**Decisión.** `fmtUSD` desaparece. Queda `fmtMXN` con locale `es-MX`, definido
en `src/data/mockData.ts`. `plans.ts` lo reexporta en vez de tener el suyo.

**Alternativas.** Renombrar y ya, como decía el plan. No era posible:
`plans.ts` ya tenía **otro** `fmtMXN` con formato distinto
(`Intl.NumberFormat`, sin decimales) y `CotizacionPage` importa de ambos
módulos. El rename simple no habría compilado.

**Por qué.** Todo en FleetApp se cobra en pesos. Dos formateadores con el mismo
nombre y salidas distintas es una discrepancia esperando ocurrir en una
factura.

**Pendiente que esto NO resuelve.** Los importes siguen siendo de relleno.
$350 de casetas CDMX–Monterrey y $40/hora de demora están fuera de la realidad
del mercado. Se corrigen en Fase 5 con el tarifario real del corredor.

---

## Cómo mantener esta bitácora

Una entrada por decisión que alguien pueda cuestionar después: elección de
pasarela, de PAC, de proveedor de mapas, de modelo de datos. No para cada
commit.

Si la decisión se revierte, no se borra la entrada: se agrega una nueva
explicando por qué cambió.

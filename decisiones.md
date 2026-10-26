# Bitácora de decisiones técnicas — FleetWeb

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

**Por qué.** Todo en FleetWeb se cobra en pesos. Dos formateadores con el mismo
nombre y salidas distintas es una discrepancia esperando ocurrir en una
factura.

**Pendiente que esto NO resuelve.** Los importes siguen siendo de relleno.
$350 de casetas CDMX–Monterrey y $40/hora de demora están fuera de la realidad
del mercado. Se corrigen en Fase 5 con el tarifario real del corredor.

---

## 2026-09-29 · La marca pasa de FleetApp a FleetWeb

**Decisión.** Quique pidió el cambio de nombre. Toda la aplicación, la base de
datos y la documentación dicen ahora **FleetWeb**. Es el segundo cambio de
nombre: el 22 de septiembre se había pasado de FletApp a FleetApp.

**Qué se cambió.** 47 archivos. Texto visible en las 20 pantallas, el título
del navegador, el logotipo (la palabra estaba partida en dos `<span>` con
pesos distintos y el reemplazo automático no la alcanzaba), los nombres de los
CSV que exporta la app, los correos de contacto, la llave de `localStorage` del
onboarding, los comentarios del código y el default de `tickets.agent_name` en
producción, que va como migración.

**Lo que NO se cambió, a propósito.** El repositorio sigue llamándose
`Fletapp`, la carpeta local sigue siendo `Documents\Fletapp`, el proyecto de
Vercel se sigue llamando `fletapp` y el token de push sigue siendo
`fleetapp-push`. Son identificadores de infraestructura, no la marca:
renombrarlos rompe el remoto de git, el enlace con Vercel y el despliegue
continuo, a cambio de nada que el usuario vea. Se cambian cuando se compre el
dominio propio, en un movimiento planeado y no de pasada.

**Actualización del 1 de octubre.** Quique añadió `fleetweb-mx.vercel.app` como
dominio del mismo proyecto (`fleetweb.vercel.app` estaba ocupado). Se añadió,
no se renombró el proyecto, así que `fletapp-nine.vercel.app` sigue
respondiendo y nada de lo que apuntaba ahí se rompió. Es una dirección
provisional: la definitiva será el dominio propio cuando se compre, y eso
depende de que el abogado confirme que "FleetWeb" se puede registrar.

`chats/` tampoco se tocó. Es el registro de conversaciones tal como
ocurrieron; reescribirlo sería falsificar un histórico.

**Hallazgo de paso.** El default de `tickets.agent_name` en la base real decía
`'Soporte FletApp'`, no `'Soporte FleetApp'`. Las dos líneas de rebrand que
están escritas en `supabase/plans-setup.sql` desde el 22 de septiembre **nunca
se aplicaron a la base**. Es el mismo patrón que los `revoke` de la Fase 0:
SQL escrito en un archivo suelto que nadie ejecutó. Por eso este cambio va como
migración numerada y verificada por md5 contra
`supabase_migrations.schema_migrations`, y no como otra línea en un `.sql` de
instalación.

**La guardia de honestidad ahora lo vigila.** `scripts/verificar-verdad.mjs`
prohíbe `FletApp` y `FleetApp` en el bundle compilado. Si un nombre viejo
regresa a cualquier pantalla, CI se cae. Antes la regla prohibía `FletApp` y
exigía `FleetApp`; el reemplazo automático la había invertido hasta prohibir la
marca nueva, lo cual habría tumbado todos los builds. Se corrigió a mano.

**Riesgo que no me corresponde cerrar.** Nadie ha verificado que "FleetWeb"
esté libre en MARCANET del IMPI, clases 39 y 42, ni que el dominio esté
disponible. Es el mismo problema que ya tenía "FleetApp": un nombre genérico en
inglés es difícil de registrar como marca. Dos cambios de nombre en ocho días
salen baratos hoy y caros cuando haya facturas timbradas y clientes que
conocen el nombre. **Conviene hacer la búsqueda antes del tercero.**

---

## 2026-10-01 · Fuera casetas y aduanas del cobro

**Decisión.** Quique pidió quitar de la cotización el servicio aduanal y los
peajes estimados. Las dos cosas salieron del **cobro**, no sólo de la pantalla.

**Alternativas.** Quitar la línea del desglose y dejar el cargo dentro del
total. Se descartó sin discusión: eso es cobrar algo que el cliente no puede
ver. Es la misma familia de problema que el CFDI inventado, sólo que en
sentido contrario.

También se consideró plegar los $350 de casetas dentro de la tarifa base para
no cambiar el total. Se descartó por lo mismo: el total habría quedado igual
pero nadie podría explicar de dónde sale.

**Por qué.** Los $350 de casetas eran una cifra inventada para la ruta
CDMX–Monterrey; nunca correspondieron al mercado. Las casetas reales llegan
con el tarifario del corredor, como parte del costo de ruta, en Fase 5. Y
FleetWeb no va a prestar servicio aduanal, así que ofrecerlo en pantalla era
prometer algo que nadie iba a hacer.

**Qué cambió.** `calculo.ts` pierde `CASETAS_FIJAS` y `ADUANAS`; el desglose
deja de tener `tolls` y `customs`; el asistente de cotización baja de cuatro
pasos a tres y desaparece el paso de aduanas completo, con su tipo de
operación y su carga de documentos. La landing prometía "desglose claro de
costos, peajes e IVA" y ya no hay línea de peajes, así que la frase salió.

`FORMULA_VERSION` sube a `prototipo-2026-10`. El desglose cambió de forma: las
cotizaciones viejas tienen `tolls` y `customs` guardados y las nuevas no. Para
eso existe el campo.

**Lo que NO se tocó.** La columna `customs` de `quotes` se queda. Las
cotizaciones anteriores tienen su valor y borrar una columna con datos no se
deshace. Los términos y condiciones siguen mencionando los peajes como factor
que puede variar el precio, y eso sigue siendo cierto.

**La guardia de honestidad lo vigila**, con dos reglas nuevas, 20 en total:
`Peajes estimados` y `gestión aduanal`. `Peajes` a secas no sirve como regla
porque los términos lo mencionan legítimamente.

**La Edge Function se volvió a desplegar el mismo día**, versión 6. Es la regla
que ya costó dos días de producción desfasada en septiembre: el cálculo vive en
el servidor, así que cambiar `calculo.ts` en el repositorio no cambia nada
hasta desplegarlo. Si la pantalla hubiera bajado a tres pasos mientras el
servidor seguía cobrando $350 y $2,500, nadie se habría enterado hasta ver una
factura.

---

## 2026-10-16 · La pantalla de pago simulaba un cobro completo

**Qué se encontró.** `PagosPage` anunciaba pagos que nunca ocurrían. El botón
Confirmar llamaba a `recordPayment()`, que hace `UPDATE` sobre `shipments` e
`invoices` desde el navegador. RLS bloquea esos UPDATE desde la Fase 0, y
PostgREST responde **cero filas sin error**: la función no fallaba. Acto
seguido la pantalla inventaba un folio `TRX-####` con `Math.random()`, abría
un modal que decía "¡Pago confirmado! Tu envío ha sido marcado como
entregado", y ofrecía "Descargar recibo", que sólo lanzaba un aviso de
"Recibo descargado" sin generar nada.

Alrededor había cuatro cosas más que no existen: una tarjeta Visa terminación
4242 presentada como método guardado, una **CLABE de Banamex**, una línea de
"Crédito FleetWeb · Disponible: $5,000 MXN" y el sello "Pagos seguros ·
Encriptación SSL 256-bit".

**Por qué sobrevivió a la Fase 0.** La guardia de honestidad sí tenía regla
para la CLABE, pero escrita con los 18 dígitos (`002154007000000001`). La de
esta pantalla tiene 15. La regla no la cachaba. Una regla demasiado específica
da la sensación de estar cubierto sin estarlo; ahora busca por prefijo.

**Decisión.** La pantalla no se arregla contra la pasarela, porque la pasarela
todavía no está elegida. Se convierte en lo que de verdad es: una consulta de
saldo. Muestra el envío y el desglose, dice con todas sus letras que el pago
en línea no está habilitado, y manda a coordinar con una persona. Incluye una
línea defensiva: "Esta pantalla no cobra ni guarda métodos de pago. Si alguna
vez te pide datos de tarjeta, no es FleetWeb."

**Alternativa descartada.** Dejar el botón y que `recordPayment` lanzara error
al no afectar filas. Se descartó: un botón de pagar que siempre falla es ruido
para el usuario y una invitación a que alguien lo "arregle" reabriendo la
escritura desde el cliente.

**Qué más salió.** `recordPayment()` se eliminó de `db.ts`. El estado de dinero
lo escribirá el webhook de la pasarela contra una Edge Function con service
role, nunca el navegador. Y `mockData.ts` quedó sólo con `fmtMXN`: sus
arreglos de ejemplo no los importaba ningún módulo, pero igual viajaban al
bundle cargando la tarjeta 4242 y el crédito inexistente.

**La guardia subió de 20 a 27 reglas**, con la CLABE por prefijo y seis nuevas:
`••••4242`, `TRX-`, `Pago confirmado`, `Recibo descargado`, `Encriptaci` y
`Crédito FleetWeb` en sus dos grafías. Si cualquiera vuelve al bundle, CI se
cae.

---

## 2026-10-16 · Las dos mitades del marketplace no estaban conectadas

**Qué se encontró.** Al correr por primera vez el flujo completo de punta a
punta (`tests/ensayo-operacion.sql`), los seis primeros pasos pasaron y los
cinco últimos fallaron. Evidencia contra producción, en transacción revertida:

| Paso | Esperado | Obtenido |
|---|---|---|
| 7. el envío queda ligado al transportista | su id | null |
| 8. el transportista ve su envío | 1 | 0 |
| 9. reporta los 4 hitos | ok | "Ese envio no esta asignado a tu empresa" |
| 10. el envío queda entregado | delivered | waiting |

**La causa.** `asignar_unidad()` recibía el transportista como texto libre y
escribía `shipments.carrier`, `.plate` y `.driver`. Nunca escribía
`shipments.carrier_id`. Y todo el lado del transportista filtra por
`carrier_id`: sus políticas de lectura y `reportar_avance()`, que exige
`s.carrier_id = public.mi_carrier()`.

O sea: **un envío asignado desde la consola jamás le aparece al transportista,
y el transportista nunca puede reportar avance.** Las dos mitades se
construyeron en tareas distintas y el enlace entre ellas nunca se hizo. Como
no se ha operado un envío real, nadie lo había notado.

**El segundo problema, más grave de negocio.** Con texto libre, nada impedía
asignarle un envío a un transportista inexistente, o existente pero **no
verificado**. "Transportistas verificados" es la promesa central del producto
y no estaba sostenida en el único punto donde importa.

**Por qué el ensayo sí lo encontró y las pruebas no.** Las pruebas existentes
verifican aislamiento y rechazos: que un transportista no vea los envíos de
otro, que un código inventado falle. Todas pasan. Ninguna recorría el camino
feliz completo en orden. Un sistema puede tener todas sus piezas correctas y
no funcionar, porque lo que falla es la junta entre ellas.

**El arreglo** está escrito en `supabase/pendiente/asignar_unidad_v2.sql` y
**todavía no está aplicado**, a propósito: cambia la firma de la función, así
que aplicarlo sin actualizar al mismo tiempo `src/lib/roles.ts` y la consola
de operación dejaría la consola llamando a una función que ya no existe. Las
dos cosas se sueltan en el mismo despliegue.

La versión nueva recibe ids de registros reales, valida que el transportista
esté verificado y que la unidad y el operador sean de ese transportista, y
escribe `carrier_id`. Cuando se aplique, el ensayo debe salir todo en verde.

---

## Cómo mantener esta bitácora

Una entrada por decisión que alguien pueda cuestionar después: elección de
pasarela, de PAC, de proveedor de mapas, de modelo de datos. No para cada
commit.

Si la decisión se revierte, no se borra la entrada: se agrega una nueva
explicando por qué cambió.

---

## 2026-10-19 · Las dos mitades del marketplace ya se tocan

**Decisión.** `asignar_unidad()` deja de recibir el transportista como texto
libre. La firma nueva es `(envio_id uuid, carrier uuid, unidad uuid, operador
uuid)`, escribe `shipments.carrier_id` y rechaza cualquier transportista que no
esté en `estatus = 'verificado'`. La consola de operación ya no tiene tres
cajas de texto: tiene tres listas que sólo ofrecen transportistas verificados,
y sus unidades y operadores reales.

**El problema.** El lado del transportista entero filtra por `carrier_id`: sus
políticas de lectura y `reportar_avance()`, que exige `s.carrier_id =
mi_carrier()`. La función vieja nunca escribía esa columna. Un envío asignado
desde la consola jamás le aparecía al transportista y el transportista nunca
podía reportar avance. Las dos mitades se construyeron en tareas distintas y
el enlace nunca se hizo; como todavía no se ha operado ningún envío real,
nadie lo había notado.

El texto libre traía un segundo hoyo: nada impedía asignarle un envío a un
transportista inexistente, o existente pero sin verificar. "Transportistas
verificados" es la promesa central del producto y no estaba sostenida en el
único punto donde importa.

**Cómo salió.** Lo encontró `tests/ensayo-operacion.sql`, un ensayo de punta a
punta que recorre el camino feliz completo en una transacción con rollback. Es
la primera vez que las piezas se corrieron juntas. Hoy la prueba tiene 12 pasos
y los 12 salen en verde; el paso 12 comprueba que un transportista sin
verificar es rechazado.

**El ensayo también atrapó un bug de la propia corrección**: el parámetro se
llamaba `carrier` y `shipments` tiene una columna `carrier`, así que el UPDATE
tronaba con *column reference "carrier" is ambiguous*. Se arregló copiando los
parámetros a variables locales con prefijo (migración `20261019112640`). Nunca
llegó a la app.

---

## 2026-10-19 · En esta base, `DROP FUNCTION` se queda colgado

**Hallazgo.** Tres intentos de `apply_migration` y uno de `execute_sql` con la
migración de `asignar_unidad` se colgaron a los 180 s sin aplicar nada. Aislado
el síntoma: `create or replace function` entra al instante, y cualquier
sentencia que contenga `drop function` se cuelga y no borra nada. Ni siquiera
respeta `statement_timeout`, así que el bloqueo no parece estar en Postgres
sino en la capa que recibe la consulta. `pg_stat_activity` no mostró ningún
bloqueador activo.

**Decisión.** No pelearse con eso ahora. Las funciones viejas no se borran: se
reemplazan con `create or replace` por un cuerpo que lanza excepción y manda a
la firma nueva, y se les quita el permiso de ejecución a `public`, `anon` y
`authenticated`. El efecto práctico es el mismo y no bloquea el despliegue.

**Pendiente.** Quedan dos funciones muertas en la base: la firma vieja de
`asignar_unidad(uuid, text, text, text)` y `ping_prueba_ddl()`, sobra de este
mismo diagnóstico. Ambas están documentadas con `comment on` y sin permisos.
Se borran cuando `DROP FUNCTION` vuelva a funcionar.

---

## 2026-10-26 · La comisión deja de ser una cuenta mental

**Decisión.** La cotización ya guarda `costo_transportista` —lo que se le paga
al transportista— y `comision`, que es una **columna generada**: `price −
costo_transportista`. No se escribe a mano, así que no se puede desincronizar.
El envío se lleva su propia copia de los dos al aceptarse, y esa copia se
congela: si mañana alguien edita la cotización, el envío ya cerrado no cambia
de margen. Un envío es un hecho, no una vista de la cotización.

**Por qué no hay porcentaje de comisión.** Quique no ha cerrado ni el
porcentaje ni quién la paga. En vez de inventar un número, la comisión es una
resta y el operador captura el costo caso por caso, que además es el acuerdo
de "humanos en el circuito" hasta los 30 envíos. Cuando haya tarifario y
porcentaje cerrado, eso se vuelve una **sugerencia automática**, no un cambio
de estructura. Esta decisión se tomó así a propósito para no bloquear el
avance en una decisión ajena.

**Reglas del servidor.** El costo tiene que ser mayor a cero; si la comisión
sale cero o negativa, `aprobar_cotizacion()` rechaza con el monto exacto en el
mensaje. Aprobar un flete que pierde dinero tiene que ser una decisión
consciente, no un dedazo. Se puede aprobar **sin** costo todavía, porque al
principio se cotiza antes de llamar al transportista; entonces la comisión
queda **nula**, no cero. Cero sería mentira.

**En pantalla.** El modal de revisar cotización tiene un campo nuevo para el
costo y muestra la comisión en pesos y en porcentaje **antes** de aprobar, en
verde o en rojo. El botón se bloquea si el margen es malo. La validación está
en los dos lados: la del navegador es cortesía, la que manda es la del
servidor.

**Un estorbo más de los que no se pueden dropear.** Al agregarle el cuarto
parámetro con default, quedaron dos `aprobar_cotizacion()` y una llamada de
tres argumentos se volvía ambigua (*function is not unique*). Postgres no deja
quitar un default sin `DROP`, y aquí `DROP FUNCTION` se cuelga. Lo que sí
funciona es `ALTER FUNCTION … RENAME TO`: la vieja se renombró a
`aprobar_cotizacion_retirada_20261026` y dejó de estorbar. Las llamadas de tres
argumentos caen solas en la nueva.

**Prueba.** `tests/ensayo-dinero.sql`, ocho pasos, los ocho en verde contra
producción en transacción revertida.

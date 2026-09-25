# FleetApp — contexto para Claude Code

## Qué es esto

Un intermediario digital de fletes terrestres en México. Un embarcador pide
precio, FleetApp le consigue un camión verificado, cobra, le paga al
transportista y se queda con la comisión.

**Modelo de negocio: marketplace / brokerage. Se cobra COMISIÓN POR FLETE, no
suscripción.** Los planes de pago que siguen en el código son herencia de una
etapa anterior y se van a apagar.

Stack: React 19 + Vite + TypeScript, Supabase (Auth, Postgres, Storage),
deploy continuo en Vercel desde `main`. Producción: fletapp-nine.vercel.app

Fecha límite: 31 de diciembre de 2026.

## Cómo quiero que me ayudes

- Responde en español, directo y sin relleno.
- **Sé auditor, no porrista.** Si algo que propongo tiene un hoyo, dímelo antes
  de ayudarme a construirlo. Prefiero enterarme ahora que en diciembre.
- Antes de opinar sobre el código, léelo. No supongas.
- Distingue siempre lo que ya está construido de lo que sólo está prometido en
  la landing.
- En temas fiscales, legales o de seguros: dame el panorama y dime qué
  confirmar con el contador o el abogado. **No inventes requisitos del SAT.**
- Al estimar tiempos, recuerda que el camino crítico son los terceros
  (abogado, PAC, póliza, conseguir transportistas y embarcadores), no mi
  velocidad escribiendo código.

## Principios que no se negocian

- **Nada de dinero ni lógica de negocio en el navegador.** Precio, comisión,
  pagos y timbrado viven en el servidor.
- **Nunca presentar como real algo que no lo es.** Ni CFDI falso, ni rastreo
  simulado, ni precios inventados en producción.
- Humanos en el circuito al inicio: cotización aprobada por una persona, camión
  asignado por una persona. Automatizar antes de 30 envíos reales es como se
  quema el trimestre.
- Un corredor primero. Nada nacional desde el día uno.

## Estado real — no confíes en la landing

Última revisión: 25 sep 2026.

### Ya está hecho y verificado en producción

- CFDI falso eliminado. `invoices.uuid_cfdi` ya no tiene default; el folio lo
  escribe sólo el servidor con la respuesta del PAC.
- Toda la app en pesos. Un solo formateador: `fmtMXN` en `src/data/mockData.ts`,
  locale `es-MX`. `plans.ts` lo reexporta. **No crees un segundo formateador.**
- RLS cerrado: sólo quedan tres políticas de escritura desde el navegador
  (perfil propio, tickets propios, mensajes de ticket propios). Nada de dinero.
- **Edge Function `cotizar`**: el precio lo calcula y lo guarda el servidor.
  La aritmética vive en `supabase/functions/cotizar/calculo.ts`, aparte del
  handler, para poder probarla sin levantar nada.
- **Roles** en tabla propia (`user_roles`: operador / embarcador /
  transportista), para que nadie se auto-ascienda editando su perfil. Todo
  movimiento pasa por RPC: `mover_envio`, `asignar_unidad`.
- **Bitácora** `shipment_events`: cada movimiento con autor y fecha.
- **Lado transportista**: `carriers`, `vehicles`, `drivers`,
  `carrier_documents` y el catálogo `document_types`. Bucket privado
  `carrier-docs`. `verificar_transportista()` falla y **nombra el papel que
  falta**; un documento vencido vuelve a contar como faltante.
- **Aprobación humana de cotizaciones**: nacen en `por_aprobar`. El operador
  aprueba (puede ajustar el precio, y si lo cambia el servidor le exige nota) o
  rechaza con motivo. `accept_quote` sólo acepta las aprobadas.
- **Alertas de lo que va tarde**: `envios_en_riesgo()`. Tres motivos, todos
  ausencias comprobables: sin camión a las 24 h, `compromiso_en` vencido, sin
  movimiento en la bitácora en 24 h. No inventa posición.
- **Acceso del transportista**: el operador genera un código de 8 caracteres
  (`invitar_transportista`), el transportista lo canjea una vez
  (`canjear_invitacion`) y su cuenta queda ligada a `carriers.user_id`. Ve
  sólo sus envíos por RLS y reporta avance con `reportar_avance` (salí, voy en
  camino, llegué, entregué). **No ve el precio del flete.**
- **Pruebas**: 16 de Playwright, guardia de honestidad sobre el bundle, y en
  SQL `tests/rls.sql`, `tests/carriers.sql`, `tests/carriers-expediente.sql`,
  `tests/cotizaciones-aprobacion.sql`, `tests/transportista-acceso.sql`.
  CI en GitHub Actions en cada push.

### No existe, aunque la interfaz lo sugiera

1. **Pagos.** No hay pasarela ni webhook. `recordPayment()` está roto a
   propósito (ver abajo).
2. **CFDI real.** Falta PAC y Carta Porte 3.1.
3. **Precio real.** `calculo.ts` sigue siendo contenedores × $1,600 + $350 de
   casetas. Ya vive en el servidor y ya lo revisa un humano, pero **las cifras
   siguen siendo de relleno**. Se sustituyen en Fase 5 con el tarifario real.
4. **Rastreo.** `progress` es un número que nadie actualiza. El mapa es un SVG
   con coordenadas fijas de CDMX–Monterrey. Las alertas NO son rastreo.
5. **Marketplace abierto.** El transportista ya entra y reporta avance, pero
   NO hay "carga disponible" que pueda aceptar, ni ve su tarifa. Las dos cosas
   dependen de la figura fiscal y del tarifario. Los papeles los sigue
   cargando el operador por ellos.
6. **Multiusuario.** Todo cuelga de `user_id`; hay roles pero no
   organizaciones. Diferido a propósito hasta saber la figura fiscal.
7. **Staging, monitoreo y respaldos probados.** Las migraciones se aplican
   directo a producción. Es una apuesta consciente, no un olvido.

## Trampas que ya costaron caro

**`supabase/migration.sql` NO refleja el estado real de la base.** Los `revoke`
de funciones llevaban meses escritos ahí sin haberse aplicado nunca: 
`handle_new_user`, que es un trigger, era invocable por cualquiera desde la API
pública. **Verifica contra la base, no contra el archivo.**

**`recordPayment()` en `src/lib/db.ts` está roto a propósito.** Al cerrar el
RLS dejó de funcionar. Marcaba facturas como pagadas sin que existiera
pasarela. No lo "arregles" devolviéndole permisos de escritura al navegador:
se reescribe contra la pasarela real en Fase 3.

**Las cifras del cotizador son de relleno.** $350 de casetas CDMX–Monterrey y
$40/hora de demora están fuera de la realidad del mercado. La moneda ya está
correcta; los números no. Se sustituyen en Fase 5 con el tarifario real.

**Cuidado con `String.replace()` en scripts de edición masiva.** `$$` y `$'`
son patrones especiales de reemplazo y corrompen el texto en silencio. Ya pasó
una vez: `'$' + n.toLocaleString(...)` quedó destrozado. Usa una función como
reemplazo: `s.replace(o, () => n)`.

## Disciplina de verificación

La lección más cara del proyecto hasta ahora:

> Una verificación que compara contra lo que uno mismo produjo no verifica
> nada. Tiene que compararse contra una fuente independiente.

Antes de dar por buena una tanda de cambios: compila (`npm run build`, que
corre `tsc -b` primero) y revisa el diff completo, no sólo los archivos que
creíste tocar.

## Comandos

```
npm install
npm run build     # tsc -b && vite build
npm run dev
```

## Plan

7 fases en 16 semanas. Al 23 de septiembre: Fase 0 al 71%, Fase 1 al 57%
(faltan staging, Sentry y respaldos), Fase 2 con las tareas 1, 2, 3 y 5
cerradas y la 4 a medias.

**Lo que bloquea de verdad no es código.** Sin movimiento desde el 15 de
septiembre: la figura fiscal (¿FleetApp asume el flete o sólo conecta?), el
PAC, la pasarela de pago y la tarifa real de un corredor. Las cuatro son
requisito de entrada de la Fase 3, y las cuatro dependen de Quique.

El detalle vive en la hoja de cálculo del proyecto, no en el repo.

## Éxito el 31 de diciembre

20 a 30 envíos reales cobrados en UN corredor, 5 transportistas verificados
operando, 3 a 5 embarcadores que repitieron, comisión efectivamente ingresada
y facturas timbradas de verdad.

**No "la plataforma terminada".**

## Dónde corre cada cosa (18 sep 2026)

Hay tres entornos y confundirlos cuesta horas. Esto es lo que funciona y lo
que no, medido, no supuesto.

**La VM de escritorio de Cowork** (`device_bash`, carpeta montada en
`~/mnt/Fletapp`): sirve para editar archivos, leer, `git status`, `git diff`,
`git commit` y correr scripts de Node sueltos.

- `vite build` **truena con "Bus error"** ahí. Reproducible, también
  escribiendo fuera de la carpeta montada: el binario nativo de rolldown no
  corre en esa VM. `tsc` sí pasa.
- `npm install` tarda más de los 180 s que dura una llamada, y si se corta a
  medias **deja `node_modules` corrupto** (a `lucide-react` le faltaron sus
  `.d.ts` y `tsc` se quejó de algo que no era un error de código). Si pasa:
  `rm -rf node_modules/<paquete>` y reinstalar ese paquete solo.
- Cada llamada es un sandbox nuevo: **no hay procesos en segundo plano** entre
  llamadas, `nohup` no sirve.
- Borrar archivos requiere permiso explícito del usuario una vez por sesión.
- **No tiene credenciales de git.** `git push` falla con "could not read
  Username". Empujar es del lado de Diego, en Windows.

**El contenedor de la nube** (la sesión de Cowork): ahí sí compila, prueba y
saca capturas. Chromium viene instalado. El ciclo probado:

```bash
bash scripts/empaquetar-fuente.sh     # en la VM, genera fuente.tar.gz (~1.6 MB)
# subir el tar, desempacar en la nube, npx tsc -b && npx vite build
# node scripts/verificar-verdad.mjs && npx playwright test
```

**Windows, con Claude Code**: el único lugar con `npm run dev` de verdad, las
credenciales de git y sin límite de tiempo por comando. Ahí va el ciclo de
desarrollo largo y el `git push`.

Regla corta: **la base de datos y la verificación, en la nube; los archivos y
el git, en la VM; correr la app y empujar, en Windows.**

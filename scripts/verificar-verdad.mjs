/**
 * Guardia de honestidad — se corre sobre el bundle YA COMPILADO.
 *
 * Por que existe:
 * FleetApp presentaba como reales tres cosas que no lo eran (folios fiscales
 * inventados, descargas de PDF y XML que no descargaban nada, y una CLABE de
 * ejemplo como cuenta de cobro). Se corrigieron en Fase 0. Este script existe
 * para que no vuelvan sin que nadie se entere.
 *
 * Revisa el bundle y no el codigo fuente a proposito: asi cubre TODAS las
 * pantallas, incluidas las que estan detras de login y que una prueba de
 * navegador no alcanza sin credenciales.
 *
 * Si una de estas reglas te estorba, la respuesta correcta casi nunca es
 * borrarla: es que la funcion ya existe de verdad. En ese caso quita la regla
 * en el mismo commit que la hace verdadera, y anotalo en decisiones.md.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist/assets'

const PROHIBIDO = [
  { patron: 'fmtUSD',
    porque: 'El formateador de dinero se llama fmtMXN. Todo se cobra en pesos.' },
  { patron: 'en-US',
    porque: 'El locale de dinero es es-MX. en-US formatea pesos como si fueran dolares.' },
  { patron: 'USD',
    porque: 'La app cobra en pesos mexicanos. Decir USD en pantalla termina en una disputa con un cliente.' },
  { patron: '002154007000000001',
    porque: 'CLABE de ejemplo presentada como cuenta de cobro real. Alguien puede transferir ahi.' },
  { patron: 'uuid_cfdi',
    porque: 'El folio fiscal no debe existir en el navegador. Lo escribe el servidor con la respuesta del PAC.' },
  { patron: '.xml descargado',
    porque: 'Descarga falsa: un XML solo existe si hay CFDI timbrado.' },
  { patron: '.pdf descargado',
    porque: 'Descarga falsa: no se genera ningun PDF.' },
  { patron: 'Genera y descarga tus facturas CFDI 4.0 automaticamente',
    porque: 'No hay PAC. Prometer timbrado automatico es falso.' },
  { patron: 'Pagos seguros y facturacion CFDI',
    porque: 'No hay pasarela ni PAC.' },
  { patron: 'Pagos protegidos',
    porque: 'No hay pasarela de pago. Nada esta protegido todavia.' },
  { patron: 'FletApp',
    porque: 'La marca se escribe FleetApp. Se decidio el 22 sep 2026. Dos grafias del mismo negocio en la misma app es como se ve un proyecto sin dueno.' },
  { patron: 'tiempo real',
    porque: 'No hay rastreo en vivo. Quique lo dejo para despues el 15 sep; el avance de un envio lo reporta el operador a mano y queda en shipment_events. Prometer tiempo real es lo mismo que el CFDI falso.' },
  { patron: 'Cobros protegidos',
    porque: 'No hay pasarela. Nada esta protegido todavia.' },
  { patron: 'menores a 2 horas',
    porque: 'SLA de soporte que nadie se comprometio a cumplir y no hay quien lo mida.' },
  { patron: '*1600',
    porque: 'La tarifa por contenedor volvio al navegador. El precio lo calcula la Edge Function cotizar; si la formula viaja al cliente, el cliente la puede cambiar.' },
]

// Cosas que SI tienen que estar: si desaparecen, alguien quito una advertencia honesta.
const OBLIGATORIO = [
  { patron: 'no tienen validez fiscal',
    porque: 'El aviso de que los comprobantes no son CFDI tiene que seguir visible.' },
]

if (!existsSync(DIST)) {
  console.error(`\n  No existe ${DIST}. Corre "npm run build" antes de esta verificacion.\n`)
  process.exit(1)
}

const archivos = readdirSync(DIST).filter(f => f.endsWith('.js') || f.endsWith('.css'))
const bundle = archivos.map(f => readFileSync(join(DIST, f), 'utf8')).join('\n')

const fallas = []

for (const { patron, porque } of PROHIBIDO) {
  if (bundle.includes(patron)) fallas.push(`  PROHIBIDO  "${patron}"\n             ${porque}`)
}
for (const { patron, porque } of OBLIGATORIO) {
  if (!bundle.includes(patron)) fallas.push(`  FALTA      "${patron}"\n             ${porque}`)
}

if (fallas.length) {
  console.error('\nGuardia de honestidad: FALLO\n')
  console.error(fallas.join('\n\n'))
  console.error('\nNo se presenta como real algo que no lo es. Corrige antes de desplegar.\n')
  process.exit(1)
}

console.log(`Guardia de honestidad: OK (${archivos.length} archivos revisados, ${PROHIBIDO.length} reglas)`)

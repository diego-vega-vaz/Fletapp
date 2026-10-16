/**
 * Guardia de honestidad — se corre sobre el bundle YA COMPILADO.
 *
 * Por que existe:
 * FleetWeb presentaba como reales tres cosas que no lo eran (folios fiscales
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
  { patron: '00215400700000',
    porque: 'CLABE de ejemplo presentada como cuenta de cobro real. Alguien puede transferir ahi. Se busca por prefijo a proposito: la regla vieja pedia los 18 digitos y la pantalla de pago traia la misma CLABE con 15, asi que paso un mes entero sin que nadie la cachara.' },
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
    porque: 'Nombre viejo. La marca se llama FleetWeb desde el 29 sep 2026, por peticion de Quique. Dos grafias del mismo negocio en la misma app es como se ve un proyecto sin dueno.' },
  { patron: 'FleetApp',
    porque: 'Nombre viejo. La marca se llama FleetWeb desde el 29 sep 2026, por peticion de Quique.' },
  { patron: '\u2022\u2022\u2022\u20224242',
    porque: 'Tarjeta Visa de ejemplo presentada como metodo de pago guardado. No hay pasarela ni tarjetas guardadas.' },
  { patron: 'TRX-',
    porque: 'Folio de transaccion inventado con Math.random() y presentado como comprobante de un pago que nunca ocurrio.' },
  { patron: 'Pago confirmado',
    porque: 'La pantalla anunciaba un pago confirmado mientras el UPDATE lo bloqueaba RLS. No se confirma un pago hasta que lo confirme la pasarela.' },
  { patron: 'Recibo descargado',
    porque: 'Descarga falsa: no se genera ningun recibo. Misma familia que el .pdf y el .xml de la Fase 0.' },
  { patron: 'Encriptaci',
    porque: 'Sello de seguridad sin nada detras. No hay procesamiento de pagos que encriptar todavia.' },
  { patron: 'Credito FleetWeb',
    porque: 'Linea de credito que no existe. No hay producto de credito ni quien lo otorgue.' },
  { patron: 'Cr\u00e9dito FleetWeb',
    porque: 'Linea de credito que no existe. No hay producto de credito ni quien lo otorgue.' },
  { patron: 'tiempo real',
    porque: 'No hay rastreo en vivo. Quique lo dejo para despues el 15 sep; el avance de un envio lo reporta el operador a mano y queda en shipment_events. Prometer tiempo real es lo mismo que el CFDI falso.' },
  { patron: 'Cobros protegidos',
    porque: 'No hay pasarela. Nada esta protegido todavia.' },
  { patron: 'menores a 2 horas',
    porque: 'SLA de soporte que nadie se comprometio a cumplir y no hay quien lo mida.' },
  { patron: 'lido hasta: Hoy a las',
    porque: 'Vigencia escrita a mano que no corresponde a expires_at. La cotizacion vence 24 h despues de que el operador la aprueba, no a las 5 de la tarde de hoy.' },
  { patron: 'Peajes estimados',
    porque: 'Las casetas salieron del cobro el 1 oct 2026. Los $350 fijos eran inventados. Las reales entran con el tarifario del corredor, dentro del costo de ruta.' },
  { patron: 'gestion aduanal',
    porque: 'FleetWeb no presta servicio aduanal. Quique lo quito el 1 oct 2026. Ofrecerlo en pantalla es prometer algo que nadie va a hacer.' },
  { patron: 'gestión aduanal',
    porque: 'FleetWeb no presta servicio aduanal. Quique lo quito el 1 oct 2026.' },
  { patron: '*1600',
    porque: 'La tarifa por contenedor volvio al navegador. El precio lo calcula la Edge Function cotizar; si la formula viaja al cliente, el cliente la puede cambiar.' },
]

// Cosas que SI tienen que estar: si desaparecen, alguien quito una advertencia honesta.
const OBLIGATORIO = [
  { patron: 'no tienen validez fiscal',
    porque: 'El aviso de que los comprobantes no son CFDI tiene que seguir visible.' },
  { patron: 'Este precio es un estimado',
    porque: 'El embarcador tiene que saber que el precio que ve al cotizar todavia lo revisa una persona. Si desaparece, la pantalla vuelve a presentar un calculo automatico como si fuera una oferta en firme.' },
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

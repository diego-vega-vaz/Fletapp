/**
 * Guardia de secretos — corre en CI antes que nada.
 *
 * Por que existe: el repositorio es PUBLICO y a partir de Fase 3 el proyecto
 * maneja el Certificado de Sello Digital de una empresa real. Una llave
 * privada commiteada no se arregla borrandola: queda en el historial de git y
 * en cualquier copia que alguien haya clonado. Se arregla revocando el
 * certificado ante el SAT y tramitando otro.
 *
 * Por eso esto falla el CI antes de compilar, y no despues.
 */
import { execSync } from 'node:child_process'

const EXTENSIONES = /\.(key|cer|pfx|p12|sdg|req)$/i

// Cadenas que solo aparecen dentro de una llave privada o un certificado.
const CONTENIDO = [
  { patron: '-----BEGIN PRIVATE KEY-----',           que: 'una llave privada' },
  { patron: '-----BEGIN RSA PRIVATE KEY-----',       que: 'una llave privada RSA' },
  { patron: '-----BEGIN ENCRYPTED PRIVATE KEY-----', que: 'una llave privada cifrada' },
  { patron: '-----BEGIN CERTIFICATE-----',           que: 'un certificado' },
]

const archivos = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n').filter(Boolean)

const hallazgos = []

for (const f of archivos) {
  if (EXTENSIONES.test(f)) {
    hallazgos.push(`${f}: la extension es de una credencial`)
    continue
  }
  // Este mismo archivo contiene los patrones como texto; saltarlo.
  if (f === 'scripts/verificar-secretos.mjs') continue
  let texto
  try {
    texto = execSync(`git show HEAD:"${f}"`, { encoding: 'utf8', maxBuffer: 20e6 })
  } catch { continue }
  for (const { patron, que } of CONTENIDO) {
    if (texto.includes(patron)) hallazgos.push(`${f}: contiene ${que}`)
  }
}

if (hallazgos.length) {
  console.error('\nHAY CREDENCIALES EN EL REPOSITORIO:\n')
  for (const h of hallazgos) console.error('  - ' + h)
  console.error(`
No basta con borrar el archivo y volver a commitear: queda en el historial.
Si esto es el CSD de la empresa, hay que revocarlo ante el SAT y tramitar otro.
`)
  process.exit(1)
}

console.log(`Guardia de secretos: OK (${archivos.length} archivos revisados)`)

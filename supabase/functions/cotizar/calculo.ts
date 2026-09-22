// Logica pura de cotizacion: sin red, sin base de datos, sin Deno.
// Separada del handler a proposito para poder probarla. El dinero es la parte
// que no se puede verificar "a ojo".

// OJO: cifras de RELLENO heredadas del prototipo. $350 de casetas para
// CDMX-Monterrey y las tarifas por contenedor no corresponden al mercado real.
// Se sustituyen en Fase 5 con el tarifario del corredor. Esta tarea mueve el
// CALCULO al servidor; no corrige las CIFRAS. Cambiar ambas cosas a la vez
// hace imposible saber cual de los dos cambios rompio algo.
export const FORMULA_VERSION = 'prototipo-2026-09'
export const TARIFA_POR_CONTENEDOR = 1600
export const CASETAS_FIJAS = 350
export const RECARGO: Record<string, number> = { frozen: 800, hazard: 1200, oog: 950 }
export const ADUANAS = 2500
export const IVA = 0.16
export const MAX_CONTENEDORES = 40

export interface Desglose {
  base: number; tolls: number; special: number; customs: number
  subtotal: number; iva: number; total: number
  formula_version: string; moneda: 'MXN'
}

export function calcularPrecio(input: {
  containers: number
  special: Record<string, boolean>
  customs: string
}): Desglose {
  const base = input.containers * TARIFA_POR_CONTENEDOR
  const tolls = CASETAS_FIJAS
  let special = 0
  for (const clave of Object.keys(RECARGO)) {
    if (input.special[clave]) special += RECARGO[clave]
  }
  const customs = input.customs === 'yes' ? ADUANAS : 0
  // subtotal = base gravable, TODO lo que se cobra antes de IVA (aduanas
  // incluidas). Antes excluia aduanas y el IVA se sacaba aparte: el numero
  // llamado "subtotal" no era el que iria en una factura.
  const subtotal = base + tolls + special + customs
  const iva = Math.round(subtotal * IVA)
  return {
    base, tolls, special, customs, subtotal, iva,
    total: subtotal + iva,
    formula_version: FORMULA_VERSION,
    moneda: 'MXN',
  }
}

const texto = (v: unknown, max = 500) =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

export function validar(body: Record<string, unknown>) {
  const errores: string[] = []

  const origin = texto(body.origin, 120)
  const dest = texto(body.dest, 120)
  if (!origin) errores.push('Falta el origen.')
  if (!dest) errores.push('Falta el destino.')

  const containers = Number(body.containers)
  if (!Number.isInteger(containers) || containers < 1 || containers > MAX_CONTENEDORES) {
    errores.push(`El numero de contenedores debe ser un entero entre 1 y ${MAX_CONTENEDORES}.`)
  }

  const customs = texto(body.customs, 10)
  if (customs && !['yes', 'no'].includes(customs)) {
    errores.push('El campo customs debe ser yes o no.')
  }

  // Solo se aceptan los recargos que el tarifario conoce. Cualquier otra llave
  // que mande el navegador se descarta: no puede inventar un recargo nuevo.
  const entrada = (body.special ?? {}) as Record<string, unknown>
  const special: Record<string, boolean> = {}
  for (const clave of Object.keys(RECARGO)) special[clave] = entrada[clave] === true

  return {
    errores,
    limpio: {
      origin, dest,
      origin_code: texto(body.origin_code, 10),
      dest_code: texto(body.dest_code, 10),
      cargo_type: texto(body.cargo_type, 40),
      containers, special,
      customs: customs || 'no',
      weight: texto(body.weight, 40),
      cargo_desc: texto(body.cargo_desc, 1000),
      operation: texto(body.operation, 60),
      incoterm: texto(body.incoterm, 20),
    },
  }
}

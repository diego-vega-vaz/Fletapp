// Logica pura de cotizacion: sin red, sin base de datos, sin Deno.
// Separada del handler a proposito para poder probarla. El dinero es la parte
// que no se puede verificar "a ojo".

// OJO: cifras de RELLENO heredadas del prototipo. La tarifa por contenedor no
// corresponde al mercado real. Se sustituye en Fase 5 con el tarifario del
// corredor.
//
// 1 oct 2026: fuera casetas y aduanas, por peticion de Quique.
//   - Casetas: eran $350 fijos inventados para la ruta CDMX-Monterrey. No se
//     escondieron dentro de la tarifa base: se quitaron del cobro. Cobrar algo
//     que no aparece en el desglose es justo lo que este proyecto no hace.
//     Las casetas reales entran con el tarifario, como parte del costo de ruta.
//   - Aduanas: FleetWeb no va a prestar ese servicio por ahora.
//
// FORMULA_VERSION sube porque el desglose cambio de forma: las cotizaciones
// viejas tienen tolls y customs guardados, las nuevas no. Asi se distinguen.
export const FORMULA_VERSION = 'prototipo-2026-10'
export const TARIFA_POR_CONTENEDOR = 1600
export const RECARGO: Record<string, number> = { frozen: 800, hazard: 1200, oog: 950 }
export const IVA = 0.16
export const MAX_CONTENEDORES = 40

export interface Desglose {
  base: number; special: number
  subtotal: number; iva: number; total: number
  formula_version: string; moneda: 'MXN'
}

export function calcularPrecio(input: {
  containers: number
  special: Record<string, boolean>
}): Desglose {
  const base = input.containers * TARIFA_POR_CONTENEDOR
  let special = 0
  for (const clave of Object.keys(RECARGO)) {
    if (input.special[clave]) special += RECARGO[clave]
  }
  // subtotal = base gravable, TODO lo que se cobra antes de IVA.
  const subtotal = base + special
  const iva = Math.round(subtotal * IVA)
  return {
    base, special, subtotal, iva,
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
      weight: texto(body.weight, 40),
      cargo_desc: texto(body.cargo_desc, 1000),
      incoterm: texto(body.incoterm, 20),
    },
  }
}

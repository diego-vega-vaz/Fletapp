import { test, expect } from '@playwright/test'
import {
  calcularPrecio, validar, MAX_CONTENEDORES, FORMULA_VERSION,
} from '../supabase/functions/cotizar/calculo'

// La aritmetica del dinero es lo unico de este proyecto que no se puede
// revisar a ojo. Estas pruebas corren sin red y sin base de datos.

test('el desglose cuadra: subtotal + IVA = total', () => {
  const d = calcularPrecio({ containers: 2, special: { frozen: true } })
  expect(d.base).toBe(3200)          // 2 x 1600
  expect(d.special).toBe(800)        // refrigerado
  // subtotal es la base gravable: TODO lo que se cobra antes de IVA.
  expect(d.subtotal).toBe(4000)      // 3200 + 800
  expect(d.subtotal).toBe(d.base + d.special)
  expect(d.iva).toBe(640)            // 16% de 4000
  expect(d.total).toBe(d.subtotal + d.iva)
  expect(d.total).toBe(4640)
  expect(d.moneda).toBe('MXN')
  expect(d.formula_version).toBe(FORMULA_VERSION)
})

test('los recargos se suman, no se pisan', () => {
  const uno = calcularPrecio({ containers: 1, special: { hazard: true } })
  const tres = calcularPrecio({
    containers: 1, special: { frozen: true, hazard: true, oog: true },
  })
  expect(uno.special).toBe(1200)
  expect(tres.special).toBe(800 + 1200 + 950)
})

// ── Lo que se quito el 1 oct 2026 y no debe volver solo ─────────────────

test('el desglose ya no trae casetas ni aduanas', () => {
  const d = calcularPrecio({ containers: 3, special: {} })
  expect(d).not.toHaveProperty('tolls')
  expect(d).not.toHaveProperty('customs')
  // Y no se escondieron dentro de la base: 3 contenedores son 3 x 1600 exactos.
  expect(d.base).toBe(4800)
  expect(d.subtotal).toBe(4800)
})

test('si el navegador manda aduanas, se ignora y no cobra de mas', () => {
  const { errores, limpio } = validar({
    origin: 'CDMX', dest: 'Monterrey', containers: 1,
    customs: 'yes', operation: 'Importación',
  } as Record<string, unknown>)
  expect(errores).toEqual([])
  expect(limpio).not.toHaveProperty('customs')
  expect(limpio).not.toHaveProperty('operation')
  expect(calcularPrecio(limpio).total).toBe(1856)   // 1600 + 256 de IVA
})

// ── Lo que impide que alguien cotice un flete en $1 ──────────────────────

test('un precio enviado por el cliente no entra al calculo', () => {
  const { limpio } = validar({
    origin: 'CDMX', dest: 'Monterrey', containers: 2,
    price: 1, total: 1,
  } as Record<string, unknown>)
  expect(limpio).not.toHaveProperty('price')
  expect(limpio).not.toHaveProperty('total')
  // 2 x 1600 = 3200 subtotal; IVA 512; total 3712. Ni cerca de $1.
  expect(calcularPrecio(limpio).total).toBe(3712)
})

test('un recargo inventado por el cliente se descarta', () => {
  const { limpio } = validar({
    origin: 'CDMX', dest: 'Monterrey', containers: 1,
    special: { descuento_secreto: true, frozen: false },
  })
  expect(limpio.special).toEqual({ frozen: false, hazard: false, oog: false })
  expect(calcularPrecio(limpio).special).toBe(0)
})

test('rechaza contenedores fuera de rango o que no son enteros', () => {
  for (const containers of [0, -3, 1.5, MAX_CONTENEDORES + 1, 'muchos', null]) {
    const { errores } = validar({ origin: 'A', dest: 'B', containers } as Record<string, unknown>)
    expect(errores.join(' '), `deberia rechazar containers=${containers}`).toMatch(/contenedores/)
  }
})

test('exige origen y destino', () => {
  const { errores } = validar({ containers: 1 })
  expect(errores.join(' ')).toMatch(/origen/)
  expect(errores.join(' ')).toMatch(/destino/)
})

test('una cotizacion valida no genera errores', () => {
  const { errores } = validar({
    origin: 'Ciudad de México', dest: 'Monterrey', containers: 2,
  })
  expect(errores).toEqual([])
})

import { test, expect } from '@playwright/test'
import {
  calcularPrecio, validar, MAX_CONTENEDORES, FORMULA_VERSION,
} from '../supabase/functions/cotizar/calculo'

// La aritmetica del dinero es lo unico de este proyecto que no se puede
// revisar a ojo. Estas pruebas corren sin red y sin base de datos.

test('el desglose cuadra: subtotal + aduanas + IVA = total', () => {
  const d = calcularPrecio({ containers: 2, special: { frozen: true }, customs: 'yes' })
  expect(d.base).toBe(3200)          // 2 x 1600
  expect(d.tolls).toBe(350)
  expect(d.special).toBe(800)        // refrigerado
  expect(d.customs).toBe(2500)
  expect(d.subtotal).toBe(4350)      // base + casetas + especial
  expect(d.iva).toBe(1096)           // 16% de (4350 + 2500), redondeado
  expect(d.total).toBe(d.subtotal + d.customs + d.iva)
  expect(d.total).toBe(7946)
  expect(d.moneda).toBe('MXN')
  expect(d.formula_version).toBe(FORMULA_VERSION)
})

test('los recargos se suman, no se pisan', () => {
  const uno = calcularPrecio({ containers: 1, special: { hazard: true }, customs: 'no' })
  const tres = calcularPrecio({
    containers: 1, special: { frozen: true, hazard: true, oog: true }, customs: 'no',
  })
  expect(uno.special).toBe(1200)
  expect(tres.special).toBe(800 + 1200 + 950)
})

test('sin aduanas no se cobra el cargo de aduanas', () => {
  expect(calcularPrecio({ containers: 1, special: {}, customs: 'no' }).customs).toBe(0)
})

// ── Lo que impide que alguien cotice un flete en $1 ──────────────────────

test('un precio enviado por el cliente no entra al calculo', () => {
  const { limpio } = validar({
    origin: 'CDMX', dest: 'Monterrey', containers: 2, customs: 'no',
    price: 1, total: 1,
  } as Record<string, unknown>)
  expect(limpio).not.toHaveProperty('price')
  expect(limpio).not.toHaveProperty('total')
  // 2 x 1600 + 350 casetas = 3550 subtotal; IVA 568; total 4118. Ni cerca de $1.
  expect(calcularPrecio(limpio).total).toBe(4118)
})

test('un recargo inventado por el cliente se descarta', () => {
  const { limpio } = validar({
    origin: 'CDMX', dest: 'Monterrey', containers: 1, customs: 'no',
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

test('rechaza un valor de aduanas que no sea yes o no', () => {
  const { errores } = validar({ origin: 'A', dest: 'B', containers: 1, customs: 'tal vez' })
  expect(errores.join(' ')).toMatch(/customs/)
})

test('una cotizacion valida no genera errores', () => {
  const { errores } = validar({
    origin: 'Ciudad de México', dest: 'Monterrey', containers: 2, customs: 'yes',
  })
  expect(errores).toEqual([])
})

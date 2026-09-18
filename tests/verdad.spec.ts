import { test, expect } from '@playwright/test'

// Guardia de honestidad, capa de navegador.
//
// El script scripts/verificar-verdad.mjs revisa el bundle completo, incluidas
// las pantallas detras de login. Estas pruebas cubren lo que un visitante ve
// de verdad renderizado, que es donde una promesa falsa hace dano comercial.
//
// Principio del proyecto: nunca presentar como real algo que no lo es.

const PROMESAS_FALSAS = [
  { texto: /Facturaci[oó]n CFDI 4\.0 autom[aá]tic/i, porque: 'no hay PAC' },
  { texto: /Pagos protegidos/i,                       porque: 'no hay pasarela' },
  { texto: /\bUSD\b/,                                 porque: 'se cobra en pesos' },
]

test('la landing no promete cosas que no existen', async ({ page }) => {
  await page.goto('/')
  const cuerpo = await page.locator('body').innerText()
  for (const { texto, porque } of PROMESAS_FALSAS) {
    expect(cuerpo, `La landing dice algo que no es cierto (${porque})`).not.toMatch(texto)
  }
})

test('la pagina de planes no promete cosas que no existen', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ver planes/i }).first().click()
  await expect(page.getByText(/Preguntas frecuentes/i)).toBeVisible()
  const cuerpo = await page.locator('body').innerText()
  for (const { texto, porque } of PROMESAS_FALSAS) {
    expect(cuerpo, `Planes dice algo que no es cierto (${porque})`).not.toMatch(texto)
  }
})

test('los precios publicos se muestran en pesos', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ver planes/i }).first().click()
  await expect(page.getByText(/MXN/).first()).toBeVisible()
})

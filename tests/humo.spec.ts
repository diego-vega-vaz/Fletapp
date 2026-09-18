import { test, expect } from '@playwright/test'

// Pruebas de humo del sitio publico. No necesitan credenciales.
// Lo que cubren: que la app arranque y que las tres pantallas que ve alguien
// que todavia no es cliente se rendericen sin reventar.

test('la landing carga y muestra la propuesta principal', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText(/Mueve tu carga por M[eé]xico/i)).toBeVisible()
})

test('se puede llegar a planes desde la landing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ver planes/i }).first().click()
  await expect(page.getByText(/Preguntas frecuentes/i)).toBeVisible()
})

test('se puede llegar al registro desde la landing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Crear cuenta gratis/i }).first().click()
  await expect(page.locator('input[type="email"]').first()).toBeVisible()
})

test('la landing no tira errores de JavaScript', async ({ page }) => {
  const errores: string[] = []

  // Solo nos importan los errores de la app. Un recurso externo que no carga
  // (la foto del hero vive en unsplash.com) no es un bug del codigo, y hacer
  // que la prueba dependa de un tercero es como se construyen suites que
  // fallan sin motivo y que la gente termina ignorando.
  const ruidoDeRed = /Failed to load resource|ERR_|net::/i

  page.on('console', m => {
    if (m.type() === 'error' && !ruidoDeRed.test(m.text())) errores.push(m.text())
  })
  page.on('pageerror', e => errores.push(String(e)))

  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  expect(errores, `Errores de JavaScript:\n${errores.join('\n')}`).toEqual([])
})

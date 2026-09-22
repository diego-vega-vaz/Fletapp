import { defineConfig, devices } from '@playwright/test'

// Levanta el servidor de desarrollo y corre las pruebas contra el.
// Las variables de Supabase pueden ser de mentiras: las pantallas publicas
// no consultan la base al cargar, y createClient no valida la URL.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // || y no ??: en GitHub Actions un secreto que no existe llega como
      // cadena VACIA, no como undefined. Con ?? la cadena vacia pasaba tal
      // cual, el bundle se compilaba con supabaseUrl='' y la app tronaba en
      // el navegador con "supabaseUrl is required". Seis pruebas fallaban
      // apuntando al sitio equivocado.
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://ejemplo.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'anon-de-prueba',
    },
  },
})

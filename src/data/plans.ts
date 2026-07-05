// Definición central de planes — usada en Landing, Planes y Config
export interface Plan {
  id: 'free' | 'pro' | 'empresa'
  name: string
  priceMXN: number | null      // mensual; null = a la medida
  tagline: string
  highlight?: boolean
  cta: string
  features: string[]
  limits: { quotes: string; shipments: string; users: string }
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    priceMXN: 0,
    tagline: 'Para probar y mover tus primeros envíos',
    cta: 'Empezar gratis',
    features: [
      'Rastreo de envíos en tiempo real',
      'Gestión de documentos (1 GB)',
      'Soporte por correo',
      'Hasta 2 usuarios',
    ],
    limits: { quotes: '—', shipments: 'Ilimitados', users: '2 usuarios' },
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMXN: 1499,
    tagline: 'Para PyMEs que envían cada semana',
    highlight: true,
    cta: 'Mejorar a Pro',
    features: [
      'Gestión de documentos (20 GB)',
      'Notificaciones por correo y SMS',
      'Soporte por correo o SMS',
      'Máximo 6 usuarios',
    ],
    limits: { quotes: '—', shipments: 'Ilimitados', users: '6 usuarios' },
  },
  {
    id: 'empresa',
    name: 'Empresa',
    priceMXN: null,
    tagline: 'Para operaciones logísticas a gran escala',
    cta: 'Contactar ventas',
    features: [
      'Todo lo de Pro, sin límites',
      'Integración por API y EDI',
      'Ejecutivo de cuenta dedicado',
      'SLA y soporte 24/7',
      'Usuarios ilimitados',
      'Soporte especializado',
    ],
    limits: { quotes: 'Ilimitadas', shipments: 'Ilimitados', users: 'Ilimitados' },
  },
]

export const planById = (id?: string | null): Plan =>
  PLANS.find(p => p.id === id) ?? PLANS[0]

export const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

import type { Shipment, Quote, Invoice, TimelineEvent, Ticket } from '../types'

export const SHIPMENTS: Shipment[] = [
  { id: 'RES-2026-00145', origin: 'Ciudad de México', oCode: 'CDMX', dest: 'Monterrey', dCode: 'MTY',
    status: 'transit', price: 6618, paid: 3309, containers: '2× 20ft', weight: '24,000 kg', cargo: 'Equipos industriales',
    depart: 'Hoy, 8:30 AM', eta: 'Hoy, 8:30 PM', etaShort: '8:30 PM', distance: '968 km', duration: '18h 20m', progress: 0.44, current: 'Aguascalientes' },
  { id: 'RES-2026-00144', origin: 'Ciudad de México', oCode: 'CDMX', dest: 'Veracruz', dCode: 'VER',
    status: 'delivered', price: 3200, paid: 3200, containers: '1× 40ft', weight: '18,500 kg', cargo: 'Productos de consumo',
    depart: '4 Jun, 7:00 AM', eta: '5 Jun, 10:15 AM', etaShort: '10:15 AM', distance: '400 km', duration: '7h 10m', progress: 1, current: 'Veracruz' },
  { id: 'RES-2026-00143', origin: 'Ciudad de México', oCode: 'CDMX', dest: 'Guadalajara', dCode: 'GDL',
    status: 'waiting', price: 6618, paid: 3309, containers: '2× 20ft', weight: '22,000 kg', cargo: 'Maquinaria ligera',
    depart: '5 Jun, 6:00 AM', eta: 'Ayer, 4:30 PM', etaShort: '4:30 PM', distance: '540 km', duration: '9h 05m', progress: 1, current: 'Guadalajara' },
  { id: 'RES-2026-00142', origin: 'Querétaro', oCode: 'QRO', dest: 'Tijuana', dCode: 'TIJ',
    status: 'transit', price: 9450, paid: 4725, containers: '1× 40ft HC', weight: '21,000 kg', cargo: 'Autopartes',
    depart: 'Ayer, 9:00 PM', eta: '9 Jun, 2:00 PM', etaShort: '2:00 PM', distance: '2,290 km', duration: '34h', progress: 0.28, current: 'Culiacán' },
  { id: 'RES-2026-00141', origin: 'Ciudad de México', oCode: 'CDMX', dest: 'Mérida', dCode: 'MID',
    status: 'delivered', price: 7800, paid: 7800, containers: '2× 20ft', weight: '23,400 kg', cargo: 'Materiales de construcción',
    depart: '1 Jun, 5:00 AM', eta: '3 Jun, 11:00 AM', etaShort: '11:00 AM', distance: '1,550 km', duration: '24h', progress: 1, current: 'Mérida' },
]

export const QUOTES: Quote[] = [
  { id: 'RES-2026-00146', origin: 'Ciudad de México', dest: 'Monterrey', status: 'pending', price: 6618, created: 'Hoy, 9:12 AM', expires: 'Hoy, 5:00 PM', containers: '2× 20ft' },
  { id: 'RES-2026-00139', origin: 'Guadalajara', dest: 'Tijuana', status: 'pending', price: 11200, created: 'Ayer, 3:40 PM', expires: 'Mañana, 3:40 PM', containers: '1× 40ft' },
]

export const ROUTE_CDMX_MTY = [
  { x: 52, y: 80, city: 'Ciudad de México', type: 'origin' as const },
  { x: 48, y: 64, city: 'Querétaro' },
  { x: 43, y: 54, city: 'Irapuato' },
  { x: 41, y: 42, city: 'Aguascalientes' },
  { x: 58, y: 18, city: 'Monterrey', type: 'dest' as const },
]

export const TIMELINE: TimelineEvent[] = [
  { state: 'done', title: 'Salida', time: 'Hoy, 8:30 AM', place: 'Terminal CDMX, Ciudad de México', detail: 'Camión ABC-1234 asignado · Conductor Juan García', icon: 'navigation' },
  { state: 'done', title: 'San Juan del Río, QRO', time: 'Hoy, 10:45 AM', place: 'En carretera 57', detail: 'Velocidad: 95 km/h', icon: 'truck' },
  { state: 'done', title: 'Irapuato, GTO', time: 'Hoy, 1:15 PM', place: 'Parada de descanso', detail: 'Descanso reglamentario: 30 minutos', icon: 'clock' },
  { state: 'active', title: 'Aguascalientes, AGS', time: 'Hoy, 4:30 PM', place: 'Última actualización · hace 15 min', detail: 'Velocidad: 110 km/h · 44% completado', icon: 'mapPin' },
  { state: 'future', title: 'Llegada estimada', time: 'Hoy, 8:30 PM', place: 'Centro de Distribución, Monterrey, NL', detail: 'Te notificaremos 30 min antes', icon: 'flag' },
]

export const INVOICES: Invoice[] = [
  { id: 'A-2026-0512', uuid: 'F3A9C2E1-8B4D-4A77-9C12-5E8F0A1B2C3D', shipment: 'RES-2026-00144', concept: 'Flete CDMX → Veracruz', date: '5 jun 2026', due: '5 jun 2026', amount: 3712, status: 'paid', method: 'Visa ••••4242' },
  { id: 'A-2026-0511', uuid: 'B1D7E4F2-3C9A-4E55-8F21-7A0B3C4D5E6F', shipment: 'RES-2026-00143', concept: 'Flete CDMX → Guadalajara (50%)', date: '5 jun 2026', due: '7 jun 2026', amount: 3309, status: 'pending', method: '—' },
  { id: 'A-2026-0508', uuid: 'C2E8F5A3-4D0B-4F66-9A32-8B1C4D5E6F70', shipment: 'RES-2026-00142', concept: 'Flete QRO → Tijuana (anticipo)', date: '6 jun 2026', due: '8 jun 2026', amount: 4725, status: 'pending', method: '—' },
  { id: 'A-2026-0503', uuid: 'D3F9A6B4-5E1C-4077-AB43-9C2D5E6F7081', shipment: 'RES-2026-00141', concept: 'Flete CDMX → Mérida', date: '3 jun 2026', due: '3 jun 2026', amount: 9048, status: 'paid', method: 'Transferencia SPEI' },
  { id: 'A-2026-0497', uuid: 'E4A0B7C5-6F2D-4188-BC54-0D3E6F708192', shipment: 'RES-2026-00138', concept: 'Flete CDMX → Puebla', date: '28 may 2026', due: '28 may 2026', amount: 2436, status: 'paid', method: 'Crédito FletApp' },
]

export const TICKET: Ticket = {
  id: '#1234', subject: 'Pago rechazado', status: 'transit', sLabel: 'En progreso', prio: 'Alta', category: 'Pagos',
  opened: 'Ayer, 10:30 AM', agent: 'Carlos Méndez', sla: '24 horas', remaining: '15 horas', shipment: 'RES-2026-00143',
  description: 'Cuando intento realizar el pago del envío RES-2026-00143, mi tarjeta es rechazada. Recibo el error "Declined" pero tengo fondos disponibles. He intentado 3 veces.',
  messages: [
    { from: 'me', name: 'Diego Parado', time: 'Ayer 10:30 AM', text: 'Cuando intento realizar el pago del envío RES-2026-00143 mi tarjeta es rechazada. Tengo fondos disponibles pero recibo error "Declined". Ya intenté 3 veces.' },
    { from: 'agent', name: 'Carlos Méndez', time: 'Ayer 2:15 PM', text: 'Hola Diego, gracias por reportarlo. Revisé tu tarjeta Visa ••••4242 y veo que el banco está bloqueando transacciones internacionales. Te sugiero:\n1. Contacta a tu banco\n2. Autoriza pagos a México\n3. Reintenta el pago aquí' },
    { from: 'me', name: 'Diego Parado', time: 'Hoy 8:15 AM', text: 'Listo, ya contacté al banco. Me dijeron que autorizaron México. ¿Qué hago ahora?' },
    { from: 'agent', name: 'Carlos Méndez', time: 'Hoy 8:45 AM', text: '¡Perfecto! Ahora puedes reintentar el pago desde la app. Estaré atento por si surge algún problema.' },
  ],
  files: [{ name: 'captura-tarjeta.jpg', meta: 'hace 2 min', icon: 'fileText' }, { name: 'email-banco.pdf', meta: 'hace 1 hora', icon: 'fileText' }],
}

export const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })

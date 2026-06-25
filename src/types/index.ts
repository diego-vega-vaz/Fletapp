export type ShipmentStatus = 'transit' | 'delivered' | 'waiting' | 'pending' | 'disputed' | 'paid' | 'delayed'
export type InvoiceStatus = 'paid' | 'pending' | 'overdue'

export interface Shipment {
  id: string
  origin: string
  oCode: string
  dest: string
  dCode: string
  status: ShipmentStatus
  price: number
  paid: number
  containers: string
  weight: string
  cargo: string
  depart: string
  eta: string
  etaShort: string
  distance: string
  duration: string
  progress: number
  current: string
}

export interface Quote {
  id: string
  origin: string
  dest: string
  status: string
  price: number
  created: string
  expires: string
  containers: string
}

export interface Invoice {
  id: string
  uuid: string
  shipment: string
  concept: string
  date: string
  due: string
  amount: number
  status: InvoiceStatus
  method: string
}

export interface TimelineEvent {
  state: 'done' | 'active' | 'future'
  title: string
  time: string
  place: string
  detail: string
  icon: string
}

export interface TicketMessage {
  from: 'me' | 'agent'
  name: string
  time: string
  text: string
}

export interface Ticket {
  id: string
  subject: string
  status: string
  sLabel: string
  prio: string
  category: string
  opened: string
  agent: string
  sla: string
  remaining: string
  shipment: string
  description: string
  messages: TicketMessage[]
  files: { name: string; meta: string; icon: string }[]
}

export type Route =
  | 'dashboard' | 'cotizacion' | 'rastreo' | 'detalle'
  | 'pago' | 'pagos' | 'cotizaciones' | 'envios'
  | 'soporte' | 'ticket' | 'config' | 'planes'

export type PublicRoute = 'landing' | 'login' | 'register' | 'planes' | 'terminos' | 'privacidad'

export interface NavParams {
  id?: string
  [key: string]: string | undefined
}

export interface User {
  name: string
  company: string
  email: string
}

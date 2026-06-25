import { supabase } from './supabase'

// ── Types ────────────────────────────────────────────────────

export interface DbProfile {
  id: string
  full_name: string | null
  company: string | null
  rfc: string | null
  phone: string | null
  plan?: string | null
}

export interface DbQuote {
  id: string
  user_id: string
  ref_id: string
  origin: string
  origin_code: string | null
  dest: string
  dest_code: string | null
  cargo_type: string | null
  containers: string | null
  weight: string | null
  cargo_desc: string | null
  price: number | null
  status: string
  expires_at: string
  created_at: string
}

export interface DbShipment {
  id: string
  user_id: string
  ref_id: string
  origin: string
  origin_code: string | null
  dest: string
  dest_code: string | null
  containers: string | null
  weight: string | null
  cargo: string | null
  price: number
  paid: number
  status: string
  depart_at: string | null
  eta: string | null
  eta_short: string | null
  distance: string | null
  duration: string | null
  progress: number
  current_location: string | null
  carrier: string | null
  driver: string | null
  plate: string | null
  created_at: string
}

export interface DbInvoice {
  id: string
  user_id: string
  shipment_id: string | null
  ref_id: string
  uuid_cfdi: string | null
  concept: string | null
  amount: number | null
  status: string
  method: string | null
  issued_at: string | null
  due_at: string | null
  created_at: string
}

export interface DbTicket {
  id: string
  user_id: string
  ticket_number: string
  subject: string
  category: string
  priority: string
  status: string
  shipment_ref: string | null
  description: string | null
  agent_name: string
  created_at: string
}

export interface DbTicketMessage {
  id: string
  ticket_id: string
  is_user: boolean
  author_name: string | null
  body: string
  created_at: string
}

// ── Profile ──────────────────────────────────────────────────

export const getProfile = async (): Promise<DbProfile | null> => {
  const { data } = await supabase.from('profiles').select('*').single()
  return data
}

export const updateProfile = async (updates: Partial<DbProfile>) => {
  const { data, error } = await supabase
    .from('profiles').update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .select().single()
  if (error) throw error
  return data
}

// ── Quotes ───────────────────────────────────────────────────

export const getQuotes = async (): Promise<DbQuote[]> => {
  const { data, error } = await supabase
    .from('quotes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const createQuote = async (q: {
  origin: string; origin_code: string; dest: string; dest_code: string
  cargo_type: string; containers: string; weight: string; cargo_desc: string
  special: object; customs: string; operation: string; incoterm: string; price: number
}): Promise<DbQuote> => {
  const { data, error } = await supabase
    .from('quotes').insert(q).select().single()
  if (error) throw error
  return data
}

export const acceptQuote = async (quoteId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('accept_quote', { quote_id: quoteId })
  if (error) throw error
  return data
}

// ── Shipments ────────────────────────────────────────────────

export const getShipments = async (): Promise<DbShipment[]> => {
  const { data, error } = await supabase
    .from('shipments').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const getShipment = async (refId: string): Promise<DbShipment | null> => {
  const { data } = await supabase
    .from('shipments').select('*').eq('ref_id', refId).single()
  return data
}

export const getShipmentById = async (id: string): Promise<DbShipment | null> => {
  const { data } = await supabase
    .from('shipments').select('*').eq('id', id).single()
  return data
}

export const getInvoiceByRef = async (refId: string): Promise<DbInvoice | null> => {
  const { data } = await supabase
    .from('invoices').select('*').eq('ref_id', refId).single()
  return data
}

export const recordPayment = async (shipmentId: string, amount: number, method: string) => {
  const { data: s } = await supabase.from('shipments').select('paid,price,status').eq('id', shipmentId).single()
  if (!s) throw new Error('Shipment not found')
  const newPaid = (s.paid || 0) + amount
  const newStatus = newPaid >= s.price ? 'delivered' : s.status

  const { error } = await supabase.from('shipments')
    .update({ paid: newPaid, status: newStatus }).eq('id', shipmentId)
  if (error) throw error

  // Mark related pending invoice as paid
  await supabase.from('invoices')
    .update({ status: 'paid', method })
    .eq('shipment_id', shipmentId).eq('status', 'pending')
}

// ── Invoices ─────────────────────────────────────────────────

export const getInvoices = async (): Promise<DbInvoice[]> => {
  const { data, error } = await supabase
    .from('invoices').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Tickets ──────────────────────────────────────────────────

export const getTickets = async (): Promise<DbTicket[]> => {
  const { data, error } = await supabase
    .from('tickets').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const getTicket = async (ticketNumber: string): Promise<DbTicket | null> => {
  const { data } = await supabase
    .from('tickets').select('*').eq('ticket_number', ticketNumber).single()
  return data
}

export const createTicket = async (t: {
  subject: string; category: string; description: string; shipment_ref?: string
}): Promise<DbTicket> => {
  const { data, error } = await supabase
    .from('tickets').insert(t).select().single()
  if (error) throw error
  // Auto-insert welcome message from agent
  await supabase.from('ticket_messages').insert({
    ticket_id: data.id,
    is_user: false,
    author_name: 'Soporte FletApp',
    body: `Hola, hemos recibido tu ticket sobre "${t.subject}". Un agente te responderá pronto.`,
  })
  return data
}

export const getTicketMessages = async (ticketId: string): Promise<DbTicketMessage[]> => {
  const { data, error } = await supabase
    .from('ticket_messages').select('*')
    .eq('ticket_id', ticketId).order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export const sendTicketMessage = async (ticketId: string, body: string, authorName: string): Promise<DbTicketMessage> => {
  const { data, error } = await supabase
    .from('ticket_messages').insert({ ticket_id: ticketId, is_user: true, author_name: authorName, body })
    .select().single()
  if (error) throw error
  return data
}

// ── Documentos (Supabase Storage) ─────────────────────────────

const DOCS_BUCKET = 'shipment-docs'

export interface DbDocument {
  name: string
  path: string
  size: number
  created_at: string
}

const currentUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? ''
}

export const listDocuments = async (shipmentRef: string): Promise<DbDocument[]> => {
  const uid = await currentUserId()
  if (!uid) return []
  const prefix = `${uid}/${shipmentRef}`
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).list(prefix, {
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw error
  return (data || [])
    .filter(f => f.id) // ignora carpetas
    .map(f => ({
      name: f.name,
      path: `${prefix}/${f.name}`,
      size: (f.metadata as { size?: number } | null)?.size ?? 0,
      created_at: f.created_at ?? new Date().toISOString(),
    }))
}

export const uploadDocument = async (shipmentRef: string, file: File): Promise<void> => {
  const uid = await currentUserId()
  if (!uid) throw new Error('No autenticado')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${uid}/${shipmentRef}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
}

export const getDocumentUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 60 * 5)
  if (error) throw error
  return data.signedUrl
}

export const deleteDocument = async (path: string): Promise<void> => {
  const { error } = await supabase.storage.from(DOCS_BUCKET).remove([path])
  if (error) throw error
}

// ── Stats helpers ─────────────────────────────────────────────

export const getDashboardStats = async () => {
  const [shipments, quotes, invoices] = await Promise.all([
    getShipments(),
    getQuotes(),
    getInvoices(),
  ])
  const active = shipments.filter(s => s.status === 'transit' || s.status === 'waiting')
  const pending = invoices.filter(i => i.status === 'pending')
  const pendingAmount = pending.reduce((a, b) => a + (b.amount || 0), 0)
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((a, b) => a + (b.amount || 0), 0)
  return { shipments, quotes, invoices, active, pending, pendingAmount, paidAmount }
}

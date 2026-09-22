// Lado transportista. Fase 2.
//
// Igual que el resto del proyecto: el navegador NO escribe en estas tablas.
// Toda alta, revision y verificacion pasa por un RPC que valida en el
// servidor. Aqui solo hay lectura y llamadas.

import { supabase } from './supabase'

export const BUCKET_EXPEDIENTES = 'carrier-docs'

export type EstatusVerificacion = 'pendiente' | 'verificado' | 'suspendido' | 'rechazado'
export type EstatusDocumento = 'pendiente' | 'aprobado' | 'rechazado'

export const ESTATUS_CARRIER: Record<EstatusVerificacion, string> = {
  pendiente: 'Pendiente',
  verificado: 'Verificado',
  suspendido: 'Suspendido',
  rechazado: 'Rechazado',
}

export interface Carrier {
  id: string
  razon_social: string
  nombre_corto: string | null
  rfc: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  estatus: EstatusVerificacion
  notas: string | null
  verificado_en: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  carrier_id: string
  placas: string
  tipo: string | null
  num_economico: string | null
  estatus: EstatusVerificacion
}

export interface Driver {
  id: string
  carrier_id: string
  nombre: string
  licencia_federal: string | null
  telefono: string | null
  estatus: EstatusVerificacion
}

export interface TipoDocumento {
  clave: string
  nombre: string
  aplica_a: 'carrier' | 'vehicle' | 'driver'
  requerido: boolean
  vence: boolean
  orden: number
  nota: string | null
}

export interface Documento {
  id: string
  tipo: string
  carrier_id: string | null
  vehicle_id: string | null
  driver_id: string | null
  storage_path: string | null
  vence_el: string | null
  estatus: EstatusDocumento
  motivo_rechazo: string | null
  revisado_en: string | null
  created_at: string
}

export interface Faltante {
  ambito: 'carrier' | 'vehicle' | 'driver'
  entidad_id: string
  entidad: string
  tipo: string
  nombre: string
  motivo: string
}

const error = (e: { message: string } | null) => { if (e) throw new Error(e.message) }

// ── Lectura ───────────────────────────────────────────────────

export const getCarriers = async (): Promise<Carrier[]> => {
  const { data, error: e } = await supabase
    .from('carriers').select('*').order('created_at', { ascending: false })
  error(e)
  return (data ?? []) as Carrier[]
}

export const getVehiculos = async (carrierId: string): Promise<Vehicle[]> => {
  const { data, error: e } = await supabase
    .from('vehicles').select('*').eq('carrier_id', carrierId).order('placas')
  error(e)
  return (data ?? []) as Vehicle[]
}

export const getConductores = async (carrierId: string): Promise<Driver[]> => {
  const { data, error: e } = await supabase
    .from('drivers').select('*').eq('carrier_id', carrierId).order('nombre')
  error(e)
  return (data ?? []) as Driver[]
}

export const getTiposDocumento = async (): Promise<TipoDocumento[]> => {
  const { data, error: e } = await supabase
    .from('document_types').select('*').order('aplica_a').order('orden')
  error(e)
  return (data ?? []) as TipoDocumento[]
}

/** Expediente completo del transportista: sus papeles, los de sus unidades y los de sus operadores. */
export const getExpediente = async (
  carrierId: string, vehiculos: Vehicle[], conductores: Driver[],
): Promise<Documento[]> => {
  const ids = [
    `carrier_id.eq.${carrierId}`,
    ...vehiculos.map(v => `vehicle_id.eq.${v.id}`),
    ...conductores.map(d => `driver_id.eq.${d.id}`),
  ]
  const { data, error: e } = await supabase
    .from('carrier_documents').select('*').or(ids.join(','))
  error(e)
  return (data ?? []) as Documento[]
}

/** Lo que le falta al transportista para poder quedar verificado. Vacio = completo. */
export const getFaltantes = async (carrierId: string): Promise<Faltante[]> => {
  const { data, error: e } = await supabase.rpc('faltantes_transportista', { carrier: carrierId })
  error(e)
  return (data ?? []) as Faltante[]
}

// ── Escritura: todo via RPC ───────────────────────────────────

export const altaTransportista = async (d: {
  razon_social: string; rfc?: string; contacto?: string; telefono?: string; email?: string
}): Promise<Carrier> => {
  const { data, error: e } = await supabase.rpc('alta_transportista', {
    razon_social: d.razon_social,
    rfc: d.rfc || null,
    contacto: d.contacto || null,
    telefono: d.telefono || null,
    email: d.email || null,
  })
  error(e)
  return data as Carrier
}

export const altaUnidad = async (carrierId: string, placas: string, tipo?: string) => {
  const { data, error: e } = await supabase.rpc('alta_unidad', {
    carrier: carrierId, placas, tipo: tipo || null,
  })
  error(e)
  return data as Vehicle
}

export const altaConductor = async (carrierId: string, nombre: string, licencia?: string) => {
  const { data, error: e } = await supabase.rpc('alta_operador', {
    carrier: carrierId, nombre, licencia_federal: licencia || null,
  })
  error(e)
  return data as Driver
}

/**
 * Sube el archivo al bucket privado y registra la fila.
 * Dos pasos a proposito: el archivo va a Storage con sus propias politicas, y
 * la fila la escribe un RPC. Si alguien pudiera insertar la fila sin el
 * archivo, el expediente diria que hay poliza donde no hay nada.
 */
export const subirDocumento = async (
  file: File,
  tipo: string,
  dueno: { carrier?: string; vehiculo?: string; conductor?: string },
  venceEl?: string,
): Promise<Documento> => {
  const carpeta = dueno.carrier ? `carriers/${dueno.carrier}`
    : dueno.vehiculo ? `vehicles/${dueno.vehiculo}`
    : `drivers/${dueno.conductor}`
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const ruta = `${carpeta}/${tipo}-${Date.now()}.${ext}`

  const { error: eUp } = await supabase.storage
    .from(BUCKET_EXPEDIENTES).upload(ruta, file, { cacheControl: '3600', upsert: false })
  error(eUp)

  const { data, error: e } = await supabase.rpc('registrar_documento', {
    tipo,
    storage_path: ruta,
    carrier: dueno.carrier ?? null,
    vehiculo: dueno.vehiculo ?? null,
    conductor: dueno.conductor ?? null,
    vence_el: venceEl || null,
  })
  error(e)
  return data as Documento
}

export const revisarDocumento = async (id: string, aprobado: boolean, motivo?: string) => {
  const { data, error: e } = await supabase.rpc('revisar_documento', {
    documento: id, aprobado, motivo: motivo || null, vence_el: null,
  })
  error(e)
  return data as Documento
}

export const verificarTransportista = async (carrierId: string) => {
  const { data, error: e } = await supabase.rpc('verificar_transportista', { carrier: carrierId })
  error(e)
  return data as Carrier
}

export const suspenderTransportista = async (carrierId: string, motivo: string) => {
  const { data, error: e } = await supabase.rpc('suspender_transportista', {
    carrier: carrierId, motivo,
  })
  error(e)
  return data as Carrier
}

/** URL temporal para ver un documento del expediente. El bucket es privado. */
export const verDocumento = async (path: string): Promise<string> => {
  const { data, error: e } = await supabase.storage
    .from(BUCKET_EXPEDIENTES).createSignedUrl(path, 60 * 5)
  error(e)
  return data!.signedUrl
}

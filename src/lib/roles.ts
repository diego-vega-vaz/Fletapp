// Roles y operacion. Todo lo que cambia el estado de un envio pasa por un RPC
// del servidor: el navegador no escribe sobre `shipments` ni sobre `user_roles`.
//
// Si algun dia te dan ganas de "nada mas actualizar el status con un update
// directo porque es mas rapido", acuerdate de por que existe este archivo:
// el rol vive en su propia tabla justamente porque profiles es editable por
// el dueno, y un rol editable por el dueno no es un rol.

import { supabase } from './supabase'

export type Rol = 'embarcador' | 'transportista' | 'operador'

export type EstatusEnvio = 'waiting' | 'transit' | 'delayed' | 'delivered' | 'cancelled'

export const ESTATUS_ENVIO: Record<EstatusEnvio, string> = {
  waiting:   'Por asignar',
  transit:   'En transito',
  delayed:   'Demorado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export interface EventoEnvio {
  id: string
  shipment_id: string
  status: EstatusEnvio | null
  ubicacion: string | null
  nota: string | null
  autor_id: string | null
  created_at: string
}

/** Rol del usuario de la sesion. `null` si no hay sesion. */
export const rolActual = async (): Promise<Rol | null> => {
  const { data, error } = await supabase.rpc('rol_actual')
  if (error) throw error
  return (data as Rol | null) ?? null
}

/** El transportista al que pertenece la cuenta, o null si no es transportista. */
export const miCarrier = async (): Promise<string | null> => {
  const { data, error } = await supabase.rpc('mi_carrier')
  if (error) throw error
  return (data as string | null) ?? null
}

export const esOperador = async (): Promise<boolean> => {
  const { data, error } = await supabase.rpc('es_operador')
  if (error) throw error
  return data === true
}

/**
 * Mueve un envio de estatus. Solo operador; el servidor lo verifica, no el
 * front. Deja renglon en la bitacora.
 */
export const moverEnvio = async (
  envioId: string,
  status: EstatusEnvio,
  ubicacion?: string,
  nota?: string,
): Promise<EventoEnvio> => {
  const { data, error } = await supabase.rpc('mover_envio', {
    envio_id: envioId,
    nuevo_status: status,
    nueva_ubicacion: ubicacion ?? null,
    nota: nota ?? null,
  })
  if (error) throw new Error(error.message)
  return data as EventoEnvio
}

export interface TransportistaAsignable {
  id: string
  razon_social: string
  rfc: string | null
  estatus: string | null
  unidades: { id: string; placas: string; tipo: string | null; num_economico: string | null }[]
  conductores: { id: string; nombre: string; licencia_federal: string | null }[]
}

/**
 * Transportistas VERIFICADOS, con sus unidades y sus conductores.
 *
 * Alimenta los tres selectores del modal de asignacion. Son selectores y no
 * campos de texto a proposito: antes se escribia el nombre a mano y nada
 * impedia asignarle un envio a un transportista sin verificar, o inexistente.
 */
export const transportistasAsignables = async (): Promise<TransportistaAsignable[]> => {
  const { data: carriers, error } = await supabase
    .from('carriers')
    .select('id, razon_social, rfc, estatus')
    .eq('estatus', 'verificado')
    .order('razon_social')
  if (error) throw new Error(error.message)
  const ids = (carriers ?? []).map(c => c.id)
  if (ids.length === 0) return []

  const [{ data: unidades }, { data: conductores }] = await Promise.all([
    supabase.from('vehicles').select('id, carrier_id, placas, tipo, num_economico').in('carrier_id', ids).order('placas'),
    supabase.from('drivers').select('id, carrier_id, nombre, licencia_federal').in('carrier_id', ids).order('nombre'),
  ])

  return (carriers ?? []).map(c => ({
    ...c,
    unidades:    (unidades ?? []).filter(u => u.carrier_id === c.id),
    conductores: (conductores ?? []).filter(d => d.carrier_id === c.id),
  }))
}

/**
 * Asigna transportista, unidad y conductor a un envio.
 *
 * Recibe IDS, no texto. La version anterior recibia el nombre del
 * transportista escrito a mano y nunca escribia shipments.carrier_id, que es
 * justo por donde el transportista encuentra sus envios: el resultado era que
 * un envio asignado JAMAS le aparecia, y nunca podia reportar avance. Ver
 * decisiones.md, 16 oct 2026.
 *
 * El servidor valida que el transportista este verificado y que la unidad y
 * el conductor sean suyos. Esta funcion no valida nada: solo pasa los ids.
 */
export const asignarUnidad = async (
  envioId: string,
  carrierId: string,
  unidadId: string,
  conductorId?: string | null,
) => {
  const { data, error } = await supabase.rpc('asignar_unidad', {
    envio_id: envioId,
    carrier: carrierId,
    unidad: unidadId,
    operador: conductorId ?? null,
  })
  if (error) throw new Error(error.message)
  return data
}

/** Bitacora de un envio, mas reciente primero. */
export const getEventos = async (envioId: string): Promise<EventoEnvio[]> => {
  const { data, error } = await supabase
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', envioId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as EventoEnvio[]
}

// ── Lado transportista ────────────────────────────────────────

/** Los tres hitos que puede reportar un operador de camion. No hay selector
 *  libre de estatus: 'cancelado' y 'demorado' son decisiones comerciales y no
 *  le tocan al transportista. */
export type HitoAvance = 'sali' | 'voy_en_camino' | 'llegue' | 'entregue'

export const HITOS: { id: HitoAvance; label: string; icon: string }[] = [
  { id: 'sali',          label: 'Ya salí',        icon: 'truck' },
  { id: 'voy_en_camino', label: 'Voy en camino',  icon: 'navigation' },
  { id: 'llegue',        label: 'Ya llegué',      icon: 'mapPin' },
  { id: 'entregue',      label: 'Ya entregué',    icon: 'checkCircle' },
]

/**
 * Genera el codigo de invitacion de un transportista. Solo operador.
 * Se entrega por WhatsApp o por telefono: el alfabeto del codigo no tiene
 * I, O, 0 ni 1 justamente para poder dictarlo.
 */
export const invitarTransportista = async (carrierId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('invitar_transportista', { carrier: carrierId })
  if (error) throw new Error(error.message)
  return data as string
}

/** El transportista canjea su codigo. El servidor le pone el rol, no el navegador. */
export const canjearInvitacion = async (codigo: string) => {
  const { data, error } = await supabase.rpc('canjear_invitacion', { codigo })
  if (error) throw new Error(error.message)
  return data
}

export const reportarAvance = async (
  envioId: string,
  hito: HitoAvance,
  ubicacion?: string,
  nota?: string,
): Promise<EventoEnvio> => {
  const { data, error } = await supabase.rpc('reportar_avance', {
    envio_id: envioId,
    hito,
    ubicacion: ubicacion?.trim() || null,
    nota: nota?.trim() || null,
  })
  if (error) throw new Error(error.message)
  return data as EventoEnvio
}

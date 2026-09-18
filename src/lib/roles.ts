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

/**
 * Asigna transportista y unidad. Transportista y placas son obligatorios:
 * el anticipo del 60% se cobra contra este dato (acuerdo del 15 sep 2026),
 * asi que no puede quedar en blanco.
 */
export const asignarUnidad = async (
  envioId: string,
  transportista: string,
  operadorNombre: string,
  placas: string,
) => {
  const { data, error } = await supabase.rpc('asignar_unidad', {
    envio_id: envioId,
    transportista,
    operador_nombre: operadorNombre,
    placas,
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

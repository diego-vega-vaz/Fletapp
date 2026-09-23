// Consultas de la consola de operacion.
//
// Solo devuelven algo si el usuario es operador: no hay filtro por rol en este
// archivo a proposito. Quien decide que ve cada quien es la RLS de Postgres.
// Si un embarcador llama a estas funciones, la base le regresa unicamente sus
// propias filas. La seguridad no vive aqui.

import { supabase } from './supabase'
import type { DbShipment, DbQuote, DbProfile } from './db'

/** Envio con los datos del embarcador ya pegados. */
export interface EnvioOperacion extends DbShipment {
  embarcador: { nombre: string; empresa: string } | null
}

export interface CotizacionOperacion extends DbQuote {
  embarcador: { nombre: string; empresa: string } | null
  price_breakdown: Record<string, unknown> | null
  aprobada_por: string | null
  aprobada_en: string | null
}

/** Una fila de `envios_en_riesgo()`. La calcula el servidor, no el navegador. */
export interface EnvioEnRiesgo {
  shipment_id: string
  ref_id: string | null
  origin: string
  dest: string
  status: string
  carrier: string | null
  motivo: 'sin_camion' | 'compromiso_vencido' | 'sin_movimiento'
  detalle: string
  horas: number
}

export const MOTIVO_ALERTA: Record<EnvioEnRiesgo['motivo'], string> = {
  sin_camion:         'Sin camión asignado',
  compromiso_vencido: 'Pasó la fecha comprometida',
  sin_movimiento:     'Sin reporte reciente',
}

/**
 * Pega los perfiles a las filas por user_id.
 *
 * Se hace en dos consultas y no con un join de PostgREST porque `shipments`
 * apunta a `auth.users`, no a `profiles`: no existe la llave foranea que
 * PostgREST necesitaria para anidar. Dos consultas es mas honesto que
 * inventar una relacion en la base solo para ahorrarse una vuelta.
 */
const pegarPerfiles = async <T extends { user_id: string }>(filas: T[]) => {
  const ids = [...new Set(filas.map(f => f.user_id))]
  if (ids.length === 0) return new Map<string, DbProfile>()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, company, rfc, phone')
    .in('id', ids)
  return new Map((data ?? []).map(p => [p.id, p as DbProfile]))
}

const comoEmbarcador = (p: DbProfile | undefined) =>
  p ? { nombre: p.full_name || 'Sin nombre', empresa: p.company || '—' } : null

export const getEnviosOperacion = async (): Promise<EnvioOperacion[]> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  const filas = (data ?? []) as DbShipment[]
  const perfiles = await pegarPerfiles(filas)
  return filas.map(f => ({ ...f, embarcador: comoEmbarcador(perfiles.get(f.user_id)) }))
}

export const getCotizacionesOperacion = async (): Promise<CotizacionOperacion[]> => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  const filas = (data ?? []) as CotizacionOperacion[]
  const perfiles = await pegarPerfiles(filas)
  return filas.map(f => ({ ...f, embarcador: comoEmbarcador(perfiles.get(f.user_id)) }))
}

/**
 * Lo que va tarde. Ojo con lo que esta lista NO es: no sabe donde esta el
 * camion, porque no hay rastreo. Sólo sabe lo que no ha pasado — nadie asignó
 * unidad, se venció la fecha, nadie reportó. Presentarla como "alertas de
 * rastreo" sería la misma mentira que el CFDI falso.
 */
export const getEnviosEnRiesgo = async (): Promise<EnvioEnRiesgo[]> => {
  const { data, error } = await supabase.rpc('envios_en_riesgo')
  if (error) throw error
  return (data ?? []) as EnvioEnRiesgo[]
}

/**
 * Aprueba una cotizacion y la libera al embarcador. `precioFinal` en null deja
 * el precio sugerido por el servidor; si lo cambias, el servidor exige nota.
 */
export const aprobarCotizacion = async (
  cotizacionId: string,
  precioFinal?: number | null,
  nota?: string,
) => {
  const { data, error } = await supabase.rpc('aprobar_cotizacion', {
    cotizacion: cotizacionId,
    precio_final: precioFinal ?? null,
    nota: nota?.trim() || null,
  })
  if (error) throw new Error(error.message)
  return data
}

export const rechazarCotizacion = async (cotizacionId: string, motivo: string) => {
  const { data, error } = await supabase.rpc('rechazar_cotizacion', {
    cotizacion: cotizacionId,
    motivo,
  })
  if (error) throw new Error(error.message)
  return data
}

/** Fecha de entrega comprometida. Es la que dispara la alerta de retraso. */
export const fijarCompromiso = async (envioId: string, cuando: string | null) => {
  const { data, error } = await supabase.rpc('fijar_compromiso', {
    envio_id: envioId,
    cuando,
  })
  if (error) throw new Error(error.message)
  return data
}

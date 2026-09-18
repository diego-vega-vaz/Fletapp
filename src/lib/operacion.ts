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

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
  /** Copia congelada al aceptar la cotización. Null en envíos anteriores al 26 oct 2026. */
  costo_transportista: number | null
  comision: number | null
  /** true si ya se facturó la liquidación. Lo calcula la consulta, no el navegador. */
  liquidado: boolean
}

export interface CotizacionOperacion extends DbQuote {
  embarcador: { nombre: string; empresa: string } | null
  price_breakdown: Record<string, unknown> | null
  aprobada_por: string | null
  aprobada_en: string | null
  /** Lo que se le paga al transportista. Null = todavía no se sabe. */
  costo_transportista: number | null
  /** La calcula la base: price − costo_transportista. No se escribe a mano. */
  comision: number | null
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

  // Qué envíos ya tienen su liquidación facturada. Una sola consulta, no una
  // por envío.
  const { data: liq } = await supabase
    .from('invoices')
    .select('shipment_id')
    .eq('tipo', 'liquidacion')
  const yaLiquidados = new Set((liq ?? []).map(i => i.shipment_id as string))

  return filas.map(f => ({
    ...f,
    embarcador: comoEmbarcador(perfiles.get(f.user_id)),
    liquidado: yaLiquidados.has(f.id),
  })) as EnvioOperacion[]
}

/**
 * Factura el 40% que falta. CUÁNDO se cobra sigue siendo decisión del cliente,
 * así que esto no se dispara solo: lo pulsa el operador. El monto no es un 40%
 * recalculado sino precio − anticipo, para que las dos facturas den exactamente
 * el precio sin perder un peso en el redondeo.
 */
export const facturarLiquidacion = async (envioId: string) => {
  const { data, error } = await supabase.rpc('facturar_liquidacion', { envio_id: envioId })
  if (error) throw new Error(error.message)
  return data
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
 *
 * `costo` es lo que se le va a pagar al transportista. Va en null mientras no
 * se sepa — al principio se cotiza antes de llamar al transportista. Si se
 * manda, el servidor rechaza cualquier cosa que deje la comisión en cero o en
 * negativo: aprobar un flete que pierde dinero tiene que ser una decisión
 * consciente, no un dedazo.
 */
export const aprobarCotizacion = async (
  cotizacionId: string,
  precioFinal?: number | null,
  nota?: string,
  costo?: number | null,
) => {
  const { data, error } = await supabase.rpc('aprobar_cotizacion', {
    cotizacion: cotizacionId,
    precio_final: precioFinal ?? null,
    nota: nota?.trim() || null,
    costo: costo ?? null,
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

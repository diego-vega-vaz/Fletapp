// Edge Function: cotizar
//
// Fase 1, tareas 1 y 2. Existe por un principio del proyecto: nada de dinero
// ni logica de negocio en el navegador.
//
// Antes, CotizacionPage.tsx calculaba el precio y mandaba el numero ya hecho
// en el insert. Cualquiera podia abrir la consola y cotizar un flete en $1.
// Aqui el navegador manda SOLO los datos del envio; el precio lo calcula y lo
// guarda el servidor, y la respuesta es la unica fuente de verdad.
//
// Patron para las demas funciones de este proyecto:
//   1. Solo POST
//   2. Se exige JWT y el usuario sale del token, nunca del body
//   3. Se valida y normaliza antes de tocar la base
//   4. Se escribe con service role, para que el navegador no necesite permiso
//      de escritura sobre la tabla
//   5. Errores en JSON, con codigo HTTP correcto y sin filtrar detalles internos
//
// La aritmetica vive en calculo.ts para poder probarla sin levantar nada.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { calcularPrecio, validar } from './calculo.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Solo se acepta POST.' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return json({ error: 'Falta el token de sesion.' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // El usuario sale del JWT, NUNCA del cuerpo de la peticion.
  const comoUsuario = createClient(url, anon, { global: { headers: { Authorization: auth } } })
  const { data: sesion, error: errAuth } = await comoUsuario.auth.getUser()
  if (errAuth || !sesion?.user) return json({ error: 'Sesion invalida.' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'El cuerpo no es JSON valido.' }, 400)
  }

  // Si el navegador manda un precio, se ignora y queda constancia en el log.
  if ('price' in body || 'total' in body) {
    console.warn('cotizar: el cliente mando un precio; se ignora', { user: sesion.user.id })
  }

  const { errores, limpio } = validar(body)
  if (errores.length) return json({ error: errores.join(' ') }, 400)

  const desglose = calcularPrecio(limpio)

  // Modo previsualizacion: la pantalla de resumen necesita mostrar el precio
  // antes de que el usuario acepte, y no queremos crear una cotizacion cada
  // vez que alguien se asoma. Calcula igual, en el servidor, pero no escribe.
  if (body.preview === true) return json({ desglose }, 200)

  // Service role: el navegador no necesita INSERT sobre quotes y el precio no
  // puede alterarse desde el cliente.
  const comoServidor = createClient(url, service)
  const { data, error } = await comoServidor
    .from('quotes')
    .insert({
      user_id: sesion.user.id,
      origin: limpio.origin,
      origin_code: limpio.origin_code || null,
      dest: limpio.dest,
      dest_code: limpio.dest_code || null,
      cargo_type: limpio.cargo_type || null,
      containers: String(limpio.containers),
      weight: limpio.weight || null,
      cargo_desc: limpio.cargo_desc || null,
      special: limpio.special,
      customs: limpio.customs,
      operation: limpio.operation || null,
      incoterm: limpio.incoterm || null,
      price: desglose.total,
      precio_sugerido: desglose.total,
      price_breakdown: desglose,
      // Nace en revision, no lista para vender. El precio que calcula esta
      // funcion todavia no sabe de distancia ni de lo que cobra el
      // transportista; que un humano lo libere no es burocracia, es lo unico
      // que hay entre el calculo y un compromiso de venta.
      status: 'por_aprobar',
    })
    .select()
    .single()

  if (error) {
    console.error('cotizar: fallo el insert', error)
    return json({ error: 'No se pudo guardar la cotizacion.' }, 500)
  }

  return json({ quote: data, desglose }, 201)
})

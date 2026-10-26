// La pantalla del transportista. Fase 2, tarea 4 — la mitad que no depende de
// decisiones pendientes.
//
// Lo que esta pantalla NO tiene, a proposito:
//
//   - No muestra el precio que paga el embarcador. Eso seria enseñarle la
//     comision, y no es asunto suyo. Desde el 26 oct 2026 si ve SU monto,
//     el que se le va a pagar, dentro de la oferta.
//   - No hay "carga disponible" que cualquiera pueda tomar. Eso es un
//     marketplace abierto y supone que ya sabemos quien contrata a quien.
//     Aqui una persona decide a quien ofrecerle cada envio; el transportista
//     decide si lo toma. Las dos mitades son humanas, que es el principio
//     del proyecto.
//
// Lo que si hace: que el transportista vea los viajes que le asignaron y
// reporte avance desde el telefono. Ese reporte es lo mas cercano a rastreo
// honesto que existe sin GPS, y es lo que apaga la alerta de "sin movimiento".

import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'
import { Modal } from '../components/ui/Modal'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Spinner, KVRow } from '../components/ui/Misc'
import { supabase } from '../lib/supabase'
import {
  reportarAvance, getEventos, canjearInvitacion,
  misOfertas, aceptarOferta, rechazarOferta, misUnidadesYChoferes, misPagos,
  HITOS, ESTATUS_ENVIO,
  type HitoAvance, type EventoEnvio, type EstatusEnvio,
  type OfertaTransportista, type PagoTransportista,
} from '../lib/roles'
import type { DbShipment } from '../lib/db'

interface Props {
  /** null mientras no haya canjeado su codigo de invitacion. */
  carrierId: string | null
  onVinculado: () => void
  toast: (t: { type: string; title: string; msg?: string }) => void
}

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }) : '—'

export function MisViajesPage({ carrierId, onVinculado, toast }: Props) {
  const [viajes, setViajes] = useState<DbShipment[]>([])
  // Arranca en false cuando no hay carrier: sin vinculo no hay nada que
  // cargar, y poner el estado a false desde dentro del efecto provoca un
  // render en cascada (react-hooks/set-state-in-effect).
  const [cargando, setCargando] = useState(carrierId !== null)
  const [error, setError] = useState('')
  const [abierto, setAbierto] = useState<DbShipment | null>(null)
  const [ofertas, setOfertas] = useState<OfertaTransportista[]>([])
  const [pagos, setPagos] = useState<PagoTransportista[]>([])
  const [respondiendo, setRespondiendo] = useState<OfertaTransportista | null>(null)

  const cargar = async () => {
    setCargando(true); setError('')
    try {
      // La RLS decide que filas salen: esta consulta no filtra por carrier.
      // Si el dia de mañana alguien quita la politica, la pantalla no es la
      // que protege los datos — por eso no se finge que lo sea.
      const [{ data, error: e }, o, pg] = await Promise.all([
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
        misOfertas(),
        misPagos(),
      ])
      if (e) throw e
      setViajes((data ?? []) as DbShipment[])
      setOfertas(o)
      setPagos(pg)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus viajes')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (!carrierId) return
    let vivo = true
    ;(async () => {
      try {
        const [{ data, error: e }, o, pg] = await Promise.all([
          supabase.from('shipments').select('*').order('created_at', { ascending: false }),
          misOfertas(),
          misPagos(),
        ])
        if (e) throw e
        if (vivo) { setViajes((data ?? []) as DbShipment[]); setOfertas(o); setPagos(pg) }
      } catch (err) {
        if (vivo) setError(err instanceof Error ? err.message : 'No se pudieron cargar tus viajes')
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => { vivo = false }
  }, [carrierId])

  if (!carrierId) return <Vincular onVinculado={onVinculado} toast={toast} />

  const activos = viajes.filter(v => v.status !== 'delivered' && v.status !== 'cancelled')
  const cerrados = viajes.filter(v => v.status === 'delivered' || v.status === 'cancelled')

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mis viajes</h1>
          <p className="page-sub">Los envíos que FleetWeb le asignó a tu empresa.</p>
        </div>
        <Button variant="secondary" icon="refresh" onClick={cargar} loading={cargando}>Actualizar</Button>
      </div>

      {error && (
        <Card style={{ borderColor: 'var(--red-500)', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, color: 'var(--red-500)', fontSize: 14 }}>
            <Icon name="alertCircle" size={18} /><span>{error}</span>
          </div>
        </Card>
      )}

      {/* Las ofertas van primero: es lo único que le pide una decisión. */}
      {!cargando && ofertas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 10 }}>
            Te están ofreciendo {ofertas.length === 1 ? 'un viaje' : `${ofertas.length} viajes`}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ofertas.map(o => {
              const v = viajes.find(x => x.id === o.shipment_id)
              return (
                <Card key={o.id} style={{ borderColor: '#0A7D1C' }}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-strong)' }}>
                        {v ? `${v.origin} → ${v.dest}` : 'Viaje ofrecido'}
                      </div>
                      {o.nota && (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{o.nota}</div>
                      )}
                      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 3 }}>
                        {o.vence_en ? `Vence ${fecha(o.vence_en)}` : 'Sin fecha de vencimiento'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: .4 }}>
                        Te pagamos
                      </div>
                      <div className="mono tnum" style={{ fontSize: 21, fontWeight: 750, color: '#0A7D1C' }}>
                        ${Number(o.monto).toLocaleString('es-MX')} MXN
                      </div>
                    </div>
                    <Button onClick={() => setRespondiendo(o)}>Ver y responder</Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Lo que FleetWeb le debe. Registro, no transferencia. */}
      {!cargando && pagos.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--text-strong)', marginBottom: 8 }}>
            Tus pagos
          </div>
          {pagos.map(pg => (
            <div key={pg.id} style={{
              display: 'flex', justifyContent: 'space-between', gap: 12,
              fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border-soft)',
            }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {pg.tipo === 'anticipo' ? 'Anticipo' : 'Liquidación'}
                {pg.referencia ? ` · ref. ${pg.referencia}` : ''}
              </span>
              <span className="mono tnum" style={{
                fontWeight: 650,
                color: pg.estatus === 'pagado' ? '#0A7D1C' : 'var(--text-strong)',
              }}>
                ${Number(pg.monto).toLocaleString('es-MX')} · {pg.estatus === 'pagado' ? 'pagado' : 'por pagar'}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
            Esta lista es el registro de lo acordado. Las transferencias se hacen por fuera.
          </div>
        </Card>
      )}

      {cargando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
      ) : viajes.length === 0 && ofertas.length === 0 ? (
        <Card><div style={{ textAlign: 'center', padding: 32, color: 'var(--text-faint)', fontSize: 14 }}>
          Todavía no tienes viajes asignados.
        </div></Card>
      ) : (
        <>
          <Lista titulo="En curso" viajes={activos} onAbrir={setAbierto} />
          <Lista titulo="Cerrados" viajes={cerrados} onAbrir={setAbierto} />
        </>
      )}

      {respondiendo && (
        <ResponderOferta
          oferta={respondiendo}
          viaje={viajes.find(x => x.id === respondiendo.shipment_id) ?? null}
          onClose={() => setRespondiendo(null)}
          onCambio={() => { setRespondiendo(null); cargar() }}
          toast={toast}
        />
      )}

      {abierto && (
        <DetalleViaje
          viaje={abierto}
          onClose={() => setAbierto(null)}
          onCambio={() => { setAbierto(null); cargar() }}
          toast={toast}
        />
      )}
    </div>
  )
}

function Lista({ titulo, viajes, onAbrir }: {
  titulo: string; viajes: DbShipment[]; onAbrir: (v: DbShipment) => void
}) {
  if (viajes.length === 0) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 8 }}>
        {titulo} ({viajes.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {viajes.map(v => (
          <Card key={v.id} hover onClick={() => onAbrir(v)}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{v.ref_id}</span>
                  <StatusBadge status={v.status} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-strong)' }}>
                  {v.origin} → {v.dest}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>
                  {v.plate || 'sin placas'}{v.driver ? ` · ${v.driver}` : ''}
                  {v.compromiso_en ? ` · entrega ${fecha(v.compromiso_en)}` : ''}
                </div>
              </div>
              <Icon name="chevronRight" size={18} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Canjear el codigo de invitacion ───────────────────────────

function Vincular({ onVinculado, toast }: { onVinculado: () => void; toast: Props['toast'] }) {
  const [codigo, setCodigo] = useState('')
  const [guardando, setGuardando] = useState(false)

  const canjear = async () => {
    setGuardando(true)
    try {
      await canjearInvitacion(codigo)
      toast({ type: 'success', title: 'Cuenta vinculada', msg: 'Ya puedes ver tus viajes.' })
      onVinculado()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo vincular', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  return (
    <div className="page" style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1 className="page-title">Vincula tu empresa</h1>
      <p className="page-sub" style={{ marginBottom: 20 }}>
        FleetWeb te dio un código de 8 caracteres. Escríbelo aquí una sola vez y
        esta cuenta queda ligada a tu empresa transportista.
      </p>
      <Card>
        <Field label="Código de invitación" required hint="No lleva la letra O ni el número 0.">
          <Input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
                 placeholder="ABCD2345" maxLength={8}
                 style={{ letterSpacing: 3, fontFamily: 'var(--mono, monospace)' }} />
        </Field>
        <Button onClick={canjear} loading={guardando} disabled={codigo.trim().length < 8}>
          Vincular
        </Button>
      </Card>
    </div>
  )
}

// ── Detalle de un viaje y reporte de avance ───────────────────

function DetalleViaje({ viaje, onClose, onCambio, toast }: {
  viaje: DbShipment; onClose: () => void; onCambio: () => void; toast: Props['toast']
}) {
  const [eventos, setEventos] = useState<EventoEnvio[]>([])
  const [hito, setHito] = useState<HitoAvance | null>(null)
  const [ubicacion, setUbicacion] = useState('')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { getEventos(viaje.id).then(setEventos).catch(() => {}) }, [viaje.id])

  const cerrado = viaje.status === 'delivered' || viaje.status === 'cancelled'

  const reportar = async () => {
    if (!hito) return
    setGuardando(true)
    try {
      await reportarAvance(viaje.id, hito, ubicacion, nota)
      toast({ type: 'success', title: 'Reporte enviado',
              msg: HITOS.find(h => h.id === hito)?.label })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo reportar', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  const pie = hito ? (
    <>
      <Button variant="ghost" onClick={() => setHito(null)}>Cancelar</Button>
      <Button onClick={reportar} loading={guardando}>Enviar reporte</Button>
    </>
  ) : null

  return (
    <Modal open onClose={onClose} width={560} footer={pie}
           title={`${viaje.ref_id} · ${viaje.origin} → ${viaje.dest}`}>
      <KVRow label="Estatus" value={<StatusBadge status={viaje.status} />} />
      <KVRow label="Carga" value={viaje.cargo || '—'} />
      <KVRow label="Contenedores" value={viaje.containers || '—'} />
      <KVRow label="Peso" value={viaje.weight || '—'} />
      <KVRow label="Placas" value={viaje.plate || '—'} mono />
      <KVRow label="Operador" value={viaje.driver || '—'} />
      <KVRow label="Entrega comprometida"
             value={viaje.compromiso_en ? fecha(viaje.compromiso_en) : 'Sin fecha'} />

      {!cerrado && (
        <div style={{ marginTop: 20 }}>
          {!hito ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>
                Reportar avance
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {HITOS.map(h => (
                  <Button key={h.id} variant="secondary" icon={h.icon} onClick={() => setHito(h.id)}>
                    {h.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 12 }}>
                {HITOS.find(h => h.id === hito)?.label}
              </div>
              <Field label="¿Dónde vas?" hint="Una ciudad o una caseta. Se queda en la bitácora.">
                <Input value={ubicacion} onChange={e => setUbicacion(e.target.value)}
                       placeholder="Querétaro" />
              </Field>
              <Field label="Nota">
                <Textarea rows={2} value={nota} onChange={e => setNota(e.target.value)}
                          placeholder="Lo que haya que avisar" />
              </Field>
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>
          Bitácora
        </div>
        {eventos.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Sin movimientos registrados.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {eventos.map(ev => (
              <div key={ev.id} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
                    {ev.status ? ESTATUS_ENVIO[ev.status as EstatusEnvio] : 'Movimiento'}
                    {ev.ubicacion ? ` · ${ev.ubicacion}` : ''}
                  </div>
                  {ev.nota && <div style={{ color: 'var(--text-muted)' }}>{ev.nota}</div>}
                  <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>{fecha(ev.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Responder una oferta ──────────────────────────────────────

interface ResponderProps {
  oferta: OfertaTransportista
  viaje: DbShipment | null
  onClose: () => void
  onCambio: () => void
  toast: (t: { type: string; title: string; msg?: string }) => void
}

/**
 * Aquí el transportista decide. Elige su unidad y su chofer porque es lo
 * único del proceso que sólo él sabe: cuál tiene libre mañana.
 *
 * El monto que ve es el suyo, no el del embarcador. Esa distinción es la
 * razón de que esta pantalla exista.
 */
function ResponderOferta({ oferta, viaje, onClose, onCambio, toast }: ResponderProps) {
  const [unidades, setUnidades] = useState<{ id: string; placas: string; tipo: string | null }[]>([])
  const [choferes, setChoferes] = useState<{ id: string; nombre: string }[]>([])
  const [unidad, setUnidad] = useState('')
  const [chofer, setChofer] = useState('')
  const [motivo, setMotivo] = useState('')
  const [vista, setVista] = useState<'aceptar' | 'rechazar'>('aceptar')
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const r = await misUnidadesYChoferes()
        if (vivo) { setUnidades(r.unidades); setChoferes(r.choferes) }
      } finally { if (vivo) setCargando(false) }
    })()
    return () => { vivo = false }
  }, [])

  const aceptar = async () => {
    setGuardando(true)
    try {
      await aceptarOferta(oferta.id, unidad, chofer || null)
      toast({ type: 'success', title: 'Viaje aceptado',
              msg: 'Ya aparece en tus viajes en curso' })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo aceptar', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  const rechazar = async () => {
    setGuardando(true)
    try {
      await rechazarOferta(oferta.id, motivo)
      toast({ type: 'success', title: 'Viaje rechazado' })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo rechazar', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  const pie = vista === 'aceptar' ? (
    <>
      <Button variant="ghost" onClick={() => setVista('rechazar')}>No puedo</Button>
      <Button onClick={aceptar} loading={guardando} disabled={!unidad || cargando}>
        Aceptar el viaje
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" onClick={() => setVista('aceptar')}>Volver</Button>
      <Button variant="danger" onClick={rechazar} loading={guardando}>Rechazar</Button>
    </>
  )

  return (
    <Modal open onClose={onClose} width={560} footer={pie}
           title={viaje ? `${viaje.origin} → ${viaje.dest}` : 'Viaje ofrecido'}>
      <div style={{
        padding: '12px 14px', borderRadius: 10, background: '#E8F8EA',
        marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13.5, color: '#0A7D1C' }}>Se te paga por este viaje</span>
        <span className="mono tnum" style={{ fontSize: 22, fontWeight: 750, color: '#0A7D1C' }}>
          ${Number(oferta.monto).toLocaleString('es-MX')} MXN
        </span>
      </div>

      {viaje && <>
        <KVRow label="Carga" value={viaje.cargo || '—'} />
        <KVRow label="Contenedores" value={viaje.containers || '—'} />
        <KVRow label="Peso" value={viaje.weight || '—'} />
      </>}
      {oferta.nota && <KVRow label="Nota de FleetWeb" value={oferta.nota} />}
      {oferta.vence_en && <KVRow label="Puedes responder hasta" value={fecha(oferta.vence_en)} />}

      {vista === 'aceptar' ? (
        <div style={{ marginTop: 18 }}>
          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner size={22} /></div>
          ) : unidades.length === 0 ? (
            <div style={{ fontSize: 13.5, color: 'var(--st-disputed)' }}>
              No tienes unidades dadas de alta. Avísale a FleetWeb para registrarlas
              antes de poder aceptar viajes.
            </div>
          ) : (
            <>
              <Field label="¿Qué unidad mandas?" required>
                <select value={unidad} onChange={e => setUnidad(e.target.value)}
                        style={{ width: '100%', padding: '9px 11px', borderRadius: 6,
                                 border: '1px solid var(--border)', fontSize: 14 }}>
                  <option value="">Elige una unidad…</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.placas}{u.tipo ? ` · ${u.tipo}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="¿Qué chofer va?" hint="Puedes dejarlo en blanco y decirlo después.">
                <select value={chofer} onChange={e => setChofer(e.target.value)}
                        style={{ width: '100%', padding: '9px 11px', borderRadius: 6,
                                 border: '1px solid var(--border)', fontSize: 14 }}>
                  <option value="">Lo defino después</option>
                  {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
              <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 8 }}>
                Al aceptar, el viaje pasa a tus viajes en curso y ya puedes reportar
                avance desde aquí.
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 18 }}>
          <Field label="¿Por qué no puedes?"
                 hint="Nos ayuda a no ofrecerte viajes que no te sirven.">
            <Textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)}
                      placeholder="No tengo unidad libre esa fecha" />
          </Field>
        </div>
      )}
    </Modal>
  )
}

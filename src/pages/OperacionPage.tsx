// Consola de operacion. La pantalla de Quique, no la del embarcador.
//
// Todo lo que cambia el estado de un envio sale de un RPC del servidor
// (mover_envio, asignar_unidad). Esta pagina no escribe una sola fila directo
// en la tabla. Si algun dia hace falta un campo nuevo, se agrega al RPC, no
// un update desde aqui.

import { useEffect, useState, useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'
import { Modal } from '../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../components/ui/Input'
import { Spinner, KVRow } from '../components/ui/Misc'
import { Tabs } from '../components/ui/Tabs'
import { fmtMXN } from '../data/mockData'
import {
  getEnviosOperacion, getCotizacionesOperacion, getEnviosEnRiesgo,
  aprobarCotizacion, rechazarCotizacion, fijarCompromiso,
  MOTIVO_ALERTA,
  type EnvioOperacion, type CotizacionOperacion, type EnvioEnRiesgo,
} from '../lib/operacion'
import {
  moverEnvio, asignarUnidad, getEventos,
  ESTATUS_ENVIO, type EstatusEnvio, type EventoEnvio,
} from '../lib/roles'

interface Props {
  toast: (t: { type: string; title: string; msg?: string }) => void
}

const FILTROS: { id: string; label: string }[] = [
  { id: 'todos',     label: 'Todos' },
  { id: 'waiting',   label: 'Por asignar' },
  { id: 'transit',   label: 'En tránsito' },
  { id: 'delayed',   label: 'Demorados' },
  { id: 'delivered', label: 'Entregados' },
  { id: 'cancelled', label: 'Cancelados' },
]

/**
 * `datetime-local` no entiende ISO con zona: quiere 'YYYY-MM-DDTHH:mm' en hora
 * local. Convertir con toISOString() aqui restaria las horas de la zona y el
 * operador veria una fecha distinta a la que guardo.
 */
const paraInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const dosDig = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dosDig(d.getMonth() + 1)}-${dosDig(d.getDate())}`
       + `T${dosDig(d.getHours())}:${dosDig(d.getMinutes())}`
}

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export function OperacionPage({ toast }: Props) {
  const [tab, setTab] = useState('envios')
  const [envios, setEnvios] = useState<EnvioOperacion[]>([])
  const [cotizaciones, setCotizaciones] = useState<CotizacionOperacion[]>([])
  const [riesgo, setRiesgo] = useState<EnvioEnRiesgo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [abierto, setAbierto] = useState<EnvioOperacion | null>(null)
  const [revisando, setRevisando] = useState<CotizacionOperacion | null>(null)

  const cargar = async () => {
    setCargando(true); setError('')
    try {
      const [e, c, a] = await Promise.all([
        getEnviosOperacion(), getCotizacionesOperacion(), getEnviosEnRiesgo(),
      ])
      setEnvios(e); setCotizaciones(c); setRiesgo(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la operación')
    } finally {
      setCargando(false)
    }
  }

  // La carga inicial no llama a setState de forma sincrona dentro del efecto
  // (regla de react-hooks) y ademas se cancela si la pantalla se desmonta
  // antes de que respondan las consultas.
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [e, c, a] = await Promise.all([
          getEnviosOperacion(), getCotizacionesOperacion(), getEnviosEnRiesgo(),
        ])
        if (vivo) { setEnvios(e); setCotizaciones(c); setRiesgo(a) }
      } catch (err) {
        if (vivo) setError(err instanceof Error ? err.message : 'No se pudo cargar la operación')
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => { vivo = false }
  }, [])

  const filtrados = useMemo(
    () => filtro === 'todos' ? envios : envios.filter(e => e.status === filtro),
    [envios, filtro],
  )

  const porAsignar = envios.filter(e => e.status === 'waiting' && !e.carrier).length
  const enRuta = envios.filter(e => e.status === 'transit' || e.status === 'delayed').length
  const porAprobar = cotizaciones.filter(c => c.status === 'por_aprobar').length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Operación</h1>
          <p className="page-sub">
            Todos los envíos y cotizaciones de la plataforma. Esta pantalla sólo la ve el operador.
          </p>
        </div>
        <Button variant="secondary" icon="refresh" onClick={cargar} loading={cargando}>Actualizar</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <Card style={{ flex: '1 1 180px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Por asignar camión</div>
          <div style={{ fontSize: 26, fontWeight: 750, color: porAsignar ? 'var(--orange-500)' : 'var(--text-strong)' }}>{porAsignar}</div>
        </Card>
        <Card style={{ flex: '1 1 180px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>En ruta</div>
          <div style={{ fontSize: 26, fontWeight: 750, color: 'var(--text-strong)' }}>{enRuta}</div>
        </Card>
        <Card style={{ flex: '1 1 180px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Cotizaciones por aprobar</div>
          <div style={{ fontSize: 26, fontWeight: 750, color: porAprobar ? 'var(--orange-500)' : 'var(--text-strong)' }}>{porAprobar}</div>
        </Card>
        <Card style={{ flex: '1 1 180px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Van tarde</div>
          <div style={{ fontSize: 26, fontWeight: 750, color: riesgo.length ? 'var(--red-500)' : 'var(--text-strong)' }}>{riesgo.length}</div>
        </Card>
      </div>

      {riesgo.length > 0 && (
        <Card style={{ marginBottom: 20, borderColor: 'var(--red-500)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <Icon name="alertCircle" size={18} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
              Lo que va tarde ({riesgo.length})
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginBottom: 12 }}>
            Esto no es rastreo: nadie sabe dónde está el camión. Es la lista de lo que
            <strong> no ha pasado</strong> — sin unidad asignada, fecha vencida, o sin reporte.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {riesgo.map(a => (
              <div key={`${a.shipment_id}-${a.motivo}`}
                   style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
                            padding: '8px 10px', borderRadius: 8, background: 'var(--red-50)' }}>
                <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-faint)', minWidth: 96 }}>
                  {a.ref_id || '—'}
                </span>
                <Badge color="var(--red-500)" bg="#fff" dot>{MOTIVO_ALERTA[a.motivo]}</Badge>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: '1 1 240px' }}>
                  {a.detalle}
                </span>
                <Button variant="ghost" size="sm" onClick={() => {
                  const e = envios.find(x => x.id === a.shipment_id)
                  if (e) { setTab('envios'); setAbierto(e) }
                }}>Abrir</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Tabs
        tabs={[
          { id: 'envios', label: `Envíos (${envios.length})`, icon: 'package' },
          { id: 'cotizaciones', label: `Cotizaciones (${porAprobar ? `${porAprobar} por aprobar` : cotizaciones.length})`, icon: 'fileText' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {error && (
        <Card style={{ borderColor: 'var(--red-500)', marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, color: 'var(--red-500)', fontSize: 14 }}>
            <Icon name="alertCircle" size={18} /><span>{error}</span>
          </div>
        </Card>
      )}

      {cargando && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
      )}

      {!cargando && tab === 'envios' && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
            {FILTROS.map(f => (
              <button
                key={f.id}
                className={`chip ${filtro === f.id ? 'active' : ''}`}
                onClick={() => setFiltro(f.id)}
                style={{
                  border: '1px solid var(--border-soft)', borderRadius: 999,
                  padding: '5px 13px', fontSize: 13, cursor: 'pointer',
                  background: filtro === f.id ? 'var(--text-strong)' : '#fff',
                  color: filtro === f.id ? '#fff' : 'var(--text-muted)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtrados.length === 0 ? (
            <Card><div style={{ textAlign: 'center', padding: 32, color: 'var(--text-faint)', fontSize: 14 }}>
              No hay envíos con ese filtro.
            </div></Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtrados.map(e => (
                <Card key={e.id} hover onClick={() => setAbierto(e)}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{e.ref_id}</span>
                        <StatusBadge status={e.status} />
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text-strong)' }}>
                        {e.origin} → {e.dest}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>
                        {e.embarcador?.empresa || 'Sin empresa'} · {e.embarcador?.nombre || '—'}
                      </div>
                    </div>

                    <div style={{ flex: '0 1 200px' }}>
                      {e.carrier ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{e.carrier}</div>
                          <div className="mono" style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                            {e.plate || 'sin placas'}{e.driver ? ` · ${e.driver}` : ''}
                          </div>
                        </>
                      ) : (
                        <Badge color="var(--orange-500)" bg="var(--orange-50)" dot>Sin camión asignado</Badge>
                      )}
                    </div>

                    <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                      <div className="mono tnum" style={{ fontSize: 15, fontWeight: 750, color: 'var(--text-strong)' }}>
                        {fmtMXN(e.price)} MXN
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                        cobrado {fmtMXN(e.paid)}
                      </div>
                    </div>
                    <Icon name="chevronRight" size={18} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!cargando && tab === 'cotizaciones' && (
        <div style={{ marginTop: 16 }}>
          <Card style={{ marginBottom: 12, background: 'var(--blue-50)', borderColor: 'transparent' }}>
            <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              <Icon name="info" size={17} />
              <span>
                El precio que trae cada cotización lo calculó el servidor con una fórmula que
                todavía <strong>no conoce distancia ni el costo del transportista</strong>.
                Revísalo antes de liberarlo: el embarcador no lo ve hasta que tú lo apruebas.
              </span>
            </div>
          </Card>

          {cotizaciones.length === 0 ? (
            <Card><div style={{ textAlign: 'center', padding: 32, color: 'var(--text-faint)', fontSize: 14 }}>
              Todavía no hay cotizaciones.
            </div></Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cotizaciones.map(c => (
                <Card key={c.id}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{c.ref_id}</span>
                        <EstadoCotizacion status={c.status} />
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text-strong)' }}>
                        {c.origin} → {c.dest}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>
                        {c.embarcador?.empresa || 'Sin empresa'} · {fecha(c.created_at)}
                      </div>
                      {c.ajuste_nota && (
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                          Ajuste: {c.ajuste_nota}
                        </div>
                      )}
                      {c.motivo_rechazo && (
                        <div style={{ fontSize: 12.5, color: 'var(--red-500)', marginTop: 4 }}>
                          Rechazada: {c.motivo_rechazo}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                      <div className="mono tnum" style={{ fontSize: 15, fontWeight: 750, color: 'var(--text-strong)' }}>
                        {c.price != null ? `${fmtMXN(c.price)} MXN` : '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                        {c.precio_sugerido != null && c.price != null && c.precio_sugerido !== c.price
                          ? `sugerido ${fmtMXN(c.precio_sugerido)}`
                          : c.price_breakdown ? 'calculado en servidor' : 'sin desglose'}
                      </div>
                    </div>
                    {c.status === 'por_aprobar' && (
                      <Button size="sm" icon="checkCircle" onClick={() => setRevisando(c)}>Revisar</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {revisando && (
        <RevisarCotizacion
          cot={revisando}
          onClose={() => setRevisando(null)}
          onCambio={() => { setRevisando(null); cargar() }}
          toast={toast}
        />
      )}

      {abierto && (
        <DetalleOperacion
          envio={abierto}
          onClose={() => setAbierto(null)}
          onCambio={() => { setAbierto(null); cargar() }}
          toast={toast}
        />
      )}
    </div>
  )
}

// ── Estado de una cotizacion ──────────────────────────────────

const ESTADO_COT: Record<string, { label: string; color: string; bg: string }> = {
  por_aprobar: { label: 'Por aprobar', color: 'var(--orange-500)', bg: 'var(--orange-50)' },
  aprobada:    { label: 'Aprobada',    color: 'var(--green-500)',  bg: 'var(--green-50)' },
  rechazada:   { label: 'Rechazada',   color: 'var(--red-500)',    bg: 'var(--red-50)' },
  accepted:    { label: 'Aceptada',    color: 'var(--green-500)',  bg: 'var(--green-50)' },
  expired:     { label: 'Vencida',     color: 'var(--red-500)',    bg: 'var(--red-50)' },
}

function EstadoCotizacion({ status }: { status: string }) {
  const m = ESTADO_COT[status]
  if (!m) return <Badge color="var(--text-faint)" bg="var(--gray-50)">{status}</Badge>
  return <Badge color={m.color} bg={m.bg} dot>{m.label}</Badge>
}

// ── Revisar una cotizacion ────────────────────────────────────

interface RevisarProps {
  cot: CotizacionOperacion
  onClose: () => void
  onCambio: () => void
  toast: Props['toast']
}

/**
 * La pantalla donde una persona decide el precio. No hay boton de "aprobar
 * todo": cada cotizacion se mira una por una, y eso es a proposito. Cuando
 * haya 30 envios reales y un tarifario de verdad se podra automatizar; antes
 * de eso, automatizar es adivinar mas rapido.
 */
function RevisarCotizacion({ cot, onClose, onCambio, toast }: RevisarProps) {
  const sugerido = cot.precio_sugerido ?? cot.price ?? 0
  const [precio, setPrecio] = useState(String(sugerido))
  const [nota, setNota] = useState('')
  const [motivo, setMotivo] = useState('')
  const [vista, setVista] = useState<'aprobar' | 'rechazar'>('aprobar')
  const [guardando, setGuardando] = useState(false)

  const num = Number(precio)
  const valido = Number.isFinite(num) && num > 0
  const cambio = valido && num !== sugerido

  const aprobar = async () => {
    setGuardando(true)
    try {
      await aprobarCotizacion(cot.id, num, nota)
      toast({ type: 'success', title: 'Cotización aprobada',
              msg: `${cot.ref_id} · ${fmtMXN(num)} MXN` })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo aprobar', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  const rechazar = async () => {
    setGuardando(true)
    try {
      await rechazarCotizacion(cot.id, motivo)
      toast({ type: 'success', title: 'Cotización rechazada', msg: cot.ref_id })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo rechazar', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  const pie = vista === 'aprobar' ? (
    <>
      <Button variant="ghost" onClick={() => setVista('rechazar')}>Rechazar</Button>
      <Button onClick={aprobar} loading={guardando}
              disabled={!valido || (cambio && !nota.trim())}>
        Aprobar y liberar
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" onClick={() => setVista('aprobar')}>Volver</Button>
      <Button variant="danger" onClick={rechazar} loading={guardando}
              disabled={!motivo.trim()}>Rechazar cotización</Button>
    </>
  )

  return (
    <Modal open onClose={onClose} width={580} footer={pie}
           title={`${cot.ref_id} · ${cot.origin} → ${cot.dest}`}>
      <KVRow label="Embarcador" value={cot.embarcador?.empresa || '—'} />
      <KVRow label="Contacto" value={cot.embarcador?.nombre || '—'} />
      <KVRow label="Carga" value={cot.cargo_desc || '—'} />
      <KVRow label="Contenedores" value={cot.containers || '—'} />
      <KVRow label="Peso" value={cot.weight || '—'} />
      <KVRow label="Precio sugerido por el servidor"
             value={`${fmtMXN(sugerido)} MXN`} mono strong />

      {vista === 'aprobar' ? (
        <div style={{ marginTop: 18 }}>
          <Field label="Precio que verá el embarcador" required
                 hint="En pesos, sin centavos. Si lo dejas igual al sugerido, no hace falta nota.">
            <Input value={precio} onChange={e => setPrecio(e.target.value)} inputMode="numeric" />
          </Field>
          {cambio && (
            <Field label="Por qué lo cambiaste" required
                   hint="Se guarda con la cotización. Es el dato que después dice si la fórmula sirve o no.">
              <Textarea rows={3} value={nota} onChange={e => setNota(e.target.value)}
                        placeholder="Las casetas de la 57 subieron; el transportista cobra más en viernes" />
            </Field>
          )}
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 10 }}>
            Al aprobar, la cotización se le libera al embarcador y vence 24 horas después.
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 18 }}>
          <Field label="Motivo del rechazo" required
                 hint="El embarcador lo va a leer. Escríbelo como se lo dirías por teléfono.">
            <Textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)}
                      placeholder="Ruta fuera del corredor que estamos operando" />
          </Field>
        </div>
      )}
    </Modal>
  )
}

// ── Detalle de un envio ───────────────────────────────────────

interface DetalleProps {
  envio: EnvioOperacion
  onClose: () => void
  onCambio: () => void
  toast: Props['toast']
}

function DetalleOperacion({ envio, onClose, onCambio, toast }: DetalleProps) {
  const [eventos, setEventos] = useState<EventoEnvio[]>([])
  const [vista, setVista] = useState<'detalle' | 'asignar' | 'mover' | 'compromiso'>('detalle')
  const [guardando, setGuardando] = useState(false)

  const [transportista, setTransportista] = useState(envio.carrier ?? '')
  const [operador, setOperador] = useState(envio.driver ?? '')
  const [placas, setPlacas] = useState(envio.plate ?? '')

  const [compromiso, setCompromiso] = useState(paraInput(envio.compromiso_en))

  const [status, setStatus] = useState<EstatusEnvio>((envio.status as EstatusEnvio) ?? 'waiting')
  const [ubicacion, setUbicacion] = useState('')
  const [nota, setNota] = useState('')

  useEffect(() => {
    getEventos(envio.id).then(setEventos).catch(() => {})
  }, [envio.id])

  const guardarAsignacion = async () => {
    setGuardando(true)
    try {
      await asignarUnidad(envio.id, transportista, operador, placas)
      toast({ type: 'success', title: 'Unidad asignada', msg: `${transportista} · ${placas}` })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo asignar', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  const guardarCompromiso = async () => {
    setGuardando(true)
    try {
      await fijarCompromiso(envio.id, compromiso ? new Date(compromiso).toISOString() : null)
      toast({ type: 'success', title: 'Fecha compromiso guardada',
              msg: compromiso ? fecha(new Date(compromiso).toISOString()) : 'Se quitó la fecha' })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo guardar', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  const guardarMovimiento = async () => {
    setGuardando(true)
    try {
      await moverEnvio(envio.id, status, ubicacion || undefined, nota || undefined)
      toast({ type: 'success', title: 'Envío actualizado', msg: ESTATUS_ENVIO[status] })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo actualizar', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  const pie = vista === 'asignar' ? (
    <>
      <Button variant="ghost" onClick={() => setVista('detalle')}>Cancelar</Button>
      <Button onClick={guardarAsignacion} loading={guardando}
              disabled={!transportista.trim() || !placas.trim()}>Asignar</Button>
    </>
  ) : vista === 'mover' ? (
    <>
      <Button variant="ghost" onClick={() => setVista('detalle')}>Cancelar</Button>
      <Button onClick={guardarMovimiento} loading={guardando}>Guardar cambio</Button>
    </>
  ) : vista === 'compromiso' ? (
    <>
      <Button variant="ghost" onClick={() => setVista('detalle')}>Cancelar</Button>
      <Button onClick={guardarCompromiso} loading={guardando}>Guardar fecha</Button>
    </>
  ) : (
    <>
      <Button variant="secondary" icon="clock" onClick={() => setVista('compromiso')}>
        Fecha compromiso
      </Button>
      <Button variant="secondary" icon="truck" onClick={() => setVista('asignar')}>
        {envio.carrier ? 'Cambiar unidad' : 'Asignar unidad'}
      </Button>
      <Button icon="navigation" onClick={() => setVista('mover')}>Mover estatus</Button>
    </>
  )

  return (
    <Modal open onClose={onClose} width={620} footer={pie}
           title={`${envio.ref_id} · ${envio.origin} → ${envio.dest}`}>

      {vista === 'detalle' && (
        <>
          <KVRow label="Embarcador" value={envio.embarcador?.empresa || '—'} />
          <KVRow label="Contacto" value={envio.embarcador?.nombre || '—'} />
          <KVRow label="Estatus" value={<StatusBadge status={envio.status} />} />
          <KVRow label="Carga" value={envio.cargo || '—'} />
          <KVRow label="Contenedores" value={envio.containers || '—'} />
          <KVRow label="Transportista" value={envio.carrier || 'Sin asignar'} />
          <KVRow label="Placas" value={envio.plate || '—'} mono />
          <KVRow label="Operador" value={envio.driver || '—'} />
          <KVRow label="Entrega comprometida"
                 value={envio.compromiso_en ? fecha(envio.compromiso_en) : 'Sin fecha'} />
          <KVRow label="Precio" value={`${fmtMXN(envio.price)} MXN`} mono strong />
          <KVRow label="Cobrado" value={`${fmtMXN(envio.paid)} MXN`} mono />

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
                        {ev.status ? ESTATUS_ENVIO[ev.status] : 'Movimiento'}
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
        </>
      )}

      {vista === 'asignar' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            El anticipo del 60% se cobra contra este dato, así que transportista y placas
            no pueden quedar en blanco.
          </div>
          <Field label="Transportista" required>
            <Input value={transportista} onChange={e => setTransportista(e.target.value)}
                   placeholder="Razón social del transportista" />
          </Field>
          <Field label="Placas de la unidad" required>
            <Input value={placas} onChange={e => setPlacas(e.target.value)} placeholder="AB-123-CD" />
          </Field>
          <Field label="Nombre del operador" hint="Opcional por ahora.">
            <Input value={operador} onChange={e => setOperador(e.target.value)} placeholder="Nombre del chofer" />
          </Field>
        </>
      )}

      {vista === 'compromiso' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Es la fecha que le prometiste al embarcador. Cuando se pase y el envío no
            esté entregado, aparece en la lista de lo que va tarde. Déjala vacía para
            quitarla.
          </div>
          <Field label="Fecha y hora de entrega">
            <Input type="datetime-local" value={compromiso}
                   onChange={e => setCompromiso(e.target.value)} />
          </Field>
        </>
      )}

      {vista === 'mover' && (
        <>
          <Field label="Nuevo estatus" required>
            <Select value={status} onChange={e => setStatus(e.target.value as EstatusEnvio)}>
              {(Object.keys(ESTATUS_ENVIO) as EstatusEnvio[]).map(k => (
                <option key={k} value={k}>{ESTATUS_ENVIO[k]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ubicación" hint="Dónde va la unidad. Se queda en la bitácora.">
            <Input value={ubicacion} onChange={e => setUbicacion(e.target.value)} placeholder="Querétaro" />
          </Field>
          <Field label="Nota">
            <Textarea rows={3} value={nota} onChange={e => setNota(e.target.value)}
                      placeholder="Lo que haya que dejar por escrito" />
          </Field>
        </>
      )}
    </Modal>
  )
}

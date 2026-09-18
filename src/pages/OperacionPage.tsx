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
  getEnviosOperacion, getCotizacionesOperacion,
  type EnvioOperacion, type CotizacionOperacion,
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

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export function OperacionPage({ toast }: Props) {
  const [tab, setTab] = useState('envios')
  const [envios, setEnvios] = useState<EnvioOperacion[]>([])
  const [cotizaciones, setCotizaciones] = useState<CotizacionOperacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [abierto, setAbierto] = useState<EnvioOperacion | null>(null)

  const cargar = async () => {
    setCargando(true); setError('')
    try {
      const [e, c] = await Promise.all([getEnviosOperacion(), getCotizacionesOperacion()])
      setEnvios(e); setCotizaciones(c)
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
        const [e, c] = await Promise.all([getEnviosOperacion(), getCotizacionesOperacion()])
        if (vivo) { setEnvios(e); setCotizaciones(c) }
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
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Cotizaciones totales</div>
          <div style={{ fontSize: 26, fontWeight: 750, color: 'var(--text-strong)' }}>{cotizaciones.length}</div>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: 'envios', label: `Envíos (${envios.length})`, icon: 'package' },
          { id: 'cotizaciones', label: `Cotizaciones (${cotizaciones.length})`, icon: 'fileText' },
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
                Esta lista es de sólo lectura. El flujo de <strong>aprobar una cotización antes
                de que el embarcador la vea</strong> todavía no existe: hoy el embarcador acepta
                su propia cotización con el precio que calculó el servidor.
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
                        <StatusBadge status={c.status === 'accepted' ? 'delivered' : 'pending'} withIcon={false} />
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text-strong)' }}>
                        {c.origin} → {c.dest}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>
                        {c.embarcador?.empresa || 'Sin empresa'} · {fecha(c.created_at)}
                      </div>
                    </div>
                    <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                      <div className="mono tnum" style={{ fontSize: 15, fontWeight: 750, color: 'var(--text-strong)' }}>
                        {c.price != null ? `${fmtMXN(c.price)} MXN` : '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                        {c.price_breakdown ? 'calculado en servidor' : 'sin desglose'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
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

// ── Detalle de un envio ───────────────────────────────────────

interface DetalleProps {
  envio: EnvioOperacion
  onClose: () => void
  onCambio: () => void
  toast: Props['toast']
}

function DetalleOperacion({ envio, onClose, onCambio, toast }: DetalleProps) {
  const [eventos, setEventos] = useState<EventoEnvio[]>([])
  const [vista, setVista] = useState<'detalle' | 'asignar' | 'mover'>('detalle')
  const [guardando, setGuardando] = useState(false)

  const [transportista, setTransportista] = useState(envio.carrier ?? '')
  const [operador, setOperador] = useState(envio.driver ?? '')
  const [placas, setPlacas] = useState(envio.plate ?? '')

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
  ) : (
    <>
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

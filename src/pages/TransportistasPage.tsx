// Fase 2, tareas 2 y 3: alta de transportista con expediente, y la consola
// donde el operador revisa los papeles.
//
// Lo que esta pantalla NO hace, a proposito: no marca a nadie como verificado
// por su cuenta. El boton llama a verificar_transportista(), que falla y dice
// que papel falta. Un boton que pinta de verde sin revisar nada seria peor que
// no tener pantalla.

import { useEffect, useState, useCallback } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'
import { Modal } from '../components/ui/Modal'
import { Field, Input } from '../components/ui/Input'
import { Spinner, KVRow } from '../components/ui/Misc'
import {
  getCarriers, getVehiculos, getConductores, getTiposDocumento, getExpediente,
  getFaltantes, altaTransportista, altaUnidad, altaConductor, subirDocumento,
  revisarDocumento, verificarTransportista, suspenderTransportista, verDocumento,
  ESTATUS_CARRIER,
  type Carrier, type Vehicle, type Driver, type TipoDocumento, type Documento, type Faltante,
} from '../lib/carriers'
import { invitarTransportista } from '../lib/roles'

interface Props {
  toast: (t: { type: string; title: string; msg?: string }) => void
}

const COLOR_ESTATUS: Record<string, { color: string; bg: string }> = {
  pendiente:  { color: 'var(--orange-500)',  bg: 'var(--orange-50)' },
  verificado: { color: 'var(--green-500)',   bg: 'var(--green-50)' },
  suspendido: { color: 'var(--red-500)',     bg: 'var(--red-50)' },
  rechazado:  { color: 'var(--text-faint)',  bg: 'var(--gray-100)' },
}

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const vencido = (d: Documento) => Boolean(d.vence_el && new Date(d.vence_el) < new Date())

export function TransportistasPage({ toast }: Props) {
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [tipos, setTipos] = useState<TipoDocumento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [nuevoAbierto, setNuevoAbierto] = useState(false)
  const [abierto, setAbierto] = useState<Carrier | null>(null)

  const cargar = useCallback(async () => {
    try {
      const [c, t] = await Promise.all([getCarriers(), getTiposDocumento()])
      setCarriers(c); setTipos(t); setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [c, t] = await Promise.all([getCarriers(), getTiposDocumento()])
        if (vivo) { setCarriers(c); setTipos(t) }
      } catch (e) {
        if (vivo) setError(e instanceof Error ? e.message : 'No se pudo cargar')
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => { vivo = false }
  }, [])

  const verificados = carriers.filter(c => c.estatus === 'verificado').length
  const pendientes = carriers.filter(c => c.estatus === 'pendiente').length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Transportistas</h1>
          <p className="page-sub">
            Alta, expediente documental y verificación. Sólo el operador ve esta pantalla.
          </p>
        </div>
        <Button icon="plus" onClick={() => setNuevoAbierto(true)}>Nuevo transportista</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <Card style={{ flex: '1 1 180px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Verificados</div>
          <div style={{ fontSize: 26, fontWeight: 750, color: verificados ? 'var(--green-500)' : 'var(--text-strong)' }}>{verificados}</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Meta de diciembre: 5</div>
        </Card>
        <Card style={{ flex: '1 1 180px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Con expediente pendiente</div>
          <div style={{ fontSize: 26, fontWeight: 750, color: pendientes ? 'var(--orange-500)' : 'var(--text-strong)' }}>{pendientes}</div>
        </Card>
        <Card style={{ flex: '1 1 180px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Total dados de alta</div>
          <div style={{ fontSize: 26, fontWeight: 750, color: 'var(--text-strong)' }}>{carriers.length}</div>
        </Card>
      </div>

      {error && (
        <Card style={{ borderColor: 'var(--red-500)', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, color: 'var(--red-500)', fontSize: 14 }}>
            <Icon name="alertCircle" size={18} /><span>{error}</span>
          </div>
        </Card>
      )}

      {cargando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
      ) : carriers.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-strong)', marginBottom: 6 }}>
              Todavía no hay transportistas
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 18px' }}>
              Un transportista queda verificado cuando tiene al menos una unidad, un operador,
              y todos sus papeles obligatorios aprobados y vigentes.
            </div>
            <Button icon="plus" onClick={() => setNuevoAbierto(true)}>Dar de alta el primero</Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {carriers.map(c => {
            const col = COLOR_ESTATUS[c.estatus] ?? COLOR_ESTATUS.pendiente
            return (
              <Card key={c.id} hover onClick={() => setAbierto(c)}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-strong)' }}>{c.razon_social}</span>
                      <Badge color={col.color} bg={col.bg} dot>{ESTATUS_CARRIER[c.estatus]}</Badge>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                      <span className="mono">{c.rfc || 'sin RFC'}</span>
                      {c.contacto ? ` · ${c.contacto}` : ''}
                      {c.telefono ? ` · ${c.telefono}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-faint)', textAlign: 'right' }}>
                    {c.estatus === 'verificado' && c.verificado_en
                      ? `Verificado el ${fecha(c.verificado_en)}`
                      : `Alta ${fecha(c.created_at)}`}
                  </div>
                  <Icon name="chevronRight" size={18} />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {nuevoAbierto && (
        <NuevoTransportista
          onClose={() => setNuevoAbierto(false)}
          onCreado={c => { setNuevoAbierto(false); cargar(); setAbierto(c) }}
          toast={toast}
        />
      )}

      {abierto && (
        <Expediente
          carrier={abierto}
          tipos={tipos}
          onClose={() => setAbierto(null)}
          onCambio={() => { setAbierto(null); cargar() }}
          toast={toast}
        />
      )}
    </div>
  )
}

// ── Alta ──────────────────────────────────────────────────────

function NuevoTransportista({ onClose, onCreado, toast }: {
  onClose: () => void; onCreado: (c: Carrier) => void; toast: Props['toast']
}) {
  const [razon, setRazon] = useState('')
  const [rfc, setRfc] = useState('')
  const [contacto, setContacto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    setGuardando(true)
    try {
      const c = await altaTransportista({ razon_social: razon, rfc, contacto, telefono, email })
      toast({ type: 'success', title: 'Transportista dado de alta', msg: 'Ahora carga su expediente' })
      onCreado(c)
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo dar de alta', msg: e instanceof Error ? e.message : '' })
    } finally { setGuardando(false) }
  }

  return (
    <Modal open onClose={onClose} width={560} title="Nuevo transportista"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={guardar} loading={guardando} disabled={!razon.trim()}>Dar de alta</Button>
      </>}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
        Queda en <strong>pendiente</strong> hasta que tenga unidad, operador y todos sus papeles
        aprobados. Hasta entonces no se le puede asignar carga.
      </div>
      <Field label="Razón social" required>
        <Input value={razon} onChange={e => setRazon(e.target.value)} placeholder="Transportes del Pacífico SA de CV" />
      </Field>
      <Field label="RFC" hint="Se usa para no dar de alta dos veces al mismo.">
        <Input value={rfc} onChange={e => setRfc(e.target.value.toUpperCase())} placeholder="TPA010101AB1" />
      </Field>
      <Field label="Contacto">
        <Input value={contacto} onChange={e => setContacto(e.target.value)} placeholder="Nombre de quien contesta el teléfono" />
      </Field>
      <Field label="Teléfono">
        <Input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="55 1234 5678" />
      </Field>
      <Field label="Correo">
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="operaciones@transportes.mx" />
      </Field>
    </Modal>
  )
}

// ── Expediente y verificacion ─────────────────────────────────

function Expediente({ carrier, tipos, onClose, onCambio, toast }: {
  carrier: Carrier; tipos: TipoDocumento[]
  onClose: () => void; onCambio: () => void; toast: Props['toast']
}) {
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([])
  const [conductores, setConductores] = useState<Driver[]>([])
  const [docs, setDocs] = useState<Documento[]>([])
  const [faltantes, setFaltantes] = useState<Faltante[]>([])
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [vista, setVista] = useState<'expediente' | 'unidad' | 'conductor'>('expediente')

  const [placas, setPlacas] = useState('')
  const [tipoUnidad, setTipoUnidad] = useState('')
  const [nombre, setNombre] = useState('')
  const [licencia, setLicencia] = useState('')

  const recargar = useCallback(async () => {
    const [v, d] = await Promise.all([getVehiculos(carrier.id), getConductores(carrier.id)])
    const [ex, fa] = await Promise.all([getExpediente(carrier.id, v, d), getFaltantes(carrier.id)])
    setVehiculos(v); setConductores(d); setDocs(ex); setFaltantes(fa)
    setCargando(false)
  }, [carrier.id])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [v, d] = await Promise.all([getVehiculos(carrier.id), getConductores(carrier.id)])
        const [ex, fa] = await Promise.all([getExpediente(carrier.id, v, d), getFaltantes(carrier.id)])
        if (!vivo) return
        setVehiculos(v); setConductores(d); setDocs(ex); setFaltantes(fa)
      } catch (e) {
        if (vivo) toast({ type: 'error', title: 'No se pudo cargar el expediente', msg: e instanceof Error ? e.message : '' })
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => { vivo = false }
    // toast se excluye a proposito: no debe re-disparar la carga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrier.id])

  const correr = async (fn: () => Promise<unknown>, ok: string) => {
    setOcupado(true)
    try {
      await fn()
      toast({ type: 'success', title: ok })
      await recargar()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo', msg: e instanceof Error ? e.message : '' })
    } finally { setOcupado(false) }
  }

  const [invitacion, setInvitacion] = useState<string | null>(null)

  // El acceso del transportista se entrega por codigo, no buscando su correo
  // en la tabla de usuarios. Un RPC que busca cuentas por email convierte la
  // lista de usuarios en un directorio consultable.
  const invitar = async () => {
    setOcupado(true)
    try {
      setInvitacion(await invitarTransportista(carrier.id))
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo generar el código', msg: e instanceof Error ? e.message : '' })
    } finally { setOcupado(false) }
  }

  const verificar = async () => {
    setOcupado(true)
    try {
      await verificarTransportista(carrier.id)
      toast({ type: 'success', title: 'Transportista verificado', msg: 'Ya se le puede asignar carga' })
      onCambio()
    } catch (e) {
      // El servidor dice exactamente que papel falta. Se muestra tal cual.
      toast({ type: 'error', title: 'Todavía no se puede verificar', msg: e instanceof Error ? e.message : '' })
      await recargar()
    } finally { setOcupado(false) }
  }

  const suspender = async () => {
    const motivo = window.prompt('¿Por qué se suspende? Queda escrito en sus notas con fecha.')
    if (!motivo?.trim()) return
    setOcupado(true)
    try {
      await suspenderTransportista(carrier.id, motivo)
      toast({ type: 'success', title: 'Transportista suspendido' })
      onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo suspender', msg: e instanceof Error ? e.message : '' })
    } finally { setOcupado(false) }
  }

  const pie = vista === 'unidad' ? (
    <>
      <Button variant="ghost" onClick={() => setVista('expediente')}>Cancelar</Button>
      <Button loading={ocupado} disabled={!placas.trim()}
        onClick={() => correr(() => altaUnidad(carrier.id, placas, tipoUnidad), 'Unidad dada de alta')
          .then(() => { setPlacas(''); setTipoUnidad(''); setVista('expediente') })}>
        Agregar unidad
      </Button>
    </>
  ) : vista === 'conductor' ? (
    <>
      <Button variant="ghost" onClick={() => setVista('expediente')}>Cancelar</Button>
      <Button loading={ocupado} disabled={!nombre.trim()}
        onClick={() => correr(() => altaConductor(carrier.id, nombre, licencia), 'Operador dado de alta')
          .then(() => { setNombre(''); setLicencia(''); setVista('expediente') })}>
        Agregar operador
      </Button>
    </>
  ) : (
    <>
      {carrier.estatus !== 'suspendido' && (
        <Button variant="ghost" onClick={suspender} loading={ocupado}>Suspender</Button>
      )}
      <Button variant="secondary" icon="truck" onClick={() => setVista('unidad')}>Unidad</Button>
      <Button variant="secondary" icon="user" onClick={() => setVista('conductor')}>Operador</Button>
      {!carrier.user_id && (
        <Button variant="secondary" icon="share" onClick={invitar} loading={ocupado}>Invitar</Button>
      )}
      <Button icon="checkCircle" onClick={verificar} loading={ocupado}
        disabled={carrier.estatus === 'verificado' && faltantes.length === 0}>
        Verificar
      </Button>
    </>
  )

  const tiposDe = (ambito: 'carrier' | 'vehicle' | 'driver') => tipos.filter(t => t.aplica_a === ambito)

  return (
    <Modal open onClose={onClose} width={680} title={carrier.razon_social} footer={pie}>
      {vista === 'unidad' && (
        <>
          <Field label="Placas" required>
            <Input value={placas} onChange={e => setPlacas(e.target.value.toUpperCase())} placeholder="AB-123-CD" />
          </Field>
          <Field label="Tipo de unidad" hint="Tracto, caja seca, plataforma, tolva…">
            <Input value={tipoUnidad} onChange={e => setTipoUnidad(e.target.value)} placeholder="Tracto" />
          </Field>
        </>
      )}

      {vista === 'conductor' && (
        <>
          <Field label="Nombre" required>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan Pérez" />
          </Field>
          <Field label="Licencia federal">
            <Input value={licencia} onChange={e => setLicencia(e.target.value.toUpperCase())} placeholder="LF998877" />
          </Field>
        </>
      )}

      {vista === 'expediente' && (cargando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={24} /></div>
      ) : (
        <>
          <KVRow label="Estatus" value={ESTATUS_CARRIER[carrier.estatus]} strong />
          <KVRow label="RFC" value={carrier.rfc || '—'} mono />
          <KVRow label="Contacto" value={carrier.contacto || '—'} />
          <KVRow label="Teléfono" value={carrier.telefono || '—'} />
          {carrier.notas && <KVRow label="Notas" value={carrier.notas} />}

          {invitacion && (
            <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: 'var(--blue-50)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                Código de invitación. Mándaselo por WhatsApp; lo escribe una sola vez
                al entrar y su cuenta queda ligada a esta empresa. Vence en 7 días.
              </div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 750, letterSpacing: 4, color: 'var(--text-strong)' }}>
                {invitacion}
              </div>
            </div>
          )}

          {carrier.user_id && (
            <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: 'var(--green-50)', fontSize: 13 }}>
              Este transportista ya tiene cuenta y ve sus viajes asignados.
            </div>
          )}

          <div style={{
            marginTop: 18, padding: 12, borderRadius: 10,
            background: faltantes.length ? 'var(--orange-50)' : 'var(--green-50)',
          }}>
            <div style={{ display: 'flex', gap: 8, fontSize: 13.5 }}>
              <Icon name={faltantes.length ? 'alertCircle' : 'checkCircle'} size={17} />
              <div>
                {faltantes.length === 0
                  ? <strong>Expediente completo. Se puede verificar.</strong>
                  : <>
                      <strong>Faltan {faltantes.length} documento{faltantes.length > 1 ? 's' : ''}:</strong>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                        {faltantes.map((f, i) => (
                          <li key={i}>{f.nombre} — {f.entidad} <span style={{ color: 'var(--text-faint)' }}>({f.motivo})</span></li>
                        ))}
                      </ul>
                    </>}
              </div>
            </div>
          </div>

          <Seccion titulo="Documentos del transportista" tipos={tiposDe('carrier')} docs={docs}
            dueno={{ carrier: carrier.id }} match={d => d.carrier_id === carrier.id}
            onCambio={recargar} toast={toast} />

          {vehiculos.length === 0
            ? <Vacio texto="Sin unidades. Un transportista verificado necesita al menos una." />
            : vehiculos.map(v => (
                <Seccion key={v.id} titulo={`Unidad ${v.placas}${v.tipo ? ` · ${v.tipo}` : ''}`}
                  tipos={tiposDe('vehicle')} docs={docs} dueno={{ vehiculo: v.id }}
                  match={d => d.vehicle_id === v.id} onCambio={recargar} toast={toast} />
              ))}

          {conductores.length === 0
            ? <Vacio texto="Sin operadores. Un transportista verificado necesita al menos uno." />
            : conductores.map(c => (
                <Seccion key={c.id} titulo={`Operador ${c.nombre}`}
                  tipos={tiposDe('driver')} docs={docs} dueno={{ conductor: c.id }}
                  match={d => d.driver_id === c.id} onCambio={recargar} toast={toast} />
              ))}
        </>
      ))}
    </Modal>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div style={{ marginTop: 16, padding: 12, fontSize: 13, color: 'var(--text-faint)', textAlign: 'center' }}>
      {texto}
    </div>
  )
}

// ── Una seccion del expediente: transportista, unidad u operador ──

function Seccion({ titulo, tipos, docs, dueno, match, onCambio, toast }: {
  titulo: string
  tipos: TipoDocumento[]
  docs: Documento[]
  dueno: { carrier?: string; vehiculo?: string; conductor?: string }
  match: (d: Documento) => boolean
  onCambio: () => Promise<void>
  toast: Props['toast']
}) {
  const [subiendo, setSubiendo] = useState('')
  const mios = docs.filter(match)

  const subir = async (tipo: TipoDocumento, file: File) => {
    let vence: string | undefined
    if (tipo.vence) {
      const v = window.prompt(`¿Hasta cuándo es vigente? (AAAA-MM-DD)\n\n${tipo.nombre}`)
      if (!v) return
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        toast({ type: 'warning', title: 'Fecha inválida', msg: 'Usa el formato AAAA-MM-DD' })
        return
      }
      vence = v
    }
    setSubiendo(tipo.clave)
    try {
      await subirDocumento(file, tipo.clave, dueno, vence)
      toast({ type: 'success', title: 'Documento cargado', msg: 'Queda pendiente de revisión' })
      await onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo subir', msg: e instanceof Error ? e.message : '' })
    } finally { setSubiendo('') }
  }

  const revisar = async (d: Documento, aprobado: boolean) => {
    let motivo: string | undefined
    if (!aprobado) {
      const m = window.prompt('¿Por qué se rechaza? El transportista necesita saber qué corregir.')
      if (!m?.trim()) return
      motivo = m
    }
    try {
      await revisarDocumento(d.id, aprobado, motivo)
      toast({ type: 'success', title: aprobado ? 'Documento aprobado' : 'Documento rechazado' })
      await onCambio()
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo revisar', msg: e instanceof Error ? e.message : '' })
    }
  }

  const abrir = async (d: Documento) => {
    if (!d.storage_path) return
    try {
      window.open(await verDocumento(d.storage_path), '_blank', 'noopener')
    } catch (e) {
      toast({ type: 'error', title: 'No se pudo abrir', msg: e instanceof Error ? e.message : '' })
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>{titulo}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tipos.map(t => {
          const d = mios.find(x => x.tipo === t.clave)
          const mal = d ? (d.estatus === 'rechazado' || vencido(d)) : false
          return (
            <div key={t.clave} style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              padding: '8px 10px', borderRadius: 8,
              border: '1px solid var(--border-soft)',
              background: mal ? 'var(--red-50)' : 'transparent',
            }}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: 'var(--text-strong)' }}>
                  {t.nombre}{t.requerido && <span style={{ color: 'var(--red-500)' }}> *</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  {!d ? 'Sin cargar'
                    : vencido(d) ? `Venció el ${fecha(d.vence_el)}`
                    : d.estatus === 'rechazado' ? `Rechazado: ${d.motivo_rechazo}`
                    : d.estatus === 'aprobado' ? `Aprobado${d.vence_el ? ` · vigente hasta ${fecha(d.vence_el)}` : ''}`
                    : 'Cargado, pendiente de revisión'}
                  {t.nota ? ` · ${t.nota}` : ''}
                </div>
              </div>

              {d && (
                <Button size="sm" variant="ghost" icon="eye" onClick={() => abrir(d)}>Ver</Button>
              )}

              {d && d.estatus === 'pendiente' && (
                <>
                  <Button size="sm" variant="success" onClick={() => revisar(d, true)}>Aprobar</Button>
                  <Button size="sm" variant="danger" onClick={() => revisar(d, false)}>Rechazar</Button>
                </>
              )}

              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                {subiendo === t.clave ? 'Subiendo…' : d ? 'Reemplazar' : 'Cargar'}
                <input type="file" style={{ display: 'none' }}
                  accept=".pdf,.jpg,.jpeg,.png,.xml"
                  onChange={e => { const f = e.target.files?.[0]; if (f) subir(t, f); e.target.value = '' }} />
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

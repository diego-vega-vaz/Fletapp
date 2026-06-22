import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { StatusBadge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Toggle } from '../components/ui/Input'
import { MexicoMap } from '../components/shared/MexicoMap'
import { Spinner } from '../components/ui/Misc'
import { getShipment, type DbShipment } from '../lib/db'
import { fmtUSD } from '../data/mockData'
import type { Route, NavParams } from '../types'

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  params: NavParams | null
  toast: (t: { type: string; title: string; msg?: string }) => void
}

type TLState = 'done' | 'active' | 'future'

function buildTimeline(s: DbShipment): { state: TLState; title: string; time: string; place: string; detail: string; icon: string }[] {
  const delivered = s.status === 'delivered' || s.status === 'paid'
  const inTransit = s.status === 'transit' || s.status === 'delayed'
  const created = new Date(s.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return [
    {
      state: 'done',
      title: 'Cotización confirmada',
      time: created,
      place: s.origin,
      detail: `Envío ${s.ref_id} registrado`,
      icon: 'checkCircle',
    },
    {
      state: (s.progress > 0 || inTransit || delivered) ? 'done' : 'future',
      title: 'Carga recolectada',
      time: s.depart_at || '—',
      place: `${s.origin} (${s.origin_code ?? ''})`,
      detail: `${s.containers ?? '—'} · ${s.cargo ?? 'Mercancía'}`,
      icon: 'package',
    },
    {
      state: delivered ? 'done' : inTransit ? 'active' : 'future',
      title: 'En tránsito',
      time: inTransit ? `${Math.round(s.progress * 100)}% completado` : delivered ? 'Completado' : 'Pendiente',
      place: s.current_location || '—',
      detail: inTransit ? `ETA: ${s.eta ?? '—'}` : '',
      icon: 'truck',
    },
    {
      state: delivered ? 'done' : (s.status === 'waiting') ? 'active' : 'future',
      title: delivered ? 'Entregado' : 'Entrega en destino',
      time: delivered ? (s.eta || '—') : s.status === 'waiting' ? 'Esperando pago' : '—',
      place: `${s.dest} (${s.dest_code ?? ''})`,
      detail: delivered ? 'Carga entregada al destinatario' : '',
      icon: 'mapPin',
    },
  ]
}

export function RastreoPage({ navigate, params, toast }: Props) {
  const [shipment, setShipment] = useState<DbShipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [chatMsgs, setChatMsgs] = useState([
    { from: 'agent', text: '¡Hola! Soy el asistente de FletApp. ¿En qué puedo ayudarte con tu envío?' },
  ])
  const [notifs, setNotifs] = useState({ near: true, arrived: true, changes: true })

  useEffect(() => {
    const id = params?.id
    if (!id) { setLoading(false); return }
    getShipment(id).then(setShipment).finally(() => setLoading(false))
  }, [params?.id])

  const sendMsg = () => {
    if (!msg.trim()) return
    const userMsg = msg
    setChatMsgs(ms => [...ms, { from: 'me', text: userMsg }])
    setMsg('')
    setTimeout(() => {
      setChatMsgs(ms => [...ms, { from: 'agent', text: 'Entendido. Estoy revisando la información de tu envío. Dame un momento.' }])
    }, 1200)
  }

  if (loading) {
    return <div style={{ padding: '80px 24px', textAlign: 'center' }}><Spinner size={32} /></div>
  }

  if (!shipment) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <Icon name="mapPin" size={32} style={{ color: 'var(--border)', marginBottom: 12 }} />
        <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Envío no encontrado</p>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 16 }}>No se pudo cargar el rastreo del envío.</p>
        <Button variant="secondary" onClick={() => navigate('envios')}>Volver a Envíos</Button>
      </div>
    )
  }

  const timeline = buildTimeline(shipment)
  const remaining = shipment.price - shipment.paid
  const route = [
    { x: 30, y: 36, city: shipment.origin_code || shipment.origin.split(',')[0], type: 'origin' as const },
    { x: 48, y: 46, city: '' },
    { x: 68, y: 30, city: shipment.dest_code || shipment.dest.split(',')[0], type: 'dest' as const },
  ]
  const carrier = shipment.carrier || 'Por asignar'
  const driver = shipment.driver || 'Por asignar'
  const plate = shipment.plate && shipment.plate !== '—' ? shipment.plate : 'Por asignar'

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <button onClick={() => navigate('envios')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13.5, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <Icon name="arrowLeft" size={16} />Envíos
            </button>
            <Icon name="chevronRight" size={14} style={{ color: 'var(--text-faint)' }} />
            <span style={{ fontSize: 13.5, color: 'var(--text-faint)' }}>Rastreo</span>
          </div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Rastreo <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}>{shipment.ref_id}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <StatusBadge status={shipment.status} />
            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>ETA: {shipment.eta || '—'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon="phone" onClick={() => toast({ type: 'info', title: `Conductor: ${driver}`, msg: carrier })}>Llamar</Button>
          <Button variant="primary" icon="chat" onClick={() => setChatOpen(true)}>Chat</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="track-cols">
        {/* Left: Map + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <MexicoMap route={route} progress={shipment.progress} height={340} />

          {/* Info card */}
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Información del envío</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Origen', `${shipment.origin} (${shipment.origin_code ?? ''})`],
                ['Destino', `${shipment.dest} (${shipment.dest_code ?? ''})`],
                ['Distancia', shipment.distance || '—'],
                ['Tiempo total', shipment.duration || '—'],
                ['ETA', shipment.eta || '—'],
                ['Progreso', `${Math.round(shipment.progress * 100)}%`],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: '14px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="truck" size={20} style={{ color: 'var(--primary)' }} />
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)' }}>{carrier}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Placa {plate} · {driver}</div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <div className="section-title" style={{ marginBottom: 16 }}>Historial de tránsito</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {timeline.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: i < timeline.length - 1 ? 20 : 0 }}>
                  {i < timeline.length - 1 && (
                    <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, background: ev.state === 'future' ? 'var(--border-soft)' : ev.state === 'active' ? 'var(--primary)' : 'var(--green-500)', opacity: ev.state === 'future' ? 0.5 : 1 }} />
                  )}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ev.state === 'done' ? 'var(--green-500)' : ev.state === 'active' ? 'var(--primary)' : 'var(--gray-100)',
                    color: ev.state === 'future' ? 'var(--text-faint)' : '#fff',
                    border: ev.state === 'active' ? '2px solid var(--primary)' : ev.state === 'future' ? '2px solid var(--border)' : 'none',
                    boxShadow: ev.state === 'active' ? '0 0 0 4px var(--blue-50)' : 'none',
                  }}>
                    <Icon name={ev.state === 'done' ? 'check' : ev.icon} size={15} />
                  </div>
                  <div style={{ paddingTop: 4, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)' }}>{ev.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>{ev.time}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{ev.place}</div>
                    {ev.detail && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{ev.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Payment + Cargo + Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Carga</div>
            {[['Contenedores', shipment.containers || '—'], ['Peso', shipment.weight || '—'], ['Mercancía', shipment.cargo || '—'], ['Referencia', shipment.ref_id]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13.5 }}>
                <span style={{ color: 'var(--text-faint)' }}>{l}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{v}</span>
              </div>
            ))}
          </Card>

          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Estado de pago</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Total del envío</span>
              <span className="mono tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{fmtUSD(shipment.price)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Pagado</span>
              <span className="mono tnum" style={{ fontWeight: 600, color: 'var(--green-600)' }}>{fmtUSD(shipment.paid)}</span>
            </div>
            <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 999 }}>
              <div style={{ height: 6, background: 'var(--green-500)', borderRadius: 999, width: `${shipment.price > 0 ? (shipment.paid / shipment.price) * 100 : 0}%` }} />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 6 }}>
              Restante: {fmtUSD(remaining)}
            </div>
            {(shipment.status === 'waiting' || remaining > 0) && (
              <Button variant="success" icon="dollar" block style={{ marginTop: 14 }} onClick={() => navigate('pago', { id: shipment.ref_id })}>
                Pagar ahora
              </Button>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Icon name="bell" size={18} style={{ color: 'var(--primary)' }} />
              <div className="section-title">Notificaciones</div>
            </div>
            {[
              { key: 'near' as const, label: 'Camión está cerca (30 min antes)' },
              { key: 'arrived' as const, label: 'Llega a destino' },
              { key: 'changes' as const, label: 'Cambios en la entrega' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: 14, color: 'var(--text)' }}>{label}</span>
                <Toggle on={notifs[key]} onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
              </div>
            ))}
          </Card>

          <Button variant="secondary" icon="fileText" block onClick={() => navigate('detalle', { id: shipment.ref_id })}>Ver detalles completos</Button>
        </div>
      </div>

      {/* Chat modal */}
      <Modal open={chatOpen} onClose={() => setChatOpen(false)} title="Chat con soporte" width={460}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block' }} />
          Soporte FletApp · Respuesta típica &lt; 2 min
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: m.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.from === 'me' ? 'var(--primary)' : 'var(--gray-100)',
                color: m.from === 'me' ? '#fff' : 'var(--text)',
                fontSize: 14, lineHeight: 1.5,
              }}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" style={{ flex: 1 }} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Escribe un mensaje…" onKeyDown={e => e.key === 'Enter' && sendMsg()} />
          <Button variant="primary" icon="send" onClick={sendMsg} />
        </div>
      </Modal>
    </div>
  )
}

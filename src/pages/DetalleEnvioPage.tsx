import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { StatusBadge } from '../components/ui/Badge'
import { StaticRouteMap } from '../components/shared/MexicoMap'
import { DocumentsManager } from '../components/shared/DocumentsManager'
import { Spinner } from '../components/ui/Misc'
import { getShipment, type DbShipment } from '../lib/db'
import { fmtUSD } from '../data/mockData'
import type { Route, NavParams } from '../types'

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  params: NavParams | null
  toast: (t: { type: string; title: string; msg?: string }) => void
}

export function DetalleEnvioPage({ navigate, params, toast }: Props) {
  const [shipment, setShipment] = useState<DbShipment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params?.id
    if (!id) { setLoading(false); return }
    getShipment(id).then(setShipment).finally(() => setLoading(false))
  }, [params?.id])

  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}><Spinner size={32} /></div>
    )
  }

  if (!shipment) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <Icon name="package" size={32} style={{ color: 'var(--border)', marginBottom: 12 }} />
        <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Envío no encontrado</p>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 16 }}>No se pudo cargar la información del envío.</p>
        <Button variant="secondary" onClick={() => navigate('envios')}>Volver a Envíos</Button>
      </div>
    )
  }

  const remaining = shipment.price - shipment.paid
  const carrier = shipment.carrier || 'Por asignar'
  const driver = shipment.driver || 'Por asignar'
  const plate = shipment.plate && shipment.plate !== '—' ? shipment.plate : 'Por asignar'

  return (
    <div>
      {/* Breadcrumb */}
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <button onClick={() => navigate('envios')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13.5, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <Icon name="arrowLeft" size={16} />Envíos
          </button>
          <Icon name="chevronRight" size={14} style={{ color: 'var(--text-faint)' }} />
          <span className="mono" style={{ fontSize: 13.5, color: 'var(--text-faint)' }}>{shipment.ref_id}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ fontSize: 22, color: 'var(--primary)', fontWeight: 700 }}>{shipment.ref_id}</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <StatusBadge status={shipment.status} />
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{shipment.origin} → {shipment.dest}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {shipment.status === 'transit' && (
              <Button variant="secondary" icon="mapPin" onClick={() => navigate('rastreo', { id: shipment.ref_id })}>Rastrear</Button>
            )}
            {(shipment.status === 'waiting' || remaining > 0) && (
              <Button variant="success" icon="dollar" onClick={() => navigate('pago', { id: shipment.ref_id })}>Pagar ahora</Button>
            )}
            <Button variant="secondary" icon="download" onClick={() => toast({ type: 'success', title: 'Descargando documentos', msg: 'ZIP con todos los documentos del envío' })}>
              Descargar todo
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="track-cols">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Map */}
          <StaticRouteMap origin={`${shipment.origin} (${shipment.origin_code ?? ''})`} dest={`${shipment.dest} (${shipment.dest_code ?? ''})`} />

          {/* Shipment details */}
          <Card>
            <div className="section-title" style={{ marginBottom: 16 }}>Información general</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['Origen', `${shipment.origin} (${shipment.origin_code ?? ''})`],
                ['Destino', `${shipment.dest} (${shipment.dest_code ?? ''})`],
                ['Salida', shipment.depart_at || '—'],
                ['Llegada / ETA', shipment.eta || '—'],
                ['Distancia', shipment.distance || '—'],
                ['Duración', shipment.duration || '—'],
                ['Contenedores', shipment.containers || '—'],
                ['Peso total', shipment.weight || '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="truck" size={20} style={{ color: 'var(--primary)' }} />
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)' }}>{carrier}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Placa {plate} · Conductor: {driver}</div>
              </div>
            </div>
          </Card>

          {/* Documents — subida real a Supabase Storage */}
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Documentos</div>
            <DocumentsManager shipmentRef={shipment.ref_id} toast={toast} />
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Cargo */}
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Carga</div>
            {[
              ['Mercancía', shipment.cargo || '—'],
              ['Contenedores', shipment.containers || '—'],
              ['Peso bruto', shipment.weight || '—'],
              ['Referencia', shipment.ref_id],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13.5 }}>
                <span style={{ color: 'var(--text-faint)' }}>{l}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-strong)', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </Card>

          {/* Cost breakdown */}
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Desglose de costo</div>
            {[
              ['Flete base', fmtUSD(shipment.price * 0.72)],
              ['Combustible (10%)', fmtUSD(shipment.price * 0.10)],
              ['Seguro de carga (5%)', fmtUSD(shipment.price * 0.05)],
              ['Casetas', fmtUSD(shipment.price * 0.08)],
              ['Otros', fmtUSD(shipment.price * 0.05)],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13.5 }}>
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                <span className="mono tnum" style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: 16, fontWeight: 750, color: 'var(--text-strong)' }}>
              <span>Total</span>
              <span className="mono tnum">{fmtUSD(shipment.price)}</span>
            </div>
          </Card>

          {/* Payment status */}
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Estado de pago</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Pagado</span>
              <span className="mono tnum" style={{ fontWeight: 600, color: 'var(--green-600)' }}>{fmtUSD(shipment.paid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Restante</span>
              <span className="mono tnum" style={{ fontWeight: 600, color: remaining > 0 ? 'var(--orange-600)' : 'var(--text-muted)' }}>{fmtUSD(remaining)}</span>
            </div>
            <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 999 }}>
              <div style={{ height: 6, background: 'var(--green-500)', borderRadius: 999, width: `${shipment.price > 0 ? (shipment.paid / shipment.price) * 100 : 0}%`, transition: 'width 0.5s' }} />
            </div>
            {(shipment.status === 'waiting' || remaining > 0) && (
              <Button variant="success" icon="dollar" block style={{ marginTop: 14 }} onClick={() => navigate('pago', { id: shipment.ref_id })}>
                Pagar saldo restante
              </Button>
            )}
          </Card>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="secondary" icon="chat" block onClick={() => navigate('soporte')}>Contactar soporte</Button>
            <Button variant="ghost" icon="alertCircle" block onClick={() => toast({ type: 'info', title: 'Disputa iniciada', msg: 'Un agente revisará tu caso en < 2 horas' })}>Abrir disputa</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

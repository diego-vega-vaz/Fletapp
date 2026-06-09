import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Checkbox } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Misc'
import { getShipment, getInvoiceByRef, getShipmentById, recordPayment, type DbShipment } from '../lib/db'
import { fmtUSD } from '../data/mockData'
import type { Route, NavParams } from '../types'

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  params: NavParams | null
  toast: (t: { type: string; title: string; msg?: string }) => void
}

export function PagosPage({ navigate, params, toast }: Props) {
  const [shipment, setShipment] = useState<DbShipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [method, setMethod] = useState<'card' | 'transfer' | 'credit'>('card')
  const [terms, setTerms] = useState(false)
  const [saveCard, setSaveCard] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txRef, setTxRef] = useState('')

  useEffect(() => {
    const id = params?.id
    if (!id) { setLoading(false); return }

    async function load() {
      let s = await getShipment(id!)
      if (!s) {
        const inv = await getInvoiceByRef(id!)
        if (inv?.shipment_id) s = await getShipmentById(inv.shipment_id)
      }
      setShipment(s)
      setLoading(false)
    }
    load()
  }, [params?.id])

  const remaining = shipment ? shipment.price - shipment.paid : 0
  const iva = Math.round(remaining * 0.16)
  const total = remaining + iva

  const confirm = async () => {
    if (!terms) { toast({ type: 'warning', title: 'Acepta los términos para continuar' }); return }
    if (!shipment) return
    setProcessing(true)
    try {
      const methodLabel = method === 'card' ? 'Visa ••••4242' : method === 'transfer' ? 'SPEI' : 'Crédito FletApp'
      await recordPayment(shipment.id, remaining, methodLabel)
      const ref = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 90000 + 10000)}`
      setTxRef(ref)
      setSuccess(true)
    } catch {
      toast({ type: 'error', title: 'Error al procesar pago', msg: 'Intenta de nuevo o contacta a soporte' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <Spinner size={32} />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <Icon name="alertCircle" size={32} style={{ color: 'var(--red-500)', marginBottom: 12 }} />
        <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Envío no encontrado</p>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 16 }}>No se pudo cargar la información del pago.</p>
        <Button variant="secondary" onClick={() => navigate('pagos')}>Ver facturas</Button>
      </div>
    )
  }

  const methodLabel = method === 'card' ? 'Visa ••••4242' : method === 'transfer' ? 'SPEI Banamex' : 'Crédito FletApp'

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <button onClick={() => navigate('pagos')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13.5, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <Icon name="arrowLeft" size={16} />Pagos
          </button>
          <Icon name="chevronRight" size={14} style={{ color: 'var(--text-faint)' }} />
          <span style={{ fontSize: 13.5, color: 'var(--text-faint)' }}>Confirmar pago</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--orange-50)', borderRadius: 10, border: '1px solid var(--orange-400)', marginBottom: 20 }}>
          <Icon name="alertCircle" size={20} style={{ color: 'var(--orange-600)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--orange-600)', fontSize: 14 }}>Envío llegado — Esperando pago final</div>
            <div style={{ fontSize: 13, color: 'var(--orange-600)', marginTop: 2 }}>El pago debe realizarse para liberar la carga</div>
          </div>
        </div>

        <h1 className="page-title">Confirmar Pago</h1>
      </div>

      <Card style={{ marginBottom: 18 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>Resumen del envío</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="mono" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{shipment.ref_id}</div>
            <div style={{ fontSize: 14, color: 'var(--text-strong)', marginTop: 4 }}>{shipment.origin} → {shipment.dest}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>{shipment.containers ?? '—'} · ETA: {shipment.eta_short ?? '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Total del envío</div>
            <div className="mono tnum" style={{ fontSize: 20, fontWeight: 750, color: 'var(--text-strong)' }}>{fmtUSD(shipment.price)}</div>
            <div style={{ fontSize: 12.5, color: 'var(--green-600)', marginTop: 2 }}>Pagado: {fmtUSD(shipment.paid)}</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 18 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>Desglose de pago</div>
        {[['Subtotal (saldo restante)', remaining], ['IVA (16%)', iva]].map(([l, v]) => (
          <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 14 }}>
            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
            <span className="mono tnum" style={{ fontWeight: 600 }}>{fmtUSD(v as number)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 17, fontWeight: 750, color: 'var(--text-strong)' }}>
          <span>TOTAL A PAGAR AHORA</span>
          <span className="mono tnum" style={{ color: 'var(--primary)' }}>{fmtUSD(total)}</span>
        </div>
      </Card>

      <Card style={{ marginBottom: 18 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>Método de pago</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'card' as const, label: 'Tarjeta de Crédito/Débito', icon: 'card', sub: 'Visa ••••4242' },
            { id: 'transfer' as const, label: 'Transferencia Bancaria', icon: 'building', sub: 'CLABE: 002154007000000 · Banamex' },
            { id: 'credit' as const, label: 'Crédito FletApp', icon: 'zap', sub: 'Disponible: $5,000 USD' },
          ].map(m => (
            <div
              key={m.id}
              onClick={() => setMethod(m.id)}
              style={{
                padding: 14, borderRadius: 10, border: `2px solid ${method === m.id ? 'var(--primary)' : 'var(--border-soft)'}`,
                background: method === m.id ? 'var(--blue-50)' : '#fff',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${method === m.id ? 'var(--primary)' : 'var(--gray-300)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {method === m.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />}
              </div>
              <Icon name={m.icon} size={20} style={{ color: method === m.id ? 'var(--primary)' : 'var(--text-faint)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 650, fontSize: 14, color: 'var(--text-strong)' }}>{m.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {method === 'card' && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 52, height: 34, borderRadius: 6, background: 'linear-gradient(135deg,#003399,#0066CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontStyle: 'italic', fontWeight: 800, fontSize: 12 }}>VISA</div>
              <div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>•••• •••• •••• 4242</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Exp 12/28</div>
              </div>
            </div>
            <Checkbox checked={saveCard} onChange={() => setSaveCard(!saveCard)} label="Usar esta tarjeta para pagos futuros" />
          </div>
        )}
      </Card>

      <div style={{ marginBottom: 20 }}>
        <Checkbox checked={terms} onChange={() => setTerms(!terms)} label="Acepto los términos de pago y confirmo que el monto es correcto" />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" onClick={() => navigate('pagos')} style={{ flex: 0 }}>Cancelar</Button>
        <Button variant="success" icon="shield" block loading={processing} onClick={confirm} style={{ flex: 1, fontSize: 15 }}>
          {processing ? 'Procesando…' : `Confirmar pago ${fmtUSD(total)}`}
        </Button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-faint)', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="shield" size={14} />Pagos seguros · Encriptación SSL 256-bit
      </div>

      <Modal open={success} title="">
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="checkCircle" size={32} style={{ color: 'var(--green-500)' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 750, color: 'var(--text-strong)', marginBottom: 6 }}>¡Pago confirmado!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Tu envío ha sido marcado como entregado.</p>
          {[['Transacción', txRef], ['Monto', fmtUSD(total)], ['Método', methodLabel], ['Envío', shipment.ref_id]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 14 }}>
              <span style={{ color: 'var(--text-faint)' }}>{l}</span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" icon="download" block onClick={() => toast({ type: 'success', title: 'Recibo descargado' })}>Descargar recibo</Button>
            <Button variant="primary" block onClick={() => navigate('dashboard')}>Ir al dashboard</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

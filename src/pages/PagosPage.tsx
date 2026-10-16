import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Spinner } from '../components/ui/Misc'
import { getShipment, getInvoiceByRef, getShipmentById, type DbShipment } from '../lib/db'
import { fmtMXN } from '../data/mockData'
import type { Route, NavParams } from '../types'

/**
 * Pantalla de pago.
 *
 * 16 oct 2026: esta pantalla simulaba un cobro completo y no cobraba nada.
 * Tenia una tarjeta Visa terminacion 4242 guardada, una CLABE de Banamex, una
 * linea de credito de $5,000, el sello "Encriptacion SSL 256-bit", y al pulsar
 * Confirmar inventaba un folio TRX-####, abria un modal que decia "Pago
 * confirmado" y ofrecia descargar un recibo que no existia.
 *
 * Nada de eso ocurria: recordPayment() hacia un UPDATE desde el navegador y
 * RLS lo bloquea desde la Fase 0, asi que PostgREST devolvia cero filas SIN
 * error. La funcion no fallaba, y la pantalla anunciaba un pago que nunca
 * paso. Es la misma familia que el CFDI inventado, pero peor: aqui habia una
 * CLABE a la que alguien podia transferir dinero de verdad.
 *
 * Mientras no exista la pasarela, esta pantalla dice la verdad: informa el
 * saldo y manda a coordinar el pago con una persona. No cobra, no promete, y
 * no escribe estado de dinero desde el navegador.
 */
interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  params: NavParams | null
  toast: (t: { type: string; title: string; msg?: string }) => void
}

export function PagosPage({ navigate, params }: Props) {
  const [shipment, setShipment] = useState<DbShipment | null>(null)
  const [loading, setLoading] = useState(Boolean(params?.id))

  // loading arranca segun haya id: antes el efecto hacia setLoading(false)
  // de forma sincrona (react-hooks/set-state-in-effect). Se cancela al desmontar.
  useEffect(() => {
    const id = params?.id
    if (!id) return
    let vivo = true

    async function load() {
      let s = await getShipment(id!)
      if (!s) {
        const inv = await getInvoiceByRef(id!)
        if (inv?.shipment_id) s = await getShipmentById(inv.shipment_id)
      }
      if (!vivo) return
      setShipment(s)
      setLoading(false)
    }
    load()
    return () => { vivo = false }
  }, [params?.id])

  const remaining = shipment ? shipment.price - shipment.paid : 0
  const iva = Math.round(remaining * 0.16)
  const total = remaining + iva

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

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <button onClick={() => navigate('pagos')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13.5, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <Icon name="arrowLeft" size={16} />Pagos
          </button>
          <Icon name="chevronRight" size={14} style={{ color: 'var(--text-faint)' }} />
          <span style={{ fontSize: 13.5, color: 'var(--text-faint)' }}>Saldo del envío</span>
        </div>

        <h1 className="page-title">Saldo del envío</h1>
        <p className="page-sub">Consulta lo que falta por pagar. El cobro se coordina con tu ejecutivo.</p>
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
            <div className="mono tnum" style={{ fontSize: 20, fontWeight: 750, color: 'var(--text-strong)' }}>{fmtMXN(shipment.price)} MXN</div>
            <div style={{ fontSize: 12.5, color: 'var(--green-600)', marginTop: 2 }}>Pagado: {fmtMXN(shipment.paid)}</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 18 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>Desglose</div>
        {[['Subtotal (saldo restante)', remaining], ['IVA (16%)', iva]].map(([l, v]) => (
          <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 14 }}>
            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
            <span className="mono tnum" style={{ fontWeight: 600 }}>{fmtMXN(v as number)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 17, fontWeight: 750, color: 'var(--text-strong)' }}>
          <span>SALDO PENDIENTE</span>
          <span className="mono tnum" style={{ color: 'var(--primary)' }}>{fmtMXN(total)} MXN</span>
        </div>
      </Card>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Icon name="info" size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 14.5, marginBottom: 6 }}>
              El pago en línea todavía no está habilitado
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 10 }}>
              Estamos integrando la pasarela de pago. Mientras tanto, el cobro se coordina
              directamente con tu ejecutivo de cuenta, que te comparte los datos bancarios
              y te confirma por escrito cuando el pago quede aplicado.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.6 }}>
              Esta pantalla no cobra ni guarda métodos de pago. Si alguna vez te pide datos
              de tarjeta, no es FleetWeb.
            </p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" onClick={() => navigate('pagos')} style={{ flex: 0 }}>Volver</Button>
        <Button variant="primary" icon="mail" block onClick={() => navigate('soporte')} style={{ flex: 1, fontSize: 15 }}>
          Coordinar el pago con mi ejecutivo
        </Button>
      </div>
    </div>
  )
}

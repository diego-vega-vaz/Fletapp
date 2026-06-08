import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Tabs } from '../components/ui/Tabs'
import { Tooltip } from '../components/ui/Misc'
import { INVOICES, fmtUSD } from '../data/mockData'
import type { Route, NavParams } from '../types'

interface InvBadgeProps { status: string }
function InvBadge({ status }: InvBadgeProps) {
  const cfg = {
    paid:    { label: 'Pagada',    color: 'var(--green-600)', bg: 'var(--green-50)', icon: 'checkCircle' },
    pending: { label: 'Pendiente', color: 'var(--orange-600)', bg: 'var(--orange-50)', icon: 'clock' },
    overdue: { label: 'Vencida',   color: 'var(--red-500)', bg: 'var(--red-50)', icon: 'alertCircle' },
  }[status] ?? { label: status, color: 'var(--text)', bg: 'var(--gray-100)', icon: 'info' }
  return (
    <span className="badge badge-soft" style={{ '--bg': cfg.bg, '--fg': cfg.color, fontSize: 11.5 } as React.CSSProperties}>
      <Icon name={cfg.icon} size={13} />{cfg.label}
    </span>
  )
}

function BillCard({ icon, color, bg, label, value, sub, cta, onCta }: any) {
  return (
    <Card hover style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ width: 40, height: 40, borderRadius: 11, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} />
      </span>
      <div>
        <div className="tnum" style={{ fontSize: 26, fontWeight: 750, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>
      </div>
      {cta && <Button size="sm" variant="primary" onClick={onCta}>{cta}</Button>}
    </Card>
  )
}

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  toast: (t: { type: string; title: string; msg?: string }) => void
}

export function FacturasPage({ navigate, toast }: Props) {
  const [tab, setTab] = useState('facturas')
  const pending = INVOICES.filter(i => i.status === 'pending').reduce((a, b) => a + b.amount, 0)
  const paidMonth = INVOICES.filter(i => i.status === 'paid').reduce((a, b) => a + b.amount, 0)

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Pagos & Facturas</h1>
          <p className="page-sub">Administra tus facturas CFDI, pagos y métodos de cobro.</p>
        </div>
        <Button variant="secondary" icon="download" onClick={() => toast({ type: 'success', title: 'Exportando facturas', msg: 'Se descargará un ZIP con XML + PDF' })}>
          Descargar todo
        </Button>
      </div>

      <div className="grid-3" style={{ marginBottom: 22 }}>
        <BillCard icon="dollar" color="var(--orange-600)" bg="var(--orange-50)" label="Pendiente por pagar" value={fmtUSD(pending)} sub={`${INVOICES.filter(i => i.status === 'pending').length} facturas`} cta="Pagar ahora" onCta={() => navigate('pago', { id: 'RES-2026-00143' })} />
        <BillCard icon="checkCircle" color="var(--green-600)" bg="var(--green-50)" label="Pagado este mes" value={fmtUSD(paidMonth)} sub="3 facturas liquidadas" />
        <BillCard icon="zap" color="var(--primary)" bg="var(--blue-50)" label="Crédito disponible" value="$5,000" sub="Línea FletApp · al corriente" />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          tabs={[{ id: 'facturas', label: 'Facturas', icon: 'fileText' }, { id: 'pagos', label: 'Historial de pagos', icon: 'card' }, { id: 'metodos', label: 'Métodos de pago', icon: 'building' }]}
          active={tab} onChange={setTab}
        />
      </div>

      {tab === 'facturas' && (
        <Card pad={false}>
          <table className="data-table">
            <thead>
              <tr><th>Factura</th><th>Concepto</th><th>Fecha</th><th>Estado</th><th style={{ textAlign: 'right' }}>Monto</th><th></th></tr>
            </thead>
            <tbody>
              {INVOICES.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13 }}>{inv.id}</span>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 2 }}>CFDI {inv.uuid.slice(0, 18)}…</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13.5, color: 'var(--text-strong)', fontWeight: 550 }}>{inv.concept}</div>
                    <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{inv.shipment}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {inv.date}<div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Vence {inv.due}</div>
                  </td>
                  <td><InvBadge status={inv.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{fmtUSD(inv.amount)}</span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {inv.status === 'pending'
                      ? <Button size="sm" variant="success" onClick={() => navigate('pago', { id: inv.shipment })}>Pagar</Button>
                      : (
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <Tooltip text="Descargar PDF"><IconButton name="download" size={17} sm onClick={() => toast({ type: 'success', title: `${inv.id}.pdf descargado` })} /></Tooltip>
                          <Tooltip text="Descargar XML"><IconButton name="fileText" size={17} sm onClick={() => toast({ type: 'success', title: `${inv.id}.xml descargado` })} /></Tooltip>
                        </div>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'pagos' && (
        <Card pad={false}>
          <table className="data-table">
            <thead>
              <tr><th>Transacción</th><th>Factura</th><th>Método</th><th>Fecha</th><th style={{ textAlign: 'right' }}>Monto</th></tr>
            </thead>
            <tbody>
              {INVOICES.filter(i => i.status === 'paid').map((inv, i) => (
                <tr key={inv.id}>
                  <td><span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13 }}>TRX-2026-{88450 - i}</span></td>
                  <td className="mono" style={{ fontSize: 13, color: 'var(--text)' }}>{inv.id}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{inv.method}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{inv.date}</td>
                  <td style={{ textAlign: 'right' }}><span className="mono tnum" style={{ fontWeight: 700, color: 'var(--green-600)' }}>{fmtUSD(inv.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'metodos' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <Card>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Tarjetas guardadas</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid var(--border)', borderRadius: 12, marginBottom: 12 }}>
              <span style={{ width: 44, height: 30, borderRadius: 6, background: 'linear-gradient(135deg,#003399,#0066CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontStyle: 'italic', fontWeight: 800, fontSize: 11 }}>VISA</span>
              <div style={{ flex: 1 }}>
                <div className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 14 }}>•••• 4242</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Diego Parado · Exp 12/28</div>
              </div>
              <span className="badge badge-soft" style={{ '--bg': 'var(--blue-50)', '--fg': 'var(--primary)', fontSize: 11 } as React.CSSProperties}>Principal</span>
            </div>
            <Button variant="secondary" icon="plus" block>Agregar tarjeta</Button>
          </Card>
          <Card>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Otros métodos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Transferencia SPEI', 'CLABE: 0021540070000001', 'building'], ['Crédito FletApp', 'Disponible: $5,000 USD', 'zap']].map(([l, sub, ic]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border-soft)', borderRadius: 10 }}>
                  <Icon name={ic} size={20} style={{ color: 'var(--text-faint)' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{l}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

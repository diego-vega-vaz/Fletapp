import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Tabs } from '../components/ui/Tabs'
import { Tooltip, Spinner } from '../components/ui/Misc'
import { getInvoices, type DbInvoice } from '../lib/db'
import { exportToCsv } from '../lib/export'
import { fmtUSD } from '../data/mockData'
import type { Route, NavParams } from '../types'

function InvBadge({ status }: { status: string }) {
  const cfg = {
    paid:    { label: 'Pagada',    color: 'var(--green-600)', bg: 'var(--green-50)',   icon: 'checkCircle' },
    pending: { label: 'Pendiente', color: 'var(--orange-600)', bg: 'var(--orange-50)', icon: 'clock' },
    overdue: { label: 'Vencida',   color: 'var(--red-500)',   bg: 'var(--red-50)',     icon: 'alertCircle' },
  }[status] ?? { label: status, color: 'var(--text-muted)', bg: 'var(--gray-100)', icon: 'info' }
  return (
    <span className="badge badge-soft" style={{ '--bg': cfg.bg, '--fg': cfg.color, fontSize: 11.5 } as React.CSSProperties}>
      <Icon name={cfg.icon} size={13} />{cfg.label}
    </span>
  )
}

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  toast: (t: { type: string; title: string; msg?: string }) => void
}

export function FacturasPage({ navigate, toast }: Props) {
  const [tab, setTab] = useState('facturas')
  const [invoices, setInvoices] = useState<DbInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInvoices().then(setInvoices).finally(() => setLoading(false))
  }, [])

  const pending = invoices.filter(i => i.status === 'pending').reduce((a, b) => a + (b.amount ?? 0), 0)
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((a, b) => a + (b.amount ?? 0), 0)
  const pendingCount = invoices.filter(i => i.status === 'pending').length

  function handleExport() {
    exportToCsv('facturas-fleetapp', [
      { header: 'Factura', value: i => i.ref_id },
      { header: 'UUID CFDI', value: i => i.uuid_cfdi },
      { header: 'Concepto', value: i => i.concept },
      { header: 'Monto', value: i => i.amount },
      { header: 'Estado', value: i => i.status },
      { header: 'Método', value: i => i.method },
      { header: 'Emitida', value: i => i.issued_at },
      { header: 'Vence', value: i => i.due_at },
    ], invoices)
    toast({ type: 'success', title: 'Facturas exportadas', msg: `${invoices.length} facturas en CSV (Excel)` })
  }

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Pagos & Facturas</h1>
          <p className="page-sub">Administra tus facturas CFDI, pagos y métodos de cobro.</p>
        </div>
        <Button variant="secondary" icon="download" onClick={handleExport} disabled={loading || invoices.length === 0}>
          Exportar a Excel
        </Button>
      </div>

      <div className="grid-3" style={{ marginBottom: 22 }}>
        {[
          { icon: 'dollar', color: 'var(--orange-600)', bg: 'var(--orange-50)', label: 'Pendiente por pagar', value: fmtUSD(pending), sub: `${pendingCount} factura${pendingCount !== 1 ? 's' : ''}`, cta: pendingCount > 0 ? 'Pagar ahora' : undefined, onCta: () => navigate('pago', { id: 'pendiente' }) },
          { icon: 'checkCircle', color: 'var(--green-600)', bg: 'var(--green-50)', label: 'Total pagado', value: fmtUSD(paidTotal), sub: `${invoices.filter(i => i.status === 'paid').length} facturas liquidadas` },
          { icon: 'fileText', color: 'var(--primary)', bg: 'var(--blue-50)', label: 'Total facturas', value: String(invoices.length), sub: 'Todas las facturas CFDI' },
        ].map(c => (
          <Card key={c.label} hover style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={c.icon} size={20} />
            </span>
            <div>
              <div className="tnum" style={{ fontSize: 26, fontWeight: 750, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{loading ? '—' : c.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{loading ? '…' : c.sub}</div>
            </div>
            {c.cta && <Button size="sm" variant="primary" onClick={c.onCta}>{c.cta}</Button>}
          </Card>
        ))}
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          tabs={[{ id: 'facturas', label: 'Facturas', icon: 'fileText' }, { id: 'pagos', label: 'Historial de pagos', icon: 'card' }, { id: 'metodos', label: 'Métodos de pago', icon: 'building' }]}
          active={tab} onChange={setTab}
        />
      </div>

      {tab === 'facturas' && (
        <Card pad={false}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><Spinner size={28} /></div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Icon name="fileText" size={32} style={{ color: 'var(--border)', marginBottom: 10 }} />
              <p style={{ fontSize: 14, color: 'var(--text-faint)' }}>No tienes facturas aún. Aparecerán cuando aceptes una cotización.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Factura</th><th>Concepto</th><th>Fecha</th><th>Estado</th><th style={{ textAlign: 'right' }}>Monto</th><th></th></tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13 }}>{inv.ref_id}</span>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 2 }}>CFDI {(inv.uuid_cfdi ?? '').slice(0, 18)}…</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13.5, color: 'var(--text-strong)', fontWeight: 550 }}>{inv.concept ?? '—'}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {inv.issued_at ?? '—'}
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Vence {inv.due_at ?? '—'}</div>
                    </td>
                    <td><InvBadge status={inv.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{fmtUSD(inv.amount ?? 0)}</span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {inv.status === 'pending'
                        ? <Button size="sm" variant="success" onClick={() => navigate('pago', { id: inv.ref_id })}>Pagar</Button>
                        : (
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <Tooltip text="Descargar PDF"><IconButton name="download" size={17} sm onClick={() => toast({ type: 'success', title: `${inv.ref_id}.pdf descargado` })} /></Tooltip>
                            <Tooltip text="Descargar XML"><IconButton name="fileText" size={17} sm onClick={() => toast({ type: 'success', title: `${inv.ref_id}.xml descargado` })} /></Tooltip>
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'pagos' && (
        <Card pad={false}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><Spinner size={28} /></div>
          ) : invoices.filter(i => i.status === 'paid').length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Icon name="card" size={32} style={{ color: 'var(--border)', marginBottom: 10 }} />
              <p style={{ fontSize: 14, color: 'var(--text-faint)' }}>No hay pagos registrados aún.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Factura</th><th>Concepto</th><th>Método</th><th>Fecha</th><th style={{ textAlign: 'right' }}>Monto</th></tr>
              </thead>
              <tbody>
                {invoices.filter(i => i.status === 'paid').map(inv => (
                  <tr key={inv.id}>
                    <td className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{inv.ref_id}</td>
                    <td style={{ fontSize: 13, color: 'var(--text)' }}>{inv.concept ?? '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{inv.method ?? '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{inv.issued_at ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}><span className="mono tnum" style={{ fontWeight: 700, color: 'var(--green-600)' }}>{fmtUSD(inv.amount ?? 0)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'metodos' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <Card>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Tarjetas guardadas</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '24px 14px', border: '1px dashed var(--border)', borderRadius: 12, marginBottom: 12, textAlign: 'center' }}>
              <Icon name="card" size={26} style={{ color: 'var(--border)' }} />
              <div style={{ fontSize: 13.5, color: 'var(--text-muted)', fontWeight: 600 }}>No tienes tarjetas guardadas</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Agrega una para pagar tus facturas en línea</div>
            </div>
            <Button variant="secondary" icon="plus" block onClick={() => toast({ type: 'info', title: 'Próximamente', msg: 'Integración con pasarela de pago en desarrollo' })}>Agregar tarjeta</Button>
          </Card>
          <Card>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Otros métodos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Transferencia SPEI', 'CLABE: 002154007000000001', 'building'], ['Crédito FleetApp', 'Contacta a tu ejecutivo para activar', 'zap']].map(([l, sub, ic]) => (
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

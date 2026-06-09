import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { StatusBadge } from '../components/ui/Badge'
import { Segmented } from '../components/ui/Tabs'
import { Spinner } from '../components/ui/Misc'
import { getDashboardStats, type DbShipment } from '../lib/db'
import { fmtUSD } from '../data/mockData'
import type { Route, NavParams, User } from '../types'

function KpiCard({ icon, iconBg, iconColor, label, value, unit }: {
  icon: string; iconBg: string; iconColor: string; label: string; value: string; unit?: string
}) {
  return (
    <Card hover style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={21} />
      </span>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="tnum" style={{ fontSize: 34, fontWeight: 750, color: 'var(--text-strong)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
          {unit && <span style={{ fontSize: 14, color: 'var(--text-faint)', fontWeight: 600 }}>{unit}</span>}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
      </div>
    </Card>
  )
}

function ShipmentRow({ s, navigate, onPay }: { s: DbShipment; navigate: (r: Route, p?: NavParams | null) => void; onPay: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 4px' }}>
      <span style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--gray-50)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
        <Icon name="package" size={22} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13.5 }}>{s.ref_id}</span>
          <StatusBadge status={s.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, fontSize: 13.5 }}>
          <span style={{ fontWeight: 600 }}>{s.origin_code || s.origin}</span>
          <Icon name="arrowRight" size={14} style={{ color: 'var(--text-faint)' }} />
          <span style={{ fontWeight: 600 }}>{s.dest_code || s.dest}</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 3 }}>
          {s.status === 'transit' ? `ETA: ${s.eta ?? '—'}` : s.status === 'delivered' ? `Entregado: ${s.eta ?? '—'}` : `ETA: ${s.eta ?? '—'} · Pendiente de pago`}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="mono tnum" style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 15 }}>{fmtUSD(s.price)}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {s.status === 'waiting'
          ? <Button size="sm" variant="success" icon="dollar" onClick={onPay}>Pagar</Button>
          : s.status === 'transit'
            ? <Button size="sm" variant="secondary" icon="mapPin" onClick={() => navigate('rastreo', { id: s.ref_id })}>Rastrear</Button>
            : <Button size="sm" variant="ghost" iconRight="chevronRight" onClick={() => navigate('detalle', { id: s.ref_id })}>Ver</Button>}
      </div>
    </div>
  )
}

function EmptyState({ icon, text, cta, onClick }: { icon: string; text: string; cta?: string; onClick?: () => void }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <Icon name={icon} size={32} style={{ color: 'var(--border)', marginBottom: 10 }} />
      <div style={{ fontSize: 14, color: 'var(--text-faint)', marginBottom: cta ? 14 : 0 }}>{text}</div>
      {cta && onClick && <Button variant="primary" size="sm" onClick={onClick}>{cta}</Button>}
    </div>
  )
}

function MiniActivityBar({ shipments }: { shipments: DbShipment[] }) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const now = new Date()
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const count = shipments.filter(s => {
      const c = new Date(s.created_at)
      return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear()
    }).length
    return { label: months[d.getMonth()], count }
  })
  const max = Math.max(...buckets.map(b => b.count), 1)
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
      {buckets.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', background: 'var(--primary)', borderRadius: 4, height: Math.max((b.count / max) * 72, b.count > 0 ? 6 : 2), opacity: i === 5 ? 1 : 0.55 }} />
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  user: User
  onPay: (id: string) => void
}

export function DashboardPage({ navigate, user, onPay }: Props) {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getDashboardStats().then(setStats).finally(() => setLoading(false)) }, [])

  const firstName = user.name?.split(' ')[0] || 'bienvenido'
  const dateStr = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Buenos días, {firstName} 👋</h1>
          <p className="page-sub">
            {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} ·{' '}
            {loading ? 'Cargando…' : stats?.active.length === 0
              ? 'No tienes envíos activos.'
              : <><strong style={{ color: 'var(--text)' }}>{stats!.active.length} envío{stats!.active.length > 1 ? 's' : ''} activo{stats!.active.length > 1 ? 's' : ''}</strong>{stats!.pending.length > 0 && <> · <strong style={{ color: 'var(--orange-600)' }}>{stats!.pending.length} pago{stats!.pending.length > 1 ? 's' : ''} pendiente{stats!.pending.length > 1 ? 's' : ''}</strong></>}.</>}
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => navigate('cotizacion')}>Nueva cotización</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>
      ) : (
        <>
          <div className="kpi-grid" style={{ marginBottom: 22 }}>
            <KpiCard icon="fileText" iconBg="var(--blue-50)" iconColor="var(--primary)" value={String(stats?.quotes.length ?? 0)} label="Cotizaciones totales" />
            <KpiCard icon="clock" iconBg="var(--orange-50)" iconColor="var(--orange-600)" value={String(stats?.pending.length ?? 0)} label="Pagos pendientes" />
            <KpiCard icon="dollar" iconBg="var(--green-50)" iconColor="var(--green-600)" value={fmtUSD(stats?.paidAmount ?? 0)} label="Total pagado" />
            <KpiCard icon="truck" iconBg="var(--cyan-50)" iconColor="var(--cyan-500)" value={String(stats?.active.length ?? 0)} label="Envíos en tránsito" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="dash-cols">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Card pad={false}>
                <div className="section-head" style={{ padding: '18px 20px 6px' }}>
                  <div className="section-title">Últimos envíos</div>
                  <Button size="sm" variant="ghost" iconRight="arrowRight" onClick={() => navigate('envios')}>Ver todos</Button>
                </div>
                <div style={{ padding: '0 20px 8px' }}>
                  {stats!.shipments.length === 0
                    ? <EmptyState icon="package" text="Aún no tienes envíos. Crea tu primera cotización." cta="Cotizar ahora" onClick={() => navigate('cotizacion')} />
                    : stats!.shipments.slice(0, 3).map((s, i) => (
                        <div key={s.id}>
                          {i > 0 && <div className="divider" />}
                          <ShipmentRow s={s} navigate={navigate} onPay={() => onPay(s.ref_id)} />
                        </div>
                      ))}
                </div>
              </Card>

              <Card>
                <div className="section-head" style={{ marginBottom: 8 }}>
                  <div>
                    <div className="section-title">Envíos por mes</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      Total <strong className="tnum">{stats!.shipments.length}</strong> envíos registrados
                    </div>
                  </div>
                  <Segmented options={[{ value: '6m', label: '6 meses' }, { value: '12m', label: '12 meses' }]} value="6m" onChange={() => {}} />
                </div>
                {stats!.shipments.length === 0
                  ? <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>El gráfico aparecerá cuando tengas envíos</div>
                  : <MiniActivityBar shipments={stats!.shipments} />}
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Card pad={false}>
                <div style={{ padding: '18px 20px 10px' }}><div className="section-title">Pagos pendientes</div></div>
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats!.pending.length === 0
                    ? <div style={{ padding: '12px 0', textAlign: 'center' }}>
                        <Icon name="checkCircle" size={22} style={{ color: 'var(--green-500)', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>¡Al corriente con todos los pagos!</span>
                      </div>
                    : stats!.pending.slice(0, 3).map(inv => (
                        <div key={inv.id} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 12, border: '1px solid var(--border-soft)', background: 'var(--gray-50)' }}>
                          <span style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', color: 'var(--orange-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--sh-sm)' }}>
                            <Icon name="dollar" size={18} />
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--text-strong)' }}>{inv.concept || 'Pago pendiente'}</div>
                            <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fmtUSD(inv.amount ?? 0)} · Vence {inv.due_at ?? '—'}</div>
                            <Button size="sm" variant="success" style={{ marginTop: 8 }} onClick={() => navigate('pago', { id: inv.ref_id })}>Pagar</Button>
                          </div>
                        </div>
                      ))}
                </div>
              </Card>

              <Card>
                <div className="section-title" style={{ marginBottom: 14 }}>Acciones rápidas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([['plus','Nueva cotización','primary','cotizacion'],['package','Mis envíos','secondary','envios'],['fileText','Mis facturas','secondary','pagos'],['chat','Soporte','ghost','soporte']] as const).map(([icon, label, variant, route]) => (
                    <Button key={label} variant={variant} icon={icon} block onClick={() => navigate(route as Route)}>{label}</Button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

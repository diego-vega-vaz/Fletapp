import { useState, useEffect, useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Tabs'
import { Spinner } from '../components/ui/Misc'
import { BarChart, DonutChart, RankBars } from '../components/ui/Charts'
import { getShipments, getInvoices, getQuotes, type DbShipment, type DbInvoice, type DbQuote } from '../lib/db'
import { exportToCsv } from '../lib/export'
import { fmtUSD } from '../data/mockData'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  transit:   { label: 'En tránsito',   color: 'var(--primary)' },
  delivered: { label: 'Entregado',     color: 'var(--green-500)' },
  paid:      { label: 'Pagado',        color: 'var(--green-600)' },
  waiting:   { label: 'Esperando pago', color: 'var(--orange-500)' },
  pending:   { label: 'Pendiente',     color: 'var(--orange-400)' },
  delayed:   { label: 'Retrasado',     color: 'var(--red-500)' },
}

function KpiCard({ icon, bg, color, label, value, sub }: {
  icon: string; bg: string; color: string; label: string; value: string; sub?: string
}) {
  return (
    <Card hover style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ width: 38, height: 38, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} />
      </span>
      <div>
        <div className="tnum" style={{ fontSize: 25, fontWeight: 750, color: 'var(--text-strong)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>}
      </div>
    </Card>
  )
}

function SectionCard({ title, sub, children, right }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Card>
      <div className="section-head" style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-title">{title}</div>
          {sub && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  )
}

export function ReportesPage() {
  const [shipments, setShipments] = useState<DbShipment[]>([])
  const [invoices, setInvoices] = useState<DbInvoice[]>([])
  const [quotes, setQuotes] = useState<DbQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'6m' | '12m'>('6m')

  useEffect(() => {
    Promise.all([getShipments(), getInvoices(), getQuotes()])
      .then(([s, i, q]) => { setShipments(s); setInvoices(i); setQuotes(q) })
      .finally(() => setLoading(false))
  }, [])

  const months = range === '6m' ? 6 : 12

  // Series mensuales de facturación y envíos
  const monthly = useMemo(() => {
    const now = new Date()
    return Array.from({ length: months }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + idx, 1)
      const inMonth = (iso: string | null) => {
        if (!iso) return false
        const c = new Date(iso)
        return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear()
      }
      const revenue = shipments.filter(s => inMonth(s.created_at)).reduce((a, s) => a + (s.price ?? 0), 0)
      const count = shipments.filter(s => inMonth(s.created_at)).length
      const isLast = idx === months - 1
      return { label: MONTHS[d.getMonth()], revenue, count, highlight: isLast }
    })
  }, [shipments, months])

  // Distribución por estado
  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    shipments.forEach(s => { counts[s.status] = (counts[s.status] ?? 0) + 1 })
    return Object.entries(counts)
      .map(([status, value]) => ({ label: STATUS_LABELS[status]?.label ?? status, value, color: STATUS_LABELS[status]?.color ?? 'var(--gray-400)' }))
      .sort((a, b) => b.value - a.value)
  }, [shipments])

  // Top rutas
  const topRoutes = useMemo(() => {
    const counts: Record<string, { count: number; origin: string; dest: string }> = {}
    shipments.forEach(s => {
      const key = `${s.origin_code || s.origin}→${s.dest_code || s.dest}`
      if (!counts[key]) counts[key] = { count: 0, origin: s.origin_code || s.origin.split(',')[0], dest: s.dest_code || s.dest.split(',')[0] }
      counts[key].count++
    })
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(r => ({ label: `${r.origin} → ${r.dest}`, value: r.count }))
  }, [shipments])

  // KPIs
  const totalRevenue = shipments.reduce((a, s) => a + (s.price ?? 0), 0)
  const collected = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + (i.amount ?? 0), 0)
  const pendingAmount = invoices.filter(i => i.status !== 'paid').reduce((a, i) => a + (i.amount ?? 0), 0)
  const delivered = shipments.filter(s => s.status === 'delivered' || s.status === 'paid').length
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length
  const conversion = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0

  function handleExport() {
    exportToCsv('reporte-mensual-fletapp', [
      { header: 'Mes', value: m => m.label },
      { header: 'Envíos', value: m => m.count },
      { header: 'Facturación', value: m => m.revenue },
    ], monthly)
  }

  if (loading) {
    return (
      <div className="enter-up">
        <div className="page-head"><h1 className="page-title">Reportes</h1><p className="page-sub">Analiza el desempeño de tus envíos y cobros</p></div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>
      </div>
    )
  }

  const empty = shipments.length === 0 && invoices.length === 0

  return (
    <div className="enter-up">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-sub">Analiza el desempeño de tus envíos y cobros</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Segmented options={[{ value: '6m', label: '6 meses' }, { value: '12m', label: '12 meses' }]} value={range} onChange={v => setRange(v as '6m' | '12m')} />
          <Button variant="secondary" icon="download" onClick={handleExport} disabled={empty}>Exportar</Button>
        </div>
      </div>

      {empty ? (
        <Card>
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <Icon name="trendingUp" size={34} style={{ color: 'var(--border)', marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>Aún no hay datos para reportar</p>
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Tus métricas aparecerán cuando tengas envíos y facturas.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="kpi-grid" style={{ marginBottom: 22 }}>
            <KpiCard icon="dollar" bg="var(--blue-50)" color="var(--primary)" value={fmtUSD(totalRevenue)} label="Facturación total" sub={`${shipments.length} envíos`} />
            <KpiCard icon="checkCircle" bg="var(--green-50)" color="var(--green-600)" value={fmtUSD(collected)} label="Cobrado" sub={`${invoices.filter(i => i.status === 'paid').length} facturas pagadas`} />
            <KpiCard icon="clock" bg="var(--orange-50)" color="var(--orange-600)" value={fmtUSD(pendingAmount)} label="Por cobrar" sub={`${invoices.filter(i => i.status !== 'paid').length} pendientes`} />
            <KpiCard icon="trendingUp" bg="var(--cyan-50)" color="var(--cyan-500)" value={`${conversion}%`} label="Conversión cotizaciones" sub={`${acceptedQuotes} de ${quotes.length} aceptadas`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 18, alignItems: 'start', marginBottom: 18 }} className="dash-cols">
            <SectionCard title="Facturación por mes" sub={`Últimos ${months} meses`}>
              <BarChart data={monthly.map(m => ({ label: m.label, value: m.revenue, highlight: m.highlight }))} color="var(--primary)" format={v => fmtUSD(v)} />
            </SectionCard>
            <SectionCard title="Envíos por estado" sub={`${shipments.length} envíos en total`}>
              <DonutChart segments={byStatus} centerLabel={String(shipments.length)} centerSub="envíos" />
            </SectionCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="dash-cols">
            <SectionCard title="Envíos por mes" sub={`${delivered} entregados en total`}>
              <BarChart data={monthly.map(m => ({ label: m.label, value: m.count, highlight: m.highlight }))} color="var(--cyan-500)" />
            </SectionCard>
            <SectionCard title="Rutas más frecuentes" sub="Por número de envíos">
              {topRoutes.length > 0
                ? <RankBars rows={topRoutes} color="var(--primary)" />
                : <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-faint)' }}>Sin rutas registradas</div>}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}

import { useState, useMemo } from 'react'
import { QUOTES, fmtUSD } from '../data/mockData'


import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Icon } from '../components/ui/Icon'
import type { Route, NavParams, Quote } from '../types'

interface CotizacionesPageProps {
  navigate: (r: Route, p?: NavParams | null) => void
}

// Extended quotes with more statuses for a richer demo
const ALL_QUOTES: Quote[] = [
  ...QUOTES,
  {
    id: 'RES-2026-00135',
    origin: 'Ciudad de México',
    dest: 'Monterrey',
    status: 'accepted',
    price: 5980,
    created: '3 jun, 11:00 AM',
    expires: '4 jun, 11:00 AM',
    containers: '1× 40ft',
  },
  {
    id: 'RES-2026-00131',
    origin: 'Guadalajara',
    dest: 'Ciudad de México',
    status: 'accepted',
    price: 3100,
    created: '1 jun, 8:30 AM',
    expires: '2 jun, 8:30 AM',
    containers: '1× 20ft',
  },
  {
    id: 'RES-2026-00128',
    origin: 'Monterrey',
    dest: 'Tijuana',
    status: 'expired',
    price: 8750,
    created: '28 may, 2:00 PM',
    expires: '29 may, 2:00 PM',
    containers: '2× 20ft',
  },
  {
    id: 'RES-2026-00124',
    origin: 'Ciudad de México',
    dest: 'Veracruz',
    status: 'expired',
    price: 2890,
    created: '25 may, 9:00 AM',
    expires: '26 may, 9:00 AM',
    containers: '1× 20ft',
  },
]

type QuoteStatus = 'pending' | 'accepted' | 'expired'

const STATUS_META: Record<QuoteStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'Pendiente', color: 'var(--orange-500)', bg: 'var(--orange-50)', icon: 'clock' },
  accepted: { label: 'Aceptada',  color: 'var(--green-500)',  bg: 'var(--green-50)',  icon: 'checkCircle' },
  expired:  { label: 'Vencida',   color: 'var(--red-500)',    bg: 'var(--red-50)',    icon: 'alertCircle' },
}

function QuoteBadge({ status }: { status: string }) {
  const s = STATUS_META[status as QuoteStatus] ?? STATUS_META.pending
  return (
    <span
      className="badge badge-soft"
      style={{ '--bg': s.bg, '--fg': s.color } as React.CSSProperties}
    >
      <Icon name={s.icon} size={13} />
      {s.label}
    </span>
  )
}

export function CotizacionesPage({ navigate }: CotizacionesPageProps) {
  const [search, setSearch] = useState('')

  const counts = useMemo(() => ({
    pending:  ALL_QUOTES.filter(q => q.status === 'pending').length,
    accepted: ALL_QUOTES.filter(q => q.status === 'accepted').length,
    expired:  ALL_QUOTES.filter(q => q.status === 'expired').length,
  }), [])

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_QUOTES
    const q = search.toLowerCase()
    return ALL_QUOTES.filter(
      quote =>
        quote.id.toLowerCase().includes(q) ||
        quote.origin.toLowerCase().includes(q) ||
        quote.dest.toLowerCase().includes(q),
    )
  }, [search])

  const summaryCards = [
    {
      label: 'Pendientes',
      count: counts.pending,
      icon: 'clock',
      color: 'var(--orange-500)',
      bg: 'var(--orange-50)',
      sub: 'Esperando tu decisión',
    },
    {
      label: 'Aceptadas',
      count: counts.accepted,
      icon: 'checkCircle',
      color: 'var(--green-500)',
      bg: 'var(--green-50)',
      sub: 'Convertidas a envío',
    },
    {
      label: 'Vencidas',
      count: counts.expired,
      icon: 'alertCircle',
      color: 'var(--red-500)',
      bg: 'var(--red-50)',
      sub: 'Solicita una nueva',
    },
  ]

  return (
    <div className="enter-up">
      {/* Page header */}
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 className="page-title">Cotizaciones</h1>
          <p className="page-sub">Solicita y gestiona cotizaciones de flete terrestre</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => navigate('cotizacion')}>
          Nueva cotización
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {summaryCards.map(card => (
          <Card key={card.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={card.icon} size={22} style={{ color: card.color }} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 750, color: 'var(--text-strong)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  {card.count}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>
                  {card.label}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 10 }}>{card.sub}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: '1 1 280px', maxWidth: 380 }}>
          <Input
            iconLeft="search"
            placeholder="Buscar por ID, origen o destino…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginLeft: 'auto' }}>
          {filtered.length} cotizaciones
        </p>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>Sin resultados</p>
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
              No se encontraron cotizaciones con ese criterio
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ruta</th>
                <th>Contenedores</th>
                <th>Precio</th>
                <th>Creada</th>
                <th>Vence</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id}>
                  <td>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>
                      {q.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 14 }}>
                      {q.origin.split(',')[0]}
                      <span style={{ color: 'var(--gray-400)', margin: '0 6px' }}>→</span>
                      {q.dest}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{q.containers}</span>
                  </td>
                  <td>
                    <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
                      {fmtUSD(q.price)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{q.created}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 13,
                        color: q.status === 'expired' ? 'var(--red-500)' : 'var(--text-muted)',
                        fontWeight: q.status === 'pending' ? 600 : 400,
                      }}
                    >
                      {q.expires}
                    </span>
                  </td>
                  <td>
                    <QuoteBadge status={q.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      {q.status === 'pending' && (
                        <Button
                          variant="success"
                          size="sm"
                          icon="checkCircle"
                          onClick={() => navigate('cotizacion', { id: q.id })}
                        >
                          Aceptar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="eye"
                        onClick={() => navigate('cotizacion', { id: q.id })}
                      >
                        Ver
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

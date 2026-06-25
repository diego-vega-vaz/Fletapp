import { useState, useMemo, useEffect } from 'react'
import { fmtUSD } from '../data/mockData'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Icon } from '../components/ui/Icon'
import { Spinner } from '../components/ui/Misc'
import { getQuotes, acceptQuote } from '../lib/db'
import { exportToCsv, csvDate } from '../lib/export'
import type { DbQuote } from '../lib/db'
import type { Route, NavParams } from '../types'

interface CotizacionesPageProps {
  navigate: (r: Route, p?: NavParams | null) => void
}

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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function CotizacionesPage({ navigate }: CotizacionesPageProps) {
  const [search, setSearch] = useState('')
  const [quotes, setQuotes] = useState<DbQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  function loadQuotes() {
    setLoading(true)
    getQuotes()
      .then(setQuotes)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  async function handleAccept(quote: DbQuote) {
    setAccepting(quote.id)
    try {
      await acceptQuote(quote.id)
      loadQuotes()
    } finally {
      setAccepting(null)
    }
  }

  const counts = useMemo(() => ({
    pending:  quotes.filter(q => q.status === 'pending').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    expired:  quotes.filter(q => q.status === 'expired').length,
  }), [quotes])

  const filtered = useMemo(() => {
    if (!search.trim()) return quotes
    const q = search.toLowerCase()
    return quotes.filter(
      quote =>
        quote.ref_id.toLowerCase().includes(q) ||
        quote.origin.toLowerCase().includes(q) ||
        quote.dest.toLowerCase().includes(q),
    )
  }, [quotes, search])

  function handleExport() {
    exportToCsv('cotizaciones-fletapp', [
      { header: 'ID', value: q => q.ref_id },
      { header: 'Origen', value: q => q.origin },
      { header: 'Destino', value: q => q.dest },
      { header: 'Tipo de carga', value: q => q.cargo_type },
      { header: 'Contenedores', value: q => q.containers },
      { header: 'Peso', value: q => q.weight },
      { header: 'Precio', value: q => q.price },
      { header: 'Estado', value: q => q.status },
      { header: 'Creada', value: q => csvDate(q.created_at) },
      { header: 'Vence', value: q => csvDate(q.expires_at) },
    ], filtered)
  }

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
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon="download" onClick={handleExport} disabled={loading || filtered.length === 0}>
            Exportar
          </Button>
          <Button variant="primary" icon="plus" onClick={() => navigate('cotizacion')}>
            Nueva cotización
          </Button>
        </div>
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
                  {loading ? '—' : card.count}
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
        {!loading && (
          <p style={{ fontSize: 13, color: 'var(--text-faint)', marginLeft: 'auto' }}>
            {filtered.length} cotizaciones
          </p>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>
              {quotes.length === 0 ? 'Sin cotizaciones' : 'Sin resultados'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
              {quotes.length === 0
                ? 'Solicita tu primera cotización de flete.'
                : 'No se encontraron cotizaciones con ese criterio'}
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
                      {q.ref_id}
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
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{q.containers ?? '—'}</span>
                  </td>
                  <td>
                    <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
                      {q.price != null ? fmtUSD(q.price) : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(q.created_at)}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 13,
                        color: q.status === 'expired' ? 'var(--red-500)' : 'var(--text-muted)',
                        fontWeight: q.status === 'pending' ? 600 : 400,
                      }}
                    >
                      {fmtDate(q.expires_at)}
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
                          loading={accepting === q.id}
                          onClick={() => handleAccept(q)}
                        >
                          Aceptar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="eye"
                        onClick={() => navigate('cotizacion', { id: q.ref_id })}
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

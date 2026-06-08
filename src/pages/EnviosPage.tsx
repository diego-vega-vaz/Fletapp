import { useState, useMemo } from 'react'
import { SHIPMENTS, fmtUSD } from '../data/mockData'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Tabs } from '../components/ui/Tabs'
import type { Route, NavParams, Shipment } from '../types'

interface EnviosPageProps {
  navigate: (r: Route, p?: NavParams | null) => void
  onPay: (id: string) => void
}

const TABS = [
  { id: 'activos', label: 'Activos' },
  { id: 'entregados', label: 'Entregados' },
  { id: 'todos', label: 'Todos' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'transit', label: 'En tránsito' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'waiting', label: 'Esperando pago' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'delayed', label: 'Retrasado' },
]

export function EnviosPage({ navigate, onPay }: EnviosPageProps) {
  const [tab, setTab] = useState('activos')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    let list: Shipment[] = SHIPMENTS

    if (tab === 'activos') {
      list = list.filter(s => s.status === 'transit' || s.status === 'waiting' || s.status === 'pending' || s.status === 'delayed')
    } else if (tab === 'entregados') {
      list = list.filter(s => s.status === 'delivered' || s.status === 'paid')
    }

    if (statusFilter) {
      list = list.filter(s => s.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        s =>
          s.id.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.dest.toLowerCase().includes(q) ||
          s.cargo.toLowerCase().includes(q),
      )
    }

    return list
  }, [tab, search, statusFilter])

  function getActions(s: Shipment) {
    const actions: React.ReactNode[] = []

    if (s.status === 'transit' || s.status === 'delayed') {
      actions.push(
        <Button
          key="rastrear"
          variant="secondary"
          size="sm"
          icon="mapPin"
          onClick={() => navigate('rastreo', { id: s.id })}
        >
          Rastrear
        </Button>,
      )
    }

    if (s.status === 'waiting' || (s.paid < s.price)) {
      actions.push(
        <Button
          key="pagar"
          variant="success"
          size="sm"
          icon="creditCard"
          onClick={() => { onPay(s.id); navigate('pago', { id: s.id }) }}
        >
          Pagar
        </Button>,
      )
    }

    actions.push(
      <Button
        key="ver"
        variant="ghost"
        size="sm"
        icon="eye"
        onClick={() => navigate('detalle', { id: s.id })}
      >
        Ver
      </Button>,
    )

    return actions
  }

  return (
    <div className="enter-up">
      {/* Page header */}
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 className="page-title">Envíos</h1>
          <p className="page-sub">Gestiona y rastrea todos tus envíos activos</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => navigate('cotizacion')}>
          Nuevo envío
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', minWidth: 200 }}>
          <Input
            iconLeft="search"
            placeholder="Buscar por ID, ruta o carga…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Table */}
      <div className="card" style={{ marginTop: 16, overflow: 'hidden', padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>Sin envíos</p>
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
              No se encontraron envíos con los filtros aplicados
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ruta</th>
                <th>Estado</th>
                <th>Carga</th>
                <th>Contenedores</th>
                <th>Precio</th>
                <th>ETA</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>
                      {s.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-strong)', fontSize: 14 }}>
                      <span style={{ color: 'var(--text-faint)', fontWeight: 500, fontSize: 13 }}>{s.oCode}</span>
                      <span style={{ color: 'var(--gray-400)' }}>→</span>
                      <span style={{ color: 'var(--text-faint)', fontWeight: 500, fontSize: 13 }}>{s.dCode}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                      {s.origin.split(',')[0]} → {s.dest}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.cargo}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.containers}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }} className="tnum">
                      {fmtUSD(s.price)}
                    </div>
                    {s.paid < s.price && (
                      <div style={{ fontSize: 12, color: 'var(--orange-500)', fontWeight: 600 }}>
                        Pagado: {fmtUSD(s.paid)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.etaShort}</span>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{s.depart.split(',')[0]}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {getActions(s)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 12 }}>
          {filtered.length} {filtered.length === 1 ? 'envío' : 'envíos'} encontrados
        </p>
      )}
    </div>
  )
}

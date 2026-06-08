export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} />
}

interface TooltipProps {
  children: React.ReactNode
  text: string
}

export function Tooltip({ children, text }: TooltipProps) {
  return (
    <span className="tip">
      {children}
      <span className="tip-body">{text}</span>
    </span>
  )
}

interface KVRowProps {
  label: string
  value: React.ReactNode
  mono?: boolean
  strong?: boolean
}

export function KVRow({ label, value, mono, strong }: KVRowProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-faint)', flexShrink: 0 }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontSize: 13, fontWeight: strong ? 750 : 600, color: 'var(--text-strong)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

interface PriceRowProps {
  label: string
  value: number
  fmt?: (n: number) => string
  highlight?: boolean
  total?: boolean
}

export function PriceRow({ label, value, fmt, highlight, total }: PriceRowProps) {
  const display = fmt ? fmt(value) : `$${value.toLocaleString('en-US')}`
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: total ? 15 : 13.5, fontWeight: total ? 750 : 500, color: total || highlight ? 'var(--text-strong)' : 'var(--text-muted)', borderTop: total ? '1px solid var(--border-soft)' : undefined, marginTop: total ? 4 : 0 }}>
      <span>{label}</span>
      <span className="mono tnum">{display}</span>
    </div>
  )
}

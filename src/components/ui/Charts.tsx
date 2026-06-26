// Gráficas SVG ligeras, sin dependencias externas.

interface BarDatum { label: string; value: number; highlight?: boolean }

export function BarChart({ data, height = 180, color = 'var(--primary)', format }: {
  data: BarDatum[]
  height?: number
  color?: string
  format?: (v: number) => string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  const fmt = format ?? ((v: number) => String(v))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height, paddingTop: 22 }}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * (height - 40), d.value > 0 ? 4 : 1)
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', height: 14, whiteSpace: 'nowrap' }}>
              {d.value > 0 ? fmt(d.value) : ''}
            </div>
            <div
              title={`${d.label}: ${fmt(d.value)}`}
              style={{
                width: '100%', maxWidth: 46, height: h, borderRadius: '6px 6px 2px 2px',
                background: color, opacity: d.highlight === false ? 0.45 : 1,
                transition: 'height var(--dur-base, 0.3s) ease',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {d.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface Segment { label: string; value: number; color: string }

export function DonutChart({ segments, size = 160, thickness = 22, centerLabel, centerSub }: {
  segments: Segment[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerSub?: string
}) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gray-100)" strokeWidth={thickness} />
          {total > 0 && segments.map((s, i) => {
            const len = (s.value / total) * c
            const seg = (
              <circle
                key={i}
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={s.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += len
            return seg
          })}
        </svg>
        {(centerLabel || centerSub) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {centerLabel && <div className="tnum" style={{ fontSize: 24, fontWeight: 750, color: 'var(--text-strong)', lineHeight: 1 }}>{centerLabel}</div>}
            {centerSub && <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3 }}>{centerSub}</div>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 140 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>{s.label}</span>
            <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>{s.value}</span>
            <span className="tnum" style={{ fontSize: 12, color: 'var(--text-faint)', width: 42, textAlign: 'right' }}>
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface RankRow { label: string; sub?: string; value: number }

export function RankBars({ rows, color = 'var(--primary)', format }: {
  rows: RankRow[]
  color?: string
  format?: (v: number) => string
}) {
  const max = Math.max(...rows.map(r => r.value), 1)
  const fmt = format ?? ((v: number) => String(v))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>
              {r.label}{r.sub && <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 400, marginLeft: 6 }}>{r.sub}</span>}
            </span>
            <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>{fmt(r.value)}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--gray-100)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(r.value / max) * 100}%`, background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

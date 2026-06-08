import { useEffect, useRef, useState } from 'react'

interface RoutePoint {
  x: number
  y: number
  city: string
  type?: 'origin' | 'dest'
}

interface MexicoMapProps {
  route: RoutePoint[]
  progress?: number
  height?: number
  animated?: boolean
}

export function MexicoMap({ route, progress = 0.44, height = 320, animated = true }: MexicoMapProps) {
  const [truckPos, setTruckPos] = useState(progress)
  const animRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animated) { setTruckPos(progress); return }
    startRef.current = null
    const target = progress
    const start = 0
    const dur = 2800

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const t = Math.min(elapsed / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setTruckPos(start + (target - start) * ease)
      if (t < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [progress, animated])

  const pts = route.map(p => ({ ...p, px: p.x, py: p.y }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`).join(' ')

  const getTruckXY = () => {
    if (pts.length < 2) return { x: pts[0].px, y: pts[0].py }
    const total = pts.length - 1
    const seg = truckPos * total
    const idx = Math.min(Math.floor(seg), total - 1)
    const frac = seg - idx
    const a = pts[idx], b = pts[idx + 1]
    return { x: a.px + (b.px - a.px) * frac, y: a.py + (b.py - a.py) * frac }
  }

  const truck = getTruckXY()

  return (
    <div style={{ position: 'relative', background: '#EEF4FB', borderRadius: 12, overflow: 'hidden', height }}>
      <svg
        viewBox="0 0 100 100"
        style={{ width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Mexico outline (simplified) */}
        <path
          d="M18 22 L24 18 L32 16 L42 14 L52 13 L62 14 L70 16 L78 20 L82 26 L84 32 L82 38 L80 44 L82 50 L80 56 L76 62 L72 68 L68 74 L64 78 L60 82 L56 84 L52 86 L48 84 L44 80 L40 76 L36 70 L32 64 L28 58 L24 52 L20 46 L16 40 L14 34 L14 28 Z"
          fill="#D6E8FA" stroke="#B8D4F0" strokeWidth="0.8"
        />
        {/* Secondary territory (Baja California) */}
        <path
          d="M14 28 L10 32 L8 38 L8 44 L10 50 L12 54 L14 50 L16 44 L16 38 L16 32 Z"
          fill="#D6E8FA" stroke="#B8D4F0" strokeWidth="0.8"
        />
        {/* Yucatan Peninsula */}
        <path
          d="M68 74 L72 70 L76 66 L78 62 L76 68 L72 74 L68 78 Z"
          fill="#D6E8FA" stroke="#B8D4F0" strokeWidth="0.8"
        />

        {/* Route shadow */}
        <path d={pathD} fill="none" stroke="rgba(0,102,204,0.15)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Route line */}
        <path d={pathD} fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />

        {/* Intermediate waypoints */}
        {pts.slice(1, -1).map((p, i) => (
          <g key={i}>
            <circle cx={p.px} cy={p.py} r="1.8" fill="white" stroke="#0066CC" strokeWidth="1.2" />
            <text x={p.px + 2.5} y={p.py + 1} fontSize="3.2" fill="#404654" fontWeight="500">{p.city}</text>
          </g>
        ))}

        {/* Origin */}
        <g>
          <circle cx={pts[0].px} cy={pts[0].py} r="3" fill="#0066CC" stroke="white" strokeWidth="1.5" />
          <circle cx={pts[0].px} cy={pts[0].py} r="5.5" fill="rgba(0,102,204,0.15)" />
          <text x={pts[0].px + 4} y={pts[0].py + 1.5} fontSize="3.5" fill="#003399" fontWeight="700">{pts[0].city}</text>
        </g>

        {/* Destination */}
        <g>
          <circle cx={pts[pts.length - 1].px} cy={pts[pts.length - 1].py} r="3" fill="#00B81C" stroke="white" strokeWidth="1.5" />
          <circle cx={pts[pts.length - 1].px} cy={pts[pts.length - 1].py} r="5.5" fill="rgba(0,184,28,0.15)" />
          <text x={pts[pts.length - 1].px + 4} y={pts[pts.length - 1].py + 1.5} fontSize="3.5" fill="#007610" fontWeight="700">{pts[pts.length - 1].city}</text>
        </g>

        {/* Truck marker */}
        <g transform={`translate(${truck.x}, ${truck.y})`}>
          <circle cx="0" cy="0" r="4.5" fill="white" stroke="#0066CC" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="7" fill="rgba(0,102,204,0.12)" />
          {/* Truck icon simplified */}
          <rect x="-2.5" y="-1.8" width="3.5" height="2.5" rx="0.4" fill="#0066CC" />
          <rect x="1" y="-1.2" width="2" height="1.8" rx="0.3" fill="#0066CC" />
          <circle cx="-1.8" cy="0.9" r="0.8" fill="#0066CC" />
          <circle cx="2" cy="0.9" r="0.8" fill="#0066CC" />
        </g>
      </svg>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '6px 10px', backdropFilter: 'blur(4px)', border: '1px solid rgba(0,102,204,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>En tránsito</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-strong)' }}>{Math.round(truckPos * 100)}% completado</span>
          </div>
          <div style={{ height: 4, background: 'var(--gray-200)', borderRadius: 999 }}>
            <div style={{ height: 4, background: 'var(--primary)', borderRadius: 999, width: `${truckPos * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface StaticMapProps {
  origin: string
  dest: string
  height?: number
}

export function StaticRouteMap({ origin, dest, height = 220 }: StaticMapProps) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #EEF4FB 0%, #E6F2FF 100%)', borderRadius: 12, overflow: 'hidden', height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#0066CC', margin: '0 auto 4px' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#003399' }}>{origin}</div>
        </div>
        <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #0066CC, #00B81C)', borderRadius: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', borderRadius: '50%', border: '2px solid #0066CC', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🚚</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#00B81C', margin: '0 auto 4px' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#007610' }}>{dest}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-faint)' }}>Ruta terrestre · México</div>
    </div>
  )
}

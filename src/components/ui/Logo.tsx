interface LogoProps {
  size?: number
  light?: boolean
  markOnly?: boolean
}

export function Logo({ size = 22, light = false, markOnly = false }: LogoProps) {
  const mark = (
    <span className="logo-mark" style={{ width: size * 1.45, height: size * 1.45, borderRadius: size * 0.42 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
        <path d="M5 17.5h3M16 17.5h3" opacity="0.55" />
        <path d="M4 7l8 0M4 12l11 0" />
        <path d="M14 5l5 5-5 5" />
      </svg>
    </span>
  )
  if (markOnly) return mark
  return (
    <span className="logo" style={{ fontSize: size * 0.95, color: light ? '#fff' : 'var(--text-strong)' }}>
      {mark}
      <span>Fleet<span style={{ color: light ? '#fff' : 'var(--primary)' }}>App</span></span>
    </span>
  )
}

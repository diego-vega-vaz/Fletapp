interface LogoProps {
  size?: number
  light?: boolean
  markOnly?: boolean
}

export function Logo({ size = 22, light = false, markOnly = false }: LogoProps) {
  const iconColor = light ? '#fff' : 'var(--primary)'
  const textColor = light ? '#fff' : 'var(--text-strong)'

  const mark = (
    <svg
      width={Math.round(size * 1.15)}
      height={size}
      viewBox="0 0 44 40"
      fill={iconColor}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <polygon points="0,40 16,40 44,12 44,0 28,0 28,12" />
    </svg>
  )

  if (markOnly) return mark

  return (
    <span className="logo" style={{ fontSize: size * 0.95, color: textColor }}>
      {mark}
      <span>
        <span style={{ fontWeight: 800 }}>Fleet</span><span style={{ fontWeight: 300 }}>App</span>
      </span>
    </span>
  )
}

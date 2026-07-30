interface LogoProps {
  size?: number
  light?: boolean
  markOnly?: boolean
}

export function Logo({ size = 24, light = false, markOnly = false }: LogoProps) {
  const iconColor = light ? '#fff' : 'var(--primary)'
  const textColor = light ? '#fff' : 'var(--text-strong)'

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill={iconColor}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <polygon points="0,40 20,40 40,20 40,0 20,0 20,20" />
    </svg>
  )

  if (markOnly) return mark

  return (
    <span className="logo" style={{ fontSize: size * 0.9, color: textColor }}>
      {mark}
      <span>
        <span style={{ fontWeight: 800 }}>Fleet</span><span style={{ fontWeight: 300 }}>App</span>
      </span>
    </span>
  )
}

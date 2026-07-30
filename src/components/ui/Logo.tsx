interface LogoProps {
  size?: number
  light?: boolean
  markOnly?: boolean
}

export function Logo({ size = 22, light = false, markOnly = false }: LogoProps) {
  const iconColor = light ? '#fff' : 'var(--primary)'
  const textColor = light ? '#fff' : 'var(--text-strong)'

  // Arrow mark: two rectangles forming a northeast arrow (matches brand logo)
  const mark = (
    <svg
      width={Math.round(size * 1.2)}
      height={size}
      viewBox="0 0 44 40"
      fill={iconColor}
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Diagonal bar: lower-left to upper-right */}
      <polygon points="0,40 12,40 44,8 32,8" />
      {/* Top horizontal bar */}
      <polygon points="20,0 44,0 44,8 20,8" />
    </svg>
  )

  if (markOnly) return mark

  return (
    <span className="logo" style={{ fontSize: size * 0.95, color: textColor }}>
      {mark}
      <span>
        <span style={{ fontWeight: 700 }}>Fleet</span>
        <span style={{ fontWeight: 400 }}>App</span>
      </span>
    </span>
  )
}

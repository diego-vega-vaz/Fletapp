interface LogoProps {
  size?: number
  light?: boolean
  markOnly?: boolean
}

export function Logo({ size = 24, light = false, markOnly = false }: LogoProps) {
  const textColor = light ? '#fff' : 'var(--text-strong)'
  const boxSize = Math.round(size * 1.5)
  const svgSize = Math.round(boxSize * 0.68)

  // Blue square background + white arrow inside = matches brand logo
  const mark = (
    <span
      className="logo-mark"
      style={{ width: boxSize, height: boxSize, borderRadius: Math.round(boxSize * 0.22), flexShrink: 0 }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 40 40"
        fill="#fff"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <polygon points="0,40 20,40 40,20 40,0 20,0 20,20" />
      </svg>
    </span>
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

interface LogoProps {
  size?: number
  light?: boolean
  markOnly?: boolean
}

// Para cambiar el logo en el futuro:
// Sube tu archivo a public/ en GitHub con el nombre logo-mark.png.jpg
// y Vercel lo publica automático

export function Logo({ size = 24, light = false, markOnly = false }: LogoProps) {
  const textColor = light ? '#fff' : 'var(--text-strong)'
  const boxSize = Math.round(size * 1.5)

  const mark = (
    <img
      src="/logo-mark.png.jpg"
      width={boxSize}
      height={boxSize}
      alt="FleetApp"
      style={{ flexShrink: 0, display: 'block', borderRadius: Math.round(boxSize * 0.22) }}
    />
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

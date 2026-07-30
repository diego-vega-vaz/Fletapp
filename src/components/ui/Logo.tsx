interface LogoProps {
  size?: number
  light?: boolean
  markOnly?: boolean
}

// Para cambiar el logo:
// 1. Ve a la carpeta public/ en GitHub
// 2. Sube tu archivo y llámalo logo-mark.png
// 3. Commit — listo, sin tocar código

export function Logo({ size = 24, light = false, markOnly = false }: LogoProps) {
  const textColor = light ? '#fff' : 'var(--text-strong)'
  const boxSize = Math.round(size * 1.5)

  const mark = (
    <img
      src="/logo-mark.png"
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

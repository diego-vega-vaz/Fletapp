interface AvatarProps {
  name?: string
  size?: number
  src?: string
}

export function Avatar({ name = '', size = 38, src }: AvatarProps) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt={name} /> : initials}
    </span>
  )
}

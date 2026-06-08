interface CardProps {
  children: React.ReactNode
  hover?: boolean
  pad?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function Card({ children, hover, pad = true, className = '', style, onClick }: CardProps) {
  return (
    <div
      className={`card ${hover ? 'card-hover' : ''} ${pad ? 'card-pad' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

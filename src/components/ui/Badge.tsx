import { Icon } from './Icon'
import type { ShipmentStatus } from '../../types'

export const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',      color: 'var(--st-pending)',   bg: 'var(--orange-50)', icon: 'clock' },
  transit:   { label: 'En tránsito',    color: 'var(--st-transit)',   bg: 'var(--blue-50)',   icon: 'truck' },
  arrived:   { label: 'Llegado',        color: 'var(--st-arrived)',   bg: 'var(--orange-50)', icon: 'mapPin' },
  delivered: { label: 'Entregado',      color: 'var(--st-delivered)', bg: 'var(--green-50)',  icon: 'checkCircle' },
  disputed:  { label: 'Disputa',        color: 'var(--st-disputed)',  bg: 'var(--red-50)',    icon: 'alertCircle' },
  paid:      { label: 'Pagado',         color: 'var(--st-paid)',      bg: 'var(--gray-100)',  icon: 'check' },
  delayed:   { label: 'Retrasado',      color: 'var(--red-500)',      bg: 'var(--red-50)',    icon: 'alertCircle' },
  waiting:   { label: 'Esperando pago', color: 'var(--orange-500)',   bg: 'var(--orange-50)', icon: 'clock' },
} as const

interface StatusBadgeProps {
  status: ShipmentStatus | string
  withIcon?: boolean
  solid?: boolean
}

export function StatusBadge({ status, withIcon = true, solid }: StatusBadgeProps) {
  const s = STATUS_CONFIG[status as ShipmentStatus] ?? STATUS_CONFIG.pending
  if (solid) {
    return (
      <span className="badge badge-solid" style={{ background: s.color }}>
        {withIcon && <Icon name={s.icon} size={13} />}{s.label}
      </span>
    )
  }
  return (
    <span className="badge badge-soft" style={{ '--bg': s.bg, '--fg': s.color } as React.CSSProperties}>
      {withIcon ? <Icon name={s.icon} size={13} /> : <span className="dot" />}{s.label}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  color?: string
  bg?: string
  dot?: boolean
}

export function Badge({ children, color = 'var(--text)', bg = 'var(--gray-100)', dot }: BadgeProps) {
  return (
    <span className="badge badge-soft" style={{ '--bg': bg, '--fg': color } as React.CSSProperties}>
      {dot && <span className="dot" />}{children}
    </span>
  )
}

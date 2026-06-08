import { Icon } from './Icon'

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'ghost-primary'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: string
  iconRight?: string
  loading?: boolean
  block?: boolean
}

export function Button({
  children, variant = 'primary', size = 'md', icon, iconRight,
  loading, block, className = '', disabled, ...rest
}: ButtonProps) {
  const iconSize = size === 'sm' ? 15 : 17
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="spinner" />}
      {!loading && icon && <Icon name={icon} size={iconSize} />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string
  size?: number
  sm?: boolean
}

export function IconButton({ name, size = 20, sm, className = '', ...rest }: IconButtonProps) {
  return (
    <button className={`icon-btn ${sm ? 'sm' : ''} ${className}`} {...rest}>
      <Icon name={name} size={size} />
    </button>
  )
}

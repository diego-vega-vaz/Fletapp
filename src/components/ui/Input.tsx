import { Icon } from './Icon'

interface FieldProps {
  label?: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}

export function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div className="field">
      {label && (
        <label className="field-label">
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error
        ? <span className="field-error"><Icon name="alertCircle" size={13} /> {error}</span>
        : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: string
  iconRight?: string
  onIconRight?: () => void
  error?: boolean
}

export function Input({ iconLeft, iconRight, onIconRight, error, className = '', ...rest }: InputProps) {
  return (
    <div className="input-wrap">
      {iconLeft && <span className="input-icon l"><Icon name={iconLeft} size={18} /></span>}
      <input
        className={`input ${iconLeft ? 'has-icon-l' : ''} ${iconRight ? 'has-icon-r' : ''} ${error ? 'error' : ''} ${className}`}
        {...rest}
      />
      {iconRight && (
        <span className={`input-icon r ${onIconRight ? 'click' : ''}`} onClick={onIconRight}>
          <Icon name={iconRight} size={18} />
        </span>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className = '', ...rest }: TextareaProps) {
  return <textarea className={`input ${error ? 'error' : ''} ${className}`} {...rest} />
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  children: React.ReactNode
}

export function Select({ children, error, className = '', ...rest }: SelectProps) {
  return (
    <div className="input-wrap">
      <select className={`input select-native ${error ? 'error' : ''} ${className}`} {...rest}>
        {children}
      </select>
      <span className="input-icon r"><Icon name="chevronDown" size={18} /></span>
    </div>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
  radio?: boolean
}

export function Checkbox({ checked, onChange, label, radio }: CheckboxProps) {
  return (
    <label className="check">
      <input type={radio ? 'radio' : 'checkbox'} checked={checked} onChange={onChange} readOnly />
      <span className={`box ${radio ? 'radio' : ''}`}>
        {!radio && <Icon name="check" size={14} />}
      </span>
      {label && <span>{label}</span>}
    </label>
  )
}

interface ToggleProps {
  on: boolean
  onClick: () => void
}

export function Toggle({ on, onClick }: ToggleProps) {
  return (
    <button type="button" className={`toggle ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on}>
      <span className="knob" />
    </button>
  )
}

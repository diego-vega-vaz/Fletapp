import { useEffect } from 'react'
import { IconButton } from './Button'

interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, footer, width = 540 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-head">
            <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--text-strong)' }}>{title}</h3>
            <IconButton name="close" size={20} sm onClick={onClose} />
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

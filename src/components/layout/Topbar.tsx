import { useState, useRef } from 'react'
import { IconButton, Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Misc'
import { Input } from '../ui/Input'
import type { Route, User } from '../../types'


interface Crumb {
  label: string
  to?: Route
}

interface TopbarProps {
  crumbs?: Crumb[] | null
  navigate: (r: Route) => void
  onLogout: () => void
  user: User
  onNew: () => void
}

export function Topbar({ crumbs, navigate, onLogout, user, onNew }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const notifs = [
    { icon: 'truck', color: 'var(--primary)', title: 'Tu envío RES-00145 está en Aguascalientes', time: 'Hace 15 min' },
    { icon: 'dollar', color: 'var(--orange-500)', title: 'Pago pendiente de RES-00143 — $2,446', time: 'Hace 2 h' },
    { icon: 'checkCircle', color: 'var(--green-500)', title: 'Cotización RES-00146 lista para aceptar', time: 'Hace 5 h' },
  ]

  return (
    <header className="topbar">
      <div style={{ flex: 1, minWidth: 0 }}>
        {crumbs ? (
          <div className="breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <Icon name="chevronRight" size={14} />}
                <span
                  className={i === crumbs.length - 1 ? 'current' : 'crumb'}
                  onClick={() => c.to && navigate(c.to)}
                >
                  {c.label}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div className="topbar-search">
            <Input iconLeft="search" placeholder="Buscar envíos, cotizaciones, facturas…" style={{ height: 40, background: 'var(--gray-50)' }} />
          </div>
        )}
      </div>

      <Button variant="primary" size="md" icon="plus" onClick={onNew}>Nueva cotización</Button>

      <div ref={notifRef} style={{ position: 'relative' }}>
        <IconButton name="bell" size={20} onClick={() => setNotifOpen(o => !o)} />
        <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 9, background: 'var(--red-500)', border: '2px solid #fff' }} />
        {notifOpen && (
          <div className="dropdown" style={{ minWidth: 340, padding: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14, color: 'var(--text-strong)' }}>Notificaciones</strong>
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setNotifOpen(false)}>Marcar leídas</span>
            </div>
            {notifs.map((n, i) => (
              <div key={i} className="dd-item" style={{ borderRadius: 0, padding: '12px 16px', alignItems: 'flex-start' }}>
                <span style={{ color: n.color, marginTop: 1 }}><Icon name={n.icon} size={18} /></span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 550, lineHeight: 1.35 }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Tooltip text="Centro de ayuda">
        <IconButton name="helpCircle" size={20} onClick={() => navigate('soporte')} />
      </Tooltip>

      <div ref={userRef} style={{ position: 'relative' }}>
        <button onClick={() => setUserOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 3, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <Avatar name={user.name} size={36} />
        </button>
        {userOpen && (
          <div className="dropdown">
            <div style={{ padding: '8px 11px 12px', borderBottom: '1px solid var(--border-soft)', marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)' }}>{user.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{user.email}</div>
            </div>
            <div className="dd-item" onClick={() => { setUserOpen(false); navigate('config') }}><Icon name="user" size={17} />Mi perfil</div>
            <div className="dd-item" onClick={() => { setUserOpen(false); navigate('config') }}><Icon name="building" size={17} />Mi empresa</div>
            <div className="dd-item" onClick={() => { setUserOpen(false); navigate('config') }}><Icon name="settings" size={17} />Configuración</div>
            <div className="divider" style={{ margin: '6px 0' }} />
            <div className="dd-item danger" onClick={onLogout}><Icon name="logout" size={17} />Cerrar sesión</div>
          </div>
        )}
      </div>
    </header>
  )
}

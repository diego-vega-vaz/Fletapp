import { Logo } from '../ui/Logo'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/Button'
import { Icon } from '../ui/Icon'
import type { Route, User } from '../../types'

interface NavItem {
  section?: string
  id?: string
  label?: string
  icon?: string
  badge?: number
}

const NAV: NavItem[] = [
  { section: 'Principal' },
  { id: 'dashboard',    label: 'Dashboard',       icon: 'home' },
  { id: 'cotizaciones', label: 'Cotizaciones',     icon: 'fileText', badge: 2 },
  { id: 'envios',       label: 'Envíos',           icon: 'package' },
  { id: 'pagos',        label: 'Pagos & Facturas', icon: 'card', badge: 1 },
  { section: 'Soporte' },
  { id: 'soporte',  label: 'Soporte',       icon: 'chat' },
  { id: 'config',   label: 'Configuración', icon: 'settings' },
]

interface SidebarProps {
  route: Route
  navigate: (r: Route) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  user: User
}

export function Sidebar({ route, navigate, collapsed, setCollapsed, user }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        {collapsed ? <Logo markOnly size={20} /> : <Logo size={21} />}
        {!collapsed && <IconButton name="menu" size={18} sm onClick={() => setCollapsed(true)} />}
      </div>

      <nav className="nav">
        {NAV.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <div
              key={item.id}
              className={`nav-item ${route === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id as Route)}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-ic"><Icon name={item.icon!} size={20} /></span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          )
        )}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <IconButton name="chevronRight" size={18} sm onClick={() => setCollapsed(false)} />
          </div>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-card" onClick={() => navigate('config')}>
          <Avatar name={user.name} size={36} />
          <div className="user-meta" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.company}</div>
          </div>
          <span className="chev" style={{ color: 'var(--text-faint)' }}><Icon name="chevronRight" size={16} /></span>
        </div>
      </div>
    </aside>
  )
}

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { Route, User } from '../../types'

interface Crumb { label: string; to?: Route }

interface AppShellProps {
  route: Route
  navigate: (r: Route, p?: Record<string, string> | null) => void
  user: User
  onLogout: () => void
  onNew: () => void
  crumbs?: Crumb[] | null
  narrow?: boolean
  children: React.ReactNode
}

export function AppShell({ route, navigate, user, onLogout, onNew, crumbs, narrow, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app">
      <Sidebar route={route} navigate={(r) => navigate(r)} collapsed={collapsed} setCollapsed={setCollapsed} user={user} />
      <div className="main">
        <Topbar crumbs={crumbs} navigate={(r) => navigate(r)} onLogout={onLogout} user={user} onNew={onNew} />
        <div className={`content ${narrow ? 'narrow' : ''}`}>{children}</div>
      </div>
    </div>
  )
}

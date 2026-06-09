import { useState, useCallback, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { CotizacionPage } from './pages/CotizacionPage'
import { CotizacionesPage } from './pages/CotizacionesPage'
import { EnviosPage } from './pages/EnviosPage'
import { RastreoPage } from './pages/RastreoPage'
import { DetalleEnvioPage } from './pages/DetalleEnvioPage'
import { PagosPage } from './pages/PagosPage'
import { FacturasPage } from './pages/FacturasPage'
import { SoportePage } from './pages/SoportePage'
import { TicketDetailPage } from './pages/TicketDetailPage'
import { ConfigPage } from './pages/ConfigPage'
import type { Route, NavParams, User } from './types'

interface Toast { id: number; type: string; title: string; msg?: string }

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [route, setRoute] = useState<Route>('dashboard')
  const [params, setParams] = useState<NavParams | null>(null)
  const [user, setUser] = useState<User>({ name: '', company: '', email: '' })
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    // Check existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user
        setUser({
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuario',
          company: u.user_metadata?.company || '',
          email: u.email || '',
        })
        setAuthed(true)
      }
      setAuthLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user
        setUser({
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuario',
          company: u.user_metadata?.company || '',
          email: u.email || '',
        })
        setAuthed(true)
      } else {
        setAuthed(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const navigate = useCallback((r: Route, p: NavParams | null = null) => {
    setRoute(r)
    setParams(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const toast = useCallback((t: { type: string; title: string; msg?: string }) => {
    const id = Date.now()
    setToasts(ts => [...ts, { ...t, id }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4000)
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setAuthed(false)
    setRoute('dashboard')
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (!authed) {
    if (showRegister) return <RegisterPage onBack={() => setShowRegister(false)} />
    return <LoginPage onLogin={() => setAuthed(true)} onRegister={() => setShowRegister(true)} />
  }

  const page = (() => {
    switch (route) {
      case 'dashboard':    return <DashboardPage navigate={navigate} user={user} onPay={id => navigate('pago', { id })} />
      case 'cotizacion':   return <CotizacionPage navigate={navigate} toast={toast} />
      case 'cotizaciones': return <CotizacionesPage navigate={navigate} />
      case 'envios':       return <EnviosPage navigate={navigate} onPay={id => navigate('pago', { id })} />
      case 'rastreo':      return <RastreoPage navigate={navigate} toast={toast} params={params} />
      case 'detalle':      return <DetalleEnvioPage navigate={navigate} toast={toast} params={params} />
      case 'pago':         return <PagosPage navigate={navigate} toast={toast} params={params} />
      case 'pagos':        return <FacturasPage navigate={navigate} toast={toast} />
      case 'soporte':      return <SoportePage navigate={navigate} toast={toast} />
      case 'ticket':       return <TicketDetailPage navigate={navigate} toast={toast} />
      case 'config':       return <ConfigPage user={user} />
      default:             return <DashboardPage navigate={navigate} user={user} onPay={id => navigate('pago', { id })} />
    }
  })()

  return (
    <>
      <AppShell route={route} navigate={navigate} user={user} onLogout={logout} onNew={() => navigate('cotizacion')}>
        {page}
      </AppShell>

      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 9999, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#fff', border: '1px solid var(--border-soft)',
            borderRadius: 12, padding: '12px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            minWidth: 280, maxWidth: 360,
            animation: 'slideIn 0.2s ease',
            pointerEvents: 'auto',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
              background: t.type === 'success' ? 'var(--green-500)' : t.type === 'warning' ? 'var(--orange-500)' : t.type === 'error' ? 'var(--red-500)' : 'var(--primary)',
            }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)' }}>{t.title}</div>
              {t.msg && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{t.msg}</div>}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}

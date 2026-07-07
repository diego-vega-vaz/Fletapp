import { useState, useCallback, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { AppShell } from './components/layout/AppShell'
import { PublicShell } from './components/layout/PublicShell'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { LandingPage } from './pages/LandingPage'
import { PlanesPage } from './pages/PlanesPage'
import { TerminosPage } from './pages/TerminosPage'
import { PrivacidadPage } from './pages/PrivacidadPage'
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
import { ReportesPage } from './pages/ReportesPage'
import { Logo } from './components/ui/Logo'
import { Button } from './components/ui/Button'
import { Icon } from './components/ui/Icon'
import { OnboardingModal, shouldShowOnboarding } from './components/OnboardingModal'
import { getProfile } from './lib/db'
import type { Plan } from './data/plans'
import type { Route, NavParams, User, PublicRoute } from './types'

interface Toast { id: number; type: string; title: string; msg?: string }

function EmailConfirmedScreen({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 3000)
    return () => clearTimeout(t)
  }, [onContinue])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-raised)', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '52px 48px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Icon name="checkCircle" size={36} style={{ color: 'var(--green-500)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><Logo size={22} /></div>
        <h2 style={{ fontSize: 24, fontWeight: 750, color: 'var(--text-strong)', marginBottom: 12 }}>¡Tu cuenta está activa!</h2>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>
          Tu correo ha sido confirmado. Ya puedes usar FleetApp.
        </p>
        <Button variant="primary" size="lg" block onClick={onContinue}>Ir al dashboard</Button>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [publicRoute, setPublicRoute] = useState<PublicRoute>('landing')
  const [route, setRoute] = useState<Route>('dashboard')
  const [params, setParams] = useState<NavParams | null>(null)
  const [user, setUser] = useState<User>({ name: '', company: '', email: '' })
  const [plan, setPlan] = useState<string | null>('free')
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (window.location.hash.includes('type=signup')) {
      setEmailConfirmed(true)
      history.replaceState(null, '', window.location.pathname)
    }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        setAuthLoading(false)
        return
      }
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

  useEffect(() => {
    if (!authed || !user.email || passwordRecovery) return
    if (shouldShowOnboarding(user.email)) {
      setShowOnboarding(true)
    }
  }, [authed, user.email, passwordRecovery])

  useEffect(() => {
    if (!authed) return
    getProfile().then(p => { if (p?.plan) setPlan(p.plan) }).catch(() => {})
  }, [authed])

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
    setPasswordRecovery(false)
    setShowOnboarding(false)
    setRoute('dashboard')
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (passwordRecovery) {
    return (
      <ResetPasswordPage
        onDone={() => {
          setPasswordRecovery(false)
          setAuthed(true)
        }}
      />
    )
  }

  if (emailConfirmed && authed) {
    return <EmailConfirmedScreen onContinue={() => setEmailConfirmed(false)} />
  }

  if (!authed) {
    const go = (r: PublicRoute) => { setPublicRoute(r); window.scrollTo({ top: 0 }) }
    if (publicRoute === 'login') return <LoginPage onLogin={() => setAuthed(true)} onRegister={() => go('register')} onGo={go} />
    if (publicRoute === 'register') return <RegisterPage onBack={() => go('login')} onGo={go} />
    return (
      <PublicShell go={go} active={publicRoute}>
        {publicRoute === 'landing' && <LandingPage go={go} />}
        {publicRoute === 'planes' && <PlanesPage onSelect={() => go('register')} />}
        {publicRoute === 'terminos' && <TerminosPage go={go} />}
        {publicRoute === 'privacidad' && <PrivacidadPage go={go} />}
      </PublicShell>
    )
  }

  const onSelectPlan = (p: Plan) => {
    if (p.id === plan) return
    if (p.id === 'free') { toast({ type: 'info', title: 'Ya tienes acceso al plan Gratis' }); return }
    window.location.href = `mailto:ventas@fleetapp.mx?subject=${encodeURIComponent(`Quiero mejorar a ${p.name}`)}&body=${encodeURIComponent(`Hola, me interesa el plan ${p.name} para mi cuenta ${user.email}.`)}`
    toast({ type: 'info', title: 'Pagos en línea — muy pronto', msg: `Te conectamos con ventas para activar ${p.name}.` })
  }

  const page = (() => {
    switch (route) {
      case 'dashboard': return <DashboardPage navigate={navigate} user={user} onPay={id => navigate('pago', { id })} />
      case 'cotizacion': return <CotizacionPage navigate={navigate} toast={toast} />
      case 'cotizaciones': return <CotizacionesPage navigate={navigate} />
      case 'envios': return <EnviosPage navigate={navigate} onPay={id => navigate('pago', { id })} />
      case 'rastreo': return <RastreoPage navigate={navigate} toast={toast} params={params} />
      case 'detalle': return <DetalleEnvioPage navigate={navigate} toast={toast} params={params} />
      case 'pago': return <PagosPage navigate={navigate} toast={toast} params={params} />
      case 'pagos': return <FacturasPage navigate={navigate} toast={toast} />
      case 'soporte': return <SoportePage navigate={navigate} toast={toast} />
      case 'ticket': return <TicketDetailPage navigate={navigate} toast={toast} params={params} />
      case 'planes': return <PlanesPage currentPlan={plan} onSelect={onSelectPlan} inApp />
      case 'config': return <ConfigPage user={user} />
      case 'reportes': return <ReportesPage />
      default: return <DashboardPage navigate={navigate} user={user} onPay={id => navigate('pago', { id })} />
    }
  })()

  return (
    <>
      <AppShell route={route} navigate={navigate} user={user} onLogout={logout} onNew={() => navigate('cotizacion')}>
        {page}
      </AppShell>

      {showOnboarding && (
        <OnboardingModal
          userName={user.name}
          userEmail={user.email}
          onCreateQuote={() => { setShowOnboarding(false); navigate('cotizacion') }}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

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
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}

import { Icon } from './ui/Icon'
import { Button } from './ui/Button'
import { Logo } from './ui/Logo'

interface OnboardingModalProps {
  userName: string
  userEmail: string
  onCreateQuote: () => void
  onDismiss: () => void
}

const features = [
  {
    icon: 'fileText' as const,
    color: 'var(--primary)',
    bg: 'var(--blue-50)',
    title: 'Cotizaciones',
    desc: 'Genera cotizaciones de flete en segundos y compártelas con tus clientes.',
  },
  {
    icon: 'truck' as const,
    color: 'var(--green-500)',
    bg: 'var(--green-50)',
    title: 'Envíos',
    desc: 'Rastrea el estado de cada envío y mantén a todos informados.',
  },
  {
    icon: 'barChart2' as const,
    color: 'var(--orange-500)',
    bg: '#fff7ed',
    title: 'Reportes',
    desc: 'Analiza tu facturación, rutas y rendimiento con métricas en tiempo real.',
  },
]

function done(email: string) {
  localStorage.setItem(`fleetapp_onboarding_${email}`, '1')
}

export function OnboardingModal({ userName, userEmail, onCreateQuote, onDismiss }: OnboardingModalProps) {
  const firstName = userName.split(' ')[0]

  function handleQuote() {
    done(userEmail)
    onCreateQuote()
  }

  function handleDismiss() {
    done(userEmail)
    onDismiss()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(10, 20, 40, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24,
        padding: '48px 48px 40px',
        maxWidth: 560, width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        animation: 'onboardIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Logo size={24} />
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 750, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 10, textAlign: 'center' }}>
          ¡Bienvenido, {firstName}!
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: 36 }}>
          Tu cuenta está lista. Esto es lo que puedes hacer con FleetApp:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
          {features.map(f => (
            <div key={f.title} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 18px',
              background: 'var(--surface-raised)',
              borderRadius: 14,
              border: '1px solid var(--border-soft)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: f.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={f.icon} size={20} style={{ color: f.color }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)', marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="primary" size="lg" block onClick={handleQuote}>
            Crear mi primera cotización
          </Button>
          <Button variant="ghost" size="lg" block onClick={handleDismiss}>
            Explorar primero
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes onboardIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export function shouldShowOnboarding(email: string): boolean {
  return !localStorage.getItem(`fleetapp_onboarding_${email}`)
}

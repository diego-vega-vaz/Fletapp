import { useState } from 'react'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { Field, Input, Checkbox } from '../components/ui/Input'
import { Icon } from '../components/ui/Icon'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('diego@grupologistico.mx')
  const [password, setPassword] = useState('••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 1300)
  }

  const benefits = [
    { icon: 'zap', text: 'Cotiza en minutos, no en días' },
    { icon: 'mapPin', text: 'Rastreo en tiempo real de tu carga' },
    { icon: 'shield', text: 'Pagos seguros y facturación CFDI' },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        minHeight: '100vh',
      }}
    >
      {/* Left brand panel */}
      <div
        className="login-brand"
        style={{
          background: 'linear-gradient(145deg, var(--blue-700) 0%, var(--blue-500) 55%, var(--blue-400) 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '44px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -60,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size={26} light />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: 48,
              maxWidth: 420,
            }}
          >
            Simplifica tus envíos terrestres
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {benefits.map(({ icon, text }) => (
              <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <Icon name={icon} size={22} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, position: 'relative', zIndex: 1 }}>
          La plataforma de logística terrestre más confiable de México
        </p>
      </div>

      {/* Right form panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          padding: '0 56px',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 400, width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 'var(--fs-h1)', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Bienvenido de vuelta
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Correo / RFC">
              <Input
                type="email"
                iconLeft="mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@empresa.mx"
                autoComplete="email"
              />
            </Field>

            <Field label="Contraseña">
              <Input
                type={showPassword ? 'text' : 'password'}
                iconLeft="lock"
                iconRight={showPassword ? 'eyeOff' : 'eye'}
                onIconRight={() => setShowPassword(v => !v)}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Checkbox
                checked={remember}
                onChange={() => setRemember(v => !v)}
                label="Recordarme"
              />
              <a
                href="#"
                style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}
                onClick={e => e.preventDefault()}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              loading={loading}
              style={{ marginTop: 4 }}
            >
              Iniciar sesión
            </Button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0' }}>
            <hr className="divider" style={{ flex: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text-faint)', fontWeight: 500 }}>o</span>
            <hr className="divider" style={{ flex: 1 }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <a
              href="#"
              style={{ color: 'var(--primary)', fontWeight: 650 }}
              onClick={e => e.preventDefault()}
            >
              Regístrate aquí
            </a>
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 0 28px',
            textAlign: 'center',
            borderTop: '1px solid var(--border-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 6 }}>
            {['Soporte', 'Términos', 'Privacidad'].map((link, i) => (
              <span key={link} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 500 }}
                >
                  {link}
                </a>
                {i < 2 && <span style={{ color: 'var(--border)', fontSize: 12 }}>·</span>}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            © {new Date().getFullYear()} FletApp. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}

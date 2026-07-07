import { useState } from 'react'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { Field, Input, Checkbox } from '../components/ui/Input'
import { Icon } from '../components/ui/Icon'
import { supabase } from '../lib/supabase'
import type { PublicRoute } from '../types'

interface LoginPageProps {
  onLogin: () => void
  onRegister: () => void
  onGo: (r: PublicRoute) => void
}

export function LoginPage({ onLogin, onRegister, onGo }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotDone, setForgotDone] = useState(false)
  const [forgotError, setForgotError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Ingresa tu correo y contraseña'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError('Correo o contraseña incorrectos'); return }
    onLogin()
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotError('')
    if (!forgotEmail) { setForgotError('Ingresa tu correo electrónico'); return }
    setForgotLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin,
    })
    setForgotLoading(false)
    if (err) { setForgotError('No pudimos enviar el correo. Intenta de nuevo.'); return }
    setForgotDone(true)
  }

  const benefits = [
    { icon: 'zap', text: 'Cotiza en minutos, no en días' },
    { icon: 'mapPin', text: 'Rastreo en tiempo real de tu carga' },
    { icon: 'shield', text: 'Pagos seguros y facturación CFDI' },
  ]

  return (
    <>
      {showForgot && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => { setShowForgot(false); setForgotDone(false); setForgotEmail(''); setForgotError('') }}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            {forgotDone ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Icon name="checkCircle" size={28} style={{ color: 'var(--green-500)' }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 750, color: 'var(--text-strong)', marginBottom: 10 }}>Correo enviado</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Te enviamos un enlace a <strong>{forgotEmail}</strong>. Revisa tu bandeja de entrada.
                  </p>
                </div>
                <Button variant="primary" block onClick={() => { setShowForgot(false); setForgotDone(false); setForgotEmail('') }}>Entendido</Button>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 750, color: 'var(--text-strong)', marginBottom: 8 }}>¿Olvidaste tu contraseña?</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.5 }}>
                  Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </p>
                {forgotError && (
                  <div style={{ padding: '10px 14px', background: 'var(--red-50)', border: '1px solid var(--red-200)', borderRadius: 8, color: 'var(--red-500)', fontSize: 13, marginBottom: 16 }}>{forgotError}</div>
                )}
                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Correo electrónico">
                    <Input type="email" iconLeft="mail" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="correo@empresa.mx" autoFocus />
                  </Field>
                  <Button type="submit" variant="primary" block loading={forgotLoading}>Enviar enlace</Button>
                  <button type="button" onClick={() => { setShowForgot(false); setForgotError('') }} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>Cancelar</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: '100vh' }}>
        <div className="login-brand" style={{ background: 'linear-gradient(145deg, var(--blue-700) 0%, var(--blue-500) 55%, var(--blue-400) 100%)', display: 'flex', flexDirection: 'column', padding: '44px 52px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -120, left: -60, width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}><Logo size={26} light /></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 48, maxWidth: 420 }}>Simplifica tus envíos terrestres</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {benefits.map(({ icon, text }) => (
                <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
                    <Icon name={icon} size={22} style={{ color: '#fff' }} />
                  </div>
                  <span style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, position: 'relative', zIndex: 1 }}>La plataforma de logística terrestre más confiable de México</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', padding: '0 56px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 400, width: '100%', margin: '0 auto' }}>
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 'var(--fs-h1)', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 8 }}>Bienvenido de vuelta</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ingresa tus credenciales para continuar</p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--red-50)', border: '1px solid var(--red-200)', borderRadius: 8, color: 'var(--red-500)', fontSize: 13.5, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="alertCircle" size={15} />{error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field label="Correo electrónico">
                <Input type="email" iconLeft="mail" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.mx" autoComplete="email" />
              </Field>
              <Field label="Contraseña">
                <Input type={showPassword ? 'text' : 'password'} iconLeft="lock" iconRight={showPassword ? 'eyeOff' : 'eye'} onIconRight={() => setShowPassword(v => !v)} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contraseña" autoComplete="current-password" />
              </Field>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Checkbox checked={remember} onChange={() => setRemember(v => !v)} label="Recordarme" />
                <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email) }} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Button type="submit" variant="primary" size="lg" block loading={loading} style={{ marginTop: 4 }}>Iniciar sesión</Button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0' }}>
              <hr className="divider" style={{ flex: 1 }} />
              <span style={{ fontSize: 13, color: 'var(--text-faint)', fontWeight: 500 }}>o</span>
              <hr className="divider" style={{ flex: 1 }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
              ¿No tienes cuenta?{' '}
              <button onClick={onRegister} style={{ color: 'var(--primary)', fontWeight: 650, border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: 14 }}>Regístrate aquí</button>
            </p>
          </div>

          <div style={{ padding: '20px 0 28px', textAlign: 'center', borderTop: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 6 }}>
              {[
                { label: 'Soporte', action: () => window.open('mailto:soporte@fleetapp.mx', '_blank') },
                { label: 'Términos', action: () => onGo('terminos') },
                { label: 'Privacidad', action: () => onGo('privacidad') },
              ].map(({ label, action }, i) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button onClick={action} style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{label}</button>
                  {i < 2 && <span style={{ color: 'var(--border)', fontSize: 12 }}>·</span>}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>© {new Date().getFullYear()} FleetApp. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </>
  )
}

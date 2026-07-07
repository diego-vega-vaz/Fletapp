import { useState } from 'react'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Icon } from '../components/ui/Icon'
import { supabase } from '../lib/supabase'
import type { PublicRoute } from '../types'

interface RegisterPageProps {
  onBack: () => void
  onGo: (r: PublicRoute) => void
}

export function RegisterPage({ onBack, onGo }: RegisterPageProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validatePhone(p: string) {
    const digits = p.replace(/\D/g, '')
    return digits.length >= 10
  }

  function validatePassword(p: string) {
    return p.length >= 8
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Ingresa tu nombre completo'); return }
    if (!email.trim()) { setError('Ingresa tu correo electrónico'); return }
    if (!password) { setError('Ingresa una contraseña'); return }
    if (!validatePassword(password)) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (phone && !validatePhone(phone)) { setError('Ingresa un número de teléfono válido (10 dígitos)'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: name.trim(),
          company: company.trim(),
          phone: phone.trim(),
        },
      },
    })
    setLoading(false)
    if (err) {
      if (err.message.includes('already registered') || err.message.includes('already been registered')) {
        setError('Este correo ya está registrado. ¿Olvidaste tu contraseña?')
      } else {
        setError('No pudimos crear tu cuenta. Intenta de nuevo.')
      }
      return
    }
    setStep('success')
  }

  const passwordStrength = password.length === 0 ? null : password.length < 8 ? 'weak' : password.length < 12 ? 'fair' : 'strong'
  const strengthColor = { weak: 'var(--red-500)', fair: 'var(--orange-500)', strong: 'var(--green-500)' }
  const strengthLabel = { weak: 'Débil', fair: 'Aceptable', strong: 'Fuerte' }

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-raised)', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '52px 48px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Icon name="mail" size={34} style={{ color: 'var(--green-500)' }} />
          </div>
          <Logo size={22} style={{ justifyContent: 'center', marginBottom: 28 }} />
          <h2 style={{ fontSize: 24, fontWeight: 750, color: 'var(--text-strong)', marginBottom: 14 }}>Revisa tu correo</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>
            Enviamos un enlace de confirmación a <strong>{email}</strong>.<br />
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <div style={{ background: 'var(--blue-50)', borderRadius: 12, padding: '14px 20px', marginBottom: 28, textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: 'var(--blue-700)', lineHeight: 1.6, margin: 0 }}>
              💡 No olvides revisar tu carpeta de <strong>spam o correo no deseado</strong> si no lo ves en unos minutos.
            </p>
          </div>
          <Button variant="ghost" onClick={onBack} block>Volver al inicio de sesión</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-raised)', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '44px 48px', maxWidth: 520, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <Logo size={22} />
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Icon name="arrowLeft" size={16} />
            Iniciar sesión
          </button>
        </div>

        <h2 style={{ fontSize: 'var(--fs-h1)', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 8 }}>Crea tu cuenta</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Gratis por 14 días, sin tarjeta de crédito.</p>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--red-50)', border: '1px solid var(--red-200)', borderRadius: 8, color: 'var(--red-500)', fontSize: 13.5, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="alertCircle" size={15} />{error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Nombre completo" required>
              <Input iconLeft="user" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" />
            </Field>
            <Field label="Empresa (opcional)">
              <Input iconLeft="briefcase" value={company} onChange={e => setCompany(e.target.value)} placeholder="Tu empresa" autoComplete="organization" />
            </Field>
          </div>
          <Field label="Correo electrónico" required>
            <Input type="email" iconLeft="mail" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.mx" autoComplete="email" />
          </Field>
          <Field label="Teléfono (opcional)">
            <Input type="tel" iconLeft="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="55 1234 5678" autoComplete="tel" />
          </Field>
          <Field label="Contraseña" required>
            <Input type={showPassword ? 'text' : 'password'} iconLeft="lock" iconRight={showPassword ? 'eyeOff' : 'eye'} onIconRight={() => setShowPassword(v => !v)} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
            {passwordStrength && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--border-soft)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: strengthColor[passwordStrength], width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'fair' ? '66%' : '100%', transition: 'width 0.3s, background 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, color: strengthColor[passwordStrength], fontWeight: 600, minWidth: 60 }}>{strengthLabel[passwordStrength]}</span>
              </div>
            )}
          </Field>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
              {[
                { ok: password.length >= 8, text: 'Mínimo 8 caracteres' },
                { ok: /[A-Z]/.test(password), text: 'Una mayúscula' },
                { ok: /[0-9]/.test(password), text: 'Un número' },
              ].map(({ ok, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name={ok ? 'checkCircle' : 'circle'} size={13} style={{ color: ok ? 'var(--green-500)' : 'var(--text-faint)' }} />
                  <span style={{ fontSize: 12, color: ok ? 'var(--green-600)' : 'var(--text-faint)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" block loading={loading} style={{ marginTop: 4 }}>Crear cuenta gratuita</Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginTop: 20, lineHeight: 1.6 }}>
          Al registrarte aceptas nuestros{' '}
          <button onClick={() => onGo('terminos')} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>Términos de Servicio</button>
          {' '}y{' '}
          <button onClick={() => onGo('privacidad')} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>Política de Privacidad</button>.
        </p>

        <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 20, paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
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
      </div>
    </div>
  )
}

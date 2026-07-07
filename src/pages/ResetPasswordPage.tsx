import { useState } from 'react'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Icon } from '../components/ui/Icon'
import { supabase } from '../lib/supabase'

interface ResetPasswordPageProps {
  onDone: () => void
}

export function ResetPasswordPage({ onDone }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const passwordStrength = password.length === 0 ? null : password.length < 8 ? 'weak' : password.length < 12 ? 'fair' : 'strong'
  const strengthColor = { weak: 'var(--red-500)', fair: 'var(--orange-500)', strong: 'var(--green-500)' }
  const strengthLabel = { weak: 'Débil', fair: 'Aceptable', strong: 'Fuerte' }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError('No pudimos actualizar tu contraseña. El enlace puede haber expirado.')
      return
    }
    setDone(true)
    setTimeout(() => onDone(), 2000)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-raised)', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '52px 48px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Icon name="checkCircle" size={36} style={{ color: 'var(--green-500)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><Logo size={22} /></div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 10 }}>Contraseña actualizada</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Redirigiendo a tu cuenta…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-raised)', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '48px 48px', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}><Logo size={22} /></div>

        <h2 style={{ fontSize: 'var(--fs-h1)', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 8 }}>Nueva contraseña</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Elige una contraseña segura para tu cuenta.</p>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--red-50)', border: '1px solid var(--red-200)', borderRadius: 8, color: 'var(--red-500)', fontSize: 13.5, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="alertCircle" size={15} />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Nueva contraseña" required>
            <Input
              type={showPassword ? 'text' : 'password'}
              iconLeft="lock"
              iconRight={showPassword ? 'eyeOff' : 'eye'}
              onIconRight={() => setShowPassword(v => !v)}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
            {passwordStrength && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--border-soft)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: strengthColor[passwordStrength], width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'fair' ? '66%' : '100%', transition: 'width 0.3s, background 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, color: strengthColor[passwordStrength], fontWeight: 600, minWidth: 60 }}>{strengthLabel[passwordStrength]}</span>
              </div>
            )}
          </Field>

          <Field label="Confirmar contraseña" required>
            <Input
              type={showConfirm ? 'text' : 'password'}
              iconLeft="lock"
              iconRight={showConfirm ? 'eyeOff' : 'eye'}
              onIconRight={() => setShowConfirm(v => !v)}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
            />
            {confirm.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <Icon
                  name={password === confirm ? 'checkCircle' : 'alertCircle'}
                  size={13}
                  style={{ color: password === confirm ? 'var(--green-500)' : 'var(--red-400)' }}
                />
                <span style={{ fontSize: 12, color: password === confirm ? 'var(--green-600)' : 'var(--red-400)' }}>
                  {password === confirm ? 'Las contraseñas coinciden' : 'No coinciden'}
                </span>
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

          <Button type="submit" variant="primary" size="lg" block loading={loading} style={{ marginTop: 4 }}>
            Guardar nueva contraseña
          </Button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Input'
import { Icon } from '../components/ui/Icon'
import { supabase } from '../lib/supabase'

interface Props {
  onBack: () => void
}

export function RegisterPage({ onBack }: Props) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) { setError('Completa todos los campos requeridos'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, company } },
    })
    setLoading(false)

    if (err) { setError(err.message); return }
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Icon name="checkCircle" size={32} style={{ color: 'var(--green-500)' }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 750, color: 'var(--text-strong)', marginBottom: 10 }}>¡Cuenta creada!</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
            Te enviamos un correo de confirmación a <strong>{email}</strong>. Confírmalo y luego inicia sesión.
          </p>
          <Button variant="primary" block onClick={onBack}>Ir a iniciar sesión</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: '100vh' }}>
      {/* Brand side */}
      <div className="login-brand" style={{ background: 'linear-gradient(145deg, var(--blue-700) 0%, var(--blue-500) 55%, var(--blue-400) 100%)', display: 'flex', flexDirection: 'column', padding: '44px 52px' }}>
        <Logo size={26} light />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16, maxWidth: 380 }}>
            Únete a miles de empresas que ya usan FletApp
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            Cotiza, rastrea y paga tus envíos terrestres en un solo lugar.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 52px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 26, fontWeight: 750, color: 'var(--text-strong)', marginBottom: 6 }}>Crear cuenta</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
            ¿Ya tienes cuenta?{' '}
            <button onClick={onBack} style={{ color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              Inicia sesión
            </button>
          </p>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--red-50)', border: '1px solid var(--red-200)', borderRadius: 8, color: 'var(--red-500)', fontSize: 13.5, marginBottom: 18 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Nombre completo" required>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Diego Parado" autoFocus />
            </Field>
            <Field label="Empresa">
              <input className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Grupo Logístico del Norte" />
            </Field>
            <Field label="Correo electrónico" required>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="diego@empresa.mx" />
            </Field>
            <Field label="Contraseña" required>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </Field>
            <Button variant="primary" block loading={loading} style={{ marginTop: 4, fontSize: 15 }}>
              Crear cuenta
            </Button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 20, textAlign: 'center', lineHeight: 1.6 }}>
            Al crear una cuenta aceptas los{' '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Términos de servicio</span> y la{' '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Política de privacidad</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

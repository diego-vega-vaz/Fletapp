import { Logo } from '../ui/Logo'
import { Button } from '../ui/Button'
import type { PublicRoute } from '../../types'

interface Props {
  go: (r: PublicRoute) => void
  active?: PublicRoute
  children: React.ReactNode
}

export function PublicShell({ go, active, children }: Props) {
  const navLink = (label: string, r: PublicRoute) => (
    <button
      onClick={() => go(r)}
      style={{
        fontSize: 14, fontWeight: 600,
        color: active === r ? 'var(--primary)' : 'var(--text-muted)',
        background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px',
      }}
    >{label}</button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Top nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '1px solid var(--border-soft)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
      }}>
        <button onClick={() => go('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Logo size={24} />
        </button>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 22 }} className="public-nav">
          {navLink('Planes', 'planes')}
          {navLink('Iniciar sesión', 'login')}
          <Button variant="primary" size="sm" onClick={() => go('register')}>Crear cuenta gratis</Button>
        </nav>
      </header>

      {/* Content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--gray-50)', padding: '32px 28px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div>
            <Logo size={22} />
            <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 8, maxWidth: 320 }}>
              La plataforma de logística terrestre más confiable de México.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <button onClick={() => go('planes')} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Planes</button>
            <button onClick={() => go('terminos')} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Términos</button>
            <button onClick={() => go('privacidad')} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Privacidad</button>
            <a href="mailto:hola@fleetapp.mx" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Contacto</a>
          </div>
        </div>
        <div style={{ maxWidth: 1080, margin: '20px auto 0', fontSize: 12, color: 'var(--text-faint)', borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
          © {new Date().getFullYear()} FleetApp. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}

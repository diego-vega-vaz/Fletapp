import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { PricingCards } from '../components/shared/PricingCards'
import type { PublicRoute } from '../types'

interface Props {
  go: (r: PublicRoute) => void
}

const FEATURES = [
  { icon: 'zap', name: 'Cotiza al instante', desc: 'Tarifas de flete terrestre en minutos, con desglose claro de costos, peajes e IVA.' },
  { icon: 'mapPin', name: 'Rastreo en tiempo real', desc: 'Sigue tu carga en el mapa, con ETA y notificaciones en cada etapa del recorrido.' },
  { icon: 'fileText', name: 'Facturación CFDI', desc: 'Genera y descarga tus facturas CFDI 4.0 automáticamente con cada envío.' },
  { icon: 'shield', name: 'Pagos seguros', desc: 'Cobros protegidos, anticipos y saldos liberados solo al confirmar la entrega.' },
  { icon: 'package', name: 'Gestión de documentos', desc: 'Sube y organiza cartas porte, facturas y comprobantes por cada envío.' },
  { icon: 'chat', name: 'Soporte cuando lo necesitas', desc: 'Tickets y chat con tiempos de respuesta menores a 2 horas.' },
]

const STEPS = [
  { n: '1', title: 'Cotiza tu envío', desc: 'Ingresa origen, destino y carga. Recibe tu precio al instante.' },
  { n: '2', title: 'Acepta y agenda', desc: 'Confirma la cotización y se genera tu envío con su factura.' },
  { n: '3', title: 'Rastrea y recibe', desc: 'Sigue tu carga en vivo y paga el saldo al confirmar la entrega.' },
]

// Foto del hero — camión de carga en carretera (logística terrestre).
// Para cambiarla, reemplaza esta URL por la de tu propia foto.
const HERO_IMG =
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=2070&q=70'

export function LandingPage({ go }: Props) {
  return (
    <div>
      {/* Hero */}
      <section style={{
        backgroundColor: 'var(--blue-700)',
        backgroundImage: `linear-gradient(160deg, rgba(11,31,74,0.86) 0%, rgba(20,49,110,0.72) 55%, rgba(37,84,164,0.60) 100%), url(${HERO_IMG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -80, width: 460, height: 460, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -160, left: -100, width: 520, height: 520, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 28px 90px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600, marginBottom: 22, backdropFilter: 'blur(4px)' }}>
            Logística terrestre para México
          </span>
          <h1 style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 720, margin: '0 auto 20px' }}>
            Mueve tu carga por México sin complicaciones
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.55 }}>
            Cotiza, agenda, rastrea y factura tus envíos de flete terrestre en una sola plataforma. Empieza gratis, sin tarjeta.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="lg" onClick={() => go('register')} style={{ background: '#fff', color: 'var(--primary)' }}>
              Crear cuenta gratis
            </Button>
            <Button variant="ghost" size="lg" onClick={() => go('planes')} style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>
              Ver planes
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 36, fontSize: 13.5, color: 'rgba(255,255,255,0.85)' }}>
            {['Sin tarjeta requerida', 'Facturación CFDI', 'Cancela cuando quieras'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={15} />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 12 }}>Todo lo que necesitas para enviar</h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 540, margin: '0 auto' }}>Una plataforma completa que reemplaza las llamadas, los correos y las hojas de cálculo.</p>
        </div>
        <div className="grid-3" style={{ gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.name} className="card" style={{ padding: 24 }}>
              <span style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--blue-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name={f.icon} size={23} />
              </span>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 7 }}>{f.name}</div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 12 }}>Así de fácil funciona</h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>De la cotización a la entrega en tres pasos.</p>
          </div>
          <div className="grid-3" style={{ gap: 20 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ textAlign: 'center', padding: '0 12px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>{s.n}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>{s.title}</div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 12 }}>Precios simples y transparentes</h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>Empieza gratis y crece cuando lo necesites.</p>
        </div>
        <PricingCards onSelect={() => go('register')} />
      </section>

      {/* CTA final */}
      <section style={{ background: 'var(--blue-700)', color: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 28px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>¿Listo para mover tu primera carga?</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.9)', marginBottom: 28 }}>Crea tu cuenta gratis hoy. Sin tarjeta, sin compromisos.</p>
          <Button variant="secondary" size="lg" onClick={() => go('register')} style={{ background: '#fff', color: 'var(--primary)' }}>
            Empezar gratis
          </Button>
        </div>
      </section>
    </div>
  )
}

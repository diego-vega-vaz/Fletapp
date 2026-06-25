import { PricingCards } from '../components/shared/PricingCards'
import { Icon } from '../components/ui/Icon'
import type { Plan } from '../data/plans'

interface Props {
  currentPlan?: string | null
  onSelect: (plan: Plan) => void
  inApp?: boolean
}

const FAQ = [
  { q: '¿Puedo cambiar de plan cuando quiera?', a: 'Sí. Puedes mejorar o cambiar tu plan en cualquier momento. El cobro se ajusta de forma proporcional.' },
  { q: '¿Necesito tarjeta para el plan Gratis?', a: 'No. El plan Gratis no requiere tarjeta y puedes usarlo el tiempo que quieras.' },
  { q: '¿Los precios incluyen IVA?', a: 'Los precios mostrados son en pesos mexicanos (MXN) más IVA. Recibirás tu factura CFDI por cada cobro.' },
  { q: '¿Cómo funciona el plan Empresa?', a: 'El plan Empresa se cotiza según tu volumen de envíos. Contáctanos y te armamos una propuesta a la medida.' },
]

export function PlanesPage({ currentPlan, onSelect, inApp }: Props) {
  return (
    <div style={{ maxWidth: inApp ? undefined : 1080, margin: '0 auto', padding: inApp ? 0 : '64px 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <h1 style={{ fontSize: inApp ? 26 : 38, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', marginBottom: 12 }}>
          {inApp ? 'Planes y precios' : 'Elige el plan ideal para tu operación'}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto' }}>
          Empieza gratis y mejora cuando lo necesites. Sin contratos forzosos, cancela cuando quieras.
        </p>
      </div>

      <PricingCards currentPlan={currentPlan} onSelect={onSelect} />

      {/* Comparativa breve */}
      <div style={{ marginTop: 48, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-muted)', background: 'var(--gray-50)', border: '1px solid var(--border-soft)', borderRadius: 999, padding: '8px 16px' }}>
          <Icon name="shield" size={15} style={{ color: 'var(--green-600)' }} />
          Pagos protegidos · Facturación CFDI 4.0 · Cancela en cualquier momento
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 720, margin: '56px auto 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 750, color: 'var(--text-strong)', textAlign: 'center', marginBottom: 24 }}>Preguntas frecuentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ.map(f => (
            <div key={f.q} className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-strong)', marginBottom: 6 }}>{f.q}</div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { PLANS, fmtMXN, type Plan } from '../../data/plans'

interface Props {
  currentPlan?: string | null
  onSelect: (plan: Plan) => void
}

export function PricingCards({ currentPlan, onSelect }: Props) {
  return (
    <div className="grid-3" style={{ alignItems: 'stretch', gap: 18 }}>
      {PLANS.map(plan => {
        const isCurrent = currentPlan === plan.id
        return (
          <div
            key={plan.id}
            className="card"
            style={{
              display: 'flex', flexDirection: 'column', position: 'relative',
              border: plan.highlight ? '2px solid var(--primary)' : '1px solid var(--border)',
              boxShadow: plan.highlight ? 'var(--sh-lg)' : 'var(--sh-sm)',
              padding: 24,
            }}
          >
            {plan.highlight && (
              <span style={{
                position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--primary)', color: '#fff', fontSize: 11.5, fontWeight: 700,
                padding: '4px 12px', borderRadius: 999, letterSpacing: '0.02em', whiteSpace: 'nowrap',
              }}>MÁS POPULAR</span>
            )}

            <div style={{ fontSize: 17, fontWeight: 750, color: 'var(--text-strong)' }}>{plan.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, minHeight: 36 }}>{plan.tagline}</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '14px 0 4px' }}>
              {plan.priceMXN === null ? (
                <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>A tu medida</span>
              ) : plan.priceMXN === 0 ? (
                <span style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>Gratis</span>
              ) : (
                <>
                  <span className="tnum" style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{fmtMXN(plan.priceMXN)}</span>
                  <span style={{ fontSize: 13.5, color: 'var(--text-faint)', fontWeight: 600 }}>/ mes</span>
                </>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 18 }}>
              {plan.priceMXN && plan.priceMXN > 0 ? 'MXN + IVA · cancela cuando quieras' : plan.priceMXN === 0 ? 'Sin tarjeta requerida' : 'Precio según volumen'}
            </div>

            <Button
              variant={plan.highlight ? 'primary' : 'secondary'}
              block
              disabled={isCurrent}
              onClick={() => onSelect(plan)}
            >
              {isCurrent ? 'Tu plan actual' : plan.cta}
            </Button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 20 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: 'var(--text)' }}>
                  <Icon name="check" size={16} style={{ color: 'var(--green-600)', flexShrink: 0, marginTop: 1 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

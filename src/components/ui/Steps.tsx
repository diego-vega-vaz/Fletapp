import { Icon } from './Icon'

interface StepsProps {
  steps: string[]
  current: number
}

export function Steps({ steps, current }: StepsProps) {
  return (
    <div className="steps">
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'contents' }}>
          <div className="step-node">
            <div className={`step-dot ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}>
              {i < current ? <Icon name="check" size={16} /> : i + 1}
            </div>
            <span className={`step-label ${i <= current ? 'active' : ''}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  )
}

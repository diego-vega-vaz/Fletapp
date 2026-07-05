import { useState, useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Field, Input, Select, Checkbox, Textarea } from '../components/ui/Input'
import { Steps } from '../components/ui/Steps'
import { StaticRouteMap } from '../components/shared/MexicoMap'
import { fmtUSD } from '../data/mockData'
import { PLANS, planById, fmtMXN } from '../data/plans'
import { createQuote } from '../lib/db'
import type { Route, NavParams } from '../types'

const CITY_CODE: Record<string, string> = {
  'Ciudad de México': 'CDMX', 'Monterrey': 'MTY', 'Guadalajara': 'GDL',
  'Querétaro': 'QRO', 'Veracruz': 'VER', 'Tijuana': 'TIJ',
  'Mérida': 'MID', 'Puebla': 'PUE', 'León': 'BJX', 'Hermosillo': 'HMO', 'Cancún': 'CUN',
}

const CITIES = ['Ciudad de México', 'Monterrey', 'Guadalajara', 'Querétaro', 'Veracruz', 'Tijuana', 'Mérida', 'Puebla', 'León', 'Hermosillo', 'Cancún']

const CARGO_LABELS: Record<string, string> = {
  full: 'Contenedor general (bases full)',
  sencillo: 'Contenedor general (sencillo)',
  oog: 'Carga OOG (low boy)',
}

interface FormData {
  origin: string; dest: string; service: string; cargoType: string; containers: number
  weight: string; description: string; special: Record<string, boolean>
  customs: string; operation: string
  docs: { invoice: boolean; packing: boolean; bol: boolean; certs: boolean }
  terms: boolean
}

function PriceRow({ label, value, faint, total }: { label: string; value: number | string; faint?: boolean; total?: boolean }) {
  const display = typeof value === 'number' ? fmtUSD(value) : value
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: total ? 15 : 13.5, fontWeight: total ? 750 : 500, color: faint ? 'var(--text-faint)' : total ? 'var(--text-strong)' : 'var(--text-muted)', borderTop: total ? '1px solid var(--border-soft)' : undefined, marginTop: total ? 6 : 0, paddingTop: total ? 10 : 5 }}>
      <span>{label}</span>
      <span className="mono tnum">{display}</span>
    </div>
  )
}

function Step1({ data, set, errors }: { data: FormData; set: (k: keyof FormData, v: any) => void; errors: Record<string, string> }) {
  return (
    <Card>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 20 }}>Detalles del envío</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="¿Qué tipo de servicio deseas?" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {PLANS.map(p => {
              const active = data.service === p.id
              const priceLabel = p.priceMXN === null ? 'A tu medida' : p.priceMXN === 0 ? 'Gratis' : `${fmtMXN(p.priceMXN)}/mes`
              return (
                <div
                  key={p.id}
                  onClick={() => set('service', p.id)}
                  style={{
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary-soft)' : '#fff', transition: 'all var(--dur-quick)',
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)' }}>{p.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{p.tagline}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{priceLabel}</span>
                </div>
              )
            })}
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Ciudad de Origen" required>
            <Select value={data.origin} onChange={e => set('origin', e.target.value)}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Ciudad de Destino" required error={errors.dest}>
            <Select value={data.dest} onChange={e => set('dest', e.target.value)} error={!!errors.dest}>
              {CITIES.filter(c => c !== data.origin).map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Tipo de Carga" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {[['full', 'Contenedor general (bases full)'], ['sencillo', 'Contenedor general (sencillo)'], ['oog', 'Carga OOG (low boy)']].map(([v, l]) => (
              <Checkbox key={v} radio checked={data.cargoType === v} onChange={() => set('cargoType', v)} label={l} />
            ))}
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Cantidad de Contenedores" required error={errors.containers}>
            <Input type="number" min={1} max={10} value={data.containers} onChange={e => set('containers', parseInt(e.target.value) || 1)} error={!!errors.containers} />
          </Field>
          <Field label="Peso Aproximado (kg)">
            <Input type="number" value={data.weight} onChange={e => set('weight', e.target.value)} placeholder="Opcional" />
          </Field>
        </div>

        <Field label="Descripción de Mercancía" error={errors.description}>
          <Textarea value={data.description} onChange={e => set('description', e.target.value)} placeholder="Ej. Equipos industriales para línea de ensamble" error={!!errors.description} />
        </Field>

        <Field label="¿Requiere manejo especial?">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            {[['fragile', 'Frágil'], ['hazard', 'Peligroso'], ['frozen', 'Refrigerado'], ['oog', 'Oversized (OOG)']].map(([k, l]) => (
              <Checkbox key={k} checked={!!data.special[k]} onChange={() => set('special', { ...data.special, [k]: !data.special[k] })} label={l} />
            ))}
          </div>
        </Field>
      </div>
    </Card>
  )
}

function Step2({ data }: { data: FormData }) {
  const dist = data.origin === 'Ciudad de México' && data.dest === 'Monterrey' ? '968 km' : '~800 km'
  const time = data.origin === 'Ciudad de México' && data.dest === 'Monterrey' ? '18-20 horas' : '12-24 horas'
  return (
    <Card>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 16 }}>Verifica tu ruta</h2>
      <StaticRouteMap origin={data.origin} dest={data.dest} height={240} />
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Detalles de ruta</div>
        {[['Distancia estimada', dist], ['Tiempo de tránsito', time], ['Peajes estimados', '$350 USD'], ['Complejidad', 'Baja']].map(([l, v]) => (
          <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 14 }}>
            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{v}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Step3({ data, set, errors }: { data: FormData; set: (k: keyof FormData, v: any) => void; errors: Record<string, string> }) {
  return (
    <Card>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 20 }}>Información aduanal</h2>
      <Field label="¿Requiere gestión aduanal?" required>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <Checkbox radio checked={data.customs === 'yes'} onChange={() => set('customs', 'yes')} label="Sí (+ $2,500 USD)" />
          <Checkbox radio checked={data.customs === 'no'} onChange={() => set('customs', 'no')} label="No" />
        </div>
      </Field>

      {data.customs === 'yes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
          <Field label="Tipo de Operación" required>
            <Select value={data.operation} onChange={e => set('operation', e.target.value)}>
              {['Importación', 'Exportación', 'Locales'].map(o => <option key={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Documentos a Cargar" error={errors.docs}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {[['invoice', 'Factura (Invoice)'], ['packing', 'Packing List'], ['bol', 'Bill of Lading'], ['certs', 'Certificados']].map(([k, l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Checkbox checked={!!data.docs[k as keyof typeof data.docs]} onChange={() => set('docs', { ...data.docs, [k]: !data.docs[k as keyof typeof data.docs] })} label={l} />
                  <Button size="sm" variant="secondary" icon="upload">Cargar</Button>
                </div>
              ))}
            </div>
          </Field>
        </div>
      )}
    </Card>
  )
}

function Step4({ data, price, set }: { data: FormData; price: ReturnType<typeof calcPrice>; set: (k: keyof FormData, v: any) => void }) {
  return (
    <Card>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 20 }}>Resumen de cotización</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div className="section-title" style={{ fontSize: 14, marginBottom: 10 }}>Detalles del envío</div>
          {[['Servicio', planById(data.service).name], ['Origen', data.origin], ['Destino', data.dest], ['Tipo', `${data.containers}× ${CARGO_LABELS[data.cargoType] ?? 'Contenedor'}`], ['Mercancía', data.description], ['Especial', Object.keys(data.special).filter(k => data.special[k]).join(', ') || 'Ninguno']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-faint)' }}>{l}</span>
              <span style={{ fontWeight: 550, color: 'var(--text-strong)', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="section-title" style={{ fontSize: 14, marginBottom: 10 }}>Desglose de precio</div>
          <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-soft)' }}>
            <PriceRow label={`Tarifa base (${data.containers} cont.)`} value={price.base} />
            <PriceRow label="Peajes" value={price.tolls} />
            {price.special > 0 && <PriceRow label="Manejo especial" value={price.special} />}
            <PriceRow label="Subtotal" value={price.subtotal} />
            {price.customs > 0 && <PriceRow label="Aduanas" value={price.customs} />}
            <PriceRow label={`IVA (16%)`} value={price.iva} />
            <PriceRow label="TOTAL" value={price.total} total />
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--blue-50)', borderRadius: 8, fontSize: 12.5, color: 'var(--primary)', display: 'flex', gap: 6 }}>
              <Icon name="info" size={14} />
              Horas de carga gratis: 8 h · Después: $40 USD/hora adicional
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-faint)' }}>
            Válido hasta: Hoy a las 5:00 PM
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20, padding: 16, background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
        <Checkbox checked={data.terms} onChange={() => set('terms', !data.terms)} label="He revisado los términos y acepto los precios de la tarifa" />
      </div>
    </Card>
  )
}

function calcPrice(data: FormData) {
  const base = data.containers * 1600
  const tolls = 350
  let special = 0
  if (data.special.frozen) special += 800
  if (data.special.hazard) special += 1200
  if (data.special.oog) special += 950
  const customs = data.customs === 'yes' ? 2500 : 0
  const subtotal = base + tolls + special
  const iva = Math.round((subtotal + customs) * 0.16)
  return { base, tolls, special, customs, subtotal, iva, total: subtotal + customs + iva }
}

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  toast: (t: { type: string; title: string; msg?: string }) => void
}

export function CotizacionPage({ navigate, toast }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>({
    origin: 'Ciudad de México', dest: 'Monterrey', service: 'pro', cargoType: 'full', containers: 2, weight: '12000',
    description: 'Equipos industriales para línea de ensamble', special: {}, customs: 'yes', operation: 'Importación',
    docs: { invoice: true, packing: true, bol: false, certs: false }, terms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const set = (k: keyof FormData, v: any) => setData(d => ({ ...d, [k]: v }))
  const price = useMemo(() => calcPrice(data), [data])
  const steps = ['Detalles', 'Ruta', 'Aduanas', 'Resumen']

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 0) {
      if (data.origin === data.dest) e.dest = 'El destino debe ser distinto al origen'
      if (!data.containers || data.containers < 1) e.containers = 'Cantidad inválida'
      if ((data.description || '').length < 10) e.description = 'Describe la mercancía (mín. 10 caracteres)'
    }
    if (step === 2 && data.customs === 'yes') {
      if (!data.docs.invoice || !data.docs.packing) e.docs = 'La factura y el packing list son obligatorios'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) { setStep(s => Math.min(s + 1, 3)); window.scrollTo({ top: 0 }) } else toast({ type: 'error', title: 'Revisa los campos marcados' }) }
  const back = () => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0 }) }
  const accept = async () => {
    if (!data.terms) { toast({ type: 'warning', title: 'Acepta los términos para continuar' }); return }
    setSubmitting(true)
    try {
      const q = await createQuote({
        origin: data.origin,
        origin_code: CITY_CODE[data.origin] ?? data.origin.slice(0, 4).toUpperCase(),
        dest: data.dest,
        dest_code: CITY_CODE[data.dest] ?? data.dest.slice(0, 4).toUpperCase(),
        cargo_type: data.cargoType,
        containers: String(data.containers),
        weight: data.weight,
        cargo_desc: data.description,
        special: data.special,
        customs: data.customs,
        operation: data.operation,
        price: price.total,
      })
      toast({ type: 'success', title: 'Cotización enviada', msg: `${q.ref_id} creada · revísala en Cotizaciones` })
      setTimeout(() => navigate('cotizaciones'), 900)
    } catch {
      toast({ type: 'error', title: 'Error al crear cotización' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="page-head">
        <h1 className="page-title">Nueva cotización</h1>
        <p className="page-sub">Paso {step + 1} de 4 · {['Ingresa los detalles del envío', 'Verifica tu ruta', 'Información aduanal', 'Revisa y confirma'][step]}</p>
      </div>

      <div style={{ marginBottom: 26 }}><Steps steps={steps} current={step} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22, alignItems: 'start' }} className="quote-cols">
        <div className="enter-up" key={step}>
          {step === 0 && <Step1 data={data} set={set} errors={errors} />}
          {step === 1 && <Step2 data={data} />}
          {step === 2 && <Step3 data={data} set={set} errors={errors} />}
          {step === 3 && <Step4 data={data} price={price} set={set} />}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 22, justifyContent: 'space-between' }}>
        <Button variant="secondary" icon="arrowLeft" onClick={step === 0 ? () => navigate('cotizaciones') : back}>
          {step === 0 ? 'Cancelar' : 'Atrás'}
        </Button>
        {step < 3
          ? <Button variant="primary" iconRight="arrowRight" onClick={next}>Siguiente</Button>
          : <Button variant="success" icon="checkCircle" loading={submitting} onClick={accept}>Enviar cotización</Button>}
      </div>
    </div>
  )
}

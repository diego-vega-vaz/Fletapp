import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Modal } from '../components/ui/Modal'
import { Field, Textarea, Select } from '../components/ui/Input'

import type { Route, NavParams } from '../types'

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  toast: (t: { type: string; title: string; msg?: string }) => void
}

function TicketBadge({ status }: { status: string }) {
  const cfg = {
    transit:   { label: 'En progreso', color: 'var(--primary)', bg: 'var(--blue-50)' },
    resolved:  { label: 'Resuelto', color: 'var(--green-600)', bg: 'var(--green-50)' },
    pending:   { label: 'Pendiente', color: 'var(--orange-600)', bg: 'var(--orange-50)' },
    closed:    { label: 'Cerrado', color: 'var(--text-muted)', bg: 'var(--gray-100)' },
  }[status] ?? { label: status, color: 'var(--text-muted)', bg: 'var(--gray-100)' }
  return (
    <span className="badge badge-soft" style={{ '--bg': cfg.bg, '--fg': cfg.color, fontSize: 11.5 } as React.CSSProperties}>
      {cfg.label}
    </span>
  )
}

const MOCK_TICKETS = [
  { id: '#1234', subject: 'Pago rechazado en envío RES-2026-00143', status: 'transit', prio: 'Alta', date: 'Ayer, 10:30 AM', agent: 'Carlos Méndez' },
  { id: '#1228', subject: 'Retraso en entrega QRO-TIJ', status: 'resolved', prio: 'Media', date: '2 jun, 3:15 PM', agent: 'Ana López' },
  { id: '#1215', subject: 'Factura XML con error en RFC', status: 'closed', prio: 'Baja', date: '28 may, 11:00 AM', agent: 'Luis Torres' },
]

export function SoportePage({ navigate, toast }: Props) {
  const [newOpen, setNewOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Pagos')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = () => {
    if (!subject.trim() || !desc.trim()) { toast({ type: 'warning', title: 'Completa el asunto y la descripción' }); return }
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setNewOpen(false)
      setSubject(''); setDesc('')
      toast({ type: 'success', title: 'Ticket creado', msg: 'Te responderemos en menos de 2 horas' })
    }, 1400)
  }

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Soporte</h1>
          <p className="page-sub">Consulta tus tickets o contáctanos por chat en vivo.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setNewOpen(true)}>Nuevo ticket</Button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 22 }}>
        {[
          { icon: 'fileText', color: 'var(--primary)', bg: 'var(--blue-50)', value: '3', label: 'Tickets abiertos' },
          { icon: 'checkCircle', color: 'var(--green-600)', bg: 'var(--green-50)', value: '12', label: 'Tickets resueltos' },
          { icon: 'clock', color: 'var(--orange-600)', bg: 'var(--orange-50)', value: '< 2h', label: 'Tiempo de respuesta' },
        ].map(c => (
          <Card key={c.label} hover style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={c.icon} size={22} />
            </span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 750, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{c.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{c.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }} className="dash-cols">
        {/* Ticket list */}
        <Card pad={false}>
          <div style={{ padding: '18px 20px 10px' }}><div className="section-title">Mis tickets</div></div>
          <table className="data-table">
            <thead>
              <tr><th>Ticket</th><th>Asunto</th><th>Prioridad</th><th>Estado</th><th>Agente</th><th></th></tr>
            </thead>
            <tbody>
              {MOCK_TICKETS.map(t => (
                <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate('ticket', { id: t.id })}>
                  <td>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{t.id}</span>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{t.date}</div>
                  </td>
                  <td style={{ fontSize: 13.5, color: 'var(--text-strong)', fontWeight: 550, maxWidth: 260 }}>{t.subject}</td>
                  <td>
                    <span className="badge badge-soft" style={{
                      '--bg': t.prio === 'Alta' ? 'var(--red-50)' : t.prio === 'Media' ? 'var(--orange-50)' : 'var(--gray-100)',
                      '--fg': t.prio === 'Alta' ? 'var(--red-500)' : t.prio === 'Media' ? 'var(--orange-600)' : 'var(--text-muted)',
                      fontSize: 11.5,
                    } as React.CSSProperties}>{t.prio}</span>
                  </td>
                  <td><TicketBadge status={t.status} /></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.agent}</td>
                  <td>
                    <Button size="sm" variant="ghost" iconRight="chevronRight" onClick={e => { e.stopPropagation(); navigate('ticket', { id: t.id }) }}>Ver</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Live chat */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block' }} />
              <div className="section-title">Chat en vivo</div>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Un agente está disponible ahora mismo. Tiempo de espera: <strong style={{ color: 'var(--text-strong)' }}>&lt; 2 minutos</strong>.
            </p>
            <Button variant="primary" icon="chat" block onClick={() => toast({ type: 'info', title: 'Chat en vivo', msg: 'Conectando con María García…' })}>
              Iniciar chat en vivo
            </Button>
          </Card>

          {/* Contact options */}
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Otros canales</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: 'phone', label: 'Teléfono', sub: '+52 (55) 8000-3538 · Lun–Vie 8–20h', color: 'var(--green-600)' },
                { icon: 'whatsapp', label: 'WhatsApp', sub: 'Respuesta típica < 1 hora', color: 'var(--green-500)' },
                { icon: 'mail', label: 'Correo', sub: 'soporte@fletapp.mx · 24h hábiles', color: 'var(--primary)' },
              ].map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border-soft)', borderRadius: 10, cursor: 'pointer' }}
                  onClick={() => toast({ type: 'info', title: c.label, msg: c.sub })}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--gray-50)', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={c.icon} size={19} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-strong)' }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* FAQ */}
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Preguntas frecuentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                '¿Cómo cancelo un envío?',
                '¿Cuándo se genera mi factura CFDI?',
                '¿Qué hago si mi pago fue rechazado?',
                '¿Cómo añado un seguro de carga?',
              ].map((q, i, arr) => (
                <div key={q} style={{ padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => toast({ type: 'info', title: q })}>
                  <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{q}</span>
                  <Icon name="chevronRight" size={15} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* New ticket modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nuevo ticket de soporte" width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Asunto">
            <input className="input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Describe brevemente tu problema" />
          </Field>
          <Field label="Categoría">
            <Select value={category} onChange={e => setCategory(e.target.value)}>
              {['Pagos', 'Envíos', 'Facturación', 'Cuenta', 'Otro'].map(o => <option key={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Descripción">
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe tu problema con el mayor detalle posible…" rows={5} />
          </Field>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="secondary" onClick={() => setNewOpen(false)} style={{ flex: '0 0 auto' }}>Cancelar</Button>
            <Button variant="primary" block loading={submitting} onClick={submit}>Enviar ticket</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

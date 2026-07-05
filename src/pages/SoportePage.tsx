import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Modal } from '../components/ui/Modal'
import { Field, Textarea, Select } from '../components/ui/Input'
import { Spinner } from '../components/ui/Misc'
import { getTickets, createTicket, type DbTicket } from '../lib/db'
import type { Route, NavParams } from '../types'

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  toast: (t: { type: string; title: string; msg?: string }) => void
}

function TicketBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    open:        { label: 'Abierto',     color: 'var(--primary)',    bg: 'var(--blue-50)' },
    in_progress: { label: 'En progreso', color: 'var(--primary)',    bg: 'var(--blue-50)' },
    resolved:    { label: 'Resuelto',    color: 'var(--green-600)', bg: 'var(--green-50)' },
    closed:      { label: 'Cerrado',     color: 'var(--text-muted)', bg: 'var(--gray-100)' },
  }
  const c = cfg[status] ?? cfg.open
  return <span className="badge badge-soft" style={{ '--bg': c.bg, '--fg': c.color, fontSize: 11.5 } as React.CSSProperties}>{c.label}</span>
}

export function SoportePage({ navigate, toast }: Props) {
  const [tickets, setTickets] = useState<DbTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Pagos')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadTickets = () => {
    setLoading(true)
    getTickets().then(setTickets).finally(() => setLoading(false))
  }

  useEffect(() => { loadTickets() }, [])

  const submit = async () => {
    if (!subject.trim() || !desc.trim()) { toast({ type: 'warning', title: 'Completa el asunto y la descripción' }); return }
    setSubmitting(true)
    try {
      await createTicket({ subject, category, description: desc })
      setNewOpen(false)
      setSubject(''); setDesc('')
      loadTickets()
      toast({ type: 'success', title: 'Ticket creado', msg: 'Te responderemos en menos de 2 horas' })
    } catch {
      toast({ type: 'error', title: 'Error al crear ticket' })
    } finally {
      setSubmitting(false)
    }
  }

  const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Soporte</h1>
          <p className="page-sub">Consulta tus tickets o contáctanos por chat en vivo.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setNewOpen(true)}>Nuevo ticket</Button>
      </div>

      <div className="grid-3" style={{ marginBottom: 22 }}>
        {[
          { icon: 'fileText', color: 'var(--primary)', bg: 'var(--blue-50)', value: loading ? '—' : String(open), label: 'Tickets abiertos' },
          { icon: 'checkCircle', color: 'var(--green-600)', bg: 'var(--green-50)', value: loading ? '—' : String(resolved), label: 'Tickets resueltos' },
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
        <Card pad={false}>
          <div style={{ padding: '18px 20px 10px' }}><div className="section-title">Mis tickets</div></div>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><Spinner size={28} /></div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Icon name="messageSquare" size={32} style={{ color: 'var(--border)', marginBottom: 10 }} />
              <p style={{ fontSize: 14, color: 'var(--text-faint)', marginBottom: 14 }}>No tienes tickets de soporte aún.</p>
              <Button variant="primary" size="sm" icon="plus" onClick={() => setNewOpen(true)}>Crear ticket</Button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Ticket</th><th>Asunto</th><th>Prioridad</th><th>Estado</th><th>Fecha</th><th></th></tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate('ticket', { id: t.ticket_number })}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{t.ticket_number}</span>
                    </td>
                    <td style={{ fontSize: 13.5, color: 'var(--text-strong)', fontWeight: 550, maxWidth: 260 }}>{t.subject}</td>
                    <td>
                      <span className="badge badge-soft" style={{
                        '--bg': t.priority === 'Alta' ? 'var(--red-50)' : t.priority === 'Media' ? 'var(--orange-50)' : 'var(--gray-100)',
                        '--fg': t.priority === 'Alta' ? 'var(--red-500)' : t.priority === 'Media' ? 'var(--orange-600)' : 'var(--text-muted)',
                        fontSize: 11.5,
                      } as React.CSSProperties}>{t.priority}</span>
                    </td>
                    <td><TicketBadge status={t.status} /></td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <Button size="sm" variant="ghost" iconRight="chevronRight" onClick={e => { e.stopPropagation(); navigate('ticket', { id: t.ticket_number }) }}>Ver</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block' }} />
              <div className="section-title">Chat en vivo</div>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Un agente está disponible ahora. Tiempo de espera: <strong style={{ color: 'var(--text-strong)' }}>&lt; 2 min</strong>.
            </p>
            <Button variant="primary" icon="chat" block onClick={() => toast({ type: 'info', title: 'Chat en vivo', msg: 'Conectando con un agente…' })}>
              Iniciar chat en vivo
            </Button>
          </Card>

          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Otros canales</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: 'phone', label: 'Teléfono', sub: '+52 (55) 8000-3538 · Lun–Vie 8–20h', color: 'var(--green-600)' },
                { icon: 'whatsapp', label: 'WhatsApp', sub: 'Respuesta típica < 1 hora', color: 'var(--green-500)' },
                { icon: 'mail', label: 'Correo', sub: 'soporte@fleetapp.mx', color: 'var(--primary)' },
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
        </div>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nuevo ticket de soporte" width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Asunto">
            <input className="input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Describe brevemente tu problema" autoFocus />
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

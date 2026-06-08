import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { TICKET } from '../data/mockData'
import type { Route, NavParams } from '../types'

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  toast: (t: { type: string; title: string; msg?: string }) => void
}

export function TicketDetailPage({ navigate, toast }: Props) {
  const ticket = TICKET
  const [msg, setMsg] = useState('')
  const [messages, setMessages] = useState(ticket.messages)
  const [sending, setSending] = useState(false)

  const send = () => {
    if (!msg.trim()) return
    const text = msg
    setSending(true)
    setMsg('')
    setMessages(ms => [...ms, { from: 'me', name: 'Diego Parado', time: 'Ahora', text }])
    setTimeout(() => {
      setSending(false)
      setMessages(ms => [...ms, { from: 'agent', name: ticket.agent, time: 'Ahora', text: 'Recibido. Estoy revisando tu caso y te responderé en breve.' }])
    }, 1400)
  }

  const statusCfg = {
    transit:  { label: 'En progreso', color: 'var(--primary)', bg: 'var(--blue-50)' },
    resolved: { label: 'Resuelto', color: 'var(--green-600)', bg: 'var(--green-50)' },
    closed:   { label: 'Cerrado', color: 'var(--text-muted)', bg: 'var(--gray-100)' },
  }[ticket.status] ?? { label: ticket.status, color: 'var(--text-muted)', bg: 'var(--gray-100)' }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button onClick={() => navigate('soporte')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13.5, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <Icon name="arrowLeft" size={16} />Soporte
          </button>
          <Icon name="chevronRight" size={14} style={{ color: 'var(--text-faint)' }} />
          <span className="mono" style={{ fontSize: 13.5, color: 'var(--text-faint)' }}>Ticket {ticket.id}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 22 }}>{ticket.subject}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-soft" style={{ '--bg': statusCfg.bg, '--fg': statusCfg.color, fontSize: 11.5 } as React.CSSProperties}>{statusCfg.label}</span>
              <span className="badge badge-soft" style={{ '--bg': 'var(--red-50)', '--fg': 'var(--red-500)', fontSize: 11.5 } as React.CSSProperties}>{ticket.prio} prioridad</span>
              <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Abierto: {ticket.opened}</span>
            </div>
          </div>
          <Button variant="secondary" icon="alertCircle" onClick={() => toast({ type: 'success', title: 'Ticket escalado', msg: 'Un supervisor revisará tu caso' })}>
            Escalar ticket
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="dash-cols">
        {/* Conversation thread */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block' }} />
              <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                Agente: <strong style={{ color: 'var(--text-strong)' }}>{ticket.agent}</strong> · En línea
              </span>
            </div>

            {/* Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
              {messages.map((m, i) => {
                const isMe = m.from === 'me'
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <Avatar name={m.name} size={34} />
                    <div style={{ maxWidth: '76%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-strong)' }}>{m.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{m.time}</span>
                      </div>
                      <div style={{
                        padding: '11px 14px',
                        borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMe ? 'var(--primary)' : 'var(--gray-50)',
                        border: isMe ? 'none' : '1px solid var(--border-soft)',
                        color: isMe ? '#fff' : 'var(--text)',
                        fontSize: 14, lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                      }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply input */}
            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
              <textarea
                className="input"
                rows={3}
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder="Escribe tu respuesta…"
                style={{ resize: 'vertical', marginBottom: 10 }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Cmd+Enter para enviar</span>
                <Button variant="primary" icon="send" loading={sending} onClick={send}>Enviar</Button>
              </div>
            </div>
          </Card>

          {/* Attachments */}
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Archivos adjuntos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ticket.files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--gray-50)', border: '1px solid var(--border-soft)', borderRadius: 9 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={f.icon} size={16} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Subido {f.meta}</div>
                  </div>
                  <Button size="sm" variant="ghost" icon="download" onClick={() => toast({ type: 'success', title: `${f.name} descargado` })} />
                </div>
              ))}
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1.5px dashed var(--border)', borderRadius: 9, color: 'var(--text-muted)', fontSize: 13.5, cursor: 'pointer', background: 'transparent', width: '100%' }}
                onClick={() => toast({ type: 'info', title: 'Adjuntar archivo', msg: 'Selecciona un archivo para subir' })}
              >
                <Icon name="plus" size={16} />Adjuntar archivo
              </button>
            </div>
          </Card>
        </div>

        {/* Right: ticket info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Detalles del ticket</div>
            {[
              ['ID', ticket.id],
              ['Categoría', ticket.category],
              ['Prioridad', ticket.prio],
              ['SLA', ticket.sla],
              ['Tiempo restante', ticket.remaining],
              ['Envío relacionado', ticket.shipment],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13.5 }}>
                <span style={{ color: 'var(--text-faint)' }}>{l}</span>
                <span style={{ fontWeight: 600, color: l === 'Envío relacionado' ? 'var(--primary)' : 'var(--text-strong)', fontFamily: l === 'ID' || l === 'Envío relacionado' ? 'var(--font-mono)' : 'inherit' }}>
                  {l === 'Envío relacionado'
                    ? <button style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', fontSize: 13.5 }}
                        onClick={() => navigate('detalle', { id: v as string })}>{v}</button>
                    : v}
                </span>
              </div>
            ))}
          </Card>

          <Card>
            <div className="section-title" style={{ marginBottom: 12 }}>Descripción original</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{ticket.description}</p>
          </Card>

          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Agente asignado</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={ticket.agent} size={42} />
              <div>
                <div style={{ fontWeight: 650, fontSize: 14.5, color: 'var(--text-strong)' }}>{ticket.agent}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>Especialista en Pagos · FletApp</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 600 }}>En línea</span>
                </div>
              </div>
            </div>
          </Card>

          <Button variant="ghost" icon="checkCircle" block onClick={() => toast({ type: 'success', title: 'Ticket marcado como resuelto' })}>
            Marcar como resuelto
          </Button>
        </div>
      </div>
    </div>
  )
}

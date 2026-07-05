import { useState, useEffect, useRef } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { Spinner } from '../components/ui/Misc'
import { getTicket, getTicketMessages, sendTicketMessage, type DbTicket, type DbTicketMessage } from '../lib/db'
import { supabase } from '../lib/supabase'
import type { Route, NavParams } from '../types'

interface Props {
  navigate: (r: Route, p?: NavParams | null) => void
  toast: (t: { type: string; title: string; msg?: string }) => void
  params: NavParams | null
}

function fmtMsgTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'Ahora'
  if (diff < 3_600_000) return `Hace ${Math.round(diff / 60_000)} min`
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Abierto',     color: 'var(--primary)',    bg: 'var(--blue-50)' },
  in_progress: { label: 'En progreso', color: 'var(--primary)',    bg: 'var(--blue-50)' },
  resolved:    { label: 'Resuelto',    color: 'var(--green-600)', bg: 'var(--green-50)' },
  closed:      { label: 'Cerrado',     color: 'var(--text-muted)', bg: 'var(--gray-100)' },
}

export function TicketDetailPage({ navigate, toast, params }: Props) {
  const [ticket, setTicket] = useState<DbTicket | null>(null)
  const [messages, setMessages] = useState<DbTicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [userName, setUserName] = useState('Tú')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'Tú'
      setUserName(name)
    })
  }, [])

  useEffect(() => {
    const ticketNumber = params?.id
    if (!ticketNumber) { setLoading(false); return }

    async function load() {
      const t = await getTicket(ticketNumber!)
      if (t) {
        setTicket(t)
        const msgs = await getTicketMessages(t.id)
        setMessages(msgs)
      }
      setLoading(false)
    }
    load()
  }, [params?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!msg.trim() || !ticket) return
    const text = msg.trim()
    setMsg('')
    setSending(true)
    try {
      const newMsg = await sendTicketMessage(ticket.id, text, userName)
      setMessages(ms => [...ms, newMsg])
    } catch {
      toast({ type: 'error', title: 'Error al enviar mensaje' })
      setMsg(text)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <Spinner size={32} />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <Icon name="messageSquare" size={32} style={{ color: 'var(--border)', marginBottom: 12 }} />
        <p style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Ticket no encontrado</p>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 16 }}>No se pudo cargar el ticket de soporte.</p>
        <Button variant="secondary" onClick={() => navigate('soporte')}>Volver a Soporte</Button>
      </div>
    )
  }

  const statusCfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.open
  const openedDate = new Date(ticket.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button onClick={() => navigate('soporte')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13.5, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <Icon name="arrowLeft" size={16} />Soporte
          </button>
          <Icon name="chevronRight" size={14} style={{ color: 'var(--text-faint)' }} />
          <span className="mono" style={{ fontSize: 13.5, color: 'var(--text-faint)' }}>Ticket {ticket.ticket_number}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 22 }}>{ticket.subject}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-soft" style={{ '--bg': statusCfg.bg, '--fg': statusCfg.color, fontSize: 11.5 } as React.CSSProperties}>{statusCfg.label}</span>
              <span className="badge badge-soft" style={{ '--bg': ticket.priority === 'Alta' ? 'var(--red-50)' : ticket.priority === 'Media' ? 'var(--orange-50)' : 'var(--gray-100)', '--fg': ticket.priority === 'Alta' ? 'var(--red-500)' : ticket.priority === 'Media' ? 'var(--orange-600)' : 'var(--text-muted)', fontSize: 11.5 } as React.CSSProperties}>{ticket.priority} prioridad</span>
              <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Abierto: {openedDate}</span>
            </div>
          </div>
          <Button variant="secondary" icon="alertCircle" onClick={() => toast({ type: 'success', title: 'Ticket escalado', msg: 'Un supervisor revisará tu caso' })}>
            Escalar ticket
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="dash-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block' }} />
              <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                Agente: <strong style={{ color: 'var(--text-strong)' }}>{ticket.agent_name}</strong> · En línea
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20, maxHeight: 420, overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                  No hay mensajes aún. ¡Escribe el primero!
                </div>
              ) : messages.map(m => {
                const isMe = m.is_user
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 10, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <Avatar name={m.author_name ?? (isMe ? userName : ticket.agent_name)} size={34} />
                    <div style={{ maxWidth: '76%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-strong)' }}>{m.author_name ?? (isMe ? userName : ticket.agent_name)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{fmtMsgTime(m.created_at)}</span>
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
                        {m.body}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

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

          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Archivos adjuntos</div>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1.5px dashed var(--border)', borderRadius: 9, color: 'var(--text-muted)', fontSize: 13.5, cursor: 'pointer', background: 'transparent', width: '100%' }}
              onClick={() => toast({ type: 'info', title: 'Adjuntar archivo', msg: 'Selecciona un archivo para subir' })}
            >
              <Icon name="plus" size={16} />Adjuntar archivo
            </button>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Detalles del ticket</div>
            {[
              ['ID', ticket.ticket_number],
              ['Categoría', ticket.category],
              ['Prioridad', ticket.priority],
              ['Estado', statusCfg.label],
              ['Abierto', openedDate],
              ...(ticket.shipment_ref ? [['Envío relacionado', ticket.shipment_ref]] : []),
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

          {ticket.description && (
            <Card>
              <div className="section-title" style={{ marginBottom: 12 }}>Descripción original</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{ticket.description}</p>
            </Card>
          )}

          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Agente asignado</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={ticket.agent_name} size={42} />
              <div>
                <div style={{ fontWeight: 650, fontSize: 14.5, color: 'var(--text-strong)' }}>{ticket.agent_name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>Especialista en Soporte · FleetApp</div>
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

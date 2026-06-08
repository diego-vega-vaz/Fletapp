import { useState } from 'react'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Field, Input, Toggle } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

import { Icon } from '../components/ui/Icon'

interface ConfigPageProps {
  user: { name: string; company: string; email: string }
}

const CONFIG_TABS = [
  { id: 'perfil', label: 'Perfil', icon: 'user' },
  { id: 'empresa', label: 'Empresa', icon: 'building2' },
  { id: 'seguridad', label: 'Seguridad', icon: 'shield' },
  { id: 'notificaciones', label: 'Notificaciones', icon: 'bell' },
]

const STATIC_USER = {
  name: 'Diego Parado',
  company: 'Grupo Logístico del Norte',
  email: 'diego@grupologistico.mx',
  phone: '+52 55 1234 5678',
  rfc: 'PADG880512AB3',
}

type NotificationKey =
  | 'email_transit'
  | 'email_delivered'
  | 'email_payment'
  | 'email_quotes'
  | 'sms_transit'
  | 'sms_delivered'
  | 'sms_payment'
  | 'push_transit'
  | 'push_delivered'
  | 'push_payment'
  | 'push_quotes'

type NotificationState = Record<NotificationKey, boolean>

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: sub ? 4 : 0 }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>{sub}</p>}
    </div>
  )
}

function SaveBar({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
      <Button variant="primary" loading={saving} onClick={onSave} icon="save">
        Guardar cambios
      </Button>
    </div>
  )
}

function NotifRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string
  sub?: string
  value: boolean
  onChange: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={value} onClick={onChange} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Perfil                                                          */
/* ------------------------------------------------------------------ */
function PerfilTab({ user }: { user: typeof STATIC_USER }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function save() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 900)
  }

  return (
    <div>
      <SectionHead title="Información personal" sub="Actualiza tus datos de contacto y perfil" />

      {/* Avatar area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '20px 0',
          marginBottom: 28,
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <Avatar name={name} size={72} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-strong)', marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 12 }}>{email}</div>
          <Button variant="secondary" size="sm" icon="upload">
            Cambiar foto
          </Button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 18 }}>
        <Field label="Nombre completo" required>
          <Input
            iconLeft="user"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </Field>
        <Field label="Correo electrónico" required>
          <Input
            iconLeft="mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@empresa.mx"
          />
        </Field>
        <Field label="Teléfono">
          <Input
            iconLeft="phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+52 55 0000 0000"
          />
        </Field>
        <Field label="RFC">
          <Input
            iconLeft="fileText"
            value={user.rfc}
            disabled
            placeholder="RFC"
          />
        </Field>
      </div>

      <SaveBar saving={saving} onSave={save} />
      {saved && (
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--green-500)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="checkCircle" size={14} /> Cambios guardados
          </span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Empresa                                                         */
/* ------------------------------------------------------------------ */
function EmpresaTab({ user }: { user: typeof STATIC_USER }) {
  const [company, setCompany] = useState(user.company)
  const [rfc, setRfc] = useState(user.rfc)
  const [address, setAddress] = useState('Av. Insurgentes Sur 1000, Col. Del Valle, CDMX')
  const [colonia, setColonia] = useState('Del Valle')
  const [ciudad, setCiudad] = useState('Ciudad de México')
  const [cp, setCp] = useState('03100')
  const [saving, setSaving] = useState(false)

  function save() {
    setSaving(true)
    setTimeout(() => setSaving(false), 900)
  }

  return (
    <div>
      <SectionHead title="Datos de la empresa" sub="Esta información aparecerá en tus facturas CFDI" />

      <div className="grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <Field label="Razón social" required>
          <Input
            iconLeft="building2"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Nombre legal de la empresa"
          />
        </Field>
        <Field label="RFC" required>
          <Input
            iconLeft="fileText"
            value={rfc}
            onChange={e => setRfc(e.target.value)}
            placeholder="RFC de la empresa"
          />
        </Field>
      </div>

      <Field label="Calle y número">
        <Input
          iconLeft="mapPin"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Dirección fiscal"
        />
      </Field>

      <div className="grid-3" style={{ gap: 18, marginTop: 18 }}>
        <Field label="Colonia">
          <Input value={colonia} onChange={e => setColonia(e.target.value)} placeholder="Colonia" />
        </Field>
        <Field label="Ciudad">
          <Input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ciudad" />
        </Field>
        <Field label="Código postal">
          <Input value={cp} onChange={e => setCp(e.target.value)} placeholder="CP" />
        </Field>
      </div>

      {/* Logo upload area */}
      <div style={{ marginTop: 28 }}>
        <label className="field-label" style={{ marginBottom: 8, display: 'block' }}>Logo de la empresa</label>
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 12,
            padding: '32px 24px',
            textAlign: 'center',
            background: 'var(--gray-50)',
            cursor: 'pointer',
            transition: 'border-color var(--dur-quick)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Icon name="upload" size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>
            Arrastra tu logo aquí
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14 }}>
            PNG, JPG o SVG · Máximo 2 MB
          </p>
          <Button variant="secondary" size="sm">
            Seleccionar archivo
          </Button>
        </div>
      </div>

      <SaveBar saving={saving} onSave={save} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Seguridad                                                       */
/* ------------------------------------------------------------------ */
function SeguridadTab() {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [two_fa, setTwoFa] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPass !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (newPass.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setCurrent('')
      setNewPass('')
      setConfirm('')
    }, 900)
  }

  const strength = newPass.length === 0
    ? null
    : newPass.length < 8
    ? { label: 'Débil', color: 'var(--red-500)', pct: 25 }
    : newPass.length < 12
    ? { label: 'Media', color: 'var(--orange-500)', pct: 60 }
    : { label: 'Fuerte', color: 'var(--green-500)', pct: 100 }

  return (
    <div>
      <SectionHead title="Cambiar contraseña" sub="Usa una contraseña fuerte de al menos 8 caracteres" />

      <form onSubmit={handleChangePassword} style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Contraseña actual" required>
            <Input
              type={showCurrent ? 'text' : 'password'}
              iconLeft="lock"
              iconRight={showCurrent ? 'eyeOff' : 'eye'}
              onIconRight={() => setShowCurrent(v => !v)}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="Contraseña actual"
            />
          </Field>

          <Field label="Nueva contraseña" required>
            <Input
              type={showNew ? 'text' : 'password'}
              iconLeft="lock"
              iconRight={showNew ? 'eyeOff' : 'eye'}
              onIconRight={() => setShowNew(v => !v)}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              error={!!error}
            />
            {strength && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, borderRadius: 999, background: 'var(--gray-200)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${strength.pct}%`,
                      background: strength.color,
                      borderRadius: 999,
                      transition: 'width 0.3s, background 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: strength.color, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>
                  {strength.label}
                </span>
              </div>
            )}
          </Field>

          <Field label="Confirmar nueva contraseña" required error={error}>
            <Input
              type="password"
              iconLeft="lock"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite la nueva contraseña"
              error={!!error}
            />
          </Field>
        </div>

        <div style={{ marginTop: 24 }}>
          <Button type="submit" variant="primary" loading={saving} icon="shield">
            Actualizar contraseña
          </Button>
        </div>
      </form>

      <hr className="divider" style={{ margin: '36px 0' }} />

      {/* 2FA */}
      <SectionHead title="Autenticación de dos factores" sub="Añade una capa extra de seguridad a tu cuenta" />

      <Card style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: two_fa ? 'var(--green-50)' : 'var(--gray-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <Icon
                name="smartphone"
                size={22}
                style={{ color: two_fa ? 'var(--green-500)' : 'var(--gray-400)' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 650, color: 'var(--text-strong)', fontSize: 14 }}>
                Verificación por SMS
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                {two_fa ? 'Activa · +52 55 1234 5678' : 'Recibe un código al iniciar sesión'}
              </div>
            </div>
          </div>
          <Toggle on={two_fa} onClick={() => setTwoFa(v => !v)} />
        </div>
      </Card>

      <hr className="divider" style={{ margin: '36px 0' }} />

      {/* Sessions */}
      <SectionHead title="Sesiones activas" sub="Cierra sesiones en otros dispositivos" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 500 }}>
        {[
          { device: 'Chrome · macOS', location: 'Ciudad de México, MX', time: 'Ahora (sesión actual)', current: true },
          { device: 'Safari · iPhone', location: 'Ciudad de México, MX', time: 'hace 2 días', current: false },
        ].map(session => (
          <Card key={session.device}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon name="monitor" size={20} style={{ color: 'var(--text-faint)' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>
                    {session.device}
                    {session.current && (
                      <span
                        className="badge badge-soft"
                        style={{ '--bg': 'var(--green-50)', '--fg': 'var(--green-500)', marginLeft: 8, fontSize: 11 } as React.CSSProperties}
                      >
                        <span className="dot" />Actual
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1 }}>
                    {session.location} · {session.time}
                  </div>
                </div>
              </div>
              {!session.current && (
                <Button variant="danger" size="sm">
                  Cerrar
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Notificaciones                                                  */
/* ------------------------------------------------------------------ */
function NotificacionesTab() {
  const [notifs, setNotifs] = useState<NotificationState>({
    email_transit: true,
    email_delivered: true,
    email_payment: true,
    email_quotes: false,
    sms_transit: true,
    sms_delivered: false,
    sms_payment: true,
    push_transit: true,
    push_delivered: true,
    push_payment: false,
    push_quotes: true,
  })

  function toggle(key: NotificationKey) {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const emailEvents = [
    { key: 'email_transit' as NotificationKey, label: 'Envío en tránsito', sub: 'Cuando tu carga sale del origen' },
    { key: 'email_delivered' as NotificationKey, label: 'Entrega completada', sub: 'Confirmación de entrega exitosa' },
    { key: 'email_payment' as NotificationKey, label: 'Recordatorio de pago', sub: '48h antes del vencimiento de factura' },
    { key: 'email_quotes' as NotificationKey, label: 'Cotizaciones nuevas', sub: 'Cuando FletApp genera una nueva oferta' },
  ]

  const smsEvents = [
    { key: 'sms_transit' as NotificationKey, label: 'Salida del envío', sub: 'SMS cuando el camión parte' },
    { key: 'sms_delivered' as NotificationKey, label: 'Entrega confirmada', sub: 'SMS al llegar al destino' },
    { key: 'sms_payment' as NotificationKey, label: 'Pago procesado', sub: 'Confirmación de pago exitoso' },
  ]

  const pushEvents = [
    { key: 'push_transit' as NotificationKey, label: 'Actualizaciones de ruta', sub: 'Cada checkpoint del recorrido' },
    { key: 'push_delivered' as NotificationKey, label: 'Entrega completada', sub: 'Notificación push inmediata' },
    { key: 'push_payment' as NotificationKey, label: 'Pagos y facturas', sub: 'Cobros y documentos disponibles' },
    { key: 'push_quotes' as NotificationKey, label: 'Cotizaciones', sub: 'Nuevas ofertas y vencimientos' },
  ]

  function ChannelCard({ icon, title, sub, events }: {
    icon: string
    title: string
    sub: string
    events: { key: NotificationKey; label: string; sub: string }[]
  }) {
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={19} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 15 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{sub}</div>
          </div>
        </div>
        {events.map(ev => (
          <NotifRow
            key={ev.key}
            label={ev.label}
            sub={ev.sub}
            value={notifs[ev.key]}
            onChange={() => toggle(ev.key)}
          />
        ))}
      </Card>
    )
  }

  return (
    <div>
      <SectionHead title="Preferencias de notificaciones" sub="Elige cómo y cuándo recibir alertas de tu cuenta" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <ChannelCard
          icon="mail"
          title="Correo electrónico"
          sub="Enviado a diego@grupologistico.mx"
          events={emailEvents}
        />
        <ChannelCard
          icon="messageSquare"
          title="Mensajes SMS"
          sub="Enviado a +52 55 1234 5678"
          events={smsEvents}
        />
        <ChannelCard
          icon="bell"
          title="Notificaciones push"
          sub="En la app y el navegador"
          events={pushEvents}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                        */
/* ------------------------------------------------------------------ */
export function ConfigPage({ user }: ConfigPageProps) {
  const [tab, setTab] = useState('perfil')

  const FULL_USER = {
    ...STATIC_USER,
    ...user,
  }

  return (
    <div className="enter-up">
      <div className="page-head">
        <h1 className="page-title">Configuración</h1>
        <p className="page-sub">Administra tu perfil, empresa y preferencias</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}>
        {/* Sidebar nav */}
        <div>
          <Card>
            {/* User summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 18px', borderBottom: '1px solid var(--border-soft)', marginBottom: 12 }}>
              <Avatar name={FULL_USER.name} size={46} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {FULL_USER.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {FULL_USER.email}
                </div>
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {CONFIG_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 9,
                    fontSize: 14,
                    fontWeight: tab === t.id ? 650 : 550,
                    color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                    background: tab === t.id ? 'var(--primary-soft)' : 'transparent',
                    transition: 'all var(--dur-quick)',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (tab !== t.id) e.currentTarget.style.background = 'var(--gray-100)'
                  }}
                  onMouseLeave={e => {
                    if (tab !== t.id) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Icon
                    name={t.icon}
                    size={17}
                    style={{ color: tab === t.id ? 'var(--primary)' : 'var(--text-faint)', flexShrink: 0 }}
                  />
                  {t.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Main content */}
        <Card>
          {tab === 'perfil' && <PerfilTab user={FULL_USER} />}
          {tab === 'empresa' && <EmpresaTab user={FULL_USER} />}
          {tab === 'seguridad' && <SeguridadTab />}
          {tab === 'notificaciones' && <NotificacionesTab />}
        </Card>
      </div>
    </div>
  )
}

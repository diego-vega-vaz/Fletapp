/* ============================================================
   FletApp — Secondary screens: Envíos, Cotizaciones, Soporte, Config
   ============================================================ */
const { useState: useStateM } = React;

/* ---------- Envíos list ---------- */
function EnviosScreen({ navigate, onPay }) {
  const [filter, setFilter] = useStateM('all');
  const filters = [{ value: 'all', label: 'Todos' }, { value: 'transit', label: 'En tránsito' }, { value: 'waiting', label: 'Por pagar' }, { value: 'delivered', label: 'Entregados' }];
  const rows = SHIPMENTS.filter(s => filter === 'all' || s.status === filter);
  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div><h1 className="page-title">Envíos</h1><p className="page-sub">{SHIPMENTS.length} envíos en total · 2 activos ahora mismo</p></div>
        <Button variant="secondary" icon="download">Exportar</Button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <Segmented options={filters} value={filter} onChange={setFilter} />
        <div style={{ width: 280 }}><Input iconLeft="search" placeholder="Buscar por folio o ruta…" style={{ height: 40 }} /></div>
      </div>
      <Card pad={false}>
        <table className="data-table">
          <thead><tr><th>Folio</th><th>Ruta</th><th>Estado</th><th>Carga</th><th style={{ textAlign: 'right' }}>Total</th><th></th></tr></thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id}>
                <td><span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13 }}>{s.id}</span><div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{s.depart}</div></td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, color: 'var(--text-strong)', fontSize: 13.5 }}>{s.oCode}<Icon name="arrowRight" size={13} style={{ color: 'var(--text-faint)' }} />{s.dCode}</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{s.distance} · {s.duration}</div></td>
                <td><StatusBadge status={s.status} /></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.containers}<div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{s.weight}</div></td>
                <td style={{ textAlign: 'right' }}><span className="mono tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{fmtUSD(s.price)}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {s.status === 'waiting' ? <Button size="sm" variant="success" onClick={() => onPay(s.id)}>Pagar</Button>
                    : s.status === 'transit' ? <Button size="sm" variant="secondary" icon="mapPin" onClick={() => navigate('rastreo', { id: s.id })}>Rastrear</Button>
                    : <Button size="sm" variant="ghost" iconRight="chevronRight" onClick={() => navigate('detalle', { id: s.id })}>Ver</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------- Cotizaciones list ---------- */
function CotizacionesScreen({ navigate }) {
  const all = [...QUOTES, ...SHIPMENTS.map(s => ({ id: s.id, origin: s.origin, dest: s.dest, status: 'delivered', price: s.price, created: s.depart, expires: '—', containers: s.containers }))];
  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div><h1 className="page-title">Cotizaciones</h1><p className="page-sub">2 pendientes de aceptar · vencen hoy</p></div>
        <Button variant="primary" icon="plus" onClick={() => navigate('cotizacion')}>Nueva cotización</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {QUOTES.map(q => (
          <Card key={q.id} hover style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="fileText" size={22} /></span>
            <div style={{ minWidth: 160 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13.5 }}>{q.id}</span><StatusBadge status="pending" /></div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{q.origin} → {q.dest} · {q.containers}</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, fontSize: 12.5, color: 'var(--text-faint)' }}>
              <div>Creada: {q.created}</div><div style={{ color: 'var(--orange-600)', fontWeight: 600 }}>Vence: {q.expires}</div>
            </div>
            <div style={{ textAlign: 'right' }}><div className="mono tnum" style={{ fontWeight: 750, fontSize: 18, color: 'var(--text-strong)' }}>{fmtUSD(q.price)}</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>USD · IVA incl.</div></div>
            <div style={{ display: 'flex', gap: 8 }}><Button size="sm" variant="ghost">Rechazar</Button><Button size="sm" variant="primary" icon="check" onClick={() => navigate('cotizacion')}>Aceptar</Button></div>
          </Card>
        ))}
        <div className="section-title" style={{ marginTop: 14, fontSize: 14, color: 'var(--text-faint)' }}>Historial</div>
        <Card pad={false}>
          <table className="data-table">
            <thead><tr><th>Folio</th><th>Ruta</th><th>Estado</th><th>Fecha</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {SHIPMENTS.map(s => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate('detalle', { id: s.id })}>
                  <td><span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13 }}>{s.id}</span></td>
                  <td style={{ fontSize: 13.5, color: 'var(--text)' }}>{s.origin} → {s.dest}</td>
                  <td><StatusBadge status={s.status === 'waiting' ? 'arrived' : s.status} /></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.depart}</td>
                  <td style={{ textAlign: 'right' }}><span className="mono tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{fmtUSD(s.price)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Soporte ---------- */
function SoporteScreen({ navigate, toast }) {
  const [chatOpen, setChatOpen] = useStateM(false);
  const cats = [{ icon: 'mapPin', label: 'Rastreo', color: 'var(--primary)' }, { icon: 'chat', label: 'Chat en vivo', color: 'var(--green-600)' }, { icon: 'fileText', label: 'Mis tickets', color: 'var(--cyan-500)' }, { icon: 'helpCircle', label: 'Preguntas frecuentes', color: 'var(--orange-600)' }];
  const tickets = [
    { id: '#1234', subject: 'Pago rechazado', status: 'transit', sLabel: 'En progreso', prio: 'Alta', prioColor: 'var(--red-500)', opened: 'Ayer 10:30 AM', last: 'Hace 3 horas' },
    { id: '#1233', subject: 'Pregunta sobre aduanas', status: 'delivered', sLabel: 'Resuelto', prio: 'Media', prioColor: 'var(--orange-500)', opened: '5 jun', last: 'Cerrado 6 jun · 14h' },
  ];
  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="page-head"><h1 className="page-title">Centro de soporte</h1><p className="page-sub">¿Necesitas ayuda? Estamos para ti de lunes a viernes, 8 AM – 6 PM (MX).</p></div>
      <div style={{ marginBottom: 18 }}><Input iconLeft="search" placeholder="¿Cómo podemos ayudarte? Busca en la base de conocimiento…" style={{ height: 48 }} /></div>
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {cats.map(c => (
          <Card key={c.label} hover style={{ textAlign: 'center', cursor: 'pointer', padding: 18 }} onClick={() => c.label === 'Chat en vivo' && setChatOpen(true)}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gray-50)', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Icon name={c.icon} size={22} /></span>
            <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--text-strong)' }}>{c.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="track-cols">
        <div>
          <div className="section-head"><div className="section-title">Mis tickets activos</div><Button size="sm" variant="primary" icon="plus">Nuevo ticket</Button></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map(t => (
              <Card key={t.id} hover>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gray-50)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="chat" size={20} /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>Ticket {t.id}</span>
                      <StatusBadge status={t.status} withIcon={false} />
                      <span className="badge badge-soft" style={{ '--bg': 'var(--gray-100)', '--fg': t.prioColor, fontSize: 11 }}><span className="dot" />{t.prio}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', marginTop: 6 }}>{t.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 3 }}>Abierto {t.opened} · Última respuesta {t.last}</div>
                  </div>
                  <Button size="sm" variant="ghost" iconRight="chevronRight" onClick={() => navigate('ticket')}>Ver</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: 'linear-gradient(150deg,#0066CC,#003399)', color: '#fff' }}>
            <Icon name="chat" size={24} />
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 10 }}>¿Pregunta urgente?</div>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 1.5 }}>Nuestro equipo responde en menos de 2 minutos en horario laboral.</p>
            <Button variant="success" block icon="chat" onClick={() => setChatOpen(true)} style={{ marginTop: 14 }}>Iniciar chat en vivo</Button>
          </Card>
          <Card>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Contacto directo</div>
            <ContactRow icon="phone" label="Teléfono" value="+52 55 1234 5678" />
            <ContactRow icon="mail" label="Email" value="support@fletapp.mx" />
            <ContactRow icon="whatsapp" label="WhatsApp" value="+52 55 9876 5432" />
          </Card>
        </div>
      </div>
      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

function ContactRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--gray-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={17} /></span>
      <div><div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{label}</div><div className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>{value}</div></div>
    </div>
  );
}

/* ---------- Config ---------- */
function ConfigScreen({ user }) {
  const [tab, setTab] = useStateM('perfil');
  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <div className="page-head"><h1 className="page-title">Configuración</h1><p className="page-sub">Administra tu perfil, empresa y preferencias.</p></div>
      <div style={{ marginBottom: 22 }}><Tabs tabs={[{ id: 'perfil', label: 'Perfil', icon: 'user' }, { id: 'empresa', label: 'Empresa', icon: 'building' }, { id: 'prefs', label: 'Preferencias', icon: 'settings' }]} active={tab} onChange={setTab} /></div>

      {tab === 'perfil' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Avatar name={user.name} size={72} />
            <div><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>{user.name}</div><div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{user.email}</div>
              <div style={{ marginTop: 8 }}><Button size="sm" variant="secondary" icon="upload">Cambiar foto</Button></div></div>
          </div>
          <div className="divider" />
          <div className="grid-2" style={{ gap: 16 }}>
            <Field label="Nombre"><Input defaultValue="Diego" /></Field>
            <Field label="Apellido"><Input defaultValue="Parado" /></Field>
            <Field label="Email"><Input defaultValue={user.email} iconLeft="mail" /></Field>
            <Field label="Teléfono"><Input defaultValue="+52 55 1234 5678" iconLeft="phone" /></Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><Button variant="ghost">Cancelar</Button><Button variant="primary" icon="check">Guardar cambios</Button></div>
        </Card>
      )}
      {tab === 'empresa' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2" style={{ gap: 16 }}>
            <Field label="Razón social"><Input defaultValue="Grupo Logístico del Norte S.A." iconLeft="building" /></Field>
            <Field label="RFC"><Input defaultValue="GLN240615ABC" className="mono" /></Field>
            <Field label="Régimen fiscal"><Select defaultValue="601"><option value="601">601 — General de Ley Personas Morales</option><option>626 — RESICO</option></Select></Field>
            <Field label="Código postal fiscal"><Input defaultValue="64000" className="mono" /></Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><Button variant="primary" icon="check">Guardar</Button></div>
        </Card>
      )}
      {tab === 'prefs' && (
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          {[['Notificaciones por email', 'Recibe avisos de envíos y pagos', true], ['Alertas de rastreo en tiempo real', 'Push cuando el camión se acerca', true], ['Resumen semanal', 'Reporte cada lunes por la mañana', false], ['Facturación automática CFDI', 'Genera factura al confirmar pago', true]].map(([t, d, def], i) => (
            <React.Fragment key={i}>{i > 0 && <div className="divider" />}<PrefRow title={t} desc={d} def={def} /></React.Fragment>
          ))}
        </Card>
      )}
    </div>
  );
}

function PrefRow({ title, desc, def }) {
  const [on, setOn] = useStateM(def);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 0' }}>
      <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{title}</div><div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{desc}</div></div>
      <Toggle on={on} onClick={() => setOn(o => !o)} />
    </div>
  );
}

Object.assign(window, { EnviosScreen, CotizacionesScreen, SoporteScreen, ConfigScreen });

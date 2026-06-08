/* ============================================================
   FletApp — Rastreo (tracking)
   ============================================================ */
const { useState: useStateR, useEffect: useEffectR } = React;

function RastreoScreen({ navigate, params, toast }) {
  const s = SHIPMENTS.find(x => x.id === (params && params.id)) || SHIPMENTS[0];
  const [chatOpen, setChatOpen] = useStateR(false);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-title mono" style={{ fontSize: 24 }}>{s.id}</h1>
            <StatusBadge status={s.status} />
          </div>
          <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: 'var(--green-500)', animation: 'pulse-dot 2s infinite' }} />
            Última actualización hace 15 minutos · {s.origin} → {s.dest}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon="refresh" onClick={() => toast({ type: 'info', title: 'Ubicación actualizada', msg: 'El camión está en Aguascalientes' })}>Actualizar</Button>
          <Button variant="secondary" icon="share">Compartir</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="track-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <MapView route={ROUTE_CDMX_MTY} progress={s.progress} animate live currentLabel={s.current} eta={s.etaShort} height={420} />

          {/* timeline */}
          <Card pad={false}>
            <div style={{ padding: '18px 22px 6px' }}><div className="section-title">Línea de tiempo</div></div>
            <div style={{ padding: '12px 22px 22px' }}>
              {TIMELINE.map((t, i) => <TimelineItem key={i} t={t} last={i === TIMELINE.length - 1} />)}
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* progress */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Progreso del viaje</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{Math.round(s.progress * 100)}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--gray-100)', overflow: 'hidden' }}>
              <div style={{ width: `${s.progress * 100}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,var(--primary),var(--cyan-500))', transition: 'width 1s var(--ease-out)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-faint)' }}>
              <span>{s.oCode} · {s.depart.replace('Hoy, ', '')}</span><span>ETA {s.etaShort} · {s.dCode}</span>
            </div>
          </Card>

          {/* transporte */}
          <Card pad={false}>
            <InfoSection title="Transporte" icon="truck">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar name="Juan García" size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 650, color: 'var(--text-strong)', fontSize: 14 }}>Juan García</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Freightways MX · Conductor</div>
                </div>
                <Tooltip text="Llamar"><IconButton name="phone" size={18} onClick={() => toast({ type: 'info', title: 'Llamando a Juan García…', msg: '+52 555 123 4567' })} /></Tooltip>
                <Tooltip text="Chat"><IconButton name="chat" size={18} onClick={() => setChatOpen(true)} /></Tooltip>
              </div>
              <KV label="Camión" value="FORD F700" mono />
              <KV label="Placa" value="ABC-1234" mono />
              <KV label="Teléfono" value="+52 555 123 4567" mono />
            </InfoSection>
          </Card>

          {/* carga & pago */}
          <Card pad={false}>
            <InfoSection title="Carga" icon="package">
              <KV label="Contenedores" value={s.containers} />
              <KV label="Peso" value={s.weight} />
              <KV label="Descripción" value={s.cargo} />
              <KV label="Referencia" value="INV-2026-555" mono />
            </InfoSection>
            <div className="divider" />
            <InfoSection title="Pago" icon="dollar">
              <KV label="Total" value={fmtUSD(s.price) + ' USD'} mono strong />
              <KV label="Pagado" value={`${fmtUSD(s.paid)} (50%)`} mono />
              <KV label="Restante" value={`${fmtUSD(s.price - s.paid)} · al entregar`} mono />
            </InfoSection>
          </Card>

          {/* notifications */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Icon name="bell" size={18} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 650, color: 'var(--text-strong)', fontSize: 14 }}>Te notificaremos cuando…</span></div>
            <NotifToggle label="El camión esté cerca (30 min antes)" def />
            <NotifToggle label="Llegue a destino" def />
            <NotifToggle label="Haya cambios en la entrega" def={false} />
          </Card>
        </div>
      </div>

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

function TimelineItem({ t, last }) {
  const colors = { done: 'var(--green-500)', active: 'var(--primary)', future: 'var(--gray-400)' };
  const c = colors[t.state];
  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ width: 34, height: 34, borderRadius: '50%', background: t.state === 'future' ? '#fff' : c, border: `2px solid ${c}`, color: t.state === 'future' ? c : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: t.state === 'active' ? '0 0 0 4px var(--blue-50)' : 'none', zIndex: 1 }}>
          <Icon name={t.state === 'done' ? 'check' : t.icon} size={16} stroke={t.state === 'done' ? 3 : 2} />
        </span>
        {!last && <span style={{ width: 2, flex: 1, background: t.state === 'done' ? 'var(--green-500)' : 'var(--border)', minHeight: 28 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 22, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 650, color: 'var(--text-strong)', fontSize: 14, whiteSpace: 'nowrap' }}>{t.title}</span>
          {t.state === 'active' && <span className="badge badge-soft" style={{ '--bg': 'var(--blue-50)', '--fg': 'var(--primary)', fontSize: 10.5 }}>Actual</span>}
        </div>
        <div className="mono" style={{ fontSize: 12, color: c, fontWeight: 600, marginTop: 2 }}>{t.time}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{t.place}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 1 }}>{t.detail}</div>
      </div>
    </div>
  );
}

function InfoSection({ title, icon, children }) {
  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: 'var(--primary)' }}><Icon name={icon} size={16} /></span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function KV({ label, value, mono, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontSize: 13, fontWeight: strong ? 750 : 600, color: 'var(--text-strong)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function NotifToggle({ label, def }) {
  const [on, setOn] = useStateR(def);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '7px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
      <Toggle on={on} onClick={() => setOn(o => !o)} />
    </div>
  );
}

/* ---- chat modal ---- */
function ChatModal({ open, onClose }) {
  const [msgs, setMsgs] = useStateR([
    { from: 'agent', text: '¡Hola Diego! ¿Cómo podemos ayudarte hoy?', time: '4:32 PM' },
  ]);
  const [val, setVal] = useStateR('');
  const send = () => {
    if (!val.trim()) return;
    setMsgs(m => [...m, { from: 'me', text: val, time: '4:35 PM' }]);
    setVal('');
    setTimeout(() => setMsgs(m => [...m, { from: 'agent', text: 'Perfecto, déjame revisar el estatus de tu envío RES-2026-00145…', time: '4:35 PM' }]), 900);
  };
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420, height: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="María García" size={38} />
            <div><div style={{ fontWeight: 650, color: 'var(--text-strong)', fontSize: 14 }}>María García</div>
              <div style={{ fontSize: 12, color: 'var(--green-600)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 9, background: 'var(--green-500)' }} />En línea · responde en &lt; 2 min</div></div>
          </div>
          <IconButton name="close" size={20} sm onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--gray-50)' }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{ background: m.from === 'me' ? 'var(--primary)' : '#fff', color: m.from === 'me' ? '#fff' : 'var(--text-strong)', padding: '10px 14px', borderRadius: 14, borderBottomRightRadius: m.from === 'me' ? 4 : 14, borderBottomLeftRadius: m.from === 'me' ? 14 : 4, fontSize: 13.5, lineHeight: 1.45, boxShadow: 'var(--sh-sm)' }}>{m.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 14, borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input placeholder="Escribe un mensaje…" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ height: 42 }} />
          <Button variant="primary" size="md" onClick={send} style={{ width: 44, padding: 0, flexShrink: 0 }}><Icon name="send" size={18} /></Button>
        </div>
      </div>
    </div>
  );
}

window.RastreoScreen = RastreoScreen;

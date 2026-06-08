/* ============================================================
   FletApp — Tier 2: Facturas & Billing, Detalle de Envío, Detalle de Ticket
   ============================================================ */
const { useState: useStateT2 } = React;

const INV_STATUS = {
  paid:    { label: 'Pagada',    color: 'var(--green-600)', bg: 'var(--green-50)', icon: 'checkCircle' },
  pending: { label: 'Pendiente', color: 'var(--orange-600)', bg: 'var(--orange-50)', icon: 'clock' },
  overdue: { label: 'Vencida',   color: 'var(--red-500)', bg: 'var(--red-50)', icon: 'alertCircle' },
};
function InvBadge({ s }) {
  const c = INV_STATUS[s];
  return <span className="badge badge-soft" style={{ '--bg': c.bg, '--fg': c.color, fontSize: 11.5 }}><Icon name={c.icon} size={13} />{c.label}</span>;
}

/* small KV used across tier-2 screens */
function T2KV({ label, value, mono, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-faint)', flexShrink: 0 }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontSize: 13, fontWeight: strong ? 750 : 600, color: 'var(--text-strong)', textAlign: 'right', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

/* ============================================================
   FACTURAS & BILLING
   ============================================================ */
function FacturasScreen({ navigate, toast }) {
  const [tab, setTab] = useStateT2('facturas');
  const pending = INVOICES.filter(i => i.status === 'pending').reduce((a, b) => a + b.amount, 0);
  const paidMonth = INVOICES.filter(i => i.status === 'paid').reduce((a, b) => a + b.amount, 0);

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div><h1 className="page-title">Pagos & Facturas</h1><p className="page-sub">Administra tus facturas CFDI, pagos y métodos de cobro.</p></div>
        <Button variant="secondary" icon="download" onClick={() => toast({ type: 'success', title: 'Exportando facturas', msg: 'Se descargará un ZIP con XML + PDF' })}>Descargar todo</Button>
      </div>

      <div className="grid-3" style={{ marginBottom: 22 }}>
        <BillCard icon="dollar" color="var(--orange-600)" bg="var(--orange-50)" label="Pendiente por pagar" value={fmtUSD(pending)} sub={`${INVOICES.filter(i => i.status === 'pending').length} facturas`} cta="Pagar ahora" onCta={() => navigate('pago', { id: 'RES-2026-00143' })} />
        <BillCard icon="checkCircle" color="var(--green-600)" bg="var(--green-50)" label="Pagado este mes" value={fmtUSD(paidMonth)} sub="3 facturas liquidadas" />
        <BillCard icon="zap" color="var(--primary)" bg="var(--blue-50)" label="Crédito disponible" value="$5,000" sub="Línea FletApp · al corriente" />
      </div>

      <div style={{ marginBottom: 18 }}><Tabs tabs={[{ id: 'facturas', label: 'Facturas', icon: 'fileText' }, { id: 'pagos', label: 'Historial de pagos', icon: 'card' }, { id: 'metodos', label: 'Métodos de pago', icon: 'building' }]} active={tab} onChange={setTab} /></div>

      {tab === 'facturas' && (
        <Card pad={false}>
          <table className="data-table">
            <thead><tr><th>Factura</th><th>Concepto</th><th>Fecha</th><th>Estado</th><th style={{ textAlign: 'right' }}>Monto</th><th></th></tr></thead>
            <tbody>
              {INVOICES.map(inv => (
                <tr key={inv.id}>
                  <td><span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13 }}>{inv.id}</span><div className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 2 }}>CFDI {inv.uuid.slice(0, 18)}…</div></td>
                  <td><div style={{ fontSize: 13.5, color: 'var(--text-strong)', fontWeight: 550 }}>{inv.concept}</div><div className="mono" style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{inv.shipment}</div></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{inv.date}<div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Vence {inv.due}</div></td>
                  <td><InvBadge s={inv.status} /></td>
                  <td style={{ textAlign: 'right' }}><span className="mono tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{fmtUSD(inv.amount)}</span></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {inv.status === 'pending'
                      ? <Button size="sm" variant="success" onClick={() => navigate('pago', { id: inv.shipment })}>Pagar</Button>
                      : <div style={{ display: 'inline-flex', gap: 4 }}><Tooltip text="Descargar PDF"><IconButton name="download" size={17} sm onClick={() => toast({ type: 'success', title: `${inv.id}.pdf descargado` })} /></Tooltip><Tooltip text="Descargar XML"><IconButton name="fileText" size={17} sm onClick={() => toast({ type: 'success', title: `${inv.id}.xml descargado` })} /></Tooltip></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'pagos' && (
        <Card pad={false}>
          <table className="data-table">
            <thead><tr><th>Transacción</th><th>Factura</th><th>Método</th><th>Fecha</th><th style={{ textAlign: 'right' }}>Monto</th></tr></thead>
            <tbody>
              {INVOICES.filter(i => i.status === 'paid').map((inv, i) => (
                <tr key={inv.id}>
                  <td><span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13 }}>TRX-2026-{88450 - i}</span></td>
                  <td className="mono" style={{ fontSize: 13, color: 'var(--text)' }}>{inv.id}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{inv.method}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{inv.date}</td>
                  <td style={{ textAlign: 'right' }}><span className="mono tnum" style={{ fontWeight: 700, color: 'var(--green-600)' }}>{fmtUSD(inv.amount)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'metodos' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <Card>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Tarjetas guardadas</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid var(--border)', borderRadius: 12, marginBottom: 12 }}>
              <span style={{ width: 44, height: 30, borderRadius: 6, background: 'linear-gradient(135deg,#003399,#0066CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontStyle: 'italic', fontWeight: 800, fontSize: 11 }}>VISA</span>
              <div style={{ flex: 1 }}><div className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 14 }}>•••• 4242</div><div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Diego Parado · Exp 12/28</div></div>
              <span className="badge badge-soft" style={{ '--bg': 'var(--blue-50)', '--fg': 'var(--primary)', fontSize: 11 }}>Principal</span>
            </div>
            <Button variant="secondary" size="sm" icon="plus">Agregar tarjeta</Button>
          </Card>
          <Card>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Datos de facturación</div>
            <T2KV label="Razón social" value="Grupo Logístico del Norte S.A." />
            <T2KV label="RFC" value="GLN240615ABC" mono />
            <T2KV label="Régimen" value="601 — General Personas Morales" />
            <T2KV label="CP fiscal" value="64000" mono />
            <T2KV label="Uso CFDI" value="G03 — Gastos en general" />
          </Card>
        </div>
      )}
    </div>
  );
}

function BillCard({ icon, color, bg, label, value, sub, cta, onCta }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={21} /></span>
      </div>
      <div>
        <div className="mono tnum" style={{ fontSize: 28, fontWeight: 750, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>
      </div>
      {cta && <Button size="sm" variant="success" onClick={onCta} style={{ alignSelf: 'flex-start' }}>{cta}</Button>}
    </Card>
  );
}

/* ============================================================
   DETALLE DE ENVÍO
   ============================================================ */
function DetalleEnvioScreen({ navigate, params, toast }) {
  const s = SHIPMENTS.find(x => x.id === (params && params.id)) || SHIPMENTS[0];
  const route = [{ x: 52, y: 80, city: s.origin, type: 'origin' }, { x: 48, y: 64, city: 'Querétaro' }, { x: 43, y: 54, city: 'Irapuato' }, { x: 41, y: 42, city: 'Aguascalientes' }, { x: 58, y: 18, city: s.dest, type: 'dest' }];
  const iva = Math.round(s.price / 1.16 * 0.16);
  const base = s.price - iva;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-title mono" style={{ fontSize: 24 }}>{s.id}</h1>
            <StatusBadge status={s.status} />
          </div>
          <p className="page-sub">{s.origin} → {s.dest} · {s.containers} · {s.cargo}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {s.status === 'waiting' && <Button variant="success" icon="dollar" onClick={() => navigate('pago', { id: s.id })}>Pagar saldo</Button>}
          <Button variant="secondary" icon="mapPin" onClick={() => navigate('rastreo', { id: s.id })}>Rastrear en vivo</Button>
          <Button variant="secondary" icon="download" onClick={() => toast({ type: 'success', title: 'Carta porte descargada' })}>Carta porte</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="track-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <MapView route={route} progress={s.progress} animate height={300} eta={s.status === 'delivered' ? null : s.etaShort} />

          {/* desglose de costo */}
          <Card>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Desglose de costo</div>
            <T2KV label="Tarifa base de flete" value={fmtUSD(base - 350)} mono />
            <T2KV label="Peajes" value="$350" mono />
            <T2KV label="Subtotal" value={fmtUSD(base)} mono />
            <T2KV label="IVA (16%)" value={fmtUSD(iva)} mono />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 2px' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>Total</span>
              <span className="mono tnum" style={{ fontSize: 22, fontWeight: 750, color: 'var(--primary)' }}>{fmtUSD(s.price)}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              <div style={{ flex: 1, padding: 12, background: 'var(--green-50)', borderRadius: 10 }}><div style={{ fontSize: 11.5, color: 'var(--green-700)' }}>Pagado</div><div className="mono" style={{ fontWeight: 700, color: 'var(--green-700)' }}>{fmtUSD(s.paid)}</div></div>
              <div style={{ flex: 1, padding: 12, background: s.price - s.paid > 0 ? 'var(--orange-50)' : 'var(--gray-50)', borderRadius: 10 }}><div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Restante</div><div className="mono" style={{ fontWeight: 700, color: s.price - s.paid > 0 ? 'var(--orange-600)' : 'var(--text-strong)' }}>{fmtUSD(s.price - s.paid)}</div></div>
            </div>
          </Card>

          {/* documentos */}
          <Card>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Documentos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Carta porte (CFDI)', 'PDF · 248 KB'], ['Factura comercial', 'PDF · 180 KB'], ['Packing list', 'PDF · 96 KB'], ['Evidencia de entrega', s.status === 'delivered' ? 'JPG · 1.2 MB' : 'Pendiente']].map(([n, m], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border-soft)', borderRadius: 10 }}>
                  <span style={{ color: 'var(--primary)' }}><Icon name="fileText" size={20} /></span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>{n}</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{m}</div></div>
                  {m !== 'Pendiente' && <IconButton name="download" size={17} sm onClick={() => toast({ type: 'success', title: `${n} descargado` })} />}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Detalles del envío</div>
            <T2KV label="Origen" value={s.origin} />
            <T2KV label="Destino" value={s.dest} />
            <T2KV label="Distancia" value={s.distance} mono />
            <T2KV label="Tiempo" value={s.duration} mono />
            <T2KV label="Salida" value={s.depart} />
            <T2KV label={s.status === 'delivered' ? 'Entregado' : 'ETA'} value={s.eta} />
          </Card>
          <Card>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Carga</div>
            <T2KV label="Contenedores" value={s.containers} />
            <T2KV label="Peso" value={s.weight} mono />
            <T2KV label="Mercancía" value={s.cargo} />
            <T2KV label="Referencia" value="INV-2026-555" mono />
          </Card>
          <Card>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Transportista</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name="Juan García" size={42} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 650, color: 'var(--text-strong)', fontSize: 14 }}>Juan García</div><div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Freightways MX</div></div>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>ABC-1234</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DETALLE DE TICKET
   ============================================================ */
function TicketDetailScreen({ navigate, toast }) {
  const t = TICKET;
  const [msgs, setMsgs] = useStateT2(t.messages);
  const [val, setVal] = useStateT2('');
  const send = () => {
    if (!val.trim()) return;
    setMsgs(m => [...m, { from: 'me', name: 'Diego Parado', time: 'Ahora', text: val }]);
    setVal('');
    toast({ type: 'success', title: 'Mensaje enviado' });
    setTimeout(() => setMsgs(m => [...m, { from: 'agent', name: 'Carlos Méndez', time: 'Ahora', text: 'Gracias Diego, lo reviso enseguida y te confirmo.' }]), 1100);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="breadcrumb" style={{ marginBottom: 14 }}>
        <span className="crumb" onClick={() => navigate('soporte')}>Soporte</span><Icon name="chevronRight" size={14} /><span className="current">Ticket {t.id}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="track-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-strong)' }}>{t.subject}</h1>
                  <StatusBadge status={t.status} withIcon={false} />
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-faint)' }}>
                  <span className="mono">Ticket {t.id}</span><span>·</span><span>Categoría: {t.category}</span><span>·</span><span style={{ color: 'var(--red-500)', fontWeight: 600 }}>Prioridad {t.prio}</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 14, background: 'var(--gray-50)', borderRadius: 10, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55 }}>{t.description}</div>
          </Card>

          {/* conversación */}
          <Card pad={false}>
            <div style={{ padding: '16px 20px 4px' }}><div className="section-title" style={{ fontSize: 15 }}>Conversación</div></div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, flexDirection: m.from === 'me' ? 'row-reverse' : 'row' }}>
                  <Avatar name={m.name} size={36} />
                  <div style={{ maxWidth: '76%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexDirection: m.from === 'me' ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-strong)' }}>{m.name}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{m.time}</span>
                      {m.from === 'agent' && <span className="badge badge-soft" style={{ '--bg': 'var(--blue-50)', '--fg': 'var(--primary)', fontSize: 10 }}>Agente</span>}
                    </div>
                    <div style={{ background: m.from === 'me' ? 'var(--primary)' : '#fff', color: m.from === 'me' ? '#fff' : 'var(--text)', border: m.from === 'me' ? 'none' : '1px solid var(--border-soft)', padding: '11px 14px', borderRadius: 12, fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-line', boxShadow: 'var(--sh-sm)' }}>{m.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><Textarea placeholder="Escribe una respuesta…" value={val} onChange={e => setVal(e.target.value)} style={{ minHeight: 52 }} /></div>
              <Button variant="primary" icon="send" onClick={send}>Enviar</Button>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Detalles del ticket</div>
            <T2KV label="Estado" value={t.sLabel} />
            <T2KV label="Abierto" value={t.opened} />
            <T2KV label="Asignado a" value={t.agent} />
            <T2KV label="Envío" value={t.shipment} mono />
            <T2KV label="SLA respuesta" value={t.sla} />
            <div style={{ marginTop: 14, padding: 12, background: 'var(--orange-50)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="clock" size={16} style={{ color: 'var(--orange-600)' }} /><span style={{ fontSize: 12.5, color: '#9A5B00', fontWeight: 600 }}>Quedan {t.remaining} para cumplir SLA</span>
            </div>
          </Card>
          <Card>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Archivos adjuntos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {t.files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: '1px solid var(--border-soft)', borderRadius: 9 }}>
                  <span style={{ color: 'var(--text-muted)' }}><Icon name={f.icon} size={18} /></span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{f.name}</div><div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{f.meta}</div></div>
                  <IconButton name="download" size={16} sm onClick={() => toast({ type: 'success', title: `${f.name} descargado` })} />
                </div>
              ))}
            </div>
          </Card>
          <Button variant="secondary" block icon="checkCircle" onClick={() => { toast({ type: 'success', title: 'Ticket marcado como resuelto' }); navigate('soporte'); }}>Marcar como resuelto</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FacturasScreen, DetalleEnvioScreen, TicketDetailScreen });

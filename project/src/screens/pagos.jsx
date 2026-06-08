/* ============================================================
   FletApp — Pagos & confirmación
   ============================================================ */
const { useState: useStateP } = React;

function PagosScreen({ navigate, params, toast }) {
  const s = SHIPMENTS.find(x => x.id === (params && params.id)) || SHIPMENTS.find(x => x.status === 'waiting');
  const [method, setMethod] = useStateP('card');
  const [terms, setTerms] = useStateP(false);
  const [saveCard, setSaveCard] = useStateP(false);
  const [loading, setLoading] = useStateP(false);
  const [done, setDone] = useStateP(false);

  const subtotal = 2109, iva = 337.44, total = subtotal + iva, prevPaid = 3171.56;

  const pay = () => {
    if (!terms) { toast({ type: 'warning', title: 'Acepta los términos de pago' }); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1600);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'var(--orange-50)', border: '1px solid #FFE0B2', marginBottom: 22 }}>
        <Icon name="alertCircle" size={20} style={{ color: 'var(--orange-600)' }} />
        <span style={{ fontSize: 14, color: '#9A5B00', fontWeight: 600 }}>Envío llegado — esperando pago final para liberar la entrega.</span>
      </div>

      <div className="page-head">
        <h1 className="page-title">Confirmar pago</h1>
        <p className="page-sub mono">{s.id} · {s.origin} → {s.dest}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 22, alignItems: 'start' }} className="pay-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* método */}
          <Card pad={false}>
            <div style={{ padding: '18px 20px 4px' }}><div className="section-title">Método de pago</div></div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PayMethod active={method === 'card'} onClick={() => setMethod('card')} icon="card" title="Tarjeta de crédito / débito" sub="Visa terminación 4242" />
              {method === 'card' && <CardDetail />}
              <PayMethod active={method === 'transfer'} onClick={() => setMethod('transfer')} icon="building" title="Transferencia bancaria (SPEI)" sub="CLABE 002154007000000 · Banamex" />
              <PayMethod active={method === 'credit'} onClick={() => setMethod('credit')} icon="zap" title="Usar crédito FletApp" sub="Disponible: $5,000 USD" />
            </div>
          </Card>

          <label className="check" style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 12, background: '#fff' }}>
            <input type="checkbox" checked={terms} onChange={() => setTerms(t => !t)} />
            <span className="box"><Icon name="check" size={14} stroke={3} /></span>
            <span style={{ fontSize: 14 }}>Acepto los <a style={{ color: 'var(--primary)', fontWeight: 600 }}>términos de pago</a> y confirmo la recepción del envío.</span>
          </label>
        </div>

        {/* resumen */}
        <Card style={{ position: 'sticky', top: 84 }}>
          <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Resumen de pago</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <PRow label="Subtotal (tras 50% inicial)" value={subtotal} />
            <PRow label="IVA (16%)" value={iva} muted />
            <div className="divider" style={{ margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>Total a pagar</span>
              <span className="mono tnum" style={{ fontSize: 24, fontWeight: 750, color: 'var(--primary)' }}>{fmtUSD(total)}</span>
            </div>
          </div>
          <div style={{ margintop: 14, padding: 12, marginTop: 14, background: 'var(--gray-50)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PRow label="Ya pagado (50%)" value={prevPaid} small />
            <PRow label="Costo total del envío" value={6618} small strong />
          </div>
          <Button variant="success" size="lg" block icon={loading ? null : 'lock'} loading={loading} onClick={pay} style={{ marginTop: 16 }}>
            {loading ? 'Procesando…' : `Confirmar pago · ${fmtUSD(total)}`}
          </Button>
          <Button variant="ghost" size="md" block onClick={() => navigate('dashboard')} style={{ marginTop: 6 }}>Cancelar</Button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 14, fontSize: 12, color: 'var(--text-faint)' }}>
            <Icon name="shield" size={15} /> Pagos seguros cifrados con Stripe
          </div>
        </Card>
      </div>

      <PaymentSuccess open={done} total={total} onClose={() => { setDone(false); navigate('dashboard'); }} toast={toast} />
    </div>
  );
}

function PayMethod({ active, onClick, icon, title, sub }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`, background: active ? 'var(--blue-50)' : '#fff', textAlign: 'left', transition: 'all var(--dur-quick)' }}>
      <span className="check"><span className="box radio" style={{ borderColor: active ? 'var(--primary)' : 'var(--gray-400)', borderWidth: active ? 6 : 1.5 }} /></span>
      <span style={{ width: 40, height: 40, borderRadius: 9, background: active ? '#fff' : 'var(--gray-100)', color: active ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: active ? 'var(--sh-sm)' : 'none' }}><Icon name={icon} size={20} /></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)' }}>{title}</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  );
}

function CardDetail() {
  return (
    <div className="enter-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 4px 8px' }}>
      <div style={{ position: 'relative', borderRadius: 14, padding: 20, color: '#fff', background: 'linear-gradient(135deg,#003399,#0066CC)', boxShadow: 'var(--sh-md)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ width: 38, height: 28, borderRadius: 5, background: 'linear-gradient(135deg,#FFD66B,#E0A82E)' }} />
          <span style={{ fontWeight: 800, fontStyle: 'italic', fontSize: 18, letterSpacing: '-0.02em' }}>VISA</span>
        </div>
        <div className="mono" style={{ fontSize: 18, letterSpacing: '0.12em', marginTop: 22 }}>••••　••••　••••　4242</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12 }}>
          <div><div style={{ opacity: 0.7, fontSize: 9, textTransform: 'uppercase' }}>Titular</div><div style={{ fontWeight: 600 }}>Diego Parado</div></div>
          <div><div style={{ opacity: 0.7, fontSize: 9, textTransform: 'uppercase' }}>Expira</div><div className="mono" style={{ fontWeight: 600 }}>12/28</div></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button size="sm" variant="secondary" icon="refresh">Cambiar tarjeta</Button>
        <Button size="sm" variant="secondary" icon="plus">Agregar nueva</Button>
      </div>
    </div>
  );
}

function PRow({ label, value, muted, strong, small }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: small ? '2px 0' : '5px 0' }}>
      <span style={{ fontSize: small ? 12.5 : 13.5, color: muted ? 'var(--text-faint)' : 'var(--text-muted)' }}>{label}</span>
      <span className="mono tnum" style={{ fontSize: small ? 12.5 : 14, fontWeight: strong ? 750 : 600, color: strong ? 'var(--text-strong)' : 'var(--text)' }}>{fmtUSD(value)}</span>
    </div>
  );
}

function PaymentSuccess({ open, total, onClose, toast }) {
  if (!open) return null;
  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', animation: 'scaleIn 0.4s var(--ease-out)' }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--green-500)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={28} stroke={3} /></span>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 750, color: 'var(--text-strong)' }}>¡Pago confirmado!</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, marginBottom: 20 }}>Tu envío ha sido marcado como <strong style={{ color: 'var(--green-600)' }}>Entregado</strong>.</p>
          <div style={{ background: 'var(--gray-50)', borderRadius: 12, padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <KVrow label="Transacción" value="TRX-2026-88453" />
            <KVrow label="Monto" value={fmtUSD(total) + ' USD'} />
            <KVrow label="Método" value="Visa ••••4242" />
            <KVrow label="Fecha" value="7 jun 2026, 5:30 PM" />
            <KVrow label="Confirmación" value="RCP-00143" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Button variant="secondary" block icon="download" onClick={() => toast({ type: 'success', title: 'Recibo descargado', msg: 'RCP-00143.pdf' })}>Recibo PDF</Button>
            <Button variant="secondary" block icon="mail" onClick={() => toast({ type: 'success', title: 'Recibo enviado a tu correo' })}>Enviar</Button>
          </div>
          <Button variant="primary" block onClick={onClose} style={{ marginTop: 10 }}>Volver al dashboard</Button>
        </div>
      </div>
    </div>
  );
}

function KVrow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{label}</span>
      <span className="mono" style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-strong)' }}>{value}</span>
    </div>
  );
}

window.PagosScreen = PagosScreen;

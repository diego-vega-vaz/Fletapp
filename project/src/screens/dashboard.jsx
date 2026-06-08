/* ============================================================
   FletApp — Dashboard
   ============================================================ */
const { useState: useStateDash } = React;

function KpiCard({ icon, iconBg, iconColor, label, value, unit, delta, deltaUp }) {
  return (
    <Card hover style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={21} /></span>
        {delta && <span className="badge badge-soft" style={{ '--bg': deltaUp ? 'var(--green-50)' : 'var(--red-50)', '--fg': deltaUp ? 'var(--green-600)' : 'var(--red-500)', fontSize: 11.5 }}><Icon name="trendingUp" size={12} style={{ transform: deltaUp ? 'none' : 'scaleY(-1)' }} />{delta}</span>}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="tnum" style={{ fontSize: 34, fontWeight: 750, color: 'var(--text-strong)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
          {unit && <span style={{ fontSize: 14, color: 'var(--text-faint)', fontWeight: 600 }}>{unit}</span>}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
      </div>
    </Card>
  );
}

function MiniChart() {
  const data = [14, 18, 16, 22, 19, 26];
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const W = 640, H = 200, pad = 28;
  const max = 30, min = 0;
  const xs = (i) => pad + i * ((W - pad * 2) / (data.length - 1));
  const ys = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const line = data.map((v, i) => `${xs(i)},${ys(v)}`).join(' ');
  const area = `${pad},${H - pad} ${line} ${xs(data.length - 1)},${H - pad}`;
  const [hover, setHover] = useStateDash(5);
  return (
    <Card>
      <div className="section-head" style={{ marginBottom: 4 }}>
        <div>
          <div className="section-title">Envíos · últimos 6 meses</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Total <strong className="tnum" style={{ color: 'var(--text-strong)' }}>115</strong> envíos · <span style={{ color: 'var(--green-600)', fontWeight: 600 }}>+18% vs semestre anterior</span></div>
        </div>
        <Segmented options={[{ value: '6m', label: '6 meses' }, { value: '12m', label: '12 meses' }]} value="6m" onChange={() => {}} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', marginTop: 8 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0066CC" stopOpacity="0.18" /><stop offset="1" stopColor="#0066CC" stopOpacity="0" /></linearGradient>
        </defs>
        {[0, 10, 20, 30].map(g => <g key={g}><line x1={pad} x2={W - pad} y1={ys(g)} y2={ys(g)} stroke="var(--border-soft)" strokeWidth="1" /><text x={0} y={ys(g) + 4} fontSize="11" fill="var(--text-faint)">{g}</text></g>)}
        <polygon points={area} fill="url(#areaGrad)" />
        <polyline points={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: 'pointer' }}>
            <rect x={xs(i) - 24} y={0} width={48} height={H} fill="transparent" />
            <text x={xs(i)} y={H - 6} fontSize="11.5" fill="var(--text-faint)" textAnchor="middle" fontWeight="600">{labels[i]}</text>
            <circle cx={xs(i)} cy={ys(v)} r={hover === i ? 6 : 4} fill="#fff" stroke="var(--primary)" strokeWidth="2.5" />
            {hover === i && <g><rect x={xs(i) - 20} y={ys(v) - 34} width="40" height="24" rx="6" fill="var(--gray-900)" /><text x={xs(i)} y={ys(v) - 18} fontSize="12" fill="#fff" textAnchor="middle" fontWeight="700">{v}</text></g>}
          </g>
        ))}
      </svg>
    </Card>
  );
}

function ShipmentRow({ s, navigate, onPay }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 4px' }}>
      <span style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--gray-50)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}><Icon name="package" size={22} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13.5 }}>{s.id}</span>
          <StatusBadge status={s.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, fontSize: 13.5, color: 'var(--text)' }}>
          <span style={{ fontWeight: 600 }}>{s.oCode}</span><Icon name="arrowRight" size={14} style={{ color: 'var(--text-faint)' }} /><span style={{ fontWeight: 600 }}>{s.dCode}</span>
          <span style={{ color: 'var(--gray-300)' }}>·</span><span style={{ color: 'var(--text-muted)' }}>{s.origin} → {s.dest}</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 3 }}>
          {s.status === 'transit' ? `Salida: ${s.depart} · ETA: ${s.eta}` : s.status === 'delivered' ? `Entregado: ${s.eta}` : `Llegada: ${s.eta} · Esperando pago final`}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="mono tnum" style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 15 }}>{fmtUSD(s.price)}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>USD</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {s.status === 'waiting'
          ? <Button size="sm" variant="success" icon="dollar" onClick={onPay}>Pagar</Button>
          : s.status === 'transit'
            ? <Button size="sm" variant="secondary" icon="mapPin" onClick={() => navigate('rastreo', { id: s.id })}>Rastrear</Button>
            : <Button size="sm" variant="ghost" iconRight="chevronRight" onClick={() => navigate('detalle', { id: s.id })}>Ver</Button>}
      </div>
    </div>
  );
}

function DashboardScreen({ navigate, user, onPay }) {
  const recent = SHIPMENTS.slice(0, 3);
  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Buenos días, {user.name.split(' ')[0]} 👋</h1>
          <p className="page-sub">Lunes, 7 de junio 2026 · Tienes <strong style={{ color: 'var(--text)' }}>3 envíos activos</strong> y <strong style={{ color: 'var(--orange-600)' }}>1 pago pendiente</strong>.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => navigate('cotizacion')}>Nueva cotización</Button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <KpiCard icon="fileText" iconBg="var(--blue-50)" iconColor="var(--primary)" value="12" label="Cotizaciones este mes" delta="+3" deltaUp />
        <KpiCard icon="clock" iconBg="var(--orange-50)" iconColor="var(--orange-600)" value="3" label="Pagos pendientes" delta="−1" deltaUp={false} />
        <KpiCard icon="dollar" iconBg="var(--green-50)" iconColor="var(--green-600)" value="$28.5K" unit="USD" label="Ingresos del mes" delta="+12%" deltaUp />
        <KpiCard icon="truck" iconBg="var(--cyan-50)" iconColor="var(--cyan-500)" value="2.3" unit="días" label="Promedio de entrega" delta="−0.4" deltaUp />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="dash-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card pad={false}>
            <div className="section-head" style={{ padding: '18px 20px 6px', marginBottom: 0 }}>
              <div className="section-title">Últimos envíos</div>
              <Button size="sm" variant="ghost" iconRight="arrowRight" onClick={() => navigate('envios')}>Ver todos</Button>
            </div>
            <div style={{ padding: '0 20px 8px' }}>
              {recent.map((s, i) => (
                <React.Fragment key={s.id}>{i > 0 && <div className="divider" />}<ShipmentRow s={s} navigate={navigate} onPay={() => onPay(s.id)} /></React.Fragment>
              ))}
            </div>
          </Card>
          <MiniChart />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card pad={false}>
            <div style={{ padding: '18px 20px 10px' }}><div className="section-title">Próximas acciones</div></div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ActionItem color="var(--orange-500)" icon="fileText" title="Acepta tu cotización" code="RES-2026-00146" meta="Vence hoy a las 5:00 PM" btn="Aceptar" btnVariant="primary" onClick={() => navigate('cotizacion')} />
              <ActionItem color="var(--red-500)" icon="dollar" title="Pago pendiente" code="RES-2026-00143" meta="$2,446.44 USD · al entregar" btn="Pagar" btnVariant="success" onClick={() => onPay('RES-2026-00143')} />
            </div>
          </Card>

          <Card pad={false}>
            <div style={{ padding: '18px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title">Noticias & avisos</div><span style={{ color: 'var(--primary)' }}><Icon name="bell" size={18} /></span>
            </div>
            <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <NewsItem tag="Tarifas" tagColor="var(--orange-600)" tagBg="var(--orange-50)" text="Aumento de tarifa en ruta CDMX–MTY a partir del 15 de junio." />
              <div className="divider" />
              <NewsItem tag="Aduanas" tagColor="var(--primary)" tagBg="var(--blue-50)" text="Nuevo agente aduanal disponible en el puerto de Veracruz." />
              <div className="divider" />
              <NewsItem tag="Plataforma" tagColor="var(--green-600)" tagBg="var(--green-50)" text="Ahora puedes descargar facturas CFDI 4.0 desde Pagos." />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ color, icon, title, code, meta, btn, btnVariant, onClick }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 12, border: '1px solid var(--border-soft)', background: 'var(--gray-50)' }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--sh-sm)' }}><Icon name={icon} size={18} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--text-strong)' }}>{title}</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{code}</div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 3 }}>{meta}</div>
        <div style={{ marginTop: 10 }}><Button size="sm" variant={btnVariant} onClick={onClick}>{btn}</Button></div>
      </div>
    </div>
  );
}

function NewsItem({ tag, tagColor, tagBg, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span className="badge badge-soft" style={{ '--bg': tagBg, '--fg': tagColor, alignSelf: 'flex-start', fontSize: 11 }}>{tag}</span>
      <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;

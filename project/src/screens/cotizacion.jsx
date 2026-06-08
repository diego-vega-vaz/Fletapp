/* ============================================================
   FletApp — Nueva Cotización (wizard 4 pasos)
   ============================================================ */
const { useState: useStateQ, useMemo: useMemoQ } = React;

const CITIES = ['Ciudad de México', 'Monterrey', 'Guadalajara', 'Querétaro', 'Veracruz', 'Tijuana', 'Mérida', 'Puebla', 'León', 'Hermosillo', 'Cancún'];

function CotizacionScreen({ navigate, toast }) {
  const [step, setStep] = useStateQ(0);
  const [data, setData] = useStateQ({
    origin: 'Ciudad de México', dest: 'Monterrey', cargoType: 'container', containers: 2, weight: '12000',
    description: 'Equipos industriales para línea de ensamble', special: {}, customs: 'yes', operation: 'Importación', incoterm: 'DDP',
    docs: { invoice: true, packing: true, bol: false, certs: false }, terms: false,
  });
  const [errors, setErrors] = useStateQ({});
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const price = useMemoQ(() => {
    const base = data.containers * 1600;
    const tolls = 350;
    let special = 0;
    if (data.special.frozen) special += 800;
    if (data.special.hazard) special += 1200;
    if (data.special.oog) special += 950;
    const customs = data.customs === 'yes' ? 2500 : 0;
    const subtotal = base + tolls + special;
    const iva = Math.round((subtotal + customs) * 0.16);
    return { base, tolls, special, customs, subtotal, iva, total: subtotal + customs + iva };
  }, [data]);

  const steps = ['Detalles', 'Ruta', 'Aduanas', 'Resumen'];

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (data.origin === data.dest) e.dest = 'El destino debe ser distinto al origen';
      if (!data.containers || data.containers < 1) e.containers = 'Cantidad inválida';
      if ((data.description || '').length < 10) e.description = 'Describe la mercancía (mín. 10 caracteres)';
    }
    if (step === 2 && data.customs === 'yes') {
      if (!data.docs.invoice || !data.docs.packing) e.docs = 'La factura y el packing list son obligatorios';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) { setStep(s => Math.min(s + 1, 3)); window.scrollTo({ top: 0 }); } else { toast({ type: 'error', title: 'Revisa los campos marcados' }); } };
  const back = () => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0 }); };
  const accept = () => {
    if (!data.terms) { toast({ type: 'warning', title: 'Acepta los términos para continuar' }); return; }
    toast({ type: 'success', title: 'Cotización aceptada', msg: 'RES-2026-00147 creada · te llevamos al rastreo' });
    setTimeout(() => navigate('rastreo', { id: 'RES-2026-00145' }), 900);
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="page-head">
        <h1 className="page-title">Nueva cotización</h1>
        <p className="page-sub">Paso {step + 1} de 4 · {['Ingresa los detalles del envío', 'Verifica tu ruta', 'Información aduanal', 'Revisa y confirma'][step]}</p>
      </div>

      <div style={{ marginBottom: 26 }}><Steps steps={steps} current={step} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: step === 3 ? '1fr' : 'minmax(0,1fr) 280px', gap: 22, alignItems: 'start' }} className="quote-cols">
        <div className="enter-up" key={step}>
          {step === 0 && <Step1 data={data} set={set} errors={errors} />}
          {step === 1 && <Step2 data={data} />}
          {step === 2 && <Step3 data={data} set={set} errors={errors} />}
          {step === 3 && <Step4 data={data} price={price} set={set} />}
        </div>

        {step !== 3 && (
          <Card style={{ position: 'sticky', top: 84 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimado en vivo</div>
            <div className="mono tnum" style={{ fontSize: 32, fontWeight: 750, color: 'var(--text-strong)', margin: '8px 0 2px', letterSpacing: '-0.02em' }}>{fmtUSD(price.total)}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>USD · IVA incluido</div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <PriceRow label={`Tarifa base (${data.containers} cont.)`} value={price.base} />
            <PriceRow label="Peajes" value={price.tolls} />
            {price.special > 0 && <PriceRow label="Manejo especial" value={price.special} />}
            {price.customs > 0 && <PriceRow label="Aduanas" value={price.customs} />}
            <PriceRow label="IVA (16%)" value={price.iva} muted />
            <div style={{ marginTop: 14, padding: 12, background: 'var(--blue-50)', borderRadius: 10, fontSize: 12, color: 'var(--primary)', display: 'flex', gap: 8 }}>
              <Icon name="info" size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>Incluye <strong>8 horas</strong> de carga gratis. Después: $40/hora.</span>
            </div>
          </Card>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28, maxWidth: step === 3 ? 820 : 'none' }}>
        {step === 0
          ? <Button variant="ghost" icon="close" onClick={() => navigate('dashboard')}>Cancelar</Button>
          : <Button variant="secondary" icon="arrowLeft" onClick={back}>Atrás</Button>}
        {step < 3
          ? <Button variant="primary" iconRight="arrowRight" onClick={next}>Siguiente</Button>
          : <Button variant="success" icon="checkCircle" onClick={accept}>Aceptar cotización · {fmtUSD(price.total)}</Button>}
      </div>
    </div>
  );
}

function PriceRow({ label, value, muted, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
      <span style={{ fontSize: 13, color: muted ? 'var(--text-faint)' : 'var(--text-muted)' }}>{label}</span>
      <span className="mono tnum" style={{ fontSize: 13.5, fontWeight: strong ? 750 : 600, color: strong ? 'var(--text-strong)' : 'var(--text)' }}>{fmtUSD(value)}</span>
    </div>
  );
}

/* ---- Step 1 ---- */
function Step1({ data, set, errors }) {
  const cargoOpts = [
    { v: 'container', label: 'Contenedor', sub: '20ft / 40ft / 40ft HC', icon: 'box' },
    { v: 'general', label: 'Carga general / OOG', sub: 'Sobredimensionada', icon: 'package' },
    { v: 'mixed', label: 'Mixto', sub: 'Combinación', icon: 'package' },
  ];
  const specials = [{ k: 'fragile', label: 'Frágil' }, { k: 'hazard', label: 'Peligroso' }, { k: 'frozen', label: 'Refrigerado' }, { k: 'oog', label: 'Oversized (OOG)' }];
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="grid-2" style={{ gap: 16 }}>
        <Field label="Ciudad de origen" required>
          <Select value={data.origin} onChange={e => set('origin', e.target.value)}>{CITIES.map(c => <option key={c}>{c}</option>)}</Select>
        </Field>
        <Field label="Ciudad de destino" required error={errors.dest}>
          <Select value={data.dest} onChange={e => set('dest', e.target.value)} error={!!errors.dest}>{CITIES.map(c => <option key={c}>{c}</option>)}</Select>
        </Field>
      </div>

      <Field label="Tipo de carga" required>
        <div className="grid-3" style={{ gap: 12 }}>
          {cargoOpts.map(o => (
            <button key={o.v} onClick={() => set('cargoType', o.v)} style={{ textAlign: 'left', padding: 14, borderRadius: 12, border: `1.5px solid ${data.cargoType === o.v ? 'var(--primary)' : 'var(--border)'}`, background: data.cargoType === o.v ? 'var(--blue-50)' : '#fff', transition: 'all var(--dur-quick)' }}>
              <span style={{ color: data.cargoType === o.v ? 'var(--primary)' : 'var(--text-muted)' }}><Icon name={o.icon} size={22} /></span>
              <div style={{ fontWeight: 650, color: 'var(--text-strong)', fontSize: 14, marginTop: 8 }}>{o.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{o.sub}</div>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid-2" style={{ gap: 16 }}>
        <Field label="Cantidad de contenedores" required error={errors.containers}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: `1px solid ${errors.containers ? 'var(--red-500)' : 'var(--border)'}`, borderRadius: 6, width: 'fit-content', overflow: 'hidden' }}>
            <button className="icon-btn" style={{ borderRadius: 0 }} onClick={() => set('containers', Math.max(1, data.containers - 1))}><Icon name="close" size={14} stroke={2.5} style={{ transform: 'rotate(45deg)' }} /></button>
            <span className="mono tnum" style={{ width: 56, textAlign: 'center', fontWeight: 700, fontSize: 16, color: 'var(--text-strong)' }}>{data.containers}</span>
            <button className="icon-btn" style={{ borderRadius: 0 }} onClick={() => set('containers', data.containers + 1)}><Icon name="plus" size={14} stroke={2.5} /></button>
          </div>
        </Field>
        <Field label="Peso aproximado" hint="Opcional">
          <Input iconRight="package" type="number" value={data.weight} onChange={e => set('weight', e.target.value)} placeholder="kg" />
        </Field>
      </div>

      <Field label="Descripción de la mercancía" required error={errors.description}>
        <Textarea value={data.description} onChange={e => set('description', e.target.value)} placeholder="Describe la mercancía a transportar…" error={!!errors.description} />
      </Field>

      <Field label="¿Requiere manejo especial?">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {specials.map(s => {
            const on = !!data.special[s.k];
            return <button key={s.k} onClick={() => set('special', { ...data.special, [s.k]: !on })} className="chip" style={{ borderColor: on ? 'var(--primary)' : 'transparent', background: on ? 'var(--blue-50)' : 'var(--gray-100)', color: on ? 'var(--primary)' : 'var(--text)', fontWeight: on ? 650 : 500 }}>
              {on && <Icon name="check" size={14} stroke={3} />}{s.label}
            </button>;
          })}
        </div>
      </Field>
    </Card>
  );
}

/* ---- Step 2 ---- */
function Step2({ data }) {
  const route = [{ x: 52, y: 80, city: data.origin, type: 'origin' }, { x: 48, y: 64, city: 'Querétaro' }, { x: 43, y: 54, city: 'Irapuato' }, { x: 41, y: 42, city: 'Aguascalientes' }, { x: 58, y: 18, city: data.dest, type: 'dest' }];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <MapView route={route} progress={1} animate height={360} eta={null} />
      <div className="grid-2" style={{ gap: 12 }}>
        <Button variant="secondary" size="sm" icon="edit">Editar origen</Button>
        <Button variant="secondary" size="sm" icon="edit">Editar destino</Button>
      </div>
      <Card>
        <div className="section-title" style={{ marginBottom: 14, fontSize: 15 }}>Detalles de la ruta</div>
        <div className="grid-2" style={{ gap: 14 }}>
          <RouteStat icon="route" label="Distancia" value="968 km" />
          <RouteStat icon="clock" label="Tiempo estimado" value="18 – 20 horas" />
          <RouteStat icon="dollar" label="Peajes estimados" value="$350 USD" />
          <RouteStat icon="zap" label="Complejidad" value="Baja" color="var(--green-600)" />
        </div>
      </Card>
    </div>
  );
}

function RouteStat({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: 'var(--gray-50)', borderRadius: 10 }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)' }}><Icon name={icon} size={18} /></span>
      <div><div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{label}</div><div style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--text-strong)' }}>{value}</div></div>
    </div>
  );
}

/* ---- Step 3 ---- */
function Step3({ data, set, errors }) {
  const docs = [{ k: 'invoice', label: 'Factura (Invoice)', req: true }, { k: 'packing', label: 'Packing List', req: true }, { k: 'bol', label: 'Bill of Lading', req: false }, { k: 'certs', label: 'Certificados', req: false }];
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="¿Requiere gestión aduanal?" required>
        <div style={{ display: 'flex', gap: 12 }}>
          {[{ v: 'yes', label: 'Sí', sub: '+ $2,500 USD' }, { v: 'no', label: 'No', sub: 'Sin trámite' }].map(o => (
            <button key={o.v} onClick={() => set('customs', o.v)} style={{ flex: 1, textAlign: 'left', padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${data.customs === o.v ? 'var(--primary)' : 'var(--border)'}`, background: data.customs === o.v ? 'var(--blue-50)' : '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="check"><span className={`box radio`} style={{ borderColor: data.customs === o.v ? 'var(--primary)' : 'var(--gray-400)', borderWidth: data.customs === o.v ? 6 : 1.5 }} /></span>
              <div><div style={{ fontWeight: 650, color: 'var(--text-strong)' }}>{o.label}</div><div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{o.sub}</div></div>
            </button>
          ))}
        </div>
      </Field>

      {data.customs === 'yes' && (
        <div className="enter-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2" style={{ gap: 16 }}>
            <Field label="Tipo de operación" required>
              <Select value={data.operation} onChange={e => set('operation', e.target.value)}>{['Importación', 'Exportación', 'Intra-tránsito', 'Maquiladora'].map(o => <option key={o}>{o}</option>)}</Select>
            </Field>
            <Field label="Incoterm" required>
              <Select value={data.incoterm} onChange={e => set('incoterm', e.target.value)}>{['DDP — Delivered Duty Paid', 'DAP — Delivered At Place', 'FOB — Free On Board', 'EXW — Ex Works', 'CIF — Cost Insurance Freight'].map(o => <option key={o} value={o.split(' ')[0]}>{o}</option>)}</Select>
            </Field>
          </div>

          <Field label="Documentos a cargar" required error={errors.docs}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.map(d => {
                const on = !!data.docs[d.k];
                return (
                  <div key={d.k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${on ? 'var(--green-500)' : 'var(--border)'}`, background: on ? 'var(--green-50)' : '#fff' }}>
                    <span style={{ color: on ? 'var(--green-600)' : 'var(--text-faint)' }}><Icon name={on ? 'checkCircle' : 'fileText'} size={20} /></span>
                    <div style={{ flex: 1 }}><span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{d.label}</span>{d.req && <span style={{ color: 'var(--red-500)', marginLeft: 4 }}>*</span>}
                      {on && <span style={{ fontSize: 12, color: 'var(--green-600)', marginLeft: 8 }}>· archivo.pdf</span>}</div>
                    <Button size="sm" variant={on ? 'ghost' : 'secondary'} icon={on ? 'check' : 'upload'} onClick={() => set('docs', { ...data.docs, [d.k]: !on })}>{on ? 'Cargado' : 'Cargar'}</Button>
                  </div>
                );
              })}
            </div>
          </Field>

          <Field label="Notas adicionales" hint="Opcional">
            <Textarea placeholder="Instrucciones especiales para el agente aduanal…" style={{ minHeight: 80 }} />
          </Field>
        </div>
      )}
    </Card>
  );
}

/* ---- Step 4 ---- */
function Step4({ data, price, set }) {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="grid-2" style={{ gap: 18 }}>
        <Card>
          <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Detalles del envío</div>
          <SummaryRow label="Origen" value={data.origin} />
          <SummaryRow label="Destino" value={data.dest} />
          <SummaryRow label="Tipo" value={`${data.containers}× Contenedor 20ft`} />
          <SummaryRow label="Mercancía" value={data.description} />
          <SummaryRow label="Manejo especial" value={Object.keys(data.special).filter(k => data.special[k]).length ? Object.keys(data.special).filter(k => data.special[k]).join(', ') : 'Ninguno'} />
        </Card>
        <Card>
          <div className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Ruta & aduanas</div>
          <SummaryRow label="Distancia" value="968 km" />
          <SummaryRow label="Tiempo" value="18 – 20 horas" />
          <SummaryRow label="Peajes" value="$350 USD" />
          <SummaryRow label="Aduanas" value={data.customs === 'yes' ? `Sí · ${data.operation}` : 'No'} />
          <SummaryRow label="Incoterm" value={data.incoterm} />
        </Card>
      </div>

      <Card style={{ background: 'linear-gradient(180deg,#fff,var(--gray-50))' }}>
        <div className="section-title" style={{ fontSize: 15, marginBottom: 16 }}>Desglose de precio</div>
        <PriceRow label={`Tarifa base (${data.containers} contenedores)`} value={price.base} />
        <PriceRow label="Peajes" value={price.tolls} />
        {price.special > 0 && <PriceRow label="Manejo especial" value={price.special} />}
        <div className="divider" style={{ margin: '10px 0' }} />
        <PriceRow label="Subtotal" value={price.subtotal} strong />
        {price.customs > 0 && <PriceRow label="Gestión aduanal" value={price.customs} />}
        <PriceRow label="IVA (16%)" value={price.iva} muted />
        <div className="divider" style={{ margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Total</span>
          <span className="mono tnum" style={{ fontSize: 28, fontWeight: 750, color: 'var(--primary)' }}>{fmtUSD(price.total)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, background: 'var(--blue-50)', borderRadius: 10, fontSize: 12.5, color: 'var(--primary)' }}>
          <Icon name="info" size={16} /> Incluye 8 horas de carga gratis. Cargo adicional: $40 USD/hora. · Válido hasta hoy a las 5:00 PM.
        </div>
      </Card>

      <label className="check" style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 12, background: '#fff' }}>
        <input type="checkbox" checked={data.terms} onChange={() => set('terms', !data.terms)} />
        <span className="box"><Icon name="check" size={14} stroke={3} /></span>
        <span style={{ fontSize: 14 }}>He revisado y acepto los <a style={{ color: 'var(--primary)', fontWeight: 600 }}>términos y condiciones</a> de transporte y la política de cancelación.</span>
      </label>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '7px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-faint)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

window.CotizacionScreen = CotizacionScreen;

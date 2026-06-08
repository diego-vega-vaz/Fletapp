/* ============================================================
   FletApp — App router + Tweaks
   ============================================================ */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const USER = { name: 'Diego Parado', company: 'Grupo Logístico del Norte', email: 'diego@grupologistico.mx' };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": ["#0066CC", "#003399", "#002966", "#E6F2FF"],
  "font": "Inter",
  "density": "regular",
  "radius": "rounded"
}/*EDITMODE-END*/;

const PRIMARY_OPTIONS = [
  ["#0066CC", "#003399", "#002966", "#E6F2FF"], // brand blue (spec)
  ["#1F6FEB", "#0B4FC0", "#08368a", "#E8F0FE"], // royal
  ["#0E7C66", "#0a5f4e", "#073f34", "#E2F4EF"], // logistics green
  ["#5B43D6", "#4730ad", "#2f1f7a", "#EEE9FD"], // indigo
  ["#C2410C", "#9a330a", "#6b2406", "#FCEDE4"], // cargo orange
];
const FONT_OPTIONS = ['Inter', 'Plus Jakarta Sans', 'Manrope'];
const DENSITY_MAP = { compact: 0.8, regular: 1, comfy: 1.18 };
const RADIUS_MAP = { sharp: { card: '6px', btn: '5px', input: '4px', modal: '8px' }, rounded: { card: '12px', btn: '8px', input: '6px', modal: '16px' } };

function applyTweaks(t) {
  const r = document.documentElement.style;
  const [p, hover, active, soft] = t.primary;
  r.setProperty('--primary', p);
  r.setProperty('--blue-500', p);
  r.setProperty('--primary-hover', hover);
  r.setProperty('--blue-700', hover);
  r.setProperty('--primary-active', active);
  r.setProperty('--blue-800', active);
  r.setProperty('--primary-soft', soft);
  r.setProperty('--blue-50', soft);
  r.setProperty('--font-sans', `'${t.font}', -apple-system, BlinkMacSystemFont, sans-serif`);
  r.setProperty('--density', DENSITY_MAP[t.density] || 1);
  const rad = RADIUS_MAP[t.radius] || RADIUS_MAP.rounded;
  r.setProperty('--r-card', rad.card); r.setProperty('--r-btn', rad.btn); r.setProperty('--r-input', rad.input); r.setProperty('--r-modal', rad.modal);
}

function FletAppRoot() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = useStateApp(false);
  const [route, setRoute] = useStateApp('dashboard');
  const [params, setParams] = useStateApp(null);
  const toast = useToast();

  useEffectApp(() => { applyTweaks(tweaks); }, [tweaks]);

  const navigate = (r, p = null) => { setRoute(r); setParams(p); window.scrollTo({ top: 0 }); };

  if (!authed) {
    return (
      <React.Fragment>
        <LoginScreen onLogin={() => { setAuthed(true); setRoute('dashboard'); toast({ type: 'success', title: '¡Bienvenido, Diego!', msg: 'Sesión iniciada correctamente' }); }} />
        <FletTweaks tweaks={tweaks} setTweak={setTweak} />
      </React.Fragment>
    );
  }

  const onPay = (id) => navigate('pago', { id });
  const onNew = () => navigate('cotizacion');

  const titles = {
    dashboard: { crumbs: null }, cotizacion: { crumbs: [{ label: 'Dashboard', to: 'dashboard' }, { label: 'Cotizaciones', to: 'cotizaciones' }, { label: 'Nueva cotización' }] },
    rastreo: { crumbs: [{ label: 'Dashboard', to: 'dashboard' }, { label: 'Envíos', to: 'envios' }, { label: 'Rastreo' }] },
    detalle: { crumbs: [{ label: 'Dashboard', to: 'dashboard' }, { label: 'Envíos', to: 'envios' }, { label: 'Detalle' }] },
    pago: { crumbs: [{ label: 'Dashboard', to: 'dashboard' }, { label: 'Pagos & Facturas', to: 'pagos' }, { label: 'Confirmar pago' }] },
    pagos: { crumbs: null }, cotizaciones: { crumbs: null }, envios: { crumbs: null }, soporte: { crumbs: null }, config: { crumbs: null }, ticket: { crumbs: null },
  };

  let screen;
  switch (route) {
    case 'dashboard': screen = <DashboardScreen navigate={navigate} user={USER} onPay={onPay} />; break;
    case 'cotizacion': screen = <CotizacionScreen navigate={navigate} toast={toast} />; break;
    case 'rastreo': screen = <RastreoScreen navigate={navigate} params={params} toast={toast} />; break;
    case 'detalle': screen = <DetalleEnvioScreen navigate={navigate} params={params} toast={toast} />; break;
    case 'pago': screen = <PagosScreen navigate={navigate} params={params} toast={toast} />; break;
    case 'pagos': screen = <FacturasScreen navigate={navigate} toast={toast} />; break;
    case 'cotizaciones': screen = <CotizacionesScreen navigate={navigate} />; break;
    case 'envios': screen = <EnviosScreen navigate={navigate} onPay={onPay} />; break;
    case 'soporte': screen = <SoporteScreen navigate={navigate} toast={toast} />; break;
    case 'ticket': screen = <TicketDetailScreen navigate={navigate} toast={toast} />; break;
    case 'config': screen = <ConfigScreen user={USER} />; break;
    default: screen = <DashboardScreen navigate={navigate} user={USER} onPay={onPay} />;
  }

  return (
    <React.Fragment>
      <AppShell route={route} navigate={navigate} user={USER} onLogout={() => setAuthed(false)} onNew={onNew} crumbs={titles[route] && titles[route].crumbs}>
        {screen}
      </AppShell>
      <FletTweaks tweaks={tweaks} setTweak={setTweak} />
    </React.Fragment>
  );
}

function FletTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Marca" />
      <TweakColor label="Color primario" value={tweaks.primary} options={PRIMARY_OPTIONS} onChange={v => setTweak('primary', v)} />
      <TweakSection label="Tipografía" />
      <TweakRadio label="Fuente" value={tweaks.font} options={FONT_OPTIONS} onChange={v => setTweak('font', v)} />
      <TweakSection label="Layout" />
      <TweakRadio label="Densidad" value={tweaks.density} options={['compact', 'regular', 'comfy']} onChange={v => setTweak('density', v)} />
      <TweakRadio label="Esquinas" value={tweaks.radius} options={['sharp', 'rounded']} onChange={v => setTweak('radius', v)} />
    </TweaksPanel>
  );
}

function MountApp() {
  return <ToastProvider><FletAppRoot /></ToastProvider>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<MountApp />);

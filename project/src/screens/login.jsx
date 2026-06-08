/* ============================================================
   FletApp — Login screen
   ============================================================ */
const { useState: useStateLogin } = React;

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useStateLogin('diego@grupologistico.mx');
  const [pwd, setPwd] = useStateLogin('••••••••••');
  const [show, setShow] = useStateLogin(false);
  const [remember, setRemember] = useStateLogin(true);
  const [loading, setLoading] = useStateLogin(false);
  const [err, setErr] = useStateLogin('');

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    if (!email.includes('@') && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(email)) { setErr('Ingresa un email o RFC válido'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1300);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr 1fr', background: '#fff' }}>
      {/* Brand panel */}
      <div className="login-brand" style={{ position: 'relative', background: 'linear-gradient(150deg,#0066CC 0%,#003399 70%,#002966 100%)', color: '#fff', padding: '56px 60px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* decorative route lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.16 }} viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="lgrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#fff" strokeWidth="1" /></pattern></defs>
          <rect width="600" height="800" fill="url(#lgrid)" />
          <path d="M-20 620 Q160 520 300 600 T640 520" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="2 10" />
          <path d="M80 -20 Q120 200 60 420 T140 820" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="2 10" />
          <circle cx="300" cy="600" r="6" fill="#fff" /><circle cx="60" cy="420" r="6" fill="#fff" />
        </svg>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size={26} light />
        </div>
        <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', maxWidth: 460 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
            <Icon name="truck" size={15} /> Logística terrestre · México
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 750, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>Simplifica tus envíos terrestres</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>Cotiza, rastrea en tiempo real y gestiona pagos de tu carga en una sola plataforma. Diseñada para importadores y exportadores que mueven México.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 36 }}>
            {[['zap', 'Cotiza en minutos, no en días'], ['mapPin', 'Rastreo en tiempo real de tu carga'], ['shield', 'Pagos seguros y facturación CFDI']].map(([ic, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={ic} size={17} /></span>
                <span style={{ fontSize: 15, fontWeight: 550, color: 'rgba(255,255,255,0.92)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <form onSubmit={submit} className="enter-up" style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>Bienvenido de vuelta</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, marginBottom: 30 }}>Inicia sesión para gestionar tu logística.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Email o RFC" error={err}>
              <Input iconLeft="mail" placeholder="ejemplo@empresa.com o RFC" value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} error={!!err} />
            </Field>
            <Field label="Contraseña">
              <Input iconLeft="lock" type={show ? 'text' : 'password'} placeholder="••••••••" value={pwd} onChange={e => setPwd(e.target.value)}
                iconRight={show ? 'eyeOff' : 'eye'} onIconRight={() => setShow(s => !s)} />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Checkbox checked={remember} onChange={() => setRemember(r => !r)} label="Recuérdame" />
              <a style={{ fontSize: 13.5, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>¿Olvidaste tu contraseña?</a>
            </div>
            <Button type="submit" size="lg" block loading={loading} iconRight={loading ? null : 'arrowRight'}>{loading ? 'Verificando…' : 'Iniciar sesión'}</Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0' }}>
            <div className="divider" style={{ flex: 1 }} /><span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>o</span><div className="divider" style={{ flex: 1 }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            ¿No tienes cuenta? <a style={{ color: 'var(--primary)', fontWeight: 650, cursor: 'pointer' }}>Regístrate aquí</a>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40, fontSize: 12, color: 'var(--text-faint)' }}>
            <a style={{ cursor: 'pointer' }}>Soporte</a><span>·</span><a style={{ cursor: 'pointer' }}>Términos</a><span>·</span><a style={{ cursor: 'pointer' }}>Privacidad</a>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--gray-400)', marginTop: 14 }}>© 2026 FletApp. Todos los derechos reservados.</div>
        </form>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;

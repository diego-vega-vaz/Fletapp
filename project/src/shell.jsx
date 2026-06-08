/* ============================================================
   FletApp — Shell: Sidebar, Topbar, AppShell
   ============================================================ */
const { useState: useStateShell, useRef: useRefShell, useEffect: useEffectShell } = React;

const NAV = [
  { section: 'Principal' },
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: 'fileText', badge: 2 },
  { id: 'envios', label: 'Envíos', icon: 'package' },
  { id: 'pagos', label: 'Pagos & Facturas', icon: 'card', badge: 1 },
  { section: 'Soporte' },
  { id: 'soporte', label: 'Soporte', icon: 'chat' },
  { id: 'config', label: 'Configuración', icon: 'settings' },
];

function useClickOutside(ref, onOut) {
  useEffectShell(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onOut(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
}

function Sidebar({ route, navigate, collapsed, setCollapsed, user }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        {collapsed ? <Logo markOnly size={20} /> : <Logo size={21} />}
        {!collapsed && <IconButton name="menu" size={18} sm onClick={() => setCollapsed(true)} />}
      </div>
      <nav className="nav">
        {NAV.map((item, i) => item.section ? (
          <div key={i} className="nav-section">{item.section}</div>
        ) : (
          <div key={item.id} className={`nav-item ${route === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)} title={collapsed ? item.label : ''}>
            <span className="nav-ic"><Icon name={item.icon} size={20} /></span>
            <span className="nav-label">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
        ))}
        {collapsed && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}><IconButton name="chevronRight" size={18} sm onClick={() => setCollapsed(false)} /></div>}
      </nav>
      <div className="sidebar-bottom">
        <div className="user-card" onClick={() => navigate('config')}>
          <Avatar name={user.name} size={36} />
          <div className="user-meta" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.company}</div>
          </div>
          <span className="chev" style={{ color: 'var(--text-faint)' }}><Icon name="chevronRight" size={16} /></span>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, crumbs, navigate, onLogout, user, onNew }) {
  const [notifOpen, setNotifOpen] = useStateShell(false);
  const [userOpen, setUserOpen] = useStateShell(false);
  const notifRef = useRefShell(), userRef = useRefShell();
  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(userRef, () => setUserOpen(false));

  const notifs = [
    { icon: 'truck', color: 'var(--primary)', title: 'Tu envío RES-00145 está en Aguascalientes', time: 'Hace 15 min' },
    { icon: 'dollar', color: 'var(--orange-500)', title: 'Pago pendiente de RES-00143 — $2,446', time: 'Hace 2 h' },
    { icon: 'checkCircle', color: 'var(--green-500)', title: 'Cotización RES-00146 lista para aceptar', time: 'Hace 5 h' },
  ];

  return (
    <header className="topbar">
      <div style={{ flex: 1, minWidth: 0 }}>
        {crumbs ? (
          <div className="breadcrumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevronRight" size={14} />}
                <span className={i === crumbs.length - 1 ? 'current' : 'crumb'} onClick={() => c.to && navigate(c.to)}>{c.label}</span>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="topbar-search">
            <Input iconLeft="search" placeholder="Buscar envíos, cotizaciones, facturas…" style={{ height: 40, background: 'var(--gray-50)' }} />
          </div>
        )}
      </div>

      <Button variant="primary" size="md" icon="plus" onClick={onNew}>Nueva cotización</Button>

      <div ref={notifRef} style={{ position: 'relative' }}>
        <IconButton name="bell" size={20} onClick={() => setNotifOpen(o => !o)} />
        <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 9, background: 'var(--red-500)', border: '2px solid #fff' }} />
        {notifOpen && (
          <div className="dropdown" style={{ minWidth: 340, padding: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14, color: 'var(--text-strong)' }}>Notificaciones</strong>
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Marcar leídas</span>
            </div>
            {notifs.map((n, i) => (
              <div key={i} className="dd-item" style={{ borderRadius: 0, padding: '12px 16px', alignItems: 'flex-start' }}>
                <span style={{ color: n.color, marginTop: 1 }}><Icon name={n.icon} size={18} /></span>
                <div><div style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 550, lineHeight: 1.35 }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>{n.time}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Tooltip text="Centro de ayuda"><IconButton name="helpCircle" size={20} onClick={() => navigate('soporte')} /></Tooltip>

      <div ref={userRef} style={{ position: 'relative' }}>
        <button onClick={() => setUserOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 3, borderRadius: 999 }}>
          <Avatar name={user.name} size={36} />
        </button>
        {userOpen && (
          <div className="dropdown">
            <div style={{ padding: '8px 11px 12px', borderBottom: '1px solid var(--border-soft)', marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-strong)' }}>{user.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{user.email}</div>
            </div>
            <div className="dd-item" onClick={() => { setUserOpen(false); navigate('config'); }}><Icon name="user" size={17} />Mi perfil</div>
            <div className="dd-item" onClick={() => { setUserOpen(false); navigate('config'); }}><Icon name="building" size={17} />Mi empresa</div>
            <div className="dd-item" onClick={() => { setUserOpen(false); navigate('config'); }}><Icon name="settings" size={17} />Configuración</div>
            <div className="divider" style={{ margin: '6px 0' }} />
            <div className="dd-item danger" onClick={onLogout}><Icon name="logout" size={17} />Cerrar sesión</div>
          </div>
        )}
      </div>
    </header>
  );
}

function AppShell({ route, navigate, user, onLogout, onNew, title, crumbs, narrow, children }) {
  const [collapsed, setCollapsed] = useStateShell(false);
  return (
    <div className="app">
      <Sidebar route={route} navigate={navigate} collapsed={collapsed} setCollapsed={setCollapsed} user={user} />
      <div className="main">
        <Topbar title={title} crumbs={crumbs} navigate={navigate} onLogout={onLogout} user={user} onNew={onNew} />
        <div className={`content ${narrow ? 'narrow' : ''}`}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { AppShell, Sidebar, Topbar, NAV });

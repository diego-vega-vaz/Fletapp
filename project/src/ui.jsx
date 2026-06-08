/* ============================================================
   FletApp — Base UI components (React)
   ============================================================ */
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

/* ---------- Logo ---------- */
function Logo({ size = 22, light = false, markOnly = false }) {
  const mark = (
    <span className="logo-mark" style={{ width: size * 1.45, height: size * 1.45, borderRadius: size * 0.42 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
        <path d="M5 17.5h3M16 17.5h3" opacity="0.55" />
        <path d="M4 7l8 0M4 12l11 0" />
        <path d="M14 5l5 5-5 5" />
      </svg>
    </span>
  );
  if (markOnly) return mark;
  return (
    <span className="logo" style={{ fontSize: size * 0.95, color: light ? '#fff' : 'var(--text-strong)' }}>
      {mark}
      <span>Flet<span style={{ color: light ? '#fff' : 'var(--primary)' }}>App</span></span>
    </span>
  );
}

/* ---------- Button ---------- */
function Button({ children, variant = 'primary', size = 'md', icon, iconRight, loading, block, className = '', ...rest }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`} disabled={rest.disabled || loading} {...rest}>
      {loading && <span className="spinner" />}
      {!loading && icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}

function IconButton({ name, size = 20, sm, className = '', ...rest }) {
  return (
    <button className={`icon-btn ${sm ? 'sm' : ''} ${className}`} {...rest}>
      <Icon name={name} size={size} />
    </button>
  );
}

/* ---------- Field / Input ---------- */
function Field({ label, required, hint, error, children }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}{required && <span className="req">*</span>}</label>}
      {children}
      {error ? <span className="field-error"><Icon name="alertCircle" size={13} /> {error}</span>
             : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

function Input({ iconLeft, iconRight, onIconRight, error, className = '', ...rest }) {
  return (
    <div className="input-wrap">
      {iconLeft && <span className="input-icon l"><Icon name={iconLeft} size={18} /></span>}
      <input className={`input ${iconLeft ? 'has-icon-l' : ''} ${iconRight ? 'has-icon-r' : ''} ${error ? 'error' : ''} ${className}`} {...rest} />
      {iconRight && <span className={`input-icon r ${onIconRight ? 'click' : ''}`} onClick={onIconRight}><Icon name={iconRight} size={18} /></span>}
    </div>
  );
}

function Textarea({ error, className = '', ...rest }) {
  return <textarea className={`input ${error ? 'error' : ''} ${className}`} {...rest} />;
}

function Select({ children, error, value, onChange, ...rest }) {
  return (
    <div className="input-wrap">
      <select className={`input select-native ${error ? 'error' : ''}`} value={value} onChange={onChange} {...rest}>{children}</select>
      <span className="input-icon r"><Icon name="chevronDown" size={18} /></span>
    </div>
  );
}

function Checkbox({ checked, onChange, label, radio, ...rest }) {
  return (
    <label className="check">
      <input type={radio ? 'radio' : 'checkbox'} checked={checked} onChange={onChange} {...rest} />
      <span className={`box ${radio ? 'radio' : ''}`}>{!radio && <Icon name="check" size={14} stroke={3} />}</span>
      {label && <span>{label}</span>}
    </label>
  );
}

function Toggle({ on, onClick }) {
  return <button type="button" className={`toggle ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on}><span className="knob" /></button>;
}

/* ---------- Card ---------- */
function Card({ children, hover, pad = true, className = '', style, ...rest }) {
  return <div className={`card ${hover ? 'card-hover' : ''} ${pad ? 'card-pad' : ''} ${className}`} style={style} {...rest}>{children}</div>;
}

/* ---------- Status system ---------- */
const STATUS = {
  pending:   { label: 'Pendiente',   color: 'var(--st-pending)',   bg: 'var(--orange-50)', icon: 'clock' },
  transit:   { label: 'En tránsito', color: 'var(--st-transit)',   bg: 'var(--blue-50)',   icon: 'truck' },
  arrived:   { label: 'Llegado',     color: 'var(--st-arrived)',   bg: 'var(--orange-50)', icon: 'mapPin' },
  delivered: { label: 'Entregado',   color: 'var(--st-delivered)', bg: 'var(--green-50)',  icon: 'checkCircle' },
  disputed:  { label: 'Disputa',     color: 'var(--st-disputed)',  bg: 'var(--red-50)',    icon: 'alertCircle' },
  paid:      { label: 'Pagado',      color: 'var(--st-paid)',      bg: 'var(--gray-100)',  icon: 'check' },
  delayed:   { label: 'Retrasado',   color: 'var(--red-500)',      bg: 'var(--red-50)',    icon: 'alertCircle' },
  waiting:   { label: 'Esperando pago', color: 'var(--orange-500)', bg: 'var(--orange-50)', icon: 'clock' },
};

function StatusBadge({ status, withIcon = true, solid }) {
  const s = STATUS[status] || STATUS.pending;
  if (solid) {
    return <span className="badge badge-solid" style={{ background: s.color }}>{withIcon && <Icon name={s.icon} size={13} />}{s.label}</span>;
  }
  return (
    <span className="badge badge-soft" style={{ '--bg': s.bg, '--fg': s.color }}>
      {withIcon ? <Icon name={s.icon} size={13} /> : <span className="dot" />}{s.label}
    </span>
  );
}

function Badge({ children, color = 'var(--text)', bg = 'var(--gray-100)', dot }) {
  return <span className="badge badge-soft" style={{ '--bg': bg, '--fg': color }}>{dot && <span className="dot" />}{children}</span>;
}

/* ---------- Avatar ---------- */
function Avatar({ name = '', size = 38, src }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>{src ? <img src={src} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : initials}</span>;
}

/* ---------- Tabs ---------- */
function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.icon && <Icon name={t.icon} size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(o => <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal({ open, onClose, title, children, footer, width = 540 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-head">
            <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--text-strong)' }}>{title}</h3>
            <IconButton name="close" size={20} sm onClick={onClose} />
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Toast system ---------- */
const ToastCtx = createContext(null);
function useToast() { return useContext(ToastCtx); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, ...t }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), t.duration || 4200);
  }, []);
  const colors = { success: 'var(--green-500)', error: 'var(--red-500)', warning: 'var(--orange-500)', info: 'var(--primary)' };
  const icons = { success: 'checkCircle', error: 'xCircle', warning: 'alertCircle', info: 'info' };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ '--accent': colors[t.type || 'info'] }}>
            <span style={{ color: colors[t.type || 'info'], marginTop: 1 }}><Icon name={icons[t.type || 'info']} size={20} /></span>
            <div style={{ flex: 1 }}>
              <div className="t-title">{t.title}</div>
              {t.msg && <div className="t-msg">{t.msg}</div>}
            </div>
            <IconButton name="close" size={15} sm onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Steps ---------- */
function Steps({ steps, current }) {
  return (
    <div className="steps">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="step-node">
            <div className={`step-dot ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}>
              {i < current ? <Icon name="check" size={16} stroke={3} /> : i + 1}
            </div>
            <span className={`step-label ${i <= current ? 'active' : ''}`} style={{ display: window.innerWidth < 900 && i !== current ? 'none' : 'block' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function Tooltip({ children, text }) {
  return <span className="tip">{children}<span className="tip-body">{text}</span></span>;
}

function Spinner({ size = 16 }) { return <span className="spinner" style={{ width: size, height: size }} />; }

Object.assign(window, {
  Logo, Button, IconButton, Field, Input, Textarea, Select, Checkbox, Toggle, Card,
  StatusBadge, Badge, STATUS, Avatar, Tabs, Segmented, Modal, ToastProvider, useToast,
  Steps, Tooltip, Spinner,
});

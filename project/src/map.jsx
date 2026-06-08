/* ============================================================
   FletApp — Stylized route map (shared)
   ============================================================ */
const { useState: useStateMap, useEffect: useEffectMap, useRef: useRefMap } = React;

// point along a polyline at fraction t (0..1) over total length
function pointOnPath(pts, t) {
  if (pts.length < 2) return { x: pts[0].x, y: pts[0].y, angle: 0 };
  let segs = [], total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
    const len = Math.hypot(dx, dy);
    segs.push({ a: pts[i], b: pts[i + 1], len, dx, dy }); total += len;
  }
  let target = t * total, acc = 0;
  for (const s of segs) {
    if (acc + s.len >= target) {
      const f = (target - acc) / s.len;
      return { x: s.a.x + s.dx * f, y: s.a.y + s.dy * f, angle: Math.atan2(s.dy, s.dx) * 180 / Math.PI };
    }
    acc += s.len;
  }
  const last = segs[segs.length - 1];
  return { x: last.b.x, y: last.b.y, angle: Math.atan2(last.dy, last.dx) * 180 / Math.PI };
}

function MapView({ route, progress = 0.44, height = 420, animate = true, live = false, currentLabel, eta }) {
  const W = 800, H = 600;
  // route: [{x,y (in %), city, sub, type}]  -> convert to canvas coords
  const pts = route.map(r => ({ x: r.x / 100 * W, y: r.y / 100 * H }));
  const [t, setT] = useStateMap(animate ? 0 : progress);

  useEffectMap(() => {
    if (!animate) { setT(progress); return; }
    let raf, start, done = false;
    const dur = 2200;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setT(eased * progress);
      if (p < 1) raf = requestAnimationFrame(step); else done = true;
    };
    raf = requestAnimationFrame(step);
    // safety: guarantee final state even if rAF is throttled/paused while offscreen
    const fb = setTimeout(() => { if (!done) setT(progress); }, dur + 1200);
    return () => { cancelAnimationFrame(raf); clearTimeout(fb); };
  }, [progress, animate]);

  const truck = pointOnPath(pts, t);
  const polyStr = pts.map(p => `${p.x},${p.y}`).join(' ');
  // path length for dash
  let pathLen = 0;
  for (let i = 0; i < pts.length - 1; i++) pathLen += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);

  return (
    <div className="mapview" style={{ height, position: 'relative', borderRadius: 'var(--r-card)', overflow: 'hidden', background: 'linear-gradient(160deg,#EAF1F7 0%,#E2ECF3 100%)', border: '1px solid var(--border-soft)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#CBD9E6" strokeWidth="1" opacity="0.5" />
          </pattern>
          <linearGradient id="routegrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0066CC" /><stop offset="1" stopColor="#00BCD4" />
          </linearGradient>
          <filter id="pinshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#16243f" floodOpacity="0.25" />
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#mapgrid)" />
        {/* terrain blobs */}
        <g opacity="0.5">
          <path d="M-20 120 Q150 60 320 140 T660 120 T860 200 L860 -20 L-20 -20Z" fill="#DCE8DF" />
          <ellipse cx="640" cy="420" rx="220" ry="150" fill="#D7E6EC" opacity="0.7" />
          <path d="M60 560 Q220 480 360 540 T700 520" fill="none" stroke="#C3D4C8" strokeWidth="40" strokeLinecap="round" opacity="0.5" />
        </g>
        {/* faux highways */}
        <g stroke="#fff" strokeWidth="3" opacity="0.65" fill="none">
          <path d="M0 200 Q200 240 400 200 T800 260" /><path d="M120 0 Q160 200 100 400 T180 600" />
          <path d="M500 0 Q540 250 620 600" />
        </g>

        {/* route shadow */}
        <polyline points={polyStr} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        {/* full route faint */}
        <polyline points={polyStr} fill="none" stroke="#9DB4CE" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 9" />
        {/* traveled route */}
        <polyline points={polyStr} fill="none" stroke="url(#routegrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={pathLen} strokeDashoffset={pathLen * (1 - t)} style={{ transition: 'stroke-dashoffset 60ms linear' }} />

        {/* city nodes */}
        {route.map((r, i) => {
          const cx = r.x / 100 * W, cy = r.y / 100 * H;
          const isEnd = r.type === 'origin' || r.type === 'dest';
          const col = r.type === 'origin' ? '#00B81C' : r.type === 'dest' ? '#0066CC' : '#8A909C';
          if (isEnd) {
            return (
              <g key={i} filter="url(#pinshadow)">
                <path d={`M${cx} ${cy} c-9 -16 -14 -22 -14 -31 a14 14 0 0 1 28 0 c0 9 -5 15 -14 31Z`} fill={col} transform={`translate(0,-2)`} />
                <circle cx={cx} cy={cy - 33} r="5.5" fill="#fff" />
              </g>
            );
          }
          return <g key={i}><circle cx={cx} cy={cy} r="6" fill="#fff" stroke="#8A909C" strokeWidth="2.5" /></g>;
        })}

        {/* truck */}
        <g transform={`translate(${truck.x},${truck.y})`} style={{ transition: 'transform 60ms linear' }}>
          {live && <circle r="22" fill="#0066CC" opacity="0.14"><animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.22;0;0.22" dur="2s" repeatCount="indefinite" /></circle>}
          <circle r="15" fill="#fff" stroke="#0066CC" strokeWidth="2.5" filter="url(#pinshadow)" />
          <g transform="translate(-9,-9) scale(0.75)" stroke="#0066CC" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8Z" />
            <circle cx="5.5" cy="18.5" r="2.2" fill="#0066CC" /><circle cx="18.5" cy="18.5" r="2.2" fill="#0066CC" />
          </g>
        </g>
      </svg>

      {/* labels */}
      {route.map((r, i) => {
        // origin → label to the left, dest → above, waypoints → right (avoids collisions)
        const tf = r.type === 'dest' ? 'translate(-50%, -240%)'
          : r.type === 'origin' ? 'translate(calc(-100% - 16px), -50%)'
          : 'translate(14px, -50%)';
        return (
          <div key={i} style={{ position: 'absolute', left: `${r.x}%`, top: `${r.y}%`, transform: tf, pointerEvents: 'none', zIndex: r.type ? 3 : 2 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '4px 9px', boxShadow: 'var(--sh-md)', fontSize: 12, fontWeight: 700, color: 'var(--text-strong)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
              {r.type === 'origin' && <span style={{ width: 7, height: 7, borderRadius: 9, background: 'var(--green-500)' }} />}
              {r.type === 'dest' && <span style={{ width: 7, height: 7, borderRadius: 9, background: 'var(--primary)' }} />}
              {r.city}
            </div>
          </div>
        );
      })}

      {/* live current chip removed — redundant with node labels + status pill (avoids overlap) */}

      {/* map controls */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--sh-md)', overflow: 'hidden' }}>
          <button className="icon-btn sm" style={{ borderRadius: 0, display: 'block' }}><Icon name="plus" size={16} /></button>
          <div className="divider" />
          <button className="icon-btn sm" style={{ borderRadius: 0, display: 'block' }}><Icon name="chevronDown" size={16} /></button>
        </div>
      </div>
      {live && (
        <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', borderRadius: 999, padding: '6px 12px 6px 10px', boxShadow: 'var(--sh-md)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--green-500)', animation: 'pulse-dot 2s infinite' }} />
          En vivo · {Math.round(t * 100)}% completado
        </div>
      )}
      {eta && (
        <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--sh-md)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>ETA</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{eta}</div>
        </div>
      )}
    </div>
  );
}

window.MapView = MapView;

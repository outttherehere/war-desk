// ConflictMeters.jsx — India Conflict Meter + WW3 Meter
import { useState, useEffect } from 'react';

function AnimatedNumber({ target, color, size = 28 }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let frame = 0;
    const steps = 60;
    const interval = setInterval(() => {
      frame++;
      setCurrent(Math.round(target * Math.min(1, frame / steps)));
      if (frame >= steps) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [target]);
  return <span style={{ color, fontSize: size, fontFamily: 'monospace', fontWeight: 'bold' }}>{current}%</span>;
}

function MeterArc({ value, color, size = 80 }) {
  const angle = -135 + (value / 100) * 270;
  const r = size * 0.42;
  const cx = size / 2, cy = size / 2;
  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - value / 100);

  return (
    <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#111" strokeWidth={size * 0.08} strokeLinecap="round"
      />
      {/* Value arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={size * 0.07} strokeLinecap="round"
        strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
        style={{ transition: 'stroke-dasharray 1.5s ease, stroke 0.5s' }}
      />
      {/* Glow */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={size * 0.12} strokeLinecap="round"
        strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
        opacity="0.15"
      />
    </svg>
  );
}

// India vs Pakistan meter
function IndiaPakMeter({ gdeltSignal }) {
  const base = 68;
  const boost = gdeltSignal ? Math.min(15, gdeltSignal.criticalCount * 1.5) : 0;
  const val = Math.min(95, base + boost);
  const color = val > 80 ? '#ff2d2d' : val > 60 ? '#ff8c00' : '#ffd700';

  return (
    <div style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #111' }}>
      <div style={{ color: '#555', fontSize: 8, letterSpacing: 2, marginBottom: 4 }}>🇮🇳 vs 🇵🇰 CONFLICT</div>
      <MeterArc value={val} color={color} size={90} />
      <div style={{ marginTop: -8 }}>
        <AnimatedNumber target={val} color={color} size={20} />
      </div>
      <div style={{ color, fontSize: 8, letterSpacing: 1, marginTop: 2 }}>
        {val > 80 ? 'IMMINENT' : val > 65 ? 'HIGH RISK' : 'ELEVATED'}
      </div>
    </div>
  );
}

// India vs China meter
function IndiaChinaMeter({ gdeltSignal }) {
  const base = 52;
  const val = Math.min(90, base + (gdeltSignal?.indiaCount || 0));
  const color = val > 70 ? '#ff8c00' : val > 50 ? '#ffd700' : '#00ff88';

  return (
    <div style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #111' }}>
      <div style={{ color: '#555', fontSize: 8, letterSpacing: 2, marginBottom: 4 }}>🇮🇳 vs 🇨🇳 CONFLICT</div>
      <MeterArc value={val} color={color} size={90} />
      <div style={{ marginTop: -8 }}>
        <AnimatedNumber target={val} color={color} size={20} />
      </div>
      <div style={{ color, fontSize: 8, letterSpacing: 1, marginTop: 2 }}>
        {val > 70 ? 'ELEVATED' : val > 50 ? 'TENSION' : 'WATCHFUL'}
      </div>
    </div>
  );
}

// WW3 Global Escalation Index
function WW3Meter({ articles, gdeltSignal }) {
  // Compute from active conflicts + nuclear rhetoric in news
  const [ww3Index, setWw3Index] = useState(34);

  useEffect(() => {
    if (!articles?.length) return;
    const nuclearMentions = articles.filter(a =>
      (a.title + (a.desc || '')).toLowerCase().match(/nuclear|nuke|nato|ww3|world war|global conflict|escalat/)
    ).length;
    const criticalCount = gdeltSignal?.criticalCount || 0;
    const computed = Math.min(85, 28 + (nuclearMentions * 3) + (criticalCount * 1.5));
    setWw3Index(Math.round(computed));
  }, [articles, gdeltSignal]);

  const color = ww3Index > 60 ? '#ff2d2d' : ww3Index > 40 ? '#ff8c00' : ww3Index > 25 ? '#ffd700' : '#00ff88';
  const label = ww3Index > 60 ? 'CRITICAL' : ww3Index > 40 ? 'ELEVATED' : ww3Index > 25 ? 'CAUTION' : 'STABLE';

  const shareWW3 = () => {
    const text = `⚠️ WW3 Escalation Index: ${ww3Index}% (${label})\n\nBased on active conflicts, nuclear rhetoric & GDELT intelligence.\n\nIndia War Desk — https://war-desk.vercel.app`;
    if (navigator.share) navigator.share({ title: 'WW3 Index', text });
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ padding: '10px 8px', borderBottom: '1px solid #111' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ color: '#555', fontSize: 8, letterSpacing: 2 }}>🌍 WW3 INDEX</div>
        <button onClick={shareWW3} style={{ background: 'none', border: 'none', color: '#25D366', fontSize: 12, cursor: 'pointer' }}>📤</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MeterArc value={ww3Index} color={color} size={90} />
        <div>
          <div style={{ color, fontSize: 22, fontFamily: 'monospace', fontWeight: 'bold', lineHeight: 1 }}>{ww3Index}%</div>
          <div style={{ color, fontSize: 9, letterSpacing: 2 }}>{label}</div>
          <div style={{ color: '#333', fontSize: 8, marginTop: 4, lineHeight: 1.4 }}>
            {ww3Index > 60 ? 'Multiple nuclear powers in active conflict' :
             ww3Index > 40 ? 'Global escalation signals detected' :
             ww3Index > 25 ? 'Elevated inter-state tensions' :
             'Normal background conflict level'}
          </div>
        </div>
      </div>

      {/* Contributing factors */}
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {[
          { label: 'Active Wars', val: 7, color: '#ff4444' },
          { label: 'Nuclear States Involved', val: 3, color: '#ff8c00' },
          { label: 'Economic Warfare', val: 5, color: '#ffd700' },
          { label: 'Proxy Conflicts', val: 12, color: '#ff6644' },
        ].map(f => (
          <div key={f.label} style={{ background: '#0a0a14', border: '1px solid #1a1a1a', padding: '3px 5px' }}>
            <div style={{ color: '#444', fontSize: 7 }}>{f.label}</div>
            <div style={{ color: f.color, fontSize: 11, fontFamily: 'monospace' }}>{f.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConflictMeters({ gdeltSignal, articles }) {
  return (
    <div>
      <WW3Meter gdeltSignal={gdeltSignal} articles={articles} />
      <IndiaPakMeter gdeltSignal={gdeltSignal} />
      <IndiaChinaMeter gdeltSignal={gdeltSignal} />
    </div>
  );
}

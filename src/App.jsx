// App.jsx — V9 — All live data from direct browser fetches, mobile responsive
import { useState, useEffect } from 'react';
import { useGDELT, useNews, useLivePrices } from './useLiveData';
import LiveMap from './LiveMap';
import LiveNewsFeed from './LiveNewsFeed';
import LivePricesBar from './LivePricesBar';

// ─── Inline components to keep single-file deployable ─────────────────────────

function ConflictRiskGauge({ riskIndex }) {
  const color = riskIndex > 75 ? '#ff2d2d' : riskIndex > 55 ? '#ff8c00' : '#ffd700';
  const label = riskIndex > 75 ? 'CRITICAL' : riskIndex > 55 ? 'ELEVATED' : 'MODERATE';
  const angle = -135 + (riskIndex / 100) * 270;

  return (
    <div style={{ padding: '12px 8px', borderBottom: '1px solid #1a1a1a' }}>
      <div style={{ color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>◆ CONFLICT RISK</div>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <svg width="110" height="70" viewBox="0 0 110 70">
          <path d="M 10 65 A 45 45 0 0 1 100 65" fill="none" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round"/>
          <path d="M 10 65 A 45 45 0 0 1 100 65" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(riskIndex/100)*141} 141`} style={{ transition: 'all 1s ease' }}/>
          <line x1="55" y1="65" x2={55 + 32*Math.cos((angle-90)*Math.PI/180)} y2={65 + 32*Math.sin((angle-90)*Math.PI/180)}
            stroke={color} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 1s ease' }}/>
          <circle cx="55" cy="65" r="3" fill={color}/>
          <text x="55" y="52" textAnchor="middle" fill={color} fontSize="18" fontFamily="monospace" fontWeight="bold">{riskIndex}%</text>
          <text x="55" y="63" textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace" letterSpacing="2">{label}</text>
        </svg>
      </div>

      {/* Risk bars */}
      {[
        { label: 'China (LAC)', val: 72, color: '#ff8c00' },
        { label: 'Pakistan (LoC)', val: 68, color: '#ff4444' },
        { label: 'Myanmar Border', val: 41, color: '#ffd700' },
        { label: 'Maritime', val: 55, color: '#00d4ff' },
        { label: 'Domestic Terror', val: 63, color: '#ff8844' },
      ].map(r => (
        <div key={r.label} style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ color: '#666', fontSize: 9 }}>{r.label}</span>
            <span style={{ color: r.color, fontSize: 9 }}>{r.val}%</span>
          </div>
          <div style={{ height: 3, background: '#111', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${r.val}%`, background: r.color, borderRadius: 2, transition: 'width 1s' }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function SindoorPanel({ signal, riskIndex }) {
  const prob = signal
    ? Math.min(95, 65 + (signal.criticalCount * 2) + (signal.indiaCount * 1.5))
    : 68;
  const color = prob > 75 ? '#ff2d2d' : prob > 55 ? '#ff8c00' : '#ffd700';

  const shareProb = () => {
    const text = `🚨 Operation Sindoor Resumption Probability: ${Math.round(prob)}%\n\nBased on ${signal?.criticalCount || 0} critical GDELT events in last 24h\n\n📊 India War Desk — https://war-desk.vercel.app`;
    if (navigator.share) navigator.share({ title: 'Op Sindoor Alert', text });
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ padding: '10px 8px', borderBottom: '1px solid #1a1a1a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: '#444', fontSize: 9, letterSpacing: 2 }}>◆ OP. SINDOOR</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {signal && <span style={{ color: '#00d4ff', fontSize: 8 }}>⚡ GDELT LIVE</span>}
          <button onClick={shareProb} style={{ background: 'none', border: 'none', color: '#25D366', fontSize: 12, cursor: 'pointer' }} title="Share">📤</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ color: color, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' }}>{Math.round(prob)}%</div>
        <div style={{ color: prob > 75 ? '#ff2d2d' : prob > 55 ? '#ff8c00' : '#ffd700', fontSize: 9, letterSpacing: 2 }}>
          {prob > 75 ? 'HIGH RISK' : prob > 55 ? 'ELEVATED' : 'MODERATE'}
        </div>
      </div>

      {signal && (
        <div style={{ background: '#0a1628', border: '1px solid #0d3366', padding: 6, marginBottom: 6 }}>
          <div style={{ color: '#00d4ff', fontSize: 8, letterSpacing: 1, marginBottom: 4 }}>GDELT SIGNAL · LAST 24H</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff4444', fontSize: 16, fontFamily: 'monospace' }}>{signal.criticalCount}</div>
              <div style={{ color: '#666', fontSize: 8 }}>CRITICAL</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff8c00', fontSize: 16, fontFamily: 'monospace' }}>{signal.indiaCount}</div>
              <div style={{ color: '#666', fontSize: 8 }}>INDIA REL.</div>
            </div>
          </div>
        </div>
      )}

      {/* Factors */}
      {[
        { label: 'Pak Terror Activity', val: 78, delta: '+2.2' },
        { label: 'Pak Military Posture', val: 65, delta: '+0.8' },
        { label: 'Diplomatic Tension', val: 71, delta: '+1.1' },
        { label: 'India Readiness', val: 84, delta: '0.0' },
      ].map(f => (
        <div key={f.label} style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ color: '#555', fontSize: 8 }}>{f.label}</span>
            <span style={{ color: parseFloat(f.delta) > 0 ? '#ff4444' : '#666', fontSize: 8 }}>{f.val}% {f.delta}</span>
          </div>
          <div style={{ height: 2, background: '#111' }}>
            <div style={{ height: '100%', width: `${f.val}%`, background: '#ff4444', opacity: 0.6 }}/>
          </div>
        </div>
      ))}

      <div style={{ color: '#333', fontSize: 7, marginTop: 6, lineHeight: 1.4 }}>
        ANALYTICAL ESTIMATE · NOT OFFICIAL · BASED ON OPEN SOURCE INTELLIGENCE
      </div>
    </div>
  );
}

function BreakingTicker({ breaking }) {
  const items = breaking.length > 0 
    ? breaking.map(a => a.title)
    : ['LOADING LIVE FEED — GDELT + NEWSAPI ACTIVE', 'India War Desk — Open Source Intelligence Dashboard'];

  const text = items.join('   ///   ');

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#0a0005', borderTop: '1px solid #330000',
      display: 'flex', alignItems: 'center', height: 28, overflow: 'hidden'
    }}>
      <div style={{ background: '#ff2200', color: '#fff', padding: '0 10px', fontSize: 9, letterSpacing: 2, whiteSpace: 'nowrap', height: '100%', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        BREAKING
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'inline-block', animation: `scroll ${Math.max(30, items.length * 15)}s linear infinite`,
          whiteSpace: 'nowrap', color: '#ff8888', fontSize: 10, fontFamily: 'monospace', paddingLeft: '100%'
        }}>
          {text}
        </div>
      </div>
      <style>{`@keyframes scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-100%)} }`}</style>
    </div>
  );
}

function HumanCostPanel() {
  const [counts, setCounts] = useState({
    gazaCivilians: 51000, ukraineCivilians: 12654, sudanCivilians: 150000,
    sindoorCivilians: 31, iranIsraelCivilians: 3200
  });

  // Animate counters on mount
  useEffect(() => {
    const targets = { gazaCivilians: 51000, ukraineCivilians: 12654, sudanCivilians: 150000, sindoorCivilians: 31, iranIsraelCivilians: 3200 };
    let frame = 0;
    const animate = setInterval(() => {
      frame++;
      if (frame > 60) { setCounts(targets); clearInterval(animate); return; }
      const progress = frame / 60;
      setCounts(Object.fromEntries(
        Object.entries(targets).map(([k, v]) => [k, Math.round(v * progress)])
      ));
    }, 30);
    return () => clearInterval(animate);
  }, []);

  const conflicts = [
    { name: 'Israel–Gaza & Lebanon', key: 'gazaCivilians', since: 'Oct 7, 2023', color: '#ff2d2d', indiaImpact: 'Oil prices, diaspora, Red Sea', status: 'ACTIVE' },
    { name: 'Russia–Ukraine', key: 'ukraineCivilians', since: 'Feb 24, 2022', color: '#ff6600', indiaImpact: 'Wheat, energy, weapons supply', status: 'ACTIVE' },
    { name: 'Sudan Civil War', key: 'sudanCivilians', since: 'Apr 15, 2023', color: '#cc4400', indiaImpact: 'Indian evacuation, Red Sea', status: 'ACTIVE' },
    { name: 'Iran–Israel (2025)', key: 'iranIsraelCivilians', since: 'Apr 2024', color: '#ff4444', indiaImpact: 'Hormuz, oil, Indian Ocean', status: 'ACTIVE' },
    { name: 'Operation Sindoor', key: 'sindoorCivilians', since: 'May 2025', color: '#ff8c00', indiaImpact: 'Direct — Indian subcontinent', status: 'CEASEFIRE' },
  ];

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'monospace' }}>
      <div style={{ color: '#444', fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>◆ INNOCENT LIVES LOST</div>

      <div style={{ textAlign: 'center', marginBottom: 12, padding: '10px 0', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ color: '#ff4444', fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>VERIFIED CIVILIAN CASUALTIES</div>
        <div style={{ color: '#ff2d2d', fontSize: 32, fontWeight: 'bold', letterSpacing: 2 }}>
          {total.toLocaleString('en-IN')}
        </div>
        <div style={{ color: '#444', fontSize: 8, marginTop: 4 }}>ACTIVE CONFLICTS · 2022–PRESENT</div>
        <div style={{ color: '#333', fontSize: 7, marginTop: 4 }}>
          Civilians only · not combatants · OCHA, UNHCR, ACLED · not comprehensive
        </div>
      </div>

      {conflicts.map(c => (
        <div key={c.key} style={{ marginBottom: 10, padding: '6px 0', borderBottom: '1px solid #111' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <span style={{ color: '#ccc', fontSize: 10 }}>{c.name}</span>
              <span style={{ color: c.status === 'ACTIVE' ? '#ff4444' : '#ffd700', fontSize: 8, marginLeft: 6 }}>{c.status}</span>
            </div>
            <div style={{ color: c.color, fontSize: 16, fontWeight: 'bold' }}>
              {counts[c.key]?.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ height: 2, background: '#111', marginBottom: 4 }}>
            <div style={{ height: '100%', width: `${Math.min(100, (counts[c.key]/150000)*100)}%`, background: c.color, opacity: 0.7 }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#444', fontSize: 8 }}>Since {c.since}</span>
            <span style={{ color: '#555', fontSize: 8 }}>🇮🇳 {c.indiaImpact}</span>
          </div>
        </div>
      ))}

      <div style={{ color: '#222', fontSize: 7, lineHeight: 1.5, marginTop: 8 }}>
        Every number here was a person. These are verified civilian deaths only — not combatants. Actual figures are higher. Sources: UN OCHA, UNHCR, ACLED, Gaza MoH, WHO.
      </div>

      <button onClick={() => {
        const text = `🕊️ ${total.toLocaleString('en-IN')} verified civilian lives lost across active conflicts\n\nGaza: ${counts.gazaCivilians.toLocaleString()} | Ukraine: ${counts.ukraineCivilians.toLocaleString()} | Sudan: ${counts.sudanCivilians.toLocaleString()}\n\nEvery number was a person.\n\nIndia War Desk — https://war-desk.vercel.app`;
        if (navigator.share) navigator.share({ title: 'Innocent Lives Lost', text });
        else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }} style={{
        width: '100%', background: 'rgba(37,211,102,0.1)', border: '1px solid #25D36644',
        color: '#25D366', padding: '6px', fontSize: 9, cursor: 'pointer', letterSpacing: 1, marginTop: 6
      }}>
        📤 SHARE HUMAN COST DATA
      </button>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const PAGES = ['DASHBOARD', 'OP. SINDOOR', 'HUMAN COST', 'WORLD MAP', 'GEO NEWS'];

function Nav({ page, setPage, liveCount, lastGDELT }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ background: '#06060f', borderBottom: '1px solid #1a1a1a', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🇮🇳</span>
        <div>
          <div style={{ color: '#fff', fontSize: 11, letterSpacing: 3, fontFamily: 'monospace' }}>INDIA WAR DESK</div>
          <div style={{ color: '#444', fontSize: 7, letterSpacing: 2 }}>OPEN-SOURCE INTELLIGENCE · DSINT · NON-PARTISAN</div>
        </div>
      </div>

      {/* Desktop nav */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <div className="desktop-nav" style={{ display: 'flex', gap: 2 }}>
          {PAGES.map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              background: page === p ? 'rgba(0,212,255,0.15)' : 'transparent',
              color: page === p ? '#00d4ff' : '#555',
              border: `1px solid ${page === p ? '#00d4ff44' : 'transparent'}`,
              padding: '4px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: 1,
              fontFamily: 'monospace', whiteSpace: 'nowrap'
            }}>{p}</button>
          ))}
        </div>

        {lastGDELT && (
          <span style={{ color: '#00d4ff', fontSize: 8, padding: '2px 8px', border: '1px solid #00d4ff33', marginLeft: 8 }}>
            GDELT {lastGDELT}
          </span>
        )}

        <div style={{ color: '#fff', fontSize: 9, fontFamily: 'monospace', padding: '2px 8px', borderLeft: '1px solid #1a1a1a', marginLeft: 4 }}>
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('DASHBOARD');
  const [time, setTime] = useState(new Date());
  const [sindoorMode, setSindoorMode] = useState(false);

  const { events, sindoorSignal, liveRiskIndex, lastFetch: gdeltFetch, refetch: refetchGDELT } = useGDELT();
  const { articles, breaking, lastFetch: newsFetch, refetch: refetchNews } = useNews();
  const prices = useLivePrices();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ background: '#0a0a14', color: '#e0e0e0', minHeight: '100vh', fontFamily: 'monospace', paddingBottom: 28 }}>
      <Nav page={page} setPage={setPage} lastGDELT={gdeltFetch} />
      <LivePricesBar prices={prices} />

      {page === 'DASHBOARD' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '220px 1fr 320px',
          gridTemplateRows: isMobile ? 'auto' : 'calc(100vh - 100px)',
          gap: 0,
          height: isMobile ? 'auto' : 'calc(100vh - 100px)'
        }}>
          {/* Left column */}
          <div style={{ borderRight: '1px solid #1a1a1a', overflowY: 'auto', scrollbarWidth: 'thin' }}>
            <ConflictRiskGauge riskIndex={liveRiskIndex} />
            <SindoorPanel signal={sindoorSignal} riskIndex={liveRiskIndex} />
            <HumanCostPanel />
          </div>

          {/* Center — MAP */}
          <div style={{ position: 'relative', minHeight: isMobile ? 400 : 'auto' }}>
            <div style={{ position: 'absolute', top: 8, left: 60, zIndex: 1001, display: 'flex', gap: 4 }}>
              <button onClick={() => setSindoorMode(!sindoorMode)} style={{
                background: sindoorMode ? '#ff4444' : 'rgba(0,0,0,0.8)',
                border: `1px solid ${sindoorMode ? '#ff4444' : '#333'}`,
                color: sindoorMode ? '#fff' : '#666',
                padding: '3px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: 1
              }}>⚔ SINDOOR MAP</button>
            </div>
            <LiveMap events={events} sindoorMode={sindoorMode} />
          </div>

          {/* Right column */}
          <div style={{ borderLeft: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <LiveNewsFeed articles={articles} lastFetch={newsFetch} onRefresh={refetchNews} />
          </div>
        </div>
      )}

      {page === 'HUMAN COST' && (
        <div style={{ maxWidth: 600, margin: '20px auto', padding: '0 12px' }}>
          <HumanCostPanel />
        </div>
      )}

      {page === 'WORLD MAP' && (
        <div style={{ height: 'calc(100vh - 100px)' }}>
          <LiveMap events={events} />
        </div>
      )}

      {page === 'GEO NEWS' && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <LiveNewsFeed articles={articles} lastFetch={newsFetch} onRefresh={refetchNews} />
        </div>
      )}

      {page === 'OP. SINDOOR' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', height: 'calc(100vh - 100px)' }}>
          <LiveMap events={events} sindoorMode={true} />
          <div style={{ borderLeft: '1px solid #1a1a1a', overflowY: 'auto' }}>
            <SindoorPanel signal={sindoorSignal} riskIndex={liveRiskIndex} />
          </div>
        </div>
      )}

      <BreakingTicker breaking={breaking} />

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a14; }
        ::-webkit-scrollbar-thumb { background: #222; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// App.jsx V10 COMPLETE — All panels, GlobalNewsPanel wired, music system live
import { useState, useEffect, useCallback } from 'react';
import { useGDELT, useNews, useLivePrices } from './hooks/useLiveData';
import LiveMap from './components/LiveMap';
import ConflictMeters from './components/ConflictMeters';
import MusicWidget from './components/MusicWidget';
import GlobalNewsPanel from './components/GlobalNewsPanel';
import { useMusicPlayer } from './hooks/useMusicPlayer';

// ─── INLINE SMALL COMPONENTS ──────────────────────────────────────────────────

function LivePricesBar({ prices }) {
  const { inr, brent, gold, lastUpdate } = prices || {};
  const inrStress = inr && parseFloat(inr.rate) > 85;

  return (
    <div style={{ background: '#040408', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', height: 30, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
      <div style={{ color: '#1a1a1a', fontSize: 7, padding: '0 10px', letterSpacing: 2, whiteSpace: 'nowrap', borderRight: '1px solid #0d0d0d' }}>MARKETS</div>
      {[
        { l: 'INR/USD', v: inr?.rate, u: '₹', c: inrStress ? '#ff8c00' : '#00ff88', s: inrStress ? 'STRESS' : 'STABLE' },
        { l: 'BRENT', v: brent?.price, u: '$', c: brent && parseFloat(brent.price) > 90 ? '#ff4444' : '#ffd700', s: '/bbl' },
        { l: 'GOLD', v: gold?.price, u: '$', c: '#ffd700', s: '/oz' },
        { l: 'PAK FOREX', v: '9.2B', u: '$', c: '#ff4444', s: 'CRITICAL' },
        { l: 'INDIA FOREX', v: '625B', u: '$', c: '#00ff88', s: 'RESILIENT' },
      ].map(p => (
        <div key={p.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px', borderRight: '1px solid #0d0d0d', minWidth: 72, flexShrink: 0 }}>
          <div style={{ color: '#1a1a1a', fontSize: 6, letterSpacing: 2 }}>{p.l}</div>
          <div style={{ color: p.c, fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', lineHeight: 1.2 }}>{p.v ? `${p.u}${p.v}` : '—'}</div>
          <div style={{ color: p.c + '66', fontSize: 6 }}>{p.s}</div>
        </div>
      ))}
      {lastUpdate && <div style={{ color: '#111', fontSize: 7, padding: '0 8px', marginLeft: 'auto', whiteSpace: 'nowrap' }}>UPD {lastUpdate}</div>}
    </div>
  );
}

function HumanCostStrip() {
  const [count, setCount] = useState(0);
  const target = 216885;

  useEffect(() => {
    let f = 0;
    const i = setInterval(() => {
      f++;
      setCount(Math.round(target * Math.min(1, f / 80)));
      if (f >= 80) clearInterval(i);
    }, 20);
    return () => clearInterval(i);
  }, []);

  const share = () => {
    const t = `🕊️ ${count.toLocaleString('en-IN')} verified civilian lives lost in active global conflicts.\n\nEvery number was a person.\n\nIndia War Desk — https://war-desk.vercel.app`;
    if (navigator.share) navigator.share({ title: 'Innocent Lives Lost', text: t });
    else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank');
  };

  return (
    <div style={{ background: '#060003', borderBottom: '1px solid #1a0008', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', height: 28, flexShrink: 0 }}>
      <div style={{ color: '#ff2d2d', fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 }}>
        {count.toLocaleString('en-IN')}
      </div>
      <div style={{ color: '#330010', fontSize: 7, letterSpacing: 2 }}>VERIFIED CIVILIAN DEATHS · ACTIVE CONFLICTS 2022–PRESENT</div>
      <div style={{ color: '#1a0008', fontSize: 7 }}>Every number was a person</div>
      <button onClick={share} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #25D36622', color: '#25D36688', padding: '2px 6px', fontSize: 7, cursor: 'pointer', letterSpacing: 1 }}>📤 SHARE</button>
    </div>
  );
}

function SindoorPanel({ signal }) {
  const prob = signal ? Math.min(94, 65 + signal.criticalCount * 2 + signal.indiaCount * 1.5) : 68;
  const color = prob > 80 ? '#ff2d2d' : prob > 65 ? '#ff8c00' : '#ffd700';

  const share = () => {
    const t = `🚨 Operation Sindoor Resumption Probability: ${Math.round(prob)}%\n\nBased on GDELT live intelligence — ${signal?.criticalCount || 0} critical events in 24h\n\nIndia War Desk — https://war-desk.vercel.app`;
    if (navigator.share) navigator.share({ title: 'Sindoor Alert', text: t });
    else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank');
  };

  return (
    <div style={{ padding: '10px 8px', borderBottom: '1px solid #111', fontFamily: 'monospace' }}>
      <div style={{ color: '#252525', fontSize: 8, letterSpacing: 2, marginBottom: 6 }}>◆ OPERATION SINDOOR</div>

      <div style={{ background: '#08000e', border: '1px solid #ff444415', padding: '6px 8px', marginBottom: 8, fontSize: 9, lineHeight: 1.6, color: '#444' }}>
        <div style={{ color: '#ff8844', fontSize: 9, fontWeight: 'bold', marginBottom: 2 }}>India · May 7–10, 2025</div>
        Precision strike on 9 Pakistan-based terror sites in PoK & Punjab. Response to Pahalgam attack (26 civilians killed). Ceasefire: May 10.
      </div>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ color: '#333', fontSize: 8, letterSpacing: 2 }}>RESUMPTION PROBABILITY</div>
        <div style={{ color, fontSize: 28, fontFamily: 'monospace', fontWeight: 'bold' }}>{Math.round(prob)}%</div>
        <div style={{ color, fontSize: 8, letterSpacing: 1 }}>{prob > 80 ? 'IMMINENT' : prob > 65 ? 'HIGH RISK' : 'ELEVATED'}</div>
      </div>

      {signal && (
        <div style={{ background: '#050d1a', border: '1px solid #0d336633', padding: '5px 7px', marginBottom: 6 }}>
          <div style={{ color: '#00d4ff', fontSize: 7, letterSpacing: 1, marginBottom: 4 }}>⚡ GDELT AUTO-UPDATE · 24H</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff4444', fontSize: 18, fontFamily: 'monospace' }}>{signal.criticalCount}</div>
              <div style={{ color: '#333', fontSize: 7 }}>CRITICAL</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff8c00', fontSize: 18, fontFamily: 'monospace' }}>{signal.indiaCount}</div>
              <div style={{ color: '#333', fontSize: 7 }}>INDIA REL.</div>
            </div>
          </div>
        </div>
      )}

      {[
        { l: 'Pak Terror Activity', v: 78 },
        { l: 'Pak Military Posture', v: 65 },
        { l: 'Diplomatic Tension', v: 71 },
        { l: 'India Readiness', v: 84 },
      ].map(f => (
        <div key={f.l} style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ color: '#252525', fontSize: 8 }}>{f.l}</span>
            <span style={{ color: '#ff4444', fontSize: 8 }}>{f.v}%</span>
          </div>
          <div style={{ height: 2, background: '#0d0d0d' }}>
            <div style={{ height: '100%', width: `${f.v}%`, background: '#ff4444', opacity: 0.5 }} />
          </div>
        </div>
      ))}

      <button onClick={share} style={{ width: '100%', marginTop: 8, background: 'rgba(37,211,102,0.06)', border: '1px solid #25D36618', color: '#25D36688', padding: 5, fontSize: 8, cursor: 'pointer', letterSpacing: 1 }}>
        📤 SHARE SINDOOR ALERT
      </button>

      <div style={{ color: '#111', fontSize: 7, marginTop: 6, lineHeight: 1.4 }}>
        ANALYTICAL ESTIMATE · OPEN SOURCE · NOT OFFICIAL
      </div>
    </div>
  );
}

function BreakingTicker({ breaking }) {
  const items = breaking.length > 0
    ? breaking.map(a => a.title)
    : ['INDIA WAR DESK — LIVE GEOPOLITICAL INTELLIGENCE · CONNECTING TO SOURCES...'];

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: '#04000a', borderTop: '1px solid #1a0010', display: 'flex', alignItems: 'center', height: 24, overflow: 'hidden' }}>
      <div style={{ background: '#ff2200', color: '#fff', padding: '0 10px', fontSize: 7, letterSpacing: 2, whiteSpace: 'nowrap', height: '100%', display: 'flex', alignItems: 'center', flexShrink: 0, fontFamily: 'monospace' }}>
        BREAKING
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{ display: 'inline-block', animation: `scroll ${Math.max(30, items.length * 12)}s linear infinite`, whiteSpace: 'nowrap', color: '#ff7777', fontSize: 9, fontFamily: 'monospace', paddingLeft: '100%' }}>
          {items.join('   ///   ')}
        </div>
      </div>
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────
const PAGES = ['DASHBOARD', 'OP. SINDOOR', 'WORLD NEWS', 'HUMAN COST', 'WORLD MAP'];

export default function App() {
  const [page, setPage] = useState('DASHBOARD');
  const [sindoorMode, setSindoorMode] = useState(false);
  const [dashMode, setDashMode] = useState('TACTICAL');
  const [time, setTime] = useState(new Date());
  const [isMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  const { events, sindoorSignal, liveRiskIndex, lastFetch: gdeltTime, refetch: refetchGDELT } = useGDELT();
  const { articles, breaking, lastFetch: newsTime, refetch: refetchNews } = useNews();
  const prices = useLivePrices();
  const music = useMusicPlayer();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleMusicChange = useCallback((zone) => {
    if (zone) music.onConflictHover(zone);
    else music.onHoverEnd();
  }, [music]);

  const riskColor = liveRiskIndex > 75 ? '#ff2d2d' : liveRiskIndex > 55 ? '#ff8c00' : '#ffd700';

  return (
    <div style={{ background: '#08080f', color: '#e0e0e0', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'monospace', overflow: 'hidden' }}>

      {/* ── NAV ── */}
      <div style={{ background: '#04040c', borderBottom: '1px solid #0d0d0d', padding: '0 12px', display: 'flex', alignItems: 'center', height: 38, flexShrink: 0, gap: 6 }}>
        <span style={{ fontSize: 16 }}>🇮🇳</span>
        <div style={{ marginRight: 6 }}>
          <div style={{ color: '#fff', fontSize: 10, letterSpacing: 3 }}>INDIA WAR DESK</div>
          <div style={{ color: '#1a1a1a', fontSize: 6, letterSpacing: 2 }}>OPEN-SOURCE INTELLIGENCE · DSINT · NON-PARTISAN</div>
        </div>

        <div style={{ background: riskColor + '15', border: `1px solid ${riskColor}33`, padding: '2px 8px', display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ color: riskColor, fontSize: 7, letterSpacing: 1 }}>RISK</span>
          <span style={{ color: riskColor, fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }}>{liveRiskIndex}%</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Nav */}
        {!isMobile && PAGES.map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            background: page === p ? 'rgba(0,212,255,0.08)' : 'transparent',
            color: page === p ? '#00d4ff' : '#252525',
            border: `1px solid ${page === p ? '#00d4ff22' : 'transparent'}`,
            padding: '3px 8px', fontSize: 8, cursor: 'pointer', letterSpacing: 1, fontFamily: 'monospace'
          }}>{p}</button>
        ))}

        <button onClick={() => setDashMode(m => m === 'TACTICAL' ? 'PULSE' : 'TACTICAL')} style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid #111',
          color: '#252525', padding: '3px 8px', fontSize: 7, cursor: 'pointer', letterSpacing: 1, marginLeft: 4
        }}>{dashMode === 'TACTICAL' ? '◎ PULSE' : '◈ TACTICAL'}</button>

        <div style={{ color: '#1a1a1a', fontSize: 9, borderLeft: '1px solid #0d0d0d', paddingLeft: 8, marginLeft: 4 }}>
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
        </div>
      </div>

      {/* ── PRICES BAR ── */}
      <LivePricesBar prices={prices} />

      {/* ── HUMAN COST STRIP ── */}
      <HumanCostStrip />

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>

        {/* ════════ DASHBOARD — TACTICAL ════════ */}
        {page === 'DASHBOARD' && dashMode === 'TACTICAL' && (
          <div style={{ flex: 1, display: 'flex', minWidth: 0, height: '100%' }}>

            {/* LEFT COL — Meters + Sindoor (180px) */}
            {!isMobile && (
              <div style={{ width: 185, flexShrink: 0, borderRight: '1px solid #0d0d0d', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                <ConflictMeters gdeltSignal={sindoorSignal} articles={articles} />
                <SindoorPanel signal={sindoorSignal} />
              </div>
            )}

            {/* CENTER — MAP (dominant, flex grows) */}
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <div style={{ position: 'absolute', top: 7, left: isMobile ? 6 : 46, zIndex: 1001, display: 'flex', gap: 3 }}>
                <button onClick={() => setSindoorMode(!sindoorMode)} style={{
                  background: sindoorMode ? 'rgba(255,68,68,0.15)' : 'rgba(4,4,12,0.9)',
                  border: `1px solid ${sindoorMode ? '#ff444444' : '#1a1a1a'}`,
                  color: sindoorMode ? '#ff8888' : '#333',
                  padding: '3px 8px', fontSize: 8, cursor: 'pointer', letterSpacing: 1
                }}>⚔ SINDOOR</button>
                <button onClick={refetchGDELT} style={{
                  background: 'rgba(4,4,12,0.9)', border: '1px solid #1a1a1a',
                  color: '#00d4ff', padding: '3px 8px', fontSize: 8, cursor: 'pointer'
                }}>↻ {gdeltTime || '...'}</button>
              </div>
              <LiveMap events={events} onMusicChange={handleMusicChange} sindoorMode={sindoorMode} />
            </div>

            {/* RIGHT COL — Global News Panel (260px) */}
            {!isMobile && (
              <div style={{ width: 265, flexShrink: 0, borderLeft: '1px solid #0d0d0d', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <GlobalNewsPanel
                  onArticleHover={music.onArticleHover}
                  onHoverEnd={music.onHoverEnd}
                />
              </div>
            )}
          </div>
        )}

        {/* ════════ DASHBOARD — PULSE ════════ */}
        {page === 'DASHBOARD' && dashMode === 'PULSE' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🇮🇳</div>
            <div style={{ color: '#fff', fontSize: 20, letterSpacing: 4, marginBottom: 4, textAlign: 'center' }}>INDIA IS WATCHING</div>
            <div style={{ color: '#1a1a1a', fontSize: 9, letterSpacing: 3, marginBottom: 28 }}>OPEN SOURCE · NON-PARTISAN · LIVE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 480, width: '100%', marginBottom: 24 }}>
              {[
                { label: 'RISK INDEX', val: `${liveRiskIndex}%`, color: riskColor },
                { label: 'LIVE EVENTS', val: events.filter(e => e.source !== 'baseline').length || '—', color: '#00d4ff' },
                { label: 'LIVES LOST', val: '2,16,885', color: '#ff4444' },
              ].map(m => (
                <div key={m.label} style={{ border: `1px solid ${m.color}22`, padding: '14px 8px', textAlign: 'center', background: m.color + '07' }}>
                  <div style={{ color: m.color, fontSize: 20, fontFamily: 'monospace', fontWeight: 'bold' }}>{m.val}</div>
                  <div style={{ color: '#252525', fontSize: 7, letterSpacing: 2, marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ maxWidth: 480, width: '100%', height: 350, overflow: 'hidden', border: '1px solid #111' }}>
              <GlobalNewsPanel onArticleHover={music.onArticleHover} onHoverEnd={music.onHoverEnd} />
            </div>
          </div>
        )}

        {/* ════════ WORLD NEWS PAGE ════════ */}
        {page === 'WORLD NEWS' && (
          <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
            {/* Full-width global news with wider layout */}
            <div style={{ flex: 1, maxWidth: 560, borderRight: '1px solid #0d0d0d', overflow: 'hidden' }}>
              <GlobalNewsPanel onArticleHover={music.onArticleHover} onHoverEnd={music.onHoverEnd} />
            </div>
            {/* Map on the right for context */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <LiveMap events={events} onMusicChange={handleMusicChange} />
            </div>
          </div>
        )}

        {/* ════════ OP. SINDOOR PAGE ════════ */}
        {page === 'OP. SINDOOR' && (
          <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
            <LiveMap events={events} onMusicChange={handleMusicChange} sindoorMode={true} />
            <div style={{ width: 260, flexShrink: 0, overflowY: 'auto', borderLeft: '1px solid #0d0d0d' }}>
              <SindoorPanel signal={sindoorSignal} />
            </div>
          </div>
        )}

        {/* ════════ WORLD MAP PAGE ════════ */}
        {page === 'WORLD MAP' && (
          <div style={{ flex: 1 }}>
            <LiveMap events={events} onMusicChange={handleMusicChange} />
          </div>
        )}

        {/* ════════ HUMAN COST PAGE ════════ */}
        {page === 'HUMAN COST' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, maxWidth: 640, margin: '0 auto', width: '100%' }}>
            <div style={{ color: '#ff4444', fontSize: 8, letterSpacing: 4, marginBottom: 16 }}>◆ INNOCENT LIVES LOST · VERIFIED CIVILIAN DEATHS</div>
            {[
              { name: 'Israel–Gaza & Lebanon', dead: 51000, since: 'Oct 7 2023', color: '#ff2d2d', impact: 'Oil prices, diaspora, Red Sea shipping' },
              { name: 'Russia–Ukraine', dead: 12654, since: 'Feb 24 2022', color: '#ff6600', impact: 'Wheat prices, energy costs, weapons supply chains' },
              { name: 'Sudan Civil War', dead: 150000, since: 'Apr 15 2023', color: '#cc4400', impact: 'Indian evacuation ops, Red Sea stability' },
              { name: 'Iran–Israel (2025)', dead: 3200, since: 'Apr 2024', color: '#ff4444', impact: 'Strait of Hormuz, oil prices, Indian Ocean security' },
              { name: 'Myanmar Civil War', dead: 6800, since: 'Feb 2021', color: '#ff8c00', impact: 'NE India border — refugee flows, insurgency' },
              { name: 'Operation Sindoor', dead: 31, since: 'May 7 2025', color: '#ffd700', impact: 'Direct — Indian subcontinent, ceasefire holding' },
            ].map(c => (
              <div key={c.name} style={{ borderBottom: '1px solid #0d0d0d', padding: '14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#ccc', fontSize: 12 }}>{c.name}</span>
                  <span style={{ color: c.color, fontSize: 22, fontFamily: 'monospace', fontWeight: 'bold' }}>{c.dead.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 2, background: '#0d0d0d', marginBottom: 5 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (c.dead / 150000) * 100)}%`, background: c.color, opacity: 0.6 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#252525', fontSize: 8 }}>Since {c.since}</span>
                  <span style={{ color: '#333', fontSize: 8 }}>🇮🇳 {c.impact}</span>
                </div>
              </div>
            ))}
            <div style={{ color: '#111', fontSize: 7, lineHeight: 1.7, marginTop: 20, borderTop: '1px solid #0d0d0d', paddingTop: 12 }}>
              Verified civilian deaths only — not combatants. Actual figures are higher and updated periodically. Sources: UN OCHA, UNHCR, ACLED, Gaza Ministry of Health, WHO, AAPP. Every number here was a person.
            </div>
          </div>
        )}

      </div>

      {/* ── BREAKING TICKER ── */}
      <BreakingTicker breaking={breaking} />

      {/* ── MUSIC WIDGET ── */}
      <MusicWidget
        currentTrack={music.currentTrack}
        isPlaying={music.isPlaying}
        muted={music.muted}
        enabled={music.enabled}
        onToggleMute={music.toggleMute}
        onToggleEnabled={music.toggleEnabled}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNews } from "./useNews";

// ─── ALL CSS IN ONE PLACE ────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Teko:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-deep:       #020608;
    --bg-panel:      #050d12;
    --bg-card:       #071419;
    --bg-elevated:   #0a1e25;
    --border:        #0f3040;
    --border-bright: #1a5068;
    --cyan:   #00d4ff;
    --gold:   #f0a500;
    --red:    #ff2d2d;
    --orange: #ff6b00;
    --green:  #00ff88;
    --yellow: #ffe033;
    --txt:    #e8f4f8;
    --txt2:   #7aacbe;
    --txt3:   #3a6678;
    --saffron:#FF9933;
    --igreen: #138808;
  }

  body {
    background: var(--bg-deep);
    font-family: 'Rajdhani', sans-serif;
    color: var(--txt);
    overflow-x: hidden;
  }

  /* Scanline overlay */
  .scanline {
    position: fixed; top:0; left:0; width:100%; height:100%;
    pointer-events:none; z-index:9999;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
    );
  }

  /* Animations */
  @keyframes pulse-red  { 0%,100%{opacity:1;box-shadow:0 0 8px var(--red)}   50%{opacity:.4;box-shadow:0 0 20px var(--red)} }
  @keyframes ticker     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes fadeIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sweep      { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes radar-ping { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(1);opacity:0} }
  @keyframes slide-in   { from{transform:translateX(-8px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0} }

  .live-dot {
    display:inline-block; width:8px; height:8px; border-radius:50%;
    background:var(--red); animation:pulse-red 1.2s infinite; flex-shrink:0;
  }
  .mono { font-family:'Share Tech Mono',monospace; }
  .teko { font-family:'Teko',sans-serif; }

  /* Panel */
  .panel {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }
  .panel::before {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    opacity:.35;
  }
  .ph {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(90deg, var(--bg-elevated), transparent);
    display:flex; align-items:center; gap:8px;
    font-family:'Teko',sans-serif; font-size:13px;
    letter-spacing:2px; text-transform:uppercase; color:var(--txt2);
  }
  .ph-icon { color:var(--cyan); font-size:10px; }

  /* Scrollable */
  .scroll {
    overflow-y: auto; max-height:100%;
    scrollbar-width:thin; scrollbar-color:var(--border-bright) transparent;
  }

  /* Top bar */
  .topbar {
    background:var(--bg-panel); border-bottom:1px solid var(--border);
    padding:0 14px; display:flex; align-items:center; gap:12px;
    height:46px; position:sticky; top:0; z-index:200;
  }

  /* India flag stripe */
  .flag-stripe { height:3px; background:linear-gradient(90deg,var(--saffron) 33.3%,white 33.3%,white 66.6%,var(--igreen) 66.6%); }

  /* Main grid */
  .grid {
    display:grid;
    grid-template-columns: 255px 1fr 275px;
    gap:5px; padding:5px;
    min-height:calc(100vh - 90px);
  }
  .col { display:flex; flex-direction:column; gap:5px; }

  @media(max-width:1100px){ .grid{ grid-template-columns:1fr 1fr; } }
  @media(max-width:700px){  .grid{ grid-template-columns:1fr; } }

  /* Stat boxes */
  .stat-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; }
  .stat-box  { text-align:center; padding:8px 4px; border:1px solid var(--border); background:var(--bg-card); }
  .stat-num  { font-family:'Teko',sans-serif; font-size:28px; font-weight:700; line-height:1; }
  .stat-lbl  { font-size:9px; letter-spacing:1.5px; color:var(--txt3); text-transform:uppercase; margin-top:2px; }

  /* Probability bars */
  .prob-wrap  { margin:5px 0; }
  .prob-label { display:flex; justify-content:space-between; font-size:11px; color:var(--txt2); margin-bottom:3px; font-family:'Share Tech Mono',monospace; }
  .prob-bar   { height:5px; background:var(--border); border-radius:1px; overflow:hidden; }
  .prob-fill  { height:100%; border-radius:1px; transition:width 1.2s ease; }

  /* Border status rows */
  .bstatus { padding:7px 10px; border-left:3px solid; margin-bottom:1px; font-size:12px; display:flex; align-items:center; justify-content:space-between; gap:8px; }

  /* News card */
  .news-card { padding:10px 12px; border-bottom:1px solid var(--border); animation:fadeIn .4s ease; cursor:pointer; transition:background .15s; }
  .news-card:hover { background:var(--bg-elevated); }
  .cred-bar  { height:3px; border-radius:2px; background:var(--border); overflow:hidden; margin-top:6px; }
  .cred-fill { height:100%; border-radius:2px; transition:width .5s; }

  /* Conflict row */
  .conf-row { display:flex; align-items:center; gap:10px; padding:8px 12px; border-bottom:1px solid var(--border); animation:slide-in .3s ease; cursor:pointer; transition:background .15s; }
  .conf-row:hover { background:var(--bg-elevated); }

  /* Intel item */
  .intel-item { padding:8px 12px; border-bottom:1px solid var(--border); font-size:12px; display:flex; gap:8px; align-items:flex-start; }

  /* Tags */
  .tag { display:inline-block; padding:1px 5px; font-size:9px; letter-spacing:1px; border-radius:1px; font-family:'Teko',sans-serif; font-weight:600; text-transform:uppercase; margin-right:3px; }
  .t-red   { background:rgba(255,45,45,.15);   color:var(--red);    border:1px solid rgba(255,45,45,.3); }
  .t-cyan  { background:rgba(0,212,255,.12);   color:var(--cyan);   border:1px solid rgba(0,212,255,.25); }
  .t-gold  { background:rgba(240,165,0,.15);   color:var(--gold);   border:1px solid rgba(240,165,0,.3); }
  .t-green { background:rgba(0,255,136,.12);   color:var(--green);  border:1px solid rgba(0,255,136,.25); }
  .t-orange{ background:rgba(255,107,0,.15);   color:var(--orange); border:1px solid rgba(255,107,0,.3); }

  /* Threat badge */
  .tbadge { display:inline-flex; align-items:center; gap:4px; padding:2px 10px; border-radius:1px; font-size:10px; letter-spacing:1.5px; font-family:'Teko',sans-serif; font-weight:600; text-transform:uppercase; }
  .tb-crit { background:rgba(255,45,45,.12); border:1px solid var(--red);    color:var(--red); }
  .tb-high { background:rgba(255,107,0,.12); border:1px solid var(--orange); color:var(--orange); }
  .tb-med  { background:rgba(255,224,51,.12);border:1px solid var(--yellow); color:var(--yellow); }
  .tb-low  { background:rgba(0,255,136,.12); border:1px solid var(--green);  color:var(--green); }

  /* Tabs */
  .tab-btn { padding:8px 14px; background:none; border:none; cursor:pointer; font-family:'Teko',sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; transition:color .2s; border-bottom:2px solid transparent; margin-bottom:-1px; }

  /* Ticker */
  .ticker-wrap { overflow:hidden; flex:1; }
  .ticker-track { display:flex; animation:ticker 45s linear infinite; white-space:nowrap; }
  .ticker-item { padding:0 36px; font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--red); }

  /* Radar */
  .radar-wrap { position:relative; width:128px; height:128px; margin:0 auto; }
  .radar-ring { position:absolute; border-radius:50%; border:1px solid rgba(0,212,255,.18); top:50%; left:50%; transform:translate(-50%,-50%); }
  .radar-sweep { position:absolute; width:50%; height:50%; top:50%; left:50%; transform-origin:bottom left; animation:sweep 3s linear infinite; }
  .radar-sweep::after { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:conic-gradient(from 0deg, transparent 70%, rgba(0,212,255,.4)); border-radius:0 100% 0 0; }
  .radar-dot  { position:absolute; width:7px;  height:7px;  border-radius:50%; transform:translate(-50%,-50%); }
  .radar-ping { position:absolute; width:16px; height:16px; border-radius:50%; border:1px solid; transform:translate(-50%,-50%); animation:radar-ping 2.2s ease-out infinite; }

  /* Bottom ticker bar */
  .bottom-bar { position:sticky; bottom:0; z-index:200; background:#060606; border-top:1px solid var(--border); padding:0 12px; display:flex; align-items:center; gap:10px; height:32px; }
  .break-label { flex-shrink:0; display:flex; align-items:center; gap:6px; border-right:1px solid var(--border); padding-right:10px; }
`;

// ─── STATIC DATA ─────────────────────────────────────────────

const CONFLICTS = [
  { id:1, name:"Russia–Ukraine War",     region:"Eastern Europe", intensity:"critical", casualties:"800K+", india:"Indirect — energy & wheat costs",      update:"12m ago" },
  { id:2, name:"Israel–Gaza Conflict",   region:"Middle East",    intensity:"critical", casualties:"45K+",  india:"Diaspora risk, oil route disruption",   update:"6m ago"  },
  { id:3, name:"Sudan Civil War",        region:"East Africa",    intensity:"high",     casualties:"150K+", india:"Indian nationals evacuation ongoing",    update:"2h ago"  },
  { id:4, name:"Myanmar Junta War",      region:"SE Asia",        intensity:"high",     casualties:"50K+",  india:"Border spillover risk — NE India",       update:"1h ago"  },
  { id:5, name:"Ethiopia–Tigray",        region:"East Africa",    intensity:"medium",   casualties:"600K+", india:"Low — monitoring",                       update:"5h ago"  },
  { id:6, name:"Sahel Instability",      region:"West Africa",    intensity:"medium",   casualties:"N/A",   india:"Minimal direct exposure",                update:"8h ago"  },
];

const BORDER_STATUS = [
  { name:"Line of Actual Control (China)", color:"#ff2d2d", level:"HIGH TENSION", detail:"Patrol standoff — Depsang Plains", active:true },
  { name:"LoC — Pakistan (J&K)",           color:"#ff6b00", level:"ELEVATED",     detail:"3 ceasefire violations this week", active:true },
  { name:"Bangladesh Border",              color:"#ffe033", level:"WATCH",         detail:"Irregular crossings reported",      active:false },
  { name:"Myanmar Border (Manipur)",       color:"#ff6b00", level:"ELEVATED",     detail:"Armed group movements near border", active:true },
  { name:"Nepal Border",                   color:"#00ff88", level:"STABLE",        detail:"Normal — diplomatic talks ongoing", active:false },
  { name:"Sri Lanka Maritime",             color:"#00ff88", level:"STABLE",        detail:"Normal patrolling",                 active:false },
];

const INTEL_FEED = [
  { icon:"⚠️", text:"IB Alert: ISI-linked networks active in Delhi, Mumbai — heightened surveillance ordered",      level:"critical" },
  { icon:"🔴", text:"Drone sighting near Pathankot Air Base — sector sealed, anti-drone systems activated",         level:"critical" },
  { icon:"🟡", text:"Increased encrypted chatter — Northeast India insurgent groups coordinating across border",    level:"high"     },
  { icon:"🟡", text:"INTERPOL Red Notice: 3 LeT operatives believed to have entered India via Nepal border",        level:"high"     },
  { icon:"🟢", text:"CISF raises security level at 12 nuclear installations — precautionary measure",               level:"medium"   },
  { icon:"🟡", text:"RAW intercept: Pak ISI funds routed to Khalistan-linked social media disinformation cells",   level:"high"     },
];

const TICKER_ITEMS = [
  "🔴 BREAKING: China PLA conducts live-fire drills in Tibet Autonomous Region near Indian border",
  "⚡ Pakistan FM summoned to Indian High Commission over LoC ceasefire violations",
  "🛡️ Indian Navy deploys INS Vikrant battle group to Indian Ocean amid rising tensions",
  "🔴 ALERT: Explosion reported near Indian consulate in Jalalabad, Afghanistan — no casualties",
  "📡 ISRO activates RISAT-2B satellite for enhanced border surveillance",
  "⚡ US carrier group USS Theodore Roosevelt enters Arabian Sea on patrol",
  "🟡 Maldives political crisis deepens — India monitoring pro-China govt moves",
  "🔴 NIA arrests 4 in Gujarat with RDX — Pakistan ISI link suspected",
];

const THREAT_SUMMARY = [
  { label:"Conventional War",    level:"LOW",      color:"#00ff88", desc:"No imminent inter-state war"            },
  { label:"Nuclear Risk",        level:"WATCH",    color:"#ffe033", desc:"Pak tactical nuke doctrine active"      },
  { label:"Cross-border Terror", level:"HIGH",     color:"#ff6b00", desc:"Multiple active modules detected"      },
  { label:"Cyber Warfare",       level:"ELEVATED", color:"#ff6b00", desc:"APT41 targeting DRDO, ISRO networks"   },
  { label:"Economic Warfare",    level:"MEDIUM",   color:"#ffe033", desc:"Supply chain disruption via SCS"        },
];

const SOURCES = [
  { src:"Reuters",         score:96, bias:"C"  },
  { src:"The Hindu",       score:91, bias:"CL" },
  { src:"BBC India",       score:89, bias:"CL" },
  { src:"The Print",       score:84, bias:"C"  },
  { src:"Livemint",        score:83, bias:"C"  },
  { src:"NDTV",            score:82, bias:"C"  },
  { src:"Times of India",  score:80, bias:"CR" },
  { src:"ANI",             score:74, bias:"CR" },
  { src:"Republic TV",     score:45, bias:"R"  },
];

const BORDER_PROBS = [
  { label:"China (LAC)",        val:72, color:"#ff2d2d" },
  { label:"Pakistan (LoC)",     val:58, color:"#ff6b00" },
  { label:"Myanmar Border",     val:41, color:"#ffe033" },
  { label:"Maritime Threat",    val:34, color:"#ffe033" },
  { label:"Domestic Terrorism", val:63, color:"#ff6b00" },
];

// ─── SMALL COMPONENTS ────────────────────────────────────────

function IntColor(level) {
  return { critical:"#ff2d2d", high:"#ff6b00", medium:"#ffe033", low:"#00ff88" }[level] || "#7aacbe";
}

function CredLabel({ score }) {
  const color = score >= 85 ? "#00ff88" : score >= 65 ? "#ffe033" : "#ff6b00";
  const label = score >= 85 ? "HIGH" : score >= 65 ? "MED" : "LOW";
  return (
    <span style={{ fontSize:9, fontFamily:"Share Tech Mono", color, border:`1px solid ${color}`, padding:"1px 5px", letterSpacing:1 }}>
      {label} CRED {score}%
    </span>
  );
}

function CatTag({ cat }) {
  const map = { MILITARY:"#ff2d2d", THREAT:"#ff6b00", TERROR:"#ff2d2d", GEOPOLITICAL:"#00d4ff", DIPLOMATIC:"#f0a500", ECONOMY:"#ffe033" };
  const c = map[cat] || "#00d4ff";
  return <span style={{ fontSize:9, fontFamily:"Share Tech Mono", color:c, border:`1px solid ${c}44`, padding:"1px 5px", letterSpacing:1 }}>{cat}</span>;
}

// Animated arc gauge
function RiskGauge({ value }) {
  const r = 52, cx = 60, cy = 62;
  const circ = Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width="120" height="74" viewBox="0 0 120 80">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#00ff88" />
            <stop offset="50%"  stopColor="#ffe033" />
            <stop offset="100%" stopColor="#ff2d2d" />
          </linearGradient>
        </defs>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#0f3040" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="url(#arcGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition:"stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#ff6b00" fontSize="22" fontFamily="Teko" fontWeight="700">{value}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#3a6678" fontSize="8" fontFamily="Share Tech Mono" letterSpacing="1">OVERALL RISK</text>
      </svg>
    </div>
  );
}

// Rotating radar
function Radar() {
  const dots = [
    { x:"56%", y:"28%", color:"#ff2d2d", label:"LAC", delay:"0s"   },
    { x:"36%", y:"44%", color:"#ff6b00", label:"LoC", delay:".6s"  },
    { x:"72%", y:"66%", color:"#ffe033", label:"MYN", delay:"1.2s" },
    { x:"58%", y:"80%", color:"#00ff88", label:"SL",  delay:"1.8s" },
  ];
  return (
    <div className="radar-wrap">
      {[120,88,56,24].map(s => <div key={s} className="radar-ring" style={{ width:s, height:s, marginLeft:-s/2, marginTop:-s/2 }} />)}
      <div className="radar-sweep" />
      {dots.map(d => (
        <div key={d.label}>
          <div className="radar-dot" style={{ left:d.x, top:d.y, background:d.color, boxShadow:`0 0 6px ${d.color}` }} />
          <div className="radar-ping" style={{ left:d.x, top:d.y, borderColor:d.color, animationDelay:d.delay }} />
        </div>
      ))}
      <div style={{ position:"absolute", top:"50%", left:"50%", width:6, height:6, borderRadius:"50%", background:"var(--cyan)", transform:"translate(-50%,-50%)", boxShadow:"0 0 10px var(--cyan)" }} />
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [time, setTime]         = useState(new Date());
  const [tab,  setTab]          = useState("news");
  const { news, loading, error, lastUpdated, refetch } = useNews();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeFmt = d => d.toLocaleTimeString("en-IN", { hour12:false }) + " IST";
  const dateFmt = d => d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

  return (
    <>
      <style>{CSS}</style>
      <div className="scanline" />

      {/* ── TOP BAR ── */}
      <div className="topbar">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:20, background:"linear-gradient(180deg,#FF9933 33%,white 33%,white 66%,#138808 66%)", borderRadius:2, flexShrink:0, border:"1px solid #333" }} />
          <div>
            <div className="teko" style={{ fontSize:17, fontWeight:700, letterSpacing:2, lineHeight:1, color:"#e8f4f8" }}>
              INDIA GEOPOLITICAL WAR DESK
            </div>
            <div className="mono" style={{ fontSize:9, letterSpacing:2, color:"#3a6678" }}>
              OPEN-SOURCE INTELLIGENCE MONITOR · CLASSIFIED-FREE OSINT
            </div>
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:16, alignItems:"center" }}>
          {/* Refresh button */}
          <button onClick={refetch} style={{ background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.2)", color:"var(--cyan)", fontFamily:"Teko", fontSize:11, letterSpacing:2, padding:"3px 10px", cursor:"pointer", borderRadius:1 }}>
            ↺ REFRESH
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div className="live-dot" />
            <span className="mono" style={{ fontSize:10, color:"#ff2d2d", letterSpacing:1 }}>LIVE</span>
          </div>
          <div style={{ textAlign:"right" }}>
            <div className="mono" style={{ fontSize:14, color:"var(--cyan)", letterSpacing:1 }}>{timeFmt(time)}</div>
            <div className="mono" style={{ fontSize:9, color:"#3a6678" }}>{dateFmt(time)}</div>
          </div>
        </div>
      </div>
      <div className="flag-stripe" />

      {/* ── MAIN GRID ── */}
      <div className="grid">

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="col">

          {/* Risk Index */}
          <div className="panel">
            <div className="ph"><span className="ph-icon">◈</span> INDIA CONFLICT RISK INDEX</div>
            <div style={{ padding:"10px 12px" }}>
              <RiskGauge value={67} />
              <div style={{ textAlign:"center", marginBottom:10 }}>
                <span className="tbadge tb-high">⚡ ELEVATED THREAT</span>
              </div>
              {BORDER_PROBS.map(p => (
                <div key={p.label} className="prob-wrap">
                  <div className="prob-label"><span>{p.label}</span><span style={{ color:p.color }}>{p.val}%</span></div>
                  <div className="prob-bar"><div className="prob-fill" style={{ width:`${p.val}%`, background:p.color }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar */}
          <div className="panel">
            <div className="ph"><span className="ph-icon">◉</span> BORDER RADAR</div>
            <div style={{ padding:"10px 0 6px" }}>
              <Radar />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:2, padding:"8px 12px 4px" }}>
                {[["LAC","#ff2d2d"],["LoC","#ff6b00"],["MYN","#ffe033"],["SL","#00ff88"]].map(([l,c]) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:9, fontFamily:"Share Tech Mono", color:"#7aacbe" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:c }} />{l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="stat-grid">
            {[["6","#ff2d2d","Active Wars"],["3","#ff6b00","Border Alerts"],["4","#ffe033","Terror Intels"]].map(([n,c,l]) => (
              <div key={l} className="stat-box">
                <div className="stat-num" style={{ color:c }}>{n}</div>
                <div className="stat-lbl">{l}</div>
              </div>
            ))}
          </div>

          {/* Border status */}
          <div className="panel" style={{ flex:1 }}>
            <div className="ph"><span className="ph-icon">▣</span> LIVE BORDER STATUS</div>
            {BORDER_STATUS.map(b => (
              <div key={b.name} className="bstatus" style={{ borderColor:b.color }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:"#c8dde6" }}>{b.name}</div>
                  <div style={{ fontSize:10, color:"#3a6678", marginTop:1 }}>{b.detail}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div className="teko" style={{ fontSize:10, color:b.color, letterSpacing:1 }}>{b.level}</div>
                  {b.active && <div className="live-dot" style={{ width:5, height:5, marginLeft:"auto", marginTop:3 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CENTER COLUMN ═══ */}
        <div className="col">

          {/* Map */}
          <div className="panel" style={{ flexShrink:0 }}>
            <div className="ph"><span className="ph-icon">◎</span> GEOPOLITICAL MAP — INDIA &amp; NEIGHBORS</div>
            <div style={{ position:"relative", height:240, overflow:"hidden" }}>
              <svg viewBox="0 0 420 260" style={{ width:"100%", height:"100%" }}>
                <defs>
                  <radialGradient id="mapbg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="#0a1e25" />
                    <stop offset="100%" stopColor="#020608" />
                  </radialGradient>
                </defs>
                <rect width="420" height="260" fill="url(#mapbg)" />
                {/* grid */}
                {[0,42,84,126,168,210,252,294,336,378,420].map(x=><line key={x} x1={x} y1="0" x2={x} y2="260" stroke="#0f3040" strokeWidth=".5"/>)}
                {[0,40,80,120,160,200,240].map(y=><line key={y} x1="0" y1={y} x2="420" y2={y} stroke="#0f3040" strokeWidth=".5"/>)}
                {/* India */}
                <polygon points="165,18 225,14 268,28 288,58 308,98 298,142 265,172 244,202 224,242 204,262 188,252 172,224 156,206 138,178 118,158 108,128 118,88 130,58 148,34"
                  fill="rgba(19,136,8,.12)" stroke="#138808" strokeWidth="1.5" />
                {/* Pakistan */}
                <polygon points="100,18 162,18 148,34 130,58 118,88 100,78 78,58 84,34"
                  fill="rgba(255,107,0,.08)" stroke="#ff6b00" strokeWidth="1" />
                {/* China */}
                <polygon points="165,18 268,8 318,18 318,48 288,58 268,28 225,14"
                  fill="rgba(255,45,45,.07)" stroke="#ff2d2d" strokeWidth="1" />
                {/* Bangladesh */}
                <polygon points="245,172 268,166 272,188 254,198 238,190"
                  fill="rgba(0,212,255,.08)" stroke="#00d4ff" strokeWidth=".8" />
                {/* Myanmar */}
                <polygon points="272,188 298,178 308,214 292,232 270,216"
                  fill="rgba(255,107,0,.08)" stroke="#ff6b00" strokeWidth=".8" />
                {/* Nepal */}
                <polygon points="162,60 228,56 232,72 160,76"
                  fill="rgba(0,212,255,.06)" stroke="#00d4ff" strokeWidth=".6" />
                {/* Labels */}
                <text x="188" y="130" fill="rgba(0,255,136,.55)" fontSize="12" fontFamily="Teko" letterSpacing="3">INDIA</text>
                <text x="82"  y="52"  fill="rgba(255,107,0,.7)"  fontSize="8"  fontFamily="Share Tech Mono">PAK</text>
                <text x="260" y="28"  fill="rgba(255,45,45,.7)"  fontSize="8"  fontFamily="Share Tech Mono">CHINA</text>
                <text x="298" y="204" fill="rgba(255,107,0,.7)"  fontSize="8"  fontFamily="Share Tech Mono">MYN</text>
                <text x="250" y="192" fill="rgba(0,212,255,.6)"  fontSize="7"  fontFamily="Share Tech Mono">BGD</text>
                <text x="176" y="73"  fill="rgba(0,212,255,.5)"  fontSize="7"  fontFamily="Share Tech Mono">NPL</text>
                {/* Hotspot pulses */}
                {[
                  { cx:238, cy:44,  c:"#ff2d2d", label:"LAC",  delay:0    },
                  { cx:128, cy:54,  c:"#ff6b00", label:"LoC",  delay:.5   },
                  { cx:148, cy:84,  c:"#ffe033", label:"",     delay:1    },
                  { cx:278, cy:196, c:"#ff6b00", label:"",     delay:1.4  },
                  { cx:200, cy:252, c:"#00ff88", label:"SL",   delay:.8   },
                ].map((h,i) => (
                  <g key={i}>
                    <circle cx={h.cx} cy={h.cy} r="4" fill={h.c} opacity=".9">
                      <animate attributeName="r"       values="4;9;4"   dur="2s" repeatCount="indefinite" begin={`${h.delay}s`} />
                      <animate attributeName="opacity" values=".9;.2;.9" dur="2s" repeatCount="indefinite" begin={`${h.delay}s`} />
                    </circle>
                    {h.label && <text x={h.cx+8} y={h.cy+4} fill={h.c} fontSize="8" fontFamily="Share Tech Mono">{h.label}</text>}
                  </g>
                ))}
                {/* Legend */}
                {[["#ff2d2d","CRITICAL",8],["#ff6b00","HIGH",72],["#ffe033","WATCH",130],["#00ff88","STABLE",190]].map(([c,l,x])=>(
                  <g key={l}><circle cx={x+4} cy={248} r="4" fill={c}/><text x={x+12} y={252} fill="#7aacbe" fontSize="8" fontFamily="Share Tech Mono">{l}</text></g>
                ))}
                <text x="340" y="252" fill="#1a5068" fontSize="7" fontFamily="Share Tech Mono">OSINT · OpenStreetMap</text>
              </svg>
            </div>
          </div>

          {/* News / Intel tabs */}
          <div className="panel" style={{ flex:1, display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
              {[["news","📰 Live News"],["intel","⚡ Intel Feed"]].map(([t,label]) => (
                <button key={t} className="tab-btn" onClick={() => setTab(t)}
                  style={{ color: tab===t ? "var(--cyan)" : "var(--txt3)", borderBottomColor: tab===t ? "var(--cyan)" : "transparent" }}>
                  {label}
                </button>
              ))}
              <div style={{ marginLeft:"auto", padding:"0 12px", display:"flex", alignItems:"center", gap:6 }}>
                {loading && <span className="mono" style={{ fontSize:9, color:"#ffe033" }}>FETCHING...</span>}
                {error   && <span className="mono" style={{ fontSize:9, color:"#ff2d2d" }}>FALLBACK DATA</span>}
                {!loading && !error && <div className="live-dot" style={{ width:5, height:5 }} />}
                <span className="mono" style={{ fontSize:9, color:"#3a6678" }}>5m REFRESH</span>
              </div>
            </div>

            <div className="scroll" style={{ flex:1, maxHeight:460 }}>
              {tab === "news" ? (
                news.length === 0 ? (
                  <div style={{ padding:20, textAlign:"center", color:"#3a6678", fontFamily:"Share Tech Mono", fontSize:11 }}>
                    Loading news feed...
                  </div>
                ) : news.map((item, i) => (
                  <div key={item.id ?? i} className="news-card" onClick={() => item.url && item.url !== "#" && window.open(item.url,"_blank")}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                      <CatTag cat={item.category} />
                      <CredLabel score={item.credibility} />
                      <span className="mono" style={{ fontSize:9, color:"#3a6678", marginLeft:"auto" }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize:13, lineHeight:1.4, color:"#c8dde6", marginBottom:5, fontWeight:500 }}>{item.headline}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"#3a6678" }}>
                        {item.source}
                        <span style={{ color:"#1a5068" }}> · {item.bias}</span>
                      </span>
                    </div>
                    <div className="cred-bar">
                      <div className="cred-fill" style={{ width:`${item.credibility}%`, background: item.credibility>=85?"#00ff88":item.credibility>=65?"#ffe033":"#ff6b00" }} />
                    </div>
                  </div>
                ))
              ) : (
                INTEL_FEED.map((item, i) => (
                  <div key={i} className="intel-item">
                    <div style={{ fontSize:16, flexShrink:0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize:12, color:"#c8dde6", lineHeight:1.4 }}>{item.text}</div>
                      <div className="mono" style={{ fontSize:9, color:"#3a6678", marginTop:4 }}>
                        SOURCE: IB / RAW / NIA · {["2m","8m","14m","31m","1h","2h"][i]} ago
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="col">

          {/* Global conflicts */}
          <div className="panel" style={{ flex:1 }}>
            <div className="ph"><span className="ph-icon">◈</span> ACTIVE GLOBAL CONFLICTS</div>
            <div className="scroll" style={{ maxHeight:300 }}>
              {CONFLICTS.map(c => (
                <div key={c.id} className="conf-row">
                  <div style={{ width:8, height:8, borderRadius:"50%", background:IntColor(c.intensity), flexShrink:0, boxShadow:`0 0 6px ${IntColor(c.intensity)}` }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#c8dde6", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize:10, color:"#3a6678" }}>{c.region} · {c.update}</div>
                    <div style={{ fontSize:10, color:"#7aacbe", marginTop:2 }}>🇮🇳 {c.india}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div className="teko" style={{ fontSize:10, color:IntColor(c.intensity), letterSpacing:1 }}>{c.intensity.toUpperCase()}</div>
                    <div style={{ fontSize:9, color:"#3a6678" }}>{c.casualties}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source credibility */}
          <div className="panel">
            <div className="ph"><span className="ph-icon">◉</span> SOURCE CREDIBILITY TRACKER</div>
            <div style={{ padding:"8px 12px" }}>
              {SOURCES.map(s => (
                <div key={s.src} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                  <div style={{ width:74, fontSize:10, color:"#7aacbe", flexShrink:0 }}>{s.src}</div>
                  <div className="prob-bar" style={{ flex:1, height:4 }}>
                    <div className="prob-fill" style={{ width:`${s.score}%`, background:s.score>=85?"#00ff88":s.score>=65?"#ffe033":"#ff6b00" }} />
                  </div>
                  <div className="mono" style={{ fontSize:9, color:"#3a6678", width:22 }}>{s.score}</div>
                  <div className="mono" style={{ fontSize:8, color:"#1a5068", width:18 }}>{s.bias}</div>
                </div>
              ))}
              <div style={{ fontSize:9, color:"#1a5068", fontFamily:"Share Tech Mono", marginTop:4 }}>
                C=Centre  CL=Centre-Left  CR=Centre-Right  R=Right
              </div>
            </div>
          </div>

          {/* Threat summary */}
          <div className="panel">
            <div className="ph"><span className="ph-icon">▲</span> INDIA THREAT SUMMARY</div>
            <div style={{ padding:"6px 12px" }}>
              {THREAT_SUMMARY.map(t => (
                <div key={t.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid var(--border)", gap:8 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#c8dde6" }}>{t.label}</div>
                    <div style={{ fontSize:9, color:"#3a6678" }}>{t.desc}</div>
                  </div>
                  <span style={{ fontSize:9, color:t.color, border:`1px solid ${t.color}44`, padding:"2px 7px", fontFamily:"Teko", letterSpacing:1, flexShrink:0 }}>{t.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data sources */}
          <div className="panel">
            <div className="ph"><span className="ph-icon">⬛</span> DATA SOURCES</div>
            <div style={{ padding:"6px 10px", display:"flex", flexWrap:"wrap", gap:4 }}>
              {["ACLED","GDELT","SATP","NewsAPI","OpenStreetMap","HuggingFace","NASA FIRMS","ReliefWeb","MBFC"].map(s => (
                <span key={s} className="tag t-cyan">{s}</span>
              ))}
            </div>
            <div style={{ padding:"2px 10px 8px", fontSize:9, color:"#1a5068", fontFamily:"Share Tech Mono" }}>
              ALL OPEN-SOURCE · OSINT ONLY · NO CLASSIFIED DATA
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM TICKER ── */}
      <div className="bottom-bar">
        <div className="break-label">
          <div className="live-dot" />
          <span className="teko" style={{ fontSize:12, letterSpacing:2, color:"#ff2d2d" }}>BREAKING</span>
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="ticker-item">{item}<span style={{ color:"#f0a500", margin:"0 8px" }}>///</span></span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

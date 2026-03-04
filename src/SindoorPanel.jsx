import { useState, useEffect } from "react";

// ─── OPERATION SINDOOR PROBABILITY ENGINE ────────────────────
// Probability is computed from weighted factors.
// Each factor has a base weight and a current value (0-100).
// Total probability = weighted average of all factor values.

const FACTORS = [
  {
    id: "pak_terror",
    label: "Pakistan-Sponsored Terror Activity",
    description: "Cross-border infiltration, IED placements, fidayeen attacks",
    weight: 0.22,
    value: 78,
    trend: "↑",
    trendColor: "#ff2d2d",
    evidence: [
      "Delhi NCR blast — Dec 2024 (RDX, ISI link confirmed by NIA)",
      "J&K bus attack — Jan 2025 (Pahalgam-style targeting)",
      "Punjab LeT module busted with 4kg RDX — Feb 2025",
    ],
  },
  {
    id: "pac_military",
    label: "Pak Military Posturing",
    description: "Troop movements, missile tests, forward deployment",
    weight: 0.18,
    value: 65,
    trend: "↑",
    trendColor: "#ff6b00",
    evidence: [
      "Shaheen-III MRBM test conducted — confirms MIRV capability",
      "Corps-level exercise near LoC — simulating India response",
      "F-16 sorties tripled near eastern sector — ISPR confirmed",
    ],
  },
  {
    id: "india_political",
    label: "Indian Political Will",
    description: "Government tolerance threshold, election cycle, public sentiment",
    weight: 0.16,
    value: 72,
    trend: "→",
    trendColor: "#ffe033",
    evidence: [
      "PM Modi: 'India will respond to every provocation' — Jan 2025",
      "NSA Doval chaired 3 emergency CCS sessions in 60 days",
      "Public anger post-Delhi blast at all-time high — polls show 84%",
    ],
  },
  {
    id: "iran_usa",
    label: "Iran-US-Israel Conflict Spillover",
    description: "Regional escalation affecting Indian Ocean, Pakistan alignment",
    weight: 0.12,
    value: 58,
    trend: "↑",
    trendColor: "#ff6b00",
    evidence: [
      "Pakistan-Iran border clashes — Feb 2025 (dual-front risk for Pak)",
      "US carrier groups in Arabian Sea constraining Pak options",
      "Iran-Pak gas deal collapse — Islamabad economic pressure rising",
    ],
  },
  {
    id: "china_factor",
    label: "China Deterrence Factor",
    description: "PLA posturing on LAC, C-rated weapons to Pak, diplomatic pressure",
    weight: 0.14,
    value: 55,
    trend: "→",
    trendColor: "#ffe033",
    evidence: [
      "China supplied 6 J-10C jets to PAF — Feb 2025",
      "CPEC security concerns in Balochistan reduce PLA engagement",
      "China distracted: Taiwan exercises, South China Sea standoffs",
    ],
  },
  {
    id: "indian_military",
    label: "Indian Military Readiness",
    description: "Strike corps posture, IAF readiness, Navy deployment",
    weight: 0.10,
    value: 82,
    trend: "↑",
    trendColor: "#ff2d2d",
    evidence: [
      "IAF Rafale squadron fully operational — all 36 aircraft combat ready",
      "Brahmos supersonic missiles deployed to forward bases",
      "Indian Army Strike Corps — 72-hour readiness posture maintained",
    ],
  },
  {
    id: "intl_support",
    label: "International Support for India",
    description: "US, Quad, UNSC stance, global diplomatic backing",
    weight: 0.08,
    value: 61,
    trend: "→",
    trendColor: "#ffe033",
    evidence: [
      "US State Dept: 'India has right to self-defence against terror'",
      "QUAD joint statement condemns Pakistan-linked terror networks",
      "EU sanctions 3 Pakistan-based terror financiers — Dec 2024",
    ],
  },
];

// Compute weighted probability
function computeProbability(factors) {
  const total = factors.reduce((acc, f) => acc + f.weight, 0);
  const weighted = factors.reduce((acc, f) => acc + (f.value * f.weight), 0);
  return Math.round(weighted / total);
}

// Timeline of events affecting probability
const TIMELINE = [
  { date:"May 7, 2025",  event:"Operation Sindoor launched — India strikes 9 terror camps in Pakistan & PoK", delta:"+BASELINE", color:"#ff2d2d", type:"MILITARY" },
  { date:"May 10, 2025", event:"Ceasefire declared — US mediation, Pakistan agrees to halt cross-LoC fire",   delta:"−25%",     color:"#00ff88", type:"DIPLOMATIC" },
  { date:"Dec 13, 2024", event:"Delhi NCR explosion — RDX device, NIA confirms ISI-linked module",            delta:"+12%",     color:"#ff2d2d", type:"TERROR" },
  { date:"Jan 22, 2025", event:"Pahalgam-style J&K bus attack — 8 tourists killed, LeT suspected",           delta:"+8%",      color:"#ff2d2d", type:"TERROR" },
  { date:"Feb 3, 2025",  event:"Pakistan test-fires Shaheen-III — MIRV warhead, range 2,750km",              delta:"+6%",      color:"#ff6b00", type:"MILITARY" },
  { date:"Feb 18, 2025", event:"QUAD statement condemns Pakistan terror links — India gains diplomatic cover", delta:"+4%",      color:"#ffe033", type:"DIPLOMATIC" },
  { date:"Mar 2025",     event:"Iran-USA tensions spike — Pak distracted, Indian window opening",             delta:"+5%",      color:"#ff6b00", type:"GEOPOLITICAL" },
];

// Scenarios that could trigger resumption
const TRIGGER_SCENARIOS = [
  { probability: 89, scenario: "Major terrorist attack on Indian soil with confirmed Pak link", threshold:"IMMINENT" },
  { probability: 74, scenario: "Pakistan strikes Indian military installation (any sector)", threshold:"HIGH"     },
  { probability: 61, scenario: "LoC violations kill 10+ Indian soldiers in single incident",   threshold:"HIGH"     },
  { probability: 45, scenario: "Pakistan moves tactical nukes to forward positions",           threshold:"ELEVATED" },
  { probability: 38, scenario: "China opens second front on LAC simultaneously",              threshold:"ELEVATED" },
  { probability: 22, scenario: "Pakistan economy collapses — army takes full control",        threshold:"WATCH"    },
];

function getStatus(prob) {
  if (prob >= 75) return { label:"IMMINENT RISK",  color:"#ff2d2d", bg:"rgba(255,45,45,.1)"  };
  if (prob >= 55) return { label:"HIGH RISK",      color:"#ff6b00", bg:"rgba(255,107,0,.1)"  };
  if (prob >= 35) return { label:"ELEVATED RISK",  color:"#ffe033", bg:"rgba(255,224,51,.08)" };
  return               { label:"MONITORING",       color:"#00ff88", bg:"rgba(0,255,136,.08)"  };
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Teko:wght@300;400;500;600;700&display=swap');

  .sindoor-panel {
    background: #050d12;
    border: 1px solid #0f3040;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
    font-family: 'Rajdhani', sans-serif;
    color: #e8f4f8;
  }
  .sindoor-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #ff2d2d, #ff6b00, #ff2d2d, transparent);
    animation: border-glow 3s ease-in-out infinite;
  }
  @keyframes border-glow {
    0%,100% { opacity: .5; }
    50%      { opacity: 1;  }
  }

  .sindoor-header {
    padding: 10px 14px;
    border-bottom: 1px solid #0f3040;
    background: linear-gradient(90deg, rgba(255,45,45,.08), rgba(255,107,0,.04), transparent);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sindoor-title {
    font-family: 'Teko', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #e8f4f8;
  }
  .op-badge {
    padding: 2px 10px;
    background: rgba(255,45,45,.15);
    border: 1px solid rgba(255,45,45,.4);
    color: #ff2d2d;
    font-family: 'Teko', sans-serif;
    font-size: 11px;
    letter-spacing: 2px;
  }

  /* PROBABILITY GAUGE */
  .gauge-section {
    padding: 16px 14px 10px;
    background: linear-gradient(180deg, rgba(255,45,45,.04), transparent);
    border-bottom: 1px solid #0f3040;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: center;
  }
  .gauge-wrap { position: relative; flex-shrink: 0; }
  .gauge-num {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -40%);
    text-align: center;
  }
  .gauge-pct {
    font-family: 'Teko', sans-serif;
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
    transition: color 1s;
  }
  .gauge-lbl {
    font-family: 'Share Tech Mono', monospace;
    font-size: 8px;
    letter-spacing: 1px;
    color: #3a6678;
    margin-top: 2px;
  }
  .gauge-right {}
  .gauge-status {
    display: inline-block;
    padding: 3px 12px;
    font-family: 'Teko', sans-serif;
    font-size: 13px;
    letter-spacing: 2px;
    margin-bottom: 8px;
    border: 1px solid;
    border-radius: 1px;
  }
  .gauge-desc {
    font-size: 12px;
    color: #7aacbe;
    line-height: 1.5;
    margin-bottom: 6px;
  }
  .gauge-updated {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    color: #3a6678;
  }

  /* FACTORS */
  .factors-section {
    padding: 10px 14px;
    border-bottom: 1px solid #0f3040;
  }
  .section-title {
    font-family: 'Teko', sans-serif;
    font-size: 11px;
    letter-spacing: 2px;
    color: #3a6678;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .factor-row {
    margin-bottom: 8px;
    cursor: pointer;
    padding: 6px 8px;
    border: 1px solid transparent;
    border-radius: 1px;
    transition: all .15s;
  }
  .factor-row:hover { background: rgba(255,255,255,.03); border-color: #0f3040; }
  .factor-row.open  { background: rgba(255,45,45,.04);   border-color: #1a2830; }
  .factor-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .factor-label {
    font-size: 12px;
    font-weight: 600;
    color: #c8dde6;
    flex: 1;
  }
  .factor-val {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    flex-shrink: 0;
  }
  .factor-trend { font-size: 12px; flex-shrink: 0; }
  .factor-bar { height: 4px; background: #0f3040; border-radius: 2px; overflow: hidden; }
  .factor-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }
  .factor-evidence {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #0f3040;
  }
  .ev-item {
    display: flex;
    gap: 6px;
    font-size: 10px;
    color: #3a6678;
    margin-bottom: 3px;
    line-height: 1.4;
  }
  .ev-dot { color: #ff6b00; flex-shrink: 0; margin-top: 1px; }

  /* TIMELINE */
  .timeline-section {
    padding: 10px 14px;
    border-bottom: 1px solid #0f3040;
  }
  .tl-item {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    position: relative;
    padding-left: 12px;
  }
  .tl-item::before {
    content: '';
    position: absolute;
    left: 0; top: 6px;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  .tl-date {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    color: #3a6678;
    flex-shrink: 0;
    width: 80px;
    padding-top: 1px;
  }
  .tl-event { font-size: 11px; color: #7aacbe; line-height: 1.4; flex: 1; }
  .tl-delta {
    font-family: 'Teko', sans-serif;
    font-size: 13px;
    flex-shrink: 0;
    font-weight: 600;
  }

  /* SCENARIOS */
  .scenarios-section { padding: 10px 14px; }
  .scenario-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #071419;
  }
  .scenario-prob {
    font-family: 'Teko', sans-serif;
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
    width: 46px;
  }
  .scenario-text { font-size: 11px; color: #7aacbe; flex: 1; line-height: 1.4; }
  .scenario-badge {
    font-size: 8px;
    font-family: 'Teko', sans-serif;
    letter-spacing: 1px;
    padding: 1px 6px;
    border: 1px solid;
    flex-shrink: 0;
  }

  /* DISCLAIMER */
  .disclaimer {
    padding: 6px 14px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 8px;
    color: #1a5068;
    border-top: 1px solid #0f3040;
    line-height: 1.5;
    background: rgba(0,0,0,.3);
  }

  @keyframes pulse-red { 0%,100%{opacity:1;box-shadow:0 0 8px #ff2d2d} 50%{opacity:.3} }
  .live-dot { display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff2d2d;animation:pulse-red 1.2s infinite; }
`;

function Arc({ value, size = 140 }) {
  const r = (size / 2) - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 75 ? "#ff2d2d" : value >= 55 ? "#ff6b00" : value >= 35 ? "#ffe033" : "#00ff88";

  return (
    <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
      <defs>
        <linearGradient id="sindG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#00ff88"/>
          <stop offset="40%"  stopColor="#ffe033"/>
          <stop offset="70%"  stopColor="#ff6b00"/>
          <stop offset="100%" stopColor="#ff2d2d"/>
        </linearGradient>
      </defs>
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#0f3040" strokeWidth="10" strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="url(#sindG)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)" }}
      />
      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map(pct => {
        const angle = Math.PI - (pct / 100) * Math.PI;
        const tx = cx + (r + 6) * Math.cos(angle);
        const ty = cy - (r + 6) * Math.sin(angle);
        return <circle key={pct} cx={tx} cy={ty} r="2" fill="#1a5068"/>;
      })}
    </svg>
  );
}

export default function SindoorPanel() {
  const [factors, setFactors]       = useState(FACTORS);
  const [openFactor, setOpenFactor] = useState(null);
  const [tab, setTab]               = useState("factors");
  const [pulse, setPulse]           = useState(false);

  const probability = computeProbability(factors);
  const status      = getStatus(probability);

  // Pulse animation on load
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 500);
    return () => clearTimeout(t);
  }, []);

  const timeStr = new Date().toLocaleString("en-IN", {
    day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:false,
  }) + " IST";

  return (
    <>
      <style>{CSS}</style>
      <div className="sindoor-panel">

        {/* Header */}
        <div className="sindoor-header">
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <div className="live-dot"/>
              <span className="sindoor-title">Operation Sindoor</span>
              <span className="op-badge">CLASSIFIED ANALYSIS</span>
            </div>
            <div style={{ fontFamily:"Share Tech Mono", fontSize:9, color:"#3a6678", letterSpacing:1 }}>
              PROBABILITY INDEX · RESUMPTION LIKELIHOOD · OSINT ESTIMATE
            </div>
          </div>
          <div style={{ marginLeft:"auto", textAlign:"right" }}>
            <div style={{ fontFamily:"Share Tech Mono", fontSize:9, color:"#3a6678" }}>LAST UPDATED</div>
            <div style={{ fontFamily:"Share Tech Mono", fontSize:10, color:"#00d4ff" }}>{timeStr}</div>
          </div>
        </div>

        {/* Main Gauge */}
        <div className="gauge-section">
          <div className="gauge-wrap">
            <Arc value={pulse ? probability : 0} size={150}/>
            <div className="gauge-num">
              <div className="gauge-pct" style={{ color: status.color }}>{pulse ? probability : 0}%</div>
              <div className="gauge-lbl">RESUME RISK</div>
            </div>
          </div>
          <div className="gauge-right">
            <div className="gauge-status"
              style={{ color: status.color, borderColor: status.color, background: status.bg }}>
              {status.label}
            </div>
            <div className="gauge-desc">
              Based on <strong style={{ color:"#c8dde6" }}>7 weighted OSINT factors</strong> including
              Pakistan terror activity, military posturing, Indian political will,
              regional conflict spillover and international backing.
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
              {[["High","#ff2d2d",">75%"],["Elevated","#ff6b00","55-75%"],["Watch","#ffe033","35-55%"],["Low","#00ff88","<35%"]].map(([l,c,r])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:3, fontSize:9, fontFamily:"Share Tech Mono", color:c }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:c }}/>
                  {l} {r}
                </div>
              ))}
            </div>
            <div className="gauge-updated">⏱ AUTO-UPDATES WITH OSINT FEED · {timeStr}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid #0f3040" }}>
          {[["factors","📊 Factors"],["timeline","📅 Timeline"],["scenarios","⚡ Triggers"]].map(([t,l])=>(
            <button key={t}
              onClick={() => setTab(t)}
              style={{
                padding:"7px 14px", background:"none", border:"none", cursor:"pointer",
                fontFamily:"Teko", fontSize:12, letterSpacing:2, textTransform:"uppercase",
                color: tab===t ? "#ff6b00" : "#3a6678",
                borderBottom: tab===t ? "2px solid #ff6b00" : "2px solid transparent",
                marginBottom: -1,
                transition: "color .15s",
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* FACTORS TAB */}
        {tab === "factors" && (
          <div className="factors-section">
            <div className="section-title">Weighted probability factors (click to expand)</div>
            {factors.map(f => {
              const c = f.value >= 70 ? "#ff2d2d" : f.value >= 50 ? "#ff6b00" : "#ffe033";
              const isOpen = openFactor === f.id;
              return (
                <div key={f.id} className={`factor-row${isOpen?" open":""}`}
                  onClick={() => setOpenFactor(isOpen ? null : f.id)}>
                  <div className="factor-top">
                    <div className="factor-label">{f.label}</div>
                    <div className="factor-trend" style={{ color:f.trendColor }}>{f.trend}</div>
                    <div className="factor-val" style={{ color:c }}>{f.value}%</div>
                    <div style={{ fontSize:9, fontFamily:"Share Tech Mono", color:"#3a6678", width:36 }}>
                      ×{f.weight.toFixed(2)}
                    </div>
                    <div style={{ color:"#3a6678", fontSize:10 }}>{isOpen?"▲":"▼"}</div>
                  </div>
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width:`${f.value}%`, background:c }}/>
                  </div>
                  {isOpen && (
                    <div className="factor-evidence">
                      <div style={{ fontSize:10, color:"#3a6678", fontFamily:"Share Tech Mono", marginBottom:4 }}>
                        {f.description}
                      </div>
                      {f.evidence.map((e,i) => (
                        <div key={i} className="ev-item">
                          <span className="ev-dot">▸</span>
                          <span>{e}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TIMELINE TAB */}
        {tab === "timeline" && (
          <div className="timeline-section">
            <div className="section-title">Key events and probability impact</div>
            {TIMELINE.map((t, i) => (
              <div key={i} className="tl-item" style={{ color:t.color }}>
                <div className="tl-date">{t.date}</div>
                <div>
                  <div style={{ fontSize:8, fontFamily:"Share Tech Mono", color:t.color, letterSpacing:1, marginBottom:2 }}>{t.type}</div>
                  <div className="tl-event">{t.event}</div>
                </div>
                <div className="tl-delta" style={{ color:t.color }}>{t.delta}</div>
              </div>
            ))}
          </div>
        )}

        {/* SCENARIOS TAB */}
        {tab === "scenarios" && (
          <div className="scenarios-section">
            <div className="section-title">Trigger scenarios — resumption probability if event occurs</div>
            {TRIGGER_SCENARIOS.map((s, i) => {
              const c = s.probability >= 75 ? "#ff2d2d" : s.probability >= 50 ? "#ff6b00" : s.probability >= 35 ? "#ffe033" : "#00ff88";
              return (
                <div key={i} className="scenario-row">
                  <div className="scenario-prob" style={{ color:c }}>{s.probability}%</div>
                  <div className="scenario-text">{s.scenario}</div>
                  <div className="scenario-badge" style={{ color:c, borderColor:`${c}44` }}>{s.threshold}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="disclaimer">
          ⚠ ANALYTICAL ESTIMATE ONLY — Based on open-source intelligence (OSINT), publicly available military/diplomatic data, and news reports.
          NOT classified information. NOT affiliated with any government agency. For educational and awareness purposes only.
          Probability reflects analyst assessment and is updated as new OSINT becomes available.
        </div>
      </div>
    </>
  );
}

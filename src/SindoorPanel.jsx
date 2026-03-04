// src/SindoorPanel.jsx
// Probability auto-updates when GDELT sindoorSignal changes

import { useState, useEffect } from "react";

const BASE_FACTORS = [
  { id:"pak_terror",    label:"Pak-Sponsored Terror Activity",  weight:0.22, baseValue:78, trend:"↑", trendColor:"#ff2d2d",
    evidence:["Delhi NCR blast — Dec 2024 (RDX, ISI link confirmed by NIA)","J&K bus attack — Jan 2025","Punjab LeT module busted with 4kg RDX — Feb 2025"] },
  { id:"pak_military",  label:"Pak Military Posturing",         weight:0.18, baseValue:65, trend:"↑", trendColor:"#ff6b00",
    evidence:["Shaheen-III MRBM test — confirms MIRV capability","Corps-level exercise near LoC","F-16 sorties tripled near eastern sector"] },
  { id:"india_will",    label:"Indian Political Will",           weight:0.16, baseValue:72, trend:"→", trendColor:"#ffe033",
    evidence:["PM Modi: 'India will respond to every provocation'","NSA Doval chaired 3 emergency CCS sessions in 60 days","Public anger post-Delhi blast at all-time high (84%)"] },
  { id:"iran_usa",      label:"Iran-US-Israel Spillover",        weight:0.12, baseValue:58, trend:"↑", trendColor:"#ff6b00",
    evidence:["Pakistan-Iran border clashes — dual-front risk","US carrier groups constraining Pak options","Iran-Pak gas deal collapse — economic pressure rising"] },
  { id:"china",         label:"China Deterrence Factor",         weight:0.14, baseValue:55, trend:"→", trendColor:"#ffe033",
    evidence:["China supplied 6 J-10C jets to PAF — Feb 2025","CPEC security concerns reduce PLA engagement","China distracted: Taiwan, South China Sea"] },
  { id:"india_mil",     label:"Indian Military Readiness",       weight:0.10, baseValue:82, trend:"↑", trendColor:"#ff2d2d",
    evidence:["IAF Rafale squadron fully operational — 36 aircraft","Brahmos deployed to forward bases","Strike Corps — 72-hour readiness posture"] },
  { id:"intl_support",  label:"International Support for India", weight:0.08, baseValue:61, trend:"→", trendColor:"#ffe033",
    evidence:["US: 'India has right to self-defence against terror'","QUAD joint statement condemns Pak-linked terror","EU sanctions 3 Pak-based terror financiers"] },
];

const TIMELINE = [
  { date:"May 7, 2025",  event:"Operation Sindoor launched — India strikes 9 terror camps in Pak & PoK", delta:"+BASELINE", color:"#ff2d2d", type:"MILITARY" },
  { date:"May 10, 2025", event:"Ceasefire declared — US mediation, Pakistan agrees to halt cross-LoC fire", delta:"−25%",    color:"#00ff88", type:"DIPLOMATIC" },
  { date:"Dec 13, 2024", event:"Delhi NCR explosion — RDX device, NIA confirms ISI-linked module",          delta:"+12%",    color:"#ff2d2d", type:"TERROR" },
  { date:"Jan 22, 2025", event:"J&K bus attack — 8 tourists killed, LeT suspected",                        delta:"+8%",     color:"#ff2d2d", type:"TERROR" },
  { date:"Feb 3, 2025",  event:"Pakistan test-fires Shaheen-III — MIRV warhead, range 2,750km",            delta:"+6%",     color:"#ff6b00", type:"MILITARY" },
  { date:"Feb 18, 2025", event:"QUAD statement condemns Pakistan terror links",                              delta:"+4%",     color:"#ffe033", type:"DIPLOMATIC" },
  { date:"Mar 2025",     event:"Iran-USA tensions spike — Pak distracted, Indian strike window opening",    delta:"+5%",     color:"#ff6b00", type:"GEOPOLITICAL" },
];

const TRIGGERS = [
  { probability:89, scenario:"Major terrorist attack on Indian soil with confirmed Pak link", threshold:"IMMINENT" },
  { probability:74, scenario:"Pakistan strikes Indian military installation (any sector)",    threshold:"HIGH"     },
  { probability:61, scenario:"LoC violations kill 10+ Indian soldiers in single incident",   threshold:"HIGH"     },
  { probability:45, scenario:"Pakistan moves tactical nukes to forward positions",           threshold:"ELEVATED" },
  { probability:38, scenario:"China opens second front on LAC simultaneously",              threshold:"ELEVATED" },
  { probability:22, scenario:"Pakistan economy collapses — army takes full control",        threshold:"WATCH"    },
];

function computeProb(factors) {
  const weighted = factors.reduce((acc, f) => acc + f.value * f.weight, 0);
  const total    = factors.reduce((acc, f) => acc + f.weight, 0);
  return Math.round(weighted / total);
}

function getStatus(p) {
  if (p >= 75) return { label:"IMMINENT RISK", color:"#ff2d2d", bg:"rgba(255,45,45,.1)"   };
  if (p >= 55) return { label:"HIGH RISK",     color:"#ff6b00", bg:"rgba(255,107,0,.1)"   };
  if (p >= 35) return { label:"ELEVATED RISK", color:"#ffe033", bg:"rgba(255,224,51,.08)" };
  return              { label:"MONITORING",    color:"#00ff88", bg:"rgba(0,255,136,.08)"  };
}

function Arc({ value, size=150 }) {
  const r=size/2-12, cx=size/2, cy=size/2, circ=Math.PI*r;
  const offset = circ - (value/100)*circ;
  return (
    <svg width={size} height={size/2+18} viewBox={`0 0 ${size} ${size/2+18}`}>
      <defs>
        <linearGradient id="sG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#00ff88"/>
          <stop offset="40%"  stopColor="#ffe033"/>
          <stop offset="70%"  stopColor="#ff6b00"/>
          <stop offset="100%" stopColor="#ff2d2d"/>
        </linearGradient>
      </defs>
      <path d={`M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#0f3040" strokeWidth="10" strokeLinecap="round"/>
      <path d={`M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="url(#sG)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition:"stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)" }}/>
      {[0,25,50,75,100].map(pct => {
        const a=Math.PI-(pct/100)*Math.PI;
        return <circle key={pct} cx={cx+(r+6)*Math.cos(a)} cy={cy-(r+6)*Math.sin(a)} r="2" fill="#1a5068"/>;
      })}
    </svg>
  );
}

const CSS = `
  .sind-panel { background:#050d12;border:1px solid #0f3040;border-radius:2px;position:relative;overflow:hidden;font-family:Rajdhani,sans-serif;color:#e8f4f8; }
  .sind-panel::before { content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ff2d2d,#ff6b00,#ff2d2d,transparent);animation:bglow 3s ease-in-out infinite; }
  @keyframes bglow { 0%,100%{opacity:.5} 50%{opacity:1} }
  .sind-hdr { padding:10px 14px;border-bottom:1px solid #0f3040;background:linear-gradient(90deg,rgba(255,45,45,.08),transparent);display:flex;align-items:flex-start;gap:10px; }
  .gauge-sec { padding:14px 14px 8px;border-bottom:1px solid #0f3040;background:linear-gradient(180deg,rgba(255,45,45,.04),transparent);display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center; }
  .gauge-num { position:absolute;top:50%;left:50%;transform:translate(-50%,-42%);text-align:center; }
  .gauge-pct { font-family:Teko,sans-serif;font-size:36px;font-weight:700;line-height:1;transition:color 1s; }
  .tabs { display:flex;border-bottom:1px solid #0f3040; }
  .tab-btn { padding:7px 14px;background:none;border:none;cursor:pointer;font-family:Teko,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s; }
  .factor-row { margin-bottom:6px;cursor:pointer;padding:6px 8px;border:1px solid transparent;border-radius:1px;transition:all .15s; }
  .factor-row:hover { background:rgba(255,255,255,.03);border-color:#0f3040; }
  .factor-row.open { background:rgba(255,45,45,.04);border-color:#1a2830; }
  .fbar { height:4px;background:#0f3040;border-radius:2px;overflow:hidden;margin-top:4px; }
  .ffill { height:100%;border-radius:2px;transition:width 1.2s ease; }
  .tl-item { display:flex;gap:10px;margin-bottom:8px;position:relative;padding-left:12px; }
  .tl-item::before { content:'';position:absolute;left:0;top:6px;width:5px;height:5px;border-radius:50%;background:currentColor; }
  .sc-row { display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #071419; }
  @keyframes pulse-red { 0%,100%{opacity:1;box-shadow:0 0 8px #ff2d2d} 50%{opacity:.3} }
  .ldot { display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff2d2d;animation:pulse-red 1.2s infinite; }

  /* GDELT update flash */
  @keyframes gdelt-flash { 0%{background:rgba(0,212,255,.12)} 100%{background:transparent} }
  .gdelt-updated { animation:gdelt-flash 2s ease-out forwards; }
`;

export default function SindoorPanel({ sindoorSignal = null }) {
  // factors holds live values (may be bumped by GDELT signal)
  const [factors,     setFactors]    = useState(() => BASE_FACTORS.map(f => ({ ...f, value: f.baseValue })));
  const [openFactor,  setOpenFactor] = useState(null);
  const [tab,         setTab]        = useState("factors");
  const [gdeltBump,   setGdeltBump]  = useState(null);   // description of last GDELT adjustment
  const [animated,    setAnimated]   = useState(false);
  const [prevSignal,  setPrevSignal] = useState(null);

  // Animate gauge on mount
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  // AUTO-RECALCULATE when GDELT sindoorSignal changes
  useEffect(() => {
    if (!sindoorSignal) return;
    // Avoid reprocessing the same signal
    const signalKey = `${sindoorSignal.critical_24h}_${sindoorSignal.high_24h}`;
    if (prevSignal === signalKey) return;
    setPrevSignal(signalKey);

    const { score, critical_24h, high_24h, description } = sindoorSignal;
    if (score === 0 && critical_24h === 0) return;

    // How much to adjust each factor based on GDELT signal
    // score ranges 0–1.0; we translate it into +0 to +12 points per relevant factor
    const maxBump = Math.round(score * 12);

    setFactors(prev => prev.map(f => {
      let bump = 0;
      // Terror events bump pak_terror and india_will
      if (f.id === "pak_terror" && critical_24h > 0) bump = Math.min(maxBump, 12);
      if (f.id === "india_will" && critical_24h > 1) bump = Math.min(maxBump * 0.6, 8);
      // High events bump military factors
      if (f.id === "pak_military" && high_24h > 2)   bump = Math.min(maxBump * 0.5, 6);
      if (f.id === "india_mil"    && critical_24h > 0) bump = Math.min(maxBump * 0.4, 5);
      // Cap values at 97
      const newVal = Math.min(97, f.baseValue + bump);
      return { ...f, value: newVal, trend: bump > 0 ? "↑" : f.trend, trendColor: bump > 0 ? "#ff2d2d" : f.trendColor };
    }));

    setGdeltBump({
      description,
      critical_24h,
      high_24h,
      bump: maxBump,
      time: new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:false }),
    });
  }, [sindoorSignal]);

  const probability = computeProb(factors);
  const status      = getStatus(probability);
  const timeStr     = new Date().toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit", hour12:false }) + " IST";

  return (
    <>
      <style>{CSS}</style>
      <div className="sind-panel">

        {/* Header */}
        <div className="sind-hdr">
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <div className="ldot"/>
              <span style={{ fontFamily:"Teko,sans-serif", fontSize:17, fontWeight:700, letterSpacing:3 }}>Operation Sindoor</span>
              <span style={{ padding:"2px 10px", background:"rgba(255,45,45,.15)", border:"1px solid rgba(255,45,45,.4)", color:"#ff2d2d", fontFamily:"Teko,sans-serif", fontSize:11, letterSpacing:2 }}>RESUMPTION PROBABILITY</span>
            </div>
            <div style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#3a6678", letterSpacing:1 }}>
              OSINT ESTIMATE · 7 WEIGHTED FACTORS · AUTO-UPDATES FROM GDELT LIVE FEED
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#3a6678" }}>UPDATED</div>
            <div style={{ fontFamily:"Share Tech Mono,monospace", fontSize:10, color:"#00d4ff" }}>{timeStr}</div>
          </div>
        </div>

        {/* GDELT auto-update banner */}
        {gdeltBump && (
          <div className="gdelt-updated" style={{ padding:"6px 14px", borderBottom:"1px solid #0f3040", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, color:"#00d4ff", fontFamily:"Share Tech Mono,monospace" }}>⚡ GDELT AUTO-UPDATE</span>
            <span style={{ fontSize:11, color:"#7aacbe", flex:1 }}>{gdeltBump.description}</span>
            <span style={{ fontSize:9, color:"#3a6678", fontFamily:"Share Tech Mono,monospace" }}>
              +{gdeltBump.bump}pts · {gdeltBump.time}
            </span>
          </div>
        )}

        {/* Gauge */}
        <div className="gauge-sec">
          <div style={{ position:"relative" }}>
            <Arc value={animated ? probability : 0} size={152}/>
            <div className="gauge-num">
              <div className="gauge-pct" style={{ color:status.color }}>{animated ? probability : 0}%</div>
              <div style={{ fontFamily:"Share Tech Mono,monospace", fontSize:8, letterSpacing:1, color:"#3a6678" }}>RESUME RISK</div>
            </div>
          </div>
          <div>
            <div style={{ display:"inline-block", padding:"3px 12px", fontFamily:"Teko,sans-serif", fontSize:13, letterSpacing:2, marginBottom:8, border:`1px solid ${status.color}`, background:status.bg, color:status.color }}>
              {status.label}
            </div>
            <div style={{ fontSize:12, color:"#7aacbe", lineHeight:1.5, marginBottom:6 }}>
              Based on <strong style={{ color:"#c8dde6" }}>7 weighted OSINT factors</strong>.
              {gdeltBump ? ` Auto-adjusted by GDELT: ${gdeltBump.critical_24h} critical + ${gdeltBump.high_24h} high events in last 24h.` : " Awaiting GDELT live feed."}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[["≥75%","#ff2d2d","IMMINENT"],["55–75%","#ff6b00","HIGH"],["35–55%","#ffe033","ELEVATED"],["<35%","#00ff88","LOW"]].map(([r,c,l]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:3, fontSize:9, fontFamily:"Share Tech Mono,monospace", color:c }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:c }}/>{l} {r}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[["factors","📊 Factors"],["timeline","📅 Timeline"],["triggers","⚡ Triggers"]].map(([t,l]) => (
            <button key={t} className="tab-btn" onClick={() => setTab(t)}
              style={{ color:tab===t?"#ff6b00":"#3a6678", borderBottomColor:tab===t?"#ff6b00":"transparent" }}>{l}</button>
          ))}
          {gdeltBump && (
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"0 10px" }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#00d4ff", boxShadow:"0 0 6px #00d4ff" }}/>
              <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:8, color:"#00d4ff" }}>LIVE GDELT ACTIVE</span>
            </div>
          )}
        </div>

        {/* FACTORS */}
        {tab === "factors" && (
          <div style={{ padding:"10px 14px" }}>
            <div style={{ fontFamily:"Teko,sans-serif", fontSize:11, letterSpacing:2, color:"#3a6678", marginBottom:8, textTransform:"uppercase" }}>
              Weighted factors — click to expand · 🔴 = GDELT bumped
            </div>
            {factors.map(f => {
              const bumped = f.value > f.baseValue;
              const c = f.value >= 70 ? "#ff2d2d" : f.value >= 50 ? "#ff6b00" : "#ffe033";
              const isOpen = openFactor === f.id;
              return (
                <div key={f.id} className={`factor-row${isOpen?" open":""}`} onClick={() => setOpenFactor(isOpen?null:f.id)}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#c8dde6", flex:1 }}>
                      {bumped && <span style={{ color:"#ff2d2d", marginRight:4, fontSize:10 }}>●</span>}
                      {f.label}
                    </div>
                    <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:11, color:f.trendColor }}>{f.trend}</span>
                    <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:11, color:c }}>{f.value}%</span>
                    {bumped && <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#00d4ff" }}>+{f.value-f.baseValue}</span>}
                    <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#3a6678", width:36 }}>×{f.weight.toFixed(2)}</span>
                    <span style={{ color:"#3a6678", fontSize:10 }}>{isOpen?"▲":"▼"}</span>
                  </div>
                  <div className="fbar"><div className="ffill" style={{ width:`${f.value}%`, background:c }}/></div>
                  {isOpen && (
                    <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid #0f3040" }}>
                      {f.evidence.map((e,i) => (
                        <div key={i} style={{ display:"flex", gap:6, fontSize:10, color:"#3a6678", marginBottom:3, lineHeight:1.4 }}>
                          <span style={{ color:"#ff6b00", flexShrink:0 }}>▸</span><span>{e}</span>
                        </div>
                      ))}
                      {bumped && (
                        <div style={{ marginTop:6, fontSize:10, color:"#00d4ff", fontFamily:"Share Tech Mono,monospace" }}>
                          ⚡ Auto-bumped +{f.value-f.baseValue}pts by GDELT live signal
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TIMELINE */}
        {tab === "timeline" && (
          <div style={{ padding:"10px 14px" }}>
            <div style={{ fontFamily:"Teko,sans-serif", fontSize:11, letterSpacing:2, color:"#3a6678", marginBottom:8, textTransform:"uppercase" }}>Key events and probability impact</div>
            {TIMELINE.map((t,i) => (
              <div key={i} className="tl-item" style={{ color:t.color }}>
                <div style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#3a6678", flexShrink:0, width:82, paddingTop:1 }}>{t.date}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:8, fontFamily:"Share Tech Mono,monospace", color:t.color, letterSpacing:1, marginBottom:2 }}>{t.type}</div>
                  <div style={{ fontSize:11, color:"#7aacbe", lineHeight:1.4 }}>{t.event}</div>
                </div>
                <div style={{ fontFamily:"Teko,sans-serif", fontSize:13, color:t.color, flexShrink:0, fontWeight:600 }}>{t.delta}</div>
              </div>
            ))}
            {gdeltBump && (
              <div className="tl-item gdelt-updated" style={{ color:"#00d4ff" }}>
                <div style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#3a6678", flexShrink:0, width:82, paddingTop:1 }}>NOW · LIVE</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:8, fontFamily:"Share Tech Mono,monospace", color:"#00d4ff", letterSpacing:1, marginBottom:2 }}>GDELT AUTO</div>
                  <div style={{ fontSize:11, color:"#7aacbe", lineHeight:1.4 }}>{gdeltBump.description} — {gdeltBump.critical_24h} critical events detected</div>
                </div>
                <div style={{ fontFamily:"Teko,sans-serif", fontSize:13, color:"#00d4ff", flexShrink:0, fontWeight:600 }}>+{gdeltBump.bump}pts</div>
              </div>
            )}
          </div>
        )}

        {/* TRIGGERS */}
        {tab === "triggers" && (
          <div style={{ padding:"10px 14px" }}>
            <div style={{ fontFamily:"Teko,sans-serif", fontSize:11, letterSpacing:2, color:"#3a6678", marginBottom:8, textTransform:"uppercase" }}>Trigger scenarios — probability if event occurs</div>
            {TRIGGERS.map((s,i) => {
              const c = s.probability>=75?"#ff2d2d":s.probability>=50?"#ff6b00":s.probability>=35?"#ffe033":"#00ff88";
              return (
                <div key={i} className="sc-row">
                  <div style={{ fontFamily:"Teko,sans-serif", fontSize:18, fontWeight:700, color:c, width:46, flexShrink:0 }}>{s.probability}%</div>
                  <div style={{ fontSize:11, color:"#7aacbe", flex:1, lineHeight:1.4 }}>{s.scenario}</div>
                  <div style={{ fontSize:8, fontFamily:"Teko,sans-serif", letterSpacing:1, padding:"1px 6px", border:`1px solid ${c}44`, color:c, flexShrink:0 }}>{s.threshold}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ padding:"6px 14px", fontFamily:"Share Tech Mono,monospace", fontSize:8, color:"#1a5068", borderTop:"1px solid #0f3040", background:"rgba(0,0,0,.3)", lineHeight:1.5 }}>
          ⚠ ANALYTICAL ESTIMATE ONLY — OSINT & publicly available data. NOT classified. NOT affiliated with any government agency.
          Probability auto-adjusts when GDELT detects relevant conflict events. For educational awareness only.
        </div>
      </div>
    </>
  );
}

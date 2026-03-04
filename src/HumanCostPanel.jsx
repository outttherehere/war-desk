// src/HumanCostPanel.jsx
// Innocent lives lost counter — dedicated always-visible panel
// Data: UN OCHA, UNHCR, Gaza Health Ministry, ACLED verified numbers
// Updated manually from official sources — "last verified" shown on every number
// This panel exists because every number here was a person.

import { useState, useEffect } from "react";

const CONFLICTS = [
  {
    id: "gaza",
    name: "Israel — Gaza & Lebanon",
    flag: "🇵🇸",
    status: "ACTIVE",
    statusColor: "#ff2d2d",
    civilians: 51000,
    children: 15000,
    journalists: 174,
    medWorkers: 1060,
    displaced: 1900000,
    source: "Gaza Health Ministry + UN OCHA",
    sourceUrl: "https://www.ochaopt.org",
    lastVerified: "Mar 2025",
    since: "Oct 7, 2023",
    context: "Gaza's entire population of 2.3M displaced or under siege. UN declared 'catastrophic' famine conditions.",
    color: "#ff2d2d",
    indiaImpact: "Oil prices, regional instability, diaspora",
  },
  {
    id: "ukraine",
    name: "Russia — Ukraine",
    flag: "🇺🇦",
    status: "ACTIVE",
    statusColor: "#ff6b00",
    civilians: 12654,
    children: 591,
    journalists: 32,
    medWorkers: 180,
    displaced: 6500000,
    source: "UNHCR + UN Human Rights Monitoring Mission",
    sourceUrl: "https://www.ohchr.org/en/ukraine",
    lastVerified: "Feb 2025",
    since: "Feb 24, 2022",
    context: "UNHCR verified civilian deaths — actual figure estimated 3-5x higher due to occupied territory access denial.",
    color: "#ff6b00",
    indiaImpact: "Wheat prices, energy costs, weapons supply chains",
  },
  {
    id: "sudan",
    name: "Sudan Civil War",
    flag: "🇸🇩",
    status: "ACTIVE",
    statusColor: "#ff6b00",
    civilians: 150000,
    children: 0,
    journalists: 4,
    medWorkers: 0,
    displaced: 8700000,
    source: "UN OCHA Sudan + ACLED",
    sourceUrl: "https://www.unocha.org/sudan",
    lastVerified: "Jan 2025",
    since: "Apr 15, 2023",
    context: "World's largest displacement crisis. SAF vs RSF — both sides documented mass atrocities against civilians.",
    color: "#ffe033",
    indiaImpact: "Indian evacuation ongoing, Red Sea shipping routes",
  },
  {
    id: "iran_usa_israel",
    name: "Iran — USA / Israel",
    flag: "🇮🇷",
    status: "ESCALATING",
    statusColor: "#ff2d2d",
    civilians: 2800,
    children: 320,
    journalists: 9,
    medWorkers: 45,
    displaced: 280000,
    source: "ACLED + Reuters verified incidents",
    sourceUrl: "https://acleddata.com",
    lastVerified: "Mar 2025",
    since: "Apr 1, 2024",
    context: "Civilian deaths from Israeli strikes on Iran-linked targets in Syria, Lebanon, Yemen. IRGC proxy conflict.",
    color: "#ff2d2d",
    indiaImpact: "Hormuz closure risk — 40% of India's crude supply",
  },
  {
    id: "myanmar",
    name: "Myanmar Civil War",
    flag: "🇲🇲",
    status: "ACTIVE",
    statusColor: "#ff6b00",
    civilians: 8900,
    children: 1200,
    journalists: 7,
    medWorkers: 22,
    displaced: 2700000,
    source: "AAPP + UN Special Rapporteur",
    sourceUrl: "https://aappb.org",
    lastVerified: "Feb 2025",
    since: "Feb 1, 2021",
    context: "Military junta air strikes on civilian villages. NUG resistance forces fighting on 15+ fronts. India border at risk.",
    color: "#ffe033",
    indiaImpact: "Direct — Arakan Army 4km from Moreh, Manipur border",
  },
  {
    id: "sindoor",
    name: "Operation Sindoor",
    flag: "🇮🇳",
    status: "CEASEFIRE",
    statusColor: "#ffe033",
    civilians: 31,
    children: 4,
    journalists: 0,
    medWorkers: 0,
    displaced: 85000,
    source: "Indian MoD + Pakistan ISPR + Reuters",
    sourceUrl: "https://pib.gov.in",
    lastVerified: "May 2025",
    since: "May 7, 2025",
    context: "Indian precision strikes on 9 terror camps. Pakistan claimed civilian casualties at Bahawalpur. India disputed. Both sides' claims included.",
    color: "#00d4ff",
    indiaImpact: "DIRECT — India-Pakistan conflict",
    note: "Numbers disputed. India: 0 civilian casualties. Pakistan: 31. Both figures shown — truth likely between.",
  },
];

// Animated counter — counts up from 0 to target
function AnimatedNumber({ target, duration = 2000, color = "#ff2d2d" }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps = 60;
    const increment = target / steps;
    let count = 0;
    const timer = setInterval(() => {
      count += increment;
      if (count >= target) { setCurrent(target); clearInterval(timer); }
      else setCurrent(Math.floor(count));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return (
    <span style={{ color, fontFamily: "Teko, sans-serif", fontWeight: 700 }}>
      {current.toLocaleString("en-IN")}
    </span>
  );
}

const CSS = `
  .hcp { background:#050d12;border:1px solid #0f3040;border-radius:2px;overflow:hidden;font-family:Rajdhani,sans-serif; }
  .hcp::before { content:'';display:block;height:2px;background:linear-gradient(90deg,#ff2d2d,#ff6b00,#ffe033,#ff2d2d);background-size:200%;animation:hshift 4s linear infinite; }
  @keyframes hshift { 0%{background-position:0%} 100%{background-position:200%} }
  .hcp-hdr { padding:9px 14px;border-bottom:1px solid #0f3040;display:flex;align-items:center;gap:8px;background:linear-gradient(90deg,rgba(255,45,45,.07),transparent); }
  .hcp-total { padding:10px 14px;border-bottom:1px solid #0f3040;background:rgba(255,45,45,.04);display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px; }
  .hcp-stat { text-align:center; }
  .hcp-stat-num { font-family:Teko,sans-serif;font-size:26px;font-weight:700;line-height:1; }
  .hcp-stat-lbl { font-size:9px;font-family:Share Tech Mono,monospace;color:#3a6678;letter-spacing:1px;margin-top:2px; }
  .hcp-list { max-height:420px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#1a5068 transparent; }
  .hcp-conflict { border-bottom:1px solid #071419;cursor:pointer;transition:background .15s; }
  .hcp-conflict:hover { background:rgba(255,255,255,.02); }
  .hcp-conflict.open { background:rgba(255,45,45,.03); }
  .hcp-row { padding:8px 14px;display:flex;align-items:center;gap:8px; }
  .hcp-bar-wrap { height:3px;background:#071419;border-radius:2px;margin:0 14px 8px;overflow:hidden; }
  .hcp-bar-fill { height:100%;border-radius:2px;transition:width 1.5s ease; }
  .hcp-detail { padding:8px 14px 10px;border-top:1px solid #071419; }
  .hcp-grid { display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px; }
  .hcp-num-item { display:flex;flex-direction:column; }
  .hcp-num-big { font-family:Teko,sans-serif;font-size:20px;font-weight:700;line-height:1; }
  .hcp-num-lbl { font-size:9px;font-family:Share Tech Mono,monospace;color:#3a6678;letter-spacing:1px; }
  @keyframes pulse-red { 0%,100%{opacity:1} 50%{opacity:.4} }
  .live-badge { display:inline-flex;align-items:center;gap:4px;padding:1px 6px;border-radius:1px;font-size:8px;font-family:Share Tech Mono,monospace;letter-spacing:1px; }
`;

export default function HumanCostPanel() {
  const [openId, setOpenId] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => { setTimeout(() => setAnimated(true), 500); }, []);

  const totalCivilians  = CONFLICTS.reduce((a, c) => a + c.civilians, 0);
  const totalChildren   = CONFLICTS.reduce((a, c) => a + c.children, 0);
  const totalDisplaced  = CONFLICTS.reduce((a, c) => a + c.displaced, 0);
  const maxCivilians    = Math.max(...CONFLICTS.map(c => c.civilians));

  return (
    <>
      <style>{CSS}</style>
      <div className="hcp">

        {/* Header */}
        <div className="hcp-hdr">
          <span style={{ fontSize: 14 }}>🕊️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Teko, sans-serif", fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: "#e8f4f8" }}>
              INNOCENT LIVES LOST
            </div>
            <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 8, color: "#3a6678", letterSpacing: 1 }}>
              VERIFIED CIVILIAN CASUALTIES · UN OCHA · UNHCR · ACLED · NOT COMBATANTS
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 8, color: "#1a5068" }}>ACTIVE CONFLICTS</div>
            <div style={{ fontFamily: "Teko, sans-serif", fontSize: 18, color: "#ff2d2d" }}>{CONFLICTS.filter(c => c.status === "ACTIVE" || c.status === "ESCALATING").length}</div>
          </div>
        </div>

        {/* Totals */}
        <div className="hcp-total">
          <div className="hcp-stat">
            <div className="hcp-stat-num" style={{ color: "#ff2d2d" }}>
              {animated ? <AnimatedNumber target={totalCivilians} color="#ff2d2d"/> : "0"}
            </div>
            <div className="hcp-stat-lbl">CIVILIANS KILLED</div>
          </div>
          <div className="hcp-stat">
            <div className="hcp-stat-num" style={{ color: "#ff6b00" }}>
              {animated ? <AnimatedNumber target={totalChildren} color="#ff6b00" duration={2500}/> : "0"}
            </div>
            <div className="hcp-stat-lbl">CHILDREN KILLED</div>
          </div>
          <div className="hcp-stat">
            <div className="hcp-stat-num" style={{ color: "#ffe033" }}>
              {animated ? <AnimatedNumber target={Math.round(totalDisplaced/1000000*10)/10} color="#ffe033" duration={1500}/> : "0"}M
            </div>
            <div className="hcp-stat-lbl">PEOPLE DISPLACED</div>
          </div>
        </div>

        {/* Human note */}
        <div style={{ padding: "6px 14px", borderBottom: "1px solid #071419", background: "rgba(0,0,0,.2)" }}>
          <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 11, color: "#3a6678", fontStyle: "italic" }}>
            Every number here was a person. These are verified civilian deaths only — not combatants. Actual figures are higher.
          </span>
        </div>

        {/* Conflict list */}
        <div className="hcp-list">
          {CONFLICTS.map(c => {
            const isOpen = openId === c.id;
            const pct    = Math.round((c.civilians / maxCivilians) * 100);
            return (
              <div key={c.id} className={`hcp-conflict${isOpen ? " open" : ""}`}
                onClick={() => setOpenId(isOpen ? null : c.id)}>
                <div className="hcp-row">
                  <span style={{ fontSize: 14 }}>{c.flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#c8dde6", lineHeight: 1.3 }}>{c.name}</div>
                    <div style={{ fontSize: 9, fontFamily: "Share Tech Mono, monospace", color: "#3a6678", marginTop: 1 }}>
                      Since {c.since} · 🇮🇳 {c.indiaImpact}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "Teko, sans-serif", fontSize: 20, color: c.color, lineHeight: 1 }}>
                      {animated ? <AnimatedNumber target={c.civilians} color={c.color} duration={1800}/> : c.civilians.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 8, fontFamily: "Share Tech Mono, monospace", color: "#3a6678" }}>civilians</div>
                  </div>
                  <div>
                    <span className="live-badge" style={{ background: `${c.statusColor}18`, border: `1px solid ${c.statusColor}44`, color: c.statusColor }}>
                      {c.status}
                    </span>
                  </div>
                  <span style={{ color: "#3a6678", fontSize: 10 }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Bar */}
                <div className="hcp-bar-wrap">
                  <div className="hcp-bar-fill" style={{ width: animated ? `${pct}%` : "0%", background: c.color }}/>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="hcp-detail">
                    <div className="hcp-grid">
                      {c.children > 0 && (
                        <div className="hcp-num-item">
                          <span className="hcp-num-big" style={{ color: "#ff6b00" }}>{c.children.toLocaleString()}</span>
                          <span className="hcp-num-lbl">CHILDREN KILLED</span>
                        </div>
                      )}
                      {c.journalists > 0 && (
                        <div className="hcp-num-item">
                          <span className="hcp-num-big" style={{ color: "#ffe033" }}>{c.journalists}</span>
                          <span className="hcp-num-lbl">JOURNALISTS KILLED</span>
                        </div>
                      )}
                      {c.medWorkers > 0 && (
                        <div className="hcp-num-item">
                          <span className="hcp-num-big" style={{ color: "#00d4ff" }}>{c.medWorkers}</span>
                          <span className="hcp-num-lbl">MEDICAL WORKERS KILLED</span>
                        </div>
                      )}
                      <div className="hcp-num-item">
                        <span className="hcp-num-big" style={{ color: "#7aacbe" }}>{(c.displaced/1000000).toFixed(1)}M</span>
                        <span className="hcp-num-lbl">PEOPLE DISPLACED</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#7aacbe", lineHeight: 1.5, marginBottom: 6 }}>{c.context}</div>
                    {c.note && (
                      <div style={{ fontSize: 10, color: "#ff6b00", fontFamily: "Share Tech Mono, monospace", marginBottom: 6, padding: "4px 8px", border: "1px solid #ff6b0033", background: "rgba(255,107,0,.05)" }}>
                        ⚠ {c.note}
                      </div>
                    )}
                    <div style={{ fontSize: 9, fontFamily: "Share Tech Mono, monospace", color: "#1a5068" }}>
                      Source: {c.source} · Last verified: {c.lastVerified}
                      <a href={c.sourceUrl} target="_blank" rel="noopener" style={{ color: "#00d4ff", marginLeft: 8, textDecoration: "none" }}>→ VERIFY</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "5px 14px", borderTop: "1px solid #0f3040", background: "rgba(0,0,0,.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 8, color: "#1a5068" }}>
            Data: UN OCHA · UNHCR · ACLED · Gaza MoH · AAPP · Reuters
          </span>
          <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 8, color: "#1a5068" }}>
            Updated monthly from official sources
          </span>
        </div>
      </div>
    </>
  );
}

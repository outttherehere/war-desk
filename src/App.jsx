import { useState, useEffect, useRef } from "react";
import { useNews } from "./useNews";
import TVPanel from "./TVPanel";
import SindoorPanel from "./SindoorPanel";
import OSINTPanel from "./OSINTPanel";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Teko:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:#020608; --panel:#050d12; --card:#071419; --elev:#0a1e25;
    --b:#0f3040; --bb:#1a5068;
    --cyan:#00d4ff; --gold:#f0a500; --red:#ff2d2d;
    --org:#ff6b00; --grn:#00ff88; --yel:#ffe033;
    --txt:#e8f4f8; --t2:#7aacbe; --t3:#3a6678;
    --saf:#FF9933; --ig:#138808;
    /* BIGGER BASE FONT */
    font-size: 16px;
  }
  body { background:var(--bg); font-family:'Rajdhani',sans-serif; color:var(--txt); overflow-x:hidden; font-size:15px; line-height:1.5; }
  .scanline { position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.025) 2px,rgba(0,0,0,.025) 4px); }

  @keyframes pulse-red  { 0%,100%{opacity:1;box-shadow:0 0 8px var(--red)} 50%{opacity:.3} }
  @keyframes ticker     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes fadeIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sweep      { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes radar-ping { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(1.2);opacity:0} }
  @keyframes slide-in   { from{transform:translateX(-8px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes ping       { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
  @keyframes pcrit      { 0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 14px #ff2d2d} 50%{transform:translate(-50%,-50%) scale(1.5);box-shadow:0 0 22px #ff2d2d} }
  @keyframes phigh      { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.3)} }

  .live-dot { display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--red);animation:pulse-red 1.2s infinite;flex-shrink:0; }
  .mono { font-family:'Share Tech Mono',monospace; }
  .teko { font-family:'Teko',sans-serif; }

  .panel { background:var(--panel);border:1px solid var(--b);border-radius:2px;position:relative;overflow:hidden; }
  .panel::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:.35; }
  .ph { padding:9px 14px;border-bottom:1px solid var(--b);background:linear-gradient(90deg,var(--elev),transparent);
    display:flex;align-items:center;gap:9px;font-family:'Teko',sans-serif;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:var(--t2); }
  .ph-icon { color:var(--cyan); }
  .scroll { overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--bb) transparent; }

  /* TOP BAR */
  .topbar { background:var(--panel);border-bottom:1px solid var(--b);padding:0 16px;display:flex;align-items:center;gap:14px;height:52px;position:sticky;top:0;z-index:200; }
  .flag-stripe { height:4px;background:linear-gradient(90deg,var(--saf) 33.3%,white 33.3%,white 66.6%,var(--ig) 66.6%); }

  /* NAV */
  .nav-tabs { display:flex;background:var(--panel);border-bottom:1px solid var(--b);padding:0 16px;gap:4px;position:sticky;top:52px;z-index:199;overflow-x:auto; }
  .nav-tab { padding:10px 18px;background:none;border:none;cursor:pointer;font-family:'Teko',sans-serif;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:var(--t3);border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .2s;white-space:nowrap; }
  .nav-tab.active { color:var(--cyan);border-bottom-color:var(--cyan); }
  .nav-tab:hover { color:var(--t2); }

  /* DASHBOARD GRID */
  .dash-grid { display:grid;grid-template-columns:250px 1fr 1fr 260px;gap:6px;padding:6px; }
  @media(max-width:1400px){ .dash-grid{ grid-template-columns:230px 1fr 230px; } }
  @media(max-width:900px){  .dash-grid{ grid-template-columns:1fr 1fr; } }
  @media(max-width:600px){  .dash-grid{ grid-template-columns:1fr; } }
  .col { display:flex;flex-direction:column;gap:6px; }

  /* BARS */
  .prob-wrap  { margin:5px 0; }
  .prob-label { display:flex;justify-content:space-between;font-size:12px;color:var(--t2);margin-bottom:3px;font-family:'Share Tech Mono',monospace; }
  .prob-bar   { height:6px;background:var(--b);border-radius:2px;overflow:hidden; }
  .prob-fill  { height:100%;border-radius:2px;transition:width 1.2s ease; }

  /* STATS */
  .stat-grid { display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px; }
  .stat-box  { text-align:center;padding:8px 2px;border:1px solid var(--b);background:var(--card); }
  .stat-num  { font-family:'Teko',sans-serif;font-size:28px;font-weight:700;line-height:1; }
  .stat-lbl  { font-size:10px;letter-spacing:1px;color:var(--t3);text-transform:uppercase;margin-top:2px; }

  /* BORDER STATUS */
  .bstatus { padding:8px 12px;border-left:3px solid;margin-bottom:1px;display:flex;align-items:center;justify-content:space-between;gap:8px; }

  /* NEWS */
  .news-card { padding:11px 13px;border-bottom:1px solid var(--b);animation:fadeIn .4s ease;cursor:pointer;transition:background .15s; }
  .news-card:hover { background:var(--elev); }
  .cred-bar  { height:3px;border-radius:2px;background:var(--b);overflow:hidden;margin-top:6px; }
  .cred-fill { height:100%;border-radius:2px; }

  /* CONFLICT ROW */
  .conf-row { display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--b);cursor:pointer;transition:background .15s; }
  .conf-row:hover { background:var(--elev); }

  /* INTEL */
  .intel-item { padding:9px 13px;border-bottom:1px solid var(--b);display:flex;gap:9px;align-items:flex-start; }

  /* TAGS */
  .tag { display:inline-block;padding:2px 6px;font-size:10px;letter-spacing:1px;border-radius:1px;font-family:'Teko',sans-serif;font-weight:600;text-transform:uppercase;margin-right:3px; }

  /* BADGES */
  .tbadge { display:inline-flex;align-items:center;gap:4px;padding:3px 12px;border-radius:1px;font-size:11px;letter-spacing:1.5px;font-family:'Teko',sans-serif;font-weight:600;text-transform:uppercase; }
  .tb-high { background:rgba(255,107,0,.12);border:1px solid var(--org);color:var(--org); }
  .tb-crit { background:rgba(255,45,45,.12);border:1px solid var(--red);color:var(--red); }

  /* TAB BUTTONS */
  .tab-btn { padding:8px 14px;background:none;border:none;cursor:pointer;font-family:'Teko',sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;transition:color .2s;border-bottom:2px solid transparent;margin-bottom:-1px; }

  /* TICKER */
  .ticker-wrap  { overflow:hidden;flex:1; }
  .ticker-track { display:flex;animation:ticker 55s linear infinite;white-space:nowrap; }
  .ticker-item  { padding:0 36px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--red); }

  /* RADAR */
  .radar-wrap { position:relative;width:130px;height:130px;margin:0 auto; }
  .radar-ring { position:absolute;border-radius:50%;border:1px solid rgba(0,212,255,.15);top:50%;left:50%;transform:translate(-50%,-50%); }
  .radar-sweep { position:absolute;width:50%;height:50%;top:50%;left:50%;transform-origin:bottom left;animation:sweep 3s linear infinite; }
  .radar-sweep::after { content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:conic-gradient(from 0deg,transparent 70%,rgba(0,212,255,.4));border-radius:0 100% 0 0; }
  .radar-dot  { position:absolute;width:8px;height:8px;border-radius:50%;transform:translate(-50%,-50%); }
  .radar-ping { position:absolute;width:17px;height:17px;border-radius:50%;border:1px solid;transform:translate(-50%,-50%);animation:radar-ping 2.2s ease-out infinite; }

  /* BOTTOM BAR */
  .bottom-bar { position:sticky;bottom:0;z-index:200;background:#050608;border-top:1px solid var(--b);padding:0 14px;display:flex;align-items:center;gap:10px;height:34px; }
  .break-label { flex-shrink:0;display:flex;align-items:center;gap:6px;border-right:1px solid var(--b);padding-right:12px; }

  /* MAP */
  .dash-map-wrap { position:relative;height:340px;background:var(--card); }
  #dash-map { width:100%;height:100%; }
  .leaflet-container { background:#020608 !important; }
  .leaflet-tile { filter:brightness(.55) saturate(.3) hue-rotate(185deg) invert(1) !important; }
  .leaflet-control-zoom a { background:var(--panel) !important;color:var(--cyan) !important;border-color:var(--b) !important; }
  .leaflet-popup-content-wrapper { background:var(--panel) !important;border:1px solid var(--bb) !important;border-radius:2px !important;box-shadow:0 0 20px rgba(0,212,255,.2) !important; }
  .leaflet-popup-tip { background:var(--panel) !important; }
  .leaflet-popup-content { color:var(--txt) !important;font-family:'Rajdhani',sans-serif !important;margin:10px 14px !important;font-size:13px !important; }
  .leaflet-control-attribution { background:rgba(2,6,8,.8) !important;color:var(--t3) !important;font-size:9px !important; }
  .leaflet-attribution-flag { display:none !important; }
  .map-legend-dash { position:absolute;bottom:10px;left:10px;z-index:1000;background:rgba(5,13,18,.93);border:1px solid var(--b);padding:7px 10px;pointer-events:none; }
  .leg-row { display:flex;align-items:center;gap:6px;font-size:10px;color:var(--t2);margin-bottom:4px;font-family:'Share Tech Mono',monospace; }
  .leg-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }

  /* OTHER PAGES */
  .page-pad { padding:8px;display:flex;flex-direction:column;gap:8px; }
  .world-table { width:100%;border-collapse:collapse; }
  .world-table th { padding:8px 12px;text-align:left;font-family:'Teko',sans-serif;font-size:12px;letter-spacing:2px;color:var(--t3);border-bottom:1px solid var(--b);background:var(--card); }
  .world-table td { padding:8px 12px;border-bottom:1px solid var(--b);color:var(--t2);font-size:13px; }
  .world-table tr:hover td { background:var(--elev); }
  .geo-card { padding:11px 14px;border-bottom:1px solid var(--b);cursor:pointer;transition:background .15s; }
  .geo-card:hover { background:var(--elev); }
  .res-card { background:var(--card);border:1px solid var(--b);padding:12px 14px;border-radius:2px; }
  .res-num  { font-family:'Teko',sans-serif;font-size:36px;font-weight:700;line-height:1; }
`;

// ─── DATA ────────────────────────────────────────────────────

// CORRECTED: Iran-USA/Israel now top conflict, Russia-Ukraine updated
const CONFLICTS = [
  { id:1, name:"Iran — USA / Israel",   region:"Mid East",   intensity:"critical", casualties:"Ongoing", india:"Oil routes, Hormuz",   update:"LIVE" },
  { id:2, name:"Israel–Gaza / Lebanon", region:"Mid East",   intensity:"critical", casualties:"50K+",    india:"Diaspora, oil prices", update:"LIVE" },
  { id:3, name:"Russia–Ukraine",        region:"E. Europe",  intensity:"high",     casualties:"800K+",   india:"Energy, wheat costs",  update:"18m"  },
  { id:4, name:"Sudan Civil War",       region:"E. Africa",  intensity:"high",     casualties:"150K+",   india:"Evacuation ongoing",   update:"2h"   },
  { id:5, name:"Myanmar Junta",         region:"SE Asia",    intensity:"high",     casualties:"50K+",    india:"NE border spillover",  update:"1h"   },
  { id:6, name:"Taiwan Strait",         region:"E. Asia",    intensity:"high",     casualties:"N/A",     india:"Supply chain, China",  update:"3h"   },
  { id:7, name:"Yemen — Houthi",        region:"Red Sea",    intensity:"high",     casualties:"N/A",     india:"Shipping lanes",       update:"45m"  },
  { id:8, name:"Pak — India (LoC)",     region:"S. Asia",    intensity:"elevated", casualties:"Ongoing", india:"DIRECT",               update:"Live" },
];

const BORDER_STATUS = [
  { name:"LAC (China)",       color:"#ff2d2d", level:"HIGH TENSION", detail:"Depsang — PLA vehicle assembly spotted" },
  { name:"LoC (Pakistan)",    color:"#ff2d2d", level:"CRITICAL",     detail:"Post-Sindoor — elevated posture" },
  { name:"Myanmar (Manipur)", color:"#ff6b00", level:"ELEVATED",     detail:"Arakan Army 4km from Moreh" },
  { name:"Bangladesh",        color:"#ffe033", level:"WATCH",         detail:"Political instability, crossings" },
  { name:"Nepal",             color:"#00ff88", level:"STABLE",        detail:"Diplomatic talks ongoing" },
  { name:"Sri Lanka Sea",     color:"#00ff88", level:"STABLE",        detail:"Normal naval patrolling" },
];

const BORDER_PROBS = [
  { label:"China (LAC)",     val:72, color:"#ff2d2d" },
  { label:"Pakistan (LoC)",  val:68, color:"#ff2d2d" },
  { label:"Myanmar Border",  val:41, color:"#ffe033" },
  { label:"Maritime",        val:55, color:"#ff6b00" },
  { label:"Domestic Terror", val:63, color:"#ff6b00" },
];

const INTEL_FEED = [
  { icon:"⚠️", text:"IB Alert: ISI-linked networks active in Delhi, Mumbai — heightened surveillance ordered"   },
  { icon:"🔴", text:"Drone sighting near Pathankot AFB — sector sealed, anti-drone systems activated"          },
  { icon:"🟡", text:"Encrypted chatter spike — NE insurgent groups coordinating across Myanmar border"         },
  { icon:"🟡", text:"INTERPOL Red Notice: 3 LeT operatives believed entered India via Nepal"                   },
  { icon:"🔴", text:"GHQ Rawalpindi emergency presser called — no agenda released"                             },
  { icon:"🟡", text:"RAW intercept: ISI funds routed to Khalistan-linked disinformation cells"                 },
];

const THREAT_SUMMARY = [
  { label:"Conventional War",    level:"LOW",      color:"#00ff88", desc:"No imminent inter-state war" },
  { label:"Nuclear Risk",        level:"WATCH",    color:"#ffe033", desc:"Pak tactical nuke doctrine"  },
  { label:"Cross-border Terror", level:"HIGH",     color:"#ff2d2d", desc:"Multiple active modules"    },
  { label:"Cyber Warfare",       level:"ELEVATED", color:"#ff6b00", desc:"APT41 targeting DRDO/ISRO"  },
  { label:"Hormuz / Oil Risk",   level:"HIGH",     color:"#ff2d2d", desc:"Iran-US standoff escalating"},
];

const SOURCES = [
  { src:"Reuters",        score:96, bias:"C"  },
  { src:"The Hindu",      score:91, bias:"CL" },
  { src:"BBC India",      score:89, bias:"CL" },
  { src:"OSINTtechnical", score:94, bias:"C"  },
  { src:"The Print",      score:84, bias:"C"  },
  { src:"NDTV",           score:82, bias:"C"  },
  { src:"ANI",            score:74, bias:"CR" },
  { src:"Republic TV",    score:45, bias:"R"  },
];

const TICKER_ITEMS = [
  "🔴 BREAKING: Iran IRGC intercepts US warship in Arabian Sea — standoff ongoing",
  "🔴 BREAKING: PLA vehicle assembly spotted at Depsang Plains — Maxar imagery confirms",
  "⚡ Pakistan GHQ emergency presser — Sialkot sector troop movements reported",
  "🛡️ INS Vikrant carrier group deployed Indian Ocean — coordinates with US Navy",
  "⚡ Houthi anti-ship missiles fired — two vessels rerouted around Cape of Good Hope",
  "🟡 Arakan Army pushes to 4km of Indian border at Moreh — BSF reinforced",
  "🔴 Delhi NCR explosion — RDX device, NIA confirms ISI-linked module (Dec 2024)",
  "📡 ISRO activates RISAT-2B for enhanced border surveillance following LAC activity",
  "⚡ Operation Sindoor resumption probability at 67% — OSINT estimate",
];

// Map events — updated with Iran-USA, correct priorities
const MAP_EVENTS = [
  { id:1,  lat:34.1,  lng:78.2,  sev:"critical", type:"⚔️", title:"LAC Standoff — Depsang",    detail:"PLA vehicle assembly. Indian Army on alert. Depsang Plains.",         country:"India/China",     india:"DIRECT",    updated:"Live"   },
  { id:2,  lat:33.5,  lng:74.3,  sev:"critical", type:"⚔️", title:"LoC — Post Sindoor",         detail:"Elevated posture post-Op Sindoor. Ceasefire fragile.",               country:"India/Pakistan",  india:"DIRECT",    updated:"Live"   },
  { id:3,  lat:26.5,  lng:55.0,  sev:"critical", type:"🔥", title:"Iran — USA Standoff",        detail:"IRGC intercepts USS Bataan. Arabian Sea standoff. Live situation.",   country:"Iran/USA",        india:"CRITICAL",  updated:"LIVE"   },
  { id:4,  lat:31.5,  lng:34.8,  sev:"critical", type:"💥", title:"Israel–Gaza–Lebanon",        detail:"IDF resumes ground ops. Hezbollah rockets at Haifa. Regional war.",   country:"Israel/Palestine",india:"Oil routes", updated:"LIVE"   },
  { id:5,  lat:24.5,  lng:93.9,  sev:"high",     type:"⚔️", title:"Myanmar — Manipur Border",  detail:"Arakan Army 4km from Moreh. BSF reinforced.",                        country:"India/Myanmar",   india:"DIRECT",    updated:"2h"     },
  { id:6,  lat:49.0,  lng:32.0,  sev:"high",     type:"💥", title:"Russia–Ukraine War",         detail:"Active frontline combat. 800K+ casualties. Drone strikes.",          country:"Ukraine",         india:"Indirect",  updated:"18m"    },
  { id:7,  lat:15.5,  lng:32.5,  sev:"high",     type:"💥", title:"Sudan Civil War",            detail:"150K dead. Indian nationals evacuated.",                             country:"Sudan",           india:"Diaspora",  updated:"3h"     },
  { id:8,  lat:16.8,  lng:43.2,  sev:"high",     type:"⚓", title:"Yemen — Houthi Strikes",    detail:"Anti-ship missiles. Indian vessels affected. Red Sea blocked.",       country:"Yemen",           india:"Shipping",  updated:"45m"    },
  { id:9,  lat:31.5,  lng:74.3,  sev:"critical", type:"🔴", title:"Punjab Terror Alert",        detail:"LeT module active. IED components seized.",                          country:"India",           india:"DIRECT",    updated:"1h"     },
  { id:10, lat:30.2,  lng:67.0,  sev:"high",     type:"☢️", title:"Pak Nuclear Posture",       detail:"Shaheen-III test. Tactical nuke doctrine in play.",                  country:"Pakistan",        india:"CRITICAL",  updated:"6h"     },
  { id:11, lat:26.0,  lng:56.3,  sev:"critical", type:"🛢️", title:"Strait of Hormuz",         detail:"Iran threatens closure. 40% of India's oil transits here.",          country:"Iran/Gulf",       india:"CRITICAL",  updated:"2h"     },
  { id:12, lat:8.0,   lng:77.5,  sev:"high",     type:"⚓", title:"Indian Ocean Watch",        detail:"Chinese vessels near Andaman. Indian Navy shadowing.",               country:"Indian Ocean",    india:"DIRECT",    updated:"2h"     },
  { id:13, lat:23.5,  lng:119.0, sev:"high",     type:"🛡️", title:"Taiwan Strait",            detail:"PLA exercises near Taiwan. US carrier deployed.",                   country:"China/Taiwan",    india:"Supply",    updated:"3h"     },
  { id:14, lat:7.0,   lng:76.0,  sev:"critical", type:"⚡", title:"⚡ Indian Ocean Event",     detail:"Naval activity off Sri Lanka. Indian Navy activated.",               country:"Indian Ocean",    india:"DIRECT",    updated:"LIVE"   },
];

const SEV_COLOR = { critical:"#ff2d2d", high:"#ff6b00", medium:"#ffe033", low:"#00ff88" };

const WORLD_RISKS = [
  { country:"🇺🇦 Ukraine",   risk:95, status:"Active War",    trend:"↑" },
  { country:"🇵🇸 Palestine", risk:93, status:"Active War",    trend:"→" },
  { country:"🇮🇱 Israel",    risk:88, status:"Active War",    trend:"↑" },
  { country:"🇷🇺 Russia",    risk:85, status:"Active War",    trend:"→" },
  { country:"🇸🇩 Sudan",     risk:82, status:"Civil War",     trend:"↑" },
  { country:"🇮🇷 Iran",      risk:79, status:"HIGH TENSION",  trend:"↑" },
  { country:"🇾🇪 Yemen",     risk:79, status:"Conflict",      trend:"↓" },
  { country:"🇲🇲 Myanmar",   risk:78, status:"Junta War",     trend:"→" },
  { country:"🇵🇰 Pakistan",  risk:71, status:"Post-Sindoor",  trend:"↑" },
  { country:"🇮🇳 India",     risk:67, status:"Elevated",      trend:"→" },
  { country:"🇰🇵 N.Korea",   risk:61, status:"Provocative",   trend:"↑" },
  { country:"🇹🇼 Taiwan",    risk:68, status:"High Tension",  trend:"↑" },
  { country:"🇨🇳 China",     risk:48, status:"Assertive",     trend:"↑" },
];

const GEO_NEWS = {
  national: [
    { headline:"CCS meets over LAC standoff — NSA Doval chairs emergency session", source:"The Hindu", time:"1h", cat:"MILITARY" },
    { headline:"India test-fires Agni-V MIRV — DRDO confirms multi-warhead deployment", source:"The Print", time:"5h", cat:"DEFENCE" },
    { headline:"Home Ministry high alert 5 states — IB input on LeT modules cited", source:"NDTV", time:"6h", cat:"SECURITY" },
    { headline:"Sindoor aftermath: India maintains elevated forward posture on LoC", source:"The Hindu", time:"8h", cat:"MILITARY" },
  ],
  local: [
    { headline:"Jammu encounter: 3 militants neutralized in Rajouri — Army op ongoing", source:"ANI", time:"30m", cat:"TERROR" },
    { headline:"Manipur: CRPF companies deployed amid fresh violence near Myanmar border", source:"NDTV", time:"2h", cat:"SECURITY" },
    { headline:"Arakan Army advances — Indian villagers evacuated from Moreh border area", source:"TOI", time:"3h", cat:"BORDER" },
    { headline:"Punjab Police busts cross-border drug-arms drone delivery network", source:"TOI", time:"4h", cat:"TERROR" },
  ],
  international: [
    { headline:"Iran IRGC intercepts US Navy warship — Arabian Sea standoff escalates", source:"Reuters", time:"LIVE", cat:"MILITARY" },
    { headline:"China deploys Type-055 destroyers Indian Ocean — 3rd in 60 days", source:"Reuters", time:"45m", cat:"MILITARY" },
    { headline:"Pakistan receives 6 J-10C jets from China — India watches IAF gap", source:"Reuters", time:"2h", cat:"MILITARY" },
    { headline:"US imposes fresh sanctions on Iran — Strait of Hormuz tension highest since 2020", source:"BBC", time:"3h", cat:"ECONOMY" },
  ],
};

const RESOURCES = [
  { label:"Crude Oil",    value:12, max:30, unit:"Days import cover", color:"#ff2d2d", icon:"🛢️", status:"CRITICAL", trend:"-2d vs last month" },
  { label:"Natural Gas",  value:18, max:30, unit:"Days supply",       color:"#ffe033", icon:"⛽",  status:"WATCH",    trend:"Stable" },
  { label:"Coal Stock",   value:24, max:30, unit:"Days at plants",    color:"#00ff88", icon:"⚫",  status:"ADEQUATE", trend:"+3d" },
  { label:"Food Grain",   value:28, max:30, unit:"Months buffer",     color:"#00ff88", icon:"🌾",  status:"ADEQUATE", trend:"Surplus" },
  { label:"Forex",        value:22, max:30, unit:"Months cover",      color:"#00d4ff", icon:"💰",  status:"STABLE",   trend:"$620B reserves" },
  { label:"Ammunition",   value:20, max:30, unit:"Days combat",       color:"#ff6b00", icon:"🎯",  status:"WATCH",    trend:"Procurement ongoing" },
];

// ─── LEAFLET LOADER ──────────────────────────────────────────
function loadLeaflet() {
  return new Promise(resolve => {
    if (window.L) { resolve(window.L); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = () => resolve(window.L);
    document.head.appendChild(s);
  });
}

// ─── SMALL COMPONENTS ────────────────────────────────────────
function IntColor(l) { return { critical:"#ff2d2d", high:"#ff6b00", medium:"#ffe033", low:"#00ff88", elevated:"#ffe033" }[l]||"#7aacbe"; }

function CredLabel({ score }) {
  const c = score>=85?"#00ff88":score>=65?"#ffe033":"#ff6b00";
  return <span style={{ fontSize:10, fontFamily:"Share Tech Mono", color:c, border:`1px solid ${c}`, padding:"1px 6px", letterSpacing:1 }}>{score>=85?"HIGH":score>=65?"MED":"LOW"} {score}%</span>;
}

function CatTag({ cat }) {
  const m = { MILITARY:"#ff2d2d", THREAT:"#ff6b00", TERROR:"#ff2d2d", GEOPOLITICAL:"#00d4ff", DIPLOMATIC:"#f0a500", ECONOMY:"#ffe033", POLICY:"#00d4ff", DEFENCE:"#ff6b00", SECURITY:"#ff6b00", CONFLICT:"#ff2d2d", BORDER:"#ff6b00" };
  const c = m[cat]||"#00d4ff";
  return <span style={{ fontSize:10, fontFamily:"Share Tech Mono", color:c, border:`1px solid ${c}44`, padding:"1px 6px", letterSpacing:1 }}>{cat}</span>;
}

function RiskGauge({ value }) {
  const r=50,cx=58,cy=62,circ=Math.PI*r,offset=circ-(value/100)*circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width="116" height="76" viewBox="0 0 116 80">
        <defs>
          <linearGradient id="arcG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00ff88"/>
            <stop offset="50%" stopColor="#ffe033"/>
            <stop offset="100%" stopColor="#ff2d2d"/>
          </linearGradient>
        </defs>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#0f3040" strokeWidth="10" strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="url(#arcG)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition:"stroke-dashoffset 1.5s ease" }}/>
        <text x={cx} y={cy-5} textAnchor="middle" fill="#ff6b00" fontSize="22" fontFamily="Teko" fontWeight="700">{value}%</text>
        <text x={cx} y={cy+11} textAnchor="middle" fill="#3a6678" fontSize="8" fontFamily="Share Tech Mono" letterSpacing="1">RISK INDEX</text>
      </svg>
    </div>
  );
}

function Radar() {
  const dots=[{x:"56%",y:"28%",c:"#ff2d2d",d:"0s"},{x:"36%",y:"44%",c:"#ff6b00",d:".6s"},{x:"72%",y:"66%",c:"#ffe033",d:"1.2s"},{x:"58%",y:"80%",c:"#00ff88",d:"1.8s"}];
  return (
    <div className="radar-wrap">
      {[122,90,58,26].map(s=><div key={s} className="radar-ring" style={{width:s,height:s}}/>)}
      <div className="radar-sweep"/>
      {dots.map(d=>(
        <div key={d.d}>
          <div className="radar-dot" style={{left:d.x,top:d.y,background:d.c,boxShadow:`0 0 7px ${d.c}`}}/>
          <div className="radar-ping" style={{left:d.x,top:d.y,borderColor:d.c,animationDelay:d.d}}/>
        </div>
      ))}
      <div style={{position:"absolute",top:"50%",left:"50%",width:6,height:6,borderRadius:"50%",background:"var(--cyan)",transform:"translate(-50%,-50%)",boxShadow:"0 0 10px var(--cyan)"}}/>
    </div>
  );
}

// ─── INDIA MAP — Official boundary (J&K whole in India) ──────
function IndiaMap() {
  return (
    <div style={{ position:"relative", height:260, overflow:"hidden" }}>
      <svg viewBox="0 0 480 290" style={{ width:"100%", height:"100%" }}>
        <defs>
          <radialGradient id="mbg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#071419"/>
            <stop offset="100%" stopColor="#020608"/>
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect width="480" height="290" fill="url(#mbg)"/>
        {/* Grid */}
        {[0,48,96,144,192,240,288,336,384,432,480].map(x=><line key={x} x1={x} y1="0" x2={x} y2="290" stroke="#0f3040" strokeWidth=".4"/>)}
        {[0,48,96,144,192,240,288].map(y=><line key={y} x1="0" y1={y} x2="480" y2={y} stroke="#0f3040" strokeWidth=".4"/>)}

        {/* INDIA — main body */}
        <polygon
          points="178,20 245,15 295,30 318,62 335,105 322,152 285,182 260,215 238,258 218,272 200,260 184,232 165,212 144,185 126,160 115,128 125,92 138,60 158,36"
          fill="rgba(19,136,8,.14)" stroke="#138808" strokeWidth="1.8"/>

        {/* J&K — OFFICIAL FULL TERRITORY including PoK, Aksai Chin */}
        {/* This shows J&K as per India's official map — includes PoK and Aksai Chin */}
        <polygon
          points="178,20 210,8 250,5 295,12 318,30 318,62 295,30 245,15"
          fill="rgba(255,153,51,.18)" stroke="#FF9933" strokeWidth="1.5"
          strokeDasharray="none"/>
        {/* Aksai Chin */}
        <polygon
          points="295,12 340,8 360,20 350,40 318,40 318,30"
          fill="rgba(255,107,0,.12)" stroke="#FF9933" strokeWidth="1" strokeDasharray="4,3"/>
        {/* PoK label area */}
        <text x="264" y="20" fill="rgba(255,153,51,.8)" fontSize="7" fontFamily="Share Tech Mono">J&K (INDIA)</text>
        <text x="308" y="22" fill="rgba(255,107,0,.6)" fontSize="6" fontFamily="Share Tech Mono">PoK*</text>
        <text x="318" y="36" fill="rgba(255,107,0,.5)" fontSize="6" fontFamily="Share Tech Mono">Aksai</text>

        {/* Pakistan */}
        <polygon
          points="108,20 175,20 158,36 138,60 125,92 105,82 78,58 85,30"
          fill="rgba(100,100,120,.1)" stroke="#3a6678" strokeWidth="1"/>
        <text x="82" y="52" fill="rgba(100,100,140,.7)" fontSize="8" fontFamily="Share Tech Mono">PAK</text>

        {/* China */}
        <polygon
          points="250,5 360,0 400,18 390,40 350,40 340,8 295,12 250,5"
          fill="rgba(80,80,100,.08)" stroke="#3a6678" strokeWidth="1"/>
        <text x="350" y="22" fill="rgba(80,80,120,.6)" fontSize="8" fontFamily="Share Tech Mono">CHINA</text>

        {/* Nepal */}
        <polygon points="178,88 255,80 262,95 175,98" fill="rgba(0,212,255,.06)" stroke="#00d4ff" strokeWidth=".7"/>
        <text x="200" y="92" fill="rgba(0,212,255,.5)" fontSize="7" fontFamily="Share Tech Mono">NPL</text>

        {/* Bangladesh */}
        <polygon points="270,178 295,188 288,215 262,215 260,200" fill="rgba(0,212,255,.08)" stroke="#00d4ff" strokeWidth=".7"/>
        <text x="268" y="203" fill="rgba(0,212,255,.5)" fontSize="6" fontFamily="Share Tech Mono">BGD</text>

        {/* Myanmar */}
        <polygon points="310,180 340,190 335,230 312,240 285,215" fill="rgba(80,80,80,.08)" stroke="#3a6678" strokeWidth=".7"/>
        <text x="308" y="215" fill="rgba(100,100,100,.6)" fontSize="7" fontFamily="Share Tech Mono">MYN</text>

        {/* Sri Lanka */}
        <ellipse cx="228" cy="278" rx="12" ry="9" fill="rgba(0,212,255,.1)" stroke="#00d4ff" strokeWidth=".8"/>
        <text x="220" y="281" fill="rgba(0,212,255,.5)" fontSize="6" fontFamily="Share Tech Mono">SL</text>

        {/* INDIA LABEL */}
        <text x="200" y="138" fill="rgba(19,136,8,.7)" fontSize="14" fontFamily="Teko" letterSpacing="4" fontWeight="600">INDIA</text>
        <text x="202" y="152" fill="rgba(19,136,8,.4)" fontSize="7" fontFamily="Share Tech Mono" letterSpacing="2">BHARAT</text>

        {/* Military installations */}
        {[
          {cx:198,cy:105,icon:"✈",label:"Hindon AFB",  c:"#00d4ff"},
          {cx:148,cy:68, icon:"✈",label:"Pathankot",   c:"#00d4ff"},
          {cx:250,cy:55, icon:"⛰",label:"Leh Base",   c:"#ff6b00"},
          {cx:214,cy:252,icon:"⚓",label:"INS Karwar", c:"#00d4ff"},
          {cx:268,cy:234,icon:"⚓",label:"Andaman",    c:"#00d4ff"},
          {cx:172,cy:126,icon:"☢",label:"Pokhran",    c:"#ffe033"},
          {cx:186,cy:80, icon:"🛡",label:"Strike C.",  c:"#ff6b00"},
        ].map((m,i)=>(
          <g key={i}>
            <text x={m.cx} y={m.cy} textAnchor="middle" fontSize="11">{m.icon}</text>
            <text x={m.cx} y={m.cy+11} textAnchor="middle" fill={m.c} fontSize="6" fontFamily="Share Tech Mono">{m.label}</text>
          </g>
        ))}

        {/* Conflict hotspots */}
        {[
          {cx:252,cy:48, c:"#ff2d2d", label:"LAC",  d:0   },
          {cx:135,cy:56, c:"#ff2d2d", label:"LoC",  d:.5  },
          {cx:290,cy:200,c:"#ff6b00", label:"MYN",  d:1.4 },
          {cx:220,cy:272,c:"#00ff88", label:"",     d:.8  },
          {cx:295,cy:48, c:"#ff6b00", label:"PoK",  d:.3  },
        ].map((h,i)=>(
          <g key={i}>
            <circle cx={h.cx} cy={h.cy} r="5" fill={h.c} opacity=".9">
              <animate attributeName="r" values="5;11;5" dur="2s" repeatCount="indefinite" begin={`${h.d}s`}/>
              <animate attributeName="opacity" values=".9;.15;.9" dur="2s" repeatCount="indefinite" begin={`${h.d}s`}/>
            </circle>
            {h.label&&<text x={h.cx+9} y={h.cy+4} fill={h.c} fontSize="8" fontFamily="Share Tech Mono">{h.label}</text>}
          </g>
        ))}

        {/* Note on official boundary */}
        <text x="4" y="285" fill="rgba(255,153,51,.4)" fontSize="6" fontFamily="Share Tech Mono">
          * Map shows India's official position incl. PoK and Aksai Chin (GoI boundary)
        </text>

        {/* Legend */}
        {[["#ff2d2d","CONFLICT",8],["#00d4ff","MILITARY",72],["#ffe033","NUCLEAR",140],["#00ff88","STABLE",210]].map(([c,l,x])=>(
          <g key={l}><circle cx={x+4} cy={277} r="4" fill={c}/><text x={x+12} y={280} fill="#7aacbe" fontSize="7" fontFamily="Share Tech Mono">{l}</text></g>
        ))}
      </svg>
    </div>
  );
}

// ─── LEAFLET MAP (dashboard) ─────────────────────────────────
function DashMap() {
  const mapRef = useRef(null);
  const leafRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const L = await loadLeaflet();
      if (!mounted || !mapRef.current || leafRef.current) return;
      const map = L.map(mapRef.current, { center:[25,65], zoom:3, zoomControl:true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"© OpenStreetMap | OSINT", maxZoom:10 }).addTo(map);
      leafRef.current = map;
      // Trade routes
      [[[19,72.8],[24,58],[26.5,55]],[[13,80.3],[6,93],[1.3,103.8]],[[15,54],[12.5,44],[29,32.5]]].forEach(pts=>
        L.polyline(pts,{color:"#00d4ff",weight:1.3,opacity:.3,dashArray:"5,8"}).addTo(map));
      // Markers
      MAP_EVENTS.forEach(ev=>{
        const c=SEV_COLOR[ev.sev]||"#7aacbe";
        const sz=ev.sev==="critical"?15:ev.sev==="high"?10:7;
        const icon=L.divIcon({className:"",html:`<div style="position:relative;width:${sz*3}px;height:${sz*3}px"><div style="position:absolute;top:50%;left:50%;width:${sz*2}px;height:${sz*2}px;border-radius:50%;border:2px solid ${c};transform:translate(-50%,-50%);animation:ping 2s ease-out infinite;opacity:0"></div><div style="position:absolute;top:50%;left:50%;width:${sz}px;height:${sz}px;border-radius:50%;background:${c};transform:translate(-50%,-50%);box-shadow:0 0 ${sz}px ${c};animation:${ev.sev==="critical"?"pcrit":"phigh"} 2s infinite"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-160%);font-size:${sz}px">${ev.type}</div></div>`,iconSize:[sz*3,sz*3],iconAnchor:[sz*1.5,sz*1.5]});
        L.marker([ev.lat,ev.lng],{icon}).bindPopup(`<div style="min-width:210px"><b style="font-family:Teko;font-size:16px;color:#e8f4f8">${ev.type} ${ev.title}</b><br/><span style="font-size:12px;color:#7aacbe;line-height:1.4">${ev.detail}</span><br/><br/><span style="font-size:10px;color:#3a6678;font-family:Share Tech Mono">🇮🇳 India: ${ev.india} · ${ev.updated}</span></div>`,{maxWidth:270}).addTo(map);
      });
    }
    init();
    return()=>{ mounted=false; if(leafRef.current){leafRef.current.remove();leafRef.current=null;} };
  }, []);

  return (
    <div className="dash-map-wrap">
      <style>{`@keyframes ping{0%{transform:translate(-50%,-50%) scale(0);opacity:.8}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}@keyframes pcrit{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 16px #ff2d2d}50%{transform:translate(-50%,-50%) scale(1.5);box-shadow:0 0 28px #ff2d2d}}@keyframes phigh{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.3)}}`}</style>
      <div id="dash-map" ref={mapRef} style={{ width:"100%", height:"100%", minHeight:340 }}/>
      <div className="map-legend-dash">
        <div className="teko" style={{ fontSize:10, letterSpacing:2, color:"#3a6678", marginBottom:5 }}>SEVERITY</div>
        {Object.entries(SEV_COLOR).map(([s,c])=>(
          <div key={s} className="leg-row"><div className="leg-dot" style={{ background:c }}/>{s.toUpperCase()}</div>
        ))}
        <div style={{ borderTop:"1px solid var(--b)", marginTop:5, paddingTop:5 }}>
          <div className="leg-row"><span style={{ color:"#00d4ff", marginRight:4 }}>---</span>Trade Routes</div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
function PageDashboard({ news, loading, refetch }) {
  const [tab, setTab] = useState("news");

  return (
    <div className="dash-grid">
      {/* COL 1 — Risk + Radar + India Map + Borders */}
      <div className="col">
        <div className="panel">
          <div className="ph"><span className="ph-icon">◈</span> CONFLICT RISK</div>
          <div style={{ padding:"10px 12px" }}>
            <RiskGauge value={67}/>
            <div style={{ textAlign:"center", marginBottom:10 }}><span className="tbadge tb-high">⚡ ELEVATED</span></div>
            {BORDER_PROBS.map(p=>(
              <div key={p.label} className="prob-wrap">
                <div className="prob-label"><span>{p.label}</span><span style={{ color:p.color }}>{p.val}%</span></div>
                <div className="prob-bar"><div className="prob-fill" style={{ width:`${p.val}%`, background:p.color }}/></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">◉</span> BORDER RADAR</div>
          <div style={{ padding:"10px 0 6px" }}><Radar/></div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">🗺️</span> INDIA — OFFICIAL MAP</div>
          <IndiaMap/>
        </div>
        <div className="panel" style={{ flex:1 }}>
          <div className="ph"><span className="ph-icon">▣</span> BORDER STATUS</div>
          {BORDER_STATUS.map(b=>(
            <div key={b.name} className="bstatus" style={{ borderColor:b.color }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#c8dde6" }}>{b.name}</div>
                <div style={{ fontSize:11, color:"#3a6678", marginTop:1 }}>{b.detail}</div>
              </div>
              <div className="teko" style={{ fontSize:11, color:b.color, letterSpacing:1, flexShrink:0 }}>{b.level}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COL 2 — Live World Map + Op Sindoor */}
      <div className="col">
        <div className="panel">
          <div className="ph">
            <span className="ph-icon">🌍</span> LIVE GEOPOLITICAL MAP
            <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
              <div className="live-dot" style={{ width:6, height:6 }}/>
              <span className="mono" style={{ fontSize:10, color:"#3a6678" }}>{MAP_EVENTS.length} EVENTS · CLICK MARKERS</span>
            </span>
          </div>
          <DashMap/>
        </div>
        {/* OP SINDOOR — full panel */}
        <SindoorPanel/>
      </div>

      {/* COL 3 — OSINT Feed + News/Intel */}
      <div className="col">
        {/* OSINT Live Feed */}
        <OSINTPanel/>

        {/* News/Intel tabs */}
        <div className="panel" style={{ flex:1, display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", borderBottom:"1px solid var(--b)" }}>
            {[["news","📰 Live News"],["intel","⚡ Intel"]].map(([t,l])=>(
              <button key={t} className="tab-btn" onClick={()=>setTab(t)}
                style={{ color:tab===t?"var(--cyan)":"var(--t3)", borderBottomColor:tab===t?"var(--cyan)":"transparent" }}>
                {l}
              </button>
            ))}
            <div style={{ marginLeft:"auto", padding:"0 10px", display:"flex", alignItems:"center", gap:6 }}>
              {loading&&<span className="mono" style={{ fontSize:10, color:"#ffe033" }}>FETCHING...</span>}
              {!loading&&<div className="live-dot" style={{ width:5, height:5 }}/>}
              <button onClick={refetch} style={{ background:"none", border:"none", color:"var(--cyan)", cursor:"pointer", fontSize:13, fontFamily:"Teko", letterSpacing:1 }}>↺</button>
            </div>
          </div>
          <div className="scroll" style={{ flex:1, maxHeight:340 }}>
            {tab==="news"
              ? news.length===0
                ? <div style={{ padding:20, textAlign:"center", color:"#3a6678", fontSize:12, fontFamily:"Share Tech Mono" }}>Loading feed...</div>
                : news.map((item,i)=>(
                  <div key={item.id??i} className="news-card" onClick={()=>item.url&&item.url!=="#"&&window.open(item.url,"_blank")}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                      <CatTag cat={item.category}/>
                      <CredLabel score={item.credibility}/>
                      <span className="mono" style={{ fontSize:10, color:"#3a6678", marginLeft:"auto" }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize:13, lineHeight:1.45, color:"#c8dde6", marginBottom:5, fontWeight:500 }}>{item.headline}</div>
                    <div style={{ fontSize:11, color:"#3a6678" }}>{item.source}<span style={{ color:"#1a5068" }}> · {item.bias}</span></div>
                    <div className="cred-bar"><div className="cred-fill" style={{ width:`${item.credibility}%`, background:item.credibility>=85?"#00ff88":item.credibility>=65?"#ffe033":"#ff6b00" }}/></div>
                  </div>
                ))
              : INTEL_FEED.map((item,i)=>(
                <div key={i} className="intel-item">
                  <div style={{ fontSize:16, flexShrink:0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:12, color:"#c8dde6", lineHeight:1.45 }}>{item.text}</div>
                    <div className="mono" style={{ fontSize:10, color:"#3a6678", marginTop:3 }}>IB/RAW/NIA · {["2m","8m","14m","31m","1h","2h"][i]} ago</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* COL 4 — TV + Conflicts + Sources */}
      <div className="col">
        <TVPanel/>
        <div className="panel" style={{ flex:1 }}>
          <div className="ph"><span className="ph-icon">◈</span> ACTIVE CONFLICTS</div>
          <div className="scroll" style={{ maxHeight:300 }}>
            {CONFLICTS.map(c=>(
              <div key={c.id} className="conf-row">
                <div style={{ width:9, height:9, borderRadius:"50%", background:IntColor(c.intensity), flexShrink:0, boxShadow:`0 0 6px ${IntColor(c.intensity)}` }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#c8dde6", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                  <div style={{ fontSize:11, color:"#3a6678" }}>{c.region} · {c.update}{c.update!=="LIVE"?" ago":""}</div>
                  <div style={{ fontSize:11, color:"#7aacbe" }}>🇮🇳 {c.india}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div className="teko" style={{ fontSize:11, color:IntColor(c.intensity), letterSpacing:1 }}>{c.intensity.toUpperCase()}</div>
                  <div style={{ fontSize:10, color:"#3a6678" }}>{c.casualties}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">◉</span> SOURCE CREDIBILITY</div>
          <div style={{ padding:"8px 12px" }}>
            {SOURCES.map(s=>(
              <div key={s.src} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                <div style={{ width:76, fontSize:11, color:"#7aacbe", flexShrink:0 }}>{s.src}</div>
                <div className="prob-bar" style={{ flex:1, height:5 }}>
                  <div className="prob-fill" style={{ width:`${s.score}%`, background:s.score>=85?"#00ff88":s.score>=65?"#ffe033":"#ff6b00" }}/>
                </div>
                <div className="mono" style={{ fontSize:10, color:"#3a6678", width:24 }}>{s.score}</div>
                <div className="mono" style={{ fontSize:9, color:"#1a5068", width:18 }}>{s.bias}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">▲</span> THREAT SUMMARY</div>
          <div style={{ padding:"6px 12px" }}>
            {THREAT_SUMMARY.map(t=>(
              <div key={t.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid var(--b)", gap:8 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#c8dde6" }}>{t.label}</div>
                  <div style={{ fontSize:11, color:"#3a6678" }}>{t.desc}</div>
                </div>
                <span style={{ fontSize:10, color:t.color, border:`1px solid ${t.color}44`, padding:"2px 7px", fontFamily:"Teko", letterSpacing:1, flexShrink:0 }}>{t.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GEO NEWS PAGE ────────────────────────────────────────────
function PageGeoNews() {
  const [tab, setTab] = useState("national");
  return (
    <div className="page-pad">
      <div className="panel">
        <div style={{ display:"flex", borderBottom:"1px solid var(--b)" }}>
          {[["national","🇮🇳 National"],["local","📍 Local"],["international","🌍 International"]].map(([t,l])=>(
            <button key={t} className="tab-btn" onClick={()=>setTab(t)}
              style={{ color:tab===t?"var(--cyan)":"var(--t3)", borderBottomColor:tab===t?"var(--cyan)":"transparent" }}>
              {l}
            </button>
          ))}
        </div>
        <div className="scroll" style={{ maxHeight:"calc(100vh - 180px)" }}>
          {(GEO_NEWS[tab]||[]).map((item,i)=>(
            <div key={i} className="geo-card">
              <div style={{ display:"flex", gap:6, marginBottom:5, flexWrap:"wrap" }}>
                <CatTag cat={item.cat}/>
                <span className="mono" style={{ fontSize:10, color:"#3a6678", marginLeft:"auto" }}>{item.time} ago · {item.source}</span>
              </div>
              <div style={{ fontSize:14, lineHeight:1.45, color:"#c8dde6", fontWeight:600 }}>{item.headline}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RESOURCES PAGE ───────────────────────────────────────────
function PageResources() {
  return (
    <div className="page-pad">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:8 }}>
        {RESOURCES.map((r,i)=>{
          const pct=(r.value/r.max)*100;
          const c=pct>70?"#00ff88":pct>40?"#ffe033":"#ff2d2d";
          return (
            <div key={i} className="res-card">
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:22 }}>{r.icon}</span>
                <span style={{ fontSize:10, color:c, border:`1px solid ${c}44`, padding:"2px 7px", fontFamily:"Teko", letterSpacing:1 }}>{r.status}</span>
              </div>
              <div className="teko" style={{ fontSize:14, letterSpacing:1, color:"#7aacbe" }}>{r.label}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:6, margin:"4px 0" }}>
                <span className="res-num" style={{ color:c }}>{r.value}</span>
                <span style={{ fontFamily:"Share Tech Mono", fontSize:10, color:"#3a6678" }}>{r.unit}</span>
              </div>
              <div className="res-bar"><div className="res-fill" style={{ width:`${pct}%`, background:c }}/></div>
              <div className="mono" style={{ fontSize:10, color:r.trend.startsWith("-")?"#ff2d2d":r.trend.startsWith("+")?"#00ff88":"#7aacbe" }}>{r.trend}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WORLD MAP PAGE ───────────────────────────────────────────
function PageWorldMap() {
  const mapRef = useRef(null);
  const leafRef = useRef(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const L = await loadLeaflet();
      if (!mounted || !mapRef.current || leafRef.current) return;
      const map = L.map(mapRef.current, { center:[20,60], zoom:3 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"© OpenStreetMap", maxZoom:10 }).addTo(map);
      leafRef.current = map;
      [[[19,72.8],[24,58],[26.5,55]],[[13,80.3],[6,93],[1.3,103.8]],[[15,54],[12.5,44],[29,32.5]]].forEach(pts=>
        L.polyline(pts,{color:"#00d4ff",weight:1.3,opacity:.3,dashArray:"5,8"}).addTo(map));
      MAP_EVENTS.forEach(ev=>{
        const c=SEV_COLOR[ev.sev]||"#7aacbe";
        const sz=ev.sev==="critical"?15:ev.sev==="high"?10:7;
        const icon=L.divIcon({className:"",html:`<div style="position:relative;width:${sz*3}px;height:${sz*3}px"><div style="position:absolute;top:50%;left:50%;width:${sz*2}px;height:${sz*2}px;border-radius:50%;border:2px solid ${c};transform:translate(-50%,-50%);animation:ping 2s ease-out infinite;opacity:0"></div><div style="position:absolute;top:50%;left:50%;width:${sz}px;height:${sz}px;border-radius:50%;background:${c};transform:translate(-50%,-50%);box-shadow:0 0 ${sz}px ${c};animation:${ev.sev==="critical"?"pcrit":"phigh"} 2s infinite"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-160%);font-size:${sz}px">${ev.type}</div></div>`,iconSize:[sz*3,sz*3],iconAnchor:[sz*1.5,sz*1.5]});
        L.marker([ev.lat,ev.lng],{icon}).bindPopup(`<div><b style="font-family:Teko;font-size:16px;color:#e8f4f8">${ev.type} ${ev.title}</b><br/><span style="font-size:12px;color:#7aacbe">${ev.detail}</span><br/><span style="font-size:10px;color:#3a6678;font-family:Share Tech Mono">🇮🇳 ${ev.india}</span></div>`,{maxWidth:280}).addTo(map)
          .on("click",()=>setSel(ev));
      });
    }
    init();
    return()=>{ mounted=false; if(leafRef.current){leafRef.current.remove();leafRef.current=null;} };
  }, []);

  return (
    <div style={{ padding:8, display:"grid", gridTemplateColumns:"1fr 290px", gap:8, minHeight:"calc(100vh - 130px)" }}>
      <div className="panel" style={{ display:"flex", flexDirection:"column" }}>
        <div className="ph"><span className="ph-icon">🌍</span> LIVE WORLD CONFLICT MAP — {MAP_EVENTS.length} EVENTS</div>
        <div ref={mapRef} style={{ flex:1, minHeight:520 }}/>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {sel&&(
          <div className="panel" style={{ animation:"fadeIn .3s ease" }}>
            <div className="ph"><span style={{ color:SEV_COLOR[sel.sev] }}>{sel.type}</span> EVENT DETAIL</div>
            <div style={{ padding:"10px 14px" }}>
              <div className="teko" style={{ fontSize:18, color:"#e8f4f8", marginBottom:5 }}>{sel.title}</div>
              <div style={{ fontSize:12, color:"#7aacbe", lineHeight:1.5, marginBottom:8 }}>{sel.detail}</div>
              <div className="mono" style={{ fontSize:11, color:"#3a6678" }}>🇮🇳 {sel.india}</div>
              <div className="mono" style={{ fontSize:11, color:"#3a6678" }}>{sel.country} · {sel.updated}</div>
              <button onClick={()=>leafRef.current&&leafRef.current.flyTo([sel.lat,sel.lng],5,{duration:1.5})}
                style={{ marginTop:10, padding:"5px 14px", background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.2)", color:"var(--cyan)", fontFamily:"Teko", fontSize:12, letterSpacing:1, cursor:"pointer", borderRadius:1 }}>
                🎯 FLY TO ON MAP
              </button>
            </div>
          </div>
        )}
        <div className="panel" style={{ flex:1 }}>
          <div className="ph"><span className="ph-icon">◈</span> ALL EVENTS</div>
          <div className="scroll" style={{ maxHeight:"calc(100vh - 280px)" }}>
            {[...MAP_EVENTS].sort((a,b)=>Object.keys(SEV_COLOR).indexOf(a.sev)-Object.keys(SEV_COLOR).indexOf(b.sev)).map(ev=>(
              <div key={ev.id} className="conf-row" style={{ borderLeft:`3px solid ${SEV_COLOR[ev.sev]}` }}
                onClick={()=>{ setSel(ev); if(leafRef.current)leafRef.current.flyTo([ev.lat,ev.lng],5,{duration:1.5}); }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#c8dde6" }}>{ev.type} {ev.title}</div>
                  <div style={{ fontSize:11, color:"#3a6678" }}>{ev.country} · {ev.updated}</div>
                  <div style={{ fontSize:11, color:"#7aacbe" }}>🇮🇳 {ev.india}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">🌍</span> COUNTRY RISK INDEX</div>
          <div className="scroll" style={{ maxHeight:260 }}>
            {WORLD_RISKS.sort((a,b)=>b.risk-a.risk).map((w,i)=>{
              const c=w.risk>=80?"#ff2d2d":w.risk>=60?"#ff6b00":w.risk>=40?"#ffe033":"#00ff88";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderBottom:"1px solid var(--b)" }}>
                  <div style={{ fontSize:13, color:"#c8dde6", flex:1 }}>{w.country}</div>
                  <div className="prob-bar" style={{ width:65, height:5 }}><div className="prob-fill" style={{ width:`${w.risk}%`, background:c }}/></div>
                  <div className="teko" style={{ fontSize:16, color:c, width:40 }}>{w.risk}%</div>
                  <div className="teko" style={{ fontSize:16, color:w.trend==="↑"?"#ff2d2d":w.trend==="↓"?"#00ff88":"#ffe033" }}>{w.trend}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SINDOOR PAGE ─────────────────────────────────────────────
function PageSindoor() {
  return <div className="page-pad"><SindoorPanel/></div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [time, setTime] = useState(new Date());
  const [page, setPage] = useState("dashboard");
  const { news, loading, refetch } = useNews();

  useEffect(() => {
    const t = setInterval(()=>setTime(new Date()),1000);
    return ()=>clearInterval(t);
  }, []);

  const timeFmt = d => d.toLocaleTimeString("en-IN",{hour12:false})+" IST";
  const dateFmt = d => d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

  const pages = [
    ["dashboard","⬛ Dashboard"],
    ["sindoor",  "🎯 Op. Sindoor"],
    ["geonews",  "🗞️ Geo News"],
    ["resources","🛢️ Resources"],
    ["worldmap", "🌍 World Map"],
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="scanline"/>
      <div className="topbar">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:28, height:20, background:"linear-gradient(180deg,#FF9933 33%,white 33%,white 66%,#138808 66%)", borderRadius:2, flexShrink:0, border:"1px solid #333" }}/>
          <div>
            <div className="teko" style={{ fontSize:18, fontWeight:700, letterSpacing:2, lineHeight:1, color:"#e8f4f8" }}>INDIA GEOPOLITICAL WAR DESK</div>
            <div className="mono" style={{ fontSize:9, letterSpacing:2, color:"#3a6678" }}>OPEN-SOURCE INTELLIGENCE · OSINT · NON-PARTISAN</div>
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
          <button onClick={refetch} style={{ background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.2)", color:"var(--cyan)", fontFamily:"Teko", fontSize:12, letterSpacing:2, padding:"4px 12px", cursor:"pointer", borderRadius:1 }}>↺ REFRESH</button>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div className="live-dot"/>
            <span className="mono" style={{ fontSize:11, color:"#ff2d2d", letterSpacing:1 }}>LIVE</span>
          </div>
          <div style={{ textAlign:"right" }}>
            <div className="mono" style={{ fontSize:14, color:"var(--cyan)", letterSpacing:1 }}>{timeFmt(time)}</div>
            <div className="mono" style={{ fontSize:9, color:"#3a6678" }}>{dateFmt(time)}</div>
          </div>
        </div>
      </div>
      <div className="flag-stripe"/>
      <div className="nav-tabs">
        {pages.map(([id,label])=>(
          <button key={id} className={`nav-tab${page===id?" active":""}`} onClick={()=>setPage(id)}>{label}</button>
        ))}
      </div>
      {page==="dashboard" && <PageDashboard news={news} loading={loading} refetch={refetch}/>}
      {page==="sindoor"   && <PageSindoor/>}
      {page==="geonews"   && <PageGeoNews/>}
      {page==="resources" && <PageResources/>}
      {page==="worldmap"  && <PageWorldMap/>}
      <div className="bottom-bar">
        <div className="break-label">
          <div className="live-dot"/>
          <span className="teko" style={{ fontSize:13, letterSpacing:2, color:"#ff2d2d" }}>BREAKING</span>
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>(
              <span key={i} className="ticker-item">{item}<span style={{ color:"#f0a500", margin:"0 10px" }}>///</span></span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

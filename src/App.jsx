import { useState, useEffect, useRef } from "react";
import { useNews } from "./useNews";
import TVPanel from "./TVPanel";

// ─── CSS ─────────────────────────────────────────────────────
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
  }
  body { background:var(--bg); font-family:'Rajdhani',sans-serif; color:var(--txt); overflow-x:hidden; }
  .scanline { position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px); }

  @keyframes pulse-red  { 0%,100%{opacity:1;box-shadow:0 0 8px var(--red)} 50%{opacity:.4} }
  @keyframes ticker     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes fadeIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sweep      { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes radar-ping { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(1);opacity:0} }
  @keyframes slide-in   { from{transform:translateX(-8px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes ping       { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
  @keyframes pcrit      { 0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 12px #ff2d2d} 50%{transform:translate(-50%,-50%) scale(1.4);box-shadow:0 0 20px #ff2d2d} }
  @keyframes phigh      { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.25)} }

  .live-dot { display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--red);animation:pulse-red 1.2s infinite;flex-shrink:0; }
  .mono { font-family:'Share Tech Mono',monospace; }
  .teko { font-family:'Teko',sans-serif; }

  .panel { background:var(--panel);border:1px solid var(--b);border-radius:2px;position:relative;overflow:hidden; }
  .panel::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:.35; }
  .ph { padding:8px 12px;border-bottom:1px solid var(--b);background:linear-gradient(90deg,var(--elev),transparent);
    display:flex;align-items:center;gap:8px;font-family:'Teko',sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--t2); }
  .ph-icon { color:var(--cyan);font-size:10px; }
  .scroll { overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--bb) transparent; }

  /* TOP BAR */
  .topbar { background:var(--panel);border-bottom:1px solid var(--b);padding:0 14px;display:flex;align-items:center;gap:12px;height:46px;position:sticky;top:0;z-index:200; }
  .flag-stripe { height:3px;background:linear-gradient(90deg,var(--saf) 33.3%,white 33.3%,white 66.6%,var(--ig) 66.6%); }

  /* NAV */
  .nav-tabs { display:flex;background:var(--panel);border-bottom:1px solid var(--b);padding:0 14px;gap:4px;position:sticky;top:46px;z-index:199;overflow-x:auto; }
  .nav-tab { padding:8px 14px;background:none;border:none;cursor:pointer;font-family:'Teko',sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--t3);border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .2s;white-space:nowrap; }
  .nav-tab.active { color:var(--cyan);border-bottom-color:var(--cyan); }
  .nav-tab:hover { color:var(--t2); }

  /* DASHBOARD GRID — 4 columns */
  .dash-grid { display:grid;grid-template-columns:230px 1fr 1fr 240px;grid-template-rows:auto;gap:5px;padding:5px; }
  @media(max-width:1300px){ .dash-grid{ grid-template-columns:220px 1fr 220px; } }
  @media(max-width:900px){  .dash-grid{ grid-template-columns:1fr 1fr; } }
  @media(max-width:600px){  .dash-grid{ grid-template-columns:1fr; } }
  .col { display:flex;flex-direction:column;gap:5px; }
  .span2 { grid-column:span 2; }

  /* BARS */
  .prob-wrap  { margin:4px 0; }
  .prob-label { display:flex;justify-content:space-between;font-size:11px;color:var(--t2);margin-bottom:2px;font-family:'Share Tech Mono',monospace; }
  .prob-bar   { height:5px;background:var(--b);border-radius:1px;overflow:hidden; }
  .prob-fill  { height:100%;border-radius:1px;transition:width 1.2s ease; }

  /* STATS */
  .stat-grid { display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px; }
  .stat-box  { text-align:center;padding:6px 2px;border:1px solid var(--b);background:var(--card); }
  .stat-num  { font-family:'Teko',sans-serif;font-size:24px;font-weight:700;line-height:1; }
  .stat-lbl  { font-size:8px;letter-spacing:1px;color:var(--t3);text-transform:uppercase;margin-top:1px; }

  /* BORDER STATUS */
  .bstatus { padding:6px 10px;border-left:3px solid;margin-bottom:1px;font-size:11px;display:flex;align-items:center;justify-content:space-between;gap:6px; }

  /* NEWS */
  .news-card { padding:9px 11px;border-bottom:1px solid var(--b);animation:fadeIn .4s ease;cursor:pointer;transition:background .15s; }
  .news-card:hover { background:var(--elev); }
  .cred-bar  { height:2px;border-radius:2px;background:var(--b);overflow:hidden;margin-top:5px; }
  .cred-fill { height:100%;border-radius:2px; }

  /* CONFLICT ROW */
  .conf-row { display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--b);animation:slide-in .3s ease;cursor:pointer;transition:background .15s; }
  .conf-row:hover { background:var(--elev); }

  /* INTEL */
  .intel-item { padding:7px 11px;border-bottom:1px solid var(--b);font-size:11px;display:flex;gap:7px;align-items:flex-start; }

  /* TAGS */
  .tag { display:inline-block;padding:1px 4px;font-size:9px;letter-spacing:1px;border-radius:1px;font-family:'Teko',sans-serif;font-weight:600;text-transform:uppercase;margin-right:2px; }
  .t-cyan { background:rgba(0,212,255,.12);color:var(--cyan);border:1px solid rgba(0,212,255,.25); }
  .t-red  { background:rgba(255,45,45,.12);color:var(--red);border:1px solid rgba(255,45,45,.25); }

  /* BADGES */
  .tbadge { display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:1px;font-size:10px;letter-spacing:1.5px;font-family:'Teko',sans-serif;font-weight:600;text-transform:uppercase; }
  .tb-high { background:rgba(255,107,0,.12);border:1px solid var(--org);color:var(--org); }
  .tb-crit { background:rgba(255,45,45,.12);border:1px solid var(--red);color:var(--red); }

  /* TAB BUTTONS */
  .tab-btn { padding:7px 12px;background:none;border:none;cursor:pointer;font-family:'Teko',sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;transition:color .2s;border-bottom:2px solid transparent;margin-bottom:-1px; }

  /* TICKER */
  .ticker-wrap  { overflow:hidden;flex:1; }
  .ticker-track { display:flex;animation:ticker 50s linear infinite;white-space:nowrap; }
  .ticker-item  { padding:0 32px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--red); }

  /* RADAR */
  .radar-wrap { position:relative;width:120px;height:120px;margin:0 auto; }
  .radar-ring { position:absolute;border-radius:50%;border:1px solid rgba(0,212,255,.18);top:50%;left:50%;transform:translate(-50%,-50%); }
  .radar-sweep { position:absolute;width:50%;height:50%;top:50%;left:50%;transform-origin:bottom left;animation:sweep 3s linear infinite; }
  .radar-sweep::after { content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:conic-gradient(from 0deg,transparent 70%,rgba(0,212,255,.4));border-radius:0 100% 0 0; }
  .radar-dot  { position:absolute;width:7px;height:7px;border-radius:50%;transform:translate(-50%,-50%); }
  .radar-ping { position:absolute;width:15px;height:15px;border-radius:50%;border:1px solid;transform:translate(-50%,-50%);animation:radar-ping 2.2s ease-out infinite; }

  /* BOTTOM BAR */
  .bottom-bar { position:sticky;bottom:0;z-index:200;background:#060606;border-top:1px solid var(--b);padding:0 12px;display:flex;align-items:center;gap:10px;height:32px; }
  .break-label { flex-shrink:0;display:flex;align-items:center;gap:6px;border-right:1px solid var(--b);padding-right:10px; }

  /* ── LIVE TV CHANNELS ── */
  .tv-channels-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:8px; }
  .tv-ch-card { background:var(--card);border:1px solid var(--b);border-radius:2px;overflow:hidden;transition:border-color .2s;text-decoration:none; }
  .tv-ch-card:hover { border-color:var(--cyan); }
  .tv-ch-thumb { position:relative;width:100%;padding-top:52%;background:#111;overflow:hidden; }
  .tv-ch-img { position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:.7; }
  .tv-ch-live { position:absolute;top:6px;left:6px;background:rgba(255,45,45,.9);padding:2px 7px;font-family:'Teko',sans-serif;font-size:11px;letter-spacing:2px;color:white;display:flex;align-items:center;gap:4px; }
  .tv-ch-play { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:36px;height:36px;background:rgba(255,45,45,.8);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .2s; }
  .tv-ch-card:hover .tv-ch-play { background:rgba(255,45,45,1);transform:translate(-50%,-50%) scale(1.1); }
  .tv-ch-info { padding:6px 8px;display:flex;align-items:center;justify-content:space-between; }
  .tv-ch-name { font-family:'Teko',sans-serif;font-size:13px;letter-spacing:1px;color:var(--txt); }
  .tv-ch-cred { font-size:8px;font-family:'Share Tech Mono',monospace;padding:1px 4px;border:1px solid; }

  /* ── LEAFLET MAP (dashboard inline) ── */
  .dash-map-wrap { position:relative;height:320px;background:var(--card); }
  #dash-map { width:100%;height:100%; }
  .leaflet-container { background:#020608 !important; }
  .leaflet-tile { filter:brightness(.55) saturate(.3) hue-rotate(185deg) invert(1) !important; }
  .leaflet-control-zoom a { background:var(--panel) !important;color:var(--cyan) !important;border-color:var(--b) !important;font-size:14px !important; }
  .leaflet-popup-content-wrapper { background:var(--panel) !important;border:1px solid var(--bb) !important;border-radius:2px !important;box-shadow:0 0 20px rgba(0,212,255,.2) !important; }
  .leaflet-popup-tip { background:var(--panel) !important; }
  .leaflet-popup-content { color:var(--txt) !important;font-family:'Rajdhani',sans-serif !important;margin:8px 12px !important;font-size:12px !important; }
  .leaflet-control-attribution { background:rgba(2,6,8,.8) !important;color:var(--t3) !important;font-size:8px !important; }
  .leaflet-attribution-flag { display:none !important; }
  .map-legend-dash { position:absolute;bottom:8px;left:8px;z-index:1000;background:rgba(5,13,18,.92);border:1px solid var(--b);padding:6px 8px;pointer-events:none; }
  .leg-row { display:flex;align-items:center;gap:5px;font-size:9px;color:var(--t2);margin-bottom:3px;font-family:'Share Tech Mono',monospace; }
  .leg-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0; }

  /* OTHER PAGES */
  .page-pad { padding:8px;display:flex;flex-direction:column;gap:8px; }
  .world-table { width:100%;border-collapse:collapse;font-size:11px; }
  .world-table th { padding:6px 10px;text-align:left;font-family:'Teko',sans-serif;font-size:11px;letter-spacing:2px;color:var(--t3);border-bottom:1px solid var(--b);background:var(--card); }
  .world-table td { padding:6px 10px;border-bottom:1px solid var(--b);color:var(--t2); }
  .world-table tr:hover td { background:var(--elev); }
  .geo-card { padding:9px 12px;border-bottom:1px solid var(--b);cursor:pointer;transition:background .15s;animation:fadeIn .4s ease; }
  .geo-card:hover { background:var(--elev); }
  .res-card { background:var(--card);border:1px solid var(--b);padding:10px 12px;border-radius:2px; }
  .res-num  { font-family:'Teko',sans-serif;font-size:32px;font-weight:700;line-height:1; }
  .res-unit { font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--t3);margin-top:1px; }
  .res-bar  { height:5px;background:var(--b);border-radius:3px;overflow:hidden;margin:6px 0 3px; }
  .res-fill { height:100%;border-radius:3px;transition:width 1.2s ease; }
`;

// ─── STATIC DATA ─────────────────────────────────────────────

// TV channels with YouTube links + thumbnail previews
const TV_CHANNELS = [
  { name:"NDTV 24x7",   credibility:82, bias:"Centre",       color:"#ff2d2d", liveUrl:"https://www.youtube.com/watch?v=Js54NRue8-Y", thumb:"https://i.ytimg.com/vi/Js54NRue8-Y/maxresdefault.jpg", desc:"India's top English news" },
  { name:"India Today", credibility:80, bias:"Centre",       color:"#ff6b00", liveUrl:"https://www.youtube.com/watch?v=V4EBi3HDZB0", thumb:"https://i.ytimg.com/vi/V4EBi3HDZB0/maxresdefault.jpg", desc:"Breaking news & analysis" },
  { name:"WION",        credibility:75, bias:"Centre-Right", color:"#00d4ff", liveUrl:"https://www.youtube.com/watch?v=FPgfBB4OzRk", thumb:"https://i.ytimg.com/vi/FPgfBB4OzRk/maxresdefault.jpg", desc:"Global Indian perspective" },
  { name:"DD News",     credibility:70, bias:"Centre",       color:"#00ff88", liveUrl:"https://www.youtube.com/watch?v=6mVHFH7MVYE", thumb:"https://i.ytimg.com/vi/6mVHFH7MVYE/maxresdefault.jpg", desc:"Government broadcaster" },
  { name:"Republic TV", credibility:45, bias:"Right",        color:"#ffe033", liveUrl:"https://www.youtube.com/watch?v=S1KGSmtDnB4", thumb:"https://i.ytimg.com/vi/S1KGSmtDnB4/maxresdefault.jpg", desc:"Breaking news debates" },
  { name:"Mirror Now",  credibility:76, bias:"Centre",       color:"#f0a500", liveUrl:"https://www.youtube.com/watch?v=u-MagxjEcEE", thumb:"https://i.ytimg.com/vi/u-MagxjEcEE/maxresdefault.jpg", desc:"Urban India news" },
];

// Map events
const MAP_EVENTS = [
  { id:1,  lat:34.1,  lng:78.2,  sev:"critical", type:"⚔️", title:"LAC Standoff",           detail:"PLA patrol activity. Indian Army on alert.",          country:"India/China",     india:"DIRECT",   updated:"Live"   },
  { id:2,  lat:33.5,  lng:74.3,  sev:"critical", type:"⚔️", title:"LoC — J&K",              detail:"Ceasefire violations. BSF on high alert.",           country:"India/Pakistan",  india:"DIRECT",   updated:"Live"   },
  { id:3,  lat:24.5,  lng:93.9,  sev:"high",     type:"⚔️", title:"Myanmar Border",         detail:"Junta forces near Indian territory.",                 country:"India/Myanmar",   india:"DIRECT",   updated:"2h ago" },
  { id:4,  lat:49.0,  lng:32.0,  sev:"critical", type:"💥", title:"Russia–Ukraine War",     detail:"Active combat. 800K+ casualties.",                   country:"Ukraine",         india:"Indirect", updated:"Live"   },
  { id:5,  lat:31.5,  lng:34.8,  sev:"critical", type:"💥", title:"Israel–Gaza",            detail:"Active war. 45K+ dead. Regional escalation.",        country:"Israel/Palestine",india:"Oil routes",updated:"Live"   },
  { id:6,  lat:15.5,  lng:32.5,  sev:"high",     type:"💥", title:"Sudan Civil War",        detail:"150K+ dead. Indian nationals evacuated.",            country:"Sudan",           india:"Diaspora", updated:"3h ago" },
  { id:7,  lat:16.8,  lng:43.2,  sev:"high",     type:"⚓", title:"Yemen — Houthi",        detail:"Anti-ship missiles. Indian vessels affected.",       country:"Yemen",           india:"Shipping", updated:"1h ago" },
  { id:8,  lat:31.5,  lng:74.3,  sev:"critical", type:"🔴", title:"Punjab Terror Alert",    detail:"LeT module active. IED components seized.",          country:"India",           india:"DIRECT",   updated:"1h ago" },
  { id:9,  lat:30.2,  lng:67.0,  sev:"high",     type:"☢️", title:"Pak Nuclear Posture",   detail:"Shaheen-III test. Tactical nuke doctrine.",          country:"Pakistan",        india:"CRITICAL", updated:"6h ago" },
  { id:10, lat:35.7,  lng:51.4,  sev:"high",     type:"☢️", title:"Iran Nuclear",          detail:"84% enrichment. IAEA blocked.",                     country:"Iran",            india:"Oil risk", updated:"4h ago" },
  { id:11, lat:12.5,  lng:57.0,  sev:"high",     type:"⚓", title:"Arabian Sea",           detail:"Houthi anti-ship missiles fired.",                  country:"Arabia",          india:"Trade",    updated:"1h ago" },
  { id:12, lat:8.0,   lng:77.5,  sev:"high",     type:"⚓", title:"Indian Ocean Watch",    detail:"Chinese vessels near Andaman. Navy shadowing.",     country:"Indian Ocean",    india:"DIRECT",   updated:"2h ago" },
  { id:13, lat:23.5,  lng:119.0, sev:"high",     type:"🛡️", title:"Taiwan Strait",        detail:"PLA exercises. US carrier deployed.",               country:"China/Taiwan",    india:"Supply",   updated:"3h ago" },
  { id:14, lat:26.0,  lng:50.5,  sev:"high",     type:"🛢️", title:"Strait of Hormuz",     detail:"Iran threatens closure. India buys 40% Gulf oil.", country:"Iran/Gulf",       india:"CRITICAL", updated:"2h ago" },
  { id:15, lat:7.0,   lng:76.0,  sev:"critical", type:"⚡", title:"⚡ Indian Ocean Event", detail:"Naval activity off Sri Lanka. Navy activated.",     country:"Indian Ocean",    india:"DIRECT",   updated:"LIVE"   },
];

const SEV_COLOR = { critical:"#ff2d2d", high:"#ff6b00", medium:"#ffe033", low:"#00ff88" };

const CONFLICTS = [
  { id:1, name:"Russia–Ukraine",   region:"E. Europe",  intensity:"critical", casualties:"800K+", india:"Energy costs",    update:"12m" },
  { id:2, name:"Israel–Gaza",      region:"Mid East",   intensity:"critical", casualties:"45K+",  india:"Oil routes",      update:"6m"  },
  { id:3, name:"Sudan Civil War",  region:"E. Africa",  intensity:"high",     casualties:"150K+", india:"Evacuation",      update:"2h"  },
  { id:4, name:"Myanmar Junta",    region:"SE Asia",    intensity:"high",     casualties:"50K+",  india:"NE border",       update:"1h"  },
  { id:5, name:"Yemen Conflict",   region:"Mid East",   intensity:"high",     casualties:"N/A",   india:"Shipping",        update:"45m" },
  { id:6, name:"Taiwan Strait",    region:"E. Asia",    intensity:"high",     casualties:"N/A",   india:"Supply chain",    update:"3h"  },
];

const BORDER_STATUS = [
  { name:"LAC (China)",      color:"#ff2d2d", level:"HIGH TENSION", detail:"Depsang patrol standoff",    active:true  },
  { name:"LoC (Pakistan)",   color:"#ff6b00", level:"ELEVATED",     detail:"3 violations this week",     active:true  },
  { name:"Myanmar (Manipur)",color:"#ff6b00", level:"ELEVATED",     detail:"Armed group movements",      active:true  },
  { name:"Bangladesh",       color:"#ffe033", level:"WATCH",         detail:"Irregular crossings",        active:false },
  { name:"Nepal",            color:"#00ff88", level:"STABLE",        detail:"Diplomatic talks ongoing",   active:false },
  { name:"Sri Lanka Sea",    color:"#00ff88", level:"STABLE",        detail:"Normal patrolling",          active:false },
];

const BORDER_PROBS = [
  { label:"China (LAC)",        val:72, color:"#ff2d2d" },
  { label:"Pakistan (LoC)",     val:58, color:"#ff6b00" },
  { label:"Myanmar Border",     val:41, color:"#ffe033" },
  { label:"Maritime Threat",    val:34, color:"#ffe033" },
  { label:"Domestic Terror",    val:63, color:"#ff6b00" },
];

const INTEL_FEED = [
  { icon:"⚠️", text:"IB Alert: ISI-linked networks active in Delhi, Mumbai",          level:"critical" },
  { icon:"🔴", text:"Drone near Pathankot AFB — sector sealed, ADS activated",        level:"critical" },
  { icon:"🟡", text:"Encrypted chatter — NE India insurgents coordinating",           level:"high"     },
  { icon:"🟡", text:"INTERPOL: 3 LeT operatives entered India via Nepal",             level:"high"     },
  { icon:"🟢", text:"CISF raises security at 12 nuclear installations",               level:"medium"   },
  { icon:"🟡", text:"RAW intercept: ISI funds to Khalistan disinformation cells",     level:"high"     },
];

const THREAT_SUMMARY = [
  { label:"Conventional War",    level:"LOW",      color:"#00ff88", desc:"No imminent inter-state war"       },
  { label:"Nuclear Risk",        level:"WATCH",    color:"#ffe033", desc:"Pak tactical nuke doctrine active" },
  { label:"Cross-border Terror", level:"HIGH",     color:"#ff6b00", desc:"Multiple active modules"          },
  { label:"Cyber Warfare",       level:"ELEVATED", color:"#ff6b00", desc:"APT41 targeting DRDO/ISRO"        },
  { label:"Economic Warfare",    level:"MEDIUM",   color:"#ffe033", desc:"Supply chain via SCS"             },
];

const SOURCES = [
  { src:"Reuters",        score:96, bias:"C"  },
  { src:"The Hindu",      score:91, bias:"CL" },
  { src:"BBC India",      score:89, bias:"CL" },
  { src:"The Print",      score:84, bias:"C"  },
  { src:"NDTV",           score:82, bias:"C"  },
  { src:"Times of India", score:80, bias:"CR" },
  { src:"ANI",            score:74, bias:"CR" },
  { src:"Republic TV",    score:45, bias:"R"  },
];

const TICKER_ITEMS = [
  "🔴 BREAKING: China PLA live-fire drills in Tibet near Indian border",
  "⚡ Pakistan FM summoned to Indian High Commission over LoC violations",
  "🛡️ INS Vikrant battle group deployed to Indian Ocean",
  "🔴 ALERT: Explosion near Indian consulate Jalalabad — no casualties",
  "📡 ISRO activates RISAT-2B for enhanced border surveillance",
  "⚡ USS Theodore Roosevelt carrier enters Arabian Sea",
  "🟡 Maldives crisis — India monitoring pro-China govt moves",
  "🔴 NIA arrests 4 in Gujarat with RDX — ISI link suspected",
  "⚡ Indian Ocean naval activity reported off Sri Lanka coast",
];

const GEO_NEWS = {
  national: [
    { headline:"CCS meets over LAC standoff — NSA Doval chairs emergency session",              source:"The Hindu",  time:"1h",  cat:"MILITARY"   },
    { headline:"Parliament passes Coastal Security Amendment Bill",                              source:"Livemint",   time:"3h",  cat:"POLICY"     },
    { headline:"India test-fires Agni-V MIRV — DRDO confirms multi-warhead deployment",        source:"The Print",  time:"5h",  cat:"DEFENCE"    },
    { headline:"Home Ministry high alert 5 states ahead of Republic Day — IB input cited",     source:"NDTV",       time:"6h",  cat:"SECURITY"   },
  ],
  local: [
    { headline:"Jammu encounter: 3 militants neutralized in Rajouri",                          source:"ANI",        time:"30m", cat:"TERROR"     },
    { headline:"Manipur: CRPF companies deployed amid fresh violence near border",             source:"NDTV",       time:"2h",  cat:"SECURITY"   },
    { headline:"Punjab: Cross-border drug-arms network busted — drone used for delivery",      source:"TOI",        time:"4h",  cat:"TERROR"     },
    { headline:"BRO completes 3 strategic tunnels near Arunachal border",                      source:"The Hindu",  time:"6h",  cat:"MILITARY"   },
  ],
  international: [
    { headline:"China deploys 3 new Type-055 destroyers in Indian Ocean",                      source:"Reuters",    time:"45m", cat:"MILITARY"   },
    { headline:"Pakistan receives 6 J-10C jets from China — India watches gap",                source:"Reuters",    time:"2h",  cat:"MILITARY"   },
    { headline:"US sanctions Iran — Hormuz tension rises, India oil at risk",                  source:"BBC",        time:"3h",  cat:"ECONOMY"    },
    { headline:"Taliban-Pakistan border clashes intensify — Durand Line dispute",              source:"Reuters",    time:"7h",  cat:"CONFLICT"   },
  ],
};

const RESOURCES = [
  { label:"Crude Oil",     value:12, max:30, unit:"Days import cover", color:"#ff2d2d", icon:"🛢️", status:"CRITICAL", trend:"-2d" },
  { label:"Natural Gas",   value:18, max:30, unit:"Days supply",       color:"#ffe033", icon:"⛽",  status:"WATCH",    trend:"Stable" },
  { label:"Coal Stock",    value:24, max:30, unit:"Days at plants",    color:"#00ff88", icon:"⚫",  status:"ADEQUATE", trend:"+3d" },
  { label:"Food Grain",    value:28, max:30, unit:"Months buffer",     color:"#00ff88", icon:"🌾",  status:"ADEQUATE", trend:"Surplus" },
  { label:"Forex",         value:22, max:30, unit:"Months cover",      color:"#00d4ff", icon:"💰",  status:"STABLE",   trend:"$620B" },
  { label:"Ammunition",    value:20, max:30, unit:"Days combat",       color:"#ff6b00", icon:"🎯",  status:"WATCH",    trend:"Procuring" },
];

const WORLD_RISKS = [
  { country:"🇺🇦 Ukraine",   risk:95, status:"Active War",    trend:"↑" },
  { country:"🇵🇸 Palestine", risk:93, status:"Active War",    trend:"→" },
  { country:"🇮🇱 Israel",    risk:88, status:"Active War",    trend:"→" },
  { country:"🇷🇺 Russia",    risk:85, status:"Active War",    trend:"→" },
  { country:"🇸🇩 Sudan",     risk:82, status:"Civil War",     trend:"↑" },
  { country:"🇾🇪 Yemen",     risk:79, status:"Conflict",      trend:"↓" },
  { country:"🇲🇲 Myanmar",   risk:78, status:"Junta War",     trend:"→" },
  { country:"🇮🇳 India",     risk:67, status:"Elevated",      trend:"→" },
  { country:"🇵🇰 Pakistan",  risk:65, status:"Instability",   trend:"↑" },
  { country:"🇰🇵 N.Korea",   risk:61, status:"Provocative",   trend:"↑" },
  { country:"🇮🇷 Iran",      risk:71, status:"Regional",      trend:"↑" },
  { country:"🇹🇼 Taiwan",    risk:68, status:"High Tension",  trend:"↑" },
  { country:"🇨🇳 China",     risk:48, status:"Assertive",     trend:"↑" },
];

// ─── LEAFLET MAP HOOK ────────────────────────────────────────
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
function IntColor(l) { return { critical:"#ff2d2d", high:"#ff6b00", medium:"#ffe033", low:"#00ff88" }[l] || "#7aacbe"; }

function CredLabel({ score }) {
  const c = score>=85?"#00ff88":score>=65?"#ffe033":"#ff6b00";
  return <span style={{ fontSize:9, fontFamily:"Share Tech Mono", color:c, border:`1px solid ${c}`, padding:"1px 5px", letterSpacing:1 }}>{score>=85?"HIGH":score>=65?"MED":"LOW"} {score}%</span>;
}

function CatTag({ cat }) {
  const m = { MILITARY:"#ff2d2d", THREAT:"#ff6b00", TERROR:"#ff2d2d", GEOPOLITICAL:"#00d4ff", DIPLOMATIC:"#f0a500", ECONOMY:"#ffe033", POLICY:"#00d4ff", DEFENCE:"#ff6b00", SECURITY:"#ff6b00", CONFLICT:"#ff2d2d" };
  const c = m[cat]||"#00d4ff";
  return <span style={{ fontSize:9, fontFamily:"Share Tech Mono", color:c, border:`1px solid ${c}44`, padding:"1px 5px", letterSpacing:1 }}>{cat}</span>;
}

function RiskGauge({ value }) {
  const r=48,cx=56,cy=58,circ=Math.PI*r,offset=circ-(value/100)*circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width="112" height="70" viewBox="0 0 112 74">
        <defs>
          <linearGradient id="arcG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00ff88"/>
            <stop offset="50%" stopColor="#ffe033"/>
            <stop offset="100%" stopColor="#ff2d2d"/>
          </linearGradient>
        </defs>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#0f3040" strokeWidth="9" strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="url(#arcG)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition:"stroke-dashoffset 1.5s ease" }}/>
        <text x={cx} y={cy-4} textAnchor="middle" fill="#ff6b00" fontSize="20" fontFamily="Teko" fontWeight="700">{value}%</text>
        <text x={cx} y={cy+10} textAnchor="middle" fill="#3a6678" fontSize="7" fontFamily="Share Tech Mono" letterSpacing="1">RISK INDEX</text>
      </svg>
    </div>
  );
}

function Radar() {
  const dots=[{x:"56%",y:"28%",c:"#ff2d2d",d:"0s"},{x:"36%",y:"44%",c:"#ff6b00",d:".6s"},{x:"72%",y:"66%",c:"#ffe033",d:"1.2s"},{x:"58%",y:"80%",c:"#00ff88",d:"1.8s"}];
  return (
    <div className="radar-wrap">
      {[112,82,52,22].map(s=><div key={s} className="radar-ring" style={{width:s,height:s,marginLeft:-s/2,marginTop:-s/2}}/>)}
      <div className="radar-sweep"/>
      {dots.map(d=>(
        <div key={d.d}>
          <div className="radar-dot" style={{left:d.x,top:d.y,background:d.c,boxShadow:`0 0 6px ${d.c}`}}/>
          <div className="radar-ping" style={{left:d.x,top:d.y,borderColor:d.c,animationDelay:d.d}}/>
        </div>
      ))}
      <div style={{position:"absolute",top:"50%",left:"50%",width:5,height:5,borderRadius:"50%",background:"var(--cyan)",transform:"translate(-50%,-50%)",boxShadow:"0 0 8px var(--cyan)"}}/>
    </div>
  );
}

// ─── DASHBOARD LEAFLET MAP COMPONENT ────────────────────────
function DashMap() {
  const mapRef = useRef(null);
  const leafRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const L = await loadLeaflet();
      if (!mounted || !mapRef.current || leafRef.current) return;

      const map = L.map(mapRef.current, { center:[20,60], zoom:3, zoomControl:true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:"© OpenStreetMap | OSINT", maxZoom:10
      }).addTo(map);
      leafRef.current = map;

      // Trade routes
      const routes = [
        [[19,72.8],[24,58],[26,56.5]],
        [[13,80.3],[6,93],[1.3,103.8]],
        [[15,54],[12.5,44],[12.8,43.1],[29,32.5]],
      ];
      routes.forEach(pts => L.polyline(pts,{color:"#00d4ff",weight:1.2,opacity:.3,dashArray:"5,8"}).addTo(map));

      // Event markers
      MAP_EVENTS.forEach(ev => {
        const c = SEV_COLOR[ev.sev]||"#7aacbe";
        const sz = ev.sev==="critical"?14:ev.sev==="high"?10:7;
        const icon = L.divIcon({
          className:"",
          html:`<div style="position:relative;width:${sz*3}px;height:${sz*3}px">
            <div style="position:absolute;top:50%;left:50%;width:${sz*2}px;height:${sz*2}px;border-radius:50%;border:2px solid ${c};transform:translate(-50%,-50%);animation:ping 2s ease-out infinite;opacity:0"></div>
            <div style="position:absolute;top:50%;left:50%;width:${sz}px;height:${sz}px;border-radius:50%;background:${c};transform:translate(-50%,-50%);box-shadow:0 0 ${sz}px ${c};animation:${ev.sev==="critical"?"pcrit":"phigh"} 2s infinite"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-160%);font-size:${sz}px">${ev.type}</div>
          </div>`,
          iconSize:[sz*3,sz*3], iconAnchor:[sz*1.5,sz*1.5],
        });
        L.marker([ev.lat,ev.lng],{icon})
          .bindPopup(`<div style="min-width:200px"><b style="font-family:Teko;font-size:15px;color:#e8f4f8">${ev.type} ${ev.title}</b><br/><span style="font-size:11px;color:#7aacbe">${ev.detail}</span><br/><span style="font-size:10px;color:#3a6678;font-family:Share Tech Mono">🇮🇳 ${ev.india} · ${ev.updated}</span></div>`,{maxWidth:260})
          .addTo(map);
      });
    }
    init();
    return () => {
      mounted = false;
      if (leafRef.current) { leafRef.current.remove(); leafRef.current=null; }
    };
  }, []);

  return (
    <div className="dash-map-wrap">
      <style>{`@keyframes ping{0%{transform:translate(-50%,-50%) scale(0);opacity:.8}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}@keyframes pcrit{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 12px #ff2d2d}50%{transform:translate(-50%,-50%) scale(1.4)}}@keyframes phigh{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.25)}}`}</style>
      <div id="dash-map" ref={mapRef} style={{width:"100%",height:"100%",minHeight:320}}/>
      <div className="map-legend-dash">
        {Object.entries(SEV_COLOR).map(([s,c])=>(
          <div key={s} className="leg-row"><div className="leg-dot" style={{background:c}}/>{s.toUpperCase()}</div>
        ))}
        <div className="leg-row"><span style={{color:"#00d4ff",marginRight:3}}>---</span>Trade Routes</div>
      </div>
    </div>
  );
}

// ─── TV CHANNELS PANEL — uses dedicated TVPanel component ────
function TVChannelsPanel() { return <TVPanel/>; }

// ─── DASHBOARD PAGE ──────────────────────────────────────────
function PageDashboard({ news, loading, refetch }) {
  const [tab, setTab] = useState("news");
  return (
    <div className="dash-grid">

      {/* COL 1 — Risk + Radar + Stats + Borders */}
      <div className="col">
        <div className="panel">
          <div className="ph"><span className="ph-icon">◈</span> CONFLICT RISK</div>
          <div style={{padding:"8px 10px"}}>
            <RiskGauge value={67}/>
            <div style={{textAlign:"center",marginBottom:8}}><span className="tbadge tb-high">⚡ ELEVATED</span></div>
            {BORDER_PROBS.map(p=>(
              <div key={p.label} className="prob-wrap">
                <div className="prob-label"><span style={{fontSize:10}}>{p.label}</span><span style={{color:p.color}}>{p.val}%</span></div>
                <div className="prob-bar"><div className="prob-fill" style={{width:`${p.val}%`,background:p.color}}/></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">◉</span> BORDER RADAR</div>
          <div style={{padding:"8px 0 4px"}}><Radar/></div>
        </div>
        <div className="stat-grid">
          {[["6","#ff2d2d","Wars"],["3","#ff6b00","Borders"],["4","#ffe033","Intels"]].map(([n,c,l])=>(
            <div key={l} className="stat-box"><div className="stat-num" style={{color:c}}>{n}</div><div className="stat-lbl">{l}</div></div>
          ))}
        </div>
        <div className="panel" style={{flex:1}}>
          <div className="ph"><span className="ph-icon">▣</span> BORDER STATUS</div>
          {BORDER_STATUS.map(b=>(
            <div key={b.name} className="bstatus" style={{borderColor:b.color}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"#c8dde6"}}>{b.name}</div>
                <div style={{fontSize:9,color:"#3a6678"}}>{b.detail}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div className="teko" style={{fontSize:10,color:b.color,letterSpacing:1}}>{b.level}</div>
                {b.active&&<div className="live-dot" style={{width:4,height:4,marginLeft:"auto",marginTop:2}}/>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COL 2 — LIVE MAP + NEWS FEED */}
      <div className="col">
        {/* LIVE MAP ON DASHBOARD */}
        <div className="panel">
          <div className="ph">
            <span className="ph-icon">🌍</span> LIVE GEOPOLITICAL MAP
            <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
              <div className="live-dot" style={{width:5,height:5}}/>
              <span className="mono" style={{fontSize:9,color:"#3a6678"}}>{MAP_EVENTS.length} EVENTS · CLICK MARKERS</span>
            </span>
          </div>
          <DashMap/>
        </div>

        {/* NEWS + INTEL TABS */}
        <div className="panel" style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",borderBottom:"1px solid var(--b)"}}>
            {[["news","📰 Live News"],["intel","⚡ Intel"]].map(([t,l])=>(
              <button key={t} className="tab-btn" onClick={()=>setTab(t)}
                style={{color:tab===t?"var(--cyan)":"var(--t3)",borderBottomColor:tab===t?"var(--cyan)":"transparent"}}>
                {l}
              </button>
            ))}
            <div style={{marginLeft:"auto",padding:"0 10px",display:"flex",alignItems:"center",gap:6}}>
              {loading&&<span className="mono" style={{fontSize:9,color:"#ffe033"}}>FETCHING...</span>}
              {!loading&&<div className="live-dot" style={{width:5,height:5}}/>}
              <button onClick={refetch} style={{background:"none",border:"none",color:"var(--cyan)",cursor:"pointer",fontSize:11,fontFamily:"Teko",letterSpacing:1}}>↺</button>
            </div>
          </div>
          <div className="scroll" style={{flex:1,maxHeight:360}}>
            {tab==="news"
              ? news.length===0
                ? <div style={{padding:16,textAlign:"center",color:"#3a6678",fontSize:11,fontFamily:"Share Tech Mono"}}>Loading news...</div>
                : news.map((item,i)=>(
                  <div key={item.id??i} className="news-card" onClick={()=>item.url&&item.url!=="#"&&window.open(item.url,"_blank")}>
                    <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                      <CatTag cat={item.category}/>
                      <CredLabel score={item.credibility}/>
                      <span className="mono" style={{fontSize:9,color:"#3a6678",marginLeft:"auto"}}>{item.time}</span>
                    </div>
                    <div style={{fontSize:12,lineHeight:1.4,color:"#c8dde6",marginBottom:4,fontWeight:500}}>{item.headline}</div>
                    <div style={{fontSize:10,color:"#3a6678"}}>{item.source}<span style={{color:"#1a5068"}}> · {item.bias}</span></div>
                    <div className="cred-bar"><div className="cred-fill" style={{width:`${item.credibility}%`,background:item.credibility>=85?"#00ff88":item.credibility>=65?"#ffe033":"#ff6b00"}}/></div>
                  </div>
                ))
              : INTEL_FEED.map((item,i)=>(
                <div key={i} className="intel-item">
                  <div style={{fontSize:14,flexShrink:0}}>{item.icon}</div>
                  <div>
                    <div style={{fontSize:11,color:"#c8dde6",lineHeight:1.4}}>{item.text}</div>
                    <div className="mono" style={{fontSize:9,color:"#3a6678",marginTop:3}}>IB/RAW/NIA · {["2m","8m","14m","31m","1h","2h"][i]} ago</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* COL 3 — TV CHANNELS + CONFLICTS */}
      <div className="col">
        {/* TV CHANNELS — hyperlinked */}
        <TVChannelsPanel/>

        {/* Active conflicts */}
        <div className="panel" style={{flex:1}}>
          <div className="ph"><span className="ph-icon">◈</span> ACTIVE CONFLICTS</div>
          <div className="scroll" style={{maxHeight:280}}>
            {CONFLICTS.map(c=>(
              <div key={c.id} className="conf-row">
                <div style={{width:7,height:7,borderRadius:"50%",background:IntColor(c.intensity),flexShrink:0,boxShadow:`0 0 5px ${IntColor(c.intensity)}`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#c8dde6",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                  <div style={{fontSize:10,color:"#3a6678"}}>{c.region} · {c.update} ago</div>
                  <div style={{fontSize:10,color:"#7aacbe"}}>🇮🇳 {c.india}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div className="teko" style={{fontSize:10,color:IntColor(c.intensity),letterSpacing:1}}>{c.intensity.toUpperCase()}</div>
                  <div style={{fontSize:9,color:"#3a6678"}}>{c.casualties}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COL 4 — Sources + Threats */}
      <div className="col">
        <div className="panel">
          <div className="ph"><span className="ph-icon">◉</span> SOURCE CREDIBILITY</div>
          <div style={{padding:"8px 10px"}}>
            {SOURCES.map(s=>(
              <div key={s.src} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <div style={{width:68,fontSize:10,color:"#7aacbe",flexShrink:0}}>{s.src}</div>
                <div className="prob-bar" style={{flex:1,height:4}}>
                  <div className="prob-fill" style={{width:`${s.score}%`,background:s.score>=85?"#00ff88":s.score>=65?"#ffe033":"#ff6b00"}}/>
                </div>
                <div className="mono" style={{fontSize:9,color:"#3a6678",width:20}}>{s.score}</div>
                <div className="mono" style={{fontSize:8,color:"#1a5068",width:16}}>{s.bias}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">▲</span> THREAT SUMMARY</div>
          <div style={{padding:"6px 10px"}}>
            {THREAT_SUMMARY.map(t=>(
              <div key={t.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--b)",gap:6}}>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"#c8dde6"}}>{t.label}</div>
                  <div style={{fontSize:9,color:"#3a6678"}}>{t.desc}</div>
                </div>
                <span style={{fontSize:9,color:t.color,border:`1px solid ${t.color}44`,padding:"2px 6px",fontFamily:"Teko",letterSpacing:1,flexShrink:0}}>{t.level}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel" style={{flex:1}}>
          <div className="ph"><span className="ph-icon">◈</span> DATA SOURCES</div>
          <div style={{padding:"6px 10px",display:"flex",flexWrap:"wrap",gap:3}}>
            {["ACLED","GDELT","SATP","RSS Feeds","OpenStreetMap","Leaflet.js","NASA FIRMS","ReliefWeb"].map(s=>(
              <span key={s} className="tag t-cyan">{s}</span>
            ))}
          </div>
          <div style={{padding:"2px 10px 8px",fontSize:9,color:"#1a5068",fontFamily:"Share Tech Mono"}}>ALL OPEN-SOURCE · OSINT ONLY</div>
        </div>
      </div>
    </div>
  );
}

// ─── GEO NEWS PAGE ───────────────────────────────────────────
function PageGeoNews() {
  const [tab, setTab] = useState("national");
  return (
    <div className="page-pad">
      <div className="panel">
        <div style={{display:"flex",borderBottom:"1px solid var(--b)"}}>
          {[["national","🇮🇳 National"],["local","📍 Local"],["international","🌍 International"]].map(([t,l])=>(
            <button key={t} className="tab-btn" onClick={()=>setTab(t)}
              style={{color:tab===t?"var(--cyan)":"var(--t3)",borderBottomColor:tab===t?"var(--cyan)":"transparent"}}>
              {l}
            </button>
          ))}
        </div>
        <div className="scroll" style={{maxHeight:"calc(100vh - 180px)"}}>
          {(GEO_NEWS[tab]||[]).map((item,i)=>(
            <div key={i} className="geo-card">
              <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                <CatTag cat={item.cat}/>
                <span className="mono" style={{fontSize:9,color:"#3a6678",marginLeft:"auto"}}>{item.time} ago · {item.source}</span>
              </div>
              <div style={{fontSize:13,lineHeight:1.4,color:"#c8dde6",fontWeight:600}}>{item.headline}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RESOURCES PAGE ──────────────────────────────────────────
function PageResources() {
  return (
    <div className="page-pad">
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
        {RESOURCES.map((r,i)=>{
          const pct=(r.value/r.max)*100;
          const c=pct>70?"#00ff88":pct>40?"#ffe033":"#ff2d2d";
          return (
            <div key={i} className="res-card">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:20}}>{r.icon}</span>
                <span style={{fontSize:9,color:c,border:`1px solid ${c}44`,padding:"2px 6px",fontFamily:"Teko",letterSpacing:1}}>{r.status}</span>
              </div>
              <div className="teko" style={{fontSize:13,letterSpacing:1,color:"#7aacbe"}}>{r.label}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:5,margin:"3px 0"}}>
                <span className="res-num" style={{color:c}}>{r.value}</span>
                <span className="res-unit">{r.unit}</span>
              </div>
              <div className="res-bar"><div className="res-fill" style={{width:`${pct}%`,background:c}}/></div>
              <div className="mono" style={{fontSize:9,color:r.trend.startsWith("-")?"#ff2d2d":r.trend.startsWith("+")?"#00ff88":"#7aacbe"}}>{r.trend}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WORLD MAP PAGE ──────────────────────────────────────────
function PageWorldMap() {
  const mapRef = useRef(null);
  const leafRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const L = await loadLeaflet();
      if (!mounted || !mapRef.current || leafRef.current) return;
      const map = L.map(mapRef.current, { center:[20,60], zoom:3 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"© OpenStreetMap", maxZoom:10 }).addTo(map);
      leafRef.current = map;
      const routes=[[[19,72.8],[24,58],[26,56.5]],[[13,80.3],[6,93],[1.3,103.8]],[[15,54],[12.5,44],[12.8,43.1],[29,32.5]]];
      routes.forEach(pts=>L.polyline(pts,{color:"#00d4ff",weight:1.2,opacity:.3,dashArray:"5,8"}).addTo(map));
      MAP_EVENTS.forEach(ev=>{
        const c=SEV_COLOR[ev.sev]||"#7aacbe";
        const sz=ev.sev==="critical"?14:ev.sev==="high"?10:7;
        const icon=L.divIcon({className:"",html:`<div style="position:relative;width:${sz*3}px;height:${sz*3}px"><div style="position:absolute;top:50%;left:50%;width:${sz*2}px;height:${sz*2}px;border-radius:50%;border:2px solid ${c};transform:translate(-50%,-50%);animation:ping 2s ease-out infinite;opacity:0"></div><div style="position:absolute;top:50%;left:50%;width:${sz}px;height:${sz}px;border-radius:50%;background:${c};transform:translate(-50%,-50%);box-shadow:0 0 ${sz}px ${c};animation:${ev.sev==="critical"?"pcrit":"phigh"} 2s infinite"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-160%);font-size:${sz}px">${ev.type}</div></div>`,iconSize:[sz*3,sz*3],iconAnchor:[sz*1.5,sz*1.5]});
        L.marker([ev.lat,ev.lng],{icon}).bindPopup(`<div style="min-width:200px"><b style="font-family:Teko;font-size:15px;color:#e8f4f8">${ev.type} ${ev.title}</b><br/><span style="font-size:11px;color:#7aacbe">${ev.detail}</span><br/><span style="font-size:10px;color:#3a6678;font-family:Share Tech Mono">🇮🇳 ${ev.india} · ${ev.updated}</span></div>`,{maxWidth:260}).addTo(map)
          .on("click",()=>setSelected(ev));
      });
    }
    init();
    return ()=>{ mounted=false; if(leafRef.current){leafRef.current.remove();leafRef.current=null;} };
  }, []);

  return (
    <div style={{padding:8,display:"grid",gridTemplateColumns:"1fr 280px",gap:8,minHeight:"calc(100vh - 130px)"}}>
      <div className="panel" style={{display:"flex",flexDirection:"column"}}>
        <div className="ph"><span className="ph-icon">🌍</span> LIVE WORLD CONFLICT MAP — {MAP_EVENTS.length} ACTIVE EVENTS</div>
        <div ref={mapRef} style={{flex:1,minHeight:500}}/>
        <div className="map-legend-dash">
          {Object.entries(SEV_COLOR).map(([s,c])=>(
            <div key={s} className="leg-row"><div className="leg-dot" style={{background:c}}/>{s.toUpperCase()}</div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {selected&&(
          <div className="panel" style={{animation:"fadeIn .3s ease"}}>
            <div className="ph"><span style={{color:SEV_COLOR[selected.sev]}}>{selected.type}</span> EVENT DETAIL</div>
            <div style={{padding:"10px 12px"}}>
              <div className="teko" style={{fontSize:16,color:"#e8f4f8",marginBottom:4}}>{selected.title}</div>
              <div style={{fontSize:11,color:"#7aacbe",lineHeight:1.5,marginBottom:6}}>{selected.detail}</div>
              <div className="mono" style={{fontSize:10,color:"#3a6678"}}>🇮🇳 {selected.india}</div>
              <div className="mono" style={{fontSize:10,color:"#3a6678"}}>{selected.country} · {selected.updated}</div>
            </div>
          </div>
        )}
        <div className="panel" style={{flex:1}}>
          <div className="ph"><span className="ph-icon">◈</span> ALL EVENTS</div>
          <div className="scroll" style={{maxHeight:"calc(100vh - 250px)"}}>
            {[...MAP_EVENTS].sort((a,b)=>Object.keys(SEV_COLOR).indexOf(a.sev)-Object.keys(SEV_COLOR).indexOf(b.sev)).map(ev=>(
              <div key={ev.id} className="conf-row" style={{borderLeft:`3px solid ${SEV_COLOR[ev.sev]}`}}
                onClick={()=>{ setSelected(ev); if(leafRef.current)leafRef.current.flyTo([ev.lat,ev.lng],5,{duration:1.5}); }}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#c8dde6"}}>{ev.type} {ev.title}</div>
                  <div style={{fontSize:10,color:"#3a6678"}}>{ev.country} · {ev.updated}</div>
                  <div style={{fontSize:10,color:"#7aacbe"}}>🇮🇳 {ev.india}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">🌍</span> COUNTRY RISKS</div>
          <div className="scroll" style={{maxHeight:250}}>
            {WORLD_RISKS.sort((a,b)=>b.risk-a.risk).map((w,i)=>{
              const c=w.risk>=80?"#ff2d2d":w.risk>=60?"#ff6b00":w.risk>=40?"#ffe033":"#00ff88";
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderBottom:"1px solid var(--b)"}}>
                  <div style={{fontSize:12,color:"#c8dde6",flex:1}}>{w.country}</div>
                  <div className="prob-bar" style={{width:60,height:4}}><div className="prob-fill" style={{width:`${w.risk}%`,background:c}}/></div>
                  <div className="teko" style={{fontSize:14,color:c,width:36}}>{w.risk}%</div>
                  <div className="teko" style={{fontSize:14,color:w.trend==="↑"?"#ff2d2d":w.trend==="↓"?"#00ff88":"#ffe033"}}>{w.trend}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [time, setTime] = useState(new Date());
  const [page, setPage] = useState("dashboard");
  const { news, loading, error, refetch } = useNews();

  useEffect(() => {
    const t = setInterval(()=>setTime(new Date()),1000);
    return ()=>clearInterval(t);
  }, []);

  const timeFmt = d => d.toLocaleTimeString("en-IN",{hour12:false})+" IST";
  const dateFmt = d => d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

  const pages = [
    ["dashboard","⬛ Dashboard"],
    ["geonews",  "🗞️ Geo News"],
    ["resources","🛢️ Resources"],
    ["worldmap", "🌍 Full Map"],
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="scanline"/>
      <div className="topbar">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:18,background:"linear-gradient(180deg,#FF9933 33%,white 33%,white 66%,#138808 66%)",borderRadius:1,flexShrink:0,border:"1px solid #333"}}/>
          <div>
            <div className="teko" style={{fontSize:16,fontWeight:700,letterSpacing:2,lineHeight:1,color:"#e8f4f8"}}>INDIA GEOPOLITICAL WAR DESK</div>
            <div className="mono" style={{fontSize:8,letterSpacing:2,color:"#3a6678"}}>OPEN-SOURCE INTELLIGENCE MONITOR · OSINT</div>
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={refetch} style={{background:"rgba(0,212,255,.08)",border:"1px solid rgba(0,212,255,.2)",color:"var(--cyan)",fontFamily:"Teko",fontSize:11,letterSpacing:2,padding:"3px 10px",cursor:"pointer",borderRadius:1}}>↺ REFRESH</button>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div className="live-dot"/>
            <span className="mono" style={{fontSize:10,color:"#ff2d2d",letterSpacing:1}}>LIVE</span>
          </div>
          <div style={{textAlign:"right"}}>
            <div className="mono" style={{fontSize:13,color:"var(--cyan)",letterSpacing:1}}>{timeFmt(time)}</div>
            <div className="mono" style={{fontSize:8,color:"#3a6678"}}>{dateFmt(time)}</div>
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
      {page==="geonews"   && <PageGeoNews/>}
      {page==="resources" && <PageResources/>}
      {page==="worldmap"  && <PageWorldMap/>}
      <div className="bottom-bar">
        <div className="break-label">
          <div className="live-dot"/>
          <span className="teko" style={{fontSize:12,letterSpacing:2,color:"#ff2d2d"}}>BREAKING</span>
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>(
              <span key={i} className="ticker-item">{item}<span style={{color:"#f0a500",margin:"0 8px"}}>///</span></span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

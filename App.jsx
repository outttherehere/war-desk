import { useState, useEffect, useRef } from "react";
import { useNews } from "./useNews";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Teko:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:    #020608; --panel: #050d12; --card: #071419; --elev: #0a1e25;
    --b:     #0f3040; --bb:   #1a5068;
    --cyan:  #00d4ff; --gold: #f0a500; --red:  #ff2d2d;
    --org:   #ff6b00; --grn:  #00ff88; --yel:  #ffe033;
    --txt:   #e8f4f8; --t2:   #7aacbe; --t3:   #3a6678;
    --saf:   #FF9933; --ig:   #138808;
  }
  body { background:var(--bg); font-family:'Rajdhani',sans-serif; color:var(--txt); overflow-x:hidden; }
  .scanline { position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9999;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px); }

  @keyframes pulse-red  { 0%,100%{opacity:1;box-shadow:0 0 8px var(--red)} 50%{opacity:.4;box-shadow:0 0 20px var(--red)} }
  @keyframes ticker     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes fadeIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sweep      { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes radar-ping { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(1);opacity:0} }
  @keyframes slide-in   { from{transform:translateX(-8px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes glow       { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes countup    { from{opacity:0} to{opacity:1} }

  .live-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--red); animation:pulse-red 1.2s infinite; flex-shrink:0; }
  .mono  { font-family:'Share Tech Mono',monospace; }
  .teko  { font-family:'Teko',sans-serif; }

  .panel { background:var(--panel); border:1px solid var(--b); border-radius:2px; position:relative; overflow:hidden; }
  .panel::before { content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,var(--cyan),transparent); opacity:.35; }
  .ph { padding:8px 12px; border-bottom:1px solid var(--b); background:linear-gradient(90deg,var(--elev),transparent);
    display:flex; align-items:center; gap:8px; font-family:'Teko',sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:var(--t2); }
  .ph-icon { color:var(--cyan); font-size:10px; }

  .scroll { overflow-y:auto; scrollbar-width:thin; scrollbar-color:var(--bb) transparent; }

  .topbar { background:var(--panel); border-bottom:1px solid var(--b); padding:0 14px; display:flex; align-items:center; gap:12px; height:46px; position:sticky; top:0; z-index:200; }
  .flag-stripe { height:3px; background:linear-gradient(90deg,var(--saf) 33.3%,white 33.3%,white 66.6%,var(--ig) 66.6%); }

  /* NAV TABS */
  .nav-tabs { display:flex; background:var(--panel); border-bottom:1px solid var(--b); padding:0 14px; gap:4px; position:sticky; top:46px; z-index:199; }
  .nav-tab { padding:8px 16px; background:none; border:none; cursor:pointer; font-family:'Teko',sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:var(--t3); border-bottom:2px solid transparent; margin-bottom:-1px; transition:color .2s; white-space:nowrap; }
  .nav-tab.active { color:var(--cyan); border-bottom-color:var(--cyan); }
  .nav-tab:hover { color:var(--t2); }

  /* PAGE */
  .page { display:none; }
  .page.active { display:block; }

  /* GRID */
  .grid3 { display:grid; grid-template-columns:255px 1fr 275px; gap:5px; padding:5px; min-height:calc(100vh - 110px); }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:5px; padding:5px; }
  .grid4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:5px; padding:5px; }
  .col   { display:flex; flex-direction:column; gap:5px; }
  @media(max-width:1100px){ .grid3{ grid-template-columns:1fr 1fr; } .grid4{ grid-template-columns:1fr 1fr; } }
  @media(max-width:700px){  .grid3,.grid2,.grid4{ grid-template-columns:1fr; } }

  /* STATS */
  .stat-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; }
  .stat-box  { text-align:center; padding:8px 4px; border:1px solid var(--b); background:var(--card); }
  .stat-num  { font-family:'Teko',sans-serif; font-size:28px; font-weight:700; line-height:1; }
  .stat-lbl  { font-size:9px; letter-spacing:1.5px; color:var(--t3); text-transform:uppercase; margin-top:2px; }

  /* BARS */
  .prob-wrap  { margin:5px 0; }
  .prob-label { display:flex; justify-content:space-between; font-size:11px; color:var(--t2); margin-bottom:3px; font-family:'Share Tech Mono',monospace; }
  .prob-bar   { height:5px; background:var(--b); border-radius:1px; overflow:hidden; }
  .prob-fill  { height:100%; border-radius:1px; transition:width 1.2s ease; }

  /* BORDER STATUS */
  .bstatus { padding:7px 10px; border-left:3px solid; margin-bottom:1px; font-size:12px; display:flex; align-items:center; justify-content:space-between; gap:8px; }

  /* NEWS */
  .news-card { padding:10px 12px; border-bottom:1px solid var(--b); animation:fadeIn .4s ease; cursor:pointer; transition:background .15s; }
  .news-card:hover { background:var(--elev); }
  .cred-bar  { height:3px; border-radius:2px; background:var(--b); overflow:hidden; margin-top:6px; }
  .cred-fill { height:100%; border-radius:2px; transition:width .5s; }

  /* CONFLICT ROW */
  .conf-row { display:flex; align-items:center; gap:10px; padding:8px 12px; border-bottom:1px solid var(--b); animation:slide-in .3s ease; cursor:pointer; transition:background .15s; }
  .conf-row:hover { background:var(--elev); }

  /* INTEL */
  .intel-item { padding:8px 12px; border-bottom:1px solid var(--b); font-size:12px; display:flex; gap:8px; align-items:flex-start; }

  /* TAGS */
  .tag { display:inline-block; padding:1px 5px; font-size:9px; letter-spacing:1px; border-radius:1px; font-family:'Teko',sans-serif; font-weight:600; text-transform:uppercase; margin-right:3px; }
  .t-red   { background:rgba(255,45,45,.15);   color:var(--red);  border:1px solid rgba(255,45,45,.3); }
  .t-cyan  { background:rgba(0,212,255,.12);   color:var(--cyan); border:1px solid rgba(0,212,255,.25); }
  .t-gold  { background:rgba(240,165,0,.15);   color:var(--gold); border:1px solid rgba(240,165,0,.3); }
  .t-grn   { background:rgba(0,255,136,.12);   color:var(--grn);  border:1px solid rgba(0,255,136,.25); }
  .t-org   { background:rgba(255,107,0,.15);   color:var(--org);  border:1px solid rgba(255,107,0,.3); }
  .t-yel   { background:rgba(255,224,51,.12);  color:var(--yel);  border:1px solid rgba(255,224,51,.25); }

  /* BADGES */
  .tbadge { display:inline-flex; align-items:center; gap:4px; padding:2px 10px; border-radius:1px; font-size:10px; letter-spacing:1.5px; font-family:'Teko',sans-serif; font-weight:600; text-transform:uppercase; }
  .tb-crit { background:rgba(255,45,45,.12);  border:1px solid var(--red); color:var(--red); }
  .tb-high { background:rgba(255,107,0,.12);  border:1px solid var(--org); color:var(--org); }
  .tb-med  { background:rgba(255,224,51,.12); border:1px solid var(--yel); color:var(--yel); }
  .tb-low  { background:rgba(0,255,136,.12);  border:1px solid var(--grn); color:var(--grn); }

  /* TAB BUTTONS (inner) */
  .tab-btn { padding:8px 14px; background:none; border:none; cursor:pointer; font-family:'Teko',sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; transition:color .2s; border-bottom:2px solid transparent; margin-bottom:-1px; }

  /* TICKER */
  .ticker-wrap  { overflow:hidden; flex:1; }
  .ticker-track { display:flex; animation:ticker 50s linear infinite; white-space:nowrap; }
  .ticker-item  { padding:0 36px; font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--red); }

  /* RADAR */
  .radar-wrap { position:relative; width:128px; height:128px; margin:0 auto; }
  .radar-ring { position:absolute; border-radius:50%; border:1px solid rgba(0,212,255,.18); top:50%; left:50%; transform:translate(-50%,-50%); }
  .radar-sweep { position:absolute; width:50%; height:50%; top:50%; left:50%; transform-origin:bottom left; animation:sweep 3s linear infinite; }
  .radar-sweep::after { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:conic-gradient(from 0deg,transparent 70%,rgba(0,212,255,.4)); border-radius:0 100% 0 0; }
  .radar-dot  { position:absolute; width:7px;  height:7px;  border-radius:50%; transform:translate(-50%,-50%); }
  .radar-ping { position:absolute; width:16px; height:16px; border-radius:50%; border:1px solid; transform:translate(-50%,-50%); animation:radar-ping 2.2s ease-out infinite; }

  /* BOTTOM BAR */
  .bottom-bar { position:sticky; bottom:0; z-index:200; background:#060606; border-top:1px solid var(--b); padding:0 12px; display:flex; align-items:center; gap:10px; height:32px; }
  .break-label { flex-shrink:0; display:flex; align-items:center; gap:6px; border-right:1px solid var(--b); padding-right:10px; }

  /* VIDEO GRID */
  .video-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:10px; }
  .video-card { background:var(--card); border:1px solid var(--b); border-radius:2px; overflow:hidden; cursor:pointer; transition:border-color .2s; }
  .video-card:hover { border-color:var(--cyan); }
  .video-thumb { position:relative; width:100%; padding-top:56.25%; background:#000; overflow:hidden; }
  .video-thumb iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:none; }
  .video-thumb .play-overlay { position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.4); transition:opacity .2s; }
  .video-card:hover .play-overlay { opacity:0; }
  .video-meta { padding:8px; }

  /* RESOURCE CARD */
  .res-card { background:var(--card); border:1px solid var(--b); padding:12px; border-radius:2px; position:relative; overflow:hidden; }
  .res-card::after { content:''; position:absolute; bottom:0; left:0; height:2px; background:var(--fill-color,var(--cyan)); transition:width 1s ease; }
  .res-num  { font-family:'Teko',sans-serif; font-size:36px; font-weight:700; line-height:1; }
  .res-unit { font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--t3); margin-top:2px; }
  .res-bar  { height:6px; background:var(--b); border-radius:3px; overflow:hidden; margin:8px 0 4px; }
  .res-fill { height:100%; border-radius:3px; transition:width 1.2s ease; }
  .res-label { font-family:'Teko',sans-serif; font-size:14px; letter-spacing:1px; color:var(--t2); }
  .res-trend { font-size:10px; font-family:'Share Tech Mono',monospace; }

  /* WORLD CONFLICT TABLE */
  .world-table { width:100%; border-collapse:collapse; font-size:11px; }
  .world-table th { padding:6px 10px; text-align:left; font-family:'Teko',sans-serif; font-size:11px; letter-spacing:2px; color:var(--t3); border-bottom:1px solid var(--b); background:var(--card); }
  .world-table td { padding:7px 10px; border-bottom:1px solid var(--b); color:var(--t2); }
  .world-table tr:hover td { background:var(--elev); }

  /* GEO NEWS */
  .geo-card { padding:10px 12px; border-bottom:1px solid var(--b); cursor:pointer; transition:background .15s; animation:fadeIn .4s ease; }
  .geo-card:hover { background:var(--elev); }

  /* INFOGRAPHIC */
  .info-box { background:var(--card); border:1px solid var(--b); padding:10px 12px; border-radius:2px; }
  .info-title { font-family:'Teko',sans-serif; font-size:12px; letter-spacing:2px; color:var(--t3); text-transform:uppercase; margin-bottom:6px; }
`;

// ─── DATA ────────────────────────────────────────────────────

const CONFLICTS = [
  { id:1, name:"Russia–Ukraine",      region:"E. Europe",  intensity:"critical", casualties:"800K+", india:"Energy & wheat costs",      risk:82, update:"12m" },
  { id:2, name:"Israel–Gaza",         region:"Mid East",   intensity:"critical", casualties:"45K+",  india:"Oil routes, diaspora",       risk:78, update:"6m"  },
  { id:3, name:"Sudan Civil War",     region:"E. Africa",  intensity:"high",     casualties:"150K+", india:"Evacuation ongoing",         risk:45, update:"2h"  },
  { id:4, name:"Myanmar Junta",       region:"SE Asia",    intensity:"high",     casualties:"50K+",  india:"NE border spillover",        risk:61, update:"1h"  },
  { id:5, name:"Ethiopia–Tigray",     region:"E. Africa",  intensity:"medium",   casualties:"600K+", india:"Low — monitoring",           risk:22, update:"5h"  },
  { id:6, name:"Sahel Instability",   region:"W. Africa",  intensity:"medium",   casualties:"N/A",   india:"Minimal exposure",           risk:18, update:"8h"  },
  { id:7, name:"Taiwan Strait",       region:"E. Asia",    intensity:"high",     casualties:"N/A",   india:"Supply chain, China factor",  risk:71, update:"3h"  },
  { id:8, name:"Iran–Israel Tension", region:"Mid East",   intensity:"high",     casualties:"N/A",   india:"Oil import risk",            risk:68, update:"1h"  },
];

const BORDER_STATUS = [
  { name:"Line of Actual Control (China)", color:"#ff2d2d", level:"HIGH TENSION", detail:"Patrol standoff — Depsang Plains",   active:true  },
  { name:"LoC — Pakistan (J&K)",           color:"#ff6b00", level:"ELEVATED",     detail:"3 ceasefire violations this week",   active:true  },
  { name:"Bangladesh Border",              color:"#ffe033", level:"WATCH",         detail:"Irregular crossings reported",       active:false },
  { name:"Myanmar Border (Manipur)",       color:"#ff6b00", level:"ELEVATED",     detail:"Armed group movements near border",  active:true  },
  { name:"Nepal Border",                   color:"#00ff88", level:"STABLE",        detail:"Normal — diplomatic talks ongoing",  active:false },
  { name:"Sri Lanka Maritime",             color:"#00ff88", level:"STABLE",        detail:"Normal patrolling",                  active:false },
];

const INTEL_FEED = [
  { icon:"⚠️", text:"IB Alert: ISI-linked networks active in Delhi, Mumbai — heightened surveillance ordered",     level:"critical" },
  { icon:"🔴", text:"Drone sighting near Pathankot Air Base — sector sealed, anti-drone systems activated",        level:"critical" },
  { icon:"🟡", text:"Encrypted chatter spike — Northeast India insurgent groups coordinating across border",       level:"high"     },
  { icon:"🟡", text:"INTERPOL Red Notice: 3 LeT operatives believed to have entered India via Nepal border",       level:"high"     },
  { icon:"🟢", text:"CISF raises security level at 12 nuclear installations — precautionary measure",              level:"medium"   },
  { icon:"🟡", text:"RAW intercept: ISI funds routed to Khalistan-linked disinformation cells",                   level:"high"     },
];

const TICKER_ITEMS = [
  "🔴 BREAKING: China PLA conducts live-fire drills in Tibet near Indian border",
  "⚡ Pakistan FM summoned to Indian High Commission over LoC violations",
  "🛡️ Indian Navy deploys INS Vikrant to Indian Ocean",
  "🔴 ALERT: Explosion near Indian consulate in Jalalabad — no casualties",
  "📡 ISRO activates RISAT-2B for enhanced border surveillance",
  "⚡ USS Theodore Roosevelt carrier group enters Arabian Sea",
  "🟡 Maldives political crisis — India monitoring pro-China govt moves",
  "🔴 NIA arrests 4 in Gujarat with RDX — ISI link suspected",
];

const BORDER_PROBS = [
  { label:"China (LAC)",        val:72, color:"#ff2d2d" },
  { label:"Pakistan (LoC)",     val:58, color:"#ff6b00" },
  { label:"Myanmar Border",     val:41, color:"#ffe033" },
  { label:"Maritime Threat",    val:34, color:"#ffe033" },
  { label:"Domestic Terrorism", val:63, color:"#ff6b00" },
];

const THREAT_SUMMARY = [
  { label:"Conventional War",    level:"LOW",      color:"#00ff88", desc:"No imminent inter-state war"          },
  { label:"Nuclear Risk",        level:"WATCH",    color:"#ffe033", desc:"Pak tactical nuke doctrine active"    },
  { label:"Cross-border Terror", level:"HIGH",     color:"#ff6b00", desc:"Multiple active modules detected"    },
  { label:"Cyber Warfare",       level:"ELEVATED", color:"#ff6b00", desc:"APT41 targeting DRDO/ISRO networks"  },
  { label:"Economic Warfare",    level:"MEDIUM",   color:"#ffe033", desc:"Supply chain via South China Sea"    },
];

const SOURCES = [
  { src:"Reuters",        score:96, bias:"C"  },
  { src:"The Hindu",      score:91, bias:"CL" },
  { src:"BBC India",      score:89, bias:"CL" },
  { src:"The Print",      score:84, bias:"C"  },
  { src:"Livemint",       score:83, bias:"C"  },
  { src:"NDTV",           score:82, bias:"C"  },
  { src:"Times of India", score:80, bias:"CR" },
  { src:"ANI",            score:74, bias:"CR" },
  { src:"Republic TV",    score:45, bias:"R"  },
];

// YouTube Live streams — major Indian news channels
// These are official live stream video IDs
const YOUTUBE_CHANNELS = [
  { name:"NDTV 24x7",        videoId:"Js54NRue8-Y", desc:"India's top English news",  credibility:82 },
  { name:"Republic TV",      videoId:"S1KGSmtDnB4", desc:"Breaking news & analysis",   credibility:45 },
  { name:"India Today",      videoId:"V4EBi3HDZB0", desc:"Live news coverage",         credibility:80 },
  { name:"Wion News",        videoId:"FPgfBB4OzRk", desc:"Global Indian perspective",  credibility:75 },
  { name:"DD News",          videoId:"6mVHFH7MVYE", desc:"Government state broadcaster",credibility:70 },
  { name:"Mirror Now",       videoId:"u-MagxjEcEE", desc:"Urban & national affairs",   credibility:76 },
];

// Strategic resources data
const RESOURCES = [
  { label:"Crude Oil Reserves",   value:12, max:30, unit:"Days of import cover", color:"#ff6b00", trend:"-2 days vs last month", icon:"🛢️",  status:"CRITICAL" },
  { label:"Natural Gas Reserves", value:18, max:30, unit:"Days of supply cover", color:"#ffe033", trend:"Stable",                 icon:"⛽",  status:"WATCH"    },
  { label:"Coal Stockpile",       value:24, max:30, unit:"Days at power plants",  color:"#00ff88", trend:"+3 days",                icon:"⚫",  status:"ADEQUATE" },
  { label:"Food Grain Buffer",    value:28, max:30, unit:"Months of buffer stock",color:"#00ff88", trend:"Surplus",                icon:"🌾",  status:"ADEQUATE" },
  { label:"Foreign Exchange",     value:22, max:30, unit:"Months of import cover",color:"#00d4ff", trend:"$620B reserves",         icon:"💰",  status:"STABLE"   },
  { label:"Uranium Fuel Stock",   value:20, max:30, unit:"Months for reactors",   color:"#00ff88", trend:"Domestic mining up",     icon:"⚛️",  status:"ADEQUATE" },
  { label:"Water Reservoirs",     value:16, max:30, unit:"% of total capacity",   color:"#ffe033", trend:"Below seasonal avg",     icon:"💧",  status:"WATCH"    },
  { label:"Defence Ammunition",   value:20, max:30, unit:"Days of intense combat", color:"#ff6b00", trend:"Procurement ongoing",   icon:"🎯",  status:"WATCH"    },
];

// Geopolitical news categories
const GEO_NEWS = {
  national: [
    { headline:"Cabinet Committee on Security meets over LAC standoff — NSA Doval chairs emergency session", source:"The Hindu",  time:"1h ago",  category:"MILITARY"    },
    { headline:"Parliament passes Coastal Security Amendment Bill — enhanced maritime surveillance powers",   source:"Livemint",   time:"3h ago",  category:"POLICY"      },
    { headline:"India test-fires Agni-V MIRV variant — DRDO confirms successful multi-warhead deployment",   source:"The Print",  time:"5h ago",  category:"DEFENCE"     },
    { headline:"Home Ministry issues high alert for 5 states ahead of Republic Day — IB input cited",        source:"NDTV",       time:"6h ago",  category:"SECURITY"    },
    { headline:"India-China border talks: 22nd round scheduled — disengagement formula under discussion",    source:"The Hindu",  time:"8h ago",  category:"DIPLOMATIC"  },
  ],
  local: [
    { headline:"Jammu encounter: 3 militants neutralized in Rajouri — Army operation ongoing",              source:"ANI",        time:"30m ago", category:"TERROR"      },
    { headline:"Manipur: Additional CRPF companies deployed amid fresh violence reports near border",       source:"NDTV",       time:"2h ago",  category:"SECURITY"    },
    { headline:"Punjab Police busts cross-border drug-arms network — drone used for delivery",              source:"TOI",        time:"4h ago",  category:"TERROR"      },
    { headline:"Arunachal Pradesh: Infrastructure push on border roads — BRO completes 3 strategic tunnels",source:"The Hindu",  time:"6h ago",  category:"MILITARY"    },
    { headline:"Assam Rifles seizes Myanmar-origin arms cache in Nagaland — insurgent link suspected",      source:"ANI",        time:"9h ago",  category:"SECURITY"    },
  ],
  international: [
    { headline:"China deploys 3 new Type-055 destroyers in Indian Ocean — PLA Navy expansion accelerates",  source:"Reuters",    time:"45m ago", category:"MILITARY"    },
    { headline:"Pakistan receives 6 J-10C fighter jets from China — India watching IAF gap closely",        source:"Reuters",    time:"2h ago",  category:"MILITARY"    },
    { headline:"US imposes fresh sanctions on Iran — Strait of Hormuz tension rises, India oil at risk",    source:"BBC",        time:"3h ago",  category:"ECONOMY"     },
    { headline:"ASEAN summit: India pushes Indo-Pacific security framework amid South China Sea tensions",   source:"Al Jazeera", time:"5h ago",  category:"DIPLOMATIC"  },
    { headline:"Taliban-Pakistan border clashes intensify — Durand Line dispute escalates again",           source:"Reuters",    time:"7h ago",  category:"CONFLICT"    },
  ],
};

// World conflict risk for all major countries
const WORLD_RISKS = [
  { country:"🇺🇦 Ukraine",     risk:95, status:"Active War",      trend:"↑" },
  { country:"🇵🇸 Palestine",   risk:93, status:"Active War",      trend:"→" },
  { country:"🇸🇩 Sudan",       risk:82, status:"Civil War",       trend:"↑" },
  { country:"🇲🇲 Myanmar",     risk:78, status:"Junta War",       trend:"→" },
  { country:"🇮🇷 Iran",        risk:71, status:"Regional Threat", trend:"↑" },
  { country:"🇹🇼 Taiwan",      risk:68, status:"High Tension",    trend:"↑" },
  { country:"🇵🇰 Pakistan",    risk:65, status:"Instability",     trend:"↑" },
  { country:"🇮🇳 India",       risk:67, status:"Elevated",        trend:"→" },
  { country:"🇮🇱 Israel",      risk:88, status:"Active War",      trend:"→" },
  { country:"🇾🇪 Yemen",       risk:79, status:"Civil Conflict",  trend:"↓" },
  { country:"🇸🇴 Somalia",     risk:72, status:"Insurgency",      trend:"→" },
  { country:"🇨🇳 China",       risk:48, status:"Assertive",       trend:"↑" },
  { country:"🇷🇺 Russia",      risk:85, status:"Active War",      trend:"→" },
  { country:"🇰🇵 N. Korea",    risk:61, status:"Provocative",     trend:"↑" },
];

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
  const r=52,cx=60,cy=62,circ=Math.PI*r,offset=circ-(value/100)*circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width="120" height="74" viewBox="0 0 120 80">
        <defs>
          <linearGradient id="arcG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#00ff88"/>
            <stop offset="50%"  stopColor="#ffe033"/>
            <stop offset="100%" stopColor="#ff2d2d"/>
          </linearGradient>
        </defs>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#0f3040" strokeWidth="10" strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="url(#arcG)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition:"stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)" }}/>
        <text x={cx} y={cy-6} textAnchor="middle" fill="#ff6b00" fontSize="22" fontFamily="Teko" fontWeight="700">{value}%</text>
        <text x={cx} y={cy+10} textAnchor="middle" fill="#3a6678" fontSize="8" fontFamily="Share Tech Mono" letterSpacing="1">OVERALL RISK</text>
      </svg>
    </div>
  );
}

function Radar() {
  const dots=[
    {x:"56%",y:"28%",color:"#ff2d2d",label:"LAC",delay:"0s"},
    {x:"36%",y:"44%",color:"#ff6b00",label:"LoC",delay:".6s"},
    {x:"72%",y:"66%",color:"#ffe033",label:"MYN",delay:"1.2s"},
    {x:"58%",y:"80%",color:"#00ff88",label:"SL", delay:"1.8s"},
  ];
  return (
    <div className="radar-wrap">
      {[120,88,56,24].map(s=><div key={s} className="radar-ring" style={{width:s,height:s,marginLeft:-s/2,marginTop:-s/2}}/>)}
      <div className="radar-sweep"/>
      {dots.map(d=>(
        <div key={d.label}>
          <div className="radar-dot" style={{left:d.x,top:d.y,background:d.color,boxShadow:`0 0 6px ${d.color}`}}/>
          <div className="radar-ping" style={{left:d.x,top:d.y,borderColor:d.color,animationDelay:d.delay}}/>
        </div>
      ))}
      <div style={{position:"absolute",top:"50%",left:"50%",width:6,height:6,borderRadius:"50%",background:"var(--cyan)",transform:"translate(-50%,-50%)",boxShadow:"0 0 10px var(--cyan)"}}/>
    </div>
  );
}

function NewsCard({ item }) {
  return (
    <div className="news-card" onClick={()=>item.url&&item.url!=="#"&&window.open(item.url,"_blank")}>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
        <CatTag cat={item.category}/>
        <CredLabel score={item.credibility}/>
        <span className="mono" style={{fontSize:9,color:"#3a6678",marginLeft:"auto"}}>{item.time}</span>
      </div>
      <div style={{fontSize:13,lineHeight:1.4,color:"#c8dde6",marginBottom:5,fontWeight:500}}>{item.headline}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:10,color:"#3a6678"}}>{item.source}<span style={{color:"#1a5068"}}> · {item.bias}</span></span>
      </div>
      <div className="cred-bar">
        <div className="cred-fill" style={{width:`${item.credibility}%`,background:item.credibility>=85?"#00ff88":item.credibility>=65?"#ffe033":"#ff6b00"}}/>
      </div>
    </div>
  );
}

// ─── PAGE: MAIN DASHBOARD ────────────────────────────────────
function PageDashboard({ news, loading, error, refetch }) {
  const [tab, setTab] = useState("news");
  return (
    <div className="grid3">
      {/* LEFT */}
      <div className="col">
        <div className="panel">
          <div className="ph"><span className="ph-icon">◈</span> INDIA CONFLICT RISK</div>
          <div style={{padding:"10px 12px"}}>
            <RiskGauge value={67}/>
            <div style={{textAlign:"center",marginBottom:10}}><span className="tbadge tb-high">⚡ ELEVATED THREAT</span></div>
            {BORDER_PROBS.map(p=>(
              <div key={p.label} className="prob-wrap">
                <div className="prob-label"><span>{p.label}</span><span style={{color:p.color}}>{p.val}%</span></div>
                <div className="prob-bar"><div className="prob-fill" style={{width:`${p.val}%`,background:p.color}}/></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">◉</span> BORDER RADAR</div>
          <div style={{padding:"10px 0 6px"}}>
            <Radar/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,padding:"8px 12px 4px"}}>
              {[["LAC","#ff2d2d"],["LoC","#ff6b00"],["MYN","#ffe033"],["SL","#00ff88"]].map(([l,c])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:9,fontFamily:"Share Tech Mono",color:"#7aacbe"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:c}}/>{l}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="stat-grid">
          {[["6","#ff2d2d","Active Wars"],["3","#ff6b00","Border Alerts"],["4","#ffe033","Intel Alerts"]].map(([n,c,l])=>(
            <div key={l} className="stat-box"><div className="stat-num" style={{color:c}}>{n}</div><div className="stat-lbl">{l}</div></div>
          ))}
        </div>
        <div className="panel" style={{flex:1}}>
          <div className="ph"><span className="ph-icon">▣</span> LIVE BORDER STATUS</div>
          {BORDER_STATUS.map(b=>(
            <div key={b.name} className="bstatus" style={{borderColor:b.color}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"#c8dde6"}}>{b.name}</div>
                <div style={{fontSize:10,color:"#3a6678",marginTop:1}}>{b.detail}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div className="teko" style={{fontSize:10,color:b.color,letterSpacing:1}}>{b.level}</div>
                {b.active&&<div className="live-dot" style={{width:5,height:5,marginLeft:"auto",marginTop:3}}/>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER */}
      <div className="col">
        <div className="panel" style={{flexShrink:0}}>
          <div className="ph"><span className="ph-icon">◎</span> INDIA SUBCONTINENT — STRATEGIC MAP</div>
          <div style={{position:"relative",height:260,overflow:"hidden"}}>
            <svg viewBox="0 0 460 280" style={{width:"100%",height:"100%"}}>
              <defs>
                <radialGradient id="mbg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0a1e25"/>
                  <stop offset="100%" stopColor="#020608"/>
                </radialGradient>
              </defs>
              <rect width="460" height="280" fill="url(#mbg)"/>
              {[0,46,92,138,184,230,276,322,368,414,460].map(x=><line key={x} x1={x} y1="0" x2={x} y2="280" stroke="#0f3040" strokeWidth=".5"/>)}
              {[0,40,80,120,160,200,240,280].map(y=><line key={y} x1="0" y1={y} x2="460" y2={y} stroke="#0f3040" strokeWidth=".5"/>)}
              {/* Countries */}
              <polygon points="170,18 230,14 272,28 292,58 312,98 302,144 268,174 248,204 228,244 208,264 192,254 176,226 160,208 142,180 122,160 112,130 122,90 134,60 150,34"
                fill="rgba(19,136,8,.12)" stroke="#138808" strokeWidth="1.5"/>
              <polygon points="104,18 166,18 150,34 134,60 122,90 104,80 82,60 88,34"
                fill="rgba(255,107,0,.08)" stroke="#ff6b00" strokeWidth="1"/>
              <polygon points="170,18 272,8 322,18 322,50 292,58 272,28 230,14"
                fill="rgba(255,45,45,.07)" stroke="#ff2d2d" strokeWidth="1"/>
              <polygon points="248,172 272,166 276,188 258,198 242,190"
                fill="rgba(0,212,255,.08)" stroke="#00d4ff" strokeWidth=".8"/>
              <polygon points="276,188 302,178 312,214 296,232 274,216"
                fill="rgba(255,107,0,.08)" stroke="#ff6b00" strokeWidth=".8"/>
              <polygon points="166,60 232,56 236,72 164,76"
                fill="rgba(0,212,255,.06)" stroke="#00d4ff" strokeWidth=".6"/>
              {/* Labels */}
              <text x="192" y="130" fill="rgba(0,255,136,.55)" fontSize="12" fontFamily="Teko" letterSpacing="3">INDIA</text>
              <text x="86"  y="52"  fill="rgba(255,107,0,.7)"  fontSize="8"  fontFamily="Share Tech Mono">PAK</text>
              <text x="264" y="28"  fill="rgba(255,45,45,.7)"  fontSize="8"  fontFamily="Share Tech Mono">CHINA</text>
              <text x="302" y="204" fill="rgba(255,107,0,.7)"  fontSize="8"  fontFamily="Share Tech Mono">MYN</text>
              <text x="254" y="192" fill="rgba(0,212,255,.6)"  fontSize="7"  fontFamily="Share Tech Mono">BGD</text>
              <text x="180" y="73"  fill="rgba(0,212,255,.5)"  fontSize="7"  fontFamily="Share Tech Mono">NPL</text>
              {/* Military installations */}
              {[
                {cx:192,cy:100,type:"✈",label:"Hindon AFB",c:"#00d4ff"},
                {cx:144,cy:70, type:"✈",label:"Pathankot",c:"#00d4ff"},
                {cx:240,cy:50, type:"⚓",label:"Leh Base",c:"#ff6b00"},
                {cx:208,cy:240,type:"⚓",label:"INS Karwar",c:"#00d4ff"},
                {cx:260,cy:220,type:"⚓",label:"Andaman",c:"#00d4ff"},
                {cx:168,cy:120,type:"🛡️",label:"Pokhran",c:"#ffe033"},
              ].map((m,i)=>(
                <g key={i}>
                  <text x={m.cx} y={m.cy} textAnchor="middle" fontSize="10">{m.type}</text>
                  <text x={m.cx} y={m.cy+10} textAnchor="middle" fill={m.c} fontSize="6" fontFamily="Share Tech Mono">{m.label}</text>
                </g>
              ))}
              {/* Hotspots */}
              {[
                {cx:242,cy:44,c:"#ff2d2d",label:"LAC",delay:0},
                {cx:132,cy:54,c:"#ff6b00",label:"LoC",delay:.5},
                {cx:282,cy:196,c:"#ff6b00",label:"",  delay:1.4},
                {cx:204,cy:254,c:"#00ff88",label:"SL", delay:.8},
              ].map((h,i)=>(
                <g key={i}>
                  <circle cx={h.cx} cy={h.cy} r="4" fill={h.c} opacity=".9">
                    <animate attributeName="r" values="4;9;4" dur="2s" repeatCount="indefinite" begin={`${h.delay}s`}/>
                    <animate attributeName="opacity" values=".9;.2;.9" dur="2s" repeatCount="indefinite" begin={`${h.delay}s`}/>
                  </circle>
                  {h.label&&<text x={h.cx+8} y={h.cy+4} fill={h.c} fontSize="8" fontFamily="Share Tech Mono">{h.label}</text>}
                </g>
              ))}
              {/* Legend */}
              {[["#ff2d2d","CONFLICT",8],["#00d4ff","MILITARY",72],["#ffe033","NUCLEAR",140],["#00ff88","STABLE",208]].map(([c,l,x])=>(
                <g key={l}><circle cx={x+4} cy={268} r="4" fill={c}/><text x={x+12} y={272} fill="#7aacbe" fontSize="7" fontFamily="Share Tech Mono">{l}</text></g>
              ))}
            </svg>
          </div>
        </div>

        <div className="panel" style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",borderBottom:"1px solid var(--b)"}}>
            {[["news","📰 Live News"],["intel","⚡ Intel Feed"]].map(([t,label])=>(
              <button key={t} className="tab-btn" onClick={()=>setTab(t)}
                style={{color:tab===t?"var(--cyan)":"var(--t3)",borderBottomColor:tab===t?"var(--cyan)":"transparent"}}>
                {label}
              </button>
            ))}
            <div style={{marginLeft:"auto",padding:"0 12px",display:"flex",alignItems:"center",gap:6}}>
              {loading&&<span className="mono" style={{fontSize:9,color:"#ffe033"}}>FETCHING...</span>}
              {!loading&&<div className="live-dot" style={{width:5,height:5}}/>}
              <span className="mono" style={{fontSize:9,color:"#3a6678"}}>5m AUTO</span>
            </div>
          </div>
          <div className="scroll" style={{flex:1,maxHeight:420}}>
            {tab==="news"
              ? news.length===0
                ? <div style={{padding:20,textAlign:"center",color:"#3a6678",fontFamily:"Share Tech Mono",fontSize:11}}>Loading feed...</div>
                : news.map((item,i)=><NewsCard key={item.id??i} item={item}/>)
              : INTEL_FEED.map((item,i)=>(
                <div key={i} className="intel-item">
                  <div style={{fontSize:16,flexShrink:0}}>{item.icon}</div>
                  <div>
                    <div style={{fontSize:12,color:"#c8dde6",lineHeight:1.4}}>{item.text}</div>
                    <div className="mono" style={{fontSize:9,color:"#3a6678",marginTop:4}}>IB / RAW / NIA · {["2m","8m","14m","31m","1h","2h"][i]} ago</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="col">
        <div className="panel" style={{flex:1}}>
          <div className="ph"><span className="ph-icon">◈</span> ACTIVE GLOBAL CONFLICTS</div>
          <div className="scroll" style={{maxHeight:290}}>
            {CONFLICTS.map(c=>(
              <div key={c.id} className="conf-row">
                <div style={{width:8,height:8,borderRadius:"50%",background:IntColor(c.intensity),flexShrink:0,boxShadow:`0 0 6px ${IntColor(c.intensity)}`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#c8dde6",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                  <div style={{fontSize:10,color:"#3a6678"}}>{c.region} · {c.update} ago</div>
                  <div style={{fontSize:10,color:"#7aacbe",marginTop:2}}>🇮🇳 {c.india}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div className="teko" style={{fontSize:10,color:IntColor(c.intensity),letterSpacing:1}}>{c.intensity.toUpperCase()}</div>
                  <div style={{fontSize:9,color:"#3a6678"}}>{c.casualties}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">◉</span> SOURCE CREDIBILITY</div>
          <div style={{padding:"8px 12px"}}>
            {SOURCES.map(s=>(
              <div key={s.src} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                <div style={{width:74,fontSize:10,color:"#7aacbe",flexShrink:0}}>{s.src}</div>
                <div className="prob-bar" style={{flex:1,height:4}}>
                  <div className="prob-fill" style={{width:`${s.score}%`,background:s.score>=85?"#00ff88":s.score>=65?"#ffe033":"#ff6b00"}}/>
                </div>
                <div className="mono" style={{fontSize:9,color:"#3a6678",width:22}}>{s.score}</div>
                <div className="mono" style={{fontSize:8,color:"#1a5068",width:18}}>{s.bias}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="ph-icon">▲</span> THREAT SUMMARY</div>
          <div style={{padding:"6px 12px"}}>
            {THREAT_SUMMARY.map(t=>(
              <div key={t.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--b)",gap:8}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#c8dde6"}}>{t.label}</div>
                  <div style={{fontSize:9,color:"#3a6678"}}>{t.desc}</div>
                </div>
                <span style={{fontSize:9,color:t.color,border:`1px solid ${t.color}44`,padding:"2px 7px",fontFamily:"Teko",letterSpacing:1,flexShrink:0}}>{t.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: LIVE NEWS TV ──────────────────────────────────────
function PageLiveTV() {
  const [active, setActive] = useState(0);
  return (
    <div style={{padding:8}}>
      <div className="panel" style={{marginBottom:8}}>
        <div className="ph"><span className="ph-icon">📺</span> LIVE NEWS CHANNELS — INDIA</div>
        <div style={{padding:"8px 12px",display:"flex",gap:8,flexWrap:"wrap",borderBottom:"1px solid var(--b)"}}>
          {YOUTUBE_CHANNELS.map((ch,i)=>(
            <button key={i} onClick={()=>setActive(i)} style={{
              padding:"5px 12px", background:active===i?"rgba(0,212,255,.15)":"var(--card)",
              border:`1px solid ${active===i?"var(--cyan)":"var(--b)"}`,
              color:active===i?"var(--cyan)":"var(--t2)", cursor:"pointer", borderRadius:1,
              fontFamily:"Teko", fontSize:13, letterSpacing:1
            }}>
              {ch.name}
            </button>
          ))}
        </div>
        {/* Main player */}
        <div style={{position:"relative",width:"100%",paddingTop:"45%",background:"#000"}}>
          <iframe
            key={active}
            src={`https://www.youtube.com/embed/${YOUTUBE_CHANNELS[active].videoId}?autoplay=1&mute=0`}
            style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:12,borderTop:"1px solid var(--b)"}}>
          <div className="live-dot"/>
          <span className="teko" style={{fontSize:16,letterSpacing:2,color:"var(--txt)"}}>{YOUTUBE_CHANNELS[active].name}</span>
          <span style={{fontSize:11,color:"var(--t3)"}}>{YOUTUBE_CHANNELS[active].desc}</span>
          <CredLabel score={YOUTUBE_CHANNELS[active].credibility}/>
        </div>
      </div>
      {/* All channels grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
        {YOUTUBE_CHANNELS.map((ch,i)=>(
          <div key={i} className="panel" style={{cursor:"pointer",border:active===i?"1px solid var(--cyan)":"1px solid var(--b)"}} onClick={()=>setActive(i)}>
            <div style={{position:"relative",paddingTop:"56.25%",background:"#000"}}>
              <iframe
                src={`https://www.youtube.com/embed/${ch.videoId}?mute=1`}
                style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              />
            </div>
            <div style={{padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div className="teko" style={{fontSize:14,letterSpacing:1,color:"var(--txt)"}}>{ch.name}</div>
                <div style={{fontSize:10,color:"var(--t3)"}}>{ch.desc}</div>
              </div>
              <CredLabel score={ch.credibility}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE: RESOURCES ─────────────────────────────────────────
function PageResources() {
  return (
    <div style={{padding:8}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8,marginBottom:8}}>
        {RESOURCES.map((r,i)=>{
          const pct = (r.value/r.max)*100;
          const c = pct>70?"#00ff88":pct>40?"#ffe033":"#ff2d2d";
          return (
            <div key={i} className="res-card" style={{"--fill-color":c}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{fontSize:22}}>{r.icon}</div>
                <span style={{fontSize:9,color:c,border:`1px solid ${c}44`,padding:"2px 7px",fontFamily:"Teko",letterSpacing:1}}>{r.status}</span>
              </div>
              <div className="res-label">{r.label}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:6,margin:"4px 0"}}>
                <span className="res-num" style={{color:c}}>{r.value}</span>
                <span className="res-unit">{r.unit}</span>
              </div>
              <div className="res-bar">
                <div className="res-fill" style={{width:`${pct}%`,background:c}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div className="res-trend" style={{color:r.trend.startsWith("-")?"#ff2d2d":r.trend.startsWith("+")?"#00ff88":"#7aacbe"}}>{r.trend}</div>
                <div className="mono" style={{fontSize:9,color:"#3a6678"}}>{Math.round(pct)}% capacity</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed table */}
      <div className="panel">
        <div className="ph"><span className="ph-icon">◈</span> STRATEGIC RESERVES DETAIL — INDIA</div>
        <div style={{overflowX:"auto"}}>
          <table className="world-table" style={{width:"100%"}}>
            <thead>
              <tr>
                <th>RESOURCE</th>
                <th>CURRENT LEVEL</th>
                <th>CAPACITY</th>
                <th>DAYS / COVER</th>
                <th>STATUS</th>
                <th>TREND</th>
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((r,i)=>{
                const pct=(r.value/r.max)*100;
                const c=pct>70?"#00ff88":pct>40?"#ffe033":"#ff2d2d";
                return (
                  <tr key={i}>
                    <td style={{color:"#c8dde6",fontWeight:600}}>{r.icon} {r.label}</td>
                    <td>
                      <div className="prob-bar" style={{width:100,height:6,display:"inline-block",verticalAlign:"middle",marginRight:6}}>
                        <div className="prob-fill" style={{width:`${pct}%`,background:c}}/>
                      </div>
                    </td>
                    <td className="mono" style={{color:c}}>{Math.round(pct)}%</td>
                    <td className="teko" style={{fontSize:16,color:c}}>{r.value} <span style={{fontSize:10,color:"#3a6678"}}>{r.unit}</span></td>
                    <td><span style={{fontSize:9,color:c,border:`1px solid ${c}44`,padding:"1px 6px",fontFamily:"Teko",letterSpacing:1}}>{r.status}</span></td>
                    <td className="mono" style={{fontSize:10,color:r.trend.startsWith("-")?"#ff2d2d":r.trend.startsWith("+")?"#00ff88":"#7aacbe"}}>{r.trend}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:"8px 12px",fontSize:9,color:"#1a5068",fontFamily:"Share Tech Mono",borderTop:"1px solid var(--b)"}}>
          DATA: Ministry of Petroleum · Coal Ministry · FCI · RBI · PPAC · Last updated: Real-time estimates
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: GEO NEWS ──────────────────────────────────────────
function PageGeoNews() {
  const [tab, setTab] = useState("national");
  const items = GEO_NEWS[tab] || [];
  return (
    <div style={{padding:8}}>
      <div className="panel">
        <div style={{display:"flex",borderBottom:"1px solid var(--b)"}}>
          {[["national","🇮🇳 National"],["local","📍 Local / State"],["international","🌍 International"]].map(([t,l])=>(
            <button key={t} className="tab-btn" onClick={()=>setTab(t)}
              style={{color:tab===t?"var(--cyan)":"var(--t3)",borderBottomColor:tab===t?"var(--cyan)":"transparent"}}>
              {l}
            </button>
          ))}
          <div style={{marginLeft:"auto",padding:"0 12px",display:"flex",alignItems:"center",gap:6}}>
            <div className="live-dot" style={{width:5,height:5}}/>
            <span className="mono" style={{fontSize:9,color:"#3a6678"}}>LIVE FEED</span>
          </div>
        </div>
        <div className="scroll" style={{maxHeight:"calc(100vh - 200px)"}}>
          {items.map((item,i)=>(
            <div key={i} className="geo-card">
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                <CatTag cat={item.category}/>
                <span style={{fontSize:9,color:"#3a6678",marginLeft:"auto",fontFamily:"Share Tech Mono"}}>{item.time}</span>
              </div>
              <div style={{fontSize:14,lineHeight:1.4,color:"#c8dde6",fontWeight:600,marginBottom:4}}>{item.headline}</div>
              <div style={{fontSize:10,color:"#3a6678"}}>{item.source}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: WORLD MAP ─────────────────────────────────────────
function PageWorldMap() {
  return (
    <div style={{padding:8,display:"flex",flexDirection:"column",gap:8}}>
      <div className="panel">
        <div className="ph"><span className="ph-icon">🌍</span> GLOBAL CONFLICT RISK INDEX — ALL COUNTRIES</div>
        <div style={{overflowX:"auto"}}>
          <table className="world-table" style={{width:"100%"}}>
            <thead>
              <tr>
                <th>COUNTRY</th>
                <th>RISK LEVEL</th>
                <th>RISK %</th>
                <th>STATUS</th>
                <th>TREND</th>
                <th>INDIA IMPACT</th>
              </tr>
            </thead>
            <tbody>
              {WORLD_RISKS.sort((a,b)=>b.risk-a.risk).map((w,i)=>{
                const c=w.risk>=80?"#ff2d2d":w.risk>=60?"#ff6b00":w.risk>=40?"#ffe033":"#00ff88";
                const impact=w.risk>=80?"HIGH":w.risk>=60?"MEDIUM":w.risk>=40?"LOW":"MINIMAL";
                const ic=w.risk>=80?"#ff6b00":w.risk>=60?"#ffe033":"#00ff88";
                return (
                  <tr key={i}>
                    <td style={{color:"#c8dde6",fontWeight:600,fontSize:13}}>{w.country}</td>
                    <td>
                      <div className="prob-bar" style={{width:120,height:5,display:"inline-block",verticalAlign:"middle",marginRight:8}}>
                        <div className="prob-fill" style={{width:`${w.risk}%`,background:c}}/>
                      </div>
                    </td>
                    <td className="teko" style={{fontSize:18,color:c}}>{w.risk}%</td>
                    <td><span style={{fontSize:9,color:c,border:`1px solid ${c}44`,padding:"1px 6px",fontFamily:"Teko",letterSpacing:1}}>{w.status}</span></td>
                    <td className="teko" style={{fontSize:18,color:w.trend==="↑"?"#ff2d2d":w.trend==="↓"?"#00ff88":"#ffe033"}}>{w.trend}</td>
                    <td><span style={{fontSize:9,color:ic,fontFamily:"Teko",letterSpacing:1}}>{impact}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* World SVG map */}
      <div className="panel">
        <div className="ph"><span className="ph-icon">◎</span> WORLD CONFLICT HEATMAP</div>
        <div style={{padding:12}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6}}>
            {WORLD_RISKS.sort((a,b)=>b.risk-a.risk).map((w,i)=>{
              const c=w.risk>=80?"#ff2d2d":w.risk>=60?"#ff6b00":w.risk>=40?"#ffe033":"#00ff88";
              return (
                <div key={i} style={{background:`${c}11`,border:`1px solid ${c}33`,padding:"8px 10px",borderRadius:2}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#c8dde6"}}>{w.country}</span>
                    <span className="teko" style={{fontSize:18,color:c,fontWeight:700}}>{w.risk}%</span>
                  </div>
                  <div className="prob-bar">
                    <div className="prob-fill" style={{width:`${w.risk}%`,background:c}}/>
                  </div>
                  <div style={{fontSize:9,color:"#3a6678",fontFamily:"Share Tech Mono",marginTop:4}}>{w.status}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{padding:"6px 12px",fontSize:9,color:"#1a5068",fontFamily:"Share Tech Mono",borderTop:"1px solid var(--b)"}}>
          DATA: ACLED · GDELT · Uppsala Conflict Data Program · Updated hourly
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
    const t = setInterval(()=>setTime(new Date()), 1000);
    return ()=>clearInterval(t);
  }, []);

  const timeFmt = d => d.toLocaleTimeString("en-IN",{hour12:false}) + " IST";
  const dateFmt = d => d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

  const pages = [
    ["dashboard", "⬛ Dashboard"],
    ["livetv",    "📺 Live TV"],
    ["geonews",   "🗞️ Geo News"],
    ["resources", "🛢️ Resources"],
    ["worldmap",  "🌍 World Map"],
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="scanline"/>

      {/* TOP BAR */}
      <div className="topbar">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:20,background:"linear-gradient(180deg,#FF9933 33%,white 33%,white 66%,#138808 66%)",borderRadius:2,flexShrink:0,border:"1px solid #333"}}/>
          <div>
            <div className="teko" style={{fontSize:17,fontWeight:700,letterSpacing:2,lineHeight:1,color:"#e8f4f8"}}>INDIA GEOPOLITICAL WAR DESK</div>
            <div className="mono" style={{fontSize:9,letterSpacing:2,color:"#3a6678"}}>OPEN-SOURCE INTELLIGENCE MONITOR · OSINT ONLY</div>
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={refetch} style={{background:"rgba(0,212,255,.08)",border:"1px solid rgba(0,212,255,.2)",color:"var(--cyan)",fontFamily:"Teko",fontSize:11,letterSpacing:2,padding:"3px 10px",cursor:"pointer",borderRadius:1}}>↺ REFRESH</button>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div className="live-dot"/>
            <span className="mono" style={{fontSize:10,color:"#ff2d2d",letterSpacing:1}}>LIVE</span>
          </div>
          <div style={{textAlign:"right"}}>
            <div className="mono" style={{fontSize:14,color:"var(--cyan)",letterSpacing:1}}>{timeFmt(time)}</div>
            <div className="mono" style={{fontSize:9,color:"#3a6678"}}>{dateFmt(time)}</div>
          </div>
        </div>
      </div>
      <div className="flag-stripe"/>

      {/* NAV TABS */}
      <div className="nav-tabs">
        {pages.map(([id,label])=>(
          <button key={id} className={`nav-tab${page===id?" active":""}`} onClick={()=>setPage(id)}>{label}</button>
        ))}
      </div>

      {/* PAGES */}
      {page==="dashboard" && <PageDashboard news={news} loading={loading} error={error} refetch={refetch}/>}
      {page==="livetv"    && <PageLiveTV/>}
      {page==="geonews"   && <PageGeoNews/>}
      {page==="resources" && <PageResources/>}
      {page==="worldmap"  && <PageWorldMap/>}

      {/* BOTTOM TICKER */}
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

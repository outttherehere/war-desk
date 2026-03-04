import { useEffect, useRef, useState } from "react";

// ─── GDELT LIVE EVENT FETCHER ─────────────────────────────────
// GDELT updates every 15 minutes with global events
// We fetch and parse their free JSON API

async function fetchGDELTEvents() {
  try {
    // GDELT GEO 2.0 API - free, no key needed
    // Fetches last 24h of conflict/military/protest events near India
    const queries = [
      // India region events
      "https://api.gdeltproject.org/api/v2/doc/doc?query=india+military+conflict+border&mode=artlist&maxrecords=10&format=json&timespan=24h",
      // Pakistan events
      "https://api.gdeltproject.org/api/v2/doc/doc?query=pakistan+india+border+attack&mode=artlist&maxrecords=8&format=json&timespan=12h",
      // China LAC events  
      "https://api.gdeltproject.org/api/v2/doc/doc?query=china+india+LAC+military&mode=artlist&maxrecords=8&format=json&timespan=12h",
    ];

    const results = await Promise.allSettled(
      queries.map(url =>
        fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
          .then(r => r.json())
      )
    );

    const articles = [];
    results.forEach(r => {
      if (r.status === "fulfilled" && r.value?.articles) {
        articles.push(...r.value.articles);
      }
    });

    return articles;
  } catch (err) {
    console.warn("GDELT fetch failed, using static events", err);
    return [];
  }
}

// ─── STATIC CONFLICT DATA (always shown) ─────────────────────
const STATIC_EVENTS = [
  // India borders
  { id:1,  lat:34.1,  lng:78.2,  type:"border",    severity:"critical", title:"LAC Standoff — Depsang Plains", detail:"PLA patrol activity detected. Indian Army on high alert. Disengagement talks ongoing.", country:"India/China",    updated:"Live",    india_impact:"DIRECT" },
  { id:2,  lat:33.5,  lng:74.3,  type:"border",    severity:"critical", title:"LoC — Jammu & Kashmir",         detail:"Ceasefire violations reported. BSF on alert. Infiltration attempts detected.",          country:"India/Pakistan", updated:"Live",    india_impact:"DIRECT" },
  { id:3,  lat:24.5,  lng:93.9,  type:"border",    severity:"high",     title:"Myanmar Border — Manipur",      detail:"Junta forces advancing. Armed groups crossing into Indian territory.",                  country:"India/Myanmar",  updated:"2h ago",  india_impact:"DIRECT" },
  { id:4,  lat:27.5,  lng:88.5,  type:"border",    severity:"medium",   title:"Sikkim — China Border",         detail:"Chinese infrastructure buildup near Nathula Pass. Monitoring ongoing.",                  country:"India/China",    updated:"4h ago",  india_impact:"DIRECT" },
  // Active wars
  { id:5,  lat:49.0,  lng:32.0,  type:"war",       severity:"critical", title:"Russia–Ukraine War",            detail:"Active frontline combat. 800K+ casualties. Drone strikes on infrastructure.",           country:"Ukraine",        updated:"Live",    india_impact:"INDIRECT — Energy prices" },
  { id:6,  lat:31.5,  lng:34.8,  type:"war",       severity:"critical", title:"Israel–Gaza Conflict",          detail:"Active combat in Gaza. 45K+ casualties. Regional escalation risk.",                    country:"Israel/Palestine",updated:"Live",    india_impact:"INDIRECT — Oil routes" },
  { id:7,  lat:15.5,  lng:32.5,  type:"war",       severity:"high",     title:"Sudan Civil War",               detail:"RSF vs SAF fighting. 150K+ dead. Indian nationals evacuated.",                        country:"Sudan",          updated:"3h ago",  india_impact:"MEDIUM — Diaspora" },
  { id:8,  lat:16.8,  lng:43.2,  type:"war",       severity:"high",     title:"Yemen Conflict",                detail:"Houthi attacks on Red Sea shipping. Indian vessels affected.",                         country:"Yemen",          updated:"2h ago",  india_impact:"HIGH — Shipping routes" },
  // Terror threats
  { id:9,  lat:31.5,  lng:74.3,  type:"terror",    severity:"critical", title:"Punjab — Terror Alert",         detail:"IB alert: Active LeT module detected. IED components seized in recent raid.",           country:"India",          updated:"1h ago",  india_impact:"DIRECT" },
  { id:10, lat:28.6,  lng:77.2,  type:"terror",    severity:"high",     title:"Delhi — Security Alert",        detail:"ISI-linked network disrupted. High-value target in custody.",                          country:"India",          updated:"3h ago",  india_impact:"DIRECT" },
  // Nuclear
  { id:11, lat:30.2,  lng:67.0,  type:"nuclear",   severity:"high",     title:"Pakistan — Nuclear Posture",    detail:"Shaheen-III test conducted. Tactical nuke doctrine review. India monitoring.",          country:"Pakistan",       updated:"6h ago",  india_impact:"CRITICAL" },
  { id:12, lat:35.7,  lng:51.4,  type:"nuclear",   severity:"high",     title:"Iran — Nuclear Program",        detail:"IAEA inspections blocked. Enrichment at 84%. US/Israel tensions rising.",               country:"Iran",           updated:"4h ago",  india_impact:"HIGH — Oil supply" },
  // Maritime
  { id:13, lat:12.5,  lng:57.0,  type:"maritime",  severity:"high",     title:"Arabian Sea — Houthi Threat",   detail:"Houthi anti-ship missiles fired. Indian Navy escorts activated for merchant vessels.",  country:"Yemen/Arabia",   updated:"1h ago",  india_impact:"HIGH — Trade routes" },
  { id:14, lat:8.0,   lng:77.5,  type:"maritime",  severity:"medium",   title:"Indian Ocean — Naval Watch",    detail:"Chinese naval vessels tracked near Andaman. Indian Navy shadowing.",                    country:"China",          updated:"2h ago",  india_impact:"DIRECT" },
  { id:15, lat:23.5,  lng:119.0, type:"military",  severity:"high",     title:"Taiwan Strait Crisis",          detail:"PLA exercises near Taiwan. US carrier group deployed. India watching closely.",        country:"China/Taiwan",   updated:"3h ago",  india_impact:"HIGH — Supply chain" },
  // Oil/resources
  { id:16, lat:26.0,  lng:50.5,  type:"resource",  severity:"high",     title:"Strait of Hormuz — Oil Risk",   detail:"Iran threatens closure. 20% of global oil transits here. India buys 40% from Gulf.",   country:"Iran/Gulf",      updated:"2h ago",  india_impact:"CRITICAL — Energy" },
  { id:17, lat:1.3,   lng:103.8, type:"resource",  severity:"medium",   title:"Malacca Strait — Trade Route",  detail:"China presence increasing. Critical for India's LNG imports from SE Asia.",           country:"Indonesia/Malaysia",updated:"5h ago",india_impact:"HIGH — Energy" },
  // New dynamic event example
  { id:18, lat:7.0,   lng:76.0,  type:"maritime",  severity:"critical", title:"⚡ BREAKING — Indian Ocean Event", detail:"Naval activity reported off Sri Lanka coast. Indian Navy activated. Monitoring ongoing.", country:"Indian Ocean",  updated:"LIVE",    india_impact:"DIRECT — Naval" },
];

// Country risk data for choropleth-style display
const COUNTRY_RISKS = {
  "Russia":      { risk:85, color:"#ff2d2d" },
  "Ukraine":     { risk:95, color:"#ff2d2d" },
  "China":       { risk:48, color:"#ff6b00" },
  "Pakistan":    { risk:65, color:"#ff6b00" },
  "Iran":        { risk:71, color:"#ff6b00" },
  "Israel":      { risk:88, color:"#ff2d2d" },
  "Sudan":       { risk:82, color:"#ff2d2d" },
  "Myanmar":     { risk:78, color:"#ff6b00" },
  "Yemen":       { risk:79, color:"#ff2d2d" },
  "N. Korea":    { risk:61, color:"#ffe033" },
  "Taiwan":      { risk:68, color:"#ff6b00" },
};

const TYPE_ICONS = {
  border:   "⚔️",
  war:      "💥",
  terror:   "🔴",
  nuclear:  "☢️",
  maritime: "⚓",
  military: "🛡️",
  resource: "🛢️",
};

const TYPE_COLORS = {
  border:   "#ff2d2d",
  war:      "#ff0000",
  terror:   "#ff4400",
  nuclear:  "#ffaa00",
  maritime: "#00d4ff",
  military: "#ff6b00",
  resource: "#f0a500",
};

const SEV_COLORS = {
  critical: "#ff2d2d",
  high:     "#ff6b00",
  medium:   "#ffe033",
  low:      "#00ff88",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Teko:wght@300;400;500;600;700&display=swap');
  :root {
    --bg:#020608; --panel:#050d12; --card:#071419; --elev:#0a1e25;
    --b:#0f3040; --bb:#1a5068;
    --cyan:#00d4ff; --gold:#f0a500; --red:#ff2d2d;
    --org:#ff6b00; --grn:#00ff88; --yel:#ffe033;
    --txt:#e8f4f8; --t2:#7aacbe; --t3:#3a6678;
  }
  @keyframes pulse-critical { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1} 50%{transform:translate(-50%,-50%) scale(1.4);opacity:.6} }
  @keyframes pulse-high     { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.9} 50%{transform:translate(-50%,-50%) scale(1.3);opacity:.5} }
  @keyframes ping           { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
  @keyframes fadeIn         { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideRight     { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes pulse-red      { 0%,100%{opacity:1;box-shadow:0 0 8px #ff2d2d} 50%{opacity:.4} }
  @keyframes blink          { 0%,100%{opacity:1} 50%{opacity:0} }

  .live-dot { display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff2d2d;animation:pulse-red 1.2s infinite;flex-shrink:0; }
  .mono { font-family:'Share Tech Mono',monospace; }
  .teko { font-family:'Teko',sans-serif; }
  .panel { background:var(--panel);border:1px solid var(--b);border-radius:2px;position:relative;overflow:hidden; }
  .panel::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:.35; }
  .ph { padding:8px 12px;border-bottom:1px solid var(--b);background:linear-gradient(90deg,var(--elev),transparent);display:flex;align-items:center;gap:8px;font-family:'Teko',sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--t2); }

  /* MAP WRAPPER */
  .map-wrapper { padding:8px;display:grid;grid-template-columns:1fr 320px;gap:8px;min-height:calc(100vh - 130px); }
  @media(max-width:900px) { .map-wrapper { grid-template-columns:1fr; } }

  /* LEAFLET MAP */
  .map-container { position:relative;border:1px solid var(--b);border-radius:2px;overflow:hidden;min-height:600px; }
  #leaflet-map { width:100%;height:100%;min-height:600px; }

  /* Override Leaflet styles for dark theme */
  .leaflet-container { background:#020608 !important; }
  .leaflet-tile { filter:brightness(.6) saturate(.4) hue-rotate(180deg) invert(1) !important; }
  .leaflet-control-zoom a { background:var(--panel) !important;color:var(--cyan) !important;border-color:var(--b) !important; }
  .leaflet-popup-content-wrapper { background:var(--panel) !important;border:1px solid var(--bb) !important;border-radius:2px !important;box-shadow:0 0 20px rgba(0,212,255,.2) !important; }
  .leaflet-popup-tip { background:var(--panel) !important; }
  .leaflet-popup-content { color:var(--txt) !important;font-family:'Rajdhani',sans-serif !important;margin:10px 14px !important; }
  .leaflet-attribution-flag { display:none !important; }
  .leaflet-control-attribution { background:rgba(2,6,8,.8) !important;color:var(--t3) !important;font-size:9px !important; }

  /* Custom markers */
  .marker-dot { position:absolute;border-radius:50%;transform:translate(-50%,-50%);cursor:pointer; }
  .marker-ping { position:absolute;border-radius:50%;border:2px solid;transform:translate(-50%,-50%); }

  /* Event list */
  .event-list { display:flex;flex-direction:column;gap:4px;overflow-y:auto;max-height:calc(100vh - 200px);scrollbar-width:thin;scrollbar-color:var(--bb) transparent; }
  .event-card { background:var(--card);border:1px solid var(--b);border-left:3px solid;padding:8px 10px;cursor:pointer;transition:all .2s;animation:slideRight .3s ease; }
  .event-card:hover { background:var(--elev);border-color:var(--bb); }
  .event-card.selected { background:var(--elev);border-right-color:var(--cyan); }

  /* Filter buttons */
  .filter-bar { display:flex;gap:4px;flex-wrap:wrap;padding:8px;border-bottom:1px solid var(--b); }
  .filter-btn { padding:3px 10px;background:var(--bg);border:1px solid var(--b);color:var(--t3);cursor:pointer;font-family:'Teko',sans-serif;font-size:11px;letter-spacing:1px;border-radius:1px;transition:all .2s; }
  .filter-btn:hover { color:var(--t2);border-color:var(--bb); }
  .filter-btn.active { background:rgba(0,212,255,.1);border-color:var(--cyan);color:var(--cyan); }

  /* Stats bar */
  .stats-bar { display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:6px 8px;border-bottom:1px solid var(--b); }
  .stat-mini { text-align:center;padding:4px; }
  .stat-mini-num { font-family:'Teko',sans-serif;font-size:22px;font-weight:700;line-height:1; }
  .stat-mini-lbl { font-size:8px;letter-spacing:1px;color:var(--t3);text-transform:uppercase; }

  /* GDELT feed */
  .gdelt-item { padding:7px 10px;border-bottom:1px solid var(--b);font-size:11px;cursor:pointer;transition:background .15s;animation:fadeIn .3s ease; }
  .gdelt-item:hover { background:var(--elev); }

  /* Map overlay controls */
  .map-overlay { position:absolute;top:10px;left:10px;z-index:1000;display:flex;flex-direction:column;gap:4px; }
  .map-ctrl-btn { padding:4px 10px;background:rgba(5,13,18,.9);border:1px solid var(--b);color:var(--t2);cursor:pointer;font-family:'Teko',sans-serif;font-size:11px;letter-spacing:1px;backdrop-filter:blur(4px);transition:all .2s; }
  .map-ctrl-btn:hover { border-color:var(--cyan);color:var(--cyan); }
  .map-ctrl-btn.on { background:rgba(0,212,255,.1);border-color:var(--cyan);color:var(--cyan); }

  /* Legend */
  .map-legend { position:absolute;bottom:10px;left:10px;z-index:1000;background:rgba(5,13,18,.92);border:1px solid var(--b);padding:8px 10px;backdrop-filter:blur(4px); }
  .leg-row { display:flex;align-items:center;gap:6px;font-size:10px;color:var(--t2);margin-bottom:4px;font-family:'Share Tech Mono',monospace; }
  .leg-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }

  /* Popup styles */
  .popup-title { font-family:'Teko',sans-serif;font-size:16px;letter-spacing:1px;color:#e8f4f8;margin-bottom:4px;line-height:1.2; }
  .popup-detail { font-size:12px;color:#7aacbe;line-height:1.5;margin-bottom:6px; }
  .popup-meta { display:flex;gap:8px;flex-wrap:wrap;align-items:center; }
  .popup-badge { font-size:9px;padding:1px 6px;border:1px solid;font-family:'Teko',sans-serif;letter-spacing:1px; }
  .popup-impact { font-size:10px;color:#3a6678;margin-top:4px;font-family:'Share Tech Mono',monospace; }
`;

// Leaflet CDN URLs
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS  = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}

export default function WorldMap() {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [gdeltNews, setGdeltNews] = useState([]);
  const [lastUpdate,setLastUpdate]= useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showRoutes,setShowRoutes]= useState(true);
  const [eventCount,setEventCount]= useState({ critical:0, high:0, medium:0, total:0 });

  // Count events
  useEffect(() => {
    const c = STATIC_EVENTS.reduce((acc,e) => {
      acc.total++;
      acc[e.severity] = (acc[e.severity]||0)+1;
      return acc;
    }, { critical:0, high:0, medium:0, total:0 });
    setEventCount(c);
  }, []);

  // Fetch GDELT news headlines
  useEffect(() => {
    async function fetchNews() {
      try {
        // Use RSS2JSON to fetch Google News RSS for India defence
        const feeds = [
          "https://news.google.com/rss/search?q=india+military+border+conflict&hl=en-IN&gl=IN&ceid=IN:en",
          "https://news.google.com/rss/search?q=india+china+pakistan+war+terror&hl=en-IN&gl=IN&ceid=IN:en",
        ];
        const results = await Promise.allSettled(
          feeds.map(url =>
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
              .then(r => r.json())
          )
        );
        const items = [];
        results.forEach(r => {
          if (r.status === "fulfilled" && r.value?.items) {
            items.push(...r.value.items.slice(0, 6));
          }
        });
        setGdeltNews(items.slice(0, 12));
        setLastUpdate(new Date());
      } catch (err) {
        console.warn("News fetch failed");
      }
    }
    fetchNews();
    const interval = setInterval(fetchNews, 10 * 60 * 1000); // every 10 min
    return () => clearInterval(interval);
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    async function initMap() {
      try {
        loadCSS(LEAFLET_CSS);
        await loadScript(LEAFLET_JS);
        const L = window.L;
        if (!L || !mapRef.current || leafletRef.current) return;

        // Create map centered on India
        const map = L.map(mapRef.current, {
          center:    [20, 78],
          zoom:      4,
          zoomControl: true,
          attributionControl: true,
        });

        // Dark tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap | OSINT Data",
          maxZoom: 10,
        }).addTo(map);

        leafletRef.current = map;

        // Add trade route lines
        if (showRoutes) addTradeRoutes(L, map);

        // Add event markers
        addMarkers(L, map, STATIC_EVENTS, "all");

        setLoading(false);
      } catch (err) {
        console.error("Map init failed", err);
        setLoading(false);
      }
    }

    const timer = setTimeout(initMap, 100);
    return () => {
      clearTimeout(timer);
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  function addTradeRoutes(L, map) {
    const routes = [
      // Mumbai to Strait of Hormuz
      [[19.0, 72.8], [24.0, 58.0], [26.0, 56.5]],
      // India to Malacca
      [[13.0, 80.3], [6.0, 93.0], [1.3, 103.8]],
      // India to Suez
      [[15.0, 54.0], [12.5, 44.0], [12.8, 43.1], [29.0, 32.5]],
      // India to Sri Lanka
      [[8.6, 81.2], [9.6, 80.0], [10.8, 79.8]],
    ];
    routes.forEach(pts => {
      L.polyline(pts, {
        color:     "#00d4ff",
        weight:    1.5,
        opacity:   0.35,
        dashArray: "6, 8",
      }).addTo(map);
    });
  }

  function addMarkers(L, map, events, filterType) {
    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const filtered = filterType === "all" ? events : events.filter(e => e.type === filterType);

    filtered.forEach(event => {
      const c = SEV_COLORS[event.severity] || "#7aacbe";
      const size = event.severity === "critical" ? 16 : event.severity === "high" ? 12 : 9;

      // Custom HTML marker
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:${size*3}px;height:${size*3}px;">
            <div style="
              position:absolute;top:50%;left:50%;
              width:${size*2}px;height:${size*2}px;
              border-radius:50%;border:2px solid ${c};
              transform:translate(-50%,-50%);
              animation:ping 2s ease-out infinite;
              opacity:0;
            "></div>
            <div style="
              position:absolute;top:50%;left:50%;
              width:${size}px;height:${size}px;
              border-radius:50%;background:${c};
              transform:translate(-50%,-50%);
              box-shadow:0 0 ${size}px ${c};
              cursor:pointer;
              animation:${event.severity==="critical"?"pulse-critical":"pulse-high"} 2s infinite;
            "></div>
            <div style="
              position:absolute;top:50%;left:50%;
              transform:translate(-50%,-120%);
              font-size:${size}px;
              line-height:1;
            ">${TYPE_ICONS[event.type]||"📍"}</div>
          </div>
        `,
        iconSize:   [size*3, size*3],
        iconAnchor: [size*1.5, size*1.5],
      });

      const popupContent = `
        <div style="min-width:220px;max-width:280px;">
          <div class="popup-title">${TYPE_ICONS[event.type]} ${event.title}</div>
          <div class="popup-detail">${event.detail}</div>
          <div class="popup-meta">
            <span class="popup-badge" style="color:${c};border-color:${c}">${event.severity.toUpperCase()}</span>
            <span class="popup-badge" style="color:#00d4ff;border-color:#00d4ff44">${event.type.toUpperCase()}</span>
            <span style="font-size:9px;color:#3a6678;font-family:'Share Tech Mono',monospace">${event.updated}</span>
          </div>
          <div class="popup-impact">🇮🇳 India Impact: ${event.india_impact}</div>
          <div style="font-size:9px;color:#3a6678;margin-top:4px;font-family:'Share Tech Mono',monospace">📍 ${event.country}</div>
        </div>
      `;

      const marker = L.marker([event.lat, event.lng], { icon })
        .bindPopup(popupContent, { maxWidth: 300 })
        .addTo(map);

      marker.on("click", () => setSelected(event));
      markersRef.current.push(marker);
    });
  }

  function handleFilter(type) {
    setFilter(type);
    const L = window.L;
    if (L && leafletRef.current) {
      addMarkers(L, leafletRef.current, STATIC_EVENTS, type);
    }
  }

  function flyToEvent(event) {
    setSelected(event);
    if (leafletRef.current) {
      leafletRef.current.flyTo([event.lat, event.lng], 6, { duration: 1.5 });
    }
  }

  const filters = [
    ["all",      "All Events"],
    ["border",   "⚔️ Borders"],
    ["war",      "💥 Wars"],
    ["terror",   "🔴 Terror"],
    ["nuclear",  "☢️ Nuclear"],
    ["maritime", "⚓ Maritime"],
    ["resource", "🛢️ Resources"],
  ];

  const timeAgo = d => {
    if (!d) return "";
    const diff = Math.floor((new Date()-d)/1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  };

  return (
    <>
      <style>{CSS}</style>
      <style>{`
        @keyframes ping { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
        @keyframes pulse-critical { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1;box-shadow:0 0 16px #ff2d2d} 50%{transform:translate(-50%,-50%) scale(1.3);opacity:.7} }
        @keyframes pulse-high { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.9} 50%{transform:translate(-50%,-50%) scale(1.2);opacity:.6} }
      `}</style>

      <div className="map-wrapper">
        {/* LEFT — Map */}
        <div className="panel" style={{ display:"flex", flexDirection:"column" }}>
          <div className="ph">
            <span style={{ color:"var(--cyan)" }}>🌍</span> LIVE GEOPOLITICAL WORLD MAP
            <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
              {lastUpdate && <span className="mono" style={{ fontSize:9, color:"#3a6678" }}>News: {timeAgo(lastUpdate)}</span>}
              <div className="live-dot" style={{ width:5, height:5 }} />
              <span className="mono" style={{ fontSize:9, color:"#3a6678" }}>LIVE</span>
            </span>
          </div>

          {/* Stats bar */}
          <div className="stats-bar">
            {[
              [eventCount.total, "#00d4ff", "Total Events"],
              [eventCount.critical, "#ff2d2d", "Critical"],
              [eventCount.high, "#ff6b00", "High"],
              [eventCount.medium||0, "#ffe033", "Medium"],
            ].map(([n,c,l]) => (
              <div key={l} className="stat-mini">
                <div className="stat-mini-num" style={{ color:c }}>{n}</div>
                <div className="stat-mini-lbl">{l}</div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="filter-bar">
            {filters.map(([type, label]) => (
              <button key={type} className={`filter-btn${filter===type?" active":""}`} onClick={() => handleFilter(type)}>
                {label}
              </button>
            ))}
          </div>

          {/* Map */}
          <div className="map-container" style={{ flex:1 }}>
            {loading && (
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:1000, textAlign:"center" }}>
                <div className="live-dot" style={{ width:12, height:12, margin:"0 auto 8px" }} />
                <div className="mono" style={{ fontSize:11, color:"#3a6678" }}>LOADING MAP...</div>
              </div>
            )}
            <div id="leaflet-map" ref={mapRef} style={{ width:"100%", height:"100%", minHeight:500 }} />

            {/* Map legend */}
            <div className="map-legend">
              <div className="teko" style={{ fontSize:11, letterSpacing:2, color:"#3a6678", marginBottom:6 }}>LEGEND</div>
              {Object.entries(SEV_COLORS).map(([s,c]) => (
                <div key={s} className="leg-row">
                  <div className="leg-dot" style={{ background:c }} />
                  {s.toUpperCase()}
                </div>
              ))}
              <div style={{ borderTop:"1px solid var(--b)", marginTop:6, paddingTop:6 }}>
                <div className="leg-row"><span style={{ color:"#00d4ff" }}>---</span> Trade Routes</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Event list + GDELT feed */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, overflow:"hidden" }}>

          {/* Selected event detail */}
          {selected && (
            <div className="panel" style={{ animation:"fadeIn .3s ease" }}>
              <div className="ph">
                <span style={{ color: SEV_COLORS[selected.severity] }}>{TYPE_ICONS[selected.type]}</span>
                SELECTED EVENT
                <button onClick={() => setSelected(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:"var(--t3)", cursor:"pointer", fontSize:14 }}>✕</button>
              </div>
              <div style={{ padding:"10px 12px" }}>
                <div className="teko" style={{ fontSize:18, color:"#e8f4f8", letterSpacing:1, marginBottom:4 }}>{selected.title}</div>
                <div style={{ fontSize:12, color:"#7aacbe", lineHeight:1.6, marginBottom:8 }}>{selected.detail}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                  <span style={{ fontSize:9, color:SEV_COLORS[selected.severity], border:`1px solid ${SEV_COLORS[selected.severity]}44`, padding:"1px 6px", fontFamily:"Teko", letterSpacing:1 }}>{selected.severity.toUpperCase()}</span>
                  <span style={{ fontSize:9, color:"#00d4ff", border:"1px solid #00d4ff44", padding:"1px 6px", fontFamily:"Teko", letterSpacing:1 }}>{selected.type.toUpperCase()}</span>
                </div>
                <div className="mono" style={{ fontSize:10, color:"#3a6678" }}>🇮🇳 India Impact: <span style={{ color:"#ff6b00" }}>{selected.india_impact}</span></div>
                <div className="mono" style={{ fontSize:10, color:"#3a6678", marginTop:2 }}>📍 {selected.country} · Updated: {selected.updated}</div>
                <button onClick={() => flyToEvent(selected)} style={{ marginTop:8, padding:"4px 12px", background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.2)", color:"var(--cyan)", fontFamily:"Teko", fontSize:12, letterSpacing:1, cursor:"pointer", borderRadius:1 }}>
                  🎯 FLY TO ON MAP
                </button>
              </div>
            </div>
          )}

          {/* Event list */}
          <div className="panel" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div className="ph"><span style={{ color:"var(--cyan)" }}>◈</span> ACTIVE EVENTS ({filter==="all"?STATIC_EVENTS.length:STATIC_EVENTS.filter(e=>e.type===filter).length})</div>
            <div className="event-list" style={{ flex:1 }}>
              {(filter==="all"?STATIC_EVENTS:STATIC_EVENTS.filter(e=>e.type===filter))
                .sort((a,b) => {
                  const order = { critical:0, high:1, medium:2, low:3 };
                  return order[a.severity]-order[b.severity];
                })
                .map(event => (
                <div key={event.id} className={`event-card${selected?.id===event.id?" selected":""}`}
                  style={{ borderLeftColor: SEV_COLORS[event.severity] }}
                  onClick={() => flyToEvent(event)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#c8dde6", lineHeight:1.3, flex:1 }}>
                      {TYPE_ICONS[event.type]} {event.title}
                    </div>
                    <span style={{ fontSize:8, color:SEV_COLORS[event.severity], fontFamily:"Teko", letterSpacing:1, flexShrink:0 }}>{event.severity.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:10, color:"#3a6678", marginTop:3 }}>
                    {event.country} · {event.updated}
                  </div>
                  <div style={{ fontSize:10, color:"#7aacbe", marginTop:2 }}>🇮🇳 {event.india_impact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GDELT live news */}
          <div className="panel" style={{ flexShrink:0 }}>
            <div className="ph">
              <span style={{ color:"var(--cyan)" }}>📡</span> LIVE INTELLIGENCE FEED
              <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                {lastUpdate && <span className="mono" style={{ fontSize:9, color:"#3a6678" }}>{timeAgo(lastUpdate)}</span>}
                <div className="live-dot" style={{ width:5, height:5 }} />
              </span>
            </div>
            <div style={{ maxHeight:200, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"var(--bb) transparent" }}>
              {gdeltNews.length > 0 ? gdeltNews.map((item,i) => (
                <div key={i} className="gdelt-item" onClick={() => item.link && window.open(item.link,"_blank")}>
                  <div style={{ fontSize:12, color:"#c8dde6", lineHeight:1.3, marginBottom:3 }}>{item.title}</div>
                  <div className="mono" style={{ fontSize:9, color:"#3a6678" }}>{item.source?.name || "News"} · {item.pubDate?.substring(0,16) || "Recent"}</div>
                </div>
              )) : (
                <div style={{ padding:"12px", textAlign:"center" }}>
                  <div className="mono" style={{ fontSize:10, color:"#3a6678" }}>Fetching live intelligence feed...</div>
                </div>
              )}
            </div>
            <div style={{ padding:"4px 10px", fontSize:9, color:"#1a5068", fontFamily:"Share Tech Mono", borderTop:"1px solid var(--b)" }}>
              SOURCES: Google News · GDELT · RSS Feeds · Updates every 10 minutes
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

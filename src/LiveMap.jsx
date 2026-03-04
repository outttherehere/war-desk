// src/LiveMap.jsx
// Renders Leaflet map with:
//   - Static baseline conflict markers (always visible)
//   - Live GDELT events (new articles plotted as they arrive)
//   - Different visual treatment for live vs static markers
//   - Auto-refreshes markers when GDELT data updates

import { useEffect, useRef, useState } from "react";
import { useGDELT } from "./useGDELT";

const SEV_COLOR = {
  critical: "#ff2d2d",
  high:     "#ff6b00",
  medium:   "#ffe033",
  low:      "#00d4ff",
};

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

function makeMarkerHtml(event, isSmall = false) {
  const c   = SEV_COLOR[event.severity] || "#7aacbe";
  const sz  = event.severity === "critical" ? (isSmall ? 10 : 14)
            : event.severity === "high"     ? (isSmall ?  8 : 10)
            : (isSmall ? 6 : 7);

  if (event.isLive) {
    // LIVE GDELT events: pulsing square (news icon aesthetic)
    return `
      <div style="position:relative;width:${sz*3}px;height:${sz*3}px">
        <div style="position:absolute;top:50%;left:50%;
          width:${sz*2}px;height:${sz*2}px;
          border:1.5px solid ${c};
          transform:translate(-50%,-50%);
          animation:ping 2s ease-out infinite;opacity:0;
          border-radius:2px"></div>
        <div style="position:absolute;top:50%;left:50%;
          width:${sz}px;height:${sz}px;
          background:${c};
          transform:translate(-50%,-50%) rotate(45deg);
          box-shadow:0 0 ${sz}px ${c};
          animation:${event.severity==="critical"?"pcrit":"phigh"} 2s infinite;
          border-radius:1px"></div>
        <div style="position:absolute;top:50%;left:50%;
          transform:translate(-50%,-190%);font-size:${sz-1}px;line-height:1">
          📰
        </div>
      </div>`;
  } else {
    // STATIC events: pulsing circle (permanent hotspot)
    return `
      <div style="position:relative;width:${sz*3}px;height:${sz*3}px">
        <div style="position:absolute;top:50%;left:50%;
          width:${sz*2.2}px;height:${sz*2.2}px;
          border-radius:50%;border:2px solid ${c};
          transform:translate(-50%,-50%);
          animation:ping 2s ease-out infinite;opacity:0"></div>
        <div style="position:absolute;top:50%;left:50%;
          width:${sz}px;height:${sz}px;
          border-radius:50%;background:${c};
          transform:translate(-50%,-50%);
          box-shadow:0 0 ${sz}px ${c};
          animation:${event.severity==="critical"?"pcrit":"phigh"} 2s infinite"></div>
        <div style="position:absolute;top:50%;left:50%;
          transform:translate(-50%,-170%);font-size:${sz}px;line-height:1">
          ${event.type}
        </div>
      </div>`;
  }
}

function makePopupHtml(event) {
  const c   = SEV_COLOR[event.severity] || "#7aacbe";
  const liveBadge = event.isLive
    ? `<span style="font-size:9px;background:rgba(0,212,255,.15);border:1px solid #00d4ff44;color:#00d4ff;padding:1px 6px;font-family:Share Tech Mono,monospace;letter-spacing:1px;margin-left:6px">GDELT LIVE</span>`
    : `<span style="font-size:9px;background:rgba(255,107,0,.1);border:1px solid #ff6b0044;color:#ff6b00;padding:1px 6px;font-family:Share Tech Mono,monospace;letter-spacing:1px;margin-left:6px">BASELINE</span>`;

  return `
    <div style="min-width:220px;max-width:290px;font-family:Rajdhani,sans-serif">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;flex-wrap:wrap">
        <b style="font-family:Teko,sans-serif;font-size:16px;color:#e8f4f8;line-height:1.2">${event.type} ${event.title}</b>
        ${liveBadge}
      </div>
      <div style="font-size:12px;color:#7aacbe;line-height:1.5;margin-bottom:7px">${event.detail}</div>
      <div style="display:flex;gap:6px;margin-bottom:5px;flex-wrap:wrap">
        <span style="font-size:9px;color:${c};border:1px solid ${c}44;padding:1px 6px;font-family:Teko,sans-serif;letter-spacing:1px">${event.severity.toUpperCase()}</span>
        <span style="font-size:9px;color:#3a6678;font-family:Share Tech Mono,monospace">${event.updated}</span>
      </div>
      <div style="font-size:10px;color:#3a6678;font-family:Share Tech Mono,monospace;margin-top:3px">
        🇮🇳 India: ${event.india} · ${event.country}
      </div>
      ${event.url && event.url !== "#" ? `<a href="${event.url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:7px;font-size:10px;color:#00d4ff;font-family:Share Tech Mono,monospace;text-decoration:none;border:1px solid #00d4ff33;padding:2px 8px">→ READ SOURCE</a>` : ""}
    </div>`;
}

const CSS = `
  .livemap-panel { position:relative;background:#050d12;border:1px solid #0f3040;border-radius:2px;overflow:hidden;display:flex;flex-direction:column; }
  .livemap-panel::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#00d4ff,transparent);opacity:.35; }
  .map-header { padding:9px 14px;border-bottom:1px solid #0f3040;background:linear-gradient(90deg,#0a1e25,transparent);display:flex;align-items:center;gap:9px;flex-wrap:wrap;flex-shrink:0; }
  .map-wrap { flex:1;position:relative;min-height:320px; }
  #live-map { width:100%;height:100%;min-height:320px; }

  /* Leaflet dark theme */
  .leaflet-container { background:#020608 !important; }
  .leaflet-tile { filter:brightness(.52) saturate(.25) hue-rotate(185deg) invert(1) !important; }
  .leaflet-control-zoom a { background:#050d12 !important;color:#00d4ff !important;border-color:#0f3040 !important; }
  .leaflet-popup-content-wrapper { background:#050d12 !important;border:1px solid #1a5068 !important;border-radius:2px !important;box-shadow:0 0 24px rgba(0,212,255,.2) !important; }
  .leaflet-popup-tip { background:#050d12 !important; }
  .leaflet-popup-content { color:#e8f4f8 !important;margin:10px 14px !important; }
  .leaflet-control-attribution { background:rgba(2,6,8,.85) !important;color:#1a5068 !important;font-size:8px !important; }
  .leaflet-attribution-flag { display:none !important; }

  /* Map legend */
  .map-legend { position:absolute;bottom:10px;left:10px;z-index:1000;background:rgba(5,13,18,.94);border:1px solid #0f3040;padding:8px 10px;pointer-events:none; }
  .leg-row { display:flex;align-items:center;gap:6px;font-size:9px;color:#7aacbe;margin-bottom:3px;font-family:Share Tech Mono,monospace; }
  .leg-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0; }
  .leg-sq  { width:7px;height:7px;transform:rotate(45deg);flex-shrink:0; }

  /* GDELT status bar */
  .gdelt-bar { padding:5px 14px;border-top:1px solid #0f3040;background:#020608;display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex-shrink:0; }

  /* Live event list */
  .live-events { border-top:1px solid #0f3040;max-height:200px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#1a5068 transparent;flex-shrink:0; }
  .live-event-row { padding:6px 14px;border-bottom:1px solid #071419;display:flex;gap:8px;align-items:flex-start;cursor:pointer;transition:background .15s; }
  .live-event-row:hover { background:#071419; }
  .live-tag { font-size:8px;font-family:Share Tech Mono,monospace;padding:1px 5px;border:1px solid;border-radius:1px;flex-shrink:0;margin-top:2px; }

  @keyframes pulse-live { 0%,100%{opacity:1;box-shadow:0 0 6px #ff2d2d} 50%{opacity:.3} }
  .live-dot { display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff2d2d;animation:pulse-live 1.2s infinite;flex-shrink:0; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .spinner { width:10px;height:10px;border:2px solid #0f3040;border-top-color:#00d4ff;border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0; }

  /* New event flash */
  @keyframes new-flash { 0%{background:rgba(0,212,255,.15)} 100%{background:transparent} }
  .new-event { animation:new-flash 2s ease-out forwards; }
`;

export default function LiveMap({ height = 380, showEventList = true }) {
  const mapRef    = useRef(null);
  const leafRef   = useRef(null);
  const layersRef = useRef({ static: [], live: [] });
  const [selected, setSelected]   = useState(null);
  const [timer,    setTimer]      = useState("--:--");

  const {
    events, gdeltEvents, sindoorSignal,
    loading, error, lastFetch, liveCount,
    refetch, timeUntilNext, fetchCount,
  } = useGDELT();

  // Init map once
  useEffect(() => {
    let mounted = true;
    async function init() {
      const L = await loadLeaflet();
      if (!mounted || !mapRef.current || leafRef.current) return;

      const map = L.map(mapRef.current, { center:[20,65], zoom:3, zoomControl:true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:"© OpenStreetMap | GDELT OSINT",
        maxZoom:10,
      }).addTo(map);
      leafRef.current = map;

      // Trade routes
      [
        [[19,72.8],[24,58],[26.5,55]],
        [[13,80.3],[6,93],[1.3,103.8]],
        [[15,54],[12.5,44],[29,32.5]],
        [[8.6,81.2],[7,80],[5,73]],
      ].forEach(pts => L.polyline(pts, { color:"#00d4ff", weight:1.2, opacity:.22, dashArray:"5,9" }).addTo(map));
    }
    init();
    return () => { mounted=false; if(leafRef.current){ leafRef.current.remove(); leafRef.current=null; } };
  }, []);

  // Refresh markers whenever events change
  useEffect(() => {
    const L = window.L;
    if (!L || !leafRef.current) return;
    const map = leafRef.current;

    // Remove old live markers (don't remove static ones)
    layersRef.current.live.forEach(m => map.removeLayer(m));
    layersRef.current.live = [];

    // Remove old static markers on first load then re-add
    if (fetchCount <= 1) {
      layersRef.current.static.forEach(m => map.removeLayer(m));
      layersRef.current.static = [];
    }

    events.forEach(ev => {
      const icon = L.divIcon({
        className: "",
        html: makeMarkerHtml(ev),
        iconSize:   [ev.severity === "critical" ? 42 : 30, ev.severity === "critical" ? 42 : 30],
        iconAnchor: [ev.severity === "critical" ? 21 : 15, ev.severity === "critical" ? 21 : 15],
      });

      const marker = L.marker([ev.lat, ev.lng], { icon })
        .bindPopup(makePopupHtml(ev), { maxWidth:300, className:"dark-popup" })
        .addTo(map);

      marker.on("click", () => setSelected(ev));

      if (ev.isLive) {
        layersRef.current.live.push(marker);
      } else {
        if (fetchCount <= 1) layersRef.current.static.push(marker);
      }
    });
  }, [events, fetchCount]);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setTimer(timeUntilNext()), 1000);
    return () => clearInterval(t);
  }, [lastFetch, timeUntilNext]);

  const timeStr = lastFetch
    ? lastFetch.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:false }) + " IST"
    : "--:--";

  return (
    <>
      <style>{CSS}</style>
      <style>{`
        @keyframes ping  { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
        @keyframes pcrit { 0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 16px #ff2d2d} 50%{transform:translate(-50%,-50%) scale(1.5)} }
        @keyframes phigh { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.3)} }
      `}</style>

      <div className="livemap-panel" style={{ height }}>
        {/* Header */}
        <div className="map-header">
          <span style={{ color:"#00d4ff", fontSize:14 }}>🌍</span>
          <span style={{ fontFamily:"Teko,sans-serif", fontSize:14, letterSpacing:2, textTransform:"uppercase", color:"#7aacbe" }}>
            LIVE GEOPOLITICAL MAP
          </span>

          {loading
            ? <div className="spinner"/>
            : <div className="live-dot"/>
          }

          <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#3a6678" }}>
            {loading ? "FETCHING GDELT..." : `${liveCount} LIVE + ${events.length - liveCount} BASELINE`}
          </span>

          {error && (
            <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#ff6b00" }}>
              ⚠ GDELT unavailable — showing baseline
            </span>
          )}

          <span style={{ marginLeft:"auto", fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#1a5068" }}>
            NEXT UPDATE: {timer}
          </span>

          <button onClick={refetch} style={{ background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.2)", color:"#00d4ff", fontFamily:"Teko,sans-serif", fontSize:11, letterSpacing:2, padding:"2px 10px", cursor:"pointer", borderRadius:1 }}>
            ↺ REFRESH
          </button>
        </div>

        {/* Map */}
        <div className="map-wrap" style={{ flex:1 }}>
          <div id="live-map" ref={mapRef} style={{ width:"100%", height:"100%", minHeight: height - 100 }}/>

          {/* Legend */}
          <div className="map-legend">
            <div style={{ fontFamily:"Teko,sans-serif", fontSize:10, letterSpacing:2, color:"#1a5068", marginBottom:5 }}>SEVERITY</div>
            {Object.entries(SEV_COLOR).map(([s,c]) => (
              <div key={s} className="leg-row">
                <div className="leg-dot" style={{ background:c }}/>
                {s.toUpperCase()}
              </div>
            ))}
            <div style={{ borderTop:"1px solid #0f3040", marginTop:5, paddingTop:5 }}>
              <div className="leg-row"><div className="leg-dot" style={{ background:"#00d4ff", borderRadius:0, transform:"rotate(45deg)" }}/> GDELT LIVE</div>
              <div className="leg-row"><div className="leg-dot" style={{ background:"#ff6b00" }}/> BASELINE</div>
              <div className="leg-row" style={{ marginTop:3 }}><span style={{ color:"#00d4ff", marginRight:5, fontSize:10 }}>---</span>Trade routes</div>
            </div>
          </div>
        </div>

        {/* GDELT status bar */}
        <div className="gdelt-bar">
          <div className="live-dot" style={{ width:5, height:5 }}/>
          <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#3a6678" }}>
            GDELT · Last fetch: {timeStr}
          </span>
          {sindoorSignal && (
            <>
              <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#1a5068" }}>|</span>
              <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color: sindoorSignal.critical_24h > 2 ? "#ff2d2d" : "#ff6b00" }}>
                SINDOOR SIGNAL: {sindoorSignal.critical_24h} critical + {sindoorSignal.high_24h} high events (24h)
              </span>
            </>
          )}
          <span style={{ marginLeft:"auto", fontFamily:"Share Tech Mono,monospace", fontSize:8, color:"#1a5068" }}>
            GDELT 2.0 · Updates every 15min · Open-source intelligence
          </span>
        </div>

        {/* Live event list */}
        {showEventList && gdeltEvents.length > 0 && (
          <div className="live-events">
            <div style={{ padding:"5px 14px 3px", fontFamily:"Teko,sans-serif", fontSize:11, letterSpacing:2, color:"#1a5068", borderBottom:"1px solid #071419" }}>
              GDELT LIVE EVENTS — {gdeltEvents.length} ARTICLES PLOTTED
            </div>
            {gdeltEvents.slice(0, 8).map((ev, i) => {
              const c = SEV_COLOR[ev.severity] || "#7aacbe";
              return (
                <div key={ev.id} className={`live-event-row${i === 0 && fetchCount > 1 ? " new-event" : ""}`}
                  onClick={() => { setSelected(ev); if(leafRef.current) leafRef.current.flyTo([ev.lat, ev.lng], 5, { duration:1.2 }); }}>
                  <span className="live-tag" style={{ color:c, borderColor:`${c}44` }}>{ev.severity.slice(0,4).toUpperCase()}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, color:"#c8dde6", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
                    <div style={{ fontSize:9, color:"#1a5068", fontFamily:"Share Tech Mono,monospace", marginTop:1 }}>
                      {ev.country} · {ev.updated} · {ev.india === "Relevant" ? "🇮🇳 India-relevant" : "Global"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

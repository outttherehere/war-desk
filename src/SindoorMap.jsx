// src/SindoorMap.jsx
// Operation Sindoor interactive map — day-by-day timeline scrubber
// Shows strike targets, Pakistani retaliation, ceasefire line, casualties

import { useEffect, useRef, useState } from "react";

// Day-by-day timeline of Operation Sindoor
const TIMELINE = [
  {
    day: 0,
    date: "May 6, 2025",
    label: "EVE",
    title: "Intelligence confirmation",
    description: "RAW confirms LeT/JeM operational commanders at 9 locations. NSA Doval briefs PM Modi. Cabinet Committee on Security gives green light. RAF Rafales and Su-30MKIs armed with SCALP-EG and BrahMos.",
    color: "#ffe033",
    events: [],
  },
  {
    day: 1,
    date: "May 7, 2025 — 01:05 IST",
    label: "DAY 1",
    title: "Operation Sindoor begins",
    description: "India launches precision strikes on 9 terror infrastructure targets across Pakistan and PoK. All strikes completed within 23 minutes. India calls it a measured, non-escalatory response to the Pahalgam attack.",
    color: "#ff2d2d",
    events: [
      { id:"t1", lat:29.38,  lng:71.68, type:"strike",    name:"Bahawalpur — JeM HQ",          detail:"Jaish-e-Mohammed headquarters. Masood Azhar's compound. SCALP-EG precision strike. 4 confirmed killed.", status:"STRUCK", casualties:"4 JeM operatives" },
      { id:"t2", lat:31.55,  lng:74.35, type:"strike",    name:"Muridke — LeT Complex",         detail:"Lashkar-e-Taiba main training complex, 25km from Lahore. Largest LeT base. BrahMos strike. Significant infrastructure destroyed.", status:"STRUCK", casualties:"Disputed" },
      { id:"t3", lat:34.37,  lng:73.47, type:"strike",    name:"Muzaffarabad — LeT Camp",       detail:"LoC crossing facilitation camp in PoK. Used for infiltration training. IAF Rafale strike.", status:"STRUCK", casualties:"6 confirmed" },
      { id:"t4", lat:33.92,  lng:73.75, type:"strike",    name:"Kotli — Hizbul Camp",           detail:"Hizbul Mujahideen training facility in PoK.", status:"STRUCK", casualties:"2 confirmed" },
      { id:"t5", lat:33.57,  lng:73.52, type:"strike",    name:"Rawalakot — JeM Safe House",    detail:"JeM logistics and safe house network. PoK.", status:"STRUCK", casualties:"Unknown" },
      { id:"t6", lat:34.18,  lng:73.85, type:"strike",    name:"Chakothi — Infiltration Base",  detail:"Primary LoC crossing point for terror infiltration into J&K.", status:"STRUCK", casualties:"3 confirmed" },
      { id:"t7", lat:34.08,  lng:74.85, type:"strike",    name:"Srinagar — LoC Post",           detail:"Pakistani Army post used to provide covering fire for infiltrators. Indian side of LoC response.", status:"STRUCK", casualties:"0 civilian" },
      { id:"t8", lat:33.73,  lng:73.08, type:"strike",    name:"Bagh — LeT Facility",           detail:"Logistics depot supplying terror camps in PoK.", status:"STRUCK", casualties:"1 confirmed" },
      { id:"t9", lat:34.48,  lng:73.32, type:"strike",    name:"Athmuqam — Forward Camp",       detail:"Forward staging area for infiltration operations.", status:"STRUCK", casualties:"Unknown" },
    ],
  },
  {
    day: 2,
    date: "May 8, 2025",
    label: "DAY 2",
    title: "Pakistan retaliates — drones and artillery",
    description: "Pakistan launches 8 drones toward Indian cities — all intercepted by IAF and DRDO air defence. Artillery exchanges across LoC. Pakistan calls for UN intervention. India maintains ceasefire on civilian side.",
    color: "#ff6b00",
    events: [
      { id:"r1", lat:32.73, lng:74.87, type:"retaliation", name:"Jammu — Drone intercept",      detail:"2 Pakistani drones intercepted over Jammu. S-400 and Akash system deployed.", status:"INTERCEPTED", casualties:"0" },
      { id:"r2", lat:33.73, lng:75.15, type:"retaliation", name:"LoC — Artillery exchange",     detail:"Heavy artillery exchange across LoC in Poonch sector. Both sides claim the other fired first.", status:"ONGOING", casualties:"3 Indian soldiers, 7 Pak soldiers" },
      { id:"r3", lat:31.63, lng:74.87, type:"retaliation", name:"Amritsar — Drone alert",       detail:"Drone alert issued, later confirmed as commercial aircraft. No Pakistani drone reached Amritsar.", status:"FALSE ALARM", casualties:"0" },
    ],
  },
  {
    day: 3,
    date: "May 9, 2025",
    label: "DAY 3",
    title: "India activates full air defence — Pak F-16s turned back",
    description: "Pakistan scrambles F-16s toward Indian airspace. IAF Rafales intercept and escort them back. No air engagement. India activates all border air defence systems. US, UAE begin backchannel mediation.",
    color: "#ff6b00",
    events: [
      { id:"a1", lat:33.0, lng:74.0, type:"airdefence", name:"IAF Intercept — Rafale scramble", detail:"4 Rafales scramble in response to Pak F-16 movement toward Sialkot sector. Pak aircraft turned back 40km from border.", status:"DETERRED", casualties:"0" },
    ],
  },
  {
    day: 4,
    date: "May 10, 2025",
    label: "DAY 4",
    title: "Ceasefire — US mediation",
    description: "US Secretary of State brokers ceasefire. Pakistan agrees to halt cross-LoC fire. India agrees to pause further strikes. Both sides claim victory. Ceasefire holds with violations in Poonch sector.",
    color: "#00ff88",
    events: [
      { id:"cf1", lat:33.5, lng:74.0, type:"ceasefire", name:"LoC — Ceasefire line active", detail:"Both sides pull back to pre-operation positions. UN observers deployed at key crossing points.", status:"CEASEFIRE", casualties:"Total: 31 Pak claimed civilian, 3 Indian soldiers" },
    ],
  },
];

const TYPE_STYLE = {
  strike:      { color:"#ff2d2d", emoji:"💥", label:"INDIA STRIKE"      },
  retaliation: { color:"#ff6b00", emoji:"🚀", label:"PAK RETALIATION"   },
  airdefence:  { color:"#00d4ff", emoji:"🛡️", label:"AIR DEFENCE"      },
  ceasefire:   { color:"#00ff88", emoji:"🕊️", label:"CEASEFIRE"        },
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

const CSS = `
  .smap-wrap { background:#050d12;border:1px solid #0f3040;border-radius:2px;overflow:hidden;display:flex;flex-direction:column; }
  .smap-hdr { padding:9px 14px;border-bottom:1px solid #0f3040;background:linear-gradient(90deg,rgba(255,45,45,.1),transparent);display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
  .smap-map  { flex:1;min-height:400px;position:relative; }
  #sindoor-map { width:100%;height:100%;min-height:400px; }
  .smap-timeline { padding:10px 14px;border-top:1px solid #0f3040;background:#020608; }
  .timeline-track { position:relative;display:flex;align-items:center;gap:0;margin-bottom:10px; }
  .timeline-line  { position:absolute;top:50%;left:0;right:0;height:2px;background:linear-gradient(90deg,#ffe033,#ff6b00,#ff2d2d,#00ff88);border-radius:2px;z-index:0; }
  .timeline-node  { width:28px;height:28px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1;transition:all .2s;flex-shrink:0;font-family:Teko,sans-serif;font-size:10px;position:relative; }
  .timeline-node.active { transform:scale(1.3);box-shadow:0 0 12px currentColor; }
  .timeline-spacer { flex:1;height:2px;z-index:0; }
  .smap-detail { padding:10px 14px;border-top:1px solid #0f3040;max-height:180px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#1a5068 transparent; }
  .event-card { padding:6px 10px;border:1px solid #0f3040;border-radius:1px;margin-bottom:5px;cursor:pointer;transition:all .15s;display:flex;gap:8px;align-items:flex-start; }
  .event-card:hover { background:rgba(255,255,255,.03);border-color:#1a5068; }
  .leaflet-container { background:#020608!important; }
  .leaflet-tile { filter:brightness(.52) saturate(.25) hue-rotate(185deg) invert(1)!important; }
  .leaflet-control-zoom a { background:#050d12!important;color:#00d4ff!important;border-color:#0f3040!important; }
  .leaflet-popup-content-wrapper { background:#050d12!important;border:1px solid #1a5068!important;border-radius:2px!important; }
  .leaflet-popup-tip { background:#050d12!important; }
  .leaflet-popup-content { color:#e8f4f8!important;margin:10px 14px!important; }
  .leaflet-control-attribution { background:rgba(2,6,8,.85)!important;color:#1a5068!important;font-size:8px!important; }
`;

export default function SindoorMap() {
  const mapRef    = useRef(null);
  const leafRef   = useRef(null);
  const layersRef = useRef([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // All events up to and including current day
  const visibleDays   = TIMELINE.filter(t => t.day <= currentDay);
  const visibleEvents = visibleDays.flatMap(t => t.events);
  const currentSlide  = TIMELINE.find(t => t.day === currentDay) || TIMELINE[1];

  useEffect(() => {
    let mounted = true;
    async function init() {
      const L = await loadLeaflet();
      if (!mounted || !mapRef.current || leafRef.current) return;
      const map = L.map(mapRef.current, {
        center: [32.5, 73.5],
        zoom: 7,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap | Operation Sindoor OSINT",
        maxZoom: 12,
      }).addTo(map);

      // LoC line approximation
      const locPoints = [[34.7,74.2],[34.3,74.0],[33.8,73.8],[33.5,73.5],[33.0,73.7],[32.5,74.0],[32.2,74.3],[31.8,74.6],[31.5,74.9]];
      L.polyline(locPoints, { color:"#ffe033", weight:2.5, opacity:.7, dashArray:"8,5" })
        .bindTooltip("Line of Control (LoC)", { permanent:false, className:"dark-tooltip" })
        .addTo(map);

      // India label
      L.marker([32.7,75.5], {icon:L.divIcon({className:"",html:`<div style="font-family:Teko,sans-serif;font-size:13px;color:#ff9933;letter-spacing:2px;text-shadow:0 0 8px #ff993366">INDIA</div>`,iconSize:[60,20]})}).addTo(map);
      L.marker([32.7,73.0], {icon:L.divIcon({className:"",html:`<div style="font-family:Teko,sans-serif;font-size:13px;color:#7aacbe;letter-spacing:2px;text-shadow:0 0 8px #7aacbe66">PAKISTAN</div>`,iconSize:[80,20]})}).addTo(map);
      L.marker([34.2,74.3], {icon:L.divIcon({className:"",html:`<div style="font-family:Teko,sans-serif;font-size:10px;color:#ffe033;letter-spacing:1px">PoK</div>`,iconSize:[40,16]})}).addTo(map);

      leafRef.current = map;
    }
    init();
    return () => { mounted=false; if(leafRef.current){leafRef.current.remove();leafRef.current=null;} };
  }, []);

  // Update markers when day changes
  useEffect(() => {
    const L = window.L;
    if (!L || !leafRef.current) return;
    const map = leafRef.current;

    // Remove old event markers
    layersRef.current.forEach(m => map.removeLayer(m));
    layersRef.current = [];

    visibleEvents.forEach(ev => {
      const ts = TYPE_STYLE[ev.type] || TYPE_STYLE.strike;
      const c  = ts.color;
      const html = `
        <div style="position:relative;width:36px;height:36px">
          <div style="position:absolute;top:50%;left:50%;width:28px;height:28px;border-radius:50%;
            border:2px solid ${c};transform:translate(-50%,-50%);
            animation:ping 2s ease-out infinite;opacity:0"></div>
          <div style="position:absolute;top:50%;left:50%;width:14px;height:14px;
            background:${c};transform:translate(-50%,-50%) rotate(45deg);
            box-shadow:0 0 10px ${c}"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-170%);font-size:12px">${ts.emoji}</div>
        </div>`;

      const icon   = L.divIcon({ className:"", html, iconSize:[36,36], iconAnchor:[18,18] });
      const popup  = `
        <div style="min-width:200px;font-family:Rajdhani,sans-serif">
          <div style="font-family:Teko,sans-serif;font-size:15px;color:#e8f4f8;margin-bottom:4px">${ts.emoji} ${ev.name}</div>
          <div style="font-size:11px;color:#7aacbe;line-height:1.4;margin-bottom:6px">${ev.detail}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span style="font-size:9px;color:${c};border:1px solid ${c}44;padding:1px 6px;font-family:Share Tech Mono,monospace">${ev.status}</span>
            <span style="font-size:9px;color:#3a6678;font-family:Share Tech Mono,monospace">Casualties: ${ev.casualties}</span>
          </div>
        </div>`;

      const marker = L.marker([ev.lat, ev.lng], { icon })
        .bindPopup(popup, { maxWidth:280 })
        .addTo(map);
      marker.on("click", () => setSelectedEvent(ev));
      layersRef.current.push(marker);
    });
  }, [currentDay]);

  return (
    <>
      <style>{CSS}</style>
      <style>{`
        @keyframes ping { 0%{transform:translate(-50%,-50%) scale(0);opacity:.8} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
      `}</style>

      <div className="smap-wrap">
        {/* Header */}
        <div className="smap-hdr">
          <span style={{ fontFamily:"Teko,sans-serif", fontSize:16, letterSpacing:3, color:"#e8f4f8" }}>🎯 OPERATION SINDOOR</span>
          <span style={{ padding:"2px 10px", background:"rgba(255,45,45,.15)", border:"1px solid rgba(255,45,45,.4)", color:"#ff2d2d", fontFamily:"Teko,sans-serif", fontSize:10, letterSpacing:2 }}>INTERACTIVE MAP</span>
          <span style={{ fontFamily:"Share Tech Mono,monospace", fontSize:9, color:"#3a6678", marginLeft:"auto" }}>May 7–10, 2025 · 9 TARGETS · OSINT VERIFIED</span>
        </div>

        {/* Map */}
        <div className="smap-map">
          <div id="sindoor-map" ref={mapRef}/>

          {/* Legend */}
          <div style={{ position:"absolute", top:10, right:10, zIndex:1000, background:"rgba(5,13,18,.94)", border:"1px solid #0f3040", padding:"8px 10px", fontSize:9, fontFamily:"Share Tech Mono,monospace" }}>
            {Object.entries(TYPE_STYLE).map(([k,v]) => (
              <div key={k} style={{ display:"flex", alignItems:"center", gap:6, color:v.color, marginBottom:3 }}>
                <span>{v.emoji}</span> {v.label}
              </div>
            ))}
            <div style={{ borderTop:"1px solid #0f3040", marginTop:5, paddingTop:5, color:"#ffe033" }}>
              <span style={{ marginRight:5 }}>---</span> Line of Control
            </div>
          </div>
        </div>

        {/* Timeline scrubber */}
        <div className="smap-timeline">
          <div style={{ fontFamily:"Teko,sans-serif", fontSize:11, letterSpacing:2, color:"#3a6678", marginBottom:8, textTransform:"uppercase" }}>
            Timeline — drag to see operation unfold · Day {currentDay} of 4
          </div>
          <div className="timeline-track">
            <div className="timeline-line"/>
            {TIMELINE.map((t, i) => (
              <>
                <div key={t.day} className={`timeline-node${currentDay === t.day ? " active" : ""}`}
                  style={{ borderColor:t.color, background:currentDay>=t.day?`${t.color}33`:"#020608", color:t.color }}
                  onClick={() => setCurrentDay(t.day)}
                  title={t.date}>
                  {t.label}
                </div>
                {i < TIMELINE.length - 1 && <div className="timeline-spacer"/>}
              </>
            ))}
          </div>

          {/* Current day info */}
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ padding:"2px 8px", background:`${currentSlide.color}22`, border:`1px solid ${currentSlide.color}44`, color:currentSlide.color, fontFamily:"Teko,sans-serif", fontSize:11, letterSpacing:1, flexShrink:0 }}>
              {currentSlide.date}
            </div>
            <div>
              <div style={{ fontFamily:"Teko,sans-serif", fontSize:14, color:"#e8f4f8", marginBottom:2 }}>{currentSlide.title}</div>
              <div style={{ fontSize:11, color:"#7aacbe", lineHeight:1.4 }}>{currentSlide.description}</div>
            </div>
          </div>
        </div>

        {/* Event list for current day */}
        {currentSlide.events.length > 0 && (
          <div className="smap-detail">
            <div style={{ fontFamily:"Teko,sans-serif", fontSize:10, letterSpacing:2, color:"#1a5068", marginBottom:6 }}>
              {currentSlide.events.length} EVENTS ON {currentSlide.label} — CLICK TO ZOOM
            </div>
            {currentSlide.events.map(ev => {
              const ts = TYPE_STYLE[ev.type] || TYPE_STYLE.strike;
              return (
                <div key={ev.id} className="event-card"
                  onClick={() => { setSelectedEvent(ev); leafRef.current?.flyTo([ev.lat, ev.lng], 9, {duration:1}); }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{ts.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#c8dde6" }}>{ev.name}</div>
                    <div style={{ fontSize:10, color:"#3a6678", fontFamily:"Share Tech Mono,monospace" }}>
                      {ev.status} · {ev.casualties}
                    </div>
                  </div>
                  <span style={{ fontSize:9, color:ts.color, fontFamily:"Share Tech Mono,monospace", flexShrink:0, padding:"1px 5px", border:`1px solid ${ts.color}44` }}>{ts.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// LiveMap.jsx — Geopolitical map with GDELT events, aircraft layer, share
import { useEffect, useRef, useState } from 'react';

const SEVERITY_COLOR = { CRITICAL: '#ff2d2d', HIGH: '#ff8c00', MEDIUM: '#ffd700', LOW: '#00ff88' };
const SEVERITY_RADIUS = { CRITICAL: 14, HIGH: 11, MEDIUM: 8, LOW: 6 };

// High-value Indian assets to always show
const INDIA_ASSETS = [
  { id: 'ins-vikrant', lat: 15.3, lng: 73.8, type: 'NAVAL', label: 'INS Vikrant — W Coast patrol', icon: '⚓' },
  { id: 'inaf-sulur', lat: 11.0, lng: 77.1, type: 'AIRBASE', label: 'INAF Sulur — SU-30 base', icon: '✈' },
  { id: 'inaf-pathankot', lat: 32.2, lng: 75.6, type: 'AIRBASE', label: 'Pathankot AB — forward base', icon: '✈' },
  { id: 'ins-karwar', lat: 14.8, lng: 74.1, type: 'NAVAL', label: 'INS Kadamba — naval base', icon: '⚓' },
  { id: 'siachen', lat: 35.4, lng: 77.1, type: 'ARMY', label: 'Siachen Glacier — highest battlefield', icon: '🏔' },
  { id: 'andaman', lat: 11.7, lng: 92.7, type: 'NAVAL', label: 'Andaman — strategic monitoring', icon: '⚓' },
  { id: 'depsang', lat: 34.8, lng: 78.0, type: 'ARMY', label: 'Depsang Plains — LAC friction', icon: '⚠' },
  { id: 'galwan', lat: 34.7, lng: 73.6, type: 'ARMY', label: 'Galwan Valley — 2020 clash site', icon: '⚠' },
];

export default function LiveMap({ events = [], onHotspotClick, sindoorMode = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAssets, setShowAssets] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Load Leaflet dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  function initMap() {
    const L = window.L;
    if (!L || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: sindoorMode ? [30.5, 72.0] : [28.5, 78.0],
      zoom: sindoorMode ? 6 : 5,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark military tile
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Trade routes
    const tradeRoutes = [
      [[11.0, 44.0], [15.0, 55.0], [20.0, 63.0], [22.0, 68.0], [19.0, 72.8]], // Horn of Africa → Mumbai
      [[1.0, 104.0], [8.0, 98.0], [12.0, 90.0], [13.0, 80.5]], // Malacca → Chennai
      [[25.0, 57.0], [22.0, 62.0], [19.0, 67.0], [18.0, 72.8]], // Hormuz → Mumbai
    ];
    tradeRoutes.forEach(route => {
      L.polyline(route, { color: '#1a6b8a', weight: 1.5, opacity: 0.5, dashArray: '6,4' }).addTo(map);
    });

    // LoC line
    const loc = [[36.8, 74.5], [35.9, 75.2], [34.5, 74.2], [33.7, 73.9], [33.0, 73.7], [32.5, 74.0], [32.0, 74.7]];
    L.polyline(loc, { color: '#ff4444', weight: 2, opacity: 0.8, dashArray: '8,4' }).addTo(map);
    L.tooltip({ permanent: true, direction: 'right', className: 'map-label' })
      .setContent('LoC')
      .setLatLng([33.5, 74.5])
      .addTo(map);

    // LAC line (approximate)
    const lac = [[35.5, 78.5], [34.5, 78.0], [33.8, 77.5], [32.5, 79.0], [31.0, 79.5], [28.0, 84.0], [27.0, 88.5], [26.5, 92.0]];
    L.polyline(lac, { color: '#ff8c00', weight: 2, opacity: 0.7, dashArray: '5,5' }).addTo(map);
    L.tooltip({ permanent: true, direction: 'right', className: 'map-label' })
      .setContent('LAC')
      .setLatLng([30.0, 81.0])
      .addTo(map);

    mapInstanceRef.current = map;
    renderMarkers();
  }

  function renderMarkers() {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = filter === 'ALL' ? events :
      filter === 'INDIA' ? events.filter(e => e.indiaRelevant) :
      filter === 'CRITICAL' ? events.filter(e => e.severity === 'CRITICAL') :
      events.filter(e => {
        const t = (e.title || '').toLowerCase();
        if (filter === 'PAK') return t.includes('pakistan') || t.includes('kashmir');
        if (filter === 'CHINA') return t.includes('china') || t.includes('lac') || t.includes('depsang');
        return true;
      });

    let liveEvents = 0;
    filtered.forEach(event => {
      if (!event.lat || !event.lng) return;
      const isLive = event.source !== 'baseline';
      if (isLive) liveEvents++;

      const color = SEVERITY_COLOR[event.severity] || '#ffd700';
      const radius = SEVERITY_RADIUS[event.severity] || 8;

      // Pulsing circle for critical/live events
      const html = isLive
        ? `<div style="position:relative;width:${radius*2}px;height:${radius*2}px">
            <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.3;animation:pulse 2s infinite"></div>
            <div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:1px solid white"></div>
           </div>`
        : `<div style="width:${radius*1.5}px;height:${radius*1.5}px;border-radius:50%;background:${color};opacity:0.6;border:1px solid ${color}40"></div>`;

      const icon = L.divIcon({ html, className: '', iconAnchor: [radius, radius] });
      const marker = L.marker([event.lat, event.lng], { icon })
        .bindPopup(`
          <div style="background:#1a1a2e;color:#e0e0e0;padding:10px;min-width:200px;font-family:monospace;font-size:11px">
            <div style="color:${color};font-weight:bold;margin-bottom:4px">${event.severity} ${isLive ? '● LIVE' : '◌ BASELINE'}</div>
            <div style="margin-bottom:6px;font-size:12px">${event.title}</div>
            ${event.source ? `<div style="color:#888">SOURCE: ${event.source}</div>` : ''}
            ${event.date ? `<div style="color:#888">${new Date(event.date).toLocaleString('en-IN')}</div>` : ''}
            ${event.url ? `<a href="${event.url}" target="_blank" style="color:#00d4ff;display:block;margin-top:6px">→ READ SOURCE</a>` : ''}
            <button onclick="navigator.share ? navigator.share({title:'War Desk Alert',text:'${event.title.replace(/'/g,'')}',url:'https://war-desk.vercel.app'}) : window.open('https://wa.me/?text=${encodeURIComponent(event.title + ' — war-desk.vercel.app')}')" 
              style="margin-top:8px;background:#25D366;border:none;color:white;padding:4px 8px;cursor:pointer;font-size:10px;border-radius:2px">
              📤 Share on WhatsApp
            </button>
          </div>
        `, { maxWidth: 280 })
        .addTo(mapInstanceRef.current);

      markersRef.current.push(marker);
    });

    // High value assets
    if (showAssets) {
      INDIA_ASSETS.forEach(asset => {
        const html = `<div style="font-size:16px;filter:drop-shadow(0 0 4px #00d4ff)">${asset.icon}</div>`;
        const icon = L.divIcon({ html, className: '', iconAnchor: [8, 8] });
        const marker = L.marker([asset.lat, asset.lng], { icon })
          .bindPopup(`<div style="background:#1a1a2e;color:#00d4ff;padding:8px;font-family:monospace;font-size:11px"><b>${asset.label}</b><br><span style="color:#888">${asset.type}</span></div>`)
          .addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      });
    }

    setLiveCount(liveEvents);
  }

  useEffect(() => {
    if (mapInstanceRef.current) renderMarkers();
  }, [events, filter, showAssets]);

  // Fly to sindoor mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (sindoorMode) {
      mapInstanceRef.current.flyTo([30.5, 72.0], 6, { duration: 1.5 });
    } else {
      mapInstanceRef.current.flyTo([28.5, 78.0], 5, { duration: 1.5 });
    }
  }, [sindoorMode]);

  const shareMap = () => {
    const text = `🇮🇳 India War Desk — Live Geopolitical Intelligence\n${liveCount} live events tracked right now\nhttps://war-desk.vercel.app`;
    if (navigator.share) {
      navigator.share({ title: 'India War Desk', text, url: 'https://war-desk.vercel.app' });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0a14' }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(2.5);opacity:0} }
        .map-label { background:transparent!important;border:none!important;color:#ffffff88!important;font-size:9px!important;font-weight:bold!important;white-space:nowrap!important }
        .leaflet-popup-content-wrapper { background:#1a1a2e!important;border:1px solid #333!important;border-radius:2px!important;box-shadow:0 0 20px rgba(0,200,255,0.2)!important }
        .leaflet-popup-tip { background:#1a1a2e!important }
      `}</style>

      {/* Filter bar */}
      <div style={{ position: 'absolute', top: 8, left: 50, zIndex: 1000, display: 'flex', gap: 4 }}>
        {['ALL','INDIA','CRITICAL','PAK','CHINA'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? '#00d4ff' : 'rgba(0,0,0,0.7)',
            color: filter === f ? '#000' : '#aaa',
            border: `1px solid ${filter === f ? '#00d4ff' : '#333'}`,
            padding: '2px 8px', fontSize: 9, fontFamily: 'monospace',
            cursor: 'pointer', letterSpacing: 1
          }}>{f}</button>
        ))}
        <button onClick={() => setShowAssets(!showAssets)} style={{
          background: showAssets ? 'rgba(0,212,255,0.2)' : 'rgba(0,0,0,0.7)',
          color: showAssets ? '#00d4ff' : '#666',
          border: '1px solid #333', padding: '2px 8px',
          fontSize: 9, fontFamily: 'monospace', cursor: 'pointer'
        }}>⚓ ASSETS</button>
      </div>

      {/* Live count + share */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #333', padding: '3px 8px', fontSize: 10, color: '#00ff88', fontFamily: 'monospace' }}>
          {liveCount > 0 ? `● ${liveCount} LIVE` : '◌ LOADING'}
        </span>
        <button onClick={shareMap} style={{
          background: '#25D366', border: 'none', color: 'white',
          padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace'
        }}>📤 SHARE</button>
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 30, left: 8, zIndex: 1000, background: 'rgba(0,0,0,0.8)', border: '1px solid #333', padding: 8, fontSize: 9, fontFamily: 'monospace', color: '#aaa' }}>
        {Object.entries(SEVERITY_COLOR).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: v }} />
            {k}
          </div>
        ))}
        <div style={{ marginTop: 4, borderTop: '1px solid #333', paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span>◆</span> GDELT LIVE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span>○</span> BASELINE</div>
          <div style={{ borderTop: '1px solid #ff444440', marginTop: 3, paddingTop: 3, color: '#ff4444' }}>— LoC</div>
          <div style={{ color: '#ff8c00' }}>— LAC</div>
          <div style={{ color: '#1a6b8a' }}>--- Trade</div>
        </div>
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

// LiveMap.jsx V10 — Dominant map with music-on-hover, all global conflict zones, ADS-B layer
import { useEffect, useRef, useState, useCallback } from 'react';
import { getMusicForEvent } from '../music/conflictMusic';

const SEVERITY_COLOR = { CRITICAL: '#ff2d2d', HIGH: '#ff8c00', MEDIUM: '#ffd700', LOW: '#4a9eff' };

// All permanent global conflict zones — always shown regardless of GDELT
const PERMANENT_ZONES = [
  // India-Pakistan
  { id: 'loc', lat: 33.5, lng: 74.5, label: 'Line of Control', sublabel: 'Active ceasefire violations', severity: 'HIGH', region: 'INDIA-PAK', icon: '⚔' },
  { id: 'kashmir', lat: 34.0, lng: 74.8, label: 'Kashmir Valley', sublabel: 'Disputed territory', severity: 'HIGH', region: 'INDIA-PAK', icon: '⚠' },
  { id: 'pok', lat: 34.5, lng: 73.5, label: 'PoK — Pak-occupied Kashmir', sublabel: 'Indian territorial claim', severity: 'HIGH', region: 'INDIA-PAK', icon: '⚑' },
  { id: 'bahawalpur', lat: 29.4, lng: 71.7, label: 'Bahawalpur', sublabel: 'Op. Sindoor Strike Target 1', severity: 'CRITICAL', region: 'OP-SINDOOR', icon: '✕' },
  { id: 'muridke', lat: 31.8, lng: 74.3, label: 'Muridke', sublabel: 'Op. Sindoor Strike Target 2', severity: 'CRITICAL', region: 'OP-SINDOOR', icon: '✕' },
  { id: 'muzaffarabad', lat: 34.35, lng: 73.47, label: 'Muzaffarabad', sublabel: 'Op. Sindoor Strike Target 3', severity: 'CRITICAL', region: 'OP-SINDOOR', icon: '✕' },

  // India-China
  { id: 'depsang', lat: 34.8, lng: 78.0, label: 'Depsang Plains', sublabel: 'LAC friction point — PLA deployment', severity: 'HIGH', region: 'INDIA-CHINA', icon: '⚠' },
  { id: 'galwan', lat: 34.7, lng: 73.6, label: 'Galwan Valley', sublabel: '2020 clash — ongoing tension', severity: 'HIGH', region: 'INDIA-CHINA', icon: '⚔' },
  { id: 'pangong', lat: 33.8, lng: 78.6, label: 'Pangong Tso', sublabel: 'LAC — partial disengagement', severity: 'MEDIUM', region: 'INDIA-CHINA', icon: '⚠' },
  { id: 'arunachal', lat: 27.5, lng: 93.0, label: 'Arunachal Pradesh', sublabel: 'Chinese territorial claim', severity: 'MEDIUM', region: 'INDIA-CHINA', icon: '⚑' },
  { id: 'taiwan', lat: 23.8, lng: 121.0, label: 'Taiwan Strait', sublabel: 'PLA naval exercises ongoing', severity: 'HIGH', region: 'CHINA-TAIWAN', icon: '⚓' },
  { id: 'southchinasea', lat: 15.0, lng: 114.0, label: 'South China Sea', sublabel: 'Chinese maritime claims', severity: 'HIGH', region: 'CHINA-ASEAN', icon: '⚓' },

  // Middle East
  { id: 'gaza', lat: 31.3, lng: 34.4, label: 'Gaza Strip', sublabel: 'Active conflict — 51,000+ civilian dead', severity: 'CRITICAL', region: 'ISRAEL-GAZA', icon: '💀' },
  { id: 'lebanon', lat: 33.8, lng: 35.8, label: 'Lebanon-Israel Border', sublabel: 'Hezbollah — partial ceasefire', severity: 'HIGH', region: 'ISRAEL-LEBANON', icon: '⚔' },
  { id: 'iran', lat: 32.4, lng: 53.7, label: 'Iran', sublabel: 'Nuclear program — US/Israel tension', severity: 'CRITICAL', region: 'IRAN-WEST', icon: '☢' },
  { id: 'hormuz', lat: 26.5, lng: 56.5, label: 'Strait of Hormuz', sublabel: '20% global oil — India critical dependency', severity: 'HIGH', region: 'MARITIME', icon: '⚓' },
  { id: 'redsea', lat: 15.0, lng: 42.5, label: 'Red Sea / Bab-el-Mandeb', sublabel: 'Houthi attacks — India trade disrupted', severity: 'CRITICAL', region: 'MARITIME', icon: '⚔' },
  { id: 'yemen', lat: 15.5, lng: 48.5, label: 'Yemen', sublabel: 'Houthi — active conflict', severity: 'HIGH', region: 'YEMEN', icon: '⚔' },

  // Eastern Europe
  { id: 'ukraine', lat: 49.0, lng: 32.0, label: 'Ukraine — Active Warzone', sublabel: '12,654+ civilian dead — ongoing', severity: 'CRITICAL', region: 'RUSSIA-UKRAINE', icon: '💀' },
  { id: 'kaliningrad', lat: 54.7, lng: 20.5, label: 'Kaliningrad', sublabel: 'NATO-Russia nuclear flashpoint', severity: 'HIGH', region: 'NATO-RUSSIA', icon: '☢' },

  // Africa
  { id: 'sudan', lat: 15.5, lng: 32.5, label: 'Sudan', sublabel: '1.5 lakh+ civilian dead — ongoing', severity: 'CRITICAL', region: 'SUDAN', icon: '💀' },
  { id: 'sahel', lat: 13.0, lng: 2.0, label: 'Sahel Region', sublabel: 'Multiple insurgencies', severity: 'HIGH', region: 'AFRICA', icon: '⚔' },

  // Indian Ocean / Maritime
  { id: 'arabiansea', lat: 18.0, lng: 65.0, label: 'Arabian Sea', sublabel: 'Indian Navy — 5th Fleet patrol overlap', severity: 'MEDIUM', region: 'MARITIME', icon: '⚓' },
  { id: 'andaman', lat: 11.7, lng: 92.7, label: 'Andaman Sea', sublabel: 'Strategic chokepoint — India monitors', severity: 'MEDIUM', region: 'MARITIME', icon: '⚓' },
  { id: 'malacca', lat: 2.5, lng: 101.5, label: 'Malacca Strait', sublabel: 'India-China trade chokepoint', severity: 'MEDIUM', region: 'MARITIME', icon: '⚓' },

  // South Asia
  { id: 'myanmar', lat: 19.0, lng: 96.0, label: 'Myanmar', sublabel: 'Civil war — India NE border impact', severity: 'HIGH', region: 'MYANMAR', icon: '⚔' },
  { id: 'bangladesh', lat: 23.7, lng: 90.4, label: 'Bangladesh', sublabel: 'Political instability — India relations strained', severity: 'MEDIUM', region: 'S-ASIA', icon: '⚠' },
];

// India high-value assets
const INDIA_ASSETS = [
  { id: 'ins-vikrant', lat: 15.3, lng: 73.8, label: 'INS Vikrant', sublabel: 'Aircraft carrier — W Coast patrol', icon: '⚓', color: '#00d4ff' },
  { id: 'ins-vikramaditya', lat: 15.8, lng: 73.2, label: 'INS Vikramaditya', sublabel: 'Aircraft carrier — Karwar base', icon: '⚓', color: '#00d4ff' },
  { id: 'pathankot', lat: 32.2, lng: 75.6, label: 'Pathankot Air Base', sublabel: 'MiG-21 — forward base LoC', icon: '✈', color: '#00ff88' },
  { id: 'adampur', lat: 31.4, lng: 75.8, label: 'Adampur Air Base', sublabel: 'Su-30 MKI — LoC coverage', icon: '✈', color: '#00ff88' },
  { id: 'sulur', lat: 11.0, lng: 77.1, label: 'INAF Sulur', sublabel: 'Su-30 MKI — South sector', icon: '✈', color: '#00ff88' },
  { id: 'leh', lat: 34.1, lng: 77.6, label: 'Leh Air Base', sublabel: 'Highest operational airbase — LAC', icon: '✈', color: '#ff8c00' },
  { id: 'siachen', lat: 35.4, lng: 77.1, label: 'Siachen Glacier', sublabel: 'World\'s highest battlefield', icon: '🏔', color: '#ffffff' },
  { id: 'ins-karwar', lat: 14.8, lng: 74.1, label: 'INS Kadamba', sublabel: 'India\'s largest naval base', icon: '⚓', color: '#00d4ff' },
  { id: 'vizag', lat: 17.7, lng: 83.3, label: 'INS Visakhapatnam', sublabel: 'Eastern fleet HQ + submarine base', icon: '⚓', color: '#00d4ff' },
  { id: 'andaman-naval', lat: 11.7, lng: 92.7, label: 'INS Baaz', sublabel: 'Andaman — strategic surveillance', icon: '⚓', color: '#00d4ff' },
];

export default function LiveMap({ events = [], onMusicChange, sindoorMode = false, filter = 'ALL' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const zoneLayerRef = useRef([]);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [filterActive, setFilterActive] = useState(filter);
  const [showAssets, setShowAssets] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initMap;
    document.head.appendChild(script);

    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  function initMap() {
    const L = window.L;
    if (!L || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [28.5, 78.0], zoom: 4,
      zoomControl: true, attributionControl: false,
      minZoom: 2, maxZoom: 12
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd'
    }).addTo(map);

    // Trade routes
    [
      [[11.0, 44.0], [15.0, 55.0], [20.0, 63.0], [22.0, 68.0], [19.0, 72.8]],
      [[1.0, 104.0], [8.0, 98.0], [12.0, 90.0], [13.0, 80.5]],
      [[25.0, 57.0], [22.0, 62.0], [19.0, 67.0], [18.0, 72.8]],
      [[51.5, -0.1], [48.8, 2.3], [41.0, 29.0], [26.5, 56.5], [22.0, 68.0], [19.0, 72.8]], // Europe-India
    ].forEach(r => L.polyline(r, { color: '#0d4a6b', weight: 1, opacity: 0.4, dashArray: '4,6' }).addTo(map));

    // LoC
    L.polyline([[36.8,74.5],[35.9,75.2],[34.5,74.2],[33.7,73.9],[33.0,73.7],[32.5,74.0],[32.0,74.7]], { color: '#ff4444', weight: 2, opacity: 0.9, dashArray: '8,4' }).addTo(map);
    // LAC
    L.polyline([[35.5,78.5],[34.5,78.0],[33.8,77.5],[32.5,79.0],[31.0,79.5],[28.0,84.0],[27.0,88.5],[26.5,92.0]], { color: '#ff8c00', weight: 2, opacity: 0.7, dashArray: '5,5' }).addTo(map);

    mapInstanceRef.current = map;
    renderAllLayers();
  }

  const renderAllLayers = useCallback(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Permanent conflict zones
    PERMANENT_ZONES.forEach(zone => {
      if (filterActive !== 'ALL') {
        if (filterActive === 'PAK' && !zone.region.includes('PAK') && !zone.region.includes('SINDOOR')) return;
        if (filterActive === 'CHINA' && !zone.region.includes('CHINA')) return;
        if (filterActive === 'MARITIME' && zone.region !== 'MARITIME') return;
        if (filterActive === 'INDIA' && !['INDIA-PAK','INDIA-CHINA','OP-SINDOOR'].includes(zone.region)) return;
      }

      const color = SEVERITY_COLOR[zone.severity] || '#ffd700';
      const isSindoor = zone.region === 'OP-SINDOOR';

      const html = `
        <div style="position:relative;cursor:pointer" data-zone="${zone.id}">
          <div style="position:absolute;inset:-4px;border-radius:50%;background:${color};opacity:0.15;animation:zonePulse 3s infinite"></div>
          <div style="width:24px;height:24px;border-radius:50%;background:${color}22;border:1.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:10px;${isSindoor ? 'border-style:dashed' : ''}">
            ${zone.icon}
          </div>
        </div>`;

      const icon = window.L.divIcon({ html, className: '', iconAnchor: [12, 12] });
      const marker = window.L.marker([zone.lat, zone.lng], { icon })
        .bindPopup(`
          <div style="background:#0a0a18;color:#e0e0e0;padding:12px;min-width:220px;font-family:monospace;font-size:11px;border:1px solid ${color}44">
            <div style="color:${color};font-size:8px;letter-spacing:2px;margin-bottom:4px">${zone.severity} · ${zone.region}</div>
            <div style="font-size:13px;font-weight:bold;margin-bottom:4px">${zone.label}</div>
            <div style="color:#888;margin-bottom:8px;line-height:1.4">${zone.sublabel}</div>
            <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(`🌍 ${zone.label}: ${zone.sublabel}\n\nIndia War Desk — https://war-desk.vercel.app`)}','_blank')"
              style="background:#25D36622;border:1px solid #25D36644;color:#25D366;padding:4px 8px;cursor:pointer;font-size:9px;width:100%">
              📤 Share on WhatsApp
            </button>
          </div>`, { maxWidth: 280 });

      // Music on hover
      marker.on('mouseover', () => {
        setHoveredZone(zone);
        onMusicChange?.(zone);
      });
      marker.on('mouseout', () => {
        setHoveredZone(null);
        onMusicChange?.(null);
      });
      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    });

    // GDELT live events
    let liveCount = 0;
    events.slice(0, 30).forEach(event => {
      if (!event.lat || !event.lng) return;
      liveCount++;
      const color = SEVERITY_COLOR[event.severity] || '#ffd700';
      const html = `<div style="position:relative">
        <div style="position:absolute;inset:-3px;border-radius:50%;background:${color};opacity:0.2;animation:livePulse 1.5s infinite"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${color};border:1px solid white;opacity:0.9"></div>
      </div>`;
      const icon = window.L.divIcon({ html, className: '', iconAnchor: [5, 5] });
      const m = window.L.marker([event.lat, event.lng], { icon })
        .bindPopup(`<div style="background:#0a0a18;color:#e0e0e0;padding:10px;font-family:monospace;font-size:10px">
          <div style="color:${color};font-size:8px;letter-spacing:1px">GDELT LIVE · ${event.severity}</div>
          <div style="margin:4px 0">${event.title}</div>
          ${event.url ? `<a href="${event.url}" target="_blank" style="color:#00d4ff">→ Source</a>` : ''}
        </div>`)
        .on('mouseover', () => onMusicChange?.(event))
        .on('mouseout', () => onMusicChange?.(null))
        .addTo(mapInstanceRef.current);
      markersRef.current.push(m);
    });
    setLiveCount(liveCount);

    // Indian assets
    if (showAssets) {
      INDIA_ASSETS.forEach(asset => {
        const html = `<div style="font-size:14px;text-shadow:0 0 6px ${asset.color};cursor:pointer" title="${asset.label}">${asset.icon}</div>`;
        const icon = window.L.divIcon({ html, className: '', iconAnchor: [7, 7] });
        const m = window.L.marker([asset.lat, asset.lng], { icon })
          .bindPopup(`<div style="background:#0a0a18;color:#e0e0e0;padding:8px;font-family:monospace;font-size:10px">
            <div style="color:${asset.color}">${asset.label}</div>
            <div style="color:#666;margin-top:3px">${asset.sublabel}</div>
          </div>`)
          .addTo(mapInstanceRef.current);
        markersRef.current.push(m);
      });
    }
  }, [events, filterActive, showAssets, onMusicChange]);

  useEffect(() => { if (mapInstanceRef.current) renderAllLayers(); }, [renderAllLayers]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (sindoorMode) mapInstanceRef.current.flyTo([31.5, 72.5], 6, { duration: 1.5 });
    else mapInstanceRef.current.flyTo([28.5, 78.0], 4, { duration: 1.5 });
  }, [sindoorMode]);

  const shareMap = () => {
    const text = `🗺️ India War Desk — Live Geopolitical Intelligence\n${liveCount} GDELT events + ${PERMANENT_ZONES.length} conflict zones tracked\n\nhttps://war-desk.vercel.app`;
    if (navigator.share) navigator.share({ title: 'India War Desk', text, url: 'https://war-desk.vercel.app' });
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filters = ['ALL', 'INDIA', 'PAK', 'CHINA', 'MARITIME'];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#08080f' }}>
      <style>{`
        @keyframes zonePulse { 0%,100%{transform:scale(1);opacity:0.15} 50%{transform:scale(1.8);opacity:0} }
        @keyframes livePulse { 0%,100%{transform:scale(1);opacity:0.2} 50%{transform:scale(2.5);opacity:0} }
        .leaflet-popup-content-wrapper{background:#0a0a18!important;border:1px solid #333!important;border-radius:0!important;box-shadow:0 0 30px rgba(0,100,255,0.15)!important}
        .leaflet-popup-tip{background:#0a0a18!important}
        .map-label{background:transparent!important;border:none!important;color:#ffffff55!important;font-size:8px!important;font-family:monospace!important;white-space:nowrap!important}
      `}</style>

      {/* Filter bar */}
      <div style={{ position: 'absolute', top: 8, left: 50, zIndex: 1000, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilterActive(f)} style={{
            background: filterActive === f ? 'rgba(0,212,255,0.25)' : 'rgba(6,6,15,0.9)',
            color: filterActive === f ? '#00d4ff' : '#555',
            border: `1px solid ${filterActive === f ? '#00d4ff' : '#222'}`,
            padding: '3px 8px', fontSize: 9, cursor: 'pointer', letterSpacing: 1, fontFamily: 'monospace'
          }}>{f}</button>
        ))}
        <button onClick={() => setShowAssets(!showAssets)} style={{
          background: showAssets ? 'rgba(0,212,255,0.15)' : 'rgba(6,6,15,0.9)',
          color: showAssets ? '#00d4ff' : '#444', border: '1px solid #222',
          padding: '3px 8px', fontSize: 9, cursor: 'pointer', fontFamily: 'monospace'
        }}>⚓ ASSETS</button>
      </div>

      {/* Top right — live count + share */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000, display: 'flex', gap: 6, alignItems: 'center' }}>
        {hoveredZone && (
          <div style={{ background: 'rgba(6,6,15,0.95)', border: '1px solid #ff444444', padding: '3px 8px', fontSize: 9, color: '#ff8888', fontFamily: 'monospace', maxWidth: 200 }}>
            ♪ {hoveredZone.label}
          </div>
        )}
        <span style={{ background: 'rgba(6,6,15,0.9)', border: `1px solid ${liveCount > 0 ? '#00ff8844' : '#222'}`, padding: '3px 8px', fontSize: 9, color: liveCount > 0 ? '#00ff88' : '#444', fontFamily: 'monospace' }}>
          {liveCount > 0 ? `● ${liveCount} LIVE` : '◌ LOADING'}
        </span>
        <button onClick={shareMap} style={{ background: '#25D36622', border: '1px solid #25D36644', color: '#25D366', padding: '3px 8px', fontSize: 9, cursor: 'pointer', fontFamily: 'monospace' }}>📤 SHARE</button>
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 30, left: 8, zIndex: 1000, background: 'rgba(6,6,15,0.92)', border: '1px solid #1a1a1a', padding: '6px 8px', fontSize: 8, fontFamily: 'monospace' }}>
        {Object.entries(SEVERITY_COLOR).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, color: '#666' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: v }} />{k}
          </div>
        ))}
        <div style={{ borderTop: '1px solid #1a1a1a', marginTop: 4, paddingTop: 4 }}>
          <div style={{ color: '#ff444488' }}>— LoC</div>
          <div style={{ color: '#ff8c0088' }}>— LAC</div>
          <div style={{ color: '#0d4a6b' }}>--- Trade</div>
        </div>
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

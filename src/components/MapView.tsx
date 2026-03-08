import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Conflict } from '../types';
import {
  INDIA_CLAIMED_POLYGON,
  LOC_LINE,
  LAC_WESTERN,
  LAC_EASTERN,
} from '../data/borders';

const mapboxgl = maplibregl;

const INDIA_CENTER: [number, number] = [75.0, 20.0];
const INDIA_ZOOM = 3.6;

interface Props {
  conflicts: Conflict[];
  onConflictClick: (c: Conflict) => void;
}

const INTENSITY_COLOR: Record<string, string> = {
  critical: '#dc2626',
  high: '#ef4444',
  moderate: '#f87171',
  low: '#fca5a5',
};

const INTENSITY_GLOW: Record<string, string> = {
  critical: 'rgba(220,38,38,0.55)',
  high: 'rgba(239,68,68,0.45)',
  moderate: 'rgba(248,113,113,0.35)',
  low: 'rgba(252,165,165,0.25)',
};

const INTENSITY_SIZE: Record<string, number> = {
  critical: 22,
  high: 18,
  moderate: 15,
  low: 12,
};

// ─── Inject per-intensity pulse keyframes once ────────────────────────────────
// Uses box-shadow spread (NOT transform: scale) so MapLibre's own transform
// updates on the .maplibregl-marker wrapper never interfere with the animation.
function ensurePulseStyles() {
  if (document.getElementById('conflict-marker-styles')) return;
  const style = document.createElement('style');
  style.id = 'conflict-marker-styles';
  style.textContent = `
    @keyframes pulse-critical {
      0%   { box-shadow: 0 0 8px 2px rgba(220,38,38,0.8),  0 0 0 0   rgba(220,38,38,0.55); }
      60%  { box-shadow: 0 0 12px 4px rgba(220,38,38,0.5), 0 0 0 18px rgba(220,38,38,0); }
      100% { box-shadow: 0 0 8px 2px rgba(220,38,38,0.8),  0 0 0 0   rgba(220,38,38,0.55); }
    }
    @keyframes pulse-high {
      0%   { box-shadow: 0 0 7px 2px rgba(239,68,68,0.7),  0 0 0 0   rgba(239,68,68,0.45); }
      60%  { box-shadow: 0 0 10px 3px rgba(239,68,68,0.4), 0 0 0 15px rgba(239,68,68,0); }
      100% { box-shadow: 0 0 7px 2px rgba(239,68,68,0.7),  0 0 0 0   rgba(239,68,68,0.45); }
    }
    @keyframes pulse-moderate {
      0%   { box-shadow: 0 0 6px 1px rgba(248,113,113,0.6), 0 0 0 0   rgba(248,113,113,0.35); }
      60%  { box-shadow: 0 0 8px 2px rgba(248,113,113,0.3), 0 0 0 12px rgba(248,113,113,0); }
      100% { box-shadow: 0 0 6px 1px rgba(248,113,113,0.6), 0 0 0 0   rgba(248,113,113,0.35); }
    }
    @keyframes pulse-low {
      0%   { box-shadow: 0 0 4px 1px rgba(252,165,165,0.5), 0 0 0 0   rgba(252,165,165,0.25); }
      60%  { box-shadow: 0 0 6px 1px rgba(252,165,165,0.2), 0 0 0 10px rgba(252,165,165,0); }
      100% { box-shadow: 0 0 4px 1px rgba(252,165,165,0.5), 0 0 0 0   rgba(252,165,165,0.25); }
    }
  `;
  document.head.appendChild(style);
}

function buildMarkerEl(conflict: Conflict): HTMLElement {
  const color = INTENSITY_COLOR[conflict.intensity];
  const size = INTENSITY_SIZE[conflict.intensity];
  const speed = conflict.intensity === 'critical' ? '1.4s' : conflict.intensity === 'high' ? '2.0s' : conflict.intensity === 'moderate' ? '2.8s' : '3.8s';

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position: relative;
    width: ${size + 20}px;
    height: ${size + 20}px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  wrap.setAttribute('data-conflict-id', conflict.id);
  wrap.title = conflict.title;

  // Single dot — pulse effect via box-shadow only (no transform, no scale)
  // This prevents any interference with MapLibre's translate transform on .maplibregl-marker
  const dot = document.createElement('div');
  dot.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    border: 2px solid rgba(255,255,255,0.3);
    animation: pulse-${conflict.intensity} ${speed} ease-in-out infinite;
    z-index: 1;
    flex-shrink: 0;
  `;

  // Flag images — flagcdn.com (works on Windows, no emoji rendering issues)
  const flagWrap = document.createElement('div');
  flagWrap.style.cssText = `
    position: absolute;
    bottom: -14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    pointer-events: none;
  `;
  conflict.countries.slice(0, 2).forEach((c) => {
    const img = document.createElement('img');
    img.src = `https://flagcdn.com/16x12/${c.code.toLowerCase()}.png`;
    img.alt = c.name;
    img.style.cssText = `width:16px;height:12px;border-radius:1px;box-shadow:0 1px 3px rgba(0,0,0,0.8);`;
    flagWrap.appendChild(img);
  });

  wrap.appendChild(dot);
  wrap.appendChild(flagWrap);
  return wrap;
}

// ─── Border layers ────────────────────────────────────────────────────────────
function addBorderLayers(map: maplibregl.Map) {
  // India claimed boundary
  map.addSource('india-border', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [INDIA_CLAIMED_POLYGON] },
  });
  map.addLayer({
    id: 'india-border-fill',
    type: 'fill',
    source: 'india-border',
    paint: { 'fill-color': '#ff3333', 'fill-opacity': 0.04 },
  });
  map.addLayer({
    id: 'india-border-line',
    type: 'line',
    source: 'india-border',
    paint: {
      'line-color': '#ff3333',
      'line-width': 1.8,
      'line-opacity': 0.85,
    },
  });

  // Line of Control
  map.addSource('loc', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [LOC_LINE] },
  });
  map.addLayer({
    id: 'loc-line',
    type: 'line',
    source: 'loc',
    paint: {
      'line-color': '#ff8c00',
      'line-width': 2.2,
      'line-opacity': 0.95,
      'line-dasharray': [6, 3],
    },
  });

  // LAC — both sectors
  map.addSource('lac', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [LAC_WESTERN, LAC_EASTERN] },
  });
  map.addLayer({
    id: 'lac-line',
    type: 'line',
    source: 'lac',
    paint: {
      'line-color': '#00bfff',
      'line-width': 2.2,
      'line-opacity': 0.9,
      'line-dasharray': [4, 4],
    },
  });

  // ─ Text labels for LoC and LAC ─
  map.addLayer({
    id: 'loc-label',
    type: 'symbol',
    source: 'loc',
    layout: {
      'text-field': 'LoC',
      'text-size': 10,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'symbol-placement': 'line-center',
      'text-offset': [0, -1.0],
      'text-rotation-alignment': 'map',
    },
    paint: {
      'text-color': '#ff8c00',
      'text-halo-color': 'rgba(0,0,0,0.7)',
      'text-halo-width': 1.5,
    },
  });
  map.addLayer({
    id: 'lac-label',
    type: 'symbol',
    source: 'lac',
    layout: {
      'text-field': 'LAC',
      'text-size': 10,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'symbol-placement': 'line-center',
      'text-offset': [0, -1.0],
      'text-rotation-alignment': 'map',
    },
    paint: {
      'text-color': '#00bfff',
      'text-halo-color': 'rgba(0,0,0,0.7)',
      'text-halo-width': 1.5,
    },
  });
}

export default function MapView({ conflicts, onConflictClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  ensurePulseStyles();

  // ─ Init map ─
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const FREE_STYLE = {
      version: 8 as const,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'esri-satellite': {
          type: 'raster' as const,
          tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics',
          maxzoom: 19,
        },
        'osm-labels': {
          type: 'raster' as const,
          tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: 'OpenStreetMap contributors',
          maxzoom: 19,
        },
      },
      layers: [
        { id: 'satellite', type: 'raster' as const, source: 'esri-satellite', paint: { 'raster-opacity': 1 } },
        { id: 'labels', type: 'raster' as const, source: 'osm-labels', paint: { 'raster-opacity': 0.75 } },
      ],
    };

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: FREE_STYLE,
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      minZoom: 2.5,
      maxZoom: 12,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => addBorderLayers(map));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─ Add / update markers ─
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addMarkers = () => {
      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!conflicts.find((c) => c.id === id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      // Add new markers
      conflicts.forEach((conflict) => {
        if (markersRef.current.has(conflict.id)) return;
        const el = buildMarkerEl(conflict);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onConflictClick(conflict);
        });
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([conflict.lng, conflict.lat])
          .addTo(map);
        markersRef.current.set(conflict.id, marker);
      });
    };

    if (map.isStyleLoaded()) addMarkers();
    else map.once('load', addMarkers);
  }, [conflicts, onConflictClick]);

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Title overlay */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(5,10,20,0.75)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(220,38,38,0.3)', borderRadius: 4,
        padding: '4px 14px', color: '#94a3b8', fontSize: 11,
        letterSpacing: '0.12em', fontFamily: 'monospace', pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        INDIA STRATEGIC ENVIRONMENT — SATELLITE VIEW
      </div>

      {/* Border legend */}
      <div style={{
        position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 14, pointerEvents: 'none',
      }}>
        {[
          { color: '#ff3333', label: 'India (claimed)', dash: 'none' },
          { color: '#ff8c00', label: 'LoC', dash: '6px 3px' },
          { color: '#00bfff', label: 'LAC', dash: '4px 4px' },
        ].map(({ color, label, dash }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(5,10,20,0.7)', borderRadius: 3, padding: '2px 7px' }}>
            <svg width="24" height="4">
              <line x1="0" y1="2" x2="24" y2="2"
                stroke={color} strokeWidth="2.5"
                strokeDasharray={dash === 'none' ? undefined : dash} />
            </svg>
            <span style={{ color: '#cbd5e1', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Intensity legend */}
      <div style={{
        position: 'absolute', bottom: 48, left: 12,
        background: 'rgba(5,10,20,0.82)', backdropFilter: 'blur(6px)',
        border: '1px solid #1f3050', borderRadius: 6, padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {([ ['critical','Critical — Direct Impact'], ['high','High — Direct/Indirect'],
            ['moderate','Moderate — Indirect'], ['low','Low — Monitor'] ] as const
        ).map(([intensity, label]) => (
          <div key={intensity} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: INTENSITY_SIZE[intensity], height: INTENSITY_SIZE[intensity],
              borderRadius: '50%', background: INTENSITY_COLOR[intensity],
              boxShadow: `0 0 6px ${INTENSITY_GLOW[intensity]}`, flexShrink: 0,
            }} />
            <span style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

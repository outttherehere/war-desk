import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type * as GeoJSON from 'geojson';
import type { Conflict } from '../types';
import { INDIA_CLAIMED_POLYGON, LOC_LINE, LAC_WESTERN, LAC_EASTERN } from '../data/borders';

const INDIA_CENTER: [number, number] = [75.0, 20.0];
const INDIA_ZOOM = 3.6;

interface Props {
  conflicts: Conflict[];
  onConflictClick: (c: Conflict) => void;
}

// ─── MapLibre data-driven paint expressions ───────────────────────────────────
const COLOR_EXPR = ['match', ['get', 'intensity'],
  'critical', '#dc2626', 'high', '#ef4444', 'moderate', '#f87171', '#fca5a5',
] as maplibregl.ExpressionSpecification;

// dot radius in screen pixels — stays FIXED during zoom (circle-pitch-alignment: viewport)
const DOT_R = ['match', ['get', 'intensity'],
  'critical', 11, 'high', 9, 'moderate', 7, 6,
] as maplibregl.ExpressionSpecification;

const RING1_R = ['match', ['get', 'intensity'],
  'critical', 20, 'high', 18, 'moderate', 16, 14,
] as maplibregl.ExpressionSpecification;

const RING2_R = ['match', ['get', 'intensity'],
  'critical', 31, 'high', 28, 'moderate', 25, 22,
] as maplibregl.ExpressionSpecification;

const INTENSITY_COLOR: Record<string, string> = {
  critical: '#dc2626', high: '#ef4444', moderate: '#f87171', low: '#fca5a5',
};
const INTENSITY_GLOW: Record<string, string> = {
  critical: 'rgba(220,38,38,0.55)', high: 'rgba(239,68,68,0.45)',
  moderate: 'rgba(248,113,113,0.35)', low: 'rgba(252,165,165,0.25)',
};
const INTENSITY_SIZE: Record<string, number> = {
  critical: 22, high: 18, moderate: 15, low: 12,
};

function toGeoJSON(conflicts: Conflict[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: conflicts.map((c) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] as [number, number] },
      properties: { id: c.id, intensity: c.intensity, title: c.title },
    })),
  };
}

function buildFlagEl(conflict: Conflict, onClick: () => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:2px;cursor:pointer;';
  wrap.addEventListener('click', onClick);
  conflict.countries.slice(0, 2).forEach((c) => {
    const img = document.createElement('img');
    img.src = `https://flagcdn.com/16x12/${c.code.toLowerCase()}.png`;
    img.alt = c.name;
    img.style.cssText = 'width:16px;height:12px;border-radius:1px;box-shadow:0 1px 3px rgba(0,0,0,0.9);display:block;';
    wrap.appendChild(img);
  });
  return wrap;
}

// ─── Border layers — NO glyphs/symbol layers (avoids font-server dependency) ──
function addBorderLayers(map: maplibregl.Map) {
  // India claimed boundary polygon
  map.addSource('india-border', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [INDIA_CLAIMED_POLYGON] } as GeoJSON.FeatureCollection,
  });
  map.addLayer({
    id: 'india-fill',
    type: 'fill',
    source: 'india-border',
    paint: { 'fill-color': '#ff3333', 'fill-opacity': 0.07 },
  });
  map.addLayer({
    id: 'india-line',
    type: 'line',
    source: 'india-border',
    paint: { 'line-color': '#ff4040', 'line-width': 2.2, 'line-opacity': 0.95 },
  });

  // LoC
  map.addSource('loc-src', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [LOC_LINE] } as GeoJSON.FeatureCollection,
  });
  map.addLayer({
    id: 'loc-line',
    type: 'line',
    source: 'loc-src',
    paint: { 'line-color': '#ff9500', 'line-width': 2.8, 'line-opacity': 1, 'line-dasharray': [6, 3] },
  });

  // LAC (both sectors)
  map.addSource('lac-src', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [LAC_WESTERN, LAC_EASTERN] } as GeoJSON.FeatureCollection,
  });
  map.addLayer({
    id: 'lac-line',
    type: 'line',
    source: 'lac-src',
    paint: { 'line-color': '#00d4ff', 'line-width': 2.8, 'line-opacity': 1, 'line-dasharray': [4, 4] },
  });
}

// ─── Text labels as DOM markers (no font server required) ─────────────────────
function addBorderLabels(map: maplibregl.Map): maplibregl.Marker[] {
  const make = (text: string, color: string) => {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `color:${color};font:bold 9px/1.5 monospace;background:rgba(0,0,0,0.78);padding:1px 5px;border-radius:2px;pointer-events:none;white-space:nowrap;border:1px solid ${color}55;letter-spacing:0.07em;`;
    return el;
  };
  return [
    new maplibregl.Marker({ element: make('LoC', '#ff9500'), anchor: 'center' }).setLngLat([75.40, 35.00]).addTo(map),
    new maplibregl.Marker({ element: make('LAC (W)', '#00d4ff'), anchor: 'center' }).setLngLat([79.00, 34.00]).addTo(map),
    new maplibregl.Marker({ element: make('LAC (E)', '#00d4ff'), anchor: 'center' }).setLngLat([94.50, 28.70]).addTo(map),
  ];
}

// ─── Conflict circle layers (WebGL — zero CSS-transform interference) ─────────
function addConflictLayers(map: maplibregl.Map, conflicts: Conflict[]) {
  map.addSource('conflicts-src', { type: 'geojson', data: toGeoJSON(conflicts) });

  // Outer pulse rings (opacity animated via RAF — NO transform used)
  map.addLayer({
    id: 'conflict-ring-2',
    type: 'circle',
    source: 'conflicts-src',
    paint: {
      'circle-radius': RING2_R,
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': COLOR_EXPR,
      'circle-stroke-opacity': 0,
      'circle-pitch-alignment': 'viewport',
    },
  });
  map.addLayer({
    id: 'conflict-ring-1',
    type: 'circle',
    source: 'conflicts-src',
    paint: {
      'circle-radius': RING1_R,
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-width': 2,
      'circle-stroke-color': COLOR_EXPR,
      'circle-stroke-opacity': 0,
      'circle-pitch-alignment': 'viewport',
    },
  });

  // Solid inner dot — guaranteed fixed pixel size, no DOM/CSS involved
  map.addLayer({
    id: 'conflict-dot',
    type: 'circle',
    source: 'conflicts-src',
    paint: {
      'circle-radius': DOT_R,
      'circle-color': COLOR_EXPR,
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,0.3)',
      'circle-opacity': 1,
      'circle-pitch-alignment': 'viewport',
    },
  });
}

// ─── Pulse: animated via requestAnimationFrame, no CSS transform ───────────────
function startPulse(map: maplibregl.Map): () => void {
  let raf = 0;
  let t0: number | null = null;
  const CYCLE = 2400;

  const step = (ts: number) => {
    if (t0 === null) t0 = ts;
    const e = ts - t0;

    const p1 = (e % CYCLE) / CYCLE;
    const o1 = Math.max(0, 0.65 * (1 - p1 * 1.25));

    const p2 = ((e + CYCLE * 0.5) % CYCLE) / CYCLE;
    const o2 = Math.max(0, 0.45 * (1 - p2 * 1.25));

    try {
      if (map.getLayer('conflict-ring-1')) map.setPaintProperty('conflict-ring-1', 'circle-stroke-opacity', o1);
      if (map.getLayer('conflict-ring-2')) map.setPaintProperty('conflict-ring-2', 'circle-stroke-opacity', o2);
    } catch { /* map may be mid-destroy */ }

    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export default function MapView({ conflicts, onConflictClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const flagsRef = useRef<maplibregl.Marker[]>([]);
  const labelsRef = useRef<maplibregl.Marker[]>([]);
  const stopPulseRef = useRef<(() => void) | null>(null);
  const onClickRef = useRef(onConflictClick);
  onClickRef.current = onConflictClick;
  const conflictsRef = useRef(conflicts);
  conflictsRef.current = conflicts;

  // ─ Map init (run once) ─
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // NOTE: No `glyphs` key in style — symbol layers are not used, avoiding
    // font-server dependencies that silently break GeoJSON layer rendering.
    const style: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics',
          maxzoom: 19,
        },
        'osm-labels': {
          type: 'raster',
          tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: 'OpenStreetMap contributors',
          maxzoom: 19,
        },
      },
      layers: [
        { id: 'satellite', type: 'raster', source: 'esri-satellite', paint: { 'raster-opacity': 1 } },
        { id: 'labels', type: 'raster', source: 'osm-labels', paint: { 'raster-opacity': 0.75 } },
      ],
    };

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style,
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      minZoom: 2.5,
      maxZoom: 12,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      // 1. India border + LoC + LAC vector layers
      addBorderLayers(map);

      // 2. LoC/LAC text labels (DOM, no font server)
      labelsRef.current = addBorderLabels(map);

      // 3. Conflict circle layers (WebGL, pixel-fixed)
      addConflictLayers(map, conflictsRef.current);

      // 4. Click & hover on the dot layer
      map.on('click', 'conflict-dot', (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        const c = conflictsRef.current.find((x) => x.id === id);
        if (c) onClickRef.current(c);
      });
      map.on('mouseenter', 'conflict-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'conflict-dot', () => { map.getCanvas().style.cursor = ''; });

      // 5. Flag DOM markers (just the image strip, no dot)
      conflictsRef.current.forEach((c) => {
        const el = buildFlagEl(c, () => onClickRef.current(c));
        flagsRef.current.push(
          new maplibregl.Marker({ element: el, anchor: 'top', offset: [0, 13] })
            .setLngLat([c.lng, c.lat])
            .addTo(map)
        );
      });

      // 6. Start WebGL pulse animation
      stopPulseRef.current = startPulse(map);
    });

    mapRef.current = map;
    return () => {
      stopPulseRef.current?.();
      labelsRef.current.forEach((m) => m.remove());
      flagsRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
      flagsRef.current = [];
      labelsRef.current = [];
    };
  }, []);

  // ─ Update conflict source + flag markers when conflicts prop changes ─
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('conflicts-src') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    src.setData(toGeoJSON(conflicts));

    // Rebuild flag markers
    flagsRef.current.forEach((m) => m.remove());
    flagsRef.current = [];
    conflicts.forEach((c) => {
      const el = buildFlagEl(c, () => onConflictClick(c));
      flagsRef.current.push(
        new maplibregl.Marker({ element: el, anchor: 'top', offset: [0, 13] })
          .setLngLat([c.lng, c.lat])
          .addTo(map)
      );
    });
  }, [conflicts, onConflictClick]);

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Title */}
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
        display: 'flex', gap: 10, pointerEvents: 'none',
      }}>
        {[
          { color: '#ff4040', label: 'India (claimed)', dash: undefined },
          { color: '#ff9500', label: 'LoC', dash: '6 3' },
          { color: '#00d4ff', label: 'LAC', dash: '4 4' },
        ].map(({ color, label, dash }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(5,10,20,0.72)', borderRadius: 3, padding: '2px 8px',
            border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="26" height="6" style={{ flexShrink: 0 }}>
              <line x1="0" y1="3" x2="26" y2="3"
                stroke={color} strokeWidth="2.5" strokeDasharray={dash} />
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

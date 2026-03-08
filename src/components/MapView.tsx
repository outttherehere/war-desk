import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Conflict } from '../types';
import { LOC_LINE, LAC_WESTERN, LAC_EASTERN } from '../data/borders';

const INDIA_CENTER: [number, number] = [75.0, 20.0];
const INDIA_ZOOM = 3.6;

interface Props {
  conflicts: Conflict[];
  onConflictClick: (c: Conflict) => void;
}

const INTENSITY_COLOR: Record<string, string> = {
  critical: '#dc2626', high: '#ef4444', moderate: '#f87171', low: '#fca5a5',
};
const INTENSITY_GLOW: Record<string, string> = {
  critical: 'rgba(220,38,38,0.6)', high: 'rgba(239,68,68,0.5)',
  moderate: 'rgba(248,113,113,0.4)', low: 'rgba(252,165,165,0.3)',
};
const INTENSITY_SIZE: Record<string, number> = {
  critical: 22, high: 18, moderate: 15, low: 12,
};

// ─── India GeoJSON loader ─────────────────────────────────────────────────────
type IndiaGeom = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown[] };
let _indiaGeo: IndiaGeom | null = null;
let _indiaFetch: Promise<void> | null = null;

async function ensureIndiaGeo(): Promise<void> {
  if (_indiaGeo) return;
  if (_indiaFetch) { await _indiaFetch; return; }
  _indiaFetch = (async () => {
    const URLS = [
      'https://cdn.jsdelivr.net/gh/geohacker/india@master/country/india.geojson',
      'https://raw.githubusercontent.com/geohacker/india/master/country/india.geojson',
    ];
    for (const url of URLS) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!r.ok) continue;
        const gj = await r.json();
        const geom: unknown =
          gj.type === 'FeatureCollection' ? gj.features?.[0]?.geometry :
          gj.type === 'Feature'            ? gj.geometry : gj;
        if (geom && typeof geom === 'object' &&
          ((geom as IndiaGeom).type === 'Polygon' || (geom as IndiaGeom).type === 'MultiPolygon')) {
          _indiaGeo = geom as IndiaGeom;
          return;
        }
      } catch { continue; }
    }
  })();
  await _indiaFetch;
}

// ─── SVG overlay ──────────────────────────────────────────────────────────────
// Conflict dots are rendered directly in SVG via map.project() — pixel-perfect
// at every zoom level. Border group redraws every frame; dot group only updates
// cx/cy attributes (no recreation), so CSS animations are never interrupted.

interface DotEntry {
  conflict: Conflict;
  ring: SVGCircleElement;
  dot: SVGCircleElement;
  flags: SVGImageElement[];
}

interface SvgApi {
  cleanup: () => void;
  setConflicts: (conflicts: Conflict[], onClickFn: (c: Conflict) => void) => void;
}

function setupSvgOverlay(map: maplibregl.Map, container: HTMLDivElement): SvgApi {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:visible;';
  container.appendChild(svg);

  // CSS pulse animation for rings — transform-box:fill-box makes scale origin
  // track the circle's own cx/cy, so updating cx/cy never breaks the animation.
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    .dr { transform-box:fill-box; transform-origin:center; }
    .rc { animation: rc 1.4s ease-in-out infinite; }
    .rh { animation: rh 2.0s ease-in-out infinite; }
    .rm { animation: rm 2.8s ease-in-out infinite; }
    .rl { animation: rl 3.6s ease-in-out infinite; }
    @keyframes rc { 0%,100%{transform:scale(1);opacity:.65} 55%{transform:scale(2.6);opacity:0} }
    @keyframes rh { 0%,100%{transform:scale(1);opacity:.55} 55%{transform:scale(2.4);opacity:0} }
    @keyframes rm { 0%,100%{transform:scale(1);opacity:.45} 55%{transform:scale(2.2);opacity:0} }
    @keyframes rl { 0%,100%{transform:scale(1);opacity:.35} 55%{transform:scale(2.0);opacity:0} }
  `;
  svg.appendChild(styleEl);

  // Two groups: borders (full redraw per frame) and dots (attribute-only updates)
  const borderG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const dotG    = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(borderG);
  svg.appendChild(dotG);

  type Coord = [number, number];

  const toPath = (coords: number[][], close = false): string => {
    if (!coords.length) return '';
    return coords.map((c, i) => {
      const p = map.project(c as Coord);
      return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ') + (close ? 'Z' : '');
  };

  const mkPath = (d: string, attrs: Record<string, string>): SVGPathElement => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  const indiaPathData = (): string => {
    if (!_indiaGeo) return '';
    if (_indiaGeo.type === 'Polygon')
      return toPath(_indiaGeo.coordinates[0] as number[][], true);
    return (_indiaGeo.coordinates as number[][][][])
      .map((poly) => toPath(poly[0], true)).join(' ');
  };

  const drawBorders = () => {
    borderG.innerHTML = '';
    const iPath = indiaPathData();
    if (iPath) {
      borderG.appendChild(mkPath(iPath, { fill: 'rgba(255,50,50,0.08)', stroke: 'none' }));
      borderG.appendChild(mkPath(iPath, {
        fill: 'none', stroke: '#ff4040',
        'stroke-width': '2.2', 'stroke-opacity': '0.92', 'stroke-linejoin': 'round',
      }));
    }
    const loc  = LOC_LINE.geometry.coordinates as number[][];
    const lacW = LAC_WESTERN.geometry.coordinates as number[][];
    const lacE = LAC_EASTERN.geometry.coordinates as number[][];
    borderG.appendChild(mkPath(toPath(loc), {
      fill: 'none', stroke: '#ff9500', 'stroke-width': '2.8', 'stroke-opacity': '1',
      'stroke-dasharray': '8 4', 'stroke-linecap': 'round',
    }));
    borderG.appendChild(mkPath(toPath(lacW), {
      fill: 'none', stroke: '#00d4ff', 'stroke-width': '2.8', 'stroke-opacity': '1',
      'stroke-dasharray': '5 5', 'stroke-linecap': 'round',
    }));
    borderG.appendChild(mkPath(toPath(lacE), {
      fill: 'none', stroke: '#00d4ff', 'stroke-width': '2.8', 'stroke-opacity': '1',
      'stroke-dasharray': '5 5', 'stroke-linecap': 'round',
    }));
  };

  // Update dot positions via attribute mutation — animations are NOT reset
  let dots: DotEntry[] = [];

  const projectDots = () => {
    dots.forEach(({ conflict, ring, dot, flags }) => {
      const p  = map.project([conflict.lng, conflict.lat]);
      const r  = INTENSITY_SIZE[conflict.intensity] / 2;
      const cx = p.x.toFixed(1);
      const cy = p.y.toFixed(1);
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
      flags.forEach((img, i) => {
        img.setAttribute('x', (p.x - (flags.length > 1 ? 17 : 8) + i * 18).toFixed(1));
        img.setAttribute('y', (p.y + r + 5).toFixed(1));
      });
    });
  };

  const draw = () => { drawBorders(); projectDots(); };

  // Recreate dot elements when the conflict list changes
  const setConflicts = (conflicts: Conflict[], onClickFn: (c: Conflict) => void) => {
    dotG.innerHTML = '';
    dots = [];
    const ringClass: Record<string, string> = {
      critical: 'dr rc', high: 'dr rh', moderate: 'dr rm', low: 'dr rl',
    };

    conflicts.forEach((conflict) => {
      const p     = map.project([conflict.lng, conflict.lat]);
      const r     = INTENSITY_SIZE[conflict.intensity] / 2;
      const color = INTENSITY_COLOR[conflict.intensity];
      const cx    = p.x.toFixed(1);
      const cy    = p.y.toFixed(1);

      // Animated pulse ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', String(r));
      ring.setAttribute('fill', color);
      ring.setAttribute('class', ringClass[conflict.intensity]);

      // Static dot — clickable
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
      dot.setAttribute('r', String(r));
      dot.setAttribute('fill', color);
      dot.setAttribute('stroke', 'rgba(255,255,255,0.4)');
      dot.setAttribute('stroke-width', '2');
      dot.style.cursor = 'pointer';
      dot.style.pointerEvents = 'auto';
      dot.addEventListener('click', (e) => { e.stopPropagation(); onClickFn(conflict); });

      // Flag images
      const flagEls: SVGImageElement[] = [];
      conflict.countries.slice(0, 2).forEach((c, i) => {
        const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        img.setAttribute('href', `https://flagcdn.com/16x12/${c.code.toLowerCase()}.png`);
        img.setAttribute('x', (p.x - (conflict.countries.length > 1 ? 17 : 8) + i * 18).toFixed(1));
        img.setAttribute('y', (p.y + r + 5).toFixed(1));
        img.setAttribute('width', '16');
        img.setAttribute('height', '12');
        img.style.pointerEvents = 'none';
        flagEls.push(img);
      });

      // Z-order: flags behind ring behind dot
      flagEls.forEach((img) => dotG.appendChild(img));
      dotG.appendChild(ring);
      dotG.appendChild(dot);
      dots.push({ conflict, ring, dot, flags: flagEls });
    });
  };

  const events = ['move', 'zoom', 'pitch', 'rotate', 'resize'] as const;
  events.forEach((ev) => map.on(ev, draw));

  ensureIndiaGeo().then(() => drawBorders()).catch(() => {});
  draw();

  return {
    cleanup: () => {
      events.forEach((ev) => map.off(ev, draw));
      if (container.contains(svg)) container.removeChild(svg);
    },
    setConflicts,
  };
}

function addBorderLabels(map: maplibregl.Map): maplibregl.Marker[] {
  const mk = (text: string, color: string) => {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `color:${color};font:bold 9px/1.5 monospace;background:rgba(5,10,20,0.82);padding:1px 5px;border-radius:2px;pointer-events:none;white-space:nowrap;border:1px solid ${color}66;letter-spacing:0.06em;`;
    return el;
  };
  return [
    new maplibregl.Marker({ element: mk('LoC', '#ff9500'), anchor: 'center' }).setLngLat([75.40, 35.05]).addTo(map),
    new maplibregl.Marker({ element: mk('LAC (W)', '#00d4ff'), anchor: 'center' }).setLngLat([79.00, 34.00]).addTo(map),
    new maplibregl.Marker({ element: mk('LAC (E)', '#00d4ff'), anchor: 'center' }).setLngLat([94.50, 28.70]).addTo(map),
  ];
}

export default function MapView({ conflicts, onConflictClick }: Props) {
  const mapContainer  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<maplibregl.Map | null>(null);
  const svgApiRef     = useRef<SvgApi | null>(null);
  const labelMarkers  = useRef<maplibregl.Marker[]>([]);
  const conflictsRef  = useRef<Conflict[]>(conflicts);
  const onClickRef    = useRef(onConflictClick);
  onClickRef.current  = onConflictClick;
  conflictsRef.current = conflicts;

  // Map init
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

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
        { id: 'satellite', type: 'raster', source: 'esri-satellite' },
        { id: 'labels',    type: 'raster', source: 'osm-labels', paint: { 'raster-opacity': 0.7 } },
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
      const api = setupSvgOverlay(map, mapContainer.current!);
      svgApiRef.current = api;
      // Place current conflicts (may have arrived before map loaded)
      api.setConflicts(conflictsRef.current, (c) => onClickRef.current(c));
      labelMarkers.current = addBorderLabels(map);
    });

    mapRef.current = map;
    return () => {
      svgApiRef.current?.cleanup();
      labelMarkers.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current  = null;
      svgApiRef.current = null;
      labelMarkers.current = [];
    };
  }, []);

  // Update dots when conflicts change
  useEffect(() => {
    svgApiRef.current?.setConflicts(conflicts, (c) => onClickRef.current(c));
  }, [conflicts]);

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Title bar */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(5,10,20,0.75)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(220,38,38,0.3)', borderRadius: 4, padding: '4px 14px',
        color: '#94a3b8', fontSize: 11, letterSpacing: '0.12em', fontFamily: 'monospace',
        pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
      }}>
        INDIA STRATEGIC ENVIRONMENT — SATELLITE VIEW
      </div>

      {/* Legend - lines */}
      <div style={{
        position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, pointerEvents: 'none', zIndex: 10,
      }}>
        {[
          { color: '#ff4040', label: 'India (claimed)', dash: undefined },
          { color: '#ff9500', label: 'LoC', dash: '8 4' },
          { color: '#00d4ff', label: 'LAC', dash: '5 5' },
        ].map(({ color, label, dash }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(5,10,20,0.72)', borderRadius: 3, padding: '2px 8px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <svg width="26" height="6">
              <line x1="0" y1="3" x2="26" y2="3" stroke={color} strokeWidth="2.5" strokeDasharray={dash} />
            </svg>
            <span style={{ color: '#cbd5e1', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend - intensity */}
      <div style={{
        position: 'absolute', bottom: 48, left: 12,
        background: 'rgba(5,10,20,0.82)', backdropFilter: 'blur(6px)',
        border: '1px solid #1f3050', borderRadius: 6, padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 5, zIndex: 10,
      }}>
        {([
          ['critical', 'Critical — Direct Impact'],
          ['high',     'High — Direct/Indirect'],
          ['moderate', 'Moderate — Indirect'],
          ['low',      'Low — Monitor'],
        ] as const).map(([intensity, label]) => (
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

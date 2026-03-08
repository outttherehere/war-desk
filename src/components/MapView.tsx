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
// Loads authoritative India boundary from geohacker/india (Survey of India data)
// Includes full claimed territory: PoK, Aksai Chin, full Arunachal Pradesh
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
        // Handle FeatureCollection, Feature, or raw geometry
        const geom: unknown =
          gj.type === 'FeatureCollection' ? gj.features?.[0]?.geometry :
          gj.type === 'Feature'            ? gj.geometry :
                                             gj;
        if (
          geom &&
          typeof geom === 'object' &&
          ((geom as IndiaGeom).type === 'Polygon' || (geom as IndiaGeom).type === 'MultiPolygon')
        ) {
          _indiaGeo = geom as IndiaGeom;
          return;
        }
      } catch { continue; }
    }
  })();

  await _indiaFetch;
}

// ─── Pulse CSS ────────────────────────────────────────────────────────────────
function ensurePulseCSS() {
  if (document.getElementById('cdot-pulse-css')) return;
  const s = document.createElement('style');
  s.id = 'cdot-pulse-css';
  s.textContent = `
    @keyframes p-critical {
      0%,100% { box-shadow: 0 0 6px 2px rgba(220,38,38,.9), 0 0 0 0 rgba(220,38,38,.6); }
      55%      { box-shadow: 0 0 10px 3px rgba(220,38,38,.6), 0 0 0 18px rgba(220,38,38,0); }
    }
    @keyframes p-high {
      0%,100% { box-shadow: 0 0 5px 2px rgba(239,68,68,.8), 0 0 0 0 rgba(239,68,68,.5); }
      55%      { box-shadow: 0 0 8px 2px rgba(239,68,68,.5), 0 0 0 15px rgba(239,68,68,0); }
    }
    @keyframes p-moderate {
      0%,100% { box-shadow: 0 0 4px 1px rgba(248,113,113,.7), 0 0 0 0 rgba(248,113,113,.4); }
      55%      { box-shadow: 0 0 7px 2px rgba(248,113,113,.4), 0 0 0 12px rgba(248,113,113,0); }
    }
    @keyframes p-low {
      0%,100% { box-shadow: 0 0 3px 1px rgba(252,165,165,.6), 0 0 0 0 rgba(252,165,165,.3); }
      55%      { box-shadow: 0 0 5px 1px rgba(252,165,165,.3), 0 0 0 10px rgba(252,165,165,0); }
    }
  `;
  document.head.appendChild(s);
}

function buildDotEl(conflict: Conflict): HTMLElement {
  const size = INTENSITY_SIZE[conflict.intensity];
  const color = INTENSITY_COLOR[conflict.intensity];
  const speed: Record<string, string> = { critical: '1.4s', high: '2.0s', moderate: '2.8s', low: '3.6s' };

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position:relative; cursor:pointer;
    display:flex; flex-direction:column; align-items:center; gap:3px;
    width:${size + 16}px;
  `;
  wrap.title = conflict.title;

  const dot = document.createElement('div');
  dot.style.cssText = `
    width:${size}px; height:${size}px;
    border-radius:50%;
    background:${color};
    border:2px solid rgba(255,255,255,0.35);
    flex-shrink:0;
    animation:p-${conflict.intensity} ${speed[conflict.intensity]} ease-in-out infinite;
  `;

  const flags = document.createElement('div');
  flags.style.cssText = 'display:flex;gap:2px;pointer-events:none;';
  conflict.countries.slice(0, 2).forEach((c) => {
    const img = document.createElement('img');
    img.src = `https://flagcdn.com/16x12/${c.code.toLowerCase()}.png`;
    img.alt = c.name;
    img.style.cssText = 'width:16px;height:12px;border-radius:1px;box-shadow:0 1px 3px rgba(0,0,0,0.85);display:block;';
    flags.appendChild(img);
  });

  wrap.appendChild(dot);
  wrap.appendChild(flags);
  return wrap;
}

// ─── SVG overlay ──────────────────────────────────────────────────────────────
// Converts geo coords → screen pixels via map.project(). Redraws on every move/zoom.
function setupSvgOverlay(map: maplibregl.Map, container: HTMLDivElement): () => void {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:visible;';
  container.appendChild(svg);

  type Coord = [number, number];

  const toPath = (coords: number[][], close = false): string => {
    if (!coords.length) return '';
    const d = coords.map((c, i) => {
      const p = map.project(c as Coord);
      return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    });
    return d.join(' ') + (close ? 'Z' : '');
  };

  const mkPath = (d: string, attrs: Record<string, string>): SVGPathElement => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  // Build SVG path data from India geometry (Polygon or MultiPolygon)
  const indiaPathData = (): string => {
    if (!_indiaGeo) return '';
    if (_indiaGeo.type === 'Polygon') {
      // coordinates[0] is the outer ring
      return toPath(_indiaGeo.coordinates[0] as number[][], true);
    }
    // MultiPolygon: coordinates is array of polygons, each polygon[0] is outer ring
    return (_indiaGeo.coordinates as number[][][][])
      .map((poly) => toPath(poly[0], true))
      .join(' ');
  };

  const draw = () => {
    svg.innerHTML = '';

    const loc  = LOC_LINE.geometry.coordinates as number[][];
    const lacW = LAC_WESTERN.geometry.coordinates as number[][];
    const lacE = LAC_EASTERN.geometry.coordinates as number[][];

    // India fill + border (only if geometry loaded)
    const iPath = indiaPathData();
    if (iPath) {
      svg.appendChild(mkPath(iPath, {
        fill: 'rgba(255,50,50,0.08)', stroke: 'none',
      }));
      svg.appendChild(mkPath(iPath, {
        fill: 'none', stroke: '#ff4040',
        'stroke-width': '2.2', 'stroke-opacity': '0.92', 'stroke-linejoin': 'round',
      }));
    }

    // LoC
    svg.appendChild(mkPath(toPath(loc), {
      fill: 'none', stroke: '#ff9500',
      'stroke-width': '2.8', 'stroke-opacity': '1',
      'stroke-dasharray': '8 4', 'stroke-linecap': 'round',
    }));
    // LAC W
    svg.appendChild(mkPath(toPath(lacW), {
      fill: 'none', stroke: '#00d4ff',
      'stroke-width': '2.8', 'stroke-opacity': '1',
      'stroke-dasharray': '5 5', 'stroke-linecap': 'round',
    }));
    // LAC E
    svg.appendChild(mkPath(toPath(lacE), {
      fill: 'none', stroke: '#00d4ff',
      'stroke-width': '2.8', 'stroke-opacity': '1',
      'stroke-dasharray': '5 5', 'stroke-linecap': 'round',
    }));
  };

  // Start loading India geometry; redraw once it arrives
  ensureIndiaGeo().then(() => draw()).catch(() => {/* show LoC/LAC without India border */});

  const events = ['move', 'zoom', 'pitch', 'rotate', 'resize'] as const;
  events.forEach((ev) => map.on(ev, draw));
  draw();

  return () => {
    events.forEach((ev) => map.off(ev, draw));
    if (container.contains(svg)) container.removeChild(svg);
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const dotMarkersRef = useRef<maplibregl.Marker[]>([]);
  const labelMarkersRef = useRef<maplibregl.Marker[]>([]);
  const stopSvgRef = useRef<(() => void) | null>(null);
  const onClickRef = useRef(onConflictClick);
  onClickRef.current = onConflictClick;

  ensurePulseCSS();

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
        { id: 'labels', type: 'raster', source: 'osm-labels', paint: { 'raster-opacity': 0.7 } },
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
      stopSvgRef.current = setupSvgOverlay(map, mapContainer.current!);
      labelMarkersRef.current = addBorderLabels(map);
    });

    mapRef.current = map;
    return () => {
      stopSvgRef.current?.();
      labelMarkersRef.current.forEach((m) => m.remove());
      dotMarkersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
      dotMarkersRef.current = [];
      labelMarkersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const place = () => {
      dotMarkersRef.current.forEach((m) => m.remove());
      dotMarkersRef.current = [];
      conflicts.forEach((conflict) => {
        const el = buildDotEl(conflict);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onClickRef.current(conflict);
        });
        const m = new maplibregl.Marker({ element: el, anchor: 'top' })
          .setLngLat([conflict.lng, conflict.lat])
          .addTo(map);
        dotMarkersRef.current.push(m);
      });
    };

    if (map.isStyleLoaded()) place();
    else map.once('load', place);
  }, [conflicts]);

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(5,10,20,0.75)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(220,38,38,0.3)', borderRadius: 4, padding: '4px 14px',
        color: '#94a3b8', fontSize: 11, letterSpacing: '0.12em', fontFamily: 'monospace',
        pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
      }}>
        INDIA STRATEGIC ENVIRONMENT — SATELLITE VIEW
      </div>

      <div style={{
        position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, pointerEvents: 'none', zIndex: 10,
      }}>
        {[
          { color: '#ff4040', label: 'India (claimed)', dash: undefined },
          { color: '#ff9500', label: 'LoC', dash: '8 4' },
          { color: '#00d4ff', label: 'LAC', dash: '5 5' },
        ].map(({ color, label, dash }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(5,10,20,0.72)', borderRadius: 3, padding: '2px 8px',
            border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="26" height="6">
              <line x1="0" y1="3" x2="26" y2="3" stroke={color} strokeWidth="2.5" strokeDasharray={dash} />
            </svg>
            <span style={{ color: '#cbd5e1', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 48, left: 12,
        background: 'rgba(5,10,20,0.82)', backdropFilter: 'blur(6px)',
        border: '1px solid #1f3050', borderRadius: 6, padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 5, zIndex: 10,
      }}>
        {([
          ['critical', 'Critical — Direct Impact'],
          ['high', 'High — Direct/Indirect'],
          ['moderate', 'Moderate — Indirect'],
          ['low', 'Low — Monitor'],
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

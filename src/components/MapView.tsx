import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Conflict } from '../types';

// No API key needed — uses free Esri World Imagery + OpenStreetMap labels
const mapboxgl = maplibregl;

// Shifted south + slightly west to fit all zones including Indian Ocean, Red Sea
const INDIA_CENTER: [number, number] = [72.0, 18.0];
const INDIA_ZOOM = 3.8;

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

function buildMarkerEl(conflict: Conflict): HTMLElement {
  const color = INTENSITY_COLOR[conflict.intensity];
  const glow = INTENSITY_GLOW[conflict.intensity];
  const size = INTENSITY_SIZE[conflict.intensity];
  const pulseSpeed = conflict.intensity === 'critical' ? '1.2s' : conflict.intensity === 'high' ? '1.8s' : conflict.intensity === 'moderate' ? '2.5s' : '3.5s';

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

  // Outer pulse ring
  const ring = document.createElement('div');
  ring.style.cssText = `
    position: absolute;
    width: ${size + 16}px;
    height: ${size + 16}px;
    border-radius: 50%;
    background: ${glow};
    animation: pulse-ring ${pulseSpeed} ease-out infinite;
  `;

  // Inner dot
  const dot = document.createElement('div');
  dot.style.cssText = `
    position: relative;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    box-shadow: 0 0 ${size / 2}px ${glow}, 0 0 ${size}px ${glow};
    border: 2px solid rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  `;

  // Flag images via flagcdn.com (Windows-compatible, no emoji rendering issues)
  const flagWrap = document.createElement('div');
  flagWrap.style.cssText = `
    position: absolute;
    bottom: -16px;
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

  wrap.appendChild(ring);
  wrap.appendChild(dot);
  wrap.appendChild(flagWrap);
  return wrap;
}

export default function MapView({ conflicts, onConflictClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Free satellite + labels style using Esri World Imagery + OSM labels via MapLibre
    const FREE_STYLE = {
      version: 8 as const,
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

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'bottom-right'
    );

    // Subtle vignette overlay — India boundary highlight
    map.on('load', () => {
      // Add a subtle highlight layer for India
      map.addSource('india-highlight', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [78.9629, 20.5937],
              },
              properties: {},
            },
          ],
        },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add / update markers when conflicts change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addMarkers = () => {
      // Remove stale
      markersRef.current.forEach((marker, id) => {
        if (!conflicts.find((c) => c.id === id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      // Add new
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

    if (map.isStyleLoaded()) {
      addMarkers();
    } else {
      map.on('load', addMarkers);
    }
  }, [conflicts, onConflictClick]);

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Map label overlay */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(5,10,20,0.75)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 4,
          padding: '4px 14px',
          color: '#94a3b8',
          fontSize: 11,
          letterSpacing: '0.12em',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        INDIA STRATEGIC ENVIRONMENT — SATELLITE VIEW
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 12,
          background: 'rgba(5,10,20,0.82)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #1f3050',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {(
          [
            ['critical', 'Critical — Direct Impact'],
            ['high', 'High — Direct/Indirect'],
            ['moderate', 'Moderate — Indirect'],
            ['low', 'Low — Monitor'],
          ] as const
        ).map(([intensity, label]) => (
          <div
            key={intensity}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <div
              style={{
                width: INTENSITY_SIZE[intensity],
                height: INTENSITY_SIZE[intensity],
                borderRadius: '50%',
                background: INTENSITY_COLOR[intensity],
                boxShadow: `0 0 6px ${INTENSITY_GLOW[intensity]}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: '#94a3b8',
                fontSize: 10,
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

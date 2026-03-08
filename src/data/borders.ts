// ─── India Strategic Borders ───────────────────────────────────────────────
// All coordinates are [longitude, latitude] per GeoJSON spec.
//
// India's claimed boundary is loaded at runtime from authoritative GeoJSON
// (geohacker/india — Survey of India data) via fetchIndiaGeometry() in MapView.
//
// LOC: Line of Control — de facto boundary in J&K (UNMO-monitored)
// LAC: Line of Actual Control — de facto boundary with China (two sectors)

// ─── Line of Control (LoC) ────────────────────────────────────────────────────
// Runs from Suchetgarh (south) to Siachen glacier (north)
// Orange dashed line — UNMO-monitored ceasefire line
export const LOC_LINE: GeoJSON.Feature<GeoJSON.LineString> = {
  type: 'Feature',
  properties: { name: 'Line of Control (LoC)', labelAt: [75.85, 35.05] },
  geometry: {
    type: 'LineString',
    coordinates: [
      [74.31, 32.48],
      [74.50, 32.85],
      [74.25, 33.20],
      [74.10, 33.55],
      [73.95, 33.90],
      [74.08, 34.30],
      [74.40, 34.65],
      [74.95, 34.90],
      [75.50, 35.10],
      [76.10, 35.30],
      [76.80, 35.52],
      [77.20, 35.65],
      [77.50, 35.72],
    ],
  },
};

// ─── Line of Actual Control (LAC) ────────────────────────────────────────────
// Two sectors:
//   Western: Siachen → through Ladakh → Tibet-Nepal trijunction
//   Eastern: Bhutan trijunction → through Arunachal → Myanmar trijunction
// Blue dashed line — no formal agreement; positions differ per India/China
export const LAC_WESTERN: GeoJSON.Feature<GeoJSON.LineString> = {
  type: 'Feature',
  properties: { name: 'LAC — Western Sector', labelAt: [79.20, 33.60] },
  geometry: {
    type: 'LineString',
    coordinates: [
      [77.50, 35.72], // connects to LoC N end (Siachen)
      [78.00, 35.50],
      [78.50, 34.80],
      [78.90, 34.20],
      [79.20, 33.60],
      [79.50, 33.00],
      [79.80, 32.30],
      [80.10, 31.50],
      [80.30, 30.50],
    ],
  },
};

export const LAC_EASTERN: GeoJSON.Feature<GeoJSON.LineString> = {
  type: 'Feature',
  properties: { name: 'LAC — Eastern Sector (McMahon Line)', labelAt: [94.50, 28.60] },
  geometry: {
    type: 'LineString',
    coordinates: [
      [92.00, 27.50],
      [93.00, 27.80],
      [93.80, 28.10],
      [95.00, 29.00],
      [95.80, 28.60],
      [96.50, 28.20],
      [97.00, 28.00],
      [97.40, 28.30],
    ],
  },
};

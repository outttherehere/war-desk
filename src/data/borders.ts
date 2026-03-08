// ─── India Strategic Borders ───────────────────────────────────────────────
// All coordinates are [longitude, latitude] per GeoJSON spec.
//
// INDIA'S CLAIMED BOUNDARY: Represents India's official territorial claim
// per the Survey of India, including:
//   • All of Jammu & Kashmir (incl. Pakistan-administered PoK / Gilgit-Baltistan)
//   • Aksai Chin (currently under Chinese administration)
//   • Arunachal Pradesh (India's claim follows the McMahon Line)
//
// LOC: Line of Control — de facto boundary in J&K (UNMO-monitored)
// LAC: Line of Actual Control — de facto boundary with China (two sectors)

// ─── India's Claimed Outer Boundary (simplified polygon) ─────────────────────
// Traced clockwise: NW J&K corner → N boundary → NE → E coast → S tip →
// W coast → Pakistan border → PoK western edge → NW corner
export const INDIA_CLAIMED_POLYGON: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: 'Feature',
  properties: { name: 'India (claimed territory)' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // ─ NW corner of claimed J&K (near Wakhan corridor) ─
      [74.50, 37.10],
      // ─ N boundary: along Karakoram / Afghan border ─
      [75.50, 37.40], [77.00, 37.50], [78.50, 37.00],
      // ─ Aksai Chin (India's claim, Chinese-administered) ─
      [79.80, 36.60], [81.00, 35.60], [82.50, 35.10], [83.20, 34.50],
      // ─ India-Tibet boundary (HP / Uttarakhand sector) ─
      [82.50, 33.00], [81.50, 32.00], [80.30, 30.50], [80.20, 30.00],
      // ─ Nepal border (W → E) ─
      [80.00, 29.50], [81.00, 28.50], [83.50, 28.00],
      [85.00, 27.60], [86.50, 27.50], [88.00, 26.85],
      // ─ Bhutan border ─
      [89.00, 26.50], [92.00, 26.75],
      // ─ Arunachal Pradesh: McMahon Line (India's claimed boundary) ─
      [92.00, 27.50], [93.50, 28.10], [95.00, 29.00],
      [96.00, 28.60], [97.00, 28.00], [97.40, 28.30],
      // ─ Myanmar border (N → S) ─
      [97.40, 27.20], [97.00, 25.50], [96.00, 23.50],
      [95.00, 22.50], [93.50, 22.00], [93.00, 23.50],
      // ─ Bangladesh border (simplified) ─
      [92.50, 22.00], [91.50, 24.00], [91.00, 24.60],
      [90.00, 26.00], [89.50, 26.00], [89.00, 25.50],
      [88.50, 25.50], [88.50, 24.00], [88.50, 22.00],
      // ─ Bay of Bengal / East coast (simplified) ─
      [87.50, 21.50], [87.00, 20.50], [85.50, 19.50],
      [84.00, 18.00], [82.50, 17.00], [81.00, 16.50],
      [80.00, 15.00], [79.50, 14.00], [78.50, 13.00],
      // ─ S tip (Kanyakumari) ─
      [77.50, 9.50], [77.20, 8.30], [77.00, 8.10],
      // ─ W coast (N-bound, simplified) ─
      [76.50, 9.00], [76.00, 10.00], [75.50, 12.00],
      [74.50, 14.50], [73.50, 16.50], [73.00, 18.50],
      [72.80, 20.00], [72.00, 21.00], [69.00, 22.50],
      // ─ India-Pakistan international border (Gujarat → Punjab) ─
      [68.20, 23.00], [68.50, 23.50], [70.50, 24.50],
      [71.00, 26.00], [70.50, 27.50], [73.00, 29.00],
      [74.50, 31.50], [74.70, 32.00],
      // ─ PoK western edge (India's claimed boundary, not LoC) ─
      [73.80, 32.50], [73.20, 33.80], [72.80, 34.50],
      [73.00, 35.00], [73.50, 36.00], [74.00, 36.80],
      // ─ Close polygon at NW corner ─
      [74.50, 37.10],
    ]],
  },
};

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

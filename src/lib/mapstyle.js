// Raster base maps, no API key needed. Satellite: Esri World Imagery. Map: OpenStreetMap.
export function baseStyle(kind) {
  return {
    version: 8,
    sources: {
      sat: {
        type: 'raster', tileSize: 256, maxzoom: 19,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics'
      },
      osm: {
        type: 'raster', tileSize: 256, maxzoom: 19,
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#0b0d0c' } },
      { id: 'sat', type: 'raster', source: 'sat', layout: { visibility: kind === 'sat' ? 'visible' : 'none' } },
      { id: 'osm', type: 'raster', source: 'osm', layout: { visibility: kind === 'osm' ? 'visible' : 'none' },
        paint: { 'raster-saturation': -0.3, 'raster-brightness-max': 0.85 } }
    ]
  };
}

export function addOverlayLayers(map) {
  const empty = { type: 'FeatureCollection', features: [] };
  map.addSource('draw', { type: 'geojson', data: empty });
  map.addSource('draft', { type: 'geojson', data: empty });
  map.addSource('replay', { type: 'geojson', data: empty });
  map.addSource('acc', { type: 'geojson', data: empty });

  map.addLayer({ id: 'acc-fill', type: 'fill', source: 'acc', paint: { 'fill-color': '#4cc3ff', 'fill-opacity': 0.08 } });
  map.addLayer({ id: 'draw-fill', type: 'fill', source: 'draw', filter: ['==', ['get', 'shape'], 'zone'],
    paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['case', ['get', 'nogo'], 0.28, 0.14] } });
  map.addLayer({ id: 'draw-zone-line', type: 'line', source: 'draw', filter: ['==', ['get', 'shape'], 'zone'],
    paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-dasharray': [3, 2] } });
  map.addLayer({ id: 'draw-line', type: 'line', source: 'draw', filter: ['==', ['get', 'shape'], 'line'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'color'], 'line-width': 4 } });
  map.addLayer({ id: 'draw-arrow', type: 'circle', source: 'draw', filter: ['==', ['get', 'shape'], 'end'],
    paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#000', 'circle-stroke-width': 1.5 } });
  map.addLayer({ id: 'draft-line', type: 'line', source: 'draft', filter: ['!=', ['geometry-type'], 'Point'],
    paint: { 'line-color': '#ffffff', 'line-width': 3, 'line-dasharray': [2, 1] } });
  map.addLayer({ id: 'draft-pts', type: 'circle', source: 'draft', filter: ['==', ['geometry-type'], 'Point'],
    paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-color': '#000', 'circle-stroke-width': 2 } });
  map.addLayer({ id: 'replay-line', type: 'line', source: 'replay', filter: ['==', ['geometry-type'], 'LineString'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': 0.75 } });
  map.addLayer({ id: 'replay-dot', type: 'circle', source: 'replay', filter: ['==', ['geometry-type'], 'Point'],
    paint: { 'circle-radius': 7, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#000', 'circle-stroke-width': 2 } });
}

/** circle polygon around a point for GPS accuracy */
export function circle(lng, lat, meters, steps = 32) {
  const pts = [];
  const dLat = meters / 111320, dLng = meters / (111320 * Math.cos(lat * Math.PI / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    pts.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [pts] }, properties: {} };
}

export const SQUAD_PALETTE = ['#4cc3ff', '#e3b341', '#3fb950', '#ff7b72', '#a371f7', '#f0883e', '#f778ba', '#79c0ff'];
import { isBoches, BOCHES_BLUE } from './boches.js';
export function squadColor(name) {
  if (!name) return '#c9d1d9';
  if (isBoches(name)) return BOCHES_BLUE;
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SQUAD_PALETTE[h % SQUAD_PALETTE.length];
}

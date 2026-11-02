// Field maps (plattegronden): an image laid over the satellite map with 4 corners,
// shared with the faction as a 'field' event. Images go to the public storage bucket volkov-fields.
import { sb } from './api.js';
import { S } from './store.svelte.js';
import { FIELD_PRESETS } from './config.js';

export const presetById = (id) => FIELD_PRESETS.find((p) => p.id === id) || null;

/** Image URL of a field event's data: bundled preset or uploaded image. */
export function fieldUrl(d) {
  const p = d?.preset && presetById(d.preset);
  return p ? p.img : d?.url || null;
}

/** Corners for an image of w x h, widthM metres wide, centred on [lng, lat]. */
export function cornersAt([lng, lat], widthM, w, h) {
  const k = Math.cos((lat * Math.PI) / 180);
  const halfW = widthM / 2 / (111320 * k), halfH = (widthM * (h / w)) / 2 / 110540;
  return [[lng - halfW, lat + halfH], [lng + halfW, lat + halfH], [lng + halfW, lat - halfH], [lng - halfW, lat - halfH]];
}

/** Latest field map shared in this faction (or null). */
export function currentField() {
  let best = null;
  for (const e of Object.values(S.events)) if (e.kind === 'field' && (!best || e.id > best.id)) best = e;
  return best;
}

function resize(file, max = 2048) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? resolve({ blob: b, w: c.width, h: c.height }) : reject(new Error('image'))), 'image/jpeg', 0.85);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('image'));
    img.src = URL.createObjectURL(file);
  });
}

/** Upload a photo/screenshot of a field map. Returns { url, w, h }. */
export async function uploadFieldImage(file) {
  const { blob, w, h } = await resize(file);
  const name = `${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from('volkov-fields').upload(name, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from('volkov-fields').getPublicUrl(name);
  return { url: data.publicUrl, w, h };
}

/** Initial corners: centred in the current view, keeping the image aspect ratio. */
export function startCorners(map, w, h) {
  const b = map.getBounds();
  const c = map.getCenter();
  const spanLng = (b.getEast() - b.getWest()) * 0.55;
  const spanLat = (b.getNorth() - b.getSouth()) * 0.55;
  const k = Math.cos((c.lat * Math.PI) / 180);
  // fit width/height in metres-ish units
  let halfW = spanLng / 2, halfH = (halfW * k * (h / w));
  if (halfH > spanLat / 2) { halfH = spanLat / 2; halfW = (halfH * (w / h)) / k; }
  return [
    [c.lng - halfW, c.lat + halfH], [c.lng + halfW, c.lat + halfH],
    [c.lng + halfW, c.lat - halfH], [c.lng - halfW, c.lat - halfH]
  ];
}

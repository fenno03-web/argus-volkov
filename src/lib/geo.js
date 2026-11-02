import { Capacitor, registerPlugin } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { S } from './store.svelte.js';
import { sendPosition } from './api.js';
import { t } from './i18n.js';

const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');
const native = Capacitor.isNativePlatform();

let watchId = null, webWatch = null, wakeLock = null, battTimer = null, battery = null;

async function readBattery() {
  try {
    if (native) {
      const b = await Device.getBatteryInfo();
      battery = b.batteryLevel != null ? Math.round(b.batteryLevel * 100) : null;
    } else if (navigator.getBattery) {
      const b = await navigator.getBattery();
      battery = Math.round(b.level * 100);
    }
  } catch { /* unknown */ }
}

function onFix(lat, lng, acc, heading) {
  const prev = S.myPos;
  if (heading == null || Number.isNaN(heading)) heading = prev?.heading ?? null;
  S.myPos = { lat, lng, acc, heading };
  S.gpsError = null;
  sendPosition(S.myPos, battery);
}

async function keepAwake() {
  try {
    if (!native && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      document.addEventListener('visibilitychange', reAwake);
    }
  } catch { /* not allowed */ }
}
async function reAwake() {
  if (document.visibilityState === 'visible' && webWatch !== null) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch { /* ignore */ }
  }
}

export async function startTracking() {
  await readBattery();
  battTimer = setInterval(readBattery, 60000);
  if (native) {
    watchId = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: t('bg_title'),
        backgroundMessage: t('bg_msg'),
        requestPermissions: true,
        stale: false,
        distanceFilter: 2
      },
      (loc, err) => {
        if (err) { S.gpsError = t('gps_off'); return; }
        onFix(loc.latitude, loc.longitude, loc.accuracy, loc.bearing);
      }
    );
  } else if ('geolocation' in navigator) {
    webWatch = navigator.geolocation.watchPosition(
      (p) => onFix(p.coords.latitude, p.coords.longitude, p.coords.accuracy, p.coords.heading),
      () => (S.gpsError = t('gps_off')),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    keepAwake();
  } else {
    S.gpsError = t('gps_off');
  }
}

export async function stopTracking() {
  clearInterval(battTimer);
  if (watchId) { try { await BackgroundGeolocation.removeWatcher({ id: watchId }); } catch { /* ignore */ } watchId = null; }
  if (webWatch !== null) { navigator.geolocation.clearWatch(webWatch); webWatch = null; }
  try { await wakeLock?.release(); } catch { /* ignore */ }
  document.removeEventListener('visibilitychange', reAwake);
}

/** One-off position for the lobby (nearby games / new game location). */
export function getOnce() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

export function distM(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function isNative() { return native; }

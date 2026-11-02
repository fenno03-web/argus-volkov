// Global app state (Svelte 5 runes). Persisted bits go to localStorage.
const KEY = 'volkov.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
const saved = load();

export const S = $state({
  lang: saved.lang || (navigator.language?.startsWith('nl') ? 'nl' : 'en'),
  night: !!saved.night,
  speech: saved.speech !== false,
  eggs: !!saved.eggs,
  field: saved.field ?? 'auto',   // 'auto' | 'none' | field id
  fieldOpacity: saved.fieldOpacity ?? 0.85,
  mapStyle: saved.mapStyle || 'sat',
  profile: saved.profile || { name: '', squad: '', role: 'rifleman' },
  session: saved.session || null, // { token, player_id, faction:{id,name,color}, game:{id,code,name,lat,lng} }
  // live (not persisted)
  players: {},   // id -> player
  events: {},    // id -> event
  myPos: null,   // { lat, lng, heading, acc }
  gpsError: null,
  online: true,
  unread: 0,
  toast: null,
  squadOnly: false
});

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      lang: S.lang, night: S.night, speech: S.speech, eggs: S.eggs, field: S.field, fieldOpacity: S.fieldOpacity, mapStyle: S.mapStyle,
      profile: S.profile, session: S.session
    }));
  } catch { /* storage unavailable */ }
}

let toastTimer;
export function toast(text, kind = 'info', ms = 3500) {
  S.toast = { text, kind };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (S.toast = null), ms);
}

export function me() {
  return S.session ? S.players[S.session.player_id] : null;
}

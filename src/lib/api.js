import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { S, persist, toast } from './store.svelte.js';
import { t } from './i18n.js';
import { buzz, speak } from './notify.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 20 } }
});

export async function rpc(fn, args = {}) {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

// ---------- lobby ----------
export const nearby = (lat, lng, km = 15) => rpc('volkov_nearby', { p_lat: lat, p_lng: lng, p_km: km });
export const gameInfo = (code) => rpc('volkov_game_info', { p_code: code });
export const createGame = (a) => rpc('volkov_create_game', {
  p_name: a.name, p_lat: a.lat ?? null, p_lng: a.lng ?? null, p_faction: a.faction, p_color: a.color, p_codeword: a.codeword
});
export const addFaction = (a) => rpc('volkov_add_faction', { p_code: a.code, p_name: a.name, p_color: a.color, p_codeword: a.codeword });
export const joinFaction = (factionId, codeword) => rpc('volkov_join', { p_faction_id: factionId, p_codeword: codeword });

/** After create/join: register the player and store the session. */
export async function enter(token) {
  const p = S.profile;
  const prev = S.session?.token === token ? S.session.player_id : null;
  const r = await rpc('volkov_hello', { p_token: token, p_player: prev, p_name: p.name, p_squad: p.squad, p_role: p.role });
  S.session = { token, player_id: r.player_id, faction: r.faction, game: r.game };
  S.players = {}; S.events = {}; S.unread = 0;
  persist();
  return S.session;
}

export async function updateProfile() {
  persist();
  if (!S.session) return;
  const p = S.profile;
  await rpc('volkov_hello', { p_token: S.session.token, p_player: S.session.player_id, p_name: p.name, p_squad: p.squad, p_role: p.role });
  bcast('ping', {});
}

export function leave() {
  stopSync();
  S.session = null; S.players = {}; S.events = {};
  persist();
}

// ---------- live sync ----------
let channel = null, timer = null, since = null, joinedAt = 0, running = false;

function nameOf(pid) { return S.players[pid]?.name || '?'; }

function onEvent(e, live) {
  if (!e) return;
  const isNew = !S.events[e.id];
  if (e.deleted) { delete S.events[e.id]; return; }
  S.events[e.id] = e;
  if (!live || !isNew || e.player_id === S.session?.player_id) return;
  if (new Date(e.created_at).getTime() < joinedAt - 5000) return;
  const mine = S.players[S.session?.player_id];
  if (e.data?.squad && mine && e.data.squad !== mine.squad) return; // squad-only message for another squad
  if (e.kind === 'chat') {
    S.unread++;
    buzz(false);
  } else if (e.kind === 'alert') {
    const txt = `${nameOf(e.player_id)}: ${t('a_' + e.data.alert)}`;
    toast(txt, 'alert', 6000);
    buzz(true);
    speak(txt);
  } else if (e.kind === 'marker' && e.data.type === 'enemy') {
    buzz(false);
    speak(`${nameOf(e.player_id)}: ${t('m_enemy')}`);
  }
}

function onPlayer(p, live) {
  const old = S.players[p.id];
  S.players[p.id] = { ...old, ...p };
  if (live && old && old.status !== p.status && p.id !== S.session?.player_id) {
    const txt = `${p.name || old.name} ${p.status === 'hit' ? t('is_hit') : t('respawned')}`;
    toast(txt, p.status === 'hit' ? 'alert' : 'info');
    if (p.status === 'hit') speak(txt);
  }
}

async function tick() {
  if (!S.session) return;
  try {
    const r = await rpc('volkov_sync', { p_token: S.session.token, p_since: since });
    const live = since !== null;
    for (const p of r.players) onPlayer(p, live);
    for (const e of r.events) onEvent(e, live);
    since = r.now;
    S.online = true;
  } catch (e) {
    S.online = false;
    if (/BAD_TOKEN/.test(e.message)) { toast(t('err_BAD_TOKEN'), 'alert'); leave(); }
  }
}

export function startSync() {
  if (running || !S.session) return;
  running = true; since = null; joinedAt = Date.now();
  tick();
  timer = setInterval(tick, 4000);
  // instant fan-out between phones; the 4 s sync is the source of truth
  const ch = 'vk-' + S.session.token.slice(0, 32);
  channel = sb.channel(ch, { config: { broadcast: { self: false } } });
  channel
    .on('broadcast', { event: 'ev' }, ({ payload }) => onEvent(payload, true))
    .on('broadcast', { event: 'pos' }, ({ payload }) => onPlayer(payload, true))
    .on('broadcast', { event: 'ping' }, () => tick())
    .subscribe();
  document.addEventListener('visibilitychange', onVis);
}

function onVis() { if (document.visibilityState === 'visible') tick(); }

export function stopSync() {
  running = false;
  clearInterval(timer); timer = null;
  if (channel) { sb.removeChannel(channel); channel = null; }
  document.removeEventListener('visibilitychange', onVis);
}

function bcast(event, payload) {
  try { channel?.send({ type: 'broadcast', event, payload }); } catch { /* ignore */ }
}

// ---------- actions ----------
export async function sendEvent(kind, data) {
  const s = S.session;
  const e = await rpc('volkov_event', { p_token: s.token, p_player: s.player_id, p_kind: kind, p_data: data });
  S.events[e.id] = e;
  bcast('ev', e);
  return e;
}

export async function deleteEvent(id) {
  const s = S.session;
  const e = await rpc('volkov_event', { p_token: s.token, p_player: s.player_id, p_kind: 'del', p_data: { id } });
  delete S.events[id];
  if (e) bcast('ev', e);
}

export async function setStatus(status) {
  const s = S.session;
  const p = S.players[s.player_id];
  if (p) p.status = status;
  await rpc('volkov_status', { p_token: s.token, p_player: s.player_id, p_status: status });
  if (p) bcast('pos', { ...p, status, updated_at: new Date().toISOString() });
}

let lastSent = 0, lastLat = 0, lastLng = 0, sending = false;
export async function sendPosition(pos, battery) {
  const s = S.session;
  if (!s || sending) return;
  const now = Date.now();
  const moved = Math.abs(pos.lat - lastLat) + Math.abs(pos.lng - lastLng) > 0.00003;
  if (now - lastSent < 3000 && !moved) return;
  if (now - lastSent < 1500) return;
  sending = true; lastSent = now; lastLat = pos.lat; lastLng = pos.lng;
  try {
    await rpc('volkov_pos', { p_token: s.token, p_player: s.player_id, p_lat: pos.lat, p_lng: pos.lng,
      p_heading: pos.heading ?? null, p_acc: pos.acc ?? null, p_battery: battery ?? null });
    const p = S.players[s.player_id] || { id: s.player_id, name: S.profile.name, squad: S.profile.squad, role: S.profile.role, status: 'ok' };
    const upd = { ...p, lat: pos.lat, lng: pos.lng, heading: pos.heading, acc: pos.acc, battery, pos_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    S.players[s.player_id] = upd;
    bcast('pos', upd);
    S.online = true;
  } catch { S.online = false; }
  finally { sending = false; }
}

export const getTracks = () => rpc('volkov_tracks_get', { p_token: S.session.token, p_from: null });

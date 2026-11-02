// Public (publishable) Supabase settings. Safe to ship in the app:
// all Volkov tables have RLS on and are only reachable via token-checked RPC functions.
export const SUPABASE_URL = 'https://nxlozepwjjfxxxmcadnq.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_ZWzmO6NzE8zTTEnlgp1-lQ_LhdUFKpY';
export const WEB_URL = 'https://fenno03-web.github.io/argus-volkov/';
export const VERSION = '0.1.0';

export const FACTION_COLORS = [
  { name: 'Geel', color: '#e3b341' },
  { name: 'Rood', color: '#d64545' },
  { name: 'Blauw', color: '#3b82f6' },
  { name: 'Groen', color: '#3fb950' },
  { name: 'Oranje', color: '#f0883e' },
  { name: 'Paars', color: '#a371f7' },
  { name: 'Wit', color: '#e6edf3' }
];

export const ROLES = ['rifleman', 'leader', 'medic', 'sniper', 'support', 'scout', 'commander', 'pilot'];

export const MARKERS = [
  { type: 'enemy', glyph: '✕', color: '#ff4d4d' },
  { type: 'objective', glyph: '◎', color: '#e3b341' },
  { type: 'flag', glyph: '⚑', color: '#e3b341' },
  { type: 'intel', glyph: 'i', color: '#58a6ff' },
  { type: 'rally', glyph: 'R', color: '#3fb950' },
  { type: 'medic', glyph: '+', color: '#ff7b72' },
  { type: 'danger', glyph: '!', color: '#f0883e' },
  { type: 'base', glyph: '⌂', color: '#c9d1d9' },
  { type: 'shell', glyph: '', color: '#2f8cff', secret: true }
];

export const ALERTS = ['contact', 'help', 'rally', 'enemy_seen', 'obj_taken', 'fall_back', 'push', 'hold'];

export const DRAW_COLORS = ['#e3b341', '#3fb950', '#58a6ff', '#ff4d4d', '#f0f6fc'];

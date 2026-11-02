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

// Preset field maps (official Airsoft Vets maps, bundled so they also work offline).
// img = overlay laid on the satellite map, plan = full sheet with legend for the viewer.
// center/widthM are rough starting points; players align once and the app remembers it.
export const FIELD_PRESETS = [
  { id: 'trancentral', name: 'Trancentral', img: 'fields/trancentral.jpg', plan: 'fields/trancentral-plan.jpg', w: 1978, h: 479,
    center: [5.4005, 50.6655], widthM: 650, place: 'Fexhe-le-Haut-Clocher' },
  { id: 'wolfenstein', name: 'Wolfenstein', img: 'fields/wolfenstein.jpg', plan: 'fields/wolfenstein.jpg', w: 2048, h: 1449,
    center: [5.8470, 50.4125], widthM: 260, place: 'Stoumont' },
  { id: 'maze', name: 'The Maze II', img: 'fields/maze.jpg', plan: 'fields/maze.jpg', w: 2048, h: 1463,
    center: null, widthM: 450, place: '' }
];
export const FIELD_CREDIT = 'Kaart © Airsoft Vets';

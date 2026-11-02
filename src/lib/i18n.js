import { S } from './store.svelte.js';

const D = {
  nl: {
    tagline: 'Live teamkaart voor airsoft',
    name: 'Naam', squad: 'Squad (bijv. Boches)', role: 'Rol', save: 'Opslaan',
    nearby: 'Spellen in de buurt', nearby_none: 'Geen actieve spellen in de buurt.', nearby_locating: 'Locatie zoeken...',
    nearby_noloc: 'Geen locatie. Sta locatie toe om spellen in de buurt te zien.',
    players: 'spelers', km: 'km',
    join_code: 'Spelcode', join: 'Meedoen', create: 'Nieuw spel', codeword: 'Codewoord',
    codeword_hint: 'Alleen wie het codewoord kent, kan jullie posities zien.',
    game_name: 'Naam van het spel', your_side: 'Jouw kant', color: 'Kleur',
    pick_side: 'Kies je kant', add_side: 'Nieuwe kant toevoegen', back: 'Terug', cancel: 'Annuleren',
    start: 'Start', creating: 'Bezig...', need_name: 'Vul eerst je naam in.',
    err_BAD_CODEWORD: 'Verkeerd codewoord.', err_NO_GAME: 'Spel niet gevonden.', err_FACTION_EXISTS: 'Die kant bestaat al.',
    err_INVALID: 'Vul alle velden in (codewoord minimaal 3 tekens).', err_BAD_TOKEN: 'Je toegang is verlopen, doe opnieuw mee.',
    err_net: 'Geen verbinding.',
    // map
    team: 'Team', chat: 'Chat', alerts: 'Alerts', more: 'Meer', hit: 'GERAAKT', respawn: 'RESPAWN', you_are_hit: 'Je bent geraakt',
    mode_marker: 'Marker', mode_line: 'Lijn', mode_zone: 'Zone', done: 'Klaar', undo: 'Ongedaan',
    tap_to_place: 'Tik op de kaart om te plaatsen', tap_points: 'Tik punten op de kaart',
    label: 'Label (optioneel)', delete: 'Verwijderen', placed_by: 'Geplaatst door',
    squad_only: 'Alleen squad', everyone: 'Iedereen', send: 'Stuur', message: 'Bericht...',
    invite: 'Uitnodigen', invite_hint: 'Laat teamgenoten deze code scannen.', include_codeword: 'Codewoord in QR meenemen (alleen voor eigen team!)',
    replay: 'Replay', settings: 'Instellingen', leave: 'Spel verlaten', leave_q: 'Weet je zeker dat je het spel verlaat?',
    night: 'Nachtmodus', speech: 'Gesproken alerts', map_style: 'Kaart', sat: 'Satelliet', topo: 'Kaart',
    language: 'Taal', follow: 'Volg mij', last_seen: 'gezien', ago: 'geleden', now: 'nu', no_gps: 'nog geen GPS',
    battery: 'batterij', status_ok: 'actief', status_hit: 'geraakt',
    play: 'Afspelen', pause: 'Pauze', speed: 'Snelheid', loading: 'Laden...', no_tracks: 'Nog geen routes opgenomen.',
    offline: 'Geen verbinding, opnieuw proberen...', gps_off: 'GPS uit of geweigerd',
    bg_title: 'ARGUS Volkov', bg_msg: 'Je positie wordt gedeeld met je team.',
    keep_open: 'Op iPhone in de browser: houd het scherm aan voor live positie.',
    m_enemy: 'Vijand', m_objective: 'Objective', m_flag: 'Vlag', m_intel: 'Intel', m_rally: 'Rally point', m_medic: 'Medic', m_danger: 'Gevaar', m_base: 'Basis', m_shell: 'Schelp',
    eggs_on: 'Airsoft Boches · since 2022 · De schelp is ontgrendeld',
    a_contact: 'Contact!', a_help: 'Hulp nodig', a_rally: 'Naar rally point', a_enemy_seen: 'Vijand gezien', a_obj_taken: 'Objective genomen',
    a_fall_back: 'Terugtrekken', a_push: 'Aanvallen', a_hold: 'Positie houden',
    is_hit: 'is geraakt', respawned: 'is terug in het spel',
    r_rifleman: 'Rifleman', r_leader: 'Leader', r_medic: 'Medic', r_sniper: 'Sniper', r_support: 'Support', r_scout: 'Scout', r_commander: 'Commander', r_pilot: 'Drone pilot',
    side: 'Kant', code: 'Code', game: 'Spel', version: 'Versie',
    field_map: 'Veldkaart', field_show: 'Veldkaart tonen', opacity: 'Doorzichtigheid', field_upload: 'Plattegrond uploaden (foto of screenshot)', field_align: 'Uitlijnen', field_none_yet: 'Nog geen veldkaart voor jullie kant.', align_hint: 'Sleep de hoeken naar de juiste plek, ✥ verschuift alles', uploading: 'Uploaden...'
  },
  en: {
    tagline: 'Live team map for airsoft',
    name: 'Name', squad: 'Squad (e.g. Boches)', role: 'Role', save: 'Save',
    nearby: 'Games nearby', nearby_none: 'No active games nearby.', nearby_locating: 'Finding location...',
    nearby_noloc: 'No location. Allow location to see games nearby.',
    players: 'players', km: 'km',
    join_code: 'Game code', join: 'Join', create: 'New game', codeword: 'Codeword',
    codeword_hint: 'Only people who know the codeword can see your positions.',
    game_name: 'Game name', your_side: 'Your side', color: 'Colour',
    pick_side: 'Pick your side', add_side: 'Add a new side', back: 'Back', cancel: 'Cancel',
    start: 'Start', creating: 'Working...', need_name: 'Enter your name first.',
    err_BAD_CODEWORD: 'Wrong codeword.', err_NO_GAME: 'Game not found.', err_FACTION_EXISTS: 'That side already exists.',
    err_INVALID: 'Fill in all fields (codeword at least 3 characters).', err_BAD_TOKEN: 'Your access expired, join again.',
    err_net: 'No connection.',
    team: 'Team', chat: 'Chat', alerts: 'Alerts', more: 'More', hit: 'HIT', respawn: 'RESPAWN', you_are_hit: 'You are hit',
    mode_marker: 'Marker', mode_line: 'Line', mode_zone: 'Zone', done: 'Done', undo: 'Undo',
    tap_to_place: 'Tap the map to place', tap_points: 'Tap points on the map',
    label: 'Label (optional)', delete: 'Delete', placed_by: 'Placed by',
    squad_only: 'Squad only', everyone: 'Everyone', send: 'Send', message: 'Message...',
    invite: 'Invite', invite_hint: 'Let teammates scan this code.', include_codeword: 'Include codeword in QR (own team only!)',
    replay: 'Replay', settings: 'Settings', leave: 'Leave game', leave_q: 'Are you sure you want to leave the game?',
    night: 'Night mode', speech: 'Spoken alerts', map_style: 'Map', sat: 'Satellite', topo: 'Map',
    language: 'Language', follow: 'Follow me', last_seen: 'seen', ago: 'ago', now: 'now', no_gps: 'no GPS yet',
    battery: 'battery', status_ok: 'active', status_hit: 'hit',
    play: 'Play', pause: 'Pause', speed: 'Speed', loading: 'Loading...', no_tracks: 'No routes recorded yet.',
    offline: 'No connection, retrying...', gps_off: 'GPS off or denied',
    bg_title: 'ARGUS Volkov', bg_msg: 'Your position is shared with your team.',
    keep_open: 'On iPhone in the browser: keep the screen on for live position.',
    m_enemy: 'Enemy', m_objective: 'Objective', m_flag: 'Flag', m_intel: 'Intel', m_rally: 'Rally point', m_medic: 'Medic', m_danger: 'Danger', m_base: 'Base', m_shell: 'Shell',
    eggs_on: 'Airsoft Boches · since 2022 · The shell is unlocked',
    a_contact: 'Contact!', a_help: 'Need help', a_rally: 'Move to rally point', a_enemy_seen: 'Enemy spotted', a_obj_taken: 'Objective taken',
    a_fall_back: 'Fall back', a_push: 'Push', a_hold: 'Hold position',
    is_hit: 'is hit', respawned: 'is back in the game',
    r_rifleman: 'Rifleman', r_leader: 'Leader', r_medic: 'Medic', r_sniper: 'Sniper', r_support: 'Support', r_scout: 'Scout', r_commander: 'Commander', r_pilot: 'Drone pilot',
    side: 'Side', code: 'Code', game: 'Game', version: 'Version',
    field_map: 'Field map', field_show: 'Show field map', opacity: 'Opacity', field_upload: 'Upload field map (photo or screenshot)', field_align: 'Align', field_none_yet: 'No field map for your side yet.', align_hint: 'Drag the corners into place, ✥ moves everything', uploading: 'Uploading...'
  }
};

export function t(key) {
  const lang = S.lang || 'nl';
  return D[lang]?.[key] ?? D.nl[key] ?? key;
}

export function errText(e) {
  const m = String(e?.message || e || '');
  const k = m.match(/VOLKOV_([A-Z_]+)/);
  if (k) return t('err_' + k[1]);
  if (/fetch|network|Failed/i.test(m)) return t('err_net');
  return m;
}

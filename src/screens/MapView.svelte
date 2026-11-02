<script>
  import { onMount, onDestroy } from 'svelte';
  import * as maplibregl from 'maplibre-gl';
  import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
  import { S, persist, toast } from '../lib/store.svelte.js';
  import { t, errText } from '../lib/i18n.js';
  import { startSync, stopSync, sendEvent, deleteEvent, setStatus } from '../lib/api.js';
  import { startTracking, stopTracking, distM } from '../lib/geo.js';
  import { baseStyle, addOverlayLayers, circle, squadColor } from '../lib/mapstyle.js';
  import { MARKERS, DRAW_COLORS } from '../lib/config.js';
  import { isBoches, shellSvg } from '../lib/boches.js';
  import TeamPanel from '../components/TeamPanel.svelte';
  import ChatPanel from '../components/ChatPanel.svelte';
  import AlertPanel from '../components/AlertPanel.svelte';
  import MorePanel from '../components/MorePanel.svelte';
  import Replay from '../components/Replay.svelte';

  let el;
  let map = $state(null);
  let ready = $state(false);
  let panel = $state(null);     // team | chat | alerts | more | draw | replay
  let mode = $state(null);      // marker | line | zone
  let pending = $state(null);   // {lat,lng} waiting for marker type
  let draft = $state([]);       // [[lng,lat],...]
  let drawColor = $state(DRAW_COLORS[0]);
  let follow = $state(true);
  let centered = false;

  const pMarkers = new Map();   // player id -> {marker, el}
  const tMarkers = new Map();   // event id -> {marker, el}
  let popup = null;

  const session = S.session;
  const fColor = session.faction.color;
  const myId = session.player_id;

  maplibregl.setWorkerUrl(workerUrl);

  onMount(() => {
    const g = session.game;
    const center = g.lng != null ? [g.lng, g.lat] : [5.3, 52.1];
    map = new maplibregl.Map({
      container: el,
      style: baseStyle(S.mapStyle),
      center, zoom: g.lng != null ? 16 : 7,
      maxZoom: 20, attributionControl: { compact: true }, pitchWithRotate: false
    });
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.on('load', () => {
      addOverlayLayers(map); ready = true;
      el.querySelector('.maplibregl-compact-show')?.classList.remove('maplibregl-compact-show');
    });
    map.on('click', onMapClick);
    map.on('dragstart', () => (follow = false));
    for (const id of ['draw-line', 'draw-fill']) {
      map.on('click', id, (e) => { if (!mode) drawingPopup(e); });
      map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''));
    }
    startSync();
    startTracking();
  });

  onDestroy(() => {
    stopSync();
    stopTracking();
    map?.remove();
  });

  // ---------- base map style ----------
  $effect(() => {
    const s = S.mapStyle;
    if (!ready) return;
    map.setLayoutProperty('sat', 'visibility', s === 'sat' ? 'visible' : 'none');
    map.setLayoutProperty('osm', 'visibility', s === 'osm' ? 'visible' : 'none');
  });

  // ---------- own position: accuracy circle + follow ----------
  $effect(() => {
    const p = S.myPos;
    if (!ready || !p) return;
    map.getSource('acc').setData({ type: 'FeatureCollection', features: p.acc ? [circle(p.lng, p.lat, Math.min(p.acc, 80))] : [] });
    if (!centered) {
      centered = true;
      const g = session.game;
      if (g.lng == null || distM(g, p) > 3000) map.jumpTo({ center: [p.lng, p.lat], zoom: 17 });
    } else if (follow) {
      map.easeTo({ center: [p.lng, p.lat], duration: 600 });
    }
  });

  // ---------- players ----------
  function ago(ts) {
    if (!ts) return t('no_gps');
    const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 15) return t('now');
    if (s < 90) return `${Math.round(s)}s`;
    return `${Math.round(s / 60)}m`;
  }

  function playerHtml(p) {
    const own = p.id === myId;
    const hit = p.status === 'hit';
    const stale = !p.pos_at || Date.now() - new Date(p.pos_at).getTime() > 120000;
    const sq = squadColor(p.squad);
    const rot = p.heading != null && !Number.isNaN(p.heading) ? p.heading : null;
    const arrow = rot !== null && !hit ? `<span class="arr" style="transform:rotate(${rot}deg)"></span>` : '';
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    return `<div class="pdot ${own ? 'own' : ''} ${hit ? 'hit' : ''} ${stale && !own ? 'stale' : ''}" style="--f:${fColor};--s:${sq}">${arrow}<span class="core">${hit ? '✕' : ''}</span></div>
      <div class="plabel">${isBoches(p.squad) ? shellSvg(12) + ' ' : ''}${esc(p.name)}${p.squad ? ` <small style="color:${sq}">${esc(p.squad)}</small>` : ''}</div>`;
  }

  $effect(() => {
    if (!ready) return;
    const seen = new Set();
    const mine = S.players[myId];
    for (const p of Object.values(S.players)) {
      if (p.lat == null) continue;
      if (S.squadOnly && p.id !== myId && mine && p.squad !== mine.squad) continue;
      seen.add(p.id);
      let m = pMarkers.get(p.id);
      if (!m) {
        const div = document.createElement('div');
        div.className = 'pmark';
        div.addEventListener('click', (ev) => { ev.stopPropagation(); playerPopup(p.id); });
        const marker = new maplibregl.Marker({ element: div, anchor: 'top' }).setLngLat([p.lng, p.lat]).addTo(map);
        m = { marker, el: div };
        pMarkers.set(p.id, m);
      }
      m.marker.setLngLat([p.lng, p.lat]);
      m.el.innerHTML = playerHtml(p);
      m.el.style.zIndex = p.id === myId ? 5 : 3;
    }
    for (const [id, m] of pMarkers) if (!seen.has(id)) { m.marker.remove(); pMarkers.delete(id); }
  });

  // refresh "stale" look every 20 s
  let clock = $state(0);
  const clockTimer = setInterval(() => clock++, 20000);
  onDestroy(() => clearInterval(clockTimer));
  $effect(() => {
    clock;
    for (const [id, m] of pMarkers) { const p = S.players[id]; if (p) m.el.innerHTML = playerHtml(p); }
  });

  // ---------- tactical markers + drawings ----------
  const mdef = (type) => MARKERS.find((m) => m.type === type) || MARKERS[0];

  $effect(() => {
    if (!ready) return;
    const feats = [];
    const seen = new Set();
    for (const e of Object.values(S.events)) {
      if (e.kind === 'marker') {
        seen.add(e.id);
        let m = tMarkers.get(e.id);
        const d = mdef(e.data.type);
        if (!m) {
          const div = document.createElement('div');
          div.className = 'tmark';
          div.addEventListener('click', (ev) => { ev.stopPropagation(); markerPopup(e.id); });
          const marker = new maplibregl.Marker({ element: div }).setLngLat([e.data.lng, e.data.lat]).addTo(map);
          m = { marker, el: div };
          tMarkers.set(e.id, m);
        }
        m.el.innerHTML = `<span class="tm-${e.data.type}" style="--c:${d.color}">${e.data.type === 'shell' ? shellSvg(22) : d.glyph}</span>${e.data.label ? `<em>${String(e.data.label).replace(/[&<>"]/g, '')}</em>` : ''}`;
      } else if (e.kind === 'draw' && e.data.coords?.length >= 2) {
        const c = e.data.coords;
        if (e.data.shape === 'zone' && c.length >= 3) {
          feats.push({ type: 'Feature', id: e.id, properties: { id: e.id, shape: 'zone', color: e.data.color, nogo: !!e.data.nogo },
            geometry: { type: 'Polygon', coordinates: [[...c, c[0]]] } });
        } else {
          feats.push({ type: 'Feature', id: e.id, properties: { id: e.id, shape: 'line', color: e.data.color },
            geometry: { type: 'LineString', coordinates: c } });
          feats.push({ type: 'Feature', properties: { id: e.id, shape: 'end', color: e.data.color },
            geometry: { type: 'Point', coordinates: c[c.length - 1] } });
        }
      }
    }
    for (const [id, m] of tMarkers) if (!seen.has(id)) { m.marker.remove(); tMarkers.delete(id); }
    map.getSource('draw').setData({ type: 'FeatureCollection', features: feats });
  });

  $effect(() => {
    if (!ready) return;
    const feats = draft.map((c) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } }));
    if (draft.length >= 2) {
      const ring = mode === 'zone' && draft.length >= 3 ? [...draft, draft[0]] : draft;
      feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ring } });
    }
    map.getSource('draft').setData({ type: 'FeatureCollection', features: feats });
  });

  // ---------- popups ----------
  function showPopup(lngLat, html, bind) {
    popup?.remove();
    popup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px', offset: 14 }).setLngLat(lngLat).setHTML(html).addTo(map);
    bind?.(popup.getElement());
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function delBtn(root, id) {
    root.querySelector('[data-del]')?.addEventListener('click', async () => {
      try { await deleteEvent(id); popup?.remove(); } catch (er) { toast(errText(er), 'alert'); }
    });
  }

  function markerPopup(id) {
    const e = S.events[id]; if (!e) return;
    const by = S.players[e.player_id]?.name || '?';
    const time = new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    showPopup([e.data.lng, e.data.lat],
      `<b>${t('m_' + e.data.type)}</b>${e.data.label ? `<div>${esc(e.data.label)}</div>` : ''}
       <div class="pp-muted">${t('placed_by')} ${esc(by)} · ${time}</div>
       <button class="pp-del" data-del>${t('delete')}</button>`, (r) => delBtn(r, id));
  }

  function drawingPopup(ev) {
    const id = ev.features?.[0]?.properties?.id; const e = S.events[id]; if (!e) return;
    const by = S.players[e.player_id]?.name || '?';
    showPopup(ev.lngLat,
      `<b>${e.data.shape === 'zone' ? t('mode_zone') : t('mode_line')}</b>${e.data.label ? `<div>${esc(e.data.label)}</div>` : ''}
       <div class="pp-muted">${t('placed_by')} ${esc(by)}</div>
       <button class="pp-del" data-del>${t('delete')}</button>`, (r) => delBtn(r, id));
  }

  function playerPopup(id) {
    const p = S.players[id]; if (!p) return;
    const d = S.myPos && id !== myId ? `${Math.round(distM(S.myPos, p))} m · ` : '';
    showPopup([p.lng, p.lat],
      `<b>${esc(p.name)}</b> ${p.squad ? `<span class="pp-muted">${esc(p.squad)}</span>` : ''}
       <div>${p.role ? t('r_' + p.role) : ''} · ${p.status === 'hit' ? t('status_hit') : t('status_ok')}</div>
       <div class="pp-muted">${d}${t('last_seen')} ${ago(p.pos_at)}${p.battery != null ? ` · ${p.battery}%` : ''}</div>`);
  }

  // ---------- map interaction ----------
  function onMapClick(e) {
    if (mode === 'marker') {
      pending = { lat: e.lngLat.lat, lng: e.lngLat.lng };
    } else if (mode === 'line' || mode === 'zone') {
      draft = [...draft, [e.lngLat.lng, e.lngLat.lat]];
    }
  }

  function setMode(m) {
    mode = mode === m ? null : m;
    draft = []; pending = null;
    panel = mode ? null : panel;
  }

  let markerLabel = $state('');
  async function placeMarker(type) {
    const p = pending; pending = null; mode = null;
    try {
      await sendEvent('marker', { type, lat: p.lat, lng: p.lng, label: markerLabel.trim() || null });
    } catch (er) { toast(errText(er), 'alert'); }
    markerLabel = '';
  }

  let drawLabel = $state('');
  let nogo = $state(false);
  async function finishDraw() {
    const need = mode === 'zone' ? 3 : 2;
    if (draft.length < need) { mode = null; draft = []; nogo = false; return; }
    const data = { shape: mode, coords: draft.map(([x, y]) => [+x.toFixed(6), +y.toFixed(6)]), color: nogo ? '#ff4d4d' : drawColor, label: drawLabel.trim() || null, nogo: mode === 'zone' && nogo };
    mode = null; draft = []; drawLabel = ''; nogo = false;
    try { await sendEvent('draw', data); } catch (er) { toast(errText(er), 'alert'); }
  }

  function centerMe() {
    follow = true;
    if (S.myPos) map.easeTo({ center: [S.myPos.lng, S.myPos.lat], zoom: Math.max(map.getZoom(), 17) });
    else toast(S.gpsError || t('no_gps'));
  }

  function flyTo(p) {
    follow = false; panel = null;
    map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 17) });
    playerPopup(p.id);
  }

  const myStatus = $derived(S.players[myId]?.status || 'ok');
  async function toggleHit() {
    try { await setStatus(myStatus === 'hit' ? 'ok' : 'hit'); } catch (er) { toast(errText(er), 'alert'); }
  }

  function toggleStyle() { S.mapStyle = S.mapStyle === 'sat' ? 'osm' : 'sat'; persist(); }
  function open(p) { panel = panel === p ? null : p; mode = null; draft = []; if (p === 'chat') S.unread = 0; }
</script>

<div class="wrap" class:drawing={!!mode}>
  <div class="map" bind:this={el}></div>

  <header>
    <i class="fdot" style="background:{fColor}"></i>
    <div class="grow">
      <div class="gname">{session.game.name}</div>
      <div class="sub mono">{session.faction.name} · {session.game.code}</div>
    </div>
    <span class="net" class:off={!S.online} title={S.online ? 'online' : t('offline')}></span>
  </header>

  {#if !S.online}<div class="banner">{t('offline')}</div>{/if}
  {#if S.gpsError}<div class="banner">{S.gpsError}</div>{/if}

  <div class="fabs">
    <button class:on={follow} onclick={centerMe} title={t('follow')}>◉</button>
    <button onclick={toggleStyle} title={t('map_style')}>{S.mapStyle === 'sat' ? '🗺' : '🛰'}</button>
    <button class:on={S.squadOnly} onclick={() => (S.squadOnly = !S.squadOnly)} title={t('squad_only')}>SQ</button>
  </div>

  {#if mode}
    <div class="modebar">
      {#if mode === 'marker'}
        <span class="grow">{t('tap_to_place')}</span>
      {:else}
        <span class="grow">{t('tap_points')} ({draft.length})</span>
        <button onclick={() => (draft = draft.slice(0, -1))} disabled={!draft.length}>{t('undo')}</button>
        <button class="primary" onclick={finishDraw}>{t('done')}</button>
      {/if}
      <button onclick={() => setMode(null)}>✕</button>
    </div>
    {#if mode !== 'marker'}
      <div class="drawopts">
        {#each DRAW_COLORS as c}
          <button aria-label={c} class="cdot" class:on={drawColor === c && !nogo} style="background:{c}" onclick={() => { drawColor = c; nogo = false; }}></button>
        {/each}
        {#if mode === 'zone'}<button class="nogo" class:on={nogo} onclick={() => (nogo = !nogo)}>NO-GO</button>{/if}
        <input bind:value={drawLabel} placeholder={t('label')} maxlength="40" />
      </div>
    {/if}
  {/if}

  {#if pending}
    <div class="sheet">
      <input bind:value={markerLabel} placeholder={t('label')} maxlength="40" />
      <div class="mgrid">
        {#each MARKERS.filter((m) => !m.secret || S.eggs) as m}
          <button onclick={() => placeMarker(m.type)}><span class="mg" style="color:{m.color}">{#if m.type === 'shell'}{@html shellSvg(22)}{:else}{m.glyph}{/if}</span>{t('m_' + m.type)}</button>
        {/each}
      </div>
      <button class="wide" onclick={() => { pending = null; mode = null; }}>{t('cancel')}</button>
    </div>
  {/if}

  {#if panel === 'team'}<TeamPanel onfly={flyTo} onclose={() => (panel = null)} />{/if}
  {#if panel === 'chat'}<ChatPanel onclose={() => (panel = null)} />{/if}
  {#if panel === 'alerts'}<AlertPanel onclose={() => (panel = null)} />{/if}
  {#if panel === 'more'}<MorePanel onclose={() => (panel = null)} onreplay={() => (panel = 'replay')} />{/if}
  {#if panel === 'replay' && ready}<Replay {map} onclose={() => (panel = null)} />{/if}
  {#if panel === 'draw'}
    <div class="sheet">
      <div class="mgrid three">
        <button onclick={() => setMode('marker')}><span class="mg">◎</span>{t('mode_marker')}</button>
        <button onclick={() => setMode('line')}><span class="mg">↗</span>{t('mode_line')}</button>
        <button onclick={() => setMode('zone')}><span class="mg">⬠</span>{t('mode_zone')}</button>
      </div>
    </div>
  {/if}

  <nav>
    <button class:on={panel === 'team'} onclick={() => open('team')}><b>☰</b>{t('team')}</button>
    <button class:on={panel === 'chat'} onclick={() => open('chat')}><b>✉</b>{t('chat')}{#if S.unread}<em>{S.unread}</em>{/if}</button>
    <button class="hit" class:is={myStatus === 'hit'} onclick={toggleHit}>{myStatus === 'hit' ? t('respawn') : t('hit')}</button>
    <button class:on={panel === 'draw' || mode} onclick={() => open('draw')}><b>✎</b>{t('mode_marker')}</button>
    <button class:on={panel === 'alerts'} onclick={() => open('alerts')}><b>!</b>{t('alerts')}</button>
    <button class:on={panel === 'more' || panel === 'replay'} onclick={() => open('more')}><b>⋯</b></button>
  </nav>
  {#if myStatus === 'hit'}<div class="hitbanner">{t('you_are_hit')}</div>{/if}
</div>

<style>
  .wrap { position: fixed; inset: 0; overflow: hidden; }
  .map { position: absolute; inset: 0; z-index: 0; }
  header { position: absolute; top: 0; left: 0; right: 0; padding: calc(var(--safe-top) + 8px) 12px 8px; display: flex; gap: 10px; align-items: center;
    background: linear-gradient(#000c, #0000); pointer-events: none; }
  .fdot { width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 2px #000; }
  .gname { font-weight: 700; text-shadow: 0 1px 3px #000; }
  .sub { font-size: 12px; color: #cfd8d3; text-shadow: 0 1px 3px #000; }
  .net { width: 10px; height: 10px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); }
  .net.off { background: var(--red); box-shadow: 0 0 6px var(--red); }
  .banner { position: absolute; top: calc(var(--safe-top) + 56px); left: 12px; right: 12px; background: #2a0f0fe6; border: 1px solid var(--red);
    border-radius: 10px; padding: 8px 12px; font-size: 14px; text-align: center; }
  .fabs { position: absolute; right: 10px; top: calc(var(--safe-top) + 100px); display: flex; flex-direction: column; gap: 8px; }
  .fabs button { width: 46px; height: 46px; padding: 0; border-radius: 12px; background: #141816e6; font-size: 18px; font-weight: 700; }
  .fabs button.on { border-color: var(--blue); color: var(--blue); }
  nav { position: absolute; left: 0; right: 0; bottom: 0; display: flex; gap: 6px; padding: 8px 8px calc(var(--safe-bottom) + 8px);
    background: linear-gradient(#0000, #000d 30%); align-items: stretch; }
  nav button { flex: 1; padding: 6px 2px; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px;
    background: #141816ee; position: relative; min-height: 54px; justify-content: center; }
  nav button b { font-size: 18px; line-height: 1; }
  nav button.on { border-color: var(--gold); color: var(--gold); }
  nav button em { position: absolute; top: 4px; right: 8px; background: var(--red); color: #fff; font-style: normal; border-radius: 9px; padding: 0 6px; font-size: 11px; }
  nav .hit { flex: 2; font-size: 14px !important; letter-spacing: .02em !important; background: var(--red); border-color: var(--red); color: #fff; font-weight: 900; font-size: 15px; letter-spacing: .06em; }
  nav .hit.is { background: var(--green); border-color: var(--green); color: #031; }
  .hitbanner { position: absolute; top: calc(var(--safe-top) + 56px); left: 50%; transform: translateX(-50%); background: var(--red); color: #fff;
    font-weight: 900; padding: 6px 14px; border-radius: 8px; letter-spacing: .08em; }
  .modebar { position: absolute; left: 10px; right: 10px; bottom: calc(var(--safe-bottom) + 80px); display: flex; gap: 8px; align-items: center;
    background: var(--panel); border: 1px solid var(--gold); border-radius: 12px; padding: 8px 8px 8px 14px; }
  .modebar button { padding: 8px 12px; }
  .drawopts { position: absolute; left: 10px; right: 10px; bottom: calc(var(--safe-bottom) + 140px); display: flex; gap: 8px; align-items: center;
    background: #141816ee; border: 1px solid var(--line); border-radius: 12px; padding: 8px; }
  .drawopts input { padding: 8px 10px; }
  .cdot { width: 30px; height: 30px; min-width: 30px; border-radius: 50%; padding: 0; border: 3px solid transparent; }
  .cdot.on { border-color: #fff; }
  .nogo { padding: 6px 8px; font-size: 12px; font-weight: 800; }
  .nogo.on { background: var(--red); color: #fff; }
  .sheet { position: absolute; left: 0; right: 0; bottom: 0; background: var(--panel); border-top: 1px solid var(--line); border-radius: 16px 16px 0 0;
    padding: 14px 12px calc(var(--safe-bottom) + 80px); z-index: 4; }
  .mgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
  .mgrid.three { grid-template-columns: repeat(3, 1fr); margin-top: 0; }
  .mgrid button { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; padding: 10px 4px; }
  .mg { font-size: 22px; font-weight: 900; line-height: 1; }
  .wide { width: 100%; margin-top: 10px; }

  /* markers (global: created via DOM) */
  .drawing :global(.pmark), .drawing :global(.tmark) { pointer-events: none; }
  :global(.pmark) { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  :global(.pdot) { position: relative; width: 22px; height: 22px; border-radius: 50%; background: var(--f); border: 3px solid var(--s);
    box-shadow: 0 0 0 1.5px #000, 0 2px 6px #000a; display: grid; place-items: center; margin-top: -11px; }
  :global(.pdot.own) { border-color: #fff; box-shadow: 0 0 0 2px #4cc3ff, 0 0 12px #4cc3ff; }
  :global(.pdot.hit) { background: #555; border-color: #999; }
  :global(.pdot.stale) { opacity: .45; }
  :global(.pdot .core) { color: #fff; font-weight: 900; font-size: 13px; line-height: 1; }
  :global(.pdot .arr) { position: absolute; inset: -14px; pointer-events: none; }
  :global(.pdot .arr::before) { content: ''; position: absolute; left: 50%; top: 0; transform: translateX(-50%); border: 7px solid transparent;
    border-bottom: 10px solid var(--s); border-top: 0; }
  :global(.plabel) { margin-top: 3px; font-size: 11px; font-weight: 700; color: #fff; text-shadow: 0 1px 2px #000, 0 0 4px #000; white-space: nowrap; }
  :global(.plabel small) { font-size: 10px; font-weight: 800; }
  :global(.tmark) { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  :global(.tmark > span) { width: 30px; height: 30px; display: grid; place-items: center; background: #000c; color: var(--c); border: 2px solid var(--c);
    font-weight: 900; font-size: 17px; border-radius: 8px; }
  :global(.tmark > span) { line-height: 1; }
  :global(.tmark em) { margin-top: 6px; font-style: normal; font-size: 11px; font-weight: 700; color: #fff; text-shadow: 0 1px 2px #000; white-space: nowrap; }
  :global(.tmark .tm-enemy) { border-radius: 50%; background: #3a0b0bdd; }
  :global(.plabel .shell) { vertical-align: -2px; }
  :global(.tmark .tm-shell) { background: #0b1d3a; }
  :global(.pp-muted) { color: var(--muted); font-size: 12px; margin-top: 4px; }
  :global(.pp-del) { margin-top: 8px; padding: 6px 10px; font-size: 13px; width: 100%; }
</style>

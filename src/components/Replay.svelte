<script>
  import { onMount, onDestroy } from 'svelte';
  import { S } from '../lib/store.svelte.js';
  import { t } from '../lib/i18n.js';
  import { getTracks } from '../lib/api.js';
  import { squadColor } from '../lib/mapstyle.js';
  import Sheet from './Sheet.svelte';
  let { map, onclose } = $props();

  let rows = $state(null);   // [pid, lat, lng, epoch, status]
  let t0 = $state(0), t1 = $state(0), cur = $state(0);
  let playing = $state(false);
  let speed = $state(60);
  let raf = null, last = 0;

  onMount(async () => {
    try { rows = await getTracks(); } catch { rows = []; }
    if (rows.length) {
      t0 = rows[0][3]; t1 = rows[rows.length - 1][3]; cur = t0;
      const lngs = rows.map((r) => r[2]), lats = rows.map((r) => r[1]);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 18 });
      draw();
    }
  });

  onDestroy(() => {
    cancelAnimationFrame(raf);
    map.getSource('replay')?.setData({ type: 'FeatureCollection', features: [] });
  });

  function draw() {
    if (!rows) return;
    const by = new Map();
    for (const r of rows) {
      if (r[3] > cur) break;
      if (!by.has(r[0])) by.set(r[0], []);
      by.get(r[0]).push(r);
    }
    const feats = [];
    for (const [pid, pts] of by) {
      const p = S.players[pid];
      const color = squadColor(p?.squad);
      const recent = pts.filter((r) => r[3] > cur - 600); // 10 min trail
      if (recent.length >= 2) feats.push({ type: 'Feature', properties: { color }, geometry: { type: 'LineString', coordinates: recent.map((r) => [r[2], r[1]]) } });
      const lastPt = pts[pts.length - 1];
      if (cur - lastPt[3] < 120) feats.push({ type: 'Feature', properties: { color: lastPt[4] === 'hit' ? '#777' : color }, geometry: { type: 'Point', coordinates: [lastPt[2], lastPt[1]] } });
    }
    map.getSource('replay')?.setData({ type: 'FeatureCollection', features: feats });
  }

  function loop(ts) {
    if (!playing) return;
    const dt = last ? (ts - last) / 1000 : 0; last = ts;
    cur = Math.min(t1, cur + dt * speed);
    draw();
    if (cur >= t1) { playing = false; return; }
    raf = requestAnimationFrame(loop);
  }
  function toggle() {
    if (cur >= t1) cur = t0;
    playing = !playing; last = 0;
    if (playing) raf = requestAnimationFrame(loop);
  }
  const clock = (s) => new Date(s * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
</script>

<Sheet title={t('replay')} {onclose}>
  {#if rows === null}
    <p class="muted">{t('loading')}</p>
  {:else if rows.length === 0}
    <p class="muted">{t('no_tracks')}</p>
  {:else}
    <div class="time mono">{clock(cur)}</div>
    <input type="range" min={t0} max={t1} step="1" bind:value={cur} oninput={draw} />
    <div class="row">
      <button class="primary grow" onclick={toggle}>{playing ? t('pause') : t('play')}</button>
      {#each [30, 60, 120] as sp}
        <button class:on={speed === sp} onclick={() => (speed = sp)}>{sp}×</button>
      {/each}
    </div>
  {/if}
</Sheet>

<style>
  .time { text-align: center; font-size: 22px; font-weight: 700; color: var(--gold); }
  input[type=range] { padding: 0; margin: 12px 0; accent-color: var(--gold); }
  .row button.on { border-color: var(--gold); color: var(--gold); }
</style>

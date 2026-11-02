<script>
  // Full-screen viewer for a field plan (with legend). Pinch / wheel to zoom, drag to pan, double-tap to reset.
  import { t } from '../lib/i18n.js';
  import { FIELD_CREDIT } from '../lib/config.js';
  let { preset, onclose } = $props();
  let k = $state(1), x = $state(0), y = $state(0);
  const pts = new Map();
  let last = null, lastTap = 0, stage;
  const rel = (cx, cy) => { const r = stage.getBoundingClientRect(); return [cx - r.left, cy - r.top]; };

  function clamp() { k = Math.min(8, Math.max(1, k)); if (k === 1) { x = 0; y = 0; } }
  function zoomAt(f, cx, cy) {
    const nk = Math.min(8, Math.max(1, k * f)); const r = nk / k;
    x = cx - (cx - x) * r; y = cy - (cy - y) * r; k = nk; clamp();
  }
  function gesture() {
    const a = [...pts.values()];
    if (a.length === 1) return { cx: a[0].x, cy: a[0].y, d: 0 };
    return { cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) };
  }
  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, pos(e)); last = gesture();
    if (pts.size === 1) { const now = Date.now(); if (now - lastTap < 300) { k = 1; clamp(); } lastTap = now; }
  }
  function move(e) {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, pos(e));
    const s = gesture();
    if (last && pts.size === 2 && last.d && s.d) zoomAt(s.d / last.d, s.cx, s.cy);
    if (last) { x += s.cx - last.cx; y += s.cy - last.cy; }
    last = s;
  }
  function pos(e) { const [px, py] = rel(e.clientX, e.clientY); return { x: px, y: py }; }
  function up(e) { pts.delete(e.pointerId); last = pts.size ? gesture() : null; }
  function wheel(e) { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, ...rel(e.clientX, e.clientY)); }
</script>

<div class="pv">
  <div class="bar">
    <b class="grow">{preset.name}</b>
    <button onclick={() => zoomAt(1.5, stage.clientWidth / 2, stage.clientHeight / 2)}>＋</button>
    <button onclick={() => zoomAt(1 / 1.5, stage.clientWidth / 2, stage.clientHeight / 2)}>－</button>
    <button onclick={onclose}>✕</button>
  </div>
  <div class="stage" bind:this={stage} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onwheel={wheel} role="img" aria-label={preset.name}>
    <img src={preset.plan} alt={preset.name} draggable="false" style="transform: translate({x}px, {y}px) scale({k})" />
  </div>
  <div class="credit">{FIELD_CREDIT} · {t('pinch_hint')}</div>
</div>

<style>
  .pv { position: fixed; inset: 0; z-index: 50; background: #050706; display: flex; flex-direction: column; }
  .bar { display: flex; gap: 8px; align-items: center; padding: calc(var(--safe-top) + 8px) 12px 8px; }
  .bar b { color: var(--gold); font-size: 17px; }
  .bar button { width: 42px; height: 42px; padding: 0; font-size: 18px; }
  .stage { flex: 1; overflow: hidden; touch-action: none; position: relative; }
  .stage img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: contain; transform-origin: 0 0; user-select: none; -webkit-user-drag: none; }
  .credit { text-align: center; font-size: 12px; color: var(--muted); padding: 6px 12px calc(var(--safe-bottom) + 8px); }
</style>

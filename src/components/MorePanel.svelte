<script>
  import QRCode from 'qrcode';
  import { S, persist, toast } from '../lib/store.svelte.js';
  import { t, errText } from '../lib/i18n.js';
  import { leave, updateProfile, deleteEvent } from '../lib/api.js';
  import { WEB_URL, ROLES, VERSION, FIELD_PRESETS } from '../lib/config.js';
  import Sheet from './Sheet.svelte';
  import { currentField, uploadFieldImage, presetById } from '../lib/fields.js';
  let { onclose, onreplay, onalign, onplan } = $props();
  const field = $derived(currentField());
  let uploading = $state(false);
  async function pickField(e) {
    const file = e.currentTarget.files?.[0]; if (!file) return;
    uploading = true;
    try {
      const r = await uploadFieldImage(file);
      onalign({ ...r, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) });
    } catch (er) { toast(errText(er), 'alert'); }
    uploading = false;
  }

  const s = S.session;
  let withWord = $state(false);
  let word = $state('');
  let qr = $state('');
  let tab = $state('invite');

  const link = $derived(`${WEB_URL}#join=${s.game.code}&f=${s.faction.id}${withWord && word ? `&w=${encodeURIComponent(word)}` : ''}`);
  $effect(() => {
    QRCode.toDataURL(link, { margin: 1, width: 520, color: { dark: '#000000', light: '#ffffff' } }).then((d) => (qr = d));
  });

  async function saveProfile() {
    try { await updateProfile(); toast('✓'); } catch (e) { toast(errText(e), 'alert'); }
  }
  function doLeave() { if (confirm(t('leave_q'))) leave(); }
  function set(k, v) { S[k] = v; persist(); }
  async function share() {
    try { if (navigator.share) await navigator.share({ title: 'ARGUS Volkov', url: link }); else { await navigator.clipboard.writeText(link); toast('✓'); } } catch { /* cancelled */ }
  }
</script>

<Sheet title={t('more')} {onclose} tall>
  <div class="tabs">
    <button class:on={tab === 'invite'} onclick={() => (tab = 'invite')}>{t('invite')}</button>
    <button class:on={tab === 'set'} onclick={() => (tab = 'set')}>{t('settings')}</button>
    <button onclick={onreplay}>{t('replay')}</button>
  </div>

  {#if tab === 'invite'}
    <div class="inv">
      <div class="code mono">{s.game.code}</div>
      <div class="muted small">{s.game.name} · {s.faction.name}</div>
      {#if qr}<img src={qr} alt="QR" />{/if}
      <p class="muted small">{t('invite_hint')}</p>
      <label class="chk"><input type="checkbox" bind:checked={withWord} /> {t('include_codeword')}</label>
      {#if withWord}<input bind:value={word} placeholder={t('codeword')} autocomplete="off" />{/if}
      <button class="wide" onclick={share}>⇪ Link</button>
    </div>
  {:else}
    <label for="pn">{t('name')}</label>
    <input id="pn" bind:value={S.profile.name} maxlength="30" />
    <div class="row">
      <div class="grow"><label for="ps">{t('squad')}</label><input id="ps" bind:value={S.profile.squad} maxlength="30" /></div>
      <div class="grow"><label for="pr">{t('role')}</label>
        <select id="pr" bind:value={S.profile.role}>{#each ROLES as r}<option value={r}>{t('r_' + r)}</option>{/each}</select></div>
    </div>
    <button class="wide primary" onclick={saveProfile}>{t('save')}</button>

    <div class="opts">
      <button class:on={S.night} onclick={() => set('night', !S.night)}>{t('night')}: {S.night ? 'ON' : 'OFF'}</button>
      <button class:on={S.speech} onclick={() => set('speech', !S.speech)}>{t('speech')}: {S.speech ? 'ON' : 'OFF'}</button>
      <button onclick={() => set('mapStyle', S.mapStyle === 'sat' ? 'osm' : 'sat')}>{t('map_style')}: {S.mapStyle === 'sat' ? t('sat') : t('topo')}</button>
      <button onclick={() => set('lang', S.lang === 'nl' ? 'en' : 'nl')}>{t('language')}: {S.lang.toUpperCase()}</button>
    </div>
    <div class="fieldbox">
      <b>{t('field_map')}</b>
      {#if field}
        <div class="row">
          <span class="grow muted small">{field.data.name || t('field_map')}</span>
          {#if presetById(field.data.preset)}<button onclick={() => onplan(presetById(field.data.preset))}>{t('field_view')}</button>{/if}
          <button onclick={() => onalign({ url: field.data.url, preset: field.data.preset, name: field.data.name, corners: field.data.corners })}>{t('field_align')}</button>
          <button onclick={() => deleteEvent(field.id)}>{t('delete')}</button>
        </div>
        <label class="chk"><input type="checkbox" checked={S.field !== 'none'} onchange={(e) => set('field', e.currentTarget.checked ? 'auto' : 'none')} /> {t('field_show')}</label>
        <input type="range" min="0.2" max="1" step="0.05" value={S.fieldOpacity} oninput={(e) => set('fieldOpacity', +e.currentTarget.value)} style="padding:0;accent-color:var(--gold)" />
      {:else}
        <p class="muted small">{t('field_none_yet')}</p>
      {/if}
      <div class="presets">
        <span class="muted small">{t('field_presets')}</span>
        {#each FIELD_PRESETS as p}
          <div class="row">
            <span class="grow">{p.name}{#if p.place}<span class="muted small"> · {p.place}</span>{/if}</span>
            <button onclick={() => onplan(p)}>{t('field_view')}</button>
            <button onclick={() => onalign({ preset: p.id, name: p.name, w: p.w, h: p.h })}>{t('field_on_map')}</button>
          </div>
        {/each}
      </div>
      <label class="upl">{uploading ? t('uploading') : t('field_upload')}
        <input type="file" accept="image/*" onchange={pickField} disabled={uploading} hidden />
      </label>
    </div>
    <button class="wide danger" onclick={doLeave}>{t('leave')}</button>
    <p class="muted small center">ARGUS Volkov v{VERSION}</p>
  {/if}
</Sheet>

<style>
  .tabs { display: flex; gap: 6px; margin-bottom: 10px; }
  .tabs button { flex: 1; padding: 8px; font-size: 14px; }
  .tabs button.on { border-color: var(--gold); color: var(--gold); }
  .inv { text-align: center; }
  .code { font-size: 34px; font-weight: 800; color: var(--gold); }
  .inv img { width: 220px; height: 220px; border-radius: 10px; margin: 10px auto; display: block; }
  .small { font-size: 13px; }
  .chk { display: flex; gap: 8px; align-items: center; text-transform: none; letter-spacing: 0; font-size: 13px; justify-content: center; }
  .chk input { width: auto; }
  .wide { width: 100%; margin-top: 10px; }
  .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
  .opts button { font-size: 13px; padding: 10px 6px; }
  .opts button.on { border-color: var(--gold); color: var(--gold); }
  .center { text-align: center; }
  .fieldbox { margin-top: 14px; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; }
  .fieldbox b { color: var(--gold); text-transform: uppercase; letter-spacing: .08em; font-size: 13px; }
  .fieldbox .row { margin-top: 8px; }
  .fieldbox .row button { padding: 8px 10px; font-size: 13px; }
  .presets { margin-top: 10px; border-top: 1px solid var(--line); padding-top: 8px; }
  .presets .row { align-items: center; }
  .upl { display: block; text-align: center; margin: 10px 0 0; padding: 12px; border: 1px dashed var(--gold); border-radius: 10px; color: var(--gold);
    text-transform: none; letter-spacing: 0; font-size: 14px; cursor: pointer; }
</style>

<script>
  import { S, toast } from '../lib/store.svelte.js';
  import { t, errText } from '../lib/i18n.js';
  import { sendEvent } from '../lib/api.js';
  import { buzz } from '../lib/notify.js';
  import { ALERTS } from '../lib/config.js';
  import Sheet from './Sheet.svelte';
  let { onclose } = $props();

  let squadOnly = $state(false);
  const mySquad = $derived(S.players[S.session.player_id]?.squad || S.profile.squad || '');

  async function fire(a) {
    buzz(false);
    try {
      await sendEvent('alert', { alert: a, squad: squadOnly && mySquad ? mySquad : null, lat: S.myPos?.lat, lng: S.myPos?.lng });
      toast('✓ ' + t('a_' + a));
      onclose();
    } catch (e) { toast(errText(e), 'alert'); }
  }
</script>

<Sheet title={t('alerts')} {onclose}>
  {#if mySquad}
    <div class="to">
      <button class:on={!squadOnly} onclick={() => (squadOnly = false)}>{t('everyone')}</button>
      <button class:on={squadOnly} onclick={() => (squadOnly = true)}>{mySquad}</button>
    </div>
  {/if}
  <div class="grid">
    {#each ALERTS as a}
      <button class:urgent={a === 'contact' || a === 'help'} onclick={() => fire(a)}>{t('a_' + a)}</button>
    {/each}
  </div>
</Sheet>

<style>
  .to { display: flex; gap: 8px; margin-bottom: 10px; }
  .to button { flex: 1; padding: 8px; }
  .to button.on { border-color: var(--gold); color: var(--gold); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid button { padding: 18px 8px; font-weight: 700; font-size: 15px; }
  .grid .urgent { border-color: var(--red); color: #ff8a80; }
</style>

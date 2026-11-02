<script>
  import { tick } from 'svelte';
  import { S, toast } from '../lib/store.svelte.js';
  import { t, errText } from '../lib/i18n.js';
  import { sendEvent } from '../lib/api.js';
  import Sheet from './Sheet.svelte';
  let { onclose } = $props();

  const myId = S.session.player_id;
  let text = $state('');
  let squadMsg = $state(false);
  let box;
  const mySquad = $derived(S.players[myId]?.squad || S.profile.squad || '');

  const msgs = $derived(Object.values(S.events)
    .filter((e) => (e.kind === 'chat' || e.kind === 'alert') && (!e.data.squad || e.data.squad === mySquad))
    .sort((a, b) => a.id - b.id).slice(-150));

  $effect(() => { msgs.length; S.unread = 0; tick().then(() => box && (box.scrollTop = box.scrollHeight)); });

  async function send() {
    const v = text.trim(); if (!v) return;
    text = '';
    try {
      await sendEvent('chat', { text: v.slice(0, 500), squad: squadMsg && mySquad ? mySquad : null, lat: S.myPos?.lat, lng: S.myPos?.lng });
    } catch (e) { toast(errText(e), 'alert'); text = v; }
  }
  const time = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
</script>

<Sheet title={t('chat')} {onclose} tall>
  <div class="msgs" bind:this={box}>
    {#each msgs as m (m.id)}
      <div class="m" class:me={m.player_id === myId} class:alert={m.kind === 'alert'}>
        <div class="who">{S.players[m.player_id]?.name || '?'}{#if m.data.squad} · <span class="sq">{m.data.squad}</span>{/if} <span>{time(m.created_at)}</span></div>
        <div class="txt">{m.kind === 'alert' ? '⚠ ' + t('a_' + m.data.alert) : m.data.text}</div>
      </div>
    {/each}
  </div>
  <div class="send">
    {#if mySquad}
      <button class="tg" class:on={squadMsg} onclick={() => (squadMsg = !squadMsg)}>{squadMsg ? mySquad : t('everyone')}</button>
    {/if}
    <input bind:value={text} placeholder={t('message')} maxlength="500" onkeydown={(e) => e.key === 'Enter' && send()} />
    <button class="primary" onclick={send}>{t('send')}</button>
  </div>
</Sheet>

<style>
  .msgs { max-height: 44vh; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-bottom: 6px; }
  .m { align-self: flex-start; max-width: 85%; background: var(--panel2); border: 1px solid var(--line); border-radius: 12px; padding: 6px 10px; }
  .m.me { align-self: flex-end; border-color: #4a3d14; background: #241f0f; }
  .m.alert { border-color: var(--red); background: #2a0f0f; font-weight: 700; }
  .who { font-size: 11px; color: var(--muted); }
  .who span { margin-left: 4px; }
  .sq { color: var(--gold); margin: 0 !important; }
  .txt { margin-top: 2px; -webkit-user-select: text; user-select: text; word-wrap: break-word; }
  .send { display: flex; gap: 6px; margin-top: 8px; }
  .send input { padding: 10px 12px; }
  .tg { padding: 6px 10px; font-size: 12px; max-width: 30%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tg.on { border-color: var(--gold); color: var(--gold); }
</style>

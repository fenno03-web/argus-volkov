<script>
  import { S } from '../lib/store.svelte.js';
  import { t } from '../lib/i18n.js';
  import { distM } from '../lib/geo.js';
  import { squadColor } from '../lib/mapstyle.js';
  import Sheet from './Sheet.svelte';
  import { isBoches, shellSvg } from '../lib/boches.js';
  let { onfly, onclose } = $props();

  const myId = S.session.player_id;
  const mySquad = $derived(S.players[myId]?.squad || S.profile.squad);

  function ago(ts) {
    if (!ts) return t('no_gps');
    const s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 15) return t('now');
    if (s < 90) return `${Math.round(s)}s`;
    return `${Math.round(s / 60)}m`;
  }

  const list = $derived(Object.values(S.players).sort((a, b) => {
    const as = a.squad === mySquad ? 0 : 1, bs = b.squad === mySquad ? 0 : 1;
    if (a.id === myId) return -1; if (b.id === myId) return 1;
    return as - bs || (a.squad || '').localeCompare(b.squad || '') || a.name.localeCompare(b.name);
  }));
</script>

<Sheet title="{t('team')} · {S.session.faction.name} ({list.length})" {onclose}>
  {#each list as p (p.id)}
    <button class="p" class:hit={p.status === 'hit'} disabled={p.lat == null} onclick={() => onfly(p)}>
      <i style="background:{squadColor(p.squad)}"></i>
      <span class="grow">
        <b>{p.name}</b>{#if p.id === myId} <span class="muted">(jij)</span>{/if}
        <small>{#if isBoches(p.squad)}{@html shellSvg(11)} {/if}{p.squad || '—'} · {p.role ? t('r_' + p.role) : ''}</small>
      </span>
      <span class="r">
        <span class:red={p.status === 'hit'}>{p.status === 'hit' ? t('status_hit') : t('status_ok')}</span>
        <small>
          {#if S.myPos && p.lat != null && p.id !== myId}{Math.round(distM(S.myPos, p))} m · {/if}{ago(p.pos_at)}{#if p.battery != null} · {p.battery}%{/if}
        </small>
      </span>
    </button>
  {/each}
</Sheet>

<style>
  .p { width: 100%; display: flex; gap: 10px; align-items: center; text-align: left; margin-bottom: 6px; padding: 10px 12px; }
  .p:disabled { opacity: .6; }
  .p i { width: 12px; height: 12px; border-radius: 50%; flex: none; }
  .p small { display: block; color: var(--muted); font-size: 12px; margin-top: 2px; }
  .p.hit b { text-decoration: line-through; color: var(--muted); }
  .r { text-align: right; font-size: 13px; }
  .red { color: var(--red); font-weight: 700; }
</style>

<script>
  import { S } from '../lib/store.svelte.js';
</script>

{#if S.toast}
  <button type="button" class="toast {S.toast.kind}" onclick={() => (S.toast = null)}>{S.toast.text}</button>
{/if}

<style>
  .toast { position: fixed; left: 50%; transform: translateX(-50%); top: calc(var(--safe-top) + 70px); z-index: 100;
    background: var(--panel); border: 1px solid var(--line); padding: 12px 18px; border-radius: 12px; max-width: 90vw;
    font-weight: 600; box-shadow: 0 8px 30px rgba(0,0,0,.5); }
  .toast.alert { border-color: var(--red); background: #2a0f0f; color: #fff; font-size: 18px; }
</style>

<script>
  import { S } from './lib/store.svelte.js';
  import Start from './screens/Start.svelte';
  import MapView from './screens/MapView.svelte';
  import Toast from './components/Toast.svelte';

  $effect(() => { document.body.classList.toggle('night', S.night); });
  $effect(() => { document.documentElement.lang = S.lang; });
</script>

{#if S.session}
  <MapView />
{:else}
  <Start />
{/if}
<Toast />

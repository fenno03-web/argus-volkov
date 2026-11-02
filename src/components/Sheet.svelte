<script>
  let { title, onclose, children, tall = false } = $props();
</script>

<div class="sheet" class:tall>
  <div class="head">
    <b>{title}</b>
    <button class="x" onclick={onclose} aria-label="close">✕</button>
  </div>
  <div class="body">{@render children()}</div>
</div>

<style>
  .sheet { position: absolute; left: 0; right: 0; bottom: 0; max-height: 62vh; display: flex; flex-direction: column; z-index: 4;
    background: var(--panel); border-top: 1px solid var(--line); border-radius: 16px 16px 0 0; padding-bottom: calc(var(--safe-bottom) + 74px); }
  .sheet.tall { max-height: 78vh; }
  .head { display: flex; align-items: center; padding: 12px 14px 6px; }
  .head b { flex: 1; text-transform: uppercase; letter-spacing: .08em; color: var(--gold); font-size: 14px; }
  .x { padding: 4px 10px; }
  .body { overflow-y: auto; padding: 4px 14px 10px; -webkit-overflow-scrolling: touch; }
</style>

<script>
  import { onMount } from 'svelte';
  import { S, persist, toast } from '../lib/store.svelte.js';
  import { t, errText } from '../lib/i18n.js';
  import { nearby, gameInfo, createGame, addFaction, joinFaction, enter } from '../lib/api.js';
  import { getOnce } from '../lib/geo.js';
  import { FACTION_COLORS, ROLES, VERSION } from '../lib/config.js';
  import { isBoches } from '../lib/boches.js';

  // easter egg: tap the logo 7 times
  let taps = 0, tapTimer, crest = $state(false);
  function logoTap() {
    taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 1500);
    if (taps >= 7) {
      taps = 0; S.eggs = true; persist(); crest = true;
      toast(t('eggs_on'), 'info', 4500);
      setTimeout(() => (crest = false), 4000);
    }
  }

  let view = $state('home'); // home | create | join | addside
  let busy = $state(false);
  let here = $state(null);
  let locating = $state(true);
  let games = $state([]);
  let code = $state('');
  let game = $state(null);
  let pick = $state(null);      // faction id
  let codeword = $state('');
  let autoWord = null;

  let newGame = $state({ name: 'Skirm', faction: 'Geel', color: '#e3b341', codeword: '' });
  let newSide = $state({ name: 'Rood', color: '#d64545', codeword: '' });

  onMount(async () => {
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (h.get('join')) {
      code = h.get('join').toUpperCase();
      autoWord = h.get('w');
      const f = h.get('f');
      history.replaceState(null, '', location.pathname);
      await openGame(code, f);
    }
    here = await getOnce();
    locating = false;
    if (here) refreshNearby();
  });

  async function refreshNearby() {
    try { games = await nearby(here.lat, here.lng); } catch { games = []; }
  }

  function needName() {
    if (!S.profile.name.trim()) { toast(t('need_name'), 'alert'); return true; }
    persist();
    return false;
  }

  async function openGame(c, preselect = null) {
    if (!c) return;
    busy = true;
    try {
      const g = await gameInfo(c.trim().toUpperCase());
      if (!g) throw new Error('VOLKOV_NO_GAME');
      game = g; pick = preselect || (g.factions.length === 1 ? g.factions[0].id : null);
      codeword = autoWord || '';
      view = 'join';
    } catch (e) { toast(errText(e), 'alert'); }
    busy = false;
  }

  async function doJoin() {
    if (needName() || !pick) return;
    busy = true;
    try {
      const r = await joinFaction(pick, codeword);
      await enter(r.token);
    } catch (e) { toast(errText(e), 'alert'); }
    busy = false;
  }

  async function doCreate() {
    if (needName()) return;
    busy = true;
    try {
      const pos = here || (await getOnce());
      const r = await createGame({ ...newGame, lat: pos?.lat, lng: pos?.lng });
      await enter(r.token);
    } catch (e) { toast(errText(e), 'alert'); }
    busy = false;
  }

  async function doAddSide() {
    if (needName()) return;
    busy = true;
    try {
      const r = await addFaction({ code: game.code, ...newSide });
      await enter(r.token);
    } catch (e) { toast(errText(e), 'alert'); }
    busy = false;
  }

  function setLang(l) { S.lang = l; persist(); }
</script>

<div class="start">
  <div class="top row">
    <span class="grow"></span>
    <button class="chip" class:on={S.lang === 'nl'} onclick={() => setLang('nl')}>NL</button>
    <button class="chip" class:on={S.lang === 'en'} onclick={() => setLang('en')}>EN</button>
  </div>
  <button class="logobtn" onclick={logoTap} aria-label="ARGUS Volkov"><img class="logo" src="./logo.png" alt="ARGUS Volkov" /></button>
  {#if isBoches(S.profile.squad)}<img class="boches" src="./boches.jpg" alt="Airsoft Boches" />{/if}
  {#if crest}<button class="crest" onclick={() => (crest = false)}><img src="./boches.jpg" alt="Airsoft Boches" /></button>{/if}
  <p class="tag muted">{t('tagline')}</p>

  {#if view === 'home'}
    <section>
      <label for="nm">{t('name')}</label>
      <input id="nm" bind:value={S.profile.name} maxlength="30" autocomplete="nickname" onchange={persist} />
      <div class="row">
        <div class="grow">
          <label for="sq">{t('squad')}</label>
          <input id="sq" bind:value={S.profile.squad} maxlength="30" onchange={persist} />
        </div>
        <div class="grow">
          <label for="rl">{t('role')}</label>
          <select id="rl" bind:value={S.profile.role} onchange={persist}>
            {#each ROLES as r}<option value={r}>{t('r_' + r)}</option>{/each}
          </select>
        </div>
      </div>
    </section>

    <section>
      <h3>{t('nearby')}</h3>
      {#if locating}
        <p class="muted">{t('nearby_locating')}</p>
      {:else if !here}
        <p class="muted">{t('nearby_noloc')}</p>
      {:else if games.length === 0}
        <p class="muted">{t('nearby_none')}</p>
      {:else}
        {#each games as g}
          <button class="game" onclick={() => openGame(g.code)}>
            <span class="grow">
              <b>{g.name}</b>
              <span class="dots">{#each g.factions || [] as f}<i style="background:{f.color}" title={f.name}></i>{/each}</span>
            </span>
            <span class="muted small">{g.km} {t('km')} · {g.players} {t('players')}</span>
          </button>
        {/each}
      {/if}
    </section>

    <section>
      <label for="cd">{t('join_code')}</label>
      <div class="row">
        <input id="cd" class="mono" bind:value={code} maxlength="6" placeholder="ABC123" autocapitalize="characters" />
        <button class="primary" disabled={busy || code.trim().length < 6} onclick={() => openGame(code)}>{t('join')}</button>
      </div>
      <button class="wide" onclick={() => (view = 'create')}>+ {t('create')}</button>
    </section>
  {:else if view === 'create'}
    <section>
      <h3>{t('create')}</h3>
      <label for="gn">{t('game_name')}</label>
      <input id="gn" bind:value={newGame.name} maxlength="60" />
      <label for="fn">{t('your_side')}</label>
      <input id="fn" bind:value={newGame.faction} maxlength="40" />
      <div class="colors">
        {#each FACTION_COLORS as c}
          <button aria-label={c.name} class:on={newGame.color === c.color} style="background:{c.color}"
            onclick={() => { newGame.color = c.color; newGame.faction = c.name; }}></button>
        {/each}
      </div>
      <label for="cw">{t('codeword')}</label>
      <input id="cw" bind:value={newGame.codeword} maxlength="40" autocomplete="off" />
      <p class="muted small">{t('codeword_hint')}</p>
      <div class="row">
        <button onclick={() => (view = 'home')}>{t('back')}</button>
        <button class="primary grow" disabled={busy} onclick={doCreate}>{busy ? t('creating') : t('start')}</button>
      </div>
    </section>
  {:else if view === 'join' && game}
    <section>
      <h3>{game.name} <span class="mono muted">{game.code}</span></h3>
      {#if !S.profile.name.trim()}
        <label for="nm2">{t('name')}</label>
        <input id="nm2" bind:value={S.profile.name} maxlength="30" onchange={persist} />
      {/if}
      <div class="lbl">{t('pick_side')}</div>
      {#each game.factions as f}
        <button class="side" class:on={pick === f.id} onclick={() => (pick = f.id)}>
          <i style="background:{f.color}"></i><b class="grow">{f.name}</b><span class="muted small">{f.players} {t('players')}</span>
        </button>
      {/each}
      <label for="cw2">{t('codeword')}</label>
      <input id="cw2" bind:value={codeword} maxlength="40" autocomplete="off" onkeydown={(e) => e.key === 'Enter' && doJoin()} />
      <div class="row">
        <button onclick={() => (view = 'home')}>{t('back')}</button>
        <button class="primary grow" disabled={busy || !pick || codeword.length < 3} onclick={doJoin}>{busy ? t('creating') : t('join')}</button>
      </div>
      <button class="wide" onclick={() => (view = 'addside')}>+ {t('add_side')}</button>
    </section>
  {:else if view === 'addside' && game}
    <section>
      <h3>{t('add_side')} · {game.name}</h3>
      <label for="sn">{t('side')}</label>
      <input id="sn" bind:value={newSide.name} maxlength="40" />
      <div class="colors">
        {#each FACTION_COLORS as c}
          <button aria-label={c.name} class:on={newSide.color === c.color} style="background:{c.color}"
            onclick={() => { newSide.color = c.color; newSide.name = c.name; }}></button>
        {/each}
      </div>
      <label for="cw3">{t('codeword')}</label>
      <input id="cw3" bind:value={newSide.codeword} maxlength="40" autocomplete="off" />
      <p class="muted small">{t('codeword_hint')}</p>
      <div class="row">
        <button onclick={() => (view = 'join')}>{t('back')}</button>
        <button class="primary grow" disabled={busy} onclick={doAddSide}>{t('start')}</button>
      </div>
    </section>
  {/if}
  <p class="muted small ver">v{VERSION}</p>
</div>

<style>
  .start { height: 100%; overflow-y: auto; padding: calc(var(--safe-top) + 8px) 16px calc(var(--safe-bottom) + 24px); max-width: 520px; margin: 0 auto; }
  .logo { width: 100%; max-width: 440px; display: block; margin: 4px auto 0; }
  .logobtn { display: block; width: 100%; background: none; border: 0; padding: 0; }
  .boches { display: block; width: 72px; height: 72px; border-radius: 14px; margin: 6px auto 0; box-shadow: 0 0 0 2px #2f8cff55; }
  .crest { position: fixed; inset: 0; z-index: 90; background: #000d; border: 0; display: grid; place-items: center; animation: pop .5s ease-out; }
  .crest img { width: min(80vw, 420px); border-radius: 20px; box-shadow: 0 0 60px #2f8cff88; }
  @keyframes pop { from { opacity: 0; transform: scale(.8); } to { opacity: 1; transform: scale(1); } }
  .tag { text-align: center; margin: 4px 0 8px; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; }
  section { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 4px 14px 14px; margin-top: 14px; }
  h3 { margin: 12px 0 8px; font-size: 15px; text-transform: uppercase; letter-spacing: .08em; color: var(--gold); }
  .small { font-size: 13px; }
  .chip { padding: 6px 10px; font-size: 13px; }
  .chip.on { border-color: var(--gold); color: var(--gold); }
  .wide { width: 100%; margin-top: 12px; }
  .game, .side { width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; margin-top: 8px; }
  .side.on { border-color: var(--gold); background: #2a2410; }
  .side i, .dots i { display: inline-block; width: 14px; height: 14px; border-radius: 50%; }
  .dots { display: inline-flex; gap: 4px; margin-left: 8px; vertical-align: middle; }
  .colors { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
  .colors button { width: 36px; height: 36px; border-radius: 50%; padding: 0; border: 3px solid transparent; }
  .colors button.on { border-color: #fff; }
  .row :global(button) { white-space: nowrap; }
  .row { margin-top: 12px; }
  .ver { text-align: center; margin-top: 18px; }
  .lbl { font-size: 13px; color: var(--muted); margin: 12px 0 6px; text-transform: uppercase; letter-spacing: .06em; }
</style>

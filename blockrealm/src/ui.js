'use strict';
/* BlockRealm — strings, HUD, menus, inventory/crafting UI and input (keyboard, mouse, touch). */

const STRINGS = {
  he: {
    title: 'ממלכת הקוביות', tagline: 'עולם קוביות ריאליסטי: בונים, חוקרים ושורדים עד הזריחה.', worldAria: 'עולם המשחק',
    continue: 'המשך לשחק', newWorld: 'עולם חדש', settings: 'הגדרות', howto: 'איך משחקים',
    seedLabel: 'זרע עולם (ריק = אקראי)', modeLabel: 'מצב משחק', creative: 'יצירתי', survival: 'הישרדות',
    creativeDesc: 'כל הקוביות, תעופה חופשית, בלי נזק.', survivalDesc: 'אוספים חומרים, מכינים קוביות ושורדים את הלילה.',
    overwrite: 'עולם חדש יחליף את העולם השמור בדפדפן הזה.', create: 'צרו עולם', back: 'חזרה', seedMeta: 'זרע', loading: 'טוען עולם…',
    paused: 'המשחק מושהה', resume: 'חזרה למשחק', saveQuit: 'שמור וצא לתפריט', autosave: 'המשחק נשמר אוטומטית בדפדפן הזה.',
    renderDist: 'טווח ראייה (צ\'אנקים)', quality: 'איכות גרפיקה', qLow: 'נמוכה (בלי צללים)', qMed: 'בינונית', qHigh: 'גבוהה',
    fov: 'שדה ראייה', sens: 'רגישות מבט', bright: 'בהירות', volume: 'עוצמת קול', timeOfDay: 'שעה ביום',
    bob: 'נדנוד מצלמה בהליכה', autojump: 'קפיצה אוטומטית מעל מדרגה', done: 'סיום',
    inventory: 'מלאי', allBlocks: 'כל הקוביות', craft: 'הכנה', hotbar: 'סרגל מהיר', close: 'סגירה',
    invHintCreative: 'בחרו משבצת בסרגל, ואז לחצו על קובייה כדי לשים אותה שם.', invHintSurvival: 'לחצו על שתי משבצות כדי להחליף ביניהן. מתכונים זמינים מסומנים.',
    died: 'מתתם', deathHint: 'המלאי נשמר אצלכם. תופיעו מחדש בנקודת ההתחלה.', respawn: 'הופעה מחדש',
    fatalTitle: 'לא ניתן להציג את העולם', fatalMsg: 'הדפדפן הזה לא תומך ב-WebGL2, שנדרש להצגת העולם. נסו גרסה עדכנית של Chrome, Edge, Firefox או Safari.',
    pause: 'השהיה', fly: 'תעופה', break: 'שבירה', place: 'הנחה', sneak: 'התכופפות', jump: 'קפיצה',
    saved: 'המשחק נשמר', flyOn: 'תעופה פעילה', flyOff: 'תעופה כבויה', crafted: 'הוכן', full: 'המלאי מלא', ate: 'אכלתם',
    clickToPlay: 'לחצו על המסך כדי לשחק',
    keys: [['W A S D', 'תנועה'], ['עכבר', 'הסתכלות'], ['רווח', 'קפיצה · לחיצה כפולה לתעופה במצב יצירתי'], ['Shift', 'התכופפות / ירידה בתעופה'],
      ['Ctrl', 'ריצה'], ['לחיצה שמאלית', 'שבירה ותקיפה (בהישרדות: להחזיק)'], ['לחיצה ימנית', 'הנחת קובייה · אכילה'], ['1–9 · גלגלת', 'בחירת משבצת'],
      ['גלגלת (לחיצה)', 'העתקת קובייה (יצירתי)'], ['E', 'מלאי והכנה'], ['F', 'תעופה (יצירתי)'], ['F3', 'מידע טכני'], ['Esc', 'השהיה']],
    keysTouch: [['ג\'ויסטיק משמאל', 'תנועה (עד הקצה = ריצה)'], ['גרירה בצד ימין', 'הסתכלות'], ['הקשה קצרה', 'הנחת קובייה · אכילה'],
      ['לחיצה ארוכה', 'שבירה'], ['כפתורים', 'קפיצה, התכופפות, תעופה, מלאי']],
  },
  en: {
    title: 'BlockRealm', tagline: 'A realistic block world: build, explore and survive until sunrise.', worldAria: 'Game world',
    continue: 'Continue', newWorld: 'New world', settings: 'Settings', howto: 'How to play',
    seedLabel: 'World seed (blank = random)', modeLabel: 'Game mode', creative: 'Creative', survival: 'Survival',
    creativeDesc: 'Every block, free flight, no damage.', survivalDesc: 'Gather materials, craft blocks and survive the night.',
    overwrite: 'A new world replaces the world saved in this browser.', create: 'Create world', back: 'Back', seedMeta: 'Seed', loading: 'Loading world…',
    paused: 'Paused', resume: 'Back to game', saveQuit: 'Save and quit to menu', autosave: 'Progress saves automatically in this browser.',
    renderDist: 'Render distance (chunks)', quality: 'Graphics quality', qLow: 'Low (no shadows)', qMed: 'Medium', qHigh: 'High',
    fov: 'Field of view', sens: 'Look sensitivity', bright: 'Brightness', volume: 'Volume', timeOfDay: 'Time of day',
    bob: 'View bobbing', autojump: 'Auto-jump up steps', done: 'Done',
    inventory: 'Inventory', allBlocks: 'All blocks', craft: 'Crafting', hotbar: 'Hotbar', close: 'Close',
    invHintCreative: 'Pick a hotbar slot, then click a block to put it there.', invHintSurvival: 'Click two slots to swap them. Recipes you can make are lit.',
    died: 'You died', deathHint: 'You keep your inventory and respawn at the starting point.', respawn: 'Respawn',
    fatalTitle: 'The world can\'t be shown', fatalMsg: 'This browser doesn\'t support WebGL2, which the world needs. Try a current Chrome, Edge, Firefox or Safari.',
    pause: 'Pause', fly: 'Fly', break: 'Break', place: 'Place', sneak: 'Sneak', jump: 'Jump',
    saved: 'Game saved', flyOn: 'Flying on', flyOff: 'Flying off', crafted: 'Crafted', full: 'Inventory full', ate: 'Ate',
    clickToPlay: 'Click the screen to play',
    keys: [['W A S D', 'Move'], ['Mouse', 'Look'], ['Space', 'Jump · double-tap to fly in Creative'], ['Shift', 'Sneak / fly down'],
      ['Ctrl', 'Sprint'], ['Left click', 'Break and attack (hold in Survival)'], ['Right click', 'Place block · eat'], ['1–9 · wheel', 'Pick hotbar slot'],
      ['Middle click', 'Copy block (Creative)'], ['E', 'Inventory and crafting'], ['F', 'Fly (Creative)'], ['F3', 'Debug info'], ['Esc', 'Pause']],
    keysTouch: [['Left stick', 'Move (push to the edge to sprint)'], ['Drag on the right', 'Look'], ['Short tap', 'Place block · eat'],
      ['Long press', 'Break'], ['Buttons', 'Jump, sneak, fly, inventory']],
  },
};
let LANG = 'he';
const t = (k) => (STRINGS[LANG][k] !== undefined ? STRINGS[LANG][k] : STRINGS.he[k] !== undefined ? STRINGS.he[k] : k);
const $ = (id) => document.getElementById(id);
/* Touch UI only when the primary pointer is coarse (phones/tablets); touchscreen laptops keep mouse + pointer lock.
   A real touch on any device switches the touch controls on (see Input.bindTouch). */
let IS_TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

const HEART_PATH = 'M10 17.6 3.1 10.8A4.4 4.4 0 0 1 10 5.2a4.4 4.4 0 0 1 6.9 5.6z';

class UI {
  constructor(game) {
    this.g = game;
    this.lastHealth = -1; this.lastAir = null; this.nameTimer = 0;
    document.body.classList.toggle('touch', IS_TOUCH);
    const hb = $('hotbar');
    this.slots = [];
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('button');
      b.className = 'slot'; b.type = 'button'; b.dataset.i = i;
      b.innerHTML = `<img alt="" src=""><b class="n"></b><kbd>${i + 1}</kbd>`;
      b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); game.selectSlot(i); });
      hb.appendChild(b);
      this.slots.push(b);
    }
    const hearts = $('hearts');
    for (let i = 0; i < 10; i++) {
      hearts.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 20 20" class="heart"><defs><clipPath id="hc${i}"><rect x="0" y="0" width="10" height="20"/></clipPath></defs><path class="bg" d="${HEART_PATH}"/><path class="fill" d="${HEART_PATH}"/></svg>`);
    }
    const bub = $('bubbles');
    for (let i = 0; i < 10; i++) bub.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 20" class="bubble"><circle cx="10" cy="10" r="6.5"/></svg>');
    this.heartEls = [...hearts.children];
    this.bubbleEls = [...bub.children];
    this.bind();
  }

  bind() {
    const g = this.g;
    $('continueBtn').addEventListener('click', () => { g.sound.init(); g.continueGame(); });
    $('newBtn').addEventListener('click', () => { $('menuMain').hidden = true; $('newForm').hidden = false; $('overwriteNote').hidden = !g.hasSave; $('seedInput').focus(); });
    $('newBack').addEventListener('click', () => { $('menuMain').hidden = false; $('newForm').hidden = true; });
    $('newForm').addEventListener('submit', (e) => {
      e.preventDefault();
      g.sound.init();
      g.newGame($('seedInput').value, $('modeSurvival').checked ? 'survival' : 'creative');
    });
    $('menuSettings').addEventListener('click', () => this.openSettings('menu'));
    $('pauseSettings').addEventListener('click', () => this.openSettings('paused'));
    $('resumeBtn').addEventListener('click', () => g.resume());
    $('quitBtn').addEventListener('click', () => g.quitToMenu());
    $('deathQuit').addEventListener('click', () => g.quitToMenu());
    $('respawnBtn').addEventListener('click', () => g.respawn());
    $('invClose').addEventListener('click', () => g.closeInventory());
    $('langBtn').addEventListener('click', () => { LANG = LANG === 'he' ? 'en' : 'he'; g.settings.lang = LANG; g.saveSettings(); this.applyLang(); });
    $('settingsForm').addEventListener('submit', (e) => { e.preventDefault(); this.closeSettings(); });
    const bindRange = (id, out, key, fmt) => {
      const el = $(id);
      el.addEventListener('input', () => { g.settings[key] = parseFloat(el.value); $(out).textContent = fmt(g.settings[key]); g.applySettings(); });
    };
    bindRange('setDist', 'outDist', 'renderDist', (v) => String(v));
    bindRange('setFov', 'outFov', 'fov', (v) => v + '°');
    bindRange('setSens', 'outSens', 'sens', (v) => v.toFixed(1));
    bindRange('setBright', 'outBright', 'bright', (v) => Math.round(v * 100) + '%');
    bindRange('setVol', 'outVol', 'volume', (v) => Math.round(v * 100) + '%');
    $('setTime').addEventListener('input', () => { const h = parseFloat($('setTime').value); g.setTimeOfDay(h); $('outTime').textContent = this.fmtHour(h); });
    $('setQuality').addEventListener('change', () => { g.settings.quality = $('setQuality').value; g.applySettings(); });
    $('setBob').addEventListener('change', () => { g.settings.bob = $('setBob').checked; g.applySettings(); });
    $('setAutoJump').addEventListener('change', () => { g.settings.autoJump = $('setAutoJump').checked; g.applySettings(); });
  }

  applyLang() {
    const he = LANG === 'he';
    document.documentElement.lang = he ? 'he' : 'en';
    document.documentElement.dir = he ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $('eyebrow').textContent = he ? 'BLOCKREALM' : 'ממלכת הקוביות';
    $('eyebrow').lang = he ? 'en' : 'he';
    $('langBtn').textContent = he ? 'English' : 'עברית';
    $('langBtn').lang = he ? 'en' : 'he';
    document.title = t('title');
    const list = IS_TOUCH ? t('keysTouch') : t('keys');
    $('keysDesktop').innerHTML = list.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('fatalMsg').textContent = t('fatalMsg');
    if (!$('inventory').hidden) this.renderInventory();
  }

  fmtHour(h) { const hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60); return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); }

  screen(id) {
    for (const s of ['menu', 'pause', 'settings', 'inventory', 'death']) $(s).hidden = s !== id;
  }

  openSettings(from) {
    const s = this.g.settings;
    this.settingsFrom = from;
    $('setDist').value = s.renderDist; $('outDist').textContent = s.renderDist;
    $('setQuality').value = s.quality;
    $('setFov').value = s.fov; $('outFov').textContent = s.fov + '°';
    $('setSens').value = s.sens; $('outSens').textContent = s.sens.toFixed(1);
    $('setBright').value = s.bright; $('outBright').textContent = Math.round(s.bright * 100) + '%';
    $('setVol').value = s.volume; $('outVol').textContent = Math.round(s.volume * 100) + '%';
    const h = this.g.hourOfDay();
    $('setTime').value = h; $('outTime').textContent = this.fmtHour(h);
    $('setBob').checked = s.bob; $('setAutoJump').checked = s.autoJump;
    this.screen('settings');
  }
  closeSettings() {
    this.g.saveSettings();
    this.screen(this.settingsFrom === 'menu' ? 'menu' : 'pause');
  }

  toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 2500);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  }

  showItemName(id) {
    const el = $('itemName');
    el.textContent = id ? itemName(id, LANG) : '';
    el.style.opacity = 1;
    this.nameTimer = 2;
  }

  updateHotbar() {
    const g = this.g, inv = g.inv;
    for (let i = 0; i < 9; i++) {
      const s = inv.slots[i], b = this.slots[i];
      const img = b.firstChild, url = s ? itemIcon(s.id) : '';
      if (img.getAttribute('src') !== url) img.setAttribute('src', url);
      b.children[1].textContent = s && g.mode === 'survival' && s.n > 1 ? s.n : '';
      b.classList.toggle('sel', i === inv.sel);
      b.title = s ? itemName(s.id, LANG) : '';
    }
  }

  setText(id, v) {
    const c = this.textCache || (this.textCache = {});
    if (c[id] !== v) { c[id] = v; $(id).textContent = v; }
  }
  updateHud(dt) {
    const g = this.g, p = g.player;
    if (this.nameTimer > 0) { this.nameTimer -= dt; if (this.nameTimer <= 0) $('itemName').style.opacity = 0; }
    const survival = g.mode === 'survival';
    if (this.survivalShown !== survival) { this.survivalShown = survival; $('vitals').style.visibility = survival ? 'visible' : 'hidden'; }
    if (survival && this.lastHealth !== p.health) {
      this.lastHealth = p.health;
      this.heartEls.forEach((el, i) => {
        const v = p.health - i * 2, fill = el.lastChild;
        fill.style.display = v >= 1 ? '' : 'none';
        if (v === 1) fill.setAttribute('clip-path', `url(#hc${i})`); else fill.removeAttribute('clip-path');
      });
    }
    const air = p.headInWater || p.air < 10 ? Math.ceil(p.air) : -1;
    if (air !== this.lastAir) {
      this.lastAir = air;
      $('bubbles').style.visibility = survival && air >= 0 ? 'visible' : 'hidden';
      this.bubbleEls.forEach((el, i) => { el.style.opacity = i < air ? 1 : 0.15; });
    }
    const w = g.world;
    this.setText('chipBiome', BIOME_NAMES[LANG][w.biomeAt(Math.floor(p.x), Math.floor(p.z))]);
    this.setText('chipTime', this.fmtHour(g.hourOfDay()));
    this.setText('chipPos', `${Math.floor(p.x)}, ${Math.floor(p.y)}, ${Math.floor(p.z)}`);
    const ring = $('ring'), prog = g.breaking ? Math.min(1, g.breaking.t) : 0;
    ring.hidden = prog <= 0;
    if (prog > 0) ring.firstChild.style.strokeDasharray = `${prog * 100} 100`;
    $('hud').classList.toggle('underwater', g.cameraUnderwater);
    $('hud').classList.toggle('hurt', p.hurtCd > 0.3);
    const dbg = $('debug');
    dbg.hidden = !g.debug;
    if (g.debug) {
      const r = g.renderer.stats, look = p.look();
      const dir = Math.abs(look[0]) > Math.abs(look[2]) ? (look[0] > 0 ? '+X (east)' : '-X (west)') : (look[2] > 0 ? '+Z (south)' : '-Z (north)');
      dbg.textContent = [
        `BlockRealm  ${g.fps.toFixed(0)} fps`,
        `XYZ  ${p.x.toFixed(2)} / ${p.y.toFixed(2)} / ${p.z.toFixed(2)}`,
        `Chunk  ${Math.floor(p.x / 16)}, ${Math.floor(p.z / 16)}   facing ${dir}`,
        `Chunks  ${w.chunks.size} loaded, ${r.chunks} visible, ${(r.quads / 1000).toFixed(1)}k quads`,
        `Light  sky ${w.getLight(Math.floor(p.x), Math.floor(p.eyeY()), Math.floor(p.z))}   torches ${g.renderer.numLights}`,
        `Mobs  ${g.mobs.list.length}   particles ${g.particles.list.length}`,
        `Seed  ${w.seed}   mode ${g.mode}`,
      ].join('\n');
    }
  }

  /* ---------- inventory ---------- */
  renderInventory() {
    const g = this.g, inv = g.inv, creative = g.mode === 'creative';
    $('invTitle').textContent = creative ? t('allBlocks') : t('inventory');
    $('invHint').textContent = creative ? t('invHintCreative') : t('invHintSurvival');
    const grid = $('invGrid'), hot = $('invHotbar');
    grid.innerHTML = ''; hot.innerHTML = '';
    const mk = (item, onClick, extra) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'slot' + (extra ? ' ' + extra : '');
      b.innerHTML = `<img alt="" src="${item ? itemIcon(item.id) : ''}"><b class="n">${item && !creative && item.n > 1 ? item.n : ''}</b>`;
      const name = item ? itemName(item.id, LANG) : '';
      b.setAttribute('aria-label', name || '—');
      b.addEventListener('pointerenter', () => { $('invLabel').textContent = name; });
      b.addEventListener('click', onClick);
      return b;
    };
    if (creative) {
      for (const id of CREATIVE_LIST) grid.appendChild(mk({ id, n: 1 }, () => { inv.slots[inv.sel] = { id, n: 1 }; g.sound.click(); this.renderInventory(); this.updateHotbar(); g.handDirty = true; }));
    } else {
      for (let i = 9; i < 36; i++) grid.appendChild(mk(inv.slots[i], () => this.slotClick(i), this.pick === i ? 'pick' : ''));
    }
    for (let i = 0; i < 9; i++) {
      hot.appendChild(mk(inv.slots[i], () => {
        if (creative) { inv.sel = i; g.handDirty = true; } else this.slotClick(i);
        this.renderInventory(); this.updateHotbar();
      }, (creative && i === inv.sel ? 'sel' : '') + (this.pick === i ? ' pick' : '')));
    }
    $('craft').hidden = creative;
    if (!creative) {
      const box = $('recipes');
      box.innerHTML = '';
      for (const r of RECIPES) {
        const ok = g.canCraft(r);
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'recipe'; b.disabled = !ok;
        const need = r.need.map(([ids, n]) => `<span><img alt="" src="${itemIcon(ids[0])}">×${n}</span>`).join('');
        b.innerHTML = `<img alt="" src="${itemIcon(r.out[0])}"><b>${itemName(r.out[0], LANG)} ×${r.out[1]}</b><span class="need">${need}</span>`;
        b.addEventListener('click', () => { if (g.craft(r)) { this.renderInventory(); this.updateHotbar(); } });
        box.appendChild(b);
      }
    }
  }
  slotClick(i) {
    const inv = this.g.inv;
    if (this.pick === undefined || this.pick === null) { if (inv.slots[i]) this.pick = i; }
    else {
      const a = this.pick;
      const sa = inv.slots[a], sb = inv.slots[i];
      if (sa && sb && sa.id === sb.id && a !== i) { const m = Math.min(64 - sb.n, sa.n); sb.n += m; sa.n -= m; if (sa.n <= 0) inv.slots[a] = null; }
      else { inv.slots[a] = sb; inv.slots[i] = sa; }
      this.pick = null;
      this.g.handDirty = true;
    }
    this.g.sound.click();
    this.renderInventory();
    this.updateHotbar();
  }
}

class Input {
  constructor(game, canvas) {
    this.g = game; this.canvas = canvas;
    this.keys = new Set();
    this.lookDX = 0; this.lookDY = 0;
    this.attack = false; this.use = false; this.attackPressed = false; this.usePressed = false; this.pickPressed = false;
    this.locked = false; this.freeLook = false; this.ignoreUnlock = false; this.skipMoves = 0; this.moveAvg = 0;
    this.lastSpace = 0;
    this.stick = { id: null, x: 0, y: 0, vx: 0, vz: 0 };
    this.lookT = { id: null, x: 0, y: 0, t0: 0, moved: false, long: false };
    this.btn = {};
    this.bindKeyboard(); this.bindMouse(); this.bindTouch();
  }
  typing(e) { const tg = e.target; return tg && (tg.tagName === 'INPUT' || tg.tagName === 'SELECT' || tg.tagName === 'TEXTAREA'); }
  bindKeyboard() {
    const g = this.g;
    window.addEventListener('keydown', (e) => {
      if (this.typing(e)) return;
      const c = e.code;
      if (c === 'F3') { e.preventDefault(); g.debug = !g.debug; return; }
      if (c === 'KeyE' && (g.state === 'playing' || g.state === 'inventory')) { e.preventDefault(); g.toggleInventory(); return; }
      if (c === 'Escape' && g.state === 'inventory') { g.closeInventory(); return; }
      if (c === 'Escape' && g.state === 'playing' && !this.locked) { g.pause(); return; }
      if (g.state !== 'playing') return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(c) || (e.ctrlKey && c === 'KeyW')) e.preventDefault();
      if (c.startsWith('Digit')) { const n = parseInt(c.slice(5), 10); if (n >= 1 && n <= 9) g.selectSlot(n - 1); }
      if (c === 'Space' && !e.repeat) {
        const now = performance.now();
        if (now - this.lastSpace < 300) { g.toggleFly(); this.lastSpace = 0; } else this.lastSpace = now;
      }
      if (c === 'KeyF' && !e.repeat) g.toggleFly();
      if (c === 'KeyW' && !e.repeat) {
        const now = performance.now();
        if (now - (this.lastW || 0) < 280) this.sprintLatch = true;
        this.lastW = now;
      }
      this.keys.add(c);
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); if (e.code === 'KeyW') this.sprintLatch = false; });
    window.addEventListener('blur', () => { this.keys.clear(); this.attack = this.use = false; });
  }
  bindMouse() {
    const g = this.g, cv = this.canvas;
    cv.addEventListener('mousedown', (e) => {
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      if (g.state !== 'playing') return;
      if (!this.locked) {
        // Always retry the lock on click; act on the click only if the lock is unavailable.
        const wasFree = this.freeLook;
        this.requestLock();
        if (!wasFree) return;
      }
      if (e.button === 0) { this.attack = true; this.attackPressed = true; }
      if (e.button === 2) { this.use = true; this.usePressed = true; }
      if (e.button === 1) { e.preventDefault(); this.pickPressed = true; }
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.attack = false; if (e.button === 2) this.use = false; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mousemove', (e) => {
      if (g.state !== 'playing') return;
      if (!this.locked && !(this.freeLook && e.target === cv)) return;
      const dx = e.movementX || 0, dy = e.movementY || 0;
      if (this.skipMoves > 0) { this.skipMoves--; return; }
      // Browsers occasionally report one huge bogus delta (lock changes, cursor re-entering, a Chrome bug
      // on some mice); drop isolated spikes but let genuinely fast flicks through as they ramp up.
      const mag = Math.abs(dx) + Math.abs(dy);
      if (mag > 160 && mag > this.moveAvg * 6 + 60) { this.moveAvg = this.moveAvg * 0.85 + 25; return; }
      this.moveAvg = this.moveAvg * 0.8 + mag * 0.2;
      this.lookDX += dx; this.lookDY += dy;
    });
    cv.addEventListener('mouseenter', () => { if (this.freeLook) this.skipMoves = 1; });
    cv.addEventListener('wheel', (e) => { if (g.state === 'playing') { e.preventDefault(); g.scrollSlot(Math.sign(e.deltaY)); } }, { passive: false });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === cv;
      this.skipMoves = 2; this.moveAvg = 0;
      if (this.locked) this.freeLook = false;
      if (!this.locked && g.state === 'playing' && !this.ignoreUnlock && !IS_TOUCH) g.pause();
      this.ignoreUnlock = false;
    });
    document.addEventListener('pointerlockerror', () => { this.freeLook = true; });
  }
  requestLock() {
    if (IS_TOUCH) return;
    const cv = this.canvas;
    if (!cv.requestPointerLock) { this.freeLook = true; return; }
    const plain = () => {
      try {
        const r = cv.requestPointerLock();
        if (r && r.catch) r.catch(() => { this.freeLook = true; });
      } catch (e) { this.freeLook = true; }
    };
    // Raw (unaccelerated) mouse input where supported: steadier deltas, no OS acceleration jumps.
    try {
      const r = cv.requestPointerLock({ unadjustedMovement: true });
      if (r && r.catch) r.catch((err) => { if (err && err.name === 'NotSupportedError') plain(); else this.freeLook = true; });
    } catch (e) { plain(); }
  }
  releaseLock() {
    if (document.pointerLockElement) { this.ignoreUnlock = true; document.exitPointerLock(); }
  }
  bindTouch() {
    const g = this.g, layer = $('touch'), stickEl = $('stick'), knob = $('knob');
    const R = 56;
    const opts = { passive: false };
    window.addEventListener('touchstart', () => { if (!IS_TOUCH) g.enableTouch(); }, { passive: true });
    layer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      g.sound.init();
      for (const tc of e.changedTouches) {
        const b = tc.target.closest && tc.target.closest('[data-btn]');
        if (b) {
          const name = b.dataset.btn;
          this.btn[name] = tc.identifier;
          b.classList.add('on');
          if (name === 'jump') {
            const now = performance.now();
            if (g.mode === 'creative' && now - this.lastSpace < 300) { g.toggleFly(); this.lastSpace = 0; } else this.lastSpace = now;
          }
          if (name === 'place') { this.use = true; this.usePressed = true; }
          if (name === 'break') { this.attack = true; this.attackPressed = true; }
          if (name === 'fly') g.toggleFly();
          if (name === 'inv') g.toggleInventory();
          if (name === 'pause') g.pause();
          continue;
        }
        if (tc.clientX < window.innerWidth * 0.42 && this.stick.id === null) {
          this.stick.id = tc.identifier; this.stick.x = tc.clientX; this.stick.y = tc.clientY;
          stickEl.style.left = (tc.clientX - 66) + 'px'; stickEl.style.top = (tc.clientY - 66) + 'px'; stickEl.style.bottom = 'auto';
          knob.style.transform = 'translate(0,0)';
        } else if (this.lookT.id === null) {
          Object.assign(this.lookT, { id: tc.identifier, x: tc.clientX, y: tc.clientY, t0: performance.now(), moved: false, long: false });
        }
      }
    }, opts);
    layer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const tc of e.changedTouches) {
        if (tc.identifier === this.stick.id) {
          let dx = tc.clientX - this.stick.x, dy = tc.clientY - this.stick.y;
          const l = Math.hypot(dx, dy);
          if (l > R) { dx *= R / l; dy *= R / l; }
          this.stick.vx = dx / R; this.stick.vz = -dy / R;
          knob.style.transform = `translate(${dx}px, ${dy}px)`;
        } else if (tc.identifier === this.lookT.id) {
          const dx = tc.clientX - this.lookT.x, dy = tc.clientY - this.lookT.y;
          this.lookT.x = tc.clientX; this.lookT.y = tc.clientY;
          this.lookDX += dx * 2.2; this.lookDY += dy * 2.2;
          this.lookT.dist = (this.lookT.dist || 0) + Math.abs(dx) + Math.abs(dy);
          if (this.lookT.dist > 12) { this.lookT.moved = true; if (this.lookT.long) { this.lookT.long = false; this.attack = false; } }
        }
      }
    }, opts);
    const end = (e) => {
      e.preventDefault();
      for (const tc of e.changedTouches) {
        for (const [name, id] of Object.entries(this.btn)) {
          if (id !== tc.identifier) continue;
          delete this.btn[name];
          const el = layer.querySelector(`[data-btn="${name}"]`);
          if (el) el.classList.remove('on');
          if (name === 'place') this.use = false;
          if (name === 'break') this.attack = false;
        }
        if (tc.identifier === this.stick.id) {
          this.stick.id = null; this.stick.vx = 0; this.stick.vz = 0;
          knob.style.transform = 'translate(0,0)';
          stickEl.style.left = ''; stickEl.style.top = ''; stickEl.style.bottom = '';
        } else if (tc.identifier === this.lookT.id) {
          if (!this.lookT.moved && !this.lookT.long && performance.now() - this.lookT.t0 < 300) { this.usePressed = true; }
          if (this.lookT.long) this.attack = false;
          this.lookT.id = null; this.lookT.dist = 0;
        }
      }
    };
    layer.addEventListener('touchend', end, opts);
    layer.addEventListener('touchcancel', end, opts);
  }
  /* Called once per frame before gameplay reads input. */
  poll() {
    const lt = this.lookT;
    if (lt.id !== null && !lt.moved && !lt.long && performance.now() - lt.t0 > 320) { lt.long = true; this.attack = true; this.attackPressed = true; }
    const k = this.keys;
    let mx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let mz = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    let sprint = k.has('ControlLeft') || k.has('ControlRight') || !!this.sprintLatch;
    if (this.stick.id !== null) {
      mx = this.stick.vx; mz = this.stick.vz;
      if (Math.hypot(mx, mz) > 0.92 && mz > 0.5) sprint = true;
    }
    return {
      moveX: mx, moveZ: mz, sprint,
      jump: k.has('Space') || this.btn.jump !== undefined,
      sneak: k.has('ShiftLeft') || k.has('ShiftRight') || this.btn.sneak !== undefined,
    };
  }
  endFrame() { this.attackPressed = false; this.usePressed = false; this.pickPressed = false; this.lookDX = 0; this.lookDY = 0; }
  reset() { this.keys.clear(); this.attack = this.use = false; this.btn = {}; this.stick.id = null; this.stick.vx = this.stick.vz = 0; this.lookT.id = null; document.querySelectorAll('.tb.on').forEach((b) => b.classList.remove('on')); }
}

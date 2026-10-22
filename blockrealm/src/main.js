'use strict';
/* BlockRealm — game state, loop, interaction, persistence. */

const DAY_SECONDS = 1200;
const SAVE_KEY = 'blockrealm.save.v1', SET_KEY = 'blockrealm.settings.v1';
const QUALITY = {
  low: { shadows: false, shadowSize: 1, shadowRange: 0, clouds: false, scaleCap: 1, budget: 4 },
  medium: { shadows: true, shadowSize: 1024, shadowRange: 48, pcfTaps: 4, clouds: true, scaleCap: 1.5, budget: 5 },
  high: { shadows: true, shadowSize: 2048, shadowRange: 80, pcfTaps: 8, clouds: true, scaleCap: 2, budget: 6 },
};
const CREATIVE_HOTBAR = ['grass', 'dirt', 'stone', 'cobblestone', 'oak_planks', 'oak_log', 'glass', 'torch', 'bricks'];

function storeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
function storeSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }

class Game {
  constructor(hotData) {
    this.canvas = $('gl');
    this.settings = Object.assign({
      lang: 'he', renderDist: IS_TOUCH ? 5 : 7, quality: IS_TOUCH ? 'medium' : 'high', fov: 75, sens: 1,
      bright: 0.45, volume: 0.7, bob: true, autoJump: IS_TOUCH,
    }, this.loadJSON(SET_KEY) || {});
    LANG = this.settings.lang === 'en' ? 'en' : 'he';
    this.ui = new UI(this);
    this.ui.applyLang();
    try {
      this.renderer = new Renderer(this.canvas, { antialias: !IS_TOUCH });
    } catch (e) {
      console.error(e);
      $('menu').hidden = true;
      $('fatal').hidden = false;
      if (String(e.message).startsWith('shader') || String(e.message).startsWith('link')) $('fatalMsg').textContent = e.message;
      this.failed = true;
      return;
    }
    this.mesher = new Mesher();
    this.mesher.onMesh = (c, md, mq, wd, wq) => this.renderer.uploadChunk(c, md, mq, wd, wq);
    this.sound = new Sound();
    this.input = new Input(this, this.canvas);
    this.player = new Player();
    this.particles = new Particles();
    this.clock = 0; this.last = 0; this.fps = 60; this.debug = false;
    this.state = 'menu';
    this.breaking = null; this.attackCd = 0; this.useCd = 0; this.swingT = 0; this.handDirty = true;
    this.saveTimer = 0; this.cameraUnderwater = false; this.fovCur = this.settings.fov;
    this.inv = { slots: new Array(36).fill(null), sel: 0 };

    const save = (hotData && hotData.save) || this.loadJSON(SAVE_KEY);
    this.hasSave = !!(save && save.v === 1);
    if (this.hasSave) this.loadWorld(save);
    else this.createWorld((Math.random() * 2147483647) | 0, 'creative', null);
    $('continueBtn').hidden = !this.hasSave;
    $('menuSeed').textContent = this.world.seed;
    this.ui.screen('menu');
    this.applySettings();

    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.state === 'playing') this.pause(); this.save(); this.sound.suspend(); }
      else this.sound.resume();
    });
    window.addEventListener('pagehide', () => this.save());
    this.resize();
    requestAnimationFrame((t) => this.loop(t));
  }

  loadJSON(k) { const s = storeGet(k); if (!s) return null; try { return JSON.parse(s); } catch (e) { return null; } }
  saveSettings() { storeSet(SET_KEY, JSON.stringify(this.settings)); }

  applySettings() {
    const s = this.settings, q = QUALITY[s.quality] || QUALITY.medium;
    this.quality = q;
    if (this.world && this.world.renderDist !== s.renderDist) { this.world.renderDist = s.renderDist; this.world.needScan = true; }
    this.sound.setVolume(s.volume);
    this.resize();
  }
  resize() {
    if (!this.renderer) return;
    const q = this.quality || QUALITY.medium;
    this.renderer.resize(Math.min(window.devicePixelRatio || 1, q.scaleCap));
  }

  /* ---------- world lifecycle ---------- */
  disposeWorld() {
    if (!this.world) return;
    for (const c of this.world.chunks.values()) this.renderer.freeChunk(c);
    this.world.chunks.clear();
  }
  createWorld(seed, mode, edits) {
    this.disposeWorld();
    this.world = new World(seed, edits);
    this.world.renderDist = this.settings.renderDist;
    this.world.onUnload = (c) => this.renderer.freeChunk(c);
    this.mode = mode;
    this.spawn = this.world.gen.findSpawn();
    this.time = 0.035;
    this.mobs = new MobManager(seed);
    this.particles.list = [];
    this.weather = { rain: 0, target: 0, timer: 300 + Math.random() * 300 };
    this.precip = new Precip(IS_TOUCH ? 700 : 1200);
    this.orbit = 0;
    this.menuY = undefined;
  }
  loadWorld(save) {
    this.createWorld(save.seed | 0, save.mode === 'survival' ? 'survival' : 'creative', World.parseEdits(save.edits));
    if (Array.isArray(save.spawn)) this.spawn = save.spawn;
    this.time = typeof save.time === 'number' ? save.time : 0.035;
    if (save.weather && typeof save.weather.rain === 'number') this.weather = { rain: clamp(save.weather.rain, 0, 1), target: clamp(save.weather.target || 0, 0, 1), timer: save.weather.timer || 300 };
    const p = this.player, sp = save.player || {};
    Object.assign(p, new Player());
    p.x = sp.x ?? this.spawn[0]; p.y = sp.y ?? this.spawn[1]; p.z = sp.z ?? this.spawn[2];
    p.yaw = sp.yaw || 0; p.pitch = sp.pitch || 0; p.health = sp.health || 20; p.flying = !!sp.flying;
    this.inv.slots = new Array(36).fill(null);
    if (Array.isArray(save.inv)) save.inv.forEach((s, i) => { if (s && i < 36 && (isBlock(s.id) || ITEMS[s.id])) this.inv.slots[i] = { id: s.id, n: Math.max(1, Math.min(64, s.n | 0)) }; });
    this.inv.sel = clamp(save.sel | 0, 0, 8);
    this.playerPlaced = true;
  }
  save() {
    if (!this.world || !this.started) return;
    const p = this.player;
    const data = {
      v: 1, seed: this.world.seed, mode: this.mode, time: this.time, spawn: this.spawn, weather: this.weather,
      player: { x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3), yaw: +p.yaw.toFixed(4), pitch: +p.pitch.toFixed(4), health: p.dead ? 20 : p.health, flying: p.flying },
      inv: this.inv.slots, sel: this.inv.sel, edits: this.world.serializeEdits(),
    };
    this.lastSave = data;
    if (storeSet(SAVE_KEY, JSON.stringify(data))) this.hasSave = true;
    return data;
  }

  newGame(seedText, mode) {
    const txt = String(seedText || '').trim();
    const fresh = !this.hasSave && this.world.edits.size === 0;
    const seed = txt ? hashString(txt) : fresh ? this.world.seed : (Math.random() * 2147483647) | 0;
    const reuse = !txt && fresh;
    if (reuse) this.mode = mode; else this.createWorld(seed, mode, null);
    this.time = 0.035;
    Object.assign(this.player, new Player());
    this.player.x = this.spawn[0]; this.player.y = this.spawn[1]; this.player.z = this.spawn[2];
    this.player.yaw = Math.PI * 0.75;
    this.playerPlaced = false;
    this.inv.slots = new Array(36).fill(null); this.inv.sel = 0;
    if (mode === 'creative') CREATIVE_HOTBAR.forEach((n, i) => { this.inv.slots[i] = { id: B[n], n: 1 }; });
    this.mobs = new MobManager(seed);
    this.startLoading();
  }
  continueGame() { this.startLoading(); }
  startLoading() {
    this.started = true;
    this.state = 'loading';
    this.ui.screen(null);
    $('menuMain').hidden = false; $('newForm').hidden = true;
    $('loading').hidden = false;
    $('hud').hidden = false;
    $('touch').hidden = !IS_TOUCH;
    this.ui.updateHotbar();
    this.handDirty = true;
    this.input.reset();
    this.input.requestLock();
    this.save();
  }
  finishLoading() {
    const p = this.player;
    if (!this.playerPlaced) {
      const x = Math.floor(p.x), z = Math.floor(p.z);
      let y = CH - 1;
      for (; y > 0; y--) {
        const id = this.world.getBlock(x, y, z);
        if ((SOLID[id] || LIQUID[id]) && id !== B.oak_leaves && id !== B.birch_leaves && id !== B.spruce_leaves && RENDERT[id] === RENDER.CUBE || LIQUID[id]) break;
      }
      p.y = y + 1;
      this.spawn = [p.x, p.y, p.z];
      this.playerPlaced = true;
    }
    $('loading').hidden = true;
    this.state = 'playing';
    this.ui.toast(t(this.mode === 'creative' ? 'creative' : 'survival'));
    if (!IS_TOUCH && !this.input.locked && !this.input.freeLook) this.ui.toast(t('clickToPlay'));
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.input.reset();
    this.input.releaseLock();
    this.ui.screen('pause');
    this.save();
  }
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.screen(null);
    this.input.requestLock();
  }
  quitToMenu() {
    this.save();
    this.input.releaseLock();
    this.state = 'menu';
    $('hud').hidden = true; $('touch').hidden = true; $('loading').hidden = true;
    $('continueBtn').hidden = !this.hasSave;
    $('menuSeed').textContent = this.world.seed;
    this.ui.screen('menu');
  }
  respawn() {
    const p = this.player;
    p.dead = false; p.health = 20; p.air = 10; p.vx = p.vy = p.vz = 0; p.fallStart = null; p.flying = false;
    p.x = this.spawn[0]; p.y = this.spawn[1]; p.z = this.spawn[2];
    this.ui.lastHealth = -1;
    this.ui.screen(null);
    this.startLoading();
    this.playerPlaced = true;
  }
  toggleInventory() { if (this.state === 'inventory') this.closeInventory(); else if (this.state === 'playing') this.openInventory(); }
  openInventory() {
    this.state = 'inventory';
    this.input.reset();
    this.input.releaseLock();
    this.ui.pick = null;
    this.ui.renderInventory();
    this.ui.screen('inventory');
  }
  closeInventory() {
    if (this.state !== 'inventory') return;
    this.state = 'playing';
    this.ui.screen(null);
    this.ui.updateHotbar();
    this.input.requestLock();
  }
  toggleFly() {
    if (this.mode !== 'creative' || this.state !== 'playing') return;
    const p = this.player;
    p.flying = !p.flying;
    if (p.flying) p.vy = 2;
    this.ui.toast(t(p.flying ? 'flyOn' : 'flyOff'));
    $('touch').querySelector('[data-btn="fly"]').classList.toggle('on', p.flying);
  }
  selectSlot(i) {
    this.inv.sel = i;
    this.handDirty = true;
    this.ui.updateHotbar();
    const s = this.inv.slots[i];
    this.ui.showItemName(s ? s.id : 0);
  }
  scrollSlot(d) { this.selectSlot((this.inv.sel + d + 9) % 9); }
  hourOfDay() { return (this.time * 24 + 6) % 24; }
  updateWeather(dt) {
    const wt = this.weather;
    wt.timer -= dt;
    if (wt.timer <= 0) {
      if (wt.target > 0) { wt.target = 0; wt.timer = 420 + Math.random() * 720; }
      else { wt.target = 0.55 + Math.random() * 0.45; wt.timer = 120 + Math.random() * 240; }
    }
    wt.rain += clamp(wt.target - wt.rain, -dt * 0.035, dt * 0.035);
  }
  setTimeOfDay(h) { this.time = (((h - 6) / 24) % 1 + 1) % 1; }

  /* ---------- inventory ---------- */
  addItem(id, n) {
    const s = this.inv.slots;
    for (let i = 0; i < 36 && n > 0; i++) if (s[i] && s[i].id === id && s[i].n < 64) { const m = Math.min(64 - s[i].n, n); s[i].n += m; n -= m; }
    for (let i = 0; i < 36 && n > 0; i++) if (!s[i]) { const m = Math.min(64, n); s[i] = { id, n: m }; n -= m; }
    this.ui.updateHotbar();
    this.handDirty = true;
    return n;
  }
  countItem(id) { let c = 0; for (const s of this.inv.slots) if (s && s.id === id) c += s.n; return c; }
  removeItem(id, n) {
    const s = this.inv.slots;
    for (let i = 35; i >= 0 && n > 0; i--) if (s[i] && s[i].id === id) { const m = Math.min(s[i].n, n); s[i].n -= m; n -= m; if (!s[i].n) s[i] = null; }
    return n === 0;
  }
  canCraft(r) {
    for (const [ids, n] of r.need) if (ids.reduce((a, id) => a + this.countItem(id), 0) < n) return false;
    const out = r.out[0];
    return this.inv.slots.some((s) => !s || (s.id === out && s.n + r.out[1] <= 64));
  }
  craft(r) {
    if (!this.canCraft(r)) return false;
    for (const [ids, n] of r.need) {
      let left = n;
      for (const id of ids) { const take = Math.min(left, this.countItem(id)); if (take) { this.removeItem(id, take); left -= take; } }
    }
    this.addItem(r.out[0], r.out[1]);
    this.sound.pop();
    this.ui.toast(`${t('crafted')}: ${itemName(r.out[0], LANG)} ×${r.out[1]}`);
    return true;
  }
  consumeSelected() {
    if (this.mode !== 'survival') return;
    const s = this.inv.slots[this.inv.sel];
    if (!s) return;
    s.n--;
    if (s.n <= 0) this.inv.slots[this.inv.sel] = null;
    this.ui.updateHotbar();
    this.handDirty = true;
  }

  /* ---------- interaction ---------- */
  swing() { this.swingT = 1e-4; }
  breakBlock(h) {
    const w = this.world, id = w.getBlock(h.x, h.y, h.z);
    if (!id || LIQUID[id] || (id === B.bedrock && this.mode === 'survival')) return;
    w.setBlock(h.x, h.y, h.z, 0);
    this.particles.blockBurst(h.x, h.y, h.z, id, w.getLight(h.x, h.y, h.z) / 15);
    this.sound.dig(id);
    this.swing();
    if (this.mode === 'survival') {
      const drop = BLOCKS[id].drop;
      if (drop) {
        if (this.addItem(drop, 1) > 0) this.ui.toast(t('full'));
        else { this.sound.pop(); this.ui.showItemName(drop); }
      }
    }
  }
  useItem(hit) {
    const held = this.inv.slots[this.inv.sel], p = this.player, w = this.world;
    if (!held) return false;
    const item = ITEMS[held.id];
    if (item && item.food) {
      if (this.mode !== 'survival' || p.health >= 20) return false;
      p.health = Math.min(20, p.health + item.food);
      this.consumeSelected();
      this.sound.eat(); this.swing();
      this.ui.toast(`${t('ate')}: ${itemName(held.id, LANG)}`);
      return true;
    }
    if (!isBlock(held.id) || !hit) return false;
    const hb = BLOCKS[hit.id];
    let tx = hit.x + hit.nx, ty = hit.y + hit.ny, tz = hit.z + hit.nz;
    if (hb.render === RENDER.CROSS && held.id !== hit.id) { tx = hit.x; ty = hit.y; tz = hit.z; }
    if (ty < 0 || ty >= CH) return false;
    const cur = w.getBlock(tx, ty, tz);
    if (cur !== 0 && !LIQUID[cur] && RENDERT[cur] !== RENDER.CROSS) return false;
    const d = BLOCKS[held.id];
    if (d.support && !SOLID[w.getBlock(tx, ty - 1, tz)]) return false;
    if (d.solid) {
      if (tx + 1 > p.x - p.hw && tx < p.x + p.hw && ty + 1 > p.y && ty < p.y + p.h && tz + 1 > p.z - p.hw && tz < p.z + p.hw) return false;
      if (this.mobs.blocks(tx, ty, tz)) return false;
    }
    if (!w.setBlock(tx, ty, tz, held.id)) return false;
    this.sound.place(held.id);
    this.swing();
    this.consumeSelected();
    return true;
  }
  updateInteraction(dt, ev) {
    const p = this.player, inp = this.input, look = p.look();
    const ex = p.x, ey = p.eyeY(), ez = p.z;
    const reach = this.mode === 'creative' ? 7 : 5;
    const hit = this.world.raycast(ex, ey, ez, look[0], look[1], look[2], reach, (id) => id !== 0 && !LIQUID[id]);
    const mh = this.mobs.raycast(ex, ey, ez, look[0], look[1], look[2], reach);
    const mob = mh && (!hit || mh.dist < hit.dist) ? mh.mob : null;
    this.target = mob ? null : hit;
    this.attackCd -= dt; this.useCd -= dt;
    if (inp.pickPressed && hit && this.mode === 'creative') { this.inv.slots[this.inv.sel] = { id: hit.id, n: 1 }; this.selectSlot(this.inv.sel); }
    if (inp.attack) {
      if (mob) {
        this.breaking = null;
        if (this.attackCd <= 0) {
          mob.hit(this.mode === 'creative' ? 10 : 4, p.x, p.z, ev);
          mob.hitByPlayer = true;
          this.swing();
          this.attackCd = 0.45;
        }
      } else if (hit) {
        if (this.mode === 'creative') {
          this.breaking = null;
          if (this.attackCd <= 0) { this.breakBlock(hit); this.attackCd = 0.22; }
        } else {
          const key = hit.x + ',' + hit.y + ',' + hit.z, hard = BLOCKS[hit.id].hardness;
          if (!this.breaking || this.breaking.key !== key) this.breaking = { key, t: 0, tick: 0 };
          if (isFinite(hard) && this.attackCd <= 0) {
            this.breaking.t += dt / Math.max(0.05, hard);
            this.breaking.tick -= dt;
            if (this.breaking.tick <= 0) {
              this.breaking.tick = 0.24;
              this.sound.hitTick(hit.id); this.swing();
              this.particles.blockBurst(hit.x, hit.y, hit.z, hit.id, this.world.getLight(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz) / 15, 3);
            }
            if (this.breaking.t >= 1) { this.breakBlock(hit); this.breaking = null; this.attackCd = 0.12; }
          }
        }
      } else { this.breaking = null; if (inp.attackPressed) this.swing(); }
    } else this.breaking = null;
    if (inp.usePressed || (inp.use && this.useCd <= 0)) {
      if (this.useItem(hit)) this.useCd = 0.25;
      else if (inp.usePressed) this.useCd = 0.25;
    }
  }

  handleEvents(ev) {
    const p = this.player;
    for (const e of ev) {
      switch (e.type) {
        case 'hurt': this.sound.hurt(); break;
        case 'death':
          this.state = 'dead';
          this.input.reset(); this.input.releaseLock();
          this.ui.screen('death');
          break;
        case 'step': this.sound.step(e.block); break;
        case 'land': this.sound.step(e.block); this.sound.step(e.block); break;
        case 'splash':
          this.sound.splash();
          this.particles.blockBurst(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z), B.water, 1, 14);
          break;
        case 'mob': this.sound.mob(e.mob, e.dist, e.hurt); break;
        case 'smoke': this.particles.puff(e.x, e.y, e.z, 4, 0.35, 1); break;
        case 'mobdeath': {
          const m = e.mob;
          this.particles.puff(m.x, m.y + m.h * 0.4, m.z, 14, 0.9, this.world.getLight(Math.floor(m.x), Math.floor(m.y + 1), Math.floor(m.z)) / 15);
          if (m.hitByPlayer && this.mode === 'survival' && m.def.drop) {
            const [id, a, b] = m.def.drop, n = a + Math.floor(Math.random() * (b - a + 1));
            if (this.addItem(id, n) === 0) { this.sound.pop(); this.ui.toast(`+${n} ${itemName(id, LANG)}`); }
          }
          break;
        }
      }
    }
  }

  /* ---------- loop ---------- */
  loop(now) {
    requestAnimationFrame((t2) => this.loop(t2));
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000 || 0.016));
    this.last = now;
    this.clock += dt;
    this.fps += (1 / dt - this.fps) * 0.05;
    const ev = [];
    const p = this.player, w = this.world;
    const inp = this.input.poll();
    let cam;
    if (this.state === 'menu') {
      this.orbit += dt * 0.035;
      this.time = (this.time + dt / DAY_SECONDS) % 1;
      const sx = this.spawn[0], sy = this.spawn[1], sz = this.spawn[2], r = 34;
      const yaw = this.orbit;
      const cx = sx + Math.sin(yaw) * r, cz = sz + Math.cos(yaw) * r;
      let ground = SEA;
      for (let k = 0; k <= 4; k++) ground = Math.max(ground, w.gen.height(lerp(cx, sx, k / 4), lerp(cz, sz, k / 4)));
      const wantY = Math.max(sy + 14, ground + 12);
      this.menuY = this.menuY === undefined ? wantY : this.menuY + (wantY - this.menuY) * Math.min(1, dt * 0.8);
      const cy = this.menuY;
      const pitch = -Math.atan2(cy - sy, r) * 0.8;
      cam = { x: cx, y: cy, z: cz, yaw, pitch, fov: 70 };
      w.tick(sx, sz, 8, this.mesher);
    } else {
      const playing = this.state === 'playing';
      if (playing || this.state === 'inventory') this.time = (this.time + dt / DAY_SECONDS) % 1;
      const budget = this.state === 'loading' ? 24 : this.quality.budget;
      const done = w.tick(p.x, p.z, budget, this.mesher);
      if (this.state === 'loading') {
        const pcx = Math.floor(p.x / CS), pcz = Math.floor(p.z / CS);
        let ready = 0, total = 0;
        for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { total++; const c = w.getChunk(pcx + dx, pcz + dz); if (c && c.meshed) ready++; }
        $('loadFill').style.width = Math.round(ready / total * 100) + '%';
        if (ready === total || done) this.finishLoading();
      }
      if (playing) {
        const sens = 0.0022 * this.settings.sens;
        p.yaw -= this.input.lookDX * sens;
        p.pitch = clamp(p.pitch - this.input.lookDY * sens, -1.55, 1.55);
        inp.autoJump = this.settings.autoJump;
        const chunkReady = w.isLoadedAt(Math.floor(p.x), Math.floor(p.z));
        if (chunkReady) p.update(dt, inp, w, this.mode === 'survival', ev);
        this.updateInteraction(dt, ev);
        if (this.handDirty) { const s = this.inv.slots[this.inv.sel]; this.renderer.setHandItem(s ? s.id : 0, this.mesher); this.handDirty = false; }
        this.saveTimer += dt;
        if (this.saveTimer > 30) { this.saveTimer = 0; this.save(); }
      }
      const night = skyState(this.time).elevation < -0.05;
      if (this.state !== 'loading' && this.state !== 'dead') this.mobs.update(playing ? dt : 0, w, p, this.mode === 'survival', night, ev, playing);
      if (this.swingT > 0) { this.swingT += dt * 3.2; if (this.swingT >= 1) this.swingT = 0; }
      const bobOn = this.settings.bob && !p.flying;
      const bx = bobOn ? Math.sin(p.bobPhase) * 0.045 * p.bobAmt : 0, by = bobOn ? -Math.abs(Math.cos(p.bobPhase)) * 0.06 * p.bobAmt : 0;
      const targetFov = this.settings.fov * (p.sprinting ? (p.flying ? 1.15 : 1.1) : 1);
      this.fovCur += (targetFov - this.fovCur) * Math.min(1, dt * 8);
      cam = { x: p.x + Math.cos(p.yaw) * bx, y: p.eyeY() + by, z: p.z - Math.sin(p.yaw) * bx, yaw: p.yaw, pitch: p.pitch, fov: this.fovCur };
      this.handBob = { x: bx * 0.6, y: by * 0.8 };
    }
    if (this.state === 'menu' || this.state === 'playing' || this.state === 'inventory') this.updateWeather(dt);
    w.tickFluids(dt);
    this.particles.update(dt, w);
    this.handleEvents(ev);

    const camBlock = w.getBlock(Math.floor(cam.x), Math.floor(cam.y), Math.floor(cam.z));
    this.cameraUnderwater = camBlock === B.water && (this.state !== 'menu');
    const biome = w.biomeAt(Math.floor(cam.x), Math.floor(cam.z));
    const snow = biome === BIOME.SNOWY || biome === BIOME.FROZEN_OCEAN || (biome === BIOME.MOUNTAINS && cam.y > 92);
    const localRain = biome === BIOME.DESERT ? 0 : this.weather.rain;
    this.precip.update(dt, cam, w, smoothstep(0.05, 0.6, localRain), snow);
    const sky = skyState(this.time, this.weather.rain);
    const boxes = [];
    for (const m of this.mobs.list) if (Math.hypot(m.x - cam.x, m.z - cam.z) < w.renderDist * CS) m.boxes(w, boxes);
    const playingView = this.state === 'playing' || this.state === 'inventory' || this.state === 'paused';
    const eyeLight = w.getLight(Math.floor(cam.x), Math.floor(cam.y), Math.floor(cam.z)) / 15;
    this.renderer.render({
      sky, cam, world: w, quality: this.quality, clock: this.clock, wind: 1 + this.weather.rain * 0.8, haze: 0.0011 + this.weather.rain * 0.0032,
      wet: snow ? 0 : localRain, precip: this.precip,
      underwater: this.cameraUnderwater, minLight: 0.003 + this.settings.bright * 0.03, brightnessExp: 0.85 + this.settings.bright * 0.35,
      boxes, particles: this.particles.list,
      highlight: playingView && this.target ? { x: this.target.x, y: this.target.y, z: this.target.z, progress: this.breaking ? this.breaking.t : 0 } : null,
      hand: playingView && this.state !== 'dead' ? { id: this.renderer.handId, swing: this.swingT, bobX: this.handBob.x, bobY: this.handBob.y, lower: 0, sky: Math.max(0.12, eyeLight) } : null,
    });
    if (this.state !== 'menu') {
      this.ui.updateHud(dt);
      const outdoor = smoothstep(8, 14, w.getLight(Math.floor(cam.x), Math.floor(cam.y), Math.floor(cam.z)));
      this.sound.ambience(dt, { day: sky.day, night: sky.night, outdoor, underwater: this.cameraUnderwater, alt: cam.y, rain: snow ? 0 : localRain });
    }
    this.input.endFrame();
  }
}

function boot(data) {
  const game = new Game(data && data.save ? data : null);
  window.blockrealm = game;
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => ({ save: game.started ? game.save() : game.lastSave || null }));
}
(function start() {
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.ready === 'function') hot.ready(boot);
  else boot((hot && hot.data) || {});
})();

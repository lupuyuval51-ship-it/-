import * as THREE from '../vendor/three.module.min.js';
import { CITY, TIME, TRAFFIC, WEAPONS } from './config.js';
import { World } from './world.js';
import { Sky } from './sky.js';
import { Effects } from './fx.js';
import { AudioSys } from './audio.js';
import { Input } from './input.js';
import { HUD } from './hud.js';
import { UI } from './ui.js';
import { Police } from './police.js';
import { Traffic } from './traffic.js';
import { Missions } from './missions.js';
import { Jobs } from './jobs.js';
import { Pickups } from './combat.js';
import { Player } from './player.js';
import { Vehicle, collideVehicles } from './vehicle.js';
import { Ped } from './peds.js';
import { T, L } from './i18n.js';
import { mulberry, dist, clamp, pick, fmtMoney } from './utils.js';
import { CAR_COLORS, OUTFITS, VEHICLES } from './config.js';
import { Post } from './post.js';
import { EnvMap } from './env.js';
import { SkidMarks } from './decals.js';
import { setHeadlightPools } from './vehicle.js';
import { Grenades } from './combat.js';
import { LOOKS, setCharacterQuality } from './character.js';

const STATIONS = ['off', 'neon', 'bass', 'club'];
const SAVE_KEY = 'neoncoast.save', SET_KEY = 'neoncoast.settings';
const HALF = CITY.road / 2;
const SHOP_TYPES = { guns: 'guns', dealer: 'cars', spray: 'spray', hospital: 'hospital', safehouse: 'safehouse', burger: 'burger', clothes: 'clothes', casino: 'casino' };
const SHOP_RING = new THREE.RingGeometry(1.5, 1.7, 40).rotateX(-Math.PI / 2); // a shop's marker lies flat on the pavement; the mission drum would stand across the door
const _tmp = [];
// drawing-buffer pixel budget of the 3D pass per quality tier; the canvas keeps its full size and FXAA upsamples
const RES_CAP = { high: 3.7e6, med: 2.1e6, low: 1.0e6 };
// time-of-day grade (Post: lift, gain, saturation), blended by sun height and night
const GRADE = { noon: new THREE.Vector3(1.02, 1.0, 0.97), gold: new THREE.Vector3(1.10, 0.98, 0.86), lift: new THREE.Vector3(0.006, 0.008, 0.02) };
const ss = THREE.MathUtils.smoothstep;
const PED_BUBBLE = { hiddenMin: 16, hiddenMax: 110, visibleMin: 55, despawnHidden: 140, despawnHard: 220, popMin: 15, popMax: 150, nightCut: 0.45, quietRadius: 60, dayBoost: 1.3, nearRadius: 70 };
const pb = k => TRAFFIC.pedBubble?.[k] ?? PED_BUBBLE[k];
// scratch objects: nothing below is allocated per frame
const _fwd = new THREE.Vector3(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere(), _amb = new THREE.Color(), _spot = { x: 0, z: 0, area: null }, _vpt = { x: 0, z: 0 };
const _lampD = new Float32Array(4), _lampP = [null, null, null, null];
const _ambience = { x: 0, z: 0, night: 0, rain: 0, inCar: false, cars: 0, park: NaN, rightX: 1, quality: 'high' };

export class Game {
  constructor(canvas) {
    this.canvas = canvas; let saved = {}; try { saved = JSON.parse(localStorage.getItem(SET_KEY) || '{}'); } catch {}
    this.settings = Object.assign({ quality: 'high', volume: 0.8, sensitivity: 1, lang: L.code }, saved);
    // Phones and tablets start on the low tier (one render pass, no shadows, pixel ratio 1): the high tier is a desktop GPU budget and loses the context or crawls on a phone. The player's own pick in the settings (qualityUser) is always respected.
    const phone = !!((window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900));
    if (phone && !this.settings.qualityUser) this.settings.quality = 'low';
    const q = this.settings.quality; setCharacterQuality(q);
    // Post renders the scene into its own targets (with their own depth); only the FXAA quad reaches the canvas, so the canvas needs no MSAA, depth or stencil
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.NoToneMapping; this.renderer.shadowMap.enabled = q !== 'low'; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q === 'high' ? 2 : q === 'med' ? 1.5 : 1));
    this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.3, 2200);
    this.post = new Post(this.renderer, q);
    this.input = new Input(canvas); this.audio = new AudioSys(); this.audio.volume = this.settings.volume; this.audio.quality = q; this.hud = new HUD(this);
    this.vehicles = []; this.peds = []; this.time = 0; this.clock = TIME.start; this.weather = 'clear'; this.station = 'off'; this.money = 0; this.stats = { kills: 0, carsStolen: 0, distance: 0, playtime: 0, tokens: 0 }; this.collected = new Set();
    this.state = 'title'; this.timeScale = 1; this.godMode = false; this.interactPrompt = null; this.missionPrompt = null; this.weatherT = 150; this.lampT = 0; this.pedSpawnT = 0; this.titleAng = 0; this.built = false; this.hitStopT = 0; this.bustLevel = 0; this.parkT = 0; this.parkDist = NaN; this.indoorK = 0; this.inShopId = null;
    this._active = []; this._near = []; this._focus = new THREE.Vector3(); this._frustum = new THREE.Frustum(); this._sz = new THREE.Vector2();
    this.ui = new UI(this);
    addEventListener('resize', () => this.resize()); this.resize();
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
    // the 3D pass renders at most RES_CAP pixels (s0 < 1 on big screens); the canvas buffer stays at full size
    const sz = this.renderer.getDrawingBufferSize(this._sz), cap = RES_CAP[this.settings.quality] ?? RES_CAP.high, s0 = Math.min(1, Math.sqrt(cap / Math.max(1, sz.x * sz.y)));
    this.post?.setSize(Math.max(1, Math.round(sz.x * s0)), Math.max(1, Math.round(sz.y * s0)));
  }
  get uiOpen() { return this.state !== 'playing' && this.state !== 'dead'; }
  cameraForward() { const P = this.player; return { x: Math.sin(P.camYaw), z: Math.cos(P.camYaw) }; }
  boot() {
    this.ui.setLoading(true);
    const tick = () => new Promise(r => setTimeout(r, 0)); // lets the browser paint the progress and stay responsive between build steps
    requestAnimationFrame(() => setTimeout(async () => {
      try {
        const steps = this.buildWorldSteps(); let r; while (!(r = steps.next()).done) { this.ui.setProgress(r.value); await tick(); }
        this.ui.setProgress(0.96, 'shaders'); await tick(); await this.prewarmAsync(); this.built = true;
      } catch (e) { console.error(e); window.dispatchEvent(new ErrorEvent('error', { message: String((e && e.message) || e) })); return; }
      this.ui.setLoading(false); this.ui.show('title'); this.last = performance.now(); this.loop();
    }, 40));
  }

  buildWorld() { for (const _ of this.buildWorldSteps()); this.prewarm(); this.built = true; } // synchronous variant
  *buildWorldSteps() {
    const q = this.settings.quality;
    this.world = new World(this.scene, q, true); for (const f of this.world.buildSteps()) yield 0.9 * f; this.grid = this.world.grid; this.sky = new Sky(this.scene, this.renderer, q); this.fx = new Effects(this.scene);
    this.env = new EnvMap(this.renderer, this.scene); this.skids = new SkidMarks(this.scene); this.grenades = new Grenades(this);
    this.police = new Police(this); this.traffic = new Traffic(this); this.missions = new Missions(this); this.pickups = new Pickups(this); this.ownedOutfits = new Set(['street']); this.outfit = 'street';
    const sh = this.world.pois.safehouse; this.player = new Player(this, sh.x + 4, sh.z - 0.5);
    this.missions.init(); this.jobs = new Jobs(this); this.jobs.init(); this.world.shops.attach(this); // the repeatable jobs and the shop keepers exist before the prewarm compiles their shaders
    // shop markers
    this.shopMarkers = []; for (const id in this.world.pois) { const p = this.world.pois[id]; if (!SHOP_TYPES[p.type]) continue; const m = this.missions.makeMarker(p.x, p.z, parseInt(p.color.slice(1), 16), false); const ring = m.mesh.children[0]; ring.geometry = SHOP_RING; ring.position.y = 0.17; ring.material.opacity = 0.42; ring.material.side = THREE.FrontSide; this.shopMarkers.push({ id, ...p, mesh: m.mesh }); }
    for (const id in this.world.pois) { const p = this.world.pois[id]; if (p.type === 'police') this.setupStation(p); }
    // lamp light pool + headlights
    this.lampLights = []; for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffd9a0, 0, 30, 2); l.userData.on = 0; this.scene.add(l); this.lampLights.push(l); }
    this.fill = new THREE.PointLight(0xdfe6ff, 0, 9, 2); this.scene.add(this.fill);
    this.headlights = []; for (let i = 0; i < 2; i++) { const s = new THREE.SpotLight(0xfff4d6, 0, 70, 0.55, 0.6, 1.3); this.scene.add(s); this.scene.add(s.target); this.headlights.push(s); }
    // The helicopter's searchlight exists from boot (intensity 0, parked at the origin) so the light count of every lit material never changes during play; Police parents it to the helicopter.
    this.heliSpot = new THREE.SpotLight(0xfff4d0, 0, 90, 0.32, 0.5, 1.2); this.scene.add(this.heliSpot); this.scene.add(this.heliSpot.target);
    this.traffic.init(); this.resetPickups(); this.built = true;
    this.camera.position.set(120, 70, 120); this.camera.lookAt(0, 20, 0);
  }
  // Compiles every shader the session can need under the loading screen: one vehicle of each type stands off-screen, objects hidden by day (night pools, lamp cones, rain, lamp
  // pools of cars) are shown for the compile, then everything is put back and the vehicles are disposed. The light count is constant, so nothing recompiles during play.
  prewarmSetup(s) {
    // The environment map must exist before compiling: it is part of every lit program's key.
    const env = this.sky.update(0, 18.45, this.camera.position, this.camera); this.applyEnv(env, 18.45);
    let k = 0; for (const type in VEHICLES) { const v = new Vehicle(type, 0x808080, CITY.minX - 80 - 9 * k++, CITY.minZ - 80, 0); this.scene.add(v.mesh); s.cars.push(v); }
    this.scene.traverse(o => { if (!o.visible && !o.isLight) s.hid.push(o); });
    for (const o of s.hid) o.visible = true;
  }
  prewarmRestore(s) { for (const o of s.hid) o.visible = false; for (const v of s.cars) { this.scene.remove(v.mesh); v.dispose(); } }
  prewarm() { const s = { hid: [], cars: [] }; try { this.prewarmSetup(s); this.renderer.compile(this.scene, this.camera); } catch (e) { console.warn('shader prewarm failed', e); } this.prewarmRestore(s); }
  // Same compile for the boot: compileAsync links the programs in parallel and without blocking the page (KHR_parallel_shader_compile), so the loading screen keeps painting while a phone's GPU driver works.
  async prewarmAsync() { const s = { hid: [], cars: [] }; try { this.prewarmSetup(s); if (this.renderer.extensions.has('KHR_parallel_shader_compile')) await this.renderer.compileAsync(this.scene, this.camera); else this.renderer.compile(this.scene, this.camera); } catch (e) { console.warn('shader prewarm failed', e); } this.prewarmRestore(s); }
  setupStation(p) {
    this.stations = this.stations || [];
    const st = { p, peds: [], cars: [] }; this.stations.push(st);
    for (const dx of [-3, 3]) st.peds.push({ dx, ped: this.addPed(new Ped(this, { kind: 'armed', team: 'cop', look: LOOKS.cop, x: p.x + dx, z: p.z, yaw: Math.PI, hp: 100, weapon: 'pistol', accuracy: 0.5, noDespawn: true, station: true })) });
    for (const dx of [10, 17]) st.cars.push({ x: p.x + dx, z: p.blockZ0 - 1.75, v: this.spawnStationCar(p.x + dx, p.blockZ0 - 1.75) });
  }
  // Station officers and cruisers come back after death, load or a new game.
  restoreStations() {
    for (const st of this.stations || []) {
      st.peds = st.peds.filter(s => { if (s.ped.dead || !this.peds.includes(s.ped)) { if (this.peds.includes(s.ped)) this.removePed(s.ped); return false; } return true; });
      for (const dx of [-3, 3]) if (!st.peds.some(s => s.dx === dx)) st.peds.push({ dx, ped: this.addPed(new Ped(this, { kind: 'armed', team: 'cop', look: LOOKS.cop, x: st.p.x + dx, z: st.p.z, yaw: Math.PI, hp: 100, weapon: 'pistol', accuracy: 0.5, noDespawn: true, station: true })) });
      st.cars = st.cars.map(c => (c.v.wrecked || !this.vehicles.includes(c.v)) ? { x: c.x, z: c.z, v: this.spawnStationCar(c.x, c.z) } : c);
    }
  }
  spawnStationCar(x, z) { const v = new Vehicle('police', null, x, z, 0); v.parked = true; this.addVehicle(v); return v; }
  explode(x, y, z, source) {
    this.fx.explosion(x, y, z); this.audio.explosion(dist(x, z, this.player.x, this.player.z)); this.alert(x, z, 40, 'death');
    for (const p of this.peds) if (!p.dead && dist(p.x, p.z, x, z) < 7) { p.hp = 0; p.launch((p.x - x) * 1.5, 6, (p.z - z) * 1.5); p.die(0, 0, source === 'player' ? 'player' : 'explosion'); }
    const P = this.player; if (!P.dead && dist(P.x, P.z, x, z) < 7 && !P.vehicle) P.damage(70, x, z); else if (P.vehicle && dist(P.x, P.z, x, z) < 7) { P.vehicle.damage(60, 'explosion'); P.damage(25, x, z); }
    for (const o of this.vehicles) if (!o.wrecked && dist(o.x, o.z, x, z) < 7.5 && Math.abs(o.x - x) + Math.abs(o.z - z) > 0.01) { if (source === 'player') o.playerHitT = this.time; o.damage(55, 'explosion'); }
    if (source === 'player') this.police.reportCrime('explosion', x, z);
  }
  applyOutfit(id) { const o = OUTFITS.find(o => o.id === id) || OUTFITS[0]; this.outfit = o.id; this.player.setLook({ ...LOOKS.player, ...o.look }); }
  tokenSpots() {
    const W = this.world, rng = mulberry(77), out = [{ x: W.pier.x1 - 4, z: W.pier.z, y: W.pier.y }, { x: W.parks[0].cx + 6, z: W.parks[0].cz + 6 }, { x: W.parks[1].cx - 6, z: W.parks[1].cz - 6 }, { x: CITY.beachX + 36, z: 40 }];
    while (out.length < 20) { const bi = Math.floor(rng() * CITY.gridX), bj = Math.floor(rng() * CITY.gridZ), c = W.sidewalkCorner(bi, bj, rng() < 0.5 ? 0 : 1, rng() < 0.5 ? 0 : 1); if (out.some(o => dist(o.x, o.z, c.x, c.z) < 60)) continue; out.push({ x: c.x, z: c.z }); }
    return out;
  }
  resetPickups() {
    for (const p of [...this.pickups.list]) this.pickups.remove(p);
    this.tokenSpots().forEach((s, i) => { if (!this.collected.has(i)) this.pickups.add({ type: 'token', id: i, ...s }); });
    const sh = this.world.pois.safehouse; if (!this.player.weapons.pistol) this.pickups.add({ type: 'weapon', weapon: 'pistol', amount: 36, x: sh.x + 5, z: sh.z + 1 });
    const h = this.world.pois.hospital; this.pickups.add({ type: 'health', x: h.x - 5, z: h.z + 1, onCollect: () => { this.healthRespawn = this.time + 90; } });
  }
  // ---------- lifecycle ----------
  // Every state change goes through here: the menu muffle of the audio follows the state, and a finger left on the touch controls is let go.
  setState(s) {
    this.state = s; const a = this.audio;
    if (a) { a.setMenu(s === 'paused' || s === 'map' || s === 'shop' || s === 'title'); a.shouldRun = s !== 'title'; }
    if (s !== 'playing' && s !== 'dead') this.input?.resetTouch();
    this.syncTouch();
  }
  startNew() {
    this.audio.shouldRun = true; this.audio.init(); this.money = 500; this.clock = TIME.start; this.time = 0; this.stats = { kills: 0, carsStolen: 0, distance: 0, playtime: 0, tokens: 0 }; this.collected = new Set(); this.weather = 'clear'; this.sky.setWeather('clear'); this.weatherT = 150; this.station = 'off'; this.audio.setStation('off');
    this.healthRespawn = 0; this.hitStopT = 0; this.bustLevel = 0; if (this.missions.active) this.missions.fail(); this.missions.resetProgress(); this.jobs.reset(); this.clearDynamic();
    const sh = this.world.pois.safehouse; this.player.weapons = { fist: { ammo: Infinity, clip: 0 } }; this.player.weaponIds = ['fist']; this.ownedOutfits = new Set(['street']); this.applyOutfit('street'); this.player.select('fist'); this.player.armor = 0; this.player.respawn(sh.x + 4, sh.z - 0.5); this.player.camYaw = Math.PI; this.resetPickups(); this.restoreStations(); this.populate();
    this.play(); this.hud.notify(T.hint.first, 'obj', 9); setTimeout(() => this.hud.notify(T.hint.stealCar, 'dim', 7), 4000);
  }
  continueGame() { this.audio.shouldRun = true; this.audio.init(); if (this.loadGame()) this.play(); }
  // The full-screen touch layer is only present while the game is played; in menus, shop, map and title it would swallow every tap.
  syncTouch() { const t = document.getElementById('touch'); if (t) t.hidden = !this.input?.isTouch || !(this.state === 'playing' || this.state === 'dead'); }
  play() { this.setState('playing'); this.ui.hideAll(); this.hud.show(true); this.input.enabled = true; this.input.requestLock(); this.syncTouch(); this.last = performance.now(); }
  pause() { if (this.state !== 'playing') return; this.setState('paused'); this.ui.show('pause'); this.input.releaseLock(); }
  resume() { if (this.state === 'title') return; this.setState('playing'); this.ui.hideAll(); this.input.requestLock(); this.syncTouch(); this.last = performance.now(); }
  toTitle() { this.saveGame(true); this.setState('title'); this.ui.hideAll(); this.ui.applyLanguage(); this.ui.show('title'); this.hud.show(false); this.input.enabled = false; this.input.releaseLock(); this.audio.setStation('off'); }
  clearDynamic() {
    for (const v of [...this.vehicles]) if (!v.parked || v.wrecked) this.removeVehicle(v); for (const p of [...this.peds]) if (!p.station) this.removePed(p); for (const p of this.peds) { p.hostile = false; p.hp = p.maxHp; } this.police.clear(); this.fx.fires.length = 0; this.missions.clearMarkers(); this.grenades.clear();
  }
  // ---------- save / load ----------
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
  saveSettings() { try { localStorage.setItem(SET_KEY, JSON.stringify(this.settings)); } catch {} }
  saveGame(silent = false) {
    if (!this.built) return; const s = { v: 1, money: this.money, clock: this.clock, weather: this.weather, station: this.station, stats: this.stats, collected: [...this.collected], player: this.player.save(), missions: this.missions.save(), jobs: this.jobs.save(), outfit: this.outfit, outfits: [...this.ownedOutfits], t: Date.now() };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); if (!silent) this.hud.notify(T.saved, 'cash'); } catch (e) { this.hud.notify(T.saveFailed, 'warn'); }
    this.ui.applyLanguage();
  }
  loadGame() {
    let s; try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch {} if (!s) { this.hud.notify(T.noSave, 'warn'); return false; }
    if (this.missions.active) this.missions.fail(); this.clearDynamic();
    this.money = s.money; this.clock = s.clock; this.weather = s.weather || 'clear'; this.sky.setWeather(this.weather); this.station = s.station || 'off'; this.audio.setStation(this.station); this.stats = Object.assign({ kills: 0, carsStolen: 0, distance: 0, playtime: 0, tokens: 0 }, s.stats); this.collected = new Set(s.collected || []);
    this.missions.load(s.missions || {}); this.jobs.load(s.jobs ?? s.missions?.jobs ?? null); this.player.load(s.player); this.ownedOutfits = new Set(s.outfits || ['street']); this.applyOutfit(s.outfit || 'street'); this.player.dead = false; this.player.vehicle = null; this.player.mesh.visible = true; this.player.camYaw = Math.PI; this.resetPickups(); this.restoreStations(); this.hitStopT = 0; this.populate(); this.hud.notify(T.loaded, 'cash'); return true;
  }
  sleep() { this.clock = 7 * 60; this.player.health = 100; this.weather = 'clear'; this.sky.setWeather('clear'); this.saveGame(true); this.hud.notify(T.sleepDone, 'cash'); }
  setQuality(q) {
    this.settings.quality = q; this.saveSettings(); setCharacterQuality(q); this.audio.quality = q; this.world.setQuality(q); this.sky.setQuality(q); const on = q !== 'low'; this.renderer.shadowMap.enabled = on; this.sky.sun.castShadow = on; const size = q === 'high' ? 2048 : 1024;
    if (this.sky.sun.shadow.mapSize.x !== size) { this.sky.sun.shadow.mapSize.set(size, size); if (this.sky.sun.shadow.map) { this.sky.sun.shadow.map.dispose(); this.sky.sun.shadow.map = null; } }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q === 'high' ? 2 : q === 'med' ? 1.5 : 1)); this.post.setQuality(q); this.resize(); this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  }
  setVolume(v) { this.settings.volume = v; this.audio.setVolume(v); this.saveSettings(); }
  // ---------- entity management ----------
  addVehicle(v) { this.vehicles.push(v); this.scene.add(v.mesh); v.onWreck = w => this.onWreck(w); v.hit = (o, imp) => this.onCarHit(v, o, imp); v.updateGround(this.world, 0); v.syncMesh(0); return v; }
  removeVehicle(v) { const i = this.vehicles.indexOf(v); if (i >= 0) this.vehicles.splice(i, 1); this.scene.remove(v.mesh); v.dispose(); if (this.player.vehicle === v) this.player.exitVehicle(); }
  addPed(p) { this.peds.push(p); return p; }
  removePed(p) { const i = this.peds.indexOf(p); if (i >= 0) this.peds.splice(i, 1); p.dispose(); }
  addPickup(o) { return this.pickups.add(o); }
  // a payment at a shop till (not a casino bet) rings the till
  addMoney(n) { this.money = Math.max(0, this.money + n); this.hud.moneyDelta(n); if (n < 0 && this.state === 'shop' && this.ui?.shopType !== 'casino') this.audio.register(); }
  alert(x, z, r, type, src) { for (const p of this.peds) p.scare(x, z, r); if (type === 'gunfire' || type === 'death') for (const v of this.vehicles) if (v.ai && v.ai.mode === 'traffic' && dist(v.x, v.z, x, z) < r) v.ai.panic = 6; }
  nextStation() { const i = STATIONS.indexOf(this.station); this.station = STATIONS[(i + 1) % STATIONS.length]; this.audio.setStation(this.station); this.hud.radio(this.station); }
  deliverCar(type) { const d = this.world.pois.dealer; let x = d.x + 12; const z = d.blockZ0 - 1.75; for (let k = 0; k < 6; k++) { if (!this.vehicles.some(v => dist(v.x, v.z, x, z) < 5.5)) break; x += 6; } const v = new Vehicle(type, pick(CAR_COLORS), x, z, 0); v.parked = true; this.addVehicle(v); }
  onWreck(v) {
    const P = this.player; const byPlayer = v.driver === P || (v.playerHitT !== undefined && this.time - v.playerHitT < 10);
    if (P.vehicle === v) P.damage(500, v.x, v.z);
    this.explode(v.x, 0.3, v.z, byPlayer ? 'player' : 'car');
  }
  onCarHit(v, other, impact) { if (v.driver === this.player) this.player.shake = Math.min(1, (this.player.shake || 0) + impact / 16); if (other.driver === this.player) { v.playerHitT = this.time; if ((v.type === 'police' || v.type === 'swat') && impact > 4) this.police.reportCrime('hitcop', v.x, v.z); if (impact > 5 && v.ai && v.ai.mode === 'traffic') v.ai.panic = 5; } }
  // ---------- death / arrest ----------
  wasted() { if (this.state === 'dead') return; this.setState('dead'); this.deadKind = 'wasted'; this.hud.overlay('wasted'); this.timeScale = 0.35; this.audio.engine(false); this.audio.failed(); if (this.missions.active) this.missions.fail(); setTimeout(() => this.respawn('hospital'), 4800); }
  bust() { if (this.state === 'dead' || this.player.dead) return; this.bustLevel = this.police.level; this.setState('dead'); this.deadKind = 'busted'; const P = this.player; if (P.vehicle) P.exitVehicle(); P.kill(P.hitX || 0, P.hitZ || 0); this.hud.overlay('busted'); this.timeScale = 0.35; this.audio.engine(false); this.audio.wanted(); if (this.missions.active) this.missions.fail(); setTimeout(() => this.respawn('police'), 4800); }
  // Back on their feet at the nearest hospital (wasted) or police station (busted); the hospital bill and the fine come out of the cash.
  respawn(kind) {
    this.jobs.cancel('dead', true); // a shift ends with the death or the arrest (Jobs.tickActive has already paid out the summary); nothing carries over into the new life
    const P = this.player, hosp = kind === 'hospital', ids = hosp ? ['hospital', 'hospital2'] : ['police', 'police2'];
    let poi = this.world.pois[ids[0]], bd = Infinity; for (const id of ids) { const c = this.world.pois[id]; if (!c) continue; const d = dist(c.x, c.z, P.x, P.z); if (d < bd) { bd = d; poi = c; } }
    const cash = this.money, bill = hosp ? Math.min(4000, 200 + cash * 0.06) : Math.min(6000, 300 * this.bustLevel + cash * 0.08), loss = Math.min(cash, Math.round(bill)); if (loss) this.addMoney(-loss);
    P.respawn(poi.x + 4, poi.z - 0.5); P.armor = 0; P.camYaw = Math.PI; this.police.clear(); for (const p of [...this.peds]) if (p.team && !p.station) this.removePed(p); this.restoreStations();
    this.clock = (this.clock + 360) % 1440; this.populate();
    this.timeScale = 1; this.hitStopT = 0; this.hud.overlay(null); this.setState('playing'); this.missions.onRespawn(); this.hud.notify(hosp ? T.respawnHospital : T.respawnPolice, 'warn', 6);
    if (loss) this.hud.notify(`${hosp ? (T.hospitalBill ?? 'Hospital bill') : (T.bustFine ?? 'Fine')}: ${fmtMoney(loss)}`, 'warn', 6);
    this.bustLevel = 0;
  }
  // ---------- main loop ----------
  loop() {
    requestAnimationFrame(() => this.loop()); const now = performance.now(); let dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now; if (!this.built) return;
    try {
      if (this.state === 'title') { this.titleUpdate(dt); }
      else if (this.state === 'playing' || this.state === 'dead') { this.update(dt * this.timeScale, dt); }
      else { this.menuKeys(); }
      this.post.render(this.scene, this.camera, this.postUniforms());
    } catch (e) { console.error(e); }
    this.input.endFrame();
  }
  titleUpdate(dt) {
    this.titleAng += dt * 0.06; const r = 190; this.camera.position.set(Math.cos(this.titleAng) * r, 62 + Math.sin(this.titleAng * 0.7) * 8, Math.sin(this.titleAng) * r); this.camera.lookAt(0, 26, 0); this.camera.fov = 58; this.camera.updateProjectionMatrix();
    // 18:27, the blue hour: an orange-purple horizon with the windows lit
    const env = this.sky.update(dt, 18.45, this.camera.position, this.camera); this.applyEnv(env, 18.45); this.world.update(dt, performance.now() / 1000); this.fx.update(dt);
  }
  menuKeys() { const I = this.input; if (I.once('Escape') || (this.state === 'map' && I.once('KeyM')) || (this.state === 'shop' && I.once('KeyE'))) this.resume(); }
  postUniforms() {
    const P = this.player, sky = this.sky; const u = this._pu || (this._pu = { sunPos: new THREE.Vector2(), lift: new THREE.Vector3(), gain: new THREE.Vector3(1, 1, 1), sat: 1, vigFloor: 0.66 });
    u.night = this.night || 0; u.rain = this.rainLevel || 0; u.time = this.time;
    this.grayNow = (this.grayNow || 0) + ((this.state === 'dead' ? 1 : 0) - (this.grayNow || 0)) * 0.06; u.gray = this.grayNow;
    u.hurt = this.hud.hurtLevel || 0;
    u.exposure = (sky?.exposure ?? 1); u.strength = 0.26 + u.night * 0.3;
    u.speed = P?.vehicle ? clamp((P.vehicle.speed - 17) / 34, 0, 1) : 0;
    // colour grade: noon is crisp and slightly warm, the golden hour (sun 0..0.15 above the horizon) is orange and richer, night lifts the blacks towards blue; all blends are smoothsteps of the sun height
    const sunY = sky ? sky.sunDir.y : 0.6, day = ss(sunY, -0.08, 0.3), gold = ss(sunY, -0.06, 0.03) * (1 - ss(sunY, 0.08, 0.22)), N = GRADE.noon, G = GRADE.gold;
    u.gain.set((1 + (N.x - 1) * day) * (1 - gold) + G.x * gold, (1 + (N.y - 1) * day) * (1 - gold) + G.y * gold, (1 + (N.z - 1) * day) * (1 - gold) + G.z * gold);
    u.lift.copy(GRADE.lift).multiplyScalar(u.night);
    u.sat = ((1.2 + (1.12 - 1.2) * day) * (1 - gold) + 1.18 * gold) * (1 - 0.15 * u.rain);
    u.vigFloor = 0.78 + (0.66 - 0.78) * ss(u.night, 0.35, 0.65);
    // sun shafts: only when the sun is up, in front of the camera and not hidden by rain
    u.shaftStrength = 0;
    if (sky && sky.sunDir.y > 0.02) {
      const fwd = this._fwd || (this._fwd = new THREE.Vector3()); this.camera.getWorldDirection(fwd);
      const align = fwd.dot(sky.sunDir);
      if (align > 0.1) {
        const v = this._sv || (this._sv = new THREE.Vector3());
        v.copy(this.camera.position).addScaledVector(sky.sunDir, 800).project(this.camera);
        u.sunPos.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
        u.shaftStrength = Math.pow(align, 3) * clamp(sky.sunDir.y * 5, 0, 1) * (1 - u.rain * 0.75) * 0.5;
        u.sunColor = sky.domeMat.uniforms.sunColor.value;
      }
    }
    return u;
  }
  applyEnv(env, hours = this.clock / 60) {
    this.world.setNight(env.night, env.sunDir, env.skyColor, env.fogColor, env.fogNear, env.fogFar, env.sunColor, env.rain, hours);
    // smoke, dust and splashes follow the sky light (authored for daytime, so the hemisphere light is scaled up; a little floor keeps night smoke readable)
    const hm = this.sky.hemi; this.fx.setAmbient(_amb.copy(hm.color).addScalar(0.04), hm.intensity * 1.6);
    this.fx.setFog(env.fogColor, env.fogNear, env.fogFar); this.night = env.night; this.rainLevel = env.rain; this.env.update(env.top, env.horizon, env.sunColor, env.sunDir, env.night); setHeadlightPools(env.night); }
  update(dt, realDt = dt) {
    const I = this.input, P = this.player;
    if (this.hitStopT > 0 && this.state !== 'dead') { this.hitStopT -= realDt; dt *= 0.15; } // a few frames of slow motion on a kill; real time keeps the stop short
    this.time += dt; this.clock = (this.clock + dt * TIME.minutesPerSecond) % 1440; this.stats.playtime += realDt;
    if (this.state === 'playing') { if (I.once('Escape') || I.btnOnce('pause')) { this.pause(); return; } if (I.once('KeyM') || I.btnOnce('map')) { this.setState('map'); this.ui.show('map'); this.input.releaseLock(); return; } }
    // weather
    this.weatherT -= dt; if (this.weatherT <= 0) { this.weatherT = 60; if (this.weather === 'clear' && Math.random() < 0.1) this.weather = 'rain'; else if (this.weather === 'rain' && Math.random() < 0.3) this.weather = 'clear'; this.sky.setWeather(this.weather); }
    // player + interactions
    P.update(dt); this.interactions();
    // AI
    this.traffic.update(dt); this.police.update(dt); this.spawnPeds(dt);
    // vehicle physics in substeps
    const steps = dt > 1 / 50 ? 2 : 1, h = dt / steps; const active = this._active, near = this._near; active.length = 0; near.length = 0; let carsNear = 0;
    for (const v of this.vehicles) { if (!v.parked || v.speed > 0.05 || v.disturbed > 0) active.push(v); const ax = Math.abs(v.x - P.x), az = Math.abs(v.z - P.z); if (ax < 220 && az < 220) { near.push(v); if (ax < 100 && az < 100 && v.speed > 1) carsNear++; } }
    for (let s = 0; s < steps; s++) { for (const v of active) { v.step(h); const imp = v.collideStatic(this.grid, _tmp); if (imp > 4) this.impact(v, imp); } collideVehicles(near); }
    const pier = this.world.pier;
    for (const v of this.vehicles) {
      // per-wheel ground height: suspension, kerbs, lots and the pier ramp (cheap for cars that stand still); a kerb strike thumps and shakes the player's camera
      if (v.updateGround) v.updateGround(this.world, dt); else v.y = (v.x > pier.x0 - 3 && v.x < pier.x1 && Math.abs(v.z - pier.z) < 4.6) ? pier.y : 0;
      if (v.curbHit > 0) { const d = dist(v.x, v.z, P.x, P.z); if (d < 90) this.audio.impact(v.curbHit, d); if (v === P.vehicle) P.shake = Math.min(1, (P.shake || 0) + 0.15); v.curbHit = 0; }
      if (!v.parked || v.speed > 0.05 || v.hazard) v.syncMesh(this.time);
      if (!v.wrecked && v.hp < v.maxHp * 0.35 && Math.random() < 0.35) this.fx.smoke(v.x + v.fx * 1.5, 1.0, v.z + v.fz * 1.5, 1, v.hp < v.maxHp * 0.15 ? 0.1 : 0.4, 0.9);
      if (!v.wrecked && v.hp < v.maxHp * 0.12 && Math.random() < 0.3) this.fx.fire(v.x + v.fx * 1.5, 0.9, v.z + v.fz * 1.5, 1, 0.5);
      if (v.wrecked && !v.parked && v.speed < 0.2) v.parked = true;
      const B = this.world.bounds; v.x = clamp(v.x, B.minX, B.maxX); v.z = clamp(v.z, B.minZ, B.maxZ); if (v.x > CITY.oceanX + 1) { v.vx *= 0.94; v.vz *= 0.94; }
    }
    for (const v of active) { if (v.wrecked) continue; const slipping = (v.slip > 3.2 && v.speed > 4) || (v.input.handbrake && v.speed > 5); const rx = -v.fz, rz = v.fx; for (const side of [-1, 1]) { const id = v.id * 2 + (side > 0 ? 1 : 0); if (slipping) this.skids.mark(id, v.x - v.fx * v.spec.len * 0.32 + rx * side * (v.spec.wid / 2 - 0.12), v.z - v.fz * v.spec.len * 0.32 + rz * side * (v.spec.wid / 2 - 0.12), v.y, 0.3 + Math.min(0.5, v.slip / 12)); else this.skids.forget(id); } }
    if (this.rainLevel > 0.25) {
      const r = this.rainLevel; if (!P.vehicle) for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28, d = 3.5 + Math.random() * 13; this.fx.splash(P.x + Math.cos(a) * d, 0.04, P.z + Math.sin(a) * d, r); }
      const v = P.vehicle; if (v && v.speed > 5) { const rx = -v.fz, rz = v.fx; for (const side of [-1, 1]) this.fx.spray(v.x - v.fx * v.spec.len * 0.32 + rx * side * v.spec.wid * 0.5, v.z - v.fz * v.spec.len * 0.32 + rz * side * v.spec.wid * 0.5, -v.vx * 0.12, -v.vz * 0.12, r * Math.min(1, v.speed / 22)); }
    }
    this.grenades.update(dt);
    this.updatePeds(dt);
    this.pickups.update(dt); if (this.healthRespawn && this.time > this.healthRespawn) { this.healthRespawn = 0; const hp = this.world.pois.hospital; this.pickups.add({ type: 'health', x: hp.x - 5, z: hp.z + 1, onCollect: () => { this.healthRespawn = this.time + 90; } }); }
    this.jobs?.update(dt); this.missions.update(dt); this.fx.update(dt); this.world.update(dt, this.time); // the jobs run before the missions (Missions.update would call them too; the second call in a frame is ignored)
    // environment
    const env = this.sky.update(dt, this.clock / 60, this._focus.set(P.x, 0, P.z), this.camera); this.applyEnv(env, this.clock / 60); this.updateIndoors(dt); this.audio.rain(env.rain * (1 - 0.8 * this.indoorK));
    this.updateAmbience(dt, env, carsNear);
    this.updateLights(dt, env.night);
    P.updateCamera(dt); this.hud.update(dt);
    if (!P.vehicle) { this.audio.engine(false); this.audio.screech(0); }
    if (this.state === 'playing') { this.audio.musicFor(!!P.vehicle); }
    for (const m of this.shopMarkers) m.mesh.children[0].rotation.y += dt * 0.6;
  }
  // Indoors (a shop interior, World.interiorAt) the walls muffle the outside: indoorK eases 0 -> 1 over about 0.2 s. The door chime plays once on entering.
  updateIndoors(dt) {
    const P = this.player, id = this.world.interiorAt(P.x, P.z);
    if (id !== this.inShopId) { if (id !== null && !P.dead) this.audio.chime(); this.inShopId = id; }
    this.indoorK += ((id !== null ? 1 : 0) - this.indoorK) * Math.min(1, dt * 6);
  }
  // City ambience: hum, wind, surf, fountains, birds, crickets and distant events follow where the player is (park distance is refreshed twice a second).
  updateAmbience(dt, env, cars) {
    const P = this.player, A = _ambience; this.parkT -= dt;
    if (this.parkT <= 0) { this.parkT = 0.5; let best = Infinity; for (const k of this.world.parks) { const d = dist(P.x, P.z, k.cx, k.cz); if (d < best) best = d; } this.parkDist = best === Infinity ? NaN : best; }
    // indoors the rain is almost gone and the ambience bus takes the car muffle (a 650 Hz lowpass): the wind and the sea sit behind a wall
    A.x = P.x; A.z = P.z; A.night = env.night; A.rain = env.rain * (1 - 0.8 * this.indoorK); A.inCar = !!P.vehicle || this.indoorK > 0.5; A.cars = cars; A.park = this.parkDist; A.rightX = this.camera.matrixWorld.elements[0]; A.quality = this.settings.quality;
    this.audio.ambience(A);
  }
  impact(v, imp) { const P = this.player; const d = dist(v.x, v.z, P.x, P.z); if (d < 90) this.audio.impact(imp, d); this.fx.sparks(v.x + v.fx * v.spec.len * 0.5, 0.6, v.z + v.fz * v.spec.len * 0.5, Math.min(12, imp), 4); if (v === P.vehicle || v.driver === P) P.shake = Math.min(1, (P.shake || 0) + imp / 16); if (v.driver === P && imp > 11) P.damage((imp - 10) * 2.5, v.x, v.z); if (v.ai && v.ai.mode === 'traffic') v.disturbed = 1.2; }
  interactions() {
    const P = this.player, I = this.input; let prompt = null, target = null;
    if (!P.dead) for (const m of this.shopMarkers) { const d = dist(m.x, m.z, P.x, P.z); if (d > 3.2) continue; { const nv = P.vehicle ? null : P.nearestVehicle(); if (nv && dist(nv.x, nv.z, P.x, P.z) - nv.spec.wid * 0.5 < d - 0.5) continue; } if (m.type === 'spray') { if (P.vehicle && P.vehicle.speed < 1.5) { target = m; } } else if (!P.vehicle) target = m; }
    if (!target && !P.dead && !P.vehicle) target = this.world.shops.counterTarget(P.x, P.z, this.shopMarkers); // at the till inside a shop: the same menu as the street marker
    if (target) prompt = T.pressInteract + T[target.label];
    if (!prompt && this.missionPrompt) prompt = this.missionPrompt;
    if (!prompt && P.vehicle && P.vehicle.type === 'police' && !this.missions.active && !P.dead) { prompt = T.vigilanteStart; if (I.once('KeyV') || I.btnOnce('vig')) this.missions.startVigilante(); }
    this.interactPrompt = prompt; if (P.vehicle || prompt) this.hud.prompt(prompt);
    if (target && (I.once('KeyE') || I.once('KeyF') || I.btnOnce('enter'))) { this.setState('shop'); this.input.releaseLock(); this.ui.openShop(SHOP_TYPES[target.type], target.label); }
  }
  // ---------- people ----------
  // Is (x, y, z) out of the player's sight? Outside a 60 degree cone around the view direction, or behind a building (the ray hits a box more than 2 m short of the point).
  isHiddenFromCamera(x, y, z) {
    const c = this.camera.position, f = this.camera.getWorldDirection(_fwd), dx = x - c.x, dy = y - c.y, dz = z - c.z, d = Math.hypot(dx, dy, dz); if (d < 1e-3) return false;
    if ((f.x * dx + f.y * dy + f.z * dz) / d < 0.5) return true;
    return this.grid.raycast(c.x, c.y, c.z, dx / d, dy / d, dz / d, d) < d - 2;
  }
  // Civilians for the current tier, fewer at night (except near the club and the burger bar, where the night life is).
  pedBudget() {
    const P = this.player, pois = this.world.pois, base = TRAFFIC.tier?.[this.settings.quality]?.peds ?? TRAFFIC.peds; let k = 1 - pb('nightCut') * (this.night || 0);
    const q = pb('quietRadius'); for (const id of ['club', 'burger']) { const o = pois[id]; if (o && dist(o.x, o.z, P.x, P.z) < q) { k = 1; break; } }
    const hr = (this.clock / 60) % 24, day = hr >= 9 && hr < 19 ? pb('dayBoost') || 1 : 1; // the streets are busier by day
    return Math.round(base * k * day);
  }
  // A rectangle for a civilian who wanders about instead of walking the sidewalks: the beach strip (z within 120 m of the player) or a park near the player.
  pedArea() {
    const P = this.player, parks = this.world.parks || [], nearBeach = P.x > CITY.beachX - 120; let n = nearBeach ? 1 : 0;
    for (const k of parks) if (dist(k.cx, k.cz, P.x, P.z) < 140) n++;
    if (!n) return null; let r = Math.floor(Math.random() * n);
    if (nearBeach) { if (r === 0) return { x0: CITY.beachX + 4, x1: CITY.oceanX - 4, z0: Math.max(CITY.minZ, P.z - 120), z1: Math.min(CITY.maxZ, P.z + 120) }; r--; }
    for (const k of parks) if (dist(k.cx, k.cz, P.x, P.z) < 140 && r-- === 0) return k;
    return null;
  }
  // by day most new civilians walk the sidewalks near the player (a city-wide spread is about one person per 200 m of pavement, which reads as empty)
  nearSegments() {
    const P = this.player, nr = pb('nearRadius') || 70, out = this._near || (this._near = []); out.length = 0;
    for (const s of this.world.segments) { const mx = (s.a.x + s.b.x) / 2 - P.x, mz = (s.a.z + s.b.z) / 2 - P.z; if (mx * mx + mz * mz < nr * nr) out.push(s); }
    return out.length >= 3 ? out : null;
  }
  // by day a share of new civilians stand on the sidewalk at a shop door (the burger bars twice as often at lunch), so the shopping streets fill up. Returns a scratch point or null.
  venueSpot(lo, hi) {
    const V = this.crowd && this.crowd.venues; if (!V || Math.random() >= (TRAFFIC.venueFraction ?? 0.4)) return null;
    const hr = (this.clock / 60) % 24; if (hr < 9 || hr >= 19) return null; const P = this.player, lunch = hr >= 11 && hr < 14;
    const wt = v => v.weight > 0 && !v.club ? v.weight * (lunch && v.type === 'burger' ? 2 : 1) : 0;
    let tot = 0; for (const v of V) { const w = wt(v); if (w > 0) { const d = dist(v.ox, v.oz, P.x, P.z); if (d >= lo && d <= hi) tot += w; } }
    if (tot <= 0) return null; let r = Math.random() * tot;
    for (const v of V) { const w = wt(v); if (!(w > 0)) continue; const d = dist(v.ox, v.oz, P.x, P.z); if (d < lo || d > hi) continue; r -= w; if (r <= 0) { _vpt.x = v.ox + (Math.random() * 2 - 1) * Math.min(v.w, 5); _vpt.z = v.oz + (Math.random() * 2 - 1) * 0.6; return _vpt; } }
    return null;
  }
  // A place for a new civilian (a shared scratch record, or null). Playing: 16-110 m away and hidden from the camera, or at least 55 m away. Populate (noView): 15-150 m, no view test.
  pickPedSpot(noView) {
    const P = this.player, W = this.world, S = _spot, lo = noView ? pb('popMin') : pb('hiddenMin'), hi = noView ? pb('popMax') : pb('hiddenMax'), frac = TRAFFIC.pedAreaFraction ?? 0.25;
    const hr = (this.clock / 60) % 24, near = hr >= 9 && hr < 19 && Math.random() < (TRAFFIC.nearFraction ?? 0.5) ? this.nearSegments() : null;
    for (let t = 0; t < 8; t++) {
      let x, z, area = null;
      const at = this.venueSpot(lo, hi);
      if (at) { x = at.x; z = at.z; }
      else if (Math.random() < frac && (area = this.pedArea())) { x = area.x0 + Math.random() * (area.x1 - area.x0); z = area.z0 + Math.random() * (area.z1 - area.z0); }
      else if (near) { const s = W.randomSidewalkPoint(near); x = s.x; z = s.z; area = null; }
      else { const s = W.randomSidewalkPoint(); x = s.x; z = s.z; area = null; }
      if (W.interiorAt(x, z) !== null) continue; // nobody is born inside a shop
      if (this.grid.circleHit(x, z, 0.4)) continue; // nor inside a tree, lamp, bench or planter
      const d = dist(x, z, P.x, P.z); if (d < lo || d > hi) continue;
      if (!noView && d < pb('visibleMin') && !this.isHiddenFromCamera(x, 1, z)) continue;
      S.x = x; S.z = z; S.area = area; return S;
    }
    return null;
  }
  // the wardrobe, role and zone of a civilian come from peds.js (lookContext: zone, district, hour, rain, weekend, cold, hot)
  spawnCiv(s) { return this.addPed(new Ped(this, { kind: 'civ', x: s.x, z: s.z, area: s.area || undefined })); }
  // Fills the world around the player (loading, respawn): traffic up to the tier budget in a 15-150 m ring, civilians up to 70% of theirs. Nothing here depends on the camera.
  populate() {
    if (!this.built) return; const P = this.player;
    for (let i = this.vehicles.length - 1; i >= 0; i--) { const v = this.vehicles[i]; if (v.ai && v.ai.mode === 'traffic' && !v.special && !v.parked && v !== P.vehicle && dist(v.x, v.z, P.x, P.z) > 200) this.removeVehicle(v); }
    for (let i = this.peds.length - 1; i >= 0; i--) { const p = this.peds[i]; if (p.kind === 'civ' && !p.dead && !p.noDespawn && !p.mission && dist(p.x, p.z, P.x, P.z) > pb('despawnHidden')) this.removePed(p); }
    for (let i = this.peds.length - 1; i >= 0; i--) { const p = this.peds[i]; if (p.kind === 'civ' && !p.dead && !p.noDespawn && !p.mission && dist(p.x, p.z, P.x, P.z) > (pb('nearRadius') || 70) + 30) this.removePed(p); } // a refill (respawn, time skip) puts the people round the player, not the ones left behind
    this.traffic.fill(Infinity, { ring: [pb('popMin'), pb('popMax')] });
    let n = 0; for (const p of this.peds) if (p.kind === 'civ' && !p.dead) n++;
    const want = Math.ceil(this.pedBudget() * 0.7); for (let t = 0; t < 240 && n < want; t++) { const s = this.pickPedSpot(true); if (s) { this.spawnCiv(s); n++; } }
  }
  // Four times a second: remove civilians who are too far (beyond 140 m only while hidden, beyond 220 m always), then spawn one if the budget allows.
  spawnPeds(dt) {
    this.pedSpawnT -= dt; if (this.pedSpawnT > 0) return;
    const P = this.player, hard = pb('despawnHard'), soft = pb('despawnHidden'); let n = 0, far = null, fd = 60;
    for (let i = this.peds.length - 1; i >= 0; i--) {
      const p = this.peds[i]; if (p.noDespawn || p.mission || !(p.kind === 'civ' || p.dead)) continue;
      const d = dist(p.x, p.z, P.x, P.z);
      if (d > hard || (d > soft && this.isHiddenFromCamera(p.x, 1, p.z))) { this.removePed(p); continue; }
      if (p.kind === 'civ' && !p.dead && d > fd) { fd = d; far = p; }
    }
    for (const p of this.peds) if (p.kind === 'civ' && !p.dead) n++;
    const budget = this.pedBudget(); this.pedSpawnT = n < budget * 0.5 ? 0.1 : 0.25;
    if (n > budget + 2 && far && this.isHiddenFromCamera(far.x, 1, far.z)) this.removePed(far); // the tier or the hour lowered the budget: the farthest hidden civilian leaves
    else if (n < budget) { const s = this.pickPedSpot(false); if (s) this.spawnCiv(s); }
  }
  // Every ped, every frame: far people drop their shadow, and people outside the view frustum (beyond 20 m) keep their pose (Ped.update has its own 2nd/4th-frame pose LOD for the rest).
  updatePeds(dt) {
    const cam = this.camera, peds = this.peds, fr = this._frustum; _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); fr.setFromProjectionMatrix(_pm);
    const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    // the cars bucketed on a 16 m grid for this frame: a person checks the 3x3 buckets round them, not every car (Ped.collideVehicles)
    const frameNo = this._pedFrame = (this._pedFrame || 0) + 1;
    const VB = this._vb || (this._vb = new Map()); VB.clear(); for (const v of this.vehicles) { const k = Math.floor(v.x / 16) * 100003 + Math.floor(v.z / 16); let a = VB.get(k); if (!a) VB.set(k, a = []); a.push(v); }
    for (let i = peds.length - 1; i >= 0; i--) {
      const p = peds[i]; if (!p) continue;
      const dx = p.x - cx, dy = p.y - cy, dz = p.z - cz, d2 = dx * dx + dy * dy + dz * dz, sh = d2 < 2025;
      if (p.shadowOn !== sh) { p.shadowOn = sh; p.char.setShadow(sh); }
      let cull = false;
      if (d2 > 400 && !p.ragdoll && !(p.dead && p.deadT < 2.5)) { _sph.center.set(p.x, p.y + 0.9, p.z); _sph.radius = 1.6; cull = !fr.intersectsSphere(_sph); }
      if (cull) { p.animSkip = -1e6; p.animAcc = 0; p.animYaw = p.yaw; p.culled = true; } else if (p.culled) { p.culled = false; p.animSkip = 9; }
      // people more than 15 m away and out of view think and walk every third frame with the time they missed (their brain and collision are the cost; nobody can see them)
      if (cull && d2 > 225) { p._far = (p._far || 0) + dt; if ((frameNo + i) % 3) continue; const dtFar = p._far; p._far = 0; p.update(dtFar); continue; }
      p._far = 0; p.update(dt);
    }
  }
  // the cars near (x, z) for the people's collision (the buckets of updatePeds; every car when the buckets are not built yet)
  vehiclesNear(x, z) { const VB = this._vb; if (!VB) return this.vehicles; const cx = Math.floor(x / 16), cz = Math.floor(z / 16), out = this._vnear || (this._vnear = []); out.length = 0; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = VB.get((cx + i) * 100003 + (cz + j)); if (a) for (let k = 0; k < a.length; k++) out.push(a[k]); } return out; }
  updateLights(dt, night) {
    const P = this.player; this.lampT -= dt;
    if (this.lampT <= 0) { // the four lamps nearest to the player (insertion into a fixed list, no allocation); a light with no lamp keeps intensity 0 and stays visible, so the light count never changes
      this.lampT = 0.4; const n = this.lampLights.length; let got = 0;
      for (const l of this.world.lampPositions) {
        const q = (l.x - P.x) ** 2 + (l.z - P.z) ** 2; if (q >= 3600) continue;
        const d = q + ((l.lit ?? 1) < 0.05 ? 1e4 : 0); // a lamp that is off (not lit yet, or dead) ranks behind every lit one: it fills a light only when no lit lamp is near
        if (got === n && d >= _lampD[n - 1]) continue;
        let k = got < n ? got++ : n - 1; while (k > 0 && _lampD[k - 1] > d) { _lampD[k] = _lampD[k - 1]; _lampP[k] = _lampP[k - 1]; k--; } _lampD[k] = d; _lampP[k] = l;
      }
      for (let i = 0; i < n; i++) { const li = this.lampLights[i]; if (i < got) { const l = _lampP[i]; li.position.set(l.x, l.y, l.z); li.color.setHex(l.color ?? 0xffd9a0); li.userData.on = 1; li.userData.lamp = l; } else { li.userData.on = 0; li.userData.lamp = null; } }
    }
    // the lamp's own live level (0..1: the LED starts, sodium warm-up, flicker and the dusk sweep) scales its light every frame
    for (const li of this.lampLights) { const l = li.userData.lamp; li.intensity = night * 85 * li.userData.on * (l ? (l.lit ?? 1) : 1); }
    this.fill.position.set(P.x, P.y + 3.2, P.z); this.fill.intensity = night * (P.vehicle ? 0 : 6);
    const v = P.vehicle; const on = v && !v.wrecked ? night : 0;
    for (let i = 0; i < 2; i++) { const s = this.headlights[i]; if (!v) { s.intensity = 0; continue; } const side = i ? 1 : -1; const rx = -v.fz, rz = v.fx; s.position.set(v.x + v.fx * v.spec.len * 0.5 + rx * side * 0.7, v.y + 0.8, v.z + v.fz * v.spec.len * 0.5 + rz * side * 0.7); s.target.position.set(s.position.x + v.fx * 24, v.y - 1.2 + ((v.groundPitch || 0) + (v.pitch || 0)) * 24, s.position.z + v.fz * 24); s.intensity = on * (this.settings.quality === 'high' ? 320 : 220); }
  }
}

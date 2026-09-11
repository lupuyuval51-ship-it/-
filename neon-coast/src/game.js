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
import { Pickups } from './combat.js';
import { Player } from './player.js';
import { Vehicle, collideVehicles } from './vehicle.js';
import { Ped } from './peds.js';
import { T, lang } from './i18n.js';
import { mulberry, dist, clamp, pick } from './utils.js';
import { CAR_COLORS, OUTFITS } from './config.js';
import { Post } from './post.js';
import { EnvMap } from './env.js';
import { SkidMarks } from './decals.js';
import { setHeadlightPools } from './vehicle.js';
import { Grenades } from './combat.js';
import { LOOKS } from './character.js';

const STATIONS = ['off', 'neon', 'bass', 'club'];
const SAVE_KEY = 'neoncoast.save', SET_KEY = 'neoncoast.settings';
const HALF = CITY.road / 2;
const SHOP_TYPES = { guns: 'guns', dealer: 'cars', spray: 'spray', hospital: 'hospital', safehouse: 'safehouse', burger: 'burger', clothes: 'clothes', casino: 'casino' };
const _tmp = [];

export class Game {
  constructor(canvas) {
    this.canvas = canvas; let saved = {}; try { saved = JSON.parse(localStorage.getItem(SET_KEY) || '{}'); } catch {}
    this.settings = Object.assign({ quality: 'high', volume: 0.8, sensitivity: 1, lang }, saved);
    const q = this.settings.quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: q !== 'low', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1; this.renderer.shadowMap.enabled = q !== 'low'; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q === 'high' ? 2 : q === 'med' ? 1.5 : 1));
    this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.2, 2400);
    this.post = new Post(this.renderer, q);
    this.input = new Input(canvas); this.audio = new AudioSys(); this.audio.volume = this.settings.volume; this.hud = new HUD(this);
    this.vehicles = []; this.peds = []; this.time = 0; this.clock = TIME.start; this.weather = 'clear'; this.station = 'off'; this.money = 0; this.stats = { kills: 0, carsStolen: 0, distance: 0, playtime: 0, tokens: 0 }; this.collected = new Set();
    this.state = 'title'; this.timeScale = 1; this.godMode = false; this.interactPrompt = null; this.missionPrompt = null; this.weatherT = 0; this.lampT = 0; this.pedSpawnT = 0; this.titleAng = 0; this.built = false;
    this.ui = new UI(this);
    addEventListener('resize', () => this.resize()); this.resize();
  }
  resize() { this.renderer.setSize(innerWidth, innerHeight, false); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); const sz = this.renderer.getDrawingBufferSize(new THREE.Vector2()); this.post?.setSize(sz.x, sz.y); }
  get uiOpen() { return this.state !== 'playing' && this.state !== 'dead'; }
  cameraForward() { const P = this.player; return { x: Math.sin(P.camYaw), z: Math.cos(P.camYaw) }; }
  boot() { this.ui.setLoading(true); requestAnimationFrame(() => setTimeout(() => { try { this.buildWorld(); } catch (e) { console.error(e); } this.ui.setLoading(false); this.ui.show('title'); this.last = performance.now(); this.loop(); }, 40)); }

  buildWorld() {
    const q = this.settings.quality;
    this.world = new World(this.scene, q); this.grid = this.world.grid; this.sky = new Sky(this.scene, this.renderer, q); this.fx = new Effects(this.scene);
    this.env = new EnvMap(this.renderer, this.scene); this.skids = new SkidMarks(this.scene); this.grenades = new Grenades(this);
    this.police = new Police(this); this.traffic = new Traffic(this); this.missions = new Missions(this); this.pickups = new Pickups(this); this.ownedOutfits = new Set(['street']); this.outfit = 'street';
    const sh = this.world.pois.safehouse; this.player = new Player(this, sh.x + 4, sh.z - 0.5);
    this.missions.init();
    // shop markers
    this.shopMarkers = []; for (const id in this.world.pois) { const p = this.world.pois[id]; if (!SHOP_TYPES[p.type]) continue; const m = this.missions.makeMarker(p.x, p.z, parseInt(p.color.slice(1), 16), false); m.mesh.children[0].scale.set(0.75, 0.5, 0.75); m.mesh.children[0].material.opacity = 0.32; this.shopMarkers.push({ id, ...p, mesh: m.mesh }); }
    for (const id in this.world.pois) { const p = this.world.pois[id]; if (p.type === 'police') this.setupStation(p); }
    // lamp light pool + headlights
    this.lampLights = []; for (let i = 0; i < 7; i++) { const l = new THREE.PointLight(0xffd9a0, 0, 30, 2); this.scene.add(l); this.lampLights.push(l); }
    this.fill = new THREE.PointLight(0xdfe6ff, 0, 9, 2); this.scene.add(this.fill);
    this.headlights = []; for (let i = 0; i < 2; i++) { const s = new THREE.SpotLight(0xfff4d6, 0, 70, 0.55, 0.6, 1.3); this.scene.add(s); this.scene.add(s.target); this.headlights.push(s); }
    this.traffic.init(); this.resetPickups(); this.built = true;
    this.camera.position.set(120, 70, 120); this.camera.lookAt(0, 20, 0);
  }
  setupStation(p) {
    for (const dx of [-3, 3]) this.addPed(new Ped(this, { kind: 'armed', team: 'cop', look: LOOKS.cop, x: p.x + dx, z: p.z, yaw: Math.PI, hp: 100, weapon: 'pistol', accuracy: 0.5, noDespawn: true, station: true }));
    for (const dx of [10, 17]) { const v = new Vehicle('police', null, p.x + dx, p.blockZ0 - 1.75, 0); v.parked = true; this.addVehicle(v); }
  }
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
  startNew() {
    this.audio.init(); this.money = 500; this.clock = TIME.start; this.time = 0; this.stats = { kills: 0, carsStolen: 0, distance: 0, playtime: 0, tokens: 0 }; this.collected = new Set(); this.weather = 'clear'; this.sky.setWeather('clear'); this.station = 'off'; this.audio.setStation('off');
    this.missions.completed = new Set(); this.missions.taxiRuns = 0; if (this.missions.active) this.missions.fail(); this.clearDynamic();
    const sh = this.world.pois.safehouse; this.player.weapons = { fist: { ammo: Infinity, clip: 0 } }; this.player.weaponIds = ['fist']; this.ownedOutfits = new Set(['street']); this.applyOutfit('street'); this.player.select('fist'); this.player.armor = 0; this.player.respawn(sh.x + 4, sh.z - 0.5); this.player.camYaw = Math.PI; this.resetPickups();
    this.play(); this.hud.notify(T.hint.first, 'obj', 9); setTimeout(() => this.hud.notify(T.hint.stealCar, 'dim', 7), 4000);
  }
  continueGame() { this.audio.init(); if (this.loadGame()) this.play(); }
  play() { this.state = 'playing'; this.ui.hideAll(); this.hud.show(true); this.input.enabled = true; this.input.requestLock(); document.getElementById('touch').hidden = !this.input.isTouch; this.audio.duck(1); this.last = performance.now(); }
  pause() { if (this.state !== 'playing') return; this.state = 'paused'; this.ui.show('pause'); this.input.releaseLock(); this.audio.duck(0.3); this.audio.engine(false); this.audio.siren(0); this.audio.screech(0); }
  resume() { if (this.state === 'title') return; this.state = 'playing'; this.ui.hideAll(); this.input.requestLock(); this.audio.duck(1); this.last = performance.now(); }
  toTitle() { this.saveGame(true); this.state = 'title'; this.ui.hideAll(); this.ui.applyLanguage(); this.ui.show('title'); this.hud.show(false); this.input.enabled = false; this.input.releaseLock(); this.audio.setStation('off'); this.audio.engine(false); this.audio.siren(0); this.audio.heli(0); }
  clearDynamic() {
    for (const v of [...this.vehicles]) if (!v.parked || v.wrecked) this.removeVehicle(v); for (const p of [...this.peds]) if (!p.station) this.removePed(p); for (const p of this.peds) { p.hostile = false; p.hp = p.maxHp; } this.police.clear(); this.fx.fires.length = 0; this.missions.clearMarkers();
  }
  // ---------- save / load ----------
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
  saveSettings() { try { localStorage.setItem(SET_KEY, JSON.stringify(this.settings)); } catch {} }
  saveGame(silent = false) {
    if (!this.built) return; const s = { v: 1, money: this.money, clock: this.clock, weather: this.weather, station: this.station, stats: this.stats, collected: [...this.collected], player: this.player.save(), missions: this.missions.save(), outfit: this.outfit, outfits: [...this.ownedOutfits], t: Date.now() };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); if (!silent) this.hud.notify(T.saved, 'cash'); } catch (e) { this.hud.notify('Save failed', 'warn'); }
    this.ui.applyLanguage();
  }
  loadGame() {
    let s; try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch {} if (!s) { this.hud.notify(T.noSave, 'warn'); return false; }
    if (this.missions.active) this.missions.fail(); this.clearDynamic();
    this.money = s.money; this.clock = s.clock; this.weather = s.weather || 'clear'; this.sky.setWeather(this.weather); this.station = s.station || 'off'; this.audio.setStation(this.station); this.stats = Object.assign({ kills: 0, carsStolen: 0, distance: 0, playtime: 0, tokens: 0 }, s.stats); this.collected = new Set(s.collected || []);
    this.missions.load(s.missions || {}); this.player.load(s.player); this.ownedOutfits = new Set(s.outfits || ['street']); this.applyOutfit(s.outfit || 'street'); this.player.dead = false; this.player.vehicle = null; this.player.mesh.visible = true; this.player.camYaw = Math.PI; this.resetPickups(); this.hud.notify(T.loaded, 'cash'); return true;
  }
  sleep() { this.clock = 7 * 60; this.player.health = 100; this.weather = 'clear'; this.sky.setWeather('clear'); this.saveGame(true); this.hud.notify(T.sleepDone, 'cash'); }
  setQuality(q) {
    this.settings.quality = q; this.saveSettings(); const on = q !== 'low'; this.renderer.shadowMap.enabled = on; this.sky.sun.castShadow = on; const size = q === 'high' ? 2048 : 1024;
    if (this.sky.sun.shadow.mapSize.x !== size) { this.sky.sun.shadow.mapSize.set(size, size); if (this.sky.sun.shadow.map) { this.sky.sun.shadow.map.dispose(); this.sky.sun.shadow.map = null; } }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q === 'high' ? 2 : q === 'med' ? 1.5 : 1)); this.post.enabled = on; this.post.quality = q; this.post.w = 0; this.resize(); this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  }
  setVolume(v) { this.settings.volume = v; this.audio.setVolume(v); this.saveSettings(); }
  // ---------- entity management ----------
  addVehicle(v) { this.vehicles.push(v); this.scene.add(v.mesh); v.onWreck = w => this.onWreck(w); v.hit = (o, imp) => this.onCarHit(v, o, imp); return v; }
  removeVehicle(v) { const i = this.vehicles.indexOf(v); if (i >= 0) this.vehicles.splice(i, 1); this.scene.remove(v.mesh); if (this.player.vehicle === v) this.player.exitVehicle(); }
  addPed(p) { this.peds.push(p); return p; }
  removePed(p) { const i = this.peds.indexOf(p); if (i >= 0) this.peds.splice(i, 1); p.dispose(); }
  addPickup(o) { return this.pickups.add(o); }
  addMoney(n) { this.money = Math.max(0, this.money + n); this.hud.moneyDelta(n); }
  alert(x, z, r, type, src) { for (const p of this.peds) p.scare(x, z, r); if (type === 'gunfire' || type === 'death') for (const v of this.vehicles) if (v.ai && v.ai.mode === 'traffic' && dist(v.x, v.z, x, z) < r) v.ai.panic = 6; }
  nextStation() { const i = STATIONS.indexOf(this.station); this.station = STATIONS[(i + 1) % STATIONS.length]; this.audio.setStation(this.station); this.hud.radio(this.station); }
  deliverCar(type) { const d = this.world.pois.dealer; let x = d.x + 12; const z = d.blockZ0 - 1.75; for (let k = 0; k < 6; k++) { if (!this.vehicles.some(v => dist(v.x, v.z, x, z) < 5.5)) break; x += 6; } const v = new Vehicle(type, pick(CAR_COLORS), x, z, 0); v.parked = true; this.addVehicle(v); }
  onWreck(v) {
    const P = this.player; const byPlayer = v.driver === P || (v.playerHitT !== undefined && this.time - v.playerHitT < 10);
    if (P.vehicle === v) P.damage(500, v.x, v.z);
    this.explode(v.x, 0.3, v.z, byPlayer ? 'player' : 'car');
  }
  onCarHit(v, other, impact) { if (other.driver === this.player) { v.playerHitT = this.time; if ((v.type === 'police' || v.type === 'swat') && impact > 4) this.police.reportCrime('hitcop', v.x, v.z); if (impact > 5 && v.ai && v.ai.mode === 'traffic') v.ai.panic = 5; } }
  // ---------- death / arrest ----------
  wasted() { if (this.state === 'dead') return; this.state = 'dead'; this.deadKind = 'wasted'; this.hud.overlay('wasted'); this.canvas.classList.add('gray'); this.timeScale = 0.35; this.audio.engine(false); this.audio.failed(); if (this.missions.active) this.missions.fail(); setTimeout(() => this.respawn('hospital'), 4800); }
  bust() { if (this.state === 'dead' || this.player.dead) return; this.state = 'dead'; this.deadKind = 'busted'; const P = this.player; if (P.vehicle) P.exitVehicle(); P.dead = true; this.hud.overlay('busted'); this.canvas.classList.add('gray'); this.timeScale = 0.35; this.audio.engine(false); this.audio.wanted(); if (this.missions.active) this.missions.fail(); setTimeout(() => this.respawn('police'), 4800); }
  respawn(kind) {
    const poi = this.world.pois[kind === 'hospital' ? 'hospital' : 'police']; const loss = Math.min(1000, Math.round(this.money * 0.1)); if (loss) this.addMoney(-loss);
    this.player.respawn(poi.x + 4, poi.z - 0.5); this.player.armor = 0; this.player.camYaw = Math.PI; this.police.clear(); for (const p of [...this.peds]) if (p.team && !p.station) this.removePed(p);
    this.timeScale = 1; this.hud.overlay(null); this.canvas.classList.remove('gray'); this.state = 'playing'; this.hud.notify(kind === 'hospital' ? T.respawnHospital : T.respawnPolice, 'warn', 6); this.clock = (this.clock + 360) % 1440;
  }
  // ---------- main loop ----------
  loop() {
    requestAnimationFrame(() => this.loop()); const now = performance.now(); let dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now; if (!this.built) return;
    try {
      if (this.state === 'title') { this.titleUpdate(dt); }
      else if (this.state === 'playing' || this.state === 'dead') { this.update(dt * this.timeScale, dt); }
      else { this.menuKeys(); }
      this.post.render(this.scene, this.camera, { night: this.night || 0, rain: this.rainLevel || 0, time: this.time, hurt: this.hud.hurtT ? Math.min(1, this.hud.hurtT * 2) : 0, exposure: 1 - (1 - (this.night || 0)) * 0.06, strength: 0.32 + (this.night || 0) * 0.6 });
    } catch (e) { console.error(e); }
    this.input.endFrame();
  }
  titleUpdate(dt) {
    this.titleAng += dt * 0.06; const r = 190; this.camera.position.set(Math.cos(this.titleAng) * r, 62 + Math.sin(this.titleAng * 0.7) * 8, Math.sin(this.titleAng) * r); this.camera.lookAt(0, 26, 0); this.camera.fov = 58; this.camera.updateProjectionMatrix();
    const env = this.sky.update(dt, 18.75, this.camera.position, this.camera); this.applyEnv(env); this.world.update(dt, performance.now() / 1000); this.fx.update(dt);
  }
  menuKeys() { const I = this.input; if (I.once('Escape') || (this.state === 'map' && I.once('KeyM')) || (this.state === 'shop' && I.once('KeyE'))) this.resume(); }
  applyEnv(env) { this.world.setNight(env.night, env.sunDir, env.skyColor, env.fogColor, env.fogNear, env.fogFar, env.sunColor, env.rain); this.fx.setFog(env.fogColor, env.fogNear, env.fogFar); this.night = env.night; this.rainLevel = env.rain; this.env.update(env.top, env.horizon, env.sunColor, env.sunDir, env.night); setHeadlightPools(env.night); }
  update(dt, realDt) {
    const I = this.input, P = this.player; this.time += dt; this.clock = (this.clock + dt * TIME.minutesPerSecond) % 1440; this.stats.playtime += realDt;
    if (this.state === 'playing') { if (I.once('Escape') || I.btnOnce('pause')) { this.pause(); return; } if (I.once('KeyM') || I.btnOnce('map')) { this.state = 'map'; this.ui.show('map'); this.input.releaseLock(); return; } }
    // weather
    this.weatherT -= dt; if (this.weatherT <= 0) { this.weatherT = 60; if (this.weather === 'clear' && Math.random() < 0.1) this.weather = 'rain'; else if (this.weather === 'rain' && Math.random() < 0.3) this.weather = 'clear'; this.sky.setWeather(this.weather); }
    // player + interactions
    P.update(dt); this.interactions();
    // AI
    this.traffic.update(dt); this.police.update(dt); this.spawnPeds(dt);
    // vehicle physics in substeps
    const steps = dt > 1 / 50 ? 2 : 1, h = dt / steps; const active = [], near = []; for (const v of this.vehicles) { if (!v.parked || v.speed > 0.05 || v.disturbed > 0) active.push(v); if (Math.abs(v.x - P.x) < 220 && Math.abs(v.z - P.z) < 220) near.push(v); }
    for (let s = 0; s < steps; s++) { for (const v of active) { v.step(h); const imp = v.collideStatic(this.grid, _tmp); if (imp > 4) this.impact(v, imp); } collideVehicles(near); }
    const pier = this.world.pier;
    for (const v of this.vehicles) {
      v.y = (v.x > pier.x0 - 3 && v.x < pier.x1 && Math.abs(v.z - pier.z) < 4.6) ? pier.y : 0; if (!v.parked || v.speed > 0.05) v.syncMesh(this.time);
      if (!v.wrecked && v.hp < v.maxHp * 0.35 && Math.random() < 0.35) this.fx.smoke(v.x + v.fx * 1.5, 1.0, v.z + v.fz * 1.5, 1, v.hp < v.maxHp * 0.15 ? 0.1 : 0.4, 0.9);
      if (!v.wrecked && v.hp < v.maxHp * 0.12 && Math.random() < 0.3) this.fx.fire(v.x + v.fx * 1.5, 0.9, v.z + v.fz * 1.5, 1, 0.5);
      if (v.wrecked && !v.parked && v.speed < 0.2) v.parked = true;
      const B = this.world.bounds; v.x = clamp(v.x, B.minX, B.maxX); v.z = clamp(v.z, B.minZ, B.maxZ); if (v.x > CITY.oceanX + 1) { v.vx *= 0.94; v.vz *= 0.94; }
    }
    for (const v of active) { if (v.wrecked) continue; const slipping = (v.slip > 3.2 && v.speed > 4) || (v.input.handbrake && v.speed > 5); const rx = -v.fz, rz = v.fx; for (const side of [-1, 1]) { const id = v.id * 2 + (side > 0 ? 1 : 0); if (slipping) this.skids.mark(id, v.x - v.fx * v.spec.len * 0.32 + rx * side * (v.spec.wid / 2 - 0.12), v.z - v.fz * v.spec.len * 0.32 + rz * side * (v.spec.wid / 2 - 0.12), v.y, 0.3 + Math.min(0.5, v.slip / 12)); else this.skids.forget(id); } }
    this.grenades.update(dt);
    for (const p of [...this.peds]) p.update(dt);
    this.pickups.update(dt); if (this.healthRespawn && this.time > this.healthRespawn) { this.healthRespawn = 0; const hp = this.world.pois.hospital; this.pickups.add({ type: 'health', x: hp.x - 5, z: hp.z + 1, onCollect: () => { this.healthRespawn = this.time + 90; } }); }
    this.missions.update(dt); this.fx.update(dt); this.world.update(dt, this.time);
    // environment
    const env = this.sky.update(dt, this.clock / 60, new THREE.Vector3(P.x, 0, P.z), this.camera); this.applyEnv(env); this.audio.rain(env.rain);
    this.updateLights(dt, env.night);
    P.updateCamera(dt); this.hud.update(dt);
    if (!P.vehicle) { this.audio.engine(false); this.audio.screech(0); } if (this.state === 'playing') this.audio.duck(P.vehicle ? 1 : 0.12);
    for (const m of this.shopMarkers) m.mesh.children[0].rotation.y += dt * 0.6;
  }
  impact(v, imp) { const P = this.player; const d = dist(v.x, v.z, P.x, P.z); if (d < 90) this.audio.impact(imp, d); this.fx.sparks(v.x + v.fx * v.spec.len * 0.5, 0.6, v.z + v.fz * v.spec.len * 0.5, Math.min(12, imp), 4); if (v.driver === P && imp > 11) P.damage((imp - 10) * 2.5, v.x, v.z); if (v.ai && v.ai.mode === 'traffic') v.disturbed = 1.2; }
  interactions() {
    const P = this.player, I = this.input; let prompt = null, target = null;
    if (!P.dead) for (const m of this.shopMarkers) { const d = dist(m.x, m.z, P.x, P.z); if (d > 3.2) continue; if (m.type === 'spray') { if (P.vehicle && P.vehicle.speed < 1.5) { target = m; } } else if (!P.vehicle) target = m; }
    if (target) prompt = T.pressInteract + T[target.label];
    if (!prompt && this.missionPrompt) prompt = this.missionPrompt;
    if (!prompt && P.vehicle && P.vehicle.type === 'police' && !this.missions.active && !P.dead) { prompt = T.vigilanteStart; if (I.once('KeyV') || I.btnOnce('vig')) this.missions.startVigilante(); }
    this.interactPrompt = prompt; if (P.vehicle || prompt) this.hud.prompt(prompt);
    if (target && (I.once('KeyE') || I.once('KeyF') || I.btnOnce('enter'))) { this.state = 'shop'; this.input.releaseLock(); this.ui.openShop(SHOP_TYPES[target.type], target.label); }
  }
  spawnPeds(dt) {
    const P = this.player; this.pedSpawnT -= dt; let n = 0; for (const p of this.peds) if (p.kind === 'civ' && !p.dead) n++;
    for (let i = this.peds.length - 1; i >= 0; i--) { const p = this.peds[i]; if (p.noDespawn || p.mission) continue; if (dist(p.x, p.z, P.x, P.z) > TRAFFIC.pedDespawn && (p.kind === 'civ' || p.dead)) this.removePed(p); }
    if (n < TRAFFIC.peds && this.pedSpawnT <= 0) { this.pedSpawnT = 0.25; const f = this.cameraForward(); for (let t = 0; t < 8; t++) { const s = this.world.randomSidewalkPoint(); const d = dist(s.x, s.z, P.x, P.z); if (d < TRAFFIC.pedSpawnMin || d > TRAFFIC.pedSpawnMax) continue; if (((s.x - P.x) * f.x + (s.z - P.z) * f.z) / d > 0.3 && d < 90) continue; this.addPed(new Ped(this, { kind: 'civ', x: s.x, z: s.z })); break; } }
  }
  updateLights(dt, night) {
    const P = this.player; this.lampT -= dt;
    if (this.lampT <= 0) { this.lampT = 0.4; const L = this.world.lampPositions; const near = []; for (const l of L) { const d = (l.x - P.x) ** 2 + (l.z - P.z) ** 2; if (d < 60 * 60) near.push({ l, d }); } near.sort((a, b) => a.d - b.d); for (let i = 0; i < this.lampLights.length; i++) { const li = this.lampLights[i]; if (near[i]) { li.position.set(near[i].l.x, near[i].l.y, near[i].l.z); li.visible = true; } else li.visible = false; } }
    for (const li of this.lampLights) li.intensity = night * 60;
    this.fill.position.set(P.x, P.y + 3.2, P.z); this.fill.intensity = night * (P.vehicle ? 0 : 6);
    const v = P.vehicle; const on = v && !v.wrecked ? night : 0;
    for (let i = 0; i < 2; i++) { const s = this.headlights[i]; if (!v) { s.intensity = 0; continue; } const side = i ? 1 : -1; const rx = -v.fz, rz = v.fx; s.position.set(v.x + v.fx * v.spec.len * 0.5 + rx * side * 0.7, v.y + 0.8, v.z + v.fz * v.spec.len * 0.5 + rz * side * 0.7); s.target.position.set(s.position.x + v.fx * 24, v.y - 1.2, s.position.z + v.fz * 24); s.intensity = on * (this.settings.quality === 'high' ? 320 : 220); }
  }
}

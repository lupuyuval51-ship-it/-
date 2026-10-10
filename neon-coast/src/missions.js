import * as THREE from '../vendor/three.module.min.js';
import { Vehicle } from './vehicle.js';
import { Ped } from './peds.js';
import { LOOKS } from './character.js';
import { acquireLane } from './traffic.js';
import { CITY, WEAPONS } from './config.js';
import { dist, fmtMoney, fmtTime } from './utils.js';
import { T } from './i18n.js';

class Abort extends Error {}
const markerGeo = new THREE.CylinderGeometry(1.7, 1.7, 1.4, 28, 1, true); const beamGeo = new THREE.CylinderGeometry(0.35, 1.2, 80, 12, 1, true); beamGeo.translate(0, 40, 0);
const HALF = CITY.road / 2;
// Retry from checkpoints. The offer lasts RETRY_WINDOW seconds (it is held open while the WASTED / BUSTED overlay is up) and a resumed run never starts below RETRY_MIN_HP.
const RETRY_WINDOW = 20, RETRY_MIN_HP = 50;
const TITLE_DUCK = 0.4, TITLE_TIME = 4; // the radio drops to 40% for the 4 s the mission title card is up (AudioSys.missionDuck)
const GIVER_OF = { intro: 'ricky', cleanup: 'ricky', repo: 'lior', packages: 'lior', heist: 'lior', race: 'dana', pursuit: 'dana', contract: 'fixer', taxi: 'taxi' };
const GIVER_SPOT = { lior: [0, 4], fixer: [-3.5, -3] }; // where a restart from scratch puts the player, relative to the giver marker (default +4 m along x)
const BESIDE_ANGLES = [Math.PI / 2, -Math.PI / 2, Math.PI, 0, Math.PI * 0.75, -Math.PI * 0.75, Math.PI / 4, -Math.PI / 4];
const _hit = [];
const weaponRank = id => WEAPONS.findIndex(w => w.id === id);

export class Missions {
  constructor(game) {
    this.game = game; this.completed = new Set(); this.active = null; this.waiters = []; this.givers = []; this.objMarkers = []; this.timer = null; this.taxiRuns = 0; this.raceRoute = 0; this.contracts = 0; this.vigLevel = 0;
    this.retry = null; this.skipFlag = false; this.duckUntil = 0; // retry = { id, cp, snap, until } of the last failed mission; skipFlag is set by a click on the subtitle and ends the current line
    this.subEl = typeof document !== 'undefined' ? document.getElementById('subtitle') : null;
    if (this.subEl) this.subEl.addEventListener('click', () => { this.skipFlag = true; });
  }
  // The subtitle only takes clicks while a mission line is up (the HUD layer itself ignores the pointer, and a hidden subtitle must never swallow canvas clicks).
  skippable(on) { const e = this.subEl; if (e) { e.style.pointerEvents = on ? 'auto' : ''; e.style.cursor = on ? 'pointer' : ''; } }
  // New game / load: forget every trace of the previous run.
  resetProgress() { this.completed = new Set(); this.taxiRuns = 0; this.raceRoute = 0; this.contracts = 0; this.vigLevel = 0; this.retry = null; this.skipFlag = false; this.endDuck(); }
  // Called by Game.respawn: the retry offer starts its 20 s again once the player is back on their feet.
  onRespawn() { if (this.retry) this.retry.until = this.game.time + RETRY_WINDOW; this.game.missionPrompt = null; }
  // The radio ducks under the mission title card and comes back when the card is gone (or the mission ends first). A deadline further ahead than the card belongs to a previous game whose clock was reset.
  endDuck() { this.duckUntil = 0; if (this.game.audio) this.game.audio.missionDuck = 1; }
  init() {
    const P = this.game.world.pois; const mk = (id, poi) => { const m = this.makeMarker(poi.x, poi.z, 0xffd34e, false); m.mesh.visible = false; this.givers.push({ id, x: poi.x, z: poi.z, marker: m }); };
    mk('ricky', P.ricky); mk('lior', P.club); mk('dana', P.dana); mk('taxi', P.taxi);
    const fx = this.makeMarker(P.fixer.x, P.fixer.z, 0xe0e0e0, false, P.fixer.y); fx.mesh.visible = false; this.givers.push({ id: 'fixer', x: P.fixer.x, z: P.fixer.z, marker: fx });
  }
  makeMarker(x, z, color, beam = true, y = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const m = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })); m.position.y = 0.7; g.add(m);
    if (beam) { const b = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })); g.add(b); }
    this.game.scene.add(g); return { mesh: g, x, z, color: '#' + new THREE.Color(color).getHexString(), y };
  }
  nextFor(id) {
    const c = this.completed;
    if (id === 'ricky') return !c.has('intro') ? 'intro' : !c.has('cleanup') ? 'cleanup' : null;
    if (id === 'lior') return !c.has('intro') ? null : !c.has('repo') ? 'repo' : !c.has('packages') ? 'packages' : (c.has('cleanup') && c.has('pursuit') && !c.has('heist')) ? 'heist' : null;
    if (id === 'dana') return !c.has('intro') ? null : !c.has('race') ? 'race' : !c.has('pursuit') ? 'pursuit' : 'race';
    if (id === 'fixer') return c.has('intro') ? 'contract' : null;
    if (id === 'taxi') return c.has('intro') ? 'taxi' : null;
    return null;
  }
  get blips() { const out = []; if (!this.active) for (const g of this.givers) if (this.nextFor(g.id)) out.push({ x: g.x, z: g.z, color: '#ffd34e', kind: 'mission' }); for (const m of this.objMarkers) out.push({ x: m.x, z: m.z, color: m.color, kind: 'objective' }); return out; }
  update(dt) {
    this.dt = dt;
    const G = this.game, P = G.player, t = G.time; if (this.duckUntil && (t >= this.duckUntil || this.duckUntil > t + TITLE_TIME + 1e-3)) this.endDuck();
    for (const m of this.objMarkers) { m.mesh.children[0].rotation.y += dt; m.mesh.children[0].scale.setScalar(1 + Math.sin(t * 4) * 0.06); if (m.follow) { m.x = m.follow.x; m.z = m.follow.z; m.mesh.position.x = m.follow.x; m.mesh.position.z = m.follow.z; } }
    if (this.active) {
      if (this.timer) { const left = this.timer.end - t; G.hud.setTimer(Math.max(0, left), this.timer.label); }
      for (let i = this.waiters.length - 1; i >= 0; i--) { const w = this.waiters[i]; if (this.active.aborted) { this.waiters.splice(i, 1); w.reject(new Abort()); continue; } let ok = false; try { ok = w.fn(); } catch (e) { if (e instanceof Abort) { this.waiters.splice(i, 1); w.reject(e); continue; } console.error(e); } if (ok) { this.waiters.splice(i, 1); w.resolve(); } }
      for (const g of this.givers) g.marker.mesh.visible = false; G.missionPrompt = null; return;
    }
    // retry offer: kept open while the WASTED / BUSTED overlay is up, then 20 s from the moment the player can act again
    // (an offer that lies further ahead than one window belongs to a previous game whose clock was reset, so it is dropped)
    const r = this.retry; if (r) { const dead = P.dead || G.state === 'dead'; if (r.until > t + RETRY_WINDOW + 1e-3 || (!dead && t >= r.until)) this.retry = null; else if (dead) r.until = Math.max(r.until, t + RETRY_WINDOW); }
    const offer = !!this.retry && !P.dead;
    let near = null;
    for (const g of this.givers) { const id = this.nextFor(g.id); g.marker.mesh.visible = !!id; g.marker.mesh.children[0].rotation.y += dt * 0.8; if (id && dist(g.x, g.z, P.x, P.z) < 2.6) near = { g, id }; }
    G.missionPrompt = P.dead ? null : offer ? (T.retryPrompt ?? 'E – Retry mission') : near ? `${T.pressStart}: ${this.name(near.id)}` : null;
    if (!P.dead && (offer || near) && (G.input.once('KeyE') || G.input.once('KeyF') || G.input.btnOnce('enter'))) { if (offer) this.retryNow(); else this.start(near.id); }
  }
  // Restarts the mission that just failed: from its last checkpoint (player, health, armor and weapons come back, money does not) or, at checkpoint 0, next to the giver.
  retryNow() {
    const G = this.game, P = G.player, r = this.retry; if (!r || this.active) return; this.retry = null;
    const s = r.cp > 0 ? r.snap : null;
    if (P.vehicle) P.exitVehicle();
    if (s) { P.respawn(s.x, s.z); P.health = Math.max(RETRY_MIN_HP, s.hp); P.armor = s.armor; this.restoreWeapons(s); }
    else if (r.cp <= 0) { const gv = this.givers.find(g => g.id === GIVER_OF[r.id]); if (gv) { const o = GIVER_SPOT[gv.id] || [4, 0], hp = P.health; P.respawn(gv.x + o[0], gv.z + o[1]); P.health = hp; } }
    G.police.clear(); this.skipFlag = false; this.start(r.id, r.cp, true, s);
  }
  // Puts the checkpoint ammo back. Weapons bought since the checkpoint are kept.
  restoreWeapons(s) {
    const P = this.game.player; if (!s.weapons) return;
    for (const id of s.weaponIds) { if (!s.weapons[id]) continue; if (!P.weapons[id]) P.weaponIds.push(id); P.weapons[id] = structuredClone(s.weapons[id]); }
    P.weaponIds.sort((a, b) => weaponRank(a) - weaponRank(b));
    P.select(P.weapons[s.weapon] ? s.weapon : P.weapons[P.weapon.id] ? P.weapon.id : 'fist');
  }
  // A parked, inert car 3.8 m from the player on the first free side (never inside a wall), pointing the way the player faces.
  carBeside(c, type, color) {
    const G = this.game, P = c.P, yaw = P.yaw; let x = P.x + Math.sin(yaw + BESIDE_ANGLES[0]) * 3.8, z = P.z + Math.cos(yaw + BESIDE_ANGLES[0]) * 3.8;
    for (let k = 0; k < BESIDE_ANGLES.length; k++) { const a = yaw + BESIDE_ANGLES[k], px = P.x + Math.sin(a) * 3.8, pz = P.z + Math.cos(a) * 3.8; if (!G.grid.circleHit(px, pz, 1.6, _hit)) { x = px; z = pz; break; } }
    const v = c.spawnVehicle(type, x, z, Math.atan2(-Math.cos(yaw), Math.sin(yaw)), color); v.parked = true; return v;
  }
  // ---------- runner ----------
  // from = checkpoint to resume at (0 = the beginning). retrying skips the intro dialogue. snap carries the checkpoint snapshot of the failed run, so dying again before the next checkpoint falls back to the same one.
  start(id, from = 0, retrying = from > 0, snap = null) {
    const G = this.game; this.retry = null; this.skipFlag = false;
    this.active = { id, aborted: false, cleanup: [], cp: from, from, retrying, skipSay: retrying, snap, earned: 0, t0: G.time }; G.hud.missionTitle(this.name(id)); G.audio.missionDuck = TITLE_DUCK; this.duckUntil = G.time + TITLE_TIME;
    const ctx = this.ctx(); this['m_' + id](ctx).then(() => this.finish(id)).catch(e => { if (e instanceof Abort) { if ('failText' in e && this.active) this.fail(e.failText); } else { console.error(e); this.fail(); } });
  }
  finish(id) {
    const G = this.game, a = this.active; if (!a) return;
    if (id === 'vigilante') { this.runCleanup(); G.hud.missionResult(true, T.vigilanteEnd, `${T.vigilanteDone} ${this.vigLevel}`); G.audio.passed(); this.endDuck(); this.active = null; return; }
    this.completed.add(id); const earned = a.earned || 0, took = Math.max(0, G.time - (a.t0 ?? G.time)); this.runCleanup();
    G.hud.missionResult(true, T.missionPassed, `${this.name(id)} · +${fmtMoney(earned)} · ${fmtTime(took)}`); G.audio.passed(); this.endDuck(); this.active = null; G.saveGame(true);
  }
  fail(text) {
    const G = this.game, a = this.active; if (!a) return; a.aborted = true; const id = a.id; this.runCleanup(); const m = T.m[id] || T[id] || {};
    if (id !== 'vigilante' && (G.state === 'playing' || G.state === 'dead')) this.retry = { id, cp: a.cp, snap: a.snap, until: G.time + RETRY_WINDOW }; // not on a new game / load, whose fail() runs from the menus
    G.hud.missionResult(false, T.missionFailed, text || m.fail || this.name(id)); G.audio.failed(); this.endDuck(); this.active = null;
  }
  runCleanup() { const a = this.active; for (const f of a.cleanup) { try { f(); } catch (e) { console.error(e); } } this.clearMarkers(); this.timer = null; this.game.hud.clearTimer(); this.game.hud.setObjective(null); this.game.hud.subtitle(null); this.skippable(false); this.waiters.length = 0; }
  clearMarkers() { for (const m of this.objMarkers) this.game.scene.remove(m.mesh); this.objMarkers = []; }
  ctx() {
    const G = this.game, P = G.player, self = this, a = this.active;
    const waitUntil = fn => new Promise((resolve, reject) => { if (a.aborted) return reject(new Abort()); self.waiters.push({ fn, resolve, reject }); });
    const wait = s => { const end = G.time + s; return waitUntil(() => G.time >= end); };
    return {
      waitUntil, wait, P,
      from: a.from, retrying: a.retrying, get resume() { return a.snap ? a.snap.extra : null; }, // checkpoint to resume at, whether this run is a retry, the extra data the checkpoint was saved with
      // Every line ends after 4 s, on Enter or on a click on the subtitle. A retry skips the intro dialogue (it stays skipped until the first objective, so closing lines still play).
      async say(lines) {
        if (a.skipSay) return;
        for (const l of lines) { G.hud.subtitle(l, 4.2); self.skipFlag = false; self.skippable(true); const end = G.time + 4.0; await waitUntil(() => G.time >= end || G.input.once('Enter') || self.skipFlag); }
        self.skipFlag = false; self.skippable(false); G.hud.subtitle(null);
      },
      objective(text, notifyTitle = true) { a.skipSay = false; G.hud.setObjective(text); if (notifyTitle) G.hud.notify(`${T.newObjective}: ${text}`, 'obj'); },
      // Saves the retry point: player position, health, armor and weapons (money is never rolled back). Calling it again for the same checkpoint only refreshes the snapshot when extra data is passed.
      checkpoint(n, extra) {
        if (a.aborted || self.active !== a) return; if (a.snap && n === a.cp && extra === undefined) return;
        const fresh = !a.snap || n !== a.cp; a.cp = n;
        a.snap = { x: P.x, z: P.z, hp: P.health, armor: P.armor, weapon: P.weapon.id, weapons: structuredClone(P.weapons), weaponIds: [...P.weaponIds], extra: extra ?? null };
        if (fresh) G.hud.notify(T.checkpoint ?? 'Checkpoint', 'obj', 2);
      },
      marker(x, z, color = 0xffd34e, y = 0) { const m = self.makeMarker(x, z, color, true, y); self.objMarkers.push(m); return m; },
      clearMarkers() { self.clearMarkers(); },
      reach: (x, z, r = 4, o = {}) => waitUntil(() => { if (dist(P.x, P.z, x, z) > r) return false; if (o.vehicle && P.vehicle !== o.vehicle) return false; if (o.inVehicle && !P.vehicle) return false; if (o.stopped && P.vehicle && P.vehicle.speed > 1) return false; return true; }),
      timer(s, label) { self.timer = { end: G.time + s, label }; }, timedOut: () => self.timer && G.time >= self.timer.end, stopTimer() { self.timer = null; G.hud.clearTimer(); },
      spawnVehicle(type, x, z, heading, color) { const v = new Vehicle(type, color, x, z, heading); v.special = a.id; G.addVehicle(v); a.cleanup.push(() => { v.special = null; }); return v; },
      spawnPed(o) { const p = new Ped(G, { noDespawn: true, ...o }); p.mission = a.id; G.addPed(p); a.cleanup.push(() => { p.noDespawn = false; p.mission = null; }); return p; },
      reward(n) { a.earned += n; G.addMoney(n); G.hud.notify(`${T.reward}: ${fmtMoney(n)}`, 'cash'); },
      wanted: n => G.police.setLevel(n), fail: text => { throw Object.assign(new Abort(), { failText: text ?? null }); },
    };
  }
  name(id) { const m = T.m[id] || T[id]; return typeof m === 'string' ? m : (m?.name || id); }
  startVigilante() { if (this.active) return; this.vigLevel = 0; this.start('vigilante'); }
  laneSpot(bi, bj) { return { x: CITY.roadX(bi) + 26, z: CITY.roadZ(bj) + 5.25, heading: 0 }; }
  // ---------- mission scripts ----------
  async m_intro(c) {
    const m = T.m.intro, W = this.game.world, r = W.pois.ricky; await c.say(m.lines);
    let car = c.spawnVehicle('muscle', r.x + 16, r.z - 3.25, 0, 0xff4fa3); car.mission = true; c.objective(m.obj1); let mk = c.marker(car.x, car.z, 0x3ce8f5); mk.follow = car;
    // a car wrecked before the player takes it is replaced, so the mission cannot soft-lock
    await c.waitUntil(() => { if (car.wrecked && c.P.vehicle !== car) { car = c.spawnVehicle('muscle', r.x + 16, r.z - 3.25, 0, 0xff4fa3); car.mission = true; mk.follow = car; } return c.P.vehicle === car; }); c.clearMarkers(); mk = c.marker(W.pois.club.x, W.pois.club.z); c.objective(m.obj2);
    await c.reach(mk.x, mk.z, 7, { vehicle: car, stopped: true }); c.clearMarkers(); await c.say([m.done]); c.reward(500); this.game.hud.notify(T.hint.cops, 'dim', 7);
  }
  async m_taxi(c) {
    const m = T.m.taxi, G = this.game, W = G.world, P = c.P; await c.say(m.lines);
    const start = W.pois.taxi; const cab = P.vehicle && P.vehicle.type === 'taxi' ? P.vehicle : c.spawnVehicle('taxi', start.x + 14, start.z - 3.25, 0); c.objective(T.pressEnter, false);
    await c.waitUntil(() => P.vehicle);
    let pt; for (let i = 0; i < 40; i++) { pt = W.randomSidewalkPoint(); const d = dist(pt.x, pt.z, P.x, P.z); if (d > 120 && d < 320) break; }
    const pax = c.spawnPed({ kind: 'civ', x: pt.x, z: pt.z, state: 'idle' }); pax.stateT = 9999; let mk = c.marker(pt.x, pt.z, 0x3ce8f5); c.objective(m.obj1); c.timer(90, T.timeLeft);
    await c.waitUntil(() => c.timedOut() || (P.vehicle && dist(P.x, P.z, pt.x, pt.z) < 7 && P.vehicle.speed < 0.8)); if (c.timedOut()) c.fail(m.fail);
    G.removePed(pax); c.clearMarkers(); let dest; for (let i = 0; i < 40; i++) { dest = W.randomSidewalkPoint(); const d = dist(dest.x, dest.z, P.x, P.z); if (d > 200 && d < 450) break; }
    const dd = dist(dest.x, dest.z, P.x, P.z); mk = c.marker(dest.x, dest.z); c.objective(m.obj2); c.timer(30 + dd / 9, T.timeLeft);
    await c.waitUntil(() => c.timedOut() || (P.vehicle && dist(P.x, P.z, dest.x, dest.z) < 7 && P.vehicle.speed < 0.8)); if (c.timedOut()) c.fail(m.fail);
    c.stopTimer(); c.clearMarkers(); const out = c.spawnPed({ kind: 'civ', x: dest.x, z: dest.z }); out.noDespawn = false; this.taxiRuns++; await c.say([m.done]); c.reward(Math.round(200 + dd * 2.2));
  }
  async m_race(c) {
    const m = T.m.race, W = this.game.world, P = c.P; await c.say(m.lines);
    const ROUTES = [[[8, 2], [6, 2], [6, 4], [4, 4], [4, 6], [2, 6], [2, 3], [5, 3]], [[8, 3], [9, 5], [7, 7], [4, 7], [3, 5], [1, 5], [1, 2], [3, 2]], [[7, 1], [10, 1], [10, 6], [8, 6], [6, 5], [5, 2], [3, 1], [1, 1]]];
    const route = ROUTES[this.raceRoute % ROUTES.length]; this.raceRoute++; const cps = route.map(([i, j]) => ({ x: CITY.roadX(i), z: CITY.roadZ(j) })); const repeat = this.completed.has('race');
    if (!P.vehicle) { const car = c.spawnVehicle('sport', W.pois.dana.x + 14, W.pois.dana.z - 3.25, 0, 0x3ce8f5); c.objective(T.pressEnter, false); await c.waitUntil(() => P.vehicle); }
    c.objective(m.obj1); c.timer(105, T.timeLeft);
    for (let i = 0; i < cps.length; i++) { const cp = cps[i]; c.clearMarkers(); c.marker(cp.x, cp.z, 0x3ce8f5); this.game.hud.setObjective(`${m.obj1} (${i + 1}/${cps.length})`); await c.waitUntil(() => c.timedOut() || (P.vehicle && dist(P.x, P.z, cp.x, cp.z) < 9)); if (c.timedOut()) c.fail(m.fail); this.game.audio.pickup(); }
    c.stopTimer(); c.clearMarkers(); await c.say([m.done]); c.reward(repeat ? 1500 : 3000);
  }
  async m_repo(c) {
    const m = T.m.repo, W = this.game.world, G = this.game, P = c.P; await c.say(m.lines);
    const b = W.pois.bank, dk = W.pois.docks; let car, mk;
    if (c.from < 1) {
      car = c.spawnVehicle('sport', b.x + 18, b.z - 3.25, 0, 0xffd34e); car.parked = true; mk = c.marker(car.x, car.z, 0x3ce8f5); mk.follow = car; c.objective(m.obj1);
      await c.waitUntil(() => { if (car.wrecked && P.vehicle !== car) { car = c.spawnVehicle('sport', b.x + 18, b.z - 3.25, 0, 0xffd34e); car.parked = true; mk.follow = car; } return P.vehicle === car; }); c.clearMarkers();
    } else { // resumed from the checkpoint: a fresh sports car under the player, who is already behind the wheel
      car = c.spawnVehicle('sport', P.x, P.z, c.resume?.h ?? 0, 0xffd34e); P.enterVehicle(car);
    }
    c.checkpoint(1, c.from < 1 ? { h: car.heading } : undefined); c.wanted(2); G.hud.notify(T.wantedUp, 'warn'); // a resumed run keeps the snapshot it came from
    mk = c.marker(dk.x, dk.z, 0xffd34e, dk.y); c.objective(m.obj2);
    await c.waitUntil(() => { if (car.wrecked) c.fail(); return dist(P.x, P.z, dk.x, dk.z) < 8 && P.vehicle === car && car.speed < 1; });
    c.clearMarkers(); c.objective(m.obj3); await c.waitUntil(() => G.police.level === 0); await c.say([m.done]); c.reward(2500);
  }
  async m_cleanup(c) {
    const m = T.m.cleanup, W = this.game.world, G = this.game, P = c.P; await c.say(m.lines);
    const park = W.parks[0]; c.marker(park.cx, park.cz + 8); c.objective(m.obj1);
    const gang = []; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; gang.push(c.spawnPed({ kind: 'armed', team: 'gang', look: LOOKS.gang, x: park.cx + Math.cos(a) * 12, z: park.cz + Math.sin(a) * 12, hp: 90, weapon: i < 2 ? 'pistol' : 'smg', accuracy: 0.42, aggroRange: 42 })); }
    await c.reach(park.cx, park.cz + 8, 22); c.clearMarkers(); c.objective(m.obj2);
    for (const g of gang) g.hostile = true;
    await c.waitUntil(() => { const alive = gang.filter(g => !g.dead); G.hud.setObjective(`${m.obj2} (${T.targets}: ${alive.length})`); return alive.length === 0; });
    await c.say([m.done]); c.reward(1800);
  }
  async m_packages(c) {
    const m = T.m.packages, W = this.game.world, G = this.game, P = c.P; await c.say(m.lines);
    const pts = [[W.parks[1].cx, W.parks[1].cz], [W.pois.docks.x - 30, W.pois.docks.z, 1.0], [W.pois.hospital.x + 6, W.pois.hospital.z], [W.pois.dealer.x - 6, W.pois.dealer.z], [W.pois.safehouse.x + 8, W.pois.safehouse.z]];
    // resumed: only the packages still missing at the checkpoint come back, and the clock gets time for exactly those
    const rs = c.from >= 1 ? c.resume : null, left = new Set(rs?.left ?? [0, 1, 2, 3, 4]); let got = 5 - left.size;
    const items = [...left].map(i => { const [x, z, y] = pts[i]; const pk = G.pickups.add({ type: 'package', x, z, y: y || 0 }); pk.onCollect = () => { left.delete(i); got++; G.audio.pickup(); c.checkpoint(1, { left: [...left], tl: this.timer ? Math.max(0, this.timer.end - G.time) : 0 }); }; const mk = c.marker(x, z, 0xff9a3c, y || 0); pk.marker = mk; return pk; });
    this.active.cleanup.push(() => { for (const it of items) if (G.pickups.list.includes(it)) G.pickups.remove(it); });
    c.objective(m.obj1); c.timer(rs ? Math.max(rs.tl || 0, 40 + 40 * left.size) : 240, T.timeLeft);
    await c.waitUntil(() => { G.hud.setObjective(`${m.obj1} (${T.packages}: ${got}/5)`); for (const it of items) if (!G.pickups.list.includes(it) && it.marker) { G.scene.remove(it.marker.mesh); this.objMarkers = this.objMarkers.filter(o => o !== it.marker); it.marker = null; } return c.timedOut() || got >= 5; });
    if (got < 5) c.fail(m.fail); c.stopTimer(); c.clearMarkers(); await c.say([m.done]); c.reward(2200);
  }
  async m_pursuit(c) {
    const m = T.m.pursuit, G = this.game; await c.say(m.lines);
    if (c.from < 1) { c.objective(m.obj1); await c.waitUntil(() => G.police.level >= 3); } else c.wanted(3);
    c.checkpoint(1); c.objective(m.obj2); c.timer(90, T.timeLeft);
    await c.waitUntil(() => { if (G.police.level < 3) G.police.setLevel(3); return c.timedOut(); }); c.stopTimer(); c.objective(m.obj3);
    await c.waitUntil(() => G.police.level === 0); await c.say([m.done]); c.reward(3000);
  }
  async m_heist(c) {
    const m = T.m.heist, W = this.game.world, G = this.game, P = c.P; await c.say(m.lines);
    const b = W.pois.bank, dk = W.pois.docks;
    if (c.from < 1) {
      c.marker(b.x, b.z); c.objective(m.obj1); await c.reach(b.x, b.z, 6); c.clearMarkers();
      c.objective(m.obj2); c.wanted(3); c.timer(90, T.timeLeft); c.marker(b.x, b.z, 0xff5a5a); let paused = false;
      await c.waitUntil(() => { const far = dist(P.x, P.z, b.x, b.z) > 45; if (far && !paused) { paused = true; G.hud.notify(m.obj2, 'warn'); } if (far) { this.timer.end += this.dt || 0; } if (!far) paused = false; if (G.police.level < 3) G.police.setLevel(3); return c.timedOut(); });
      c.stopTimer(); c.clearMarkers();
    }
    c.wanted(4); if (c.from >= 1) this.carBeside(c, 'sport', 0x3ce8f5); // resumed: the vault is done, the heat is on and a getaway car waits beside the player
    c.checkpoint(1); c.marker(dk.x, dk.z, 0xffd34e, dk.y); c.objective(m.obj3);
    await c.reach(dk.x, dk.z, 9); c.clearMarkers(); await c.waitUntil(() => G.police.level === 0); await c.say([m.done]); c.reward(25000); G.hud.notify(T.m.heist.done, 'cash', 8);
  }
  async m_contract(c) {
    const m = T.contract, G = this.game, W = G.world, P = c.P; await c.say(m.lines);
    let pt; for (let i = 0; i < 50; i++) { pt = W.randomSidewalkPoint(); const d = dist(pt.x, pt.z, P.x, P.z); if (d > 220 && d < 480) break; }
    const target = c.spawnPed({ kind: 'civ', look: LOOKS.target, x: pt.x, z: pt.z, vip: true, hp: 120 });
    const guards = [0, 1].map(i => c.spawnPed({ kind: 'armed', team: 'gang', look: LOOKS.bodyguard, x: pt.x + (i ? 2 : -2), z: pt.z + 1, hp: 110, weapon: i ? 'smg' : 'pistol', accuracy: 0.5, aggroRange: 26 }));
    const mk = c.marker(pt.x, pt.z, 0xff5a5a); mk.follow = target; c.objective(m.obj1); c.timer(180, T.timeLeft);
    await c.waitUntil(() => c.timedOut() || target.dead); if (!target.dead) c.fail(m.fail);
    c.stopTimer(); c.clearMarkers(); for (const g of guards) if (!g.dead) g.hostile = false; this.contracts++; await c.say([m.done]); c.reward(Math.min(2500 + 400 * (this.contracts - 1), 6000));
  }
  async m_vigilante(c) {
    const G = this.game, W = G.world, P = c.P; const car = P.vehicle; let lastIn = G.time;
    const leftCar = () => { if (P.vehicle === car) lastIn = G.time; return G.time - lastIn > 15; };
    while (true) {
      let p; for (let i = 0; i < 40; i++) { p = W.randomLanePoint(); const d = dist(p.x, p.z, P.x, P.z); if (d > 110 && d < 230) break; }
      const type = ['sedan', 'sport', 'muscle', 'suv'][Math.floor(Math.random() * 4)]; const v = c.spawnVehicle(type, p.x, p.z, p.heading, 0x9b2335); v.ai = { mode: 'traffic', cruise: 15 + this.vigLevel * 1.5, blocked: 0, panic: 1e9, lane: p.lane }; acquireLane(v, W); v.vx = v.fx * 10; v.vz = v.fz * 10;
      const mk = c.marker(v.x, v.z, 0xff5a5a); mk.follow = v; c.objective(T.vigilanteObj); c.timer(150, T.timeLeft); let driver = null;
      await c.waitUntil(() => { if (c.timedOut()) c.fail(T.vigilanteFail); if (leftCar()) return true; if (driver) return driver.dead;
        if (v.wrecked) return true; if (v.speed < 1.5 && dist(v.x, v.z, P.x, P.z) < 14) { const s = v.seatPosition(1); driver = c.spawnPed({ kind: 'armed', team: 'gang', look: LOOKS.gang, x: s.x, z: s.z, hp: 80, weapon: 'pistol', accuracy: 0.4, hostile: true }); v.ai = null; v.parked = true; mk.follow = driver; } return false; });
      c.stopTimer(); c.clearMarkers(); if (leftCar()) break;
      this.vigLevel++; c.reward(Math.min(400 + 300 * this.vigLevel, 3500)); G.hud.notify(`${T.vigilanteDone} ${this.vigLevel}`, 'cash'); await c.wait(2);
    }
  }
  save() { return { completed: [...this.completed], taxiRuns: this.taxiRuns, raceRoute: this.raceRoute, contracts: this.contracts }; }
  load(s) { this.completed = new Set(s.completed || []); this.taxiRuns = s.taxiRuns || 0; this.raceRoute = s.raceRoute || 0; this.contracts = s.contracts || 0; this.vigLevel = 0; this.retry = null; this.endDuck(); }
}

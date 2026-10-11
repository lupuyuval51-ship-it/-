import * as THREE from '../vendor/three.module.min.js';
import { Vehicle } from './vehicle.js';
import { Ped } from './peds.js';
import { LOOKS } from './character.js';
import { steerToward, acquireLane, pursue } from './traffic.js';
import { dist, clamp, damp } from './utils.js';
import { T } from './i18n.js';

const CARS_PER_LEVEL = [0, 2, 3, 4, 6, 8], COPS_PER_LEVEL = [0, 2, 4, 6, 8, 10];

export class Police {
  constructor(game) { this.game = game; this.level = 0; this.heat = 0; this.lastSeen = 0; this.spawnT = 0; this.heli = null; this.copSpawnT = 0; this.hidden = false; this.noticeT = 0; }
  get cars() { return this.game.vehicles.filter(v => v.ai && (v.ai.mode === 'police' || v.ai.mode === 'deployed') && !v.wrecked); }
  get cops() { return this.game.peds.filter(p => (p.team === 'cop' || p.team === 'swat') && !p.dead && !p.station); }
  copsNear(x, z, r) { for (const v of this.game.vehicles) if (v.type === 'police' && !v.wrecked && dist(v.x, v.z, x, z) < r) return true; for (const p of this.cops) if (dist(p.x, p.z, x, z) < r) return true; return false; }
  // A job ambulance or fire truck is on duty while the player drives it with its siren on (jobs.js marks it special 'job'): no cop starts a pursuit for it, and its driving is not a crime
  onDuty() { const v = this.game.player.vehicle; return !!(v && v.special === 'job' && v.siren && v.spec?.emergency); }
  reportCrime(type, x, z, extra) {
    if ((type === 'runover' || type === 'witness') && this.onDuty()) return; // emergency driving on duty: nobody reports it
    const near = this.copsNear(x, z, 75) || this.level > 0;
    const table = { kill: 1, killcop: 1.6, runover: extra ? 1 : 0.5, carjack: near ? 0.6 : 0.15, gunfire: near ? 0.5 : 0.1, hitcop: 1, explosion: near ? 1.2 : 0.6, shootcar: near ? 0.4 : 0.05 };
    const add = table[type] ?? 0.3; if (!add) return; this.heat += add; this.lastSeen = this.game.time;
    if (this.heat >= 1) { const n = Math.floor(this.heat); this.heat -= n; this.setLevel(this.level + n); }
  }
  setLevel(n) { n = clamp(n, 0, 5); if (n === this.level) return; const up = n > this.level; this.level = n; this.lastSeen = this.game.time; if (up) this.lastPos = { x: this.game.player.x, z: this.game.player.z }; if (up) { this.game.audio.wanted(); this.game.hud.flashStars(); } if (n === 0) this.clearForces(); }
  clear() { this.level = 0; this.heat = 0; this.clearForces(); }
  clearForces() {
    for (const v of this.cars) { v.siren = false; if (v.ai.mode === 'deployed') v.ai.mode = 'police'; v.ai = { mode: 'patrol', cruise: 13, blocked: 0, panic: 0 }; acquireLane(v, this.game.world); }
    for (const p of this.cops) { p.state = 'leave'; p.kind = 'civ'; p.team = null; p.pickWaypoint(); }
    this.removeHeli();
  }
  update(dt) {
    const G = this.game, P = G.player, t = G.time; this.heat = Math.max(0, this.heat - dt * 0.01);
    if (this.level === 0) { G.audio.siren(0); G.audio.heli(0); return; }
    // are we seen? An emergency vehicle on duty is not seen at all (onDuty). Indoors the walls hide the player: only people close by see him or her; the distance tests ignore walls, so they shrink there
    let seen = false; const px = P.x, pz = P.z, duty = this.onDuty(), indoor = G.world.interiorAt(px, pz) !== null;
    if (!duty) {
      for (const v of this.cars) { const d = dist(v.x, v.z, px, pz); if (d < (indoor ? 14 : 60) || (d < 110 && G.grid.raycast(v.x, 1.2, v.z, (px - v.x) / d, 0, (pz - v.z) / d, d) >= d - 1)) { seen = true; break; } }
      if (!seen) for (const p of this.cops) { const d = dist(p.x, p.z, px, pz); if (d < (indoor ? 10 : 45) || (d < 90 && p.hasLOS(px, 1.2, pz))) { seen = true; break; } }
    }
    // the helicopter only counts as a witness while its line down to the player is open (a street canyon or a roof breaks it)
    if (!duty && this.heli && this.heli.hasTrack) { const hp = this.heli.group.position, hd = Math.hypot(hp.x - px, hp.z - pz); if (hd < 40) { const ty = P.vehicle ? 1.6 : 1.4, dx = px - hp.x, dy = ty - hp.y, dz = pz - hp.z, len = Math.hypot(dx, dy, dz) || 1; if (G.grid.raycast(hp.x, hp.y, hp.z, dx / len, dy / len, dz / len, len) >= len - 1.5) seen = true; } }
    if (seen) { this.lastSeen = t; this.lastPos = { x: px, z: pz }; } this.hidden = !seen; if (this.heli) this.heli.hasTrack = seen || (t - this.lastSeen < 6);
    if (t - this.lastSeen > 20) { this.lastSeen = t; this.setLevel(this.level - 1); if (this.level === 0) G.hud.notify(T.evaded); }
    // patrol cars join the pursuit when close
    if (!duty) for (const v of G.vehicles) if (v.ai && v.ai.mode === 'patrol' && dist(v.x, v.z, px, pz) < 90 && (() => { const d = dist(v.x, v.z, px, pz) || 1; return G.grid.raycast(v.x, 1.2, v.z, (px - v.x) / d, 0, (pz - v.z) / d, d) >= d - 1; })()) { v.ai = { mode: 'police', cruise: 40, deployed: false, stuck: 0, rev: 0, lane: v.ai.lane ?? 0 }; acquireLane(v, G.world); v.siren = true; }
    // spawn pursuit cars
    const cars = this.cars; this.spawnT -= dt;
    if (!duty && cars.length < CARS_PER_LEVEL[this.level] && this.spawnT <= 0) { this.spawnT = 2.2; this.spawnCar(); }
    // drive pursuit cars
    let nearest = 999;
    for (const v of cars) {
      const d = dist(v.x, v.z, px, pz); nearest = Math.min(nearest, d); const ai = v.ai;
      if (ai.mode === 'deployed') { v.input.throttle = 0; v.input.brake = true; v.siren = true; if (d > 60) { ai.mode = 'police'; ai.deployed = false; ai.direct = true; } continue; }
      const inCar = !!P.vehicle; const lp = this.lastPos || { x: px, z: pz };
      const tx = this.hidden ? lp.x : (inCar ? px + P.vehicle.vx * 0.7 : px), tz = this.hidden ? lp.z : (inCar ? pz + P.vehicle.vz * 0.7 : pz);
      if (ai.rev > 0) { ai.rev -= dt; v.input.throttle = -1; v.input.steer = ai.revSteer; v.input.brake = false; continue; }
      if (v.speed < 1 && d > 10) { ai.stuck += dt; if (ai.stuck > 1.6) { ai.stuck = 0; ai.rev = 1.2; ai.revSteer = Math.random() < 0.5 ? 1 : -1; ai.direct = true; } } else ai.stuck = 0;
      const stopDist = inCar ? (P.vehicle.speed < 2 ? 7 : 0) : 9;
      if (d < stopDist + 2 && (!inCar || P.vehicle.speed < 2)) { steerToward(v, tx, tz, 0, dt); if (!ai.deployed && d < 16) { ai.deployed = true; ai.mode = 'deployed'; this.deploy(v); } }
      else pursue(v, G, dt, tx, tz, d < 25 ? 30 : 46);
    }
    // foot cops top-up near the player when they are on foot
    this.copSpawnT -= dt; const copsN = this.cops.length;
    if (copsN < COPS_PER_LEVEL[this.level] && this.copSpawnT <= 0 && !P.vehicle) { this.copSpawnT = 4; const c = cars.find(v => dist(v.x, v.z, px, pz) < 40); if (c) this.spawnCop(c.x + (Math.random() - 0.5) * 4, c.z + (Math.random() - 0.5) * 4, c.type === 'swat'); }
    // helicopter
    if (this.level >= 4) { if (!this.heli) this.makeHeli(); this.updateHeli(dt); } else if (this.heli) this.removeHeli();
    G.audio.siren(clamp(1 - nearest / 160, 0, 1));
  }
  spawnCar() {
    const G = this.game, W = G.world, P = G.player; const camF = G.cameraForward();
    for (let tries = 0; tries < 14; tries++) {
      // while the player is hidden, reinforcements gather where they were last seen
      const anchor = this.hidden && this.lastPos ? this.lastPos : P;
      const p = W.randomLanePoint(); const d = dist(p.x, p.z, anchor.x, anchor.z); if (d < 70 || d > 190) continue;
      const dp = dist(p.x, p.z, P.x, P.z) || 1; const ahead = ((p.x - P.x) * camF.x + (p.z - P.z) * camF.z) / dp;
      if (ahead > 0.4 && dp < 200 && !(P.vehicle && P.vehicle.speed > 8 && dp > 120)) continue;
      let ok = true; for (const o of G.vehicles) if (dist(o.x, o.z, p.x, p.z) < 12) { ok = false; break; } if (!ok) continue;
      const v = new Vehicle(this.level >= 5 && Math.random() < 0.5 ? 'swat' : 'police', null, p.x, p.z, p.heading); v.ai = { mode: 'police', cruise: 40, deployed: false, stuck: 0, rev: 0, lane: p.lane, seg: p.seg, dir: p.dir, L: p.L }; v.siren = true; v.vx = v.fx * 12; v.vz = v.fz * 12; G.addVehicle(v); return v;
    }
  }
  deploy(v) { const n = this.level >= 3 ? 2 : 1; for (let i = 0; i < n; i++) { const s = v.seatPosition(i === 0 ? 1 : -1); this.spawnCop(s.x, s.z, v.type === 'swat'); } }
  spawnCop(x, z, swat = false) {
    const G = this.game; if (this.cops.length >= COPS_PER_LEVEL[this.level] + 2) return; if (G.world.interiorAt(x, z) !== null) return; // no cop is born inside a shop
    const p = new Ped(G, { kind: 'armed', team: swat ? 'swat' : 'cop', look: swat ? LOOKS.swat : LOOKS.cop, x, z, hp: swat ? 170 : 100, weapon: swat ? 'rifle' : (this.level >= 3 && Math.random() < 0.4 ? 'smg' : 'pistol'), accuracy: swat ? 0.62 : 0.5, hostile: true });
    G.addPed(p); return p;
  }
  // The searchlight is Game.heliSpot, a permanent scene light, so the scene's light count never changes. It rides in the helicopter group while one flies and goes back to the scene (intensity 0) afterwards.
  removeHeli() {
    const G = this.game, h = this.heli; if (!h) return;
    G.scene.remove(h.group); this.heli = null; G.audio.heli(0);
    const s = G.heliSpot; if (s) { s.intensity = 0; s.position.set(0, 0, 0); s.target.position.set(0, 0, 0); G.scene.add(s); G.scene.add(s.target); }
  }
  makeHeli() {
    const G = this.game; const g = new THREE.Group(); const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.5, metalness: 0.5 }); const blue = new THREE.MeshStandardMaterial({ color: 0x2b4a8c, roughness: 0.5, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 2), blue); body.castShadow = true; g.add(body); const nose = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), new THREE.MeshStandardMaterial({ color: 0x0f1c2c, roughness: 0.1, metalness: 0.8 })); nose.position.set(2.6, 0.1, 0); g.add(nose);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 0.5), dark); tail.position.set(-4.2, 0.4, 0); g.add(tail); const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.2), blue); fin.position.set(-6.4, 1.0, 0); g.add(fin);
    const skidL = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.12), dark); skidL.position.set(0, -1.3, 0.9); g.add(skidL); const skidR = skidL.clone(); skidR.position.z = -0.9; g.add(skidR);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(11, 0.08, 0.35), dark); rotor.position.y = 1.15; g.add(rotor); const rotor2 = rotor.clone(); rotor2.rotation.y = Math.PI / 2; g.add(rotor2);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.2), dark); tr.position.set(-6.4, 0.6, 0.4); g.add(tr);
    // the searchlight is created once by Game (no light is made at run time); it rides in the helicopter group with its target
    const spot = G.heliSpot; spot.intensity = 2500; spot.position.set(1.5, -0.9, 0); g.add(spot); g.add(spot.target);
    const beamGeo = new THREE.ConeGeometry(9, 32, 16, 1, true); beamGeo.translate(0, -16, 0); const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })); beam.position.set(1.5, -0.9, 0); g.add(beam);
    g.position.set(G.player.x + 40, 34, G.player.z + 40); G.scene.add(g);
    this.heli = { group: g, rotors: [rotor, rotor2, tr], spot, beam, ang: 0, shootT: 3, x: g.position.x, z: g.position.z, hp: 400, hasTrack: true };
  }
  updateHeli(dt) {
    const G = this.game, P = G.player, h = this.heli, g = h.group; h.ang += dt * 0.35; const R = 22; const lp = this.lastPos || { x: P.x, z: P.z }; const fx = lp.x, fz = lp.z; // flies to where the player was last seen, which is the live position only while someone has eyes on them
    const tx = fx + Math.cos(h.ang) * R, tz = fz + Math.sin(h.ang) * R; g.position.x = damp(g.position.x, tx, 1.2, dt); g.position.z = damp(g.position.z, tz, 1.2, dt); g.position.y = damp(g.position.y, 30 + Math.sin(h.ang * 2) * 2, 1, dt);
    const dx = fx - g.position.x, dz = fz - g.position.z; g.rotation.y = Math.atan2(-dz, dx); g.rotation.z = -0.12; for (const r of h.rotors) r.rotation.y += dt * 40;
    const th = g.rotation.y, lx = dx * Math.cos(th) - dz * Math.sin(th), lz = dx * Math.sin(th) + dz * Math.cos(th); h.spot.target.position.set(lx, 1 - g.position.y, lz); const beamLen = g.position.y; h.beam.scale.set(1, beamLen / 32, 1); h.beam.lookAt(fx, 0, fz); h.beam.rotateX(-Math.PI / 2);
    // gunner
    h.shootT -= dt; const d = Math.hypot(dx, dz);
    if (this.level >= 5 && h.hasTrack && h.shootT <= 0 && d < 60) { h.shootT = Math.random() < 0.5 ? 0.12 : 1.8; const hit = Math.random() < (P.vehicle ? 0.22 : 0.3); const tx2 = P.x + (hit ? 0 : (Math.random() - 0.5) * 4), tz2 = P.z + (hit ? 0 : (Math.random() - 0.5) * 4); G.fx.tracer(g.position.x + 1.5, g.position.y - 1, g.position.z, tx2, 0.5, tz2); G.audio.shot('rifle', d); if (hit) { if (P.vehicle) P.vehicle.damage(10, 'gun'); P.damage(P.vehicle ? 4 : 9, g.position.x, g.position.z); } else G.fx.sparks(tx2, 0.2, tz2, 3); }
    G.audio.heli(clamp(1 - d / 90, 0.15, 1));
  }
  save() { return { level: this.level }; }
}

import * as THREE from '../vendor/three.module.min.js';
import { CITY, WEAPONS } from './config.js';
import { makeCharacter, randomLook, LOOKS } from './character.js';
import { clamp, damp, wrapAngle, angleLerp, dist, disposeGeometries } from './utils.js';

const HALF = CITY.road / 2, WALK = 1.5, RUN = 5.6;
const _tmp = [];
let pedId = 1;

export class Ped {
  constructor(game, o) {
    this.game = game; this.id = pedId++; this.kind = o.kind || 'civ'; this.team = o.team || null; // 'cop' | 'swat' | 'gang'
    this.look = o.look || randomLook(); this.char = makeCharacter(this.look); this.mesh = this.char.group; game.scene.add(this.mesh);
    this.x = o.x; this.z = o.z; this.y = 0; this.vy = 0; this.yaw = o.yaw ?? Math.random() * 6.28; this.hp = o.hp ?? 100; this.maxHp = this.hp; this.dead = false; this.ragdoll = null; this.deadT = 0;
    this.state = o.state || 'walk'; this.stateT = 0; this.wp = null; this.prevWp = null; this.fleeFrom = null; this.speed = 0; this.moveDir = 0;
    this.weapon = o.weapon ? WEAPONS.find(w => w.id === o.weapon) : null; if (this.weapon) this.char.setGun(true, this.weapon.id === 'rifle' || this.weapon.id === 'shotgun' || this.weapon.id === 'sniper' ? 'long' : 'pistol');
    this.shootT = 1 + Math.random(); this.accuracy = o.accuracy ?? 0.5; this.hostile = !!o.hostile; this.stationX = o.x; this.stationZ = o.z; this.aggroRange = o.aggroRange ?? 45; this.bustT = 0; this.blockedT = 0;
    this.punchT = 0; this.mission = o.mission || null; this.noDespawn = !!o.noDespawn; this.fromVehicle = o.fromVehicle || null; this.station = !!o.station; this.vip = !!o.vip;
    this.mesh.position.set(this.x, 0, this.z); this.mesh.rotation.y = this.yaw;
    if (this.kind === 'civ') this.pickWaypoint();
  }
  get pos() { return { x: this.x, y: this.y + 1.1, z: this.z }; }
  // ---------- sidewalk navigation ----------
  pickWaypoint() {
    const W = this.game.world; let best = null, bd = Infinity;
    for (let bj = 0; bj < CITY.gridZ; bj++) for (let bi = 0; bi < CITY.gridX; bi++) for (const cx of [0, 1]) for (const cz of [0, 1]) { const p = W.sidewalkCorner(bi, bj, cx, cz); const d = (p.x - this.x) ** 2 + (p.z - this.z) ** 2; if (d < bd) { bd = d; best = { bi, bj, cx, cz, ...p }; } }
    this.wp = best; this.prevWp = null;
  }
  nextWaypoint() {
    const w = this.wp; const opts = [];
    opts.push({ bi: w.bi, bj: w.bj, cx: 1 - w.cx, cz: w.cz, w: 3 }); opts.push({ bi: w.bi, bj: w.bj, cx: w.cx, cz: 1 - w.cz, w: 3 });
    const nbi = w.bi + (w.cx ? 1 : -1), nbj = w.bj + (w.cz ? 1 : -1);
    if (nbi >= 0 && nbi < CITY.gridX) opts.push({ bi: nbi, bj: w.bj, cx: 1 - w.cx, cz: w.cz, w: 1.2 }); if (nbj >= 0 && nbj < CITY.gridZ) opts.push({ bi: w.bi, bj: nbj, cx: w.cx, cz: 1 - w.cz, w: 1.2 });
    const filtered = opts.filter(o => !(this.prevWp && o.bi === this.prevWp.bi && o.bj === this.prevWp.bj && o.cx === this.prevWp.cx && o.cz === this.prevWp.cz));
    const list = filtered.length ? filtered : opts; const tot = list.reduce((s, o) => s + o.w, 0); let r = Math.random() * tot; let c = list[0]; for (const o of list) { r -= o.w; if (r <= 0) { c = o; break; } }
    this.prevWp = w; this.wp = { ...c, ...this.game.world.sidewalkCorner(c.bi, c.bj, c.cx, c.cz) };
  }
  // ---------- damage ----------
  hit(dmg, dirx, dirz, source) {
    if (this.dead) return; this.hp -= dmg; const G = this.game; G.fx.blood(this.x, 1.1, this.z, 6);
    if (this.hp <= 0) { this.die(dirx, dirz, source); return; }
    if (this.kind === 'civ') this.flee(this.x - dirx * 5, this.z - dirz * 5, 8); else if (!this.hostile) { this.hostile = true; }
  }
  die(dirx = 0, dirz = 0, source) {
    if (this.dead) return; this.dead = true; this.deadT = 0; this.state = 'dead'; this.deadDir = (Math.random() < 0.5 ? 1 : -1); const G = this.game;
    if (this.vehicle) { this.vehicle = null; }
    if (source === 'player' || source === 'playercar') { G.stats.kills++; if (source === 'player') { if (this.team === 'cop' || this.team === 'swat') G.police.reportCrime('killcop', this.x, this.z); else if (this.kind === 'civ') G.police.reportCrime('kill', this.x, this.z); } }
    if (this.kind === 'civ' && Math.random() < 0.55) G.addPickup({ type: 'cash', amount: 10 + Math.floor(Math.random() * 90), x: this.x + (Math.random() - 0.5), z: this.z + (Math.random() - 0.5) });
    if ((this.team === 'cop' || this.team === 'gang') && Math.random() < 0.6) G.addPickup({ type: 'ammo', weapon: this.weapon?.id || 'pistol', amount: 12, x: this.x + (Math.random() - 0.5), z: this.z + (Math.random() - 0.5) });
    G.alert(this.x, this.z, 18, 'death'); this.onDeath?.(this);
  }
  launch(vx, vy, vz) { if (this.dead) return; this.ragdoll = { vx, vy, vz, spin: (Math.random() - 0.5) * 8 }; this.state = 'ragdoll'; this.y = Math.max(this.y, 0.1); }
  hitByCar(v) {
    const sp = v.speed; if (sp < 2.5 || this.ragdoll) return false;
    const dmg = sp * 9; const G = this.game; this.hp -= dmg; G.fx.blood(this.x, 1, this.z, 8); this.launch(v.vx * 0.75, 3 + sp * 0.25, v.vz * 0.75);
    if (this.hp <= 0) { this.die(v.vx, v.vz, v.driver === G.player ? 'playercar' : 'car'); }
    if (v.driver === G.player) G.police.reportCrime(this.team === 'cop' || this.team === 'swat' ? 'killcop' : 'runover', this.x, this.z, this.hp <= 0);
    G.audio.impact(sp, dist(this.x, this.z, G.player.x, G.player.z)); v.damage(1, 'ped'); return true;
  }
  flee(fx, fz, t = 7) { if (this.dead || this.kind !== 'civ') return; this.state = 'flee'; this.fleeFrom = { x: fx, z: fz }; this.stateT = t; }
  scare(x, z, r) { if (this.kind !== 'civ' || this.dead) return; if (dist(x, z, this.x, this.z) < r) this.flee(x, z, 6 + Math.random() * 4); }
  // ---------- update ----------
  update(dt) {
    const G = this.game, P = G.player;
    if (this.dead) { this.deadT += dt; this.char.animate(dt, { dead: true, deadDir: this.deadDir }); this.mesh.position.set(this.x, this.y, this.z); if (this.deadT > 14 && !this.noDespawn) G.removePed(this); return; }
    if (this.ragdoll) {
      const r = this.ragdoll; this.x += r.vx * dt; this.z += r.vz * dt; this.y += r.vy * dt; r.vy -= 14 * dt; r.vx *= 0.99; r.vz *= 0.99; this.mesh.rotation.x += r.spin * dt;
      if (this.y <= 0) { this.y = 0; this.ragdoll = null; this.mesh.rotation.x = 0; if (!this.dead) { this.state = 'flee'; this.stateT = 6; this.fleeFrom = { x: P.x, z: P.z }; } }
      this.collideStatic(); this.mesh.position.set(this.x, this.y, this.z); return;
    }
    this.punchT = Math.max(0, this.punchT - dt);
    let tx = null, tz = null, spd = 0;
    if (this.kind === 'civ') {
      if (this.state === 'flee') { this.stateT -= dt; if (this.vip) { this.fleeFrom = { x: P.x, z: P.z }; } const dx = this.x - this.fleeFrom.x, dz = this.z - this.fleeFrom.z, d = Math.hypot(dx, dz) || 1; tx = this.x + dx / d * 10; tz = this.z + dz / d * 10; spd = this.vip ? RUN * 1.15 : RUN; if (this.stateT <= 0 || d > (this.vip ? 90 : 60)) { this.state = 'walk'; this.pickWaypoint(); } }
      else if (this.state === 'idle') { this.stateT -= dt; if (this.stateT <= 0) this.state = 'walk'; }
      else { if (this.vip && dist(this.x, this.z, P.x, P.z) < 32) { this.flee(P.x, P.z, 10); } if (!this.wp) this.pickWaypoint(); const d = dist(this.x, this.z, this.wp.x, this.wp.z); if (d < 1.2) { if (Math.random() < 0.12) { this.state = 'idle'; this.stateT = 2 + Math.random() * 5; } this.nextWaypoint(); } tx = this.wp.x; tz = this.wp.z; spd = WALK; }
    } else { // armed AI
      const px = P.x, pz = P.z, d = dist(this.x, this.z, px, pz); const wanted = G.police.level;
      const engaged = this.team === 'gang' ? (this.hostile || d < this.aggroRange) : (wanted > 0 && d < 150);
      if (!engaged) { // cops idle / gang loiter near station
        const sd = dist(this.x, this.z, this.stationX, this.stationZ); if (sd > 3) { tx = this.stationX; tz = this.stationZ; spd = WALK; } else this.faceTo(px, pz, dt, 2);
      } else {
        const los = this.hasLOS(px, 1.2, pz); const inCar = !!P.vehicle; const isCop = this.team === 'cop' || this.team === 'swat';
        const keep = isCop ? (inCar ? 6 : (wanted >= 3 || P.weapon.id !== 'fist' ? 7 : 0.9)) : 9;
        if (d > keep + 0.5) { tx = px; tz = pz; spd = RUN; } else if (d < keep - 2 && d > 1.5) { const dx = this.x - px, dz = this.z - pz, l = Math.hypot(dx, dz) || 1; tx = this.x + dx / l * 3; tz = this.z + dz / l * 3; spd = WALK; }
        if (!spd) this.faceTo(px, pz, dt, 8);
        // arrest
        if (isCop && !P.dead && d < 1.8 && (!inCar || P.vehicle.speed < 1.2)) { this.bustT += dt; if (this.bustT > (inCar ? 1.6 : 0.7)) G.bust(); } else this.bustT = 0;
        // shooting
        const canShoot = this.weapon && (this.team !== 'cop' || wanted >= 2 || P.weapon.id !== 'fist') && d < this.weapon.range * 0.6 && los && d > 1.2;
        this.shootT -= dt;
        if (canShoot && this.shootT <= 0) { this.shootT = this.weapon.auto ? (Math.random() < 0.35 ? 1.3 : 0.2) : 1.1 + Math.random() * 0.8; this.shootAt(P, d); }
        else if (!this.weapon && d < 1.6 && this.punchT <= 0 && !inCar) { this.punchT = 0.8; P.damage(8, this.x, this.z); G.audio.shot('punch', d); }
      }
    }
    // steering + movement
    if (tx !== null) {
      const dx = tx - this.x, dz = tz - this.z, l = Math.hypot(dx, dz);
      if (l > 0.05) { const want = Math.atan2(dx, dz); this.yaw = angleLerp(this.yaw, want, Math.min(1, dt * 10)); this.speed = damp(this.speed, spd, 8, dt); this.x += Math.sin(this.yaw) * this.speed * dt; this.z += Math.cos(this.yaw) * this.speed * dt; }
    } else this.speed = damp(this.speed, 0, 10, dt);
    this.collideStatic(); this.collideVehicles();
    const B = G.world.bounds; this.x = clamp(this.x, B.minX, B.maxX); this.z = clamp(this.z, B.minZ, B.maxZ);
    // pier height
    const pier = G.world.pier; this.y = (this.x > pier.x0 && this.x < pier.x1 && Math.abs(this.z - pier.z) < 4.6) ? pier.y : 0;
    this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw;
    this.char.animate(dt, { moving: this.speed > 0.3, speed: clamp(this.speed / RUN, 0, 1), aiming: this.weapon && this.kind !== 'civ' && this.state !== 'walk' && tx === null, long: this.weapon && (this.weapon.id === 'rifle' || this.weapon.id === 'shotgun'), punch: this.punchT > 0 ? 1 - this.punchT / 0.8 : 0 });
  }
  faceTo(x, z, dt, k) { this.yaw = angleLerp(this.yaw, Math.atan2(x - this.x, z - this.z), Math.min(1, dt * k)); }
  hasLOS(x, y, z) { const dx = x - this.x, dy = y - 1.4, dz = z - this.z, d = Math.hypot(dx, dy, dz) || 1; return this.game.grid.raycast(this.x, 1.4, this.z, dx / d, dy / d, dz / d, d) >= d - 0.3; }
  shootAt(P, d) {
    const G = this.game, w = this.weapon; const gx = this.x + Math.sin(this.yaw) * 0.4, gz = this.z + Math.cos(this.yaw) * 0.4, gy = 1.35;
    const moving = P.vehicle ? P.vehicle.speed / 12 : P.speedNorm; const acc = clamp(this.accuracy - d / 70 - moving * 0.35, 0.06, 0.75);
    const hit = Math.random() < acc; const tx = P.x + (hit ? 0 : (Math.random() - 0.5) * 3), tz = P.z + (hit ? 0 : (Math.random() - 0.5) * 3), ty = 1.0 + (hit ? 0 : (Math.random() - 0.5) * 2);
    const dx = tx - gx, dy = ty - gy, dz = tz - gz, l = Math.hypot(dx, dy, dz) || 1;
    G.fx.muzzle(gx, gy, gz, dx / l, dy / l, dz / l); G.fx.tracer(gx, gy, gz, tx, ty, tz); G.audio.shot(w.id, d); G.alert(this.x, this.z, 30, 'gunfire', this);
    if (hit) { if (P.vehicle) { P.vehicle.damage(w.dmg * 0.5, 'gun'); P.damage(w.dmg * 0.2, this.x, this.z); G.fx.sparks(tx, 0.9, tz, 4); } else { P.damage(w.dmg * 0.45, this.x, this.z); } }
    else if (Math.random() < 0.5) G.fx.sparks(tx, Math.max(0.1, ty), tz, 3, 3);
  }
  collideStatic() { const h = this.game.grid.circleHit(this.x, this.z, 0.36, _tmp); if (h) { this.x += h.nx * h.depth; this.z += h.nz * h.depth; this.blockedT += 0.016; if (this.blockedT > 2.5 && this.kind === 'civ') { this.blockedT = 0; this.nextWaypoint(); } } else this.blockedT = Math.max(0, this.blockedT - 0.016); }
  collideVehicles() {
    for (const v of this.game.vehicles) {
      if (Math.abs(v.x - this.x) > 8 || Math.abs(v.z - this.z) > 8) continue;
      if (v.contains(this.x, this.z, 0.35)) {
        if (this.hitByCar(v)) return;
        // push out sideways from the car's centre line
        const dx = this.x - v.x, dz = this.z - v.z; const lf = dx * v.fx + dz * v.fz, lr = dx * -v.fz + dz * v.fx; const rx = -v.fz, rz = v.fx;
        const wantR = (v.spec.wid / 2 + 0.4) * Math.sign(lr || 1), wantF = (v.spec.len / 2 + 0.4) * Math.sign(lf || 1);
        if (Math.abs(wantR) - Math.abs(lr) < Math.abs(wantF) - Math.abs(lf)) { this.x = v.x + v.fx * lf + rx * wantR; this.z = v.z + v.fz * lf + rz * wantR; } else { this.x = v.x + v.fx * wantF + rx * lr; this.z = v.z + v.fz * wantF + rz * lr; }
        if (this.kind === 'civ' && v.speed > 1) this.flee(v.x, v.z, 4);
      }
    }
  }
  dispose() { this.game.scene.remove(this.mesh); disposeGeometries(this.mesh); }
}

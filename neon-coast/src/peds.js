import * as THREE from '../vendor/three.module.min.js';
import { CITY, WEAPONS } from './config.js';
import { makeCharacter, randomLook, crewLook } from './character.js';
import { clamp, damp, wrapAngle, angleLerp, dist } from './utils.js';

const HALF = CITY.road / 2, WALK = 1.5, RUN = 5.6;
const _tmp = [];
let pedId = 1;
// wardrobe context of a new civilian: the beach zone, the hour of the day and rain (Game.spawnPeds may pass its own as o.ctx or hand over a ready look)
function lookContext(game, x) { return { zone: x > CITY.beachX - 1 ? 'beach' : 'city', hour: Number.isFinite(game.clock) ? (game.clock / 60) % 24 : 12, rain: (game.rainLevel || 0) > 0.25 }; }
// pose requests handed to Character.animate: module-level scratch objects, nothing is allocated per frame
const _anim = { v: 0, grounded: true, vy: 0, moveYaw: 0, yaw: 0, yawRate: 0, aiming: false, aimPitch: 0, long: false, punch: 0, melee: 'fist', reload: -1, lookAt: null };
const _look = { x: 0, z: 0 }, _dead = { dead: true, deadDir: 1 }, _rag = { dead: false, rag: 1, getUp: 0 };
// Launch ragdoll: the body is one rigid capsule from the feet to the head (1.75 m, radius 0.16) integrated in steps of at most 1/60 s. Both ends are tested against World.groundY;
// a contact pushes out, bounces with restitution 0.25 and slides with Coulomb friction 0.6 (impulses with a scalar inertia, so a hit at one end makes the body tumble).
const GRAV = 14, CAP_R = 0.16, CAP_CM = 0.875, REST_E = 0.25, FRICTION = 0.6, INERTIA = 0.26, GETUP_T = 0.9;
const _qa = new THREE.Quaternion(), _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _vc = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
// squared distance from the player beyond which a person's pose is refreshed every 2nd / 4th frame, per quality tier
const ANIM_LOD = { high: [3600, 12100], med: [2025, 8100], low: [900, 4900] };

export class Ped {
  constructor(game, o) {
    this.game = game; this.id = pedId++; this.kind = o.kind || 'civ'; this.team = o.team || null; // 'cop' | 'swat' | 'gang'
    this.look = o.look ? crewLook(o.look) : randomLook(o.ctx || lookContext(game, o.x)); this.char = makeCharacter(this.look); this.mesh = this.char.group; game.scene.add(this.mesh);
    this.x = o.x; this.z = o.z; this.y = this.groundAt(o.x, o.z); this.yInit = false; this.vy = 0; this.yaw = o.yaw ?? Math.random() * 6.28; this.hp = o.hp ?? 100; this.maxHp = this.hp; this.dead = false; this.ragdoll = null; this.deadT = 0;
    this.state = o.state || 'walk'; this.stateT = 0; this.wp = null; this.prevWp = null; this.fleeFrom = null; this.speed = 0; this.moveDir = 0;
    this.weapon = o.weapon ? WEAPONS.find(w => w.id === o.weapon) : null; if (this.weapon) this.char.setGun(true, this.weapon.id === 'rifle' || this.weapon.id === 'shotgun' || this.weapon.id === 'sniper' ? 'long' : 'pistol');
    this.shootT = 1 + Math.random(); this.accuracy = o.accuracy ?? 0.5; this.hostile = !!o.hostile; this.stationX = o.x; this.stationZ = o.z; this.aggroRange = o.aggroRange ?? 45; this.bustT = 0; this.blockedT = 0;
    this.punchT = 0; this.mission = o.mission || null; this.noDespawn = !!o.noDespawn; this.fromVehicle = o.fromVehicle || null; this.station = !!o.station; this.vip = !!o.vip;
    this.area = this.kind === 'civ' && o.area ? o.area : null; // {x0, z0, x1, z1}: civilians that wander inside a rectangle (beach, parks) instead of walking the sidewalk graph
    this.animAcc = 0; this.animSkip = 9; this.animYaw = this.yaw;
    this.walkSpeed = WALK * (this.look.elder ? 0.75 : 1) * (0.9 + Math.random() * 0.2); this.aimT = 0; this.deadDir = 1; this.deadDirX = 0; this.deadDirZ = 0; this.lift = 0; this.liftTo = 0; this.liftStage = 0; // a body lying on the ground is lifted so that its lowest vertex rests on the ground
    this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw;
    if (this.kind === 'civ') this.pickWaypoint();
  }
  get pos() { return { x: this.x, y: this.y + 1.1, z: this.z }; }
  // Height of the walkable ground under (x, z): World.groundY (sidewalk 0.15, lot 0.17, beach 0.02, pier ramp and deck); the pier test is the fallback.
  groundAt(x, z) {
    const W = this.game.world;
    const gy = W.groundY(x, z); if (Number.isFinite(gy)) return gy;
    const pier = W.pier; return (pier && x > pier.x0 && x < pier.x1 && Math.abs(z - pier.z) < 4.6) ? pier.y : 0;
  }
  // ---------- sidewalk navigation ----------
  // Area wanderers: a random spot inside the rectangle that is not inside anything solid (up to 6 tries; the edge margin keeps steering overshoot inside).
  pickAreaTarget() {
    const a = this.area, grid = this.game.grid, mx = Math.min(1.2, (a.x1 - a.x0) * 0.25), mz = Math.min(1.2, (a.z1 - a.z0) * 0.25), w = this.wp || (this.wp = { x: this.x, z: this.z });
    this.prevWp = null;
    for (let i = 0; i < 6; i++) {
      const tx = a.x0 + mx + Math.random() * (a.x1 - a.x0 - 2 * mx), tz = a.z0 + mz + Math.random() * (a.z1 - a.z0 - 2 * mz);
      if (!grid.circleHit(tx, tz, 0.4, _tmp)) { w.x = tx; w.z = tz; return; }
    }
    w.x = clamp(this.x, a.x0 + mx, a.x1 - mx); w.z = clamp(this.z, a.z0 + mz, a.z1 - mz); // nothing free found: stand still for a moment, then try again
    if (this.state === 'walk') { this.state = 'idle'; this.stateT = 1.5 + Math.random() * 2; }
  }
  pickWaypoint() {
    if (this.area) { this.pickAreaTarget(); return; }
    const W = this.game.world; let best = null, bd = Infinity;
    for (let bj = 0; bj < CITY.gridZ; bj++) for (let bi = 0; bi < CITY.gridX; bi++) for (const cx of [0, 1]) for (const cz of [0, 1]) { const p = W.sidewalkCorner(bi, bj, cx, cz); const d = (p.x - this.x) ** 2 + (p.z - this.z) ** 2; if (d < bd) { bd = d; best = { bi, bj, cx, cz, ...p }; } }
    this.wp = best; this.prevWp = null;
  }
  nextWaypoint() {
    if (this.area) { this.pickAreaTarget(); return; }
    const w = this.wp; const opts = [];
    opts.push({ bi: w.bi, bj: w.bj, cx: 1 - w.cx, cz: w.cz, w: 3 }); opts.push({ bi: w.bi, bj: w.bj, cx: w.cx, cz: 1 - w.cz, w: 3 });
    const nbi = w.bi + (w.cx ? 1 : -1), nbj = w.bj + (w.cz ? 1 : -1);
    if (nbi >= 0 && nbi < CITY.gridX) opts.push({ bi: nbi, bj: w.bj, cx: 1 - w.cx, cz: w.cz, w: 1.2 }); if (nbj >= 0 && nbj < CITY.gridZ) opts.push({ bi: w.bi, bj: nbj, cx: w.cx, cz: 1 - w.cz, w: 1.2 });
    const filtered = opts.filter(o => !(this.prevWp && o.bi === this.prevWp.bi && o.bj === this.prevWp.bj && o.cx === this.prevWp.cx && o.cz === this.prevWp.cz));
    const list = filtered.length ? filtered : opts; const tot = list.reduce((s, o) => s + o.w, 0); let r = Math.random() * tot; let c = list[0]; for (const o of list) { r -= o.w; if (r <= 0) { c = o; break; } }
    this.prevWp = w; this.wp = { ...c, ...this.game.world.sidewalkCorner(c.bi, c.bj, c.cx, c.cz) };
  }
  // ---------- damage ----------
  // head: true for a head shot (combat.js passes best.head). A hit that does not kill makes the person flinch and stagger 0.15 m along the hit direction.
  hit(dmg, dirx, dirz, source, head) {
    if (this.dead) return; this.hp -= dmg; const G = this.game; G.fx.blood(this.x, 1.1, this.z, 6);
    if (this.hp <= 0) { this.die(dirx, dirz, source, head); return; }
    if (!this.ragdoll) { const l = Math.hypot(dirx, dirz) || 1; this.char.flinch(dirx, dirz, !!head); this.x += dirx / l * 0.15; this.z += dirz / l * 0.15; }
    if (this.kind !== 'civ') this.shootT = Math.max(this.shootT, 0.3 + dmg / 100); // being shot interrupts the next shot
    if (this.kind === 'civ') this.flee(this.x - dirx * 5, this.z - dirz * 5, 8); else if (!this.hostile) { this.hostile = true; }
  }
  // (dirx, dirz) is the direction the killing hit travelled; the body falls that way. A ragdoll in flight (car, explosion) keeps flying and settles by itself.
  die(dirx = 0, dirz = 0, source, head) {
    if (this.dead) return; this.dead = true; this.deadT = 0; this.state = 'dead'; const G = this.game;
    const hl = Math.hypot(dirx, dirz); this.deadDirX = hl > 1e-3 ? dirx / hl : 0; this.deadDirZ = hl > 1e-3 ? dirz / hl : 0;
    this.deadDir = this.deadDirX * Math.cos(this.yaw) - this.deadDirZ * Math.sin(this.yaw) > 0 ? 1 : -1; // side of the body the hit came from (no random)
    const r = this.ragdoll;
    if (!r) this.char.fall(this.deadDirX, this.deadDirZ, head);
    else if (r.phase === 'up') { // shot while getting up: the body gives way and drops again
      r.phase = 'fly'; r.still = 0; r.t = 0; this.initBody(r); r.wx = (Math.random() - 0.5) * 4; r.wz = (Math.random() - 0.5) * 4;
    }
    if (this.vehicle) { this.vehicle = null; }
    if (source === 'player' || source === 'playercar') { G.stats.kills++; if (source === 'player') { if (this.team === 'cop' || this.team === 'swat') G.police.reportCrime('killcop', this.x, this.z); else if (this.kind === 'civ') G.police.reportCrime('kill', this.x, this.z); } }
    if (this.kind === 'civ' && Math.random() < 0.55) G.addPickup({ type: 'cash', amount: 10 + Math.floor(Math.random() * 90), x: this.x + (Math.random() - 0.5), z: this.z + (Math.random() - 0.5) });
    if ((this.team === 'cop' || this.team === 'gang') && Math.random() < 0.6) G.addPickup({ type: 'ammo', weapon: this.weapon?.id || 'pistol', amount: 12, x: this.x + (Math.random() - 0.5), z: this.z + (Math.random() - 0.5) });
    G.alert(this.x, this.z, 18, 'death'); this.onDeath?.(this);
  }
  // Throws the body (hitByCar, Game.explode). The velocity is kept outward by at least 2.2 m/s; the spin is (up x v) * |v| * 0.55 plus a random 3 rad/s, so a body tumbles in the
  // direction it travels. Bodies that are lying dead are not thrown again.
  launch(vx, vy, vz) {
    if (this.dead && !this.ragdoll) return;
    let hv = Math.hypot(vx, vz);
    if (hv < 2.2) { if (hv > 0.05) { vx *= 2.2 / hv; vz *= 2.2 / hv; } else { const a = Math.random() * 6.283; vx = Math.cos(a) * 2.2; vz = Math.sin(a) * 2.2; } hv = 2.2; }
    const r = this.ragdoll || (this.ragdoll = { phase: 'fly', t: 0, rt: 0, u: 0, still: 0, wait: 0, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, cx: 0, cy: 0, cz: 0, px: 0, py: 0, pz: 0, yaw: 0, q: new THREE.Quaternion(), q0: new THREE.Quaternion(), qUp: new THREE.Quaternion(), qTo: new THREE.Quaternion() });
    r.phase = 'fly'; r.t = 0; r.rt = 0; r.still = 0; this.lift = 0; this.liftTo = 0; this.liftStage = 0; this.state = 'ragdoll';
    this.initBody(r);
    const sp = Math.hypot(vx, vy, vz), sc = sp * 0.55 / hv;
    r.vx = vx; r.vy = vy; r.vz = vz; r.wx = vz * sc + (Math.random() - 0.5) * 3.46; r.wy = (Math.random() - 0.5) * 3.46; r.wz = -vx * sc + (Math.random() - 0.5) * 3.46; // up x v = (vz, 0, -vx) / |v_h|
    this.y = Math.max(this.y, this.groundAt(this.x, this.z));
  }
  // rigid body state from where the mesh stands now (an upright person, or a body lying / rising)
  initBody(r) {
    const m = this.mesh, H = m.scale.y; r.q.copy(m.quaternion); _va.set(0, CAP_CM * H, 0).applyQuaternion(r.q);
    r.cx = m.position.x + _va.x; r.cz = m.position.z + _va.z; r.cy = m.position.y - this.lift + _va.y;
    r.vx = r.vy = r.vz = r.wx = r.wy = r.wz = 0;
  }
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
    if (this.ragdoll) { this.updateRagdoll(dt); return; } // the rigid body first, for living and dead people alike (a person killed by a car or a blast is flying when it dies)
    if (this.dead) { // collapse and rest pose: the pose is driven by Character (fall, sprawl), the lift keeps the lowest vertex on the ground
      this.deadT += dt;
      if (this.deadT < 2.2) { _dead.deadDir = this.deadDir; this.char.animate(dt, _dead); } // the collapse has converged well before 2.2 s; after that the pose is static
      this.y = damp(this.y, this.groundAt(this.x, this.z), 25, dt);
      if (this.liftStage < 2 && this.deadT >= (this.liftStage ? 1.7 : 1.0)) { this.mesh.position.set(this.x, this.y + this.lift, this.z); this.measureLift(); } // measured twice: when the body is down, and again when the last of the pose has settled
      if (this.liftStage) this.lift = damp(this.lift, this.liftTo, 10, dt);
      this.mesh.position.set(this.x, this.y + this.lift, this.z);
      if (this.deadT > 14 && !this.noDespawn) G.removePed(this);
      return;
    }
    this.punchT = Math.max(0, this.punchT - dt);
    let tx = null, tz = null, spd = 0;
    if (this.kind === 'civ') {
      if (this.state === 'flee') { this.stateT -= dt; if (this.vip) { this.fleeFrom = { x: P.x, z: P.z }; } const dx = this.x - this.fleeFrom.x, dz = this.z - this.fleeFrom.z, d = Math.hypot(dx, dz) || 1; tx = this.x + dx / d * 10; tz = this.z + dz / d * 10; spd = this.vip ? RUN * 1.15 : RUN; if (this.stateT <= 0 || d > (this.vip ? 90 : 60)) { this.state = 'walk'; this.pickWaypoint(); } }
      else if (this.state === 'idle') { this.stateT -= dt; if (this.stateT <= 0) this.state = 'walk'; }
      else { if (this.vip && dist(this.x, this.z, P.x, P.z) < 32) { this.flee(P.x, P.z, 10); } if (!this.wp) this.pickWaypoint(); const area = this.area, d = dist(this.x, this.z, this.wp.x, this.wp.z); if (d < (area ? 1 : 1.2)) { if (Math.random() < (area ? 0.35 : 0.12)) { this.state = 'idle'; this.stateT = area ? 3 + Math.random() * 7 : 2 + Math.random() * 5; } this.nextWaypoint(); } tx = this.wp.x; tz = this.wp.z; spd = this.walkSpeed; }
    } else { // armed AI
      const px = P.x, pz = P.z, d = dist(this.x, this.z, px, pz); const wanted = G.police.level; this.aimT -= dt;
      const engaged = this.team === 'gang' ? (this.hostile || d < this.aggroRange) : (wanted > 0 && d < 150);
      if (!engaged) { // cops idle / gang loiter near station
        const sd = dist(this.x, this.z, this.stationX, this.stationZ); if (sd > 3) { tx = this.stationX; tz = this.stationZ; spd = this.walkSpeed; } else this.faceTo(px, pz, dt, 2);
      } else {
        const los = this.hasLOS(px, 1.2, pz); const inCar = !!P.vehicle; const isCop = this.team === 'cop' || this.team === 'swat';
        const keep = isCop ? (inCar ? 6 : (wanted >= 3 || P.weapon.id !== 'fist' ? 7 : 0.9)) : 9;
        if (d > keep + 0.5) { tx = px; tz = pz; spd = RUN; } else if (d < keep - 2 && d > 1.5) { const dx = this.x - px, dz = this.z - pz, l = Math.hypot(dx, dz) || 1; tx = this.x + dx / l * 3; tz = this.z + dz / l * 3; spd = this.walkSpeed; }
        if (!spd) this.faceTo(px, pz, dt, 8);
        // arrest
        if (isCop && !P.dead && d < 1.8 && (!inCar || P.vehicle.speed < 1.2)) { this.bustT += dt; if (this.bustT > (inCar ? 1.6 : 0.7)) G.bust(); } else this.bustT = 0;
        // shooting
        const canShoot = this.weapon && (this.team !== 'cop' || wanted >= 2 || P.weapon.id !== 'fist') && d < this.weapon.range * 0.6 && los && d > 1.2;
        if (canShoot) this.aimT = 0.5; // the gun comes up while the target is in range and in sight, and stays up for half a second
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
    // real ground height: 0.15 m sidewalks, lots, beach, pier ramp; the first update snaps, later steps ease so a kerb is a quick step instead of a pop
    const gy = this.groundAt(this.x, this.z);
    if (!this.yInit) { this.yInit = true; this.y = gy; } else this.y = damp(this.y, gy, 25, dt);
    this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw;
    // pose: people far from the player refresh it every 2nd / 4th frame (quality tier decides how far), with the time they skipped
    const dx = this.x - P.x, dz = this.z - P.z, d2 = dx * dx + dz * dz, lod = ANIM_LOD[G.settings?.quality] || ANIM_LOD.high;
    this.animAcc += dt;
    if (++this.animSkip >= (d2 > lod[1] ? 4 : d2 > lod[0] ? 2 : 1)) {
      const A = _anim, adt = this.animAcc; this.animSkip = 0; this.animAcc = 0;
      A.v = this.speed; A.moveYaw = this.yaw; A.yaw = this.yaw; A.yawRate = adt > 1e-5 ? clamp(wrapAngle(this.yaw - this.animYaw) / adt, -8, 8) : 0; this.animYaw = this.yaw;
      A.aiming = !!(this.weapon && this.kind !== 'civ' && this.aimT > 0); A.aimPitch = 0;
      A.long = !!this.weapon && (this.weapon.id === 'rifle' || this.weapon.id === 'shotgun' || this.weapon.id === 'sniper');
      A.punch = this.punchT > 0 ? 1 - this.punchT / 0.8 : 0;
      if (this.kind === 'civ' && this.state === 'idle' && d2 < 64) { _look.x = P.x; _look.z = P.z; A.lookAt = _look; } else A.lookAt = null; // idle civilians glance at a player within 8 m
      this.char.animate(adt, A);
    }
  }
  // ---------- ragdoll ----------
  // Measures the lowest skinned vertex of the body as it lies (the mesh transform must be written with the current lift) and sets the lift that puts it on the ground.
  measureLift() { const lo = this.char.lowestY(); this.liftTo = this.lift + (this.groundAt(this.x, this.z) + 0.012 - lo); this.liftStage++; }
  // One physics step; returns true when an end of the capsule touched the ground.
  stepBody(r, h, H) {
    r.vy -= GRAV * h; r.cx += r.vx * h; r.cy += r.vy * h; r.cz += r.vz * h;
    const w = Math.hypot(r.wx, r.wy, r.wz);
    if (w > 1e-6) { _va.set(r.wx / w, r.wy / w, r.wz / w); _qa.setFromAxisAngle(_va, w * h); r.q.premultiply(_qa).normalize(); }
    _va.set(0, 1, 0).applyQuaternion(r.q); // the body's long axis in the world
    const hs = CAP_CM * H - CAP_R; let touched = false;
    for (let e = 0; e < 2; e++) {
      const sg = e ? -1 : 1, ax = _va.x * hs * sg, ay = _va.y * hs * sg, az = _va.z * hs * sg, pen = this.groundAt(r.cx + ax, r.cz + az) + CAP_R - (r.cy + ay);
      if (pen <= 0) continue;
      touched = true; r.cy += pen;
      const rx = ax, ry = ay - CAP_R, rz = az; // from the centre to the contact point
      const vpy = r.vy + (r.wz * rx - r.wx * rz); // normal speed of the contact point (the normal is +y)
      if (vpy >= 0) continue;
      const den = 1 + (rx * rx + rz * rz) / INERTIA, imp = -vpy * (1 + (vpy < -1.2 ? REST_E : 0)) / den;
      r.vy += imp; r.wx += -rz * imp / INERTIA; r.wz += rx * imp / INERTIA;
      const vtx = r.vx + (r.wy * rz - r.wz * ry), vtz = r.vz + (r.wx * ry - r.wy * rx), vt = Math.hypot(vtx, vtz);
      if (vt > 1e-4) {
        const tx = vtx / vt, tz = vtz / vt, c0 = ry * tz, c1 = rz * tx - rx * tz, c2 = ry * tx;
        const jt = Math.min(FRICTION * imp, vt / (1 + (c0 * c0 + c1 * c1 + c2 * c2) / INERTIA)), fx = -jt * tx, fz = -jt * tz;
        r.vx += fx; r.vz += fz; r.wx += ry * fz / INERTIA; r.wy += (rz * fx - rx * fz) / INERTIA; r.wz += -ry * fx / INERTIA;
      }
      if (vpy < -2) { r.wx *= 0.55; r.wy *= 0.55; r.wz *= 0.55; } // a hard impact takes most of the spin with it
    }
    if (touched) { const k = Math.exp(-4 * h); r.wx *= k; r.wy *= k; r.wz *= k; } else { const k = Math.exp(-0.25 * h); r.vx *= k; r.vz *= k; r.wx *= k; r.wy *= k; r.wz *= k; }
    return touched;
  }
  // Bodies are static in the physics world: walls push the centre out and take the speed into them.
  collideRagdoll(r) {
    const hit = this.game.grid.circleHit(this.x, this.z, 0.36, _tmp);
    if (hit) { this.x += hit.nx * hit.depth; this.z += hit.nz * hit.depth; const vn = r.vx * hit.nx + r.vz * hit.nz; if (vn < 0) { r.vx -= 1.3 * vn * hit.nx; r.vz -= 1.3 * vn * hit.nz; } }
    const B = this.game.world.bounds; this.x = clamp(this.x, B.minX, B.maxX); this.z = clamp(this.z, B.minZ, B.maxZ);
  }
  // The body has stopped: lie flat, pick the lying pose by how it ended up (front up, down or sideways), and wait a moment before getting up.
  settleBody(r, H) {
    r.vx = r.vy = r.vz = r.wx = r.wy = r.wz = 0; r.phase = 'rest'; r.rt = 0; r.wait = 0.4 + Math.random() * 0.3;
    _va.set(0, 1, 0).applyQuaternion(r.q);
    if (Math.abs(_va.y) > 0.4) { // still leaning (settled by the time limit): lay it down
      _vb.set(_va.x, 0, _va.z); if (_vb.lengthSq() < 1e-4) _vb.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); _vb.normalize(); _qa.setFromUnitVectors(_va, _vb); r.q.premultiply(_qa).normalize();
    }
    r.cy = this.groundAt(r.cx, r.cz) + CAP_R;
    // roll about the long axis onto the back or the belly (whichever the front is closer to), so a limb never points into the ground; the roll is eased in while at rest
    _va.set(0, 1, 0).applyQuaternion(r.q); _vb.set(0, 0, 1).applyQuaternion(r.q); _vb.addScaledVector(_va, -_vb.dot(_va)).normalize();
    const onBack = _vb.y >= 0; _vc.set(0, onBack ? 1 : -1, 0); _qa.setFromUnitVectors(_vb, _vc); r.qTo.copy(r.q).premultiply(_qa).normalize();
    this.char.setSprawl(onBack ? 'supine' : 'prone', true);
    this.state = this.dead ? 'dead' : 'ragdoll'; this.liftStage = 0; this.lift = 0;
  }
  // Survivors rise about the pelvis: the group turns from lying to upright over 0.9 s while Character gathers the limbs (prone, kneel, stand).
  startGetUp(r, H) {
    _va.set(0, 1, 0).applyQuaternion(r.q); _vb.set(0, 0, 1).applyQuaternion(r.q); // head direction, front direction
    const hh = Math.hypot(_va.x, _va.z), fh = Math.hypot(_vb.x, _vb.z); let yaw = this.yaw;
    if (_vb.y < -0.35 && hh > 0.3) yaw = Math.atan2(_va.x, _va.z); else if (_vb.y > 0.35 && hh > 0.3) yaw = Math.atan2(-_va.x, -_va.z); else if (fh > 0.3) yaw = Math.atan2(_vb.x, _vb.z); // face the way the head points (prone), the way the feet point (on the back) or where the front looks
    r.yaw = yaw; r.q0.copy(r.q); r.qUp.setFromAxisAngle(UP, yaw);
    _va.set(0, (0.94 - CAP_CM) * H, 0).applyQuaternion(r.q); r.px = r.cx + _va.x; r.py = r.cy + _va.y; r.pz = r.cz + _va.z;
    r.phase = 'up'; r.u = 0; r.liftT = 0; // this.lift (the fit of the lying body) carries over and keeps following the rising pose
  }
  updateRagdoll(dt) {
    const G = this.game, r = this.ragdoll, m = this.mesh, ch = this.char, H = m.scale.y;
    r.t += dt;
    if (this.dead) { this.deadT += dt; if (this.deadT > 14 && !this.noDespawn) { G.removePed(this); return; } }
    if (r.phase === 'fly') {
      const n = Math.min(5, Math.ceil(dt / 0.0167)), h = dt / n; let touched = false;
      for (let i = 0; i < n; i++) if (this.stepBody(r, h, H)) touched = true;
      this.x = r.cx; this.z = r.cz; this.collideRagdoll(r); r.cx = this.x; r.cz = this.z;
      _va.set(0, 1, 0).applyQuaternion(r.q); const flat = Math.abs(_va.y) < 0.4;
      if (touched && Math.hypot(r.vx, r.vy, r.vz) < 0.3 && Math.hypot(r.wx, r.wy, r.wz) < 0.6) {
        r.still += dt;
        if (r.still > 0.25) { if (flat || r.t > 3.5) this.settleBody(r, H); else { r.wx += (Math.random() - 0.5) * 4; r.wz += (Math.random() - 0.5) * 4; r.still = 0; } } // balanced on one end: tip over
      } else r.still = 0;
      if (r.phase === 'fly' && r.t > 4) this.settleBody(r, H);
    } else if (r.phase === 'rest') {
      r.rt += dt; if (r.rt < 0.5) r.q.slerp(r.qTo, Math.min(1, dt * 9)); else if (r.rt - dt < 0.5) r.q.copy(r.qTo);
      // a body lying on the ground is fitted to it (survivors too, with earlier measurements: they only lie for r.wait s)
      if (this.liftStage < 2 && r.rt >= (this.dead ? (this.liftStage ? 0.9 : 0.35) : (this.liftStage ? 0.4 : 0.2))) { this.writeBody(r, H); this.measureLift(); }
      if (this.liftStage) this.lift = damp(this.lift, this.liftTo, 10, dt);
      if (!this.dead && r.rt > r.wait) this.startGetUp(r, H);
    }
    if (r.phase === 'up') {
      r.u += dt / GETUP_T; const u = Math.min(1, r.u), e = u * u * (3 - 2 * u);
      this.x = r.px; this.z = r.pz; this.collideStatic(); const B = G.world.bounds; r.px = clamp(this.x, B.minX, B.maxX); r.pz = clamp(this.z, B.minZ, B.maxZ);
      const gy = this.groundAt(r.px, r.pz); m.quaternion.slerpQuaternions(r.q0, r.qUp, e);
      _va.set(0, 0.94 * H, 0).applyQuaternion(m.quaternion);
      m.position.set(r.px - _va.x, r.py + (gy + 0.94 * H - r.py) * e - _va.y, r.pz - _va.z);
      m.position.y += this.lift; r.liftT -= dt; if (r.liftT <= 0) { r.liftT = 0.1; this.measureLift(); } this.lift = damp(this.lift, this.liftTo, 12, dt); // the lowest vertex of the rising body stays on the ground
      this.x = r.px; this.z = r.pz; this.y = gy;
      if (r.u >= 1) { this.finishGetUp(r); return; }
    } else { this.writeBody(r, H); this.y = this.dead ? this.groundAt(this.x, this.z) : r.cy - CAP_CM * H; }
    // limbs: flailing in the air, limp when it has settled, rising while getting up; corpses stop animating once the pose has converged
    if (r.phase === 'up') { _rag.dead = false; _rag.rag = 0; _rag.getUp = Math.max(0.001, r.u); ch.animate(dt, _rag); }
    else if (!this.dead || r.phase === 'fly' || r.rt < 1.6) { _rag.dead = this.dead; _rag.rag = r.phase === 'fly' ? 1 : 2; _rag.getUp = 0; ch.animate(dt, _rag); }
  }
  // writes the capsule's pose to the mesh: the group origin (the feet) sits 0.875 m down the body's axis from the centre
  writeBody(r, H) {
    const m = this.mesh; _va.set(0, CAP_CM * H, 0).applyQuaternion(r.q);
    m.quaternion.copy(r.q); m.position.set(r.cx - _va.x, r.cy - _va.y + this.lift, r.cz - _va.z);
  }
  finishGetUp(r) {
    const m = this.mesh, P = this.game.player; this.ragdoll = null; this.lift = 0; this.yaw = r.yaw; this.x = r.px; this.z = r.pz; this.y = this.groundAt(this.x, this.z); this.yInit = true; this.vy = 0; this.speed = 0; this.blockedT = 0;
    m.rotation.set(0, this.yaw, 0); m.position.set(this.x, this.y, this.z); this.animYaw = this.yaw; this.animSkip = 9; this.animAcc = 0;
    if (this.kind === 'civ') { this.state = 'flee'; this.stateT = 6; this.fleeFrom = { x: P.x, z: P.z }; } else this.state = 'walk';
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
  dispose() { this.game.scene.remove(this.mesh); this.char.dispose(); } // frees the person's own geometry and bone texture; never the shared materials or gun geometry
}

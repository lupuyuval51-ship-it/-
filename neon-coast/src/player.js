import * as THREE from '../vendor/three.module.min.js';
import { PLAYER, WEAPONS, CITY } from './config.js';
import { makeCharacter, LOOKS } from './character.js';
import { Ped } from './peds.js';
import { fireWeapon } from './combat.js';
import { clamp, damp, angleLerp, dist, wrapAngle } from './utils.js';
import { T } from './i18n.js';

const _tmp = [];
// Module-level scratch: nothing below allocates inside a per-frame path.
const _camDir = new THREE.Vector3();
const _occ = [];
const _deadState = { dead: true, deadDir: 1 };
const _riseState = { rise: 0 }, RISE_TIME = 1.7, DOOR_TIME = 0.32, IDLE_LOOK = 7; // getting up after a respawn, ducking into / out of a car, glancing round when left idle
// Reused for every char.animate call. v/aimPitch/moveYaw/... are the skinned-character contract; moving/speed/pitch are the legacy keys the pre-skinned character still reads.
const _anim = { v: 0, grounded: true, vy: 0, moveYaw: 0, yaw: 0, yawRate: 0, aiming: false, aimPitch: 0, long: false, punch: 0, melee: 'fist', reload: -1, moving: false, speed: 0, pitch: 0 };
const RELOAD_TIME = 1.2, PUNCH_TIME = 0.45, CURB_SNAP = 0.2, LAND_MIN_SPEED = 3, YAW_RATE_MAX = 14;
const LONG_GUNS = new Set(['rifle', 'shotgun', 'sniper']);
const isLong = w => !!w.long || LONG_GUNS.has(w.id);
const KICK = { pistol: 0.12, revolver: 0.2, smg: 0.06, rifle: 0.06, shotgun: 0.30, sniper: 0.35 }; // recoil handed to char.kick per shot
const HIT_STOP = 0.05, HIT_STOP_HEAD = 0.08; // seconds of slowed time on a kill; Game.update consumes G.hitStopT
// A kill freezes the game for a few frames (Game.update eats G.hitStopT). Never while the death overlay runs its own slow motion.
function hitStop(G, head) { if (G.state !== 'dead') G.hitStopT = Math.max(G.hitStopT || 0, head ? HIT_STOP_HEAD : HIT_STOP); }
// Hit confirmation for the player's own gunfire. hits is what fireWeapon returns (one entry per pellet): kill > head > hit decides the
// hitmarker and cue; a shot that only struck a vehicle shows a faint 'hit' (its impact sound already played in fireWeapon).
function confirmHits(G, hits) {
  let ped = false, veh = false, head = false, kill = false, headKill = false;
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if (h.type === 'ped') { ped = true; if (h.head) head = true; if (h.ped.dead) { kill = true; if (h.head) headKill = true; } }
    else if (h.type === 'vehicle') veh = true;
  }
  if (!ped) { if (veh) G.hud.hitmarker('hit', true); return; }
  const kind = kill ? 'kill' : head ? 'head' : 'hit';
  G.hud.hitmarker(kind); G.audio.hit(kind);
  if (kill) hitStop(G, headKill);
}
// Chase camera tuning. Every k and weight of the vehicle camera lives here.
const CHASE = {
  baseDist: 2.2, lenK: 1.1, speedDist: 0.06,            // distance = baseDist + spec.len * lenK + speed * speedDist
  topDefault: 1.4, baseH: 0.55, topK: 0.55,             // look-at height = v.y + baseH + model.top * topK
  tallTop: 2.0, pitchLow: 0.17, pitchTall: 0.24, pitchSpeedK: 0.001, pitchSpeedMax: 0.05, pitchRate: 3,
  kWall: 18, kOpen: 7,                                  // camOff damping: closing in (walls) / relaxing outwards
  snapDist: 40,                                         // only a camera further than this from its target is hard-snapped
  velBlendLo: 4, velBlendSpan: 12, velBlendMax: 0.65,   // how far the framing swings from the car heading to the travel direction
  yawRate0: 3, yawRateSpeed: 0.04, yawRateReverse: 3.5, // camera yaw follow rates (1/s)
  revSpeed: 2, revFlipT: 0.8,                           // reverse must last this long before the camera swaps to the front
  lookMax: 5, lookK: 0.12, lookUp: 0.2, lookSmooth: 8,  // look-ahead along the velocity
  shakeDecay: 2.5, shakeLat: 0.3, shakeVert: 0.22, shakeFov: 5, shakeFreqA: 53, shakeFreqB: 31, shakeFreqV: 41, shakeMixA: 0.6, shakeMixB: 0.4,
  rumbleFrom: 28, rumbleSpan: 30, rumbleAmp: 0.018, rumbleFreq: 27,
  wallPad: 0.35, minDist: 0.6, minClear: 0.45,          // wall pull-back, shortest wall distance, camera height above the ground
  occRange: 14, occStep: 0.4, occMargin: 0.2, occTopDefault: 1.5, occMinDist: 2.5, // other vehicles blocking the view
  fovBase: 62, fovSpeed: 0.35, fovRate: 6,
};
export class Player {
  constructor(game, x, z) {
    this.game = game; this.char = makeCharacter(LOOKS.player); this.mesh = this.char.group; game.scene.add(this.mesh);
    this.x = x; this.z = z; this.y = 0; this.vy = 0; this.yaw = 0; this.speed = 0; this.speedNorm = 0; this.health = 100; this.armor = 0; this.dead = false; this.vehicle = null;
    this.weapons = { fist: { ammo: Infinity, clip: 0 } }; this.weaponIds = ['fist']; this.weapon = WEAPONS[0]; this.fireT = 0; this.reloadT = 0; this.aiming = false; this.punchT = 0; this.hurtT = 0; this.enterT = 0;
    this.camYaw = 0; this.camPitch = 0.22; this.camFree = 0; this.camPos = new THREE.Vector3(x, 3, z + 6); this.camLook = new THREE.Vector3(x, 1.5, z); this.grounded = true; this.lastGroundY = 0;
    this.camOff = new THREE.Vector3(0, 1.5, 6); this.camVeh = null; this.revT = 0; this.shake = 0; this.lookAX = 0; this.lookAZ = 0; // chase camera state
    this.prevYaw = 0; this.moveDirX = 0; this.moveDirZ = 1; this.stepK = this.char.steps;
    this.deadT = 0; this.lift = 0; this.liftTo = 0; this.liftStage = 0; this.riseT = 0; this.doorT = 0; this.idleT = 0; this.hitX = this.hitZ = 0; // death, rise and door timers start at rest
    this.mesh.position.set(x, 0, z);
  }
  get pos() { return { x: this.x, y: this.y + 1.1, z: this.z }; }
  get onFoot() { return !this.vehicle; }
  // ---------- inventory ----------
  giveWeapon(id, ammo = 0) { if (!this.weapons[id]) { this.weapons[id] = { ammo: 0, clip: 0 }; this.weaponIds.push(id); this.weaponIds.sort((a, b) => WEAPONS.findIndex(w => w.id === a) - WEAPONS.findIndex(w => w.id === b)); } this.giveAmmo(id, ammo); this.select(id); }
  giveAmmo(id, n) { if (!this.weapons[id]) return this.giveWeapon(id, n); const w = this.weapons[id], spec = WEAPONS.find(s => s.id === id); w.ammo += n; if (w.clip === 0 && spec.clip) { const take = Math.min(spec.clip, w.ammo); w.clip = take; w.ammo -= take; } }
  select(id) { if (!this.weapons[id]) return; this.weapon = WEAPONS.find(w => w.id === id); this.reloadT = 0; const w = this.weapon; this.char.setGun(w.id !== 'fist', isLong(w) ? 'long' : w.id === 'bat' ? 'bat' : w.thrown ? 'grenade' : 'pistol'); this.game.audio.click(); }
  cycle(dir) { const i = this.weaponIds.indexOf(this.weapon.id); this.select(this.weaponIds[(i + dir + this.weaponIds.length) % this.weaponIds.length]); }
  get ammoState() { return this.weapons[this.weapon.id]; }
  reload() { const w = this.ammoState, s = this.weapon; if (!s.clip || this.reloadT > 0 || w.clip >= s.clip || w.ammo <= 0) return; this.reloadT = RELOAD_TIME; this.game.hud.notify(T.reload, 'dim', 1); this.game.audio.reload(s.id); }
  // ---------- damage ----------
  damage(n, fx, fz) {
    if (this.dead || this.game.godMode) return; if (this.armor > 0) { const a = Math.min(this.armor, n * 0.6); this.armor -= a; n -= a; } this.health -= n; this.hurtT = 0.35; this.sinceHit = 0; this.idleT = 0; if (fx !== undefined && fz !== undefined && !this.vehicle) { const hx = this.x - fx, hz = this.z - fz; this.hitX = hx; this.hitZ = hz; this.char.flinch(hx, hz, false); } this.game.audio.hurt(); this.game.hud.hurt(); if (fx !== undefined && fz !== undefined) this.game.hud.damageFrom(fx, fz);
    if (this.health <= 0) { this.health = 0; this.die(); }
  }
  // the body goes down: shared by a death (die) and an arrest (Game.bust), so both fall the same way and start the death state from zero
  kill(fx, fz) { if (this.dead) return; this.dead = true; this.aiming = false; this.deadT = 0; this.lift = 0; this.liftTo = 0; this.liftStage = 0; this.riseT = 0; if (!this.vehicle) this.char.fall(fx, fz, false); this.char.setActivity(null); }
  die() { if (this.dead) return; this.kill(this.hitX || 0, this.hitZ || 0); if (this.vehicle) { const s = this.vehicle.seatPosition(1); this.x = s.x; this.z = s.z; this.vehicle.driver = null; const car = this.vehicle; car.input.throttle = 0; car.input.steer = 0; car.input.handbrake = false; car.input.brake = true; this.vehicle = null; this.mesh.visible = true; } this.game.wasted(); }
  respawn(x, z) { this.riseT = RISE_TIME; this.lift = 0; this.char.setActivity(null); this.dead = false; this.health = 100; this.x = x; this.z = z; this.y = 0; this.vy = 0; this.grounded = true; this.vehicle = null; this.camVeh = null; this.shake = 0; this.revT = 0; this.prevYaw = this.yaw; this.mesh.visible = true; this.mesh.rotation.set(0, this.yaw, 0); this.camPos.set(x, 3, z + 6); this.hitX = this.hitZ = 0; }
  // ---------- vehicles ----------
  nearestVehicle() { let best = null, bd = PLAYER.enterRange + 1.2; for (const v of this.game.vehicles) { if (v.wrecked || v.locked) continue; const d = dist(v.x, v.z, this.x, this.z) - v.spec.wid * 0.5; if (d < bd) { bd = d; best = v; } } return best; }
  enterVehicle(v) {
    const G = this.game;
    if (v.ai || v.driver) { // carjack: the NPC driver runs away
      const s = v.seatPosition(1); const p = new Ped(G, { kind: 'civ', x: s.x, z: s.z }); p.flee(this.x, this.z, 9); G.addPed(p); v.ai = null; v.driver = null; if (v.type === 'police') G.police.reportCrime('carjack', v.x, v.z, true); else G.police.reportCrime('carjack', v.x, v.z); G.stats.carsStolen++;
      if (v.type === 'police' || v.type === 'swat') { G.police.setLevel(Math.max(G.police.level, 2)); }
    }
    v.parked = false; v.driver = this; v.siren = false; this.vehicle = v; this.seedChase(v); this.doorT = DOOR_TIME; this.doorIn = true; this.doorX = this.x; this.doorZ = this.z; this.aiming = false; this.enterT = 0.4; G.audio.click(); G.hud.radio(G.station, true); if (G.stats.carsStolen === 1 && !G.hintCar) { G.hintCar = true; }
  }
  exitVehicle() {
    const v = this.vehicle; if (!v) return; const s = v.seatPosition(1); this.x = s.x; this.z = s.z; this.y = v.y; this.vehicle = null; v.driver = null; v.input.throttle = 0; v.input.steer = 0; v.input.brake = v.speed > 0.5; this.mesh.visible = true; this.doorT = DOOR_TIME; this.doorIn = false; this.yaw = this.camYaw + Math.PI; this.enterT = 0.3; this.game.audio.engine(false);
    // back on foot: nothing of the chase rig may carry over (camPos itself glides to the on-foot target via the normal damping; a camera still more than snapDist away is snapped)
    this.camVeh = null; this.shake = 0; this.revT = 0; this.vy = 0; this.grounded = true; this.speed = 0; this.prevYaw = this.yaw; this.moveDirX = Math.sin(this.yaw); this.moveDirZ = Math.cos(this.yaw);
  }
  // Seeds the chase camera with the current camera position so that getting into a car glides out of the on-foot rig instead of snapping.
  seedChase(v) { const C = CHASE, top = v.model?.top ?? C.topDefault; this.camVeh = v; this.camOff.set(this.camPos.x - v.x, this.camPos.y - (v.y + C.baseH + top * C.topK), this.camPos.z - v.z); this.revT = 0; this.shake = 0; this.lookAX = 0; this.lookAZ = 0; }
  // ---------- update ----------
  update(dt) {
    const G = this.game, I = G.input, cam = G.camera; if (this.dead) { this.deadT += dt; if (this.deadT < 2.4) this.char.animate(dt, _deadState); const gy = this.groundAt(this.x, this.z); this.y = damp(this.y, gy, 25, dt); if (this.liftStage < 2 && this.deadT >= (this.liftStage ? 1.7 : 1.0)) { this.mesh.position.set(this.x, this.y + this.lift, this.z); this.liftTo = this.lift + (gy + 0.012 - this.char.lowestY()); this.liftStage++; } if (this.liftStage) this.lift = damp(this.lift, this.liftTo, 10, dt); this.mesh.position.set(this.x, this.y + this.lift, this.z); return; } // the settled body is fitted to the ground (never sunk, never floating)
    if (this.riseT > 0) { // getting up after a respawn: lying, knees up, sit up, squat, stand; the controls wait until the person is on their feet
      this.riseT = Math.max(0, this.riseT - dt); I.consumeMouse(); this.hurtT = Math.max(0, this.hurtT - dt); this.mesh.rotation.y = this.yaw; _riseState.rise = this.riseT > 0 ? 1 - this.riseT / RISE_TIME : 1; if (this.riseT > 0) { this.char.animate(dt, _riseState); this.mesh.position.set(this.x, this.y, this.z); return; }
    }
    const m = I.consumeMouse(); const sens = G.settings.sensitivity * 0.0022 * (this.zoom ? 0.3 : 1);
    this.camYaw -= m.dx * sens; this.camPitch = clamp(this.camPitch + m.dy * sens, -0.6, 1.0); if (Math.abs(m.dx) > 0.5) this.camFree = 1.8;
    this.enterT = Math.max(0, this.enterT - dt); this.hurtT = Math.max(0, this.hurtT - dt); this.sinceHit = (this.sinceHit || 0) + dt; if (this.sinceHit > 6 && this.health < 50) this.health = Math.min(50, this.health + 1.6 * dt); this.fireT = Math.max(0, this.fireT - dt); this.punchT = Math.max(0, this.punchT - dt);
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) { const w = this.ammoState, s = this.weapon; const take = Math.min(s.clip - w.clip, w.ammo); w.clip += take; w.ammo -= take; } }
    // weapon selection
    for (let k = 1; k <= 9; k++) if (I.once('Digit' + k) && this.weaponIds[k - 1]) this.select(this.weaponIds[k - 1]);
    if (m.wheel) this.cycle(m.wheel > 0 ? 1 : -1); if (I.btnOnce('weapon')) this.cycle(1);
    if (this.vehicle) this.updateDriving(dt, m); else this.updateOnFoot(dt, m);
    this.mesh.position.set(this.x, this.y, this.z);
    if (this.vehicle && this.doorT > 0) { // ducking into the car: the body glides to the seat while it bends, then it is hidden inside
      const v = this.vehicle, u = 1 - Math.max(0, this.doorT - dt) / DOOR_TIME, a = _anim; this.doorT -= dt; this.mesh.position.set(this.doorX + (v.x - this.doorX) * u * 0.8, this.y, this.doorZ + (v.z - this.doorZ) * u * 0.8);
      a.v = 0; a.grounded = true; a.vy = 0; a.aiming = false; a.punch = 0; a.reload = -1; a.yawRate = 0; a.door = Math.sin(Math.PI * Math.min(1, u)); a.moving = false; a.speed = 0; this.char.animate(dt, a); a.door = 0;
      if (this.doorT <= 0) this.mesh.visible = false;
    } else if (this.vehicle && this.mesh.visible) this.mesh.visible = false;
  }
  updateOnFoot(dt, m) {
    const G = this.game, I = G.input; const ax = I.axis(); this.aiming = (I.mouse.right || I.btn('aim')) && this.weapon.id !== 'fist';
    this.zoom = this.aiming && !!this.weapon.zoom; G.hud.scope(this.zoom); G.camera.getWorldDirection(_camDir);
    const run = I.key('ShiftLeft') || I.key('ShiftRight') || I.btn('run'); const cy = this.camYaw; const fwdX = Math.sin(cy), fwdZ = Math.cos(cy), rgtX = -Math.cos(cy), rgtZ = Math.sin(cy);
    // camera-relative movement (camera looks along -forward of yaw: we define camYaw so that forward = (sin, cos) points away from the camera)
    let mx = fwdX * ax.y + rgtX * ax.x, mz = fwdZ * ax.y + rgtZ * ax.x; const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    const moving = ml > 0.05; const target = moving ? (this.aiming ? PLAYER.walk * 1.3 : run ? PLAYER.sprint : PLAYER.run) * Math.min(1, ml) : 0;
    this.speed = damp(this.speed, target, moving ? 10 : 14, dt);
    if (moving) { const want = Math.atan2(mx, mz); if (!this.aiming) this.yaw = angleLerp(this.yaw, want, Math.min(1, dt * 12)); this.moveDirX = mx / (ml || 1); this.moveDirZ = mz / (ml || 1); }
    if (this.aiming) this.yaw = angleLerp(this.yaw, cy, Math.min(1, dt * 18));
    const vx = (moving ? this.moveDirX : Math.sin(this.yaw)) * this.speed, vz = (moving ? this.moveDirZ : Math.cos(this.yaw)) * this.speed; this.x += vx * dt; this.z += vz * dt;
    this.speedNorm = clamp(this.speed / PLAYER.sprint, 0, 1);
    // jump & gravity on the real ground height (sidewalks, pier, ramps). A grounded player within CURB_SNAP of the ground sticks to it, so a 0.15 m kerb is neither a fall nor a blocked jump.
    const groundY = this.groundAt(this.x, this.z); let landV = 0;
    if ((I.once('Space') || I.btnOnce('jump')) && this.grounded) { this.vy = PLAYER.jump; this.grounded = false; }
    if (this.grounded && this.vy <= 0 && Math.abs(groundY - this.y) <= CURB_SNAP) { this.y = groundY; this.vy = 0; }
    else {
      this.vy -= PLAYER.gravity * dt; this.y += this.vy * dt;
      if (this.y <= groundY) { if (!this.grounded) landV = -this.vy; this.y = groundY; this.vy = 0; this.grounded = true; } else if (this.y > groundY + 0.05) this.grounded = false;
    }
    if (landV > LAND_MIN_SPEED) G.audio.land(this.surface(), landV);
    // collisions
    const h = G.grid.circleHit(this.x, this.z, PLAYER.radius, _tmp); if (h) { this.x += h.nx * h.depth; this.z += h.nz * h.depth; }
    for (const v of G.vehicles) { if (Math.abs(v.x - this.x) > 8 || Math.abs(v.z - this.z) > 8) continue; if (v.contains(this.x, this.z, PLAYER.radius)) { if (v.speed > 3 && !v.wrecked) { this.damage(v.speed * 4, v.x, v.z); this.vy = 4; this.x += v.vx * 0.15; this.z += v.vz * 0.15; G.audio.impact(v.speed, 0); } else { const dx = this.x - v.x, dz = this.z - v.z; const lr = dx * -v.fz + dz * v.fx, lf = dx * v.fx + dz * v.fz; const rx = -v.fz, rz = v.fx; if (Math.abs(lr) / (v.spec.wid / 2) > Math.abs(lf) / (v.spec.len / 2)) { const want = (v.spec.wid / 2 + PLAYER.radius + 0.05) * Math.sign(lr || 1); this.x = v.x + v.fx * lf + rx * want; this.z = v.z + v.fz * lf + rz * want; } else { const want = (v.spec.len / 2 + PLAYER.radius + 0.05) * Math.sign(lf || 1); this.x = v.x + v.fx * want + rx * lr; this.z = v.z + v.fz * want + rz * lr; } } } }
    const B = G.world.bounds; this.x = clamp(this.x, B.minX, B.maxX); this.z = clamp(this.z, B.minZ, B.maxZ);
    // enter vehicle
    const near = this.enterT <= 0 ? this.nearestVehicle() : null; G.hud.prompt(near && !G.interactPrompt ? T.pressEnter : null);
    if (near && (I.once('KeyE') || I.once('KeyF') || I.btnOnce('enter')) && !G.interactPrompt) { this.enterVehicle(near); return; }
    // shooting
    if (I.once('KeyR') || I.btnOnce('reload')) this.reload();
    const wantFire = this.weapon.auto ? (I.mouse.left || I.btn('fire')) : (m.leftPressed || I.btnOnce('fire'));
    if (wantFire && this.fireT <= 0 && this.reloadT <= 0 && this.enterT <= 0 && !G.uiOpen) this.fire();
    this.mesh.rotation.y = this.yaw;
    // character animation: distance-driven gait, strafe direction, aim pitch from the real camera ray, reload progress
    const w = this.weapon, a = _anim, yawRate = dt > 1e-5 ? clamp(wrapAngle(this.yaw - this.prevYaw) / dt, -YAW_RATE_MAX, YAW_RATE_MAX) : 0; this.prevYaw = this.yaw;
    a.v = this.speed; a.grounded = this.grounded; a.vy = this.vy; a.moveYaw = Math.atan2(this.moveDirX, this.moveDirZ); a.yaw = this.yaw; a.yawRate = yawRate;
    a.aiming = this.aiming; a.aimPitch = Math.asin(clamp(_camDir.y, -1, 1)); a.long = isLong(w); a.punch = this.punchT > 0 ? 1 - this.punchT / PUNCH_TIME : 0; a.melee = w.id === 'bat' ? 'bat' : 'fist'; a.reload = this.reloadT > 0 ? 1 - this.reloadT / RELOAD_TIME : -1;
    a.moving = moving; a.speed = this.speedNorm; a.pitch = this.camPitch - 0.2;
    if (this.doorT > 0) { this.doorT -= dt; a.door = Math.sin(Math.PI * clamp(this.doorT / DOOR_TIME, 0, 1)); } else a.door = 0; // stepping out of a car: the trunk comes up, the knees straighten
    if (moving || this.aiming || this.punchT > 0 || this.fireT > 0.3 || !this.grounded || this.hurtT > 0) { this.idleT = 0; if (this.idleAct) { this.idleAct = false; this.char.setActivity(null); } } // left idle, the player looks around now and then
    else { this.idleT = (this.idleT || 0) + dt; if (!this.idleAct && this.idleT > IDLE_LOOK) { this.idleAct = true; this.char.setActivity('lookAround'); } else if (this.idleAct && this.idleT > IDLE_LOOK + 6) { this.idleAct = false; this.idleT = IDLE_LOOK * 0.35; this.char.setActivity(null); } }
    this.char.animate(dt, a);
    // footsteps follow the gait: one per foot contact (char.steps changes), only while grounded and actually moving
    const steps = this.char.steps;
    if (steps !== undefined && steps !== this.stepK) { this.stepK = steps; if (this.grounded && this.speed > 0.5) G.audio.step(this.surface(), this.speedNorm, G.rainLevel > 0.3); }
  }
  // Height of the walkable ground at (x, z): World.groundY when it exists, otherwise the pier deck test.
  groundAt(x, z) {
    const W = this.game.world;
    const gy = W.groundY(x, z); if (Number.isFinite(gy)) return gy;
    const pier = W.pier; return (x > pier.x0 - 1 && x < pier.x1 && Math.abs(z - pier.z) < 4.6) ? pier.y : 0;
  }
  // Surface under the player for footstep and landing sounds.
  surface() {
    const W = this.game.world, x = this.x, z = this.z, pier = W.pier;
    if (pier && x > pier.x0 - 1 && x < pier.x1 && Math.abs(z - pier.z) < 4.6) return 'wood';
    if (x > CITY.beachX && x < CITY.oceanX) return 'sand';
    const parks = W.parks; if (parks) for (let i = 0; i < parks.length; i++) { const p = parks[i]; if (p && x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return 'grass'; }
    return 'concrete';
  }
  fire() {
    const G = this.game, w = this.weapon, st = this.ammoState;
    if (w.thrown) { const total = st.clip + st.ammo; if (total <= 0) { G.hud.notify(T.ammoEmpty, 'dim', 1); this.fireT = 0.3; return; } if (st.clip > 0) st.clip--; else st.ammo--; this.fireT = w.rate; this.punchT = PUNCH_TIME; const cd = _camDir; G.camera.getWorldDirection(cd); let dx = cd.x, dy = cd.y + 0.38, dz = cd.z; const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l; const gx = this.x + Math.sin(this.yaw) * 0.5, gz = this.z + Math.cos(this.yaw) * 0.5; G.grenades.throw(gx, this.y + 1.5, gz, dx, dy, dz, 15 + Math.max(0, cd.y) * 8, 'player'); G.audio.click(); return; }
    if (w.melee) { this.punchT = PUNCH_TIME; this.fireT = w.rate; let hit = null, bd = w.range; for (const p of G.peds) { if (p.dead) continue; const d = dist(p.x, p.z, this.x, this.z); if (d < bd) { const ang = Math.atan2(p.x - this.x, p.z - this.z); if (Math.abs(wrapAngle(ang - this.yaw)) < 1.0) { bd = d; hit = p; } } }
      G.audio.swing(w.id); // the swing whooshes whether or not it connects
      if (hit) { const dx = Math.sin(this.yaw), dz = Math.cos(this.yaw); hit.hit(w.dmg, dx, dz, 'player'); hit.x += dx * 0.4; hit.z += dz * 0.4; if (hit.kind === 'civ') G.alert(this.x, this.z, 10, 'fight'); G.audio.meleeHit(w.id); G.hud.hitmarker(hit.dead ? 'kill' : 'hit'); if (hit.dead) hitStop(G, false); }
      else { for (const v of G.vehicles) if (!v.wrecked && v.contains(this.x + Math.sin(this.yaw) * 1.2, this.z + Math.cos(this.yaw) * 1.2, 0.3)) { v.damage(w.dmg * 0.4, 'melee'); G.fx.sparks(this.x + Math.sin(this.yaw) * 1.2, 0.8, this.z + Math.cos(this.yaw) * 1.2, 4, 3); if (v.ai) v.ai.panic = 6; G.audio.meleeHit(w.id); G.hud.hitmarker('hit', true); break; } } return; }
    if (st.clip <= 0) { if (st.ammo > 0) this.reload(); else { G.hud.notify(T.ammoEmpty, 'dim', 1); G.audio.dry(); this.fireT = 0.3; } return; }
    st.clip--; this.fireT = w.rate; this.aiming = true;
    const cam = G.camera; const cd = _camDir; cam.getWorldDirection(cd);
    const reach = Math.min(w.range, G.grid.raycast(cam.position.x, cam.position.y, cam.position.z, cd.x, cd.y, cd.z, w.range));
    const tx = cam.position.x + cd.x * reach, ty = cam.position.y + cd.y * reach, tz = cam.position.z + cd.z * reach;
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw); const gx = this.x - rx * 0.33 + Math.sin(this.yaw) * 0.5, gz = this.z - rz * 0.33 + Math.cos(this.yaw) * 0.5, gy = this.y + 1.38;
    let dx = tx - gx, dy = ty - gy, dz = tz - gz; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    const hits = fireWeapon(G, gx, gy, gz, dx, dy, dz, w, 'player'); confirmHits(G, hits); this.char.kick(KICK[w.id] ?? 0.1); G.alert(this.x, this.z, 28, 'gunfire', this); G.police.reportCrime('gunfire', this.x, this.z); G.hud.recoil();
  }
  updateDriving(dt, m) {
    const G = this.game, I = G.input, v = this.vehicle; const ax = I.axis();
    if (v.wrecked) { this.damage(200, v.x, v.z); return; }
    if (this.zoom) { this.zoom = false; G.hud.scope(false); }
    v.input.throttle = ax.y; v.input.steer = -ax.x; v.input.handbrake = I.key('Space') || I.btn('jump'); v.input.brake = false;
    if (I.btn('brake')) v.input.throttle = -1;
    this.x = v.x; this.z = v.z; this.y = v.y; this.speedNorm = clamp(v.speed / 30, 0, 1);
    if (this.enterT <= 0 && !G.missions?.retry && (I.once('KeyE') || I.once('KeyF') || I.btnOnce('enter'))) { this.exitVehicle(); return; }
    if (I.once('KeyR') || I.btnOnce('radio')) G.nextStation(); if (I.once('KeyH') || I.btnOnce('horn')) { G.audio.horn(0); v.hornT = 0.5; }
    G.audio.engine(true, v.speed / v.spec.maxSpeed, v.input.throttle, v.spec.maxSpeed); G.audio.screech(v.slip > 3 && v.speed > 4 ? clamp((v.slip - 3) / 6, 0, 1) : (v.input.handbrake && v.speed > 6 ? 0.6 : 0));
    // drive-by
    if (!this.weapon.melee && !this.weapon.thrown) { const st = this.ammoState; const want = this.weapon.auto ? (I.mouse.left || I.btn('fire')) : (m.leftPressed || I.btnOnce('fire')); if (want && this.fireT <= 0 && st.clip > 0 && !G.uiOpen) { st.clip--; this.fireT = this.weapon.rate * 1.3; const cd = _camDir; G.camera.getWorldDirection(cd); const gx = v.x + cd.x * 2.2, gz = v.z + cd.z * 2.2, gy = 1.2; const hits = fireWeapon(G, gx, gy, gz, cd.x, cd.y * 0.5, cd.z, this.weapon, 'player'); confirmHits(G, hits); G.police.reportCrime('gunfire', v.x, v.z); } else if (want && st.clip <= 0 && this.fireT <= 0) { if (st.ammo > 0) this.reload(); else { G.audio.dry(); this.fireT = 0.3; } } }
    G.stats.distance += v.speed * dt;
  }
  setLook(look) { const G = this.game; const vis = this.mesh.visible; G.scene.remove(this.mesh); this.char.dispose(); this.look = look; this.char = makeCharacter(look); this.stepK = this.char.steps; this.mesh = this.char.group; this.mesh.visible = vis; this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw; G.scene.add(this.mesh); if (this.weapon) this.select(this.weapon.id); }
  // ---------- camera ----------
  updateCamera(dt) {
    const G = this.game, cam = G.camera; if (this.shake > 0) this.shake = Math.max(0, this.shake - CHASE.shakeDecay * dt);
    if (this.vehicle) { this.chaseCamera(dt); return; }
    const yaw = this.camYaw, pitch = this.camPitch; let tx = this.x, tz = this.z; const ty = this.y + 1.55, dist0 = this.aiming ? 2.3 : 4.4;
    if (this.aiming) { tx -= Math.cos(yaw) * 0.55; tz += Math.sin(yaw) * 0.55; } // over the right shoulder, on the muzzle side
    const dx = -Math.sin(yaw) * Math.cos(pitch), dz = -Math.cos(yaw) * Math.cos(pitch), dy = Math.sin(pitch);
    let d = dist0; const hit = G.grid.raycast(tx, ty, tz, dx, dy, dz, dist0 + 0.3); if (hit < dist0 + 0.3) d = Math.max(0.6, hit - 0.35);
    const px = tx + dx * d, py = Math.max(0.4, ty + dy * d), pz = tz + dz * d;
    const k = this.aiming ? 30 : 14; this.camPos.x = damp(this.camPos.x, px, k, dt); this.camPos.y = damp(this.camPos.y, py, k, dt); this.camPos.z = damp(this.camPos.z, pz, k, dt);
    if (Math.hypot(this.camPos.x - tx, this.camPos.z - tz) > CHASE.snapDist) this.camPos.set(px, py, pz); // teleports only; normal motion always glides
    this.camLook.set(tx, ty, tz); cam.position.copy(this.camPos); cam.lookAt(this.camLook); if (this.hurtT > 0) { cam.position.x += (Math.random() - 0.5) * 0.08; cam.position.y += (Math.random() - 0.5) * 0.08; }
    cam.fov = damp(cam.fov, this.zoom ? 15 : this.aiming ? 46 : 62, this.zoom ? 12 : 6, dt); cam.updateProjectionMatrix();
  }
  // Vehicle chase camera. The camera lives at target + camOff, so it travels rigidly with the car (no lag to catch up with, hence no snap
  // at 40+ m/s); only the offset itself is damped, quickly when it shrinks (walls, other vehicles) and slowly when it relaxes outwards.
  chaseCamera(dt) {
    const G = this.game, cam = G.camera, v = this.vehicle, C = CHASE, speed = v.speed, fwd = v.forwardSpeed;
    // 1) size-aware rig: look-at point above the roof line, distance from the car length
    const top = v.model?.top ?? C.topDefault; const tx = v.x, ty = v.y + C.baseH + top * C.topK, tz = v.z;
    if (this.camVeh !== v) this.seedChase(v);
    // 2) framing: sit behind the car, swing towards the travel direction when sliding, flip to the front only after a sustained reverse
    this.camFree = Math.max(0, this.camFree - dt);
    if (fwd < -C.revSpeed) this.revT += dt; else this.revT = 0;
    if (this.camFree <= 0) {
      const carYaw = Math.atan2(v.fx, v.fz); let want = carYaw, rate = C.yawRate0 + speed * C.yawRateSpeed;
      if (fwd > 0) want = angleLerp(carYaw, Math.atan2(v.vx, v.vz), clamp((speed - C.velBlendLo) / C.velBlendSpan, 0, 1) * C.velBlendMax);
      else if (this.revT > C.revFlipT) { want = carYaw + Math.PI; rate = C.yawRateReverse; }
      this.camYaw = angleLerp(this.camYaw, want, 1 - Math.exp(-rate * dt));
      this.camPitch = damp(this.camPitch, (top > C.tallTop ? C.pitchTall : C.pitchLow) - Math.min(C.pitchSpeedMax, speed * C.pitchSpeedK), C.pitchRate, dt);
    }
    const yaw = this.camYaw, pitch = this.camPitch, cp = Math.cos(pitch);
    const dx = -Math.sin(yaw) * cp, dz = -Math.cos(yaw) * cp, dy = Math.sin(pitch);
    // 3) how far back can the camera go: static world first, then other vehicles along the ray
    const dist0 = C.baseDist + v.spec.len * C.lenK + speed * C.speedDist;
    let d = dist0; const hit = G.grid.raycast(tx, ty, tz, dx, dy, dz, dist0 + 0.3); if (hit < dist0 + 0.3) d = Math.max(C.minDist, hit - C.wallPad);
    _occ.length = 0; const vs = G.vehicles; for (let i = 0; i < vs.length; i++) { const o = vs[i]; if (o !== v && Math.abs(o.x - tx) < C.occRange && Math.abs(o.z - tz) < C.occRange) _occ.push(o); }
    if (_occ.length) {
      for (let s = C.occStep; s < d; s += C.occStep) {
        const x = tx + dx * s, y = ty + dy * s, z = tz + dz * s; let blocked = false;
        for (let i = 0; i < _occ.length; i++) { const o = _occ[i]; if (o.contains(x, z, C.occMargin) && y < o.y + (o.model?.top ?? C.occTopDefault)) { blocked = true; break; } }
        if (blocked) { d = Math.min(d, Math.max(C.occMinDist, s - C.occStep)); break; }
      }
    }
    const ox = dx * d, oz = dz * d; let oy = dy * d; const minY = v.y + C.minClear - ty; if (oy < minY) oy = minY;
    // 4) damp the offset (not the world position)
    const O = this.camOff, a = 1 - Math.exp(-(Math.hypot(ox, oy, oz) < O.length() ? C.kWall : C.kOpen) * dt);
    O.x += (ox - O.x) * a; O.y += (oy - O.y) * a; O.z += (oz - O.z) * a;
    if (!(O.lengthSq() < C.snapDist * C.snapDist)) O.set(ox, oy, oz);
    this.camPos.set(tx + O.x, Math.max(v.y + C.minClear, ty + O.y), tz + O.z);
    // 5) look a little way ahead of the car along its velocity
    let lax = 0, laz = 0; if (speed > 0.5) { const la = Math.min(C.lookMax, speed * C.lookK) / speed; lax = v.vx * la; laz = v.vz * la; }
    const ka = 1 - Math.exp(-C.lookSmooth * dt); this.lookAX += (lax - this.lookAX) * ka; this.lookAZ += (laz - this.lookAZ) * ka;
    this.camLook.set(tx + this.lookAX, ty + C.lookUp, tz + this.lookAZ);
    // 6) shake (crashes, curb hits) and high-speed rumble are applied to the rendered camera only, never to the stored rig
    cam.position.copy(this.camPos);
    const t = G.time, s2 = this.shake * this.shake;
    if (s2 > 0) {
      const lat = (Math.sin(t * C.shakeFreqA) * C.shakeMixA + Math.sin(t * C.shakeFreqB) * C.shakeMixB) * s2 * C.shakeLat;
      cam.position.x -= Math.cos(yaw) * lat; cam.position.z += Math.sin(yaw) * lat; cam.position.y += Math.sin(t * C.shakeFreqV) * s2 * C.shakeVert;
    }
    if (speed > C.rumbleFrom) cam.position.y += Math.sin(t * C.rumbleFreq) * clamp((speed - C.rumbleFrom) / C.rumbleSpan, 0, 1) * C.rumbleAmp;
    cam.lookAt(this.camLook);
    if (this.hurtT > 0) { cam.position.x += (Math.random() - 0.5) * 0.08; cam.position.y += (Math.random() - 0.5) * 0.08; }
    cam.fov = damp(cam.fov, C.fovBase + speed * C.fovSpeed + s2 * C.shakeFov, C.fovRate, dt); cam.updateProjectionMatrix();
  }
  save() { return { x: this.x, z: this.z, health: this.health, armor: this.armor, weapons: this.weapons, weaponIds: this.weaponIds, weapon: this.weapon.id }; }
  load(s) { this.x = s.x; this.z = s.z; this.health = s.health; this.armor = s.armor; this.weapons = s.weapons; for (const k in this.weapons) if (this.weapons[k].ammo === null) this.weapons[k].ammo = Infinity; this.weaponIds = s.weaponIds; this.select(s.weapon); this.y = this.groundAt(this.x, this.z); this.vy = 0; this.grounded = true; this.camVeh = null; this.shake = 0; this.camPos.set(this.x, 3, this.z + 6); }
}

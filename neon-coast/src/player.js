import * as THREE from '../vendor/three.module.min.js';
import { PLAYER, WEAPONS } from './config.js';
import { makeCharacter, LOOKS } from './character.js';
import { Ped } from './peds.js';
import { fireWeapon } from './combat.js';
import { clamp, damp, angleLerp, dist, wrapAngle, disposeGeometries } from './utils.js';
import { T } from './i18n.js';

const _tmp = [];
export class Player {
  constructor(game, x, z) {
    this.game = game; this.char = makeCharacter(LOOKS.player); this.mesh = this.char.group; game.scene.add(this.mesh);
    this.x = x; this.z = z; this.y = 0; this.vy = 0; this.yaw = 0; this.speed = 0; this.speedNorm = 0; this.health = 100; this.armor = 0; this.dead = false; this.vehicle = null;
    this.weapons = { fist: { ammo: Infinity, clip: 0 } }; this.weaponIds = ['fist']; this.weapon = WEAPONS[0]; this.fireT = 0; this.reloadT = 0; this.aiming = false; this.punchT = 0; this.hurtT = 0; this.enterT = 0;
    this.camYaw = 0; this.camPitch = 0.22; this.camFree = 0; this.camPos = new THREE.Vector3(x, 3, z + 6); this.camLook = new THREE.Vector3(x, 1.5, z); this.grounded = true; this.lastGroundY = 0;
    this.mesh.position.set(x, 0, z);
  }
  get pos() { return { x: this.x, y: this.y + 1.1, z: this.z }; }
  get onFoot() { return !this.vehicle; }
  // ---------- inventory ----------
  giveWeapon(id, ammo = 0) { if (!this.weapons[id]) { this.weapons[id] = { ammo: 0, clip: 0 }; this.weaponIds.push(id); this.weaponIds.sort((a, b) => WEAPONS.findIndex(w => w.id === a) - WEAPONS.findIndex(w => w.id === b)); } this.giveAmmo(id, ammo); this.select(id); }
  giveAmmo(id, n) { if (!this.weapons[id]) return this.giveWeapon(id, n); const w = this.weapons[id], spec = WEAPONS.find(s => s.id === id); w.ammo += n; if (w.clip === 0 && spec.clip) { const take = Math.min(spec.clip, w.ammo); w.clip = take; w.ammo -= take; } }
  select(id) { if (!this.weapons[id]) return; this.weapon = WEAPONS.find(w => w.id === id); this.reloadT = 0; const w = this.weapon; this.char.setGun(w.id !== 'fist', w.long || w.id === 'rifle' || w.id === 'shotgun' ? 'long' : w.id === 'bat' ? 'bat' : w.thrown ? 'grenade' : 'pistol'); this.game.audio.click(); }
  cycle(dir) { const i = this.weaponIds.indexOf(this.weapon.id); this.select(this.weaponIds[(i + dir + this.weaponIds.length) % this.weaponIds.length]); }
  get ammoState() { return this.weapons[this.weapon.id]; }
  reload() { const w = this.ammoState, s = this.weapon; if (!s.clip || this.reloadT > 0 || w.clip >= s.clip || w.ammo <= 0) return; this.reloadT = 1.2; this.game.hud.notify(T.reload, 'dim', 1); }
  // ---------- damage ----------
  damage(n, fx, fz) {
    if (this.dead || this.game.godMode) return; if (this.armor > 0) { const a = Math.min(this.armor, n * 0.6); this.armor -= a; n -= a; } this.health -= n; this.hurtT = 0.35; this.sinceHit = 0; this.game.audio.hurt(); this.game.hud.hurt();
    if (this.health <= 0) { this.health = 0; this.die(); }
  }
  die() { if (this.dead) return; this.dead = true; this.aiming = false; if (this.vehicle) { const s = this.vehicle.seatPosition(1); this.x = s.x; this.z = s.z; this.vehicle.driver = null; const car = this.vehicle; car.input.throttle = 0; car.input.steer = 0; car.input.handbrake = false; car.input.brake = true; this.vehicle = null; this.mesh.visible = true; } this.game.wasted(); }
  respawn(x, z) { this.dead = false; this.health = 100; this.x = x; this.z = z; this.y = 0; this.vy = 0; this.vehicle = null; this.mesh.visible = true; this.mesh.rotation.set(0, 0, 0); this.camPos.set(x, 3, z + 6); }
  // ---------- vehicles ----------
  nearestVehicle() { let best = null, bd = PLAYER.enterRange + 1.2; for (const v of this.game.vehicles) { if (v.wrecked || v.locked) continue; const d = dist(v.x, v.z, this.x, this.z) - v.spec.wid * 0.5; if (d < bd) { bd = d; best = v; } } return best; }
  enterVehicle(v) {
    const G = this.game;
    if (v.ai || v.driver) { // carjack: the NPC driver runs away
      const s = v.seatPosition(1); const p = new Ped(G, { kind: 'civ', x: s.x, z: s.z }); p.flee(this.x, this.z, 9); G.addPed(p); v.ai = null; v.driver = null; if (v.type === 'police') G.police.reportCrime('carjack', v.x, v.z, true); else G.police.reportCrime('carjack', v.x, v.z); G.stats.carsStolen++;
      if (v.type === 'police' || v.type === 'swat') { G.police.setLevel(Math.max(G.police.level, 2)); }
    }
    v.parked = false; v.driver = this; v.siren = false; this.vehicle = v; this.mesh.visible = false; this.aiming = false; this.enterT = 0.4; G.audio.click(); G.hud.radio(G.station, true); if (G.stats.carsStolen === 1 && !G.hintCar) { G.hintCar = true; }
  }
  exitVehicle() { const v = this.vehicle; if (!v) return; const s = v.seatPosition(1); this.x = s.x; this.z = s.z; this.y = v.y; this.vehicle = null; v.driver = null; v.input.throttle = 0; v.input.steer = 0; v.input.brake = v.speed > 0.5; this.mesh.visible = true; this.yaw = this.camYaw + Math.PI; this.enterT = 0.3; this.game.audio.engine(false); }
  // ---------- update ----------
  update(dt) {
    const G = this.game, I = G.input, cam = G.camera; if (this.dead) { this.char.animate(dt, { dead: true, deadDir: 1 }); this.mesh.position.set(this.x, this.y, this.z); return; }
    const m = I.consumeMouse(); const sens = G.settings.sensitivity * 0.0022 * (this.zoom ? 0.3 : 1);
    this.camYaw -= m.dx * sens; this.camPitch = clamp(this.camPitch + m.dy * sens, -0.6, 1.0); if (Math.abs(m.dx) > 0.5) this.camFree = 1.8;
    this.enterT = Math.max(0, this.enterT - dt); this.hurtT = Math.max(0, this.hurtT - dt); this.sinceHit = (this.sinceHit || 0) + dt; if (this.sinceHit > 6 && this.health < 50) this.health = Math.min(50, this.health + 1.6 * dt); this.fireT = Math.max(0, this.fireT - dt); this.punchT = Math.max(0, this.punchT - dt);
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) { const w = this.ammoState, s = this.weapon; const take = Math.min(s.clip - w.clip, w.ammo); w.clip += take; w.ammo -= take; } }
    // weapon selection
    for (let k = 1; k <= 9; k++) if (I.once('Digit' + k) && this.weaponIds[k - 1]) this.select(this.weaponIds[k - 1]);
    if (m.wheel) this.cycle(m.wheel > 0 ? 1 : -1); if (I.btnOnce('weapon')) this.cycle(1);
    if (this.vehicle) this.updateDriving(dt, m); else this.updateOnFoot(dt, m);
    this.mesh.position.set(this.x, this.y, this.z);
  }
  updateOnFoot(dt, m) {
    const G = this.game, I = G.input; const ax = I.axis(); this.aiming = (I.mouse.right || I.btn('aim')) && this.weapon.id !== 'fist';
    this.zoom = this.aiming && !!this.weapon.zoom; G.hud.scope(this.zoom);
    const run = I.key('ShiftLeft') || I.key('ShiftRight') || I.btn('run'); const cy = this.camYaw; const fwdX = Math.sin(cy), fwdZ = Math.cos(cy), rgtX = -Math.cos(cy), rgtZ = Math.sin(cy);
    // camera-relative movement (camera looks along -forward of yaw: we define camYaw so that forward = (sin, cos) points away from the camera)
    let mx = fwdX * ax.y + rgtX * ax.x, mz = fwdZ * ax.y + rgtZ * ax.x; const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    const moving = ml > 0.05; const target = moving ? (this.aiming ? PLAYER.walk * 1.3 : run ? PLAYER.sprint : PLAYER.run) * Math.min(1, ml) : 0;
    this.speed = damp(this.speed, target, moving ? 10 : 14, dt);
    if (moving) { const want = Math.atan2(mx, mz); if (!this.aiming) this.yaw = angleLerp(this.yaw, want, Math.min(1, dt * 12)); this.moveDirX = mx / (ml || 1); this.moveDirZ = mz / (ml || 1); }
    if (this.aiming) this.yaw = angleLerp(this.yaw, cy, Math.min(1, dt * 18));
    const vx = (moving ? this.moveDirX : Math.sin(this.yaw)) * this.speed, vz = (moving ? this.moveDirZ : Math.cos(this.yaw)) * this.speed; this.x += vx * dt; this.z += vz * dt;
    this.speedNorm = clamp(this.speed / PLAYER.sprint, 0, 1);
    // jump & gravity, pier height
    const pier = G.world.pier; const groundY = (this.x > pier.x0 - 1 && this.x < pier.x1 && Math.abs(this.z - pier.z) < 4.6) ? pier.y : 0;
    if ((I.once('Space') || I.btnOnce('jump')) && this.grounded) { this.vy = PLAYER.jump; this.grounded = false; }
    this.vy -= PLAYER.gravity * dt; this.y += this.vy * dt; if (this.y <= groundY) { this.y = groundY; this.vy = 0; this.grounded = true; } else if (this.y > groundY + 0.05) this.grounded = false;
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
    this.char.animate(dt, { moving, speed: this.speedNorm, aiming: this.aiming, pitch: this.camPitch - 0.2, long: this.weapon.id === 'rifle' || this.weapon.id === 'shotgun', punch: this.punchT > 0 ? 1 - this.punchT / 0.45 : 0 });
  }
  fire() {
    const G = this.game, w = this.weapon, st = this.ammoState;
    if (w.thrown) { const total = st.clip + st.ammo; if (total <= 0) { G.hud.notify(T.ammoEmpty, 'dim', 1); this.fireT = 0.3; return; } if (st.clip > 0) st.clip--; else st.ammo--; this.fireT = w.rate; this.punchT = 0.45; const cd = new THREE.Vector3(); G.camera.getWorldDirection(cd); let dx = cd.x, dy = cd.y + 0.38, dz = cd.z; const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l; const gx = this.x + Math.sin(this.yaw) * 0.5, gz = this.z + Math.cos(this.yaw) * 0.5; G.grenades.throw(gx, this.y + 1.5, gz, dx, dy, dz, 15 + Math.max(0, cd.y) * 8, 'player'); G.audio.click(); return; }
    if (w.melee) { this.punchT = 0.45; this.fireT = w.rate; let hit = null, bd = w.range; for (const p of G.peds) { if (p.dead) continue; const d = dist(p.x, p.z, this.x, this.z); if (d < bd) { const ang = Math.atan2(p.x - this.x, p.z - this.z); if (Math.abs(wrapAngle(ang - this.yaw)) < 1.0) { bd = d; hit = p; } } }
      G.audio.shot('punch'); if (hit) { const dx = Math.sin(this.yaw), dz = Math.cos(this.yaw); hit.hit(w.dmg, dx, dz, 'player'); hit.x += dx * 0.4; hit.z += dz * 0.4; if (hit.kind === 'civ') G.alert(this.x, this.z, 10, 'fight'); } else { for (const v of G.vehicles) if (!v.wrecked && v.contains(this.x + Math.sin(this.yaw) * 1.2, this.z + Math.cos(this.yaw) * 1.2, 0.3)) { v.damage(w.dmg * 0.4, 'melee'); G.fx.sparks(this.x + Math.sin(this.yaw) * 1.2, 0.8, this.z + Math.cos(this.yaw) * 1.2, 4, 3); if (v.ai) v.ai.panic = 6; break; } } return; }
    if (st.clip <= 0) { if (st.ammo > 0) this.reload(); else { G.hud.notify(T.ammoEmpty, 'dim', 1); this.fireT = 0.3; } return; }
    st.clip--; this.fireT = w.rate; this.aiming = true;
    const cam = G.camera; const cd = new THREE.Vector3(); cam.getWorldDirection(cd);
    const reach = Math.min(w.range, G.grid.raycast(cam.position.x, cam.position.y, cam.position.z, cd.x, cd.y, cd.z, w.range));
    const tx = cam.position.x + cd.x * reach, ty = cam.position.y + cd.y * reach, tz = cam.position.z + cd.z * reach;
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw); const gx = this.x - rx * 0.33 + Math.sin(this.yaw) * 0.5, gz = this.z - rz * 0.33 + Math.cos(this.yaw) * 0.5, gy = this.y + 1.38;
    let dx = tx - gx, dy = ty - gy, dz = tz - gz; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    fireWeapon(G, gx, gy, gz, dx, dy, dz, w, 'player'); G.alert(this.x, this.z, 28, 'gunfire', this); G.police.reportCrime('gunfire', this.x, this.z); G.hud.recoil();
  }
  updateDriving(dt, m) {
    const G = this.game, I = G.input, v = this.vehicle; const ax = I.axis();
    if (v.wrecked) { this.damage(200, v.x, v.z); return; }
    if (this.zoom) { this.zoom = false; G.hud.scope(false); }
    v.input.throttle = ax.y; v.input.steer = -ax.x; v.input.handbrake = I.key('Space') || I.btn('jump'); v.input.brake = false;
    if (I.btn('brake')) v.input.throttle = -1;
    this.x = v.x; this.z = v.z; this.y = v.y; this.speedNorm = clamp(v.speed / 30, 0, 1);
    if (this.enterT <= 0 && (I.once('KeyE') || I.once('KeyF') || I.btnOnce('enter'))) { this.exitVehicle(); return; }
    if (I.once('KeyR') || I.btnOnce('radio')) G.nextStation(); if (I.once('KeyH') || I.btnOnce('horn')) { G.audio.horn(0); v.hornT = 0.5; }
    G.audio.engine(true, v.speed / v.spec.maxSpeed, v.input.throttle, v.spec.maxSpeed); G.audio.screech(v.slip > 3 && v.speed > 4 ? clamp((v.slip - 3) / 6, 0, 1) : (v.input.handbrake && v.speed > 6 ? 0.6 : 0));
    // drive-by
    if (!this.weapon.melee && !this.weapon.thrown) { const st = this.ammoState; const want = this.weapon.auto ? (I.mouse.left || I.btn('fire')) : (m.leftPressed || I.btnOnce('fire')); if (want && this.fireT <= 0 && st.clip > 0 && !G.uiOpen) { st.clip--; this.fireT = this.weapon.rate * 1.3; const cd = new THREE.Vector3(); G.camera.getWorldDirection(cd); const gx = v.x + cd.x * 2.2, gz = v.z + cd.z * 2.2, gy = 1.2; fireWeapon(G, gx, gy, gz, cd.x, cd.y * 0.5, cd.z, this.weapon, 'player'); G.police.reportCrime('gunfire', v.x, v.z); } else if (want && st.clip <= 0 && this.fireT <= 0) { this.reload(); } }
    G.stats.distance += v.speed * dt;
  }
  setLook(look) { const G = this.game; const vis = this.mesh.visible; G.scene.remove(this.mesh); disposeGeometries(this.mesh); this.look = look; this.char = makeCharacter(look); this.mesh = this.char.group; this.mesh.visible = vis; this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw; G.scene.add(this.mesh); if (this.weapon) this.select(this.weapon.id); }
  // ---------- camera ----------
  updateCamera(dt) {
    const G = this.game, cam = G.camera; let tx, ty, tz, dist0, yaw, pitch;
    if (this.vehicle) {
      const v = this.vehicle; this.camFree = Math.max(0, this.camFree - dt); const carYaw = Math.atan2(v.fx, v.fz); // camera sits behind the car
      if (this.camFree <= 0) { this.camYaw = angleLerp(this.camYaw, carYaw + (v.forwardSpeed < -1 ? Math.PI : 0), Math.min(1, dt * 3.5)); this.camPitch = damp(this.camPitch, 0.18, 3, dt); }
      tx = v.x; ty = v.y + 1.3; tz = v.z; dist0 = 7.2 + v.speed * 0.05; yaw = this.camYaw; pitch = this.camPitch;
    } else { tx = this.x; ty = this.y + 1.55; tz = this.z; dist0 = this.aiming ? 2.3 : 4.4; yaw = this.camYaw; pitch = this.camPitch; if (this.aiming) { tx += Math.cos(yaw) * 0.55; tz += -Math.sin(yaw) * 0.55; } }
    const dx = -Math.sin(yaw) * Math.cos(pitch), dz = -Math.cos(yaw) * Math.cos(pitch), dy = Math.sin(pitch);
    let d = dist0; const hit = G.grid.raycast(tx, ty, tz, dx, dy, dz, dist0 + 0.3); if (hit < dist0 + 0.3) d = Math.max(0.6, hit - 0.35);
    const px = tx + dx * d, py = Math.max(0.4, ty + dy * d), pz = tz + dz * d;
    const k = this.vehicle ? 9 : (this.aiming ? 30 : 14); this.camPos.x = damp(this.camPos.x, px, k, dt); this.camPos.y = damp(this.camPos.y, py, k, dt); this.camPos.z = damp(this.camPos.z, pz, k, dt);
    if (Math.hypot(this.camPos.x - tx, this.camPos.z - tz) > dist0 + 3) this.camPos.set(px, py, pz);
    this.camLook.set(tx, ty, tz); cam.position.copy(this.camPos); cam.lookAt(this.camLook); if (this.hurtT > 0) { cam.position.x += (Math.random() - 0.5) * 0.08; cam.position.y += (Math.random() - 0.5) * 0.08; }
    cam.fov = damp(cam.fov, this.vehicle ? 62 + this.vehicle.speed * 0.35 : (this.zoom ? 15 : this.aiming ? 46 : 62), this.zoom ? 12 : 6, dt); cam.updateProjectionMatrix();
  }
  save() { return { x: this.x, z: this.z, health: this.health, armor: this.armor, weapons: this.weapons, weaponIds: this.weaponIds, weapon: this.weapon.id }; }
  load(s) { this.x = s.x; this.z = s.z; this.health = s.health; this.armor = s.armor; this.weapons = s.weapons; for (const k in this.weapons) if (this.weapons[k].ammo === null) this.weapons[k].ammo = Infinity; this.weaponIds = s.weaponIds; this.select(s.weapon); this.camPos.set(this.x, 3, this.z + 6); }
}

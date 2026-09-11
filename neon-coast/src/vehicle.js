import * as THREE from '../vendor/three.module.min.js';
import { VEHICLES, CAR_COLORS } from './config.js';
import { clamp, damp, mergeGeometries, xform, M4 } from './utils.js';

// Side profiles (x forward, y up). Body and cabin polygons per type.
const PROFILES = {
  sedan:  { body: [[-2.25, 0.36], [2.25, 0.36], [2.25, 0.78], [1.85, 0.92], [-2.0, 0.92], [-2.25, 0.78]], cabin: [[-1.55, 0.92], [1.35, 0.92], [0.75, 1.45], [-1.05, 1.45]], wheel: 0.34 },
  taxi:   { body: [[-2.25, 0.36], [2.25, 0.36], [2.25, 0.78], [1.85, 0.92], [-2.0, 0.92], [-2.25, 0.78]], cabin: [[-1.55, 0.92], [1.35, 0.92], [0.75, 1.45], [-1.05, 1.45]], wheel: 0.34, roofSign: true },
  police: { body: [[-2.35, 0.36], [2.35, 0.36], [2.35, 0.78], [1.95, 0.92], [-2.1, 0.92], [-2.35, 0.78]], cabin: [[-1.6, 0.92], [1.4, 0.92], [0.8, 1.45], [-1.1, 1.45]], wheel: 0.35, lightbar: true, livery: true },
  sport:  { body: [[-2.25, 0.3], [2.25, 0.3], [2.25, 0.62], [1.55, 0.74], [-1.9, 0.8], [-2.25, 0.7]], cabin: [[-1.45, 0.78], [1.35, 0.72], [0.35, 1.18], [-0.95, 1.2]], wheel: 0.36, spoiler: true },
  super:  { body: [[-2.3, 0.28], [2.3, 0.28], [2.3, 0.52], [1.2, 0.66], [-1.6, 0.74], [-2.3, 0.64]], cabin: [[-1.3, 0.72], [1.15, 0.66], [0.1, 1.08], [-0.85, 1.1]], wheel: 0.37, spoiler: true, wing: true },
  muscle: { body: [[-2.45, 0.36], [2.45, 0.36], [2.45, 0.82], [2.05, 0.98], [-2.2, 0.98], [-2.45, 0.82]], cabin: [[-1.5, 0.98], [1.1, 0.98], [0.55, 1.42], [-1.15, 1.42]], wheel: 0.37, spoiler: true, stripe: true },
  suv:    { body: [[-2.4, 0.46], [2.4, 0.46], [2.4, 1.02], [2.0, 1.12], [-2.4, 1.12]], cabin: [[-2.25, 1.12], [1.5, 1.12], [0.95, 1.92], [-2.15, 1.92]], wheel: 0.42, rack: true },
  swat:   { body: [[-2.8, 0.52], [2.8, 0.52], [2.8, 1.22], [2.4, 1.32], [-2.8, 1.32]], cabin: [[-2.65, 1.32], [2.05, 1.32], [1.6, 2.35], [-2.65, 2.35]], wheel: 0.48, lightbar: true },
  limo:   { body: [[-3.2, 0.36], [3.2, 0.36], [3.2, 0.78], [2.8, 0.92], [-3.0, 0.92], [-3.2, 0.78]], cabin: [[-2.6, 0.92], [2.2, 0.92], [1.6, 1.45], [-2.3, 1.45]], wheel: 0.34 },
  truck:  { body: [[1.0, 0.5], [3.3, 0.5], [3.3, 1.4], [3.05, 1.55], [1.0, 1.55]], cabin: [[1.0, 1.55], [3.0, 1.55], [2.7, 2.5], [1.0, 2.5]], wheel: 0.5, cargo: true, sixWheels: true },
};
const matCache = new Map();
const paint = hex => { const k = 'p' + hex; if (!matCache.has(k)) matCache.set(k, new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.32, metalness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.12 })); return matCache.get(k); };
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0a1624, roughness: 0.06, metalness: 0.85, clearcoat: 1.0, clearcoatRoughness: 0.05 });
const propMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.2 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.7 });
const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: 0.18, metalness: 0.95 });
const plateMat = new THREE.MeshStandardMaterial({ color: 0xf2f2e8, roughness: 0.5 });
const wreckMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
const poolTexCache = {};
function poolTex() { if (poolTexCache.t) return poolTexCache.t; const c = document.createElement('canvas'); c.width = 128; c.height = 256; const ctx = c.getContext('2d'); const g = ctx.createRadialGradient(64, 40, 4, 64, 120, 130); g.addColorStop(0, 'rgba(255,240,200,0.9)'); g.addColorStop(0.5, 'rgba(255,230,180,0.35)'); g.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; poolTexCache.t = t; return t; }
const poolMat = new THREE.MeshBasicMaterial({ map: null, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
export function setHeadlightPools(night) { if (!poolMat.map) poolMat.map = poolTex(); poolMat.opacity = Math.max(0, night - 0.15) * 0.85; }
const geoCache = new Map();
function extrude(points, width) { const k = JSON.stringify(points) + width; if (!geoCache.has(k)) { const s = new THREE.Shape(points.map(p => new THREE.Vector2(p[0], p[1]))); const g = new THREE.ExtrudeGeometry(s, { depth: width - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 }); g.translate(0, 0, -(width - 0.12) / 2); g.computeVertexNormals(); geoCache.set(k, g); } return geoCache.get(k); }
function wheelGeo(r) { const k = 'w' + r; if (!geoCache.has(k)) geoCache.set(k, mergeGeometries([xform(new THREE.CylinderGeometry(r, r, 0.26, 16), M4(0, 0, 0, Math.PI / 2, 0, 0), new THREE.Color(0x151517)), xform(new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.28, 8), M4(0, 0, 0, Math.PI / 2, 0, 0), new THREE.Color(0xc4c8d0)), xform(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.3, 8), M4(0, 0, 0, Math.PI / 2, 0, 0), new THREE.Color(0x30323a))])); return geoCache.get(k); }
let policeTex = null;
function policeDoorTex() { if (policeTex) return policeTex; const c = document.createElement('canvas'); c.width = 256; c.height = 64; const ctx = c.getContext('2d'); ctx.fillStyle = '#1b2a55'; ctx.fillRect(0, 0, 256, 64); ctx.fillStyle = '#ffffff'; ctx.font = '900 40px Heebo, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('POLICE', 128, 33); policeTex = new THREE.CanvasTexture(c); policeTex.colorSpace = THREE.SRGBColorSpace; return policeTex; }

export function buildVehicleModel(type, color) {
  const spec = VEHICLES[type], pr = PROFILES[type] || PROFILES.sedan, w = spec.wid; const root = new THREE.Group(); const chassis = new THREE.Group(); root.add(chassis);
  const bodyMat = paint(color); const box = (bw, bh, bd, x, y, z, ry = 0) => xform(new THREE.BoxGeometry(bw, bh, bd), M4(x, y, z, 0, ry, 0));
  const body = new THREE.Mesh(extrude(pr.body, w), bodyMat); body.castShadow = true; body.receiveShadow = true; chassis.add(body);
  const cabin = new THREE.Mesh(extrude(pr.cabin, w * 0.9), glassMat); cabin.castShadow = true; chassis.add(cabin);
  const top = pr.cabin[2], top2 = pr.cabin[3]; const paintParts = [box(Math.abs(top[0] - top2[0]) + 0.1, 0.07, w * 0.9, (top[0] + top2[0]) / 2, top[1], 0)]; const darkParts = [], chromeParts = [], plateParts = [];
  const front = pr.body[1][0], back = pr.body[0][0], ly = pr.body[2][1] - 0.1, by = pr.body[0][1];
  // bumpers, grille, exhaust, door seams, mirrors, plates
  darkParts.push(box(0.16, 0.22, w * 0.98, front + 0.02, by + 0.1, 0)); darkParts.push(box(0.16, 0.22, w * 0.98, back - 0.02, by + 0.1, 0));
  darkParts.push(box(0.05, 0.16, w * 0.42, front + 0.06, ly + 0.02, 0)); chromeParts.push(box(0.06, 0.03, w * 0.42, front + 0.07, ly + 0.08, 0)); chromeParts.push(box(0.06, 0.03, w * 0.42, front + 0.07, ly - 0.04, 0));
  chromeParts.push(xform(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), M4(back - 0.1, by + 0.02, -w * 0.3, 0, 0, Math.PI / 2)));
  const cab0 = pr.cabin[0][0], cab1 = pr.cabin[1][0]; const seamX = pr.cargo ? [] : [cab0 + (cab1 - cab0) * 0.5, cab0 - 0.05, cab1 + 0.05];
  for (const sx of seamX) for (const side of [-1, 1]) darkParts.push(box(0.03, ly - by + 0.3, 0.02, sx, (ly + by) / 2 + 0.1, side * (w / 2 + 0.005)));
  for (const side of [-1, 1]) { paintParts.push(box(0.18, 0.1, 0.22, pr.cabin[1][0] - 0.1, pr.cabin[1][1] + 0.12, side * (w / 2 + 0.1))); }
  plateParts.push(box(0.03, 0.14, 0.5, front + 0.11, by + 0.12, 0)); plateParts.push(box(0.03, 0.14, 0.5, back - 0.11, by + 0.12, 0));
  if (pr.cargo) { const cargo = new THREE.Mesh(new THREE.BoxGeometry(4.1, 2.5, w), paint(0xe8e8e8)); cargo.position.set(-1.25, 1.75, 0); cargo.castShadow = true; chassis.add(cargo); }
  if (pr.spoiler) { paintParts.push(box(0.35, 0.06, w * 0.9, back + 0.1, pr.body[3][1] + 0.32, 0)); for (const z of [-0.6, 0.6]) darkParts.push(box(0.2, 0.3, 0.06, back + 0.1, pr.body[3][1] + 0.16, z)); }
  if (pr.wing) { paintParts.push(box(0.3, 0.05, w * 1.0, back + 0.05, pr.body[3][1] + 0.5, 0)); }
  if (pr.stripe) darkParts.push(box(spec.len - 0.1, 0.02, 0.5, 0, pr.body[3][1] + 0.005, 0));
  if (pr.rack) { for (const z of [-w * 0.3, w * 0.3]) darkParts.push(box(2.2, 0.06, 0.06, -0.6, top[1] + 0.12, z)); for (const x of [-1.5, 0.3]) darkParts.push(box(0.06, 0.12, w * 0.62, x, top[1] + 0.08, 0)); }
  if (pr.roofSign) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.9), new THREE.MeshBasicMaterial({ color: 0xffd34e })); s.position.set(-0.1, top[1] + 0.15, 0); chassis.add(s); }
  if (pr.livery) { const t = policeDoorTex(); for (const side of [-1, 1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.42), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 })); d.position.set((cab0 + cab1) / 2 - 0.2, (ly + by) / 2 + 0.16, side * (w / 2 + 0.01)); d.rotation.y = side > 0 ? 0 : Math.PI; chassis.add(d); } paintParts.length = 0; paintParts.push(box(Math.abs(top[0] - top2[0]) + 0.1, 0.07, w * 0.9, (top[0] + top2[0]) / 2, top[1], 0)); }
  let bar = null;
  if (pr.lightbar) { bar = new THREE.Group(); bar.position.set((top[0] + top2[0]) / 2 + 0.1, top[1] + 0.12, 0); darkParts.push(box(0.35, 0.12, 1.25, bar.position.x, bar.position.y, 0));
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), new THREE.MeshBasicMaterial({ color: 0x550000 })); red.position.z = 0.34; const blue = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), new THREE.MeshBasicMaterial({ color: 0x000055 })); blue.position.z = -0.34; bar.add(red); bar.add(blue); bar.userData = { red, blue }; chassis.add(bar); }
  const pm = new THREE.Mesh(mergeGeometries(paintParts), pr.livery ? paint(0x1b2a55) : bodyMat); pm.castShadow = true; chassis.add(pm);
  const dm = new THREE.Mesh(mergeGeometries(darkParts), darkMat); dm.castShadow = true; chassis.add(dm);
  chassis.add(new THREE.Mesh(mergeGeometries(chromeParts), chromeMat)); chassis.add(new THREE.Mesh(mergeGeometries(plateParts), plateMat));
  const fl = new THREE.MeshBasicMaterial({ color: 0xfff1c8 }), rl = new THREE.MeshBasicMaterial({ color: 0x7a1010 });
  const fGeos = [], rGeos = []; for (const z of [-w * 0.34, w * 0.34]) { fGeos.push(box(0.08, 0.18, 0.34, front + 0.02, ly, z)); rGeos.push(box(0.08, 0.16, 0.4, back - 0.02, ly, z)); }
  chassis.add(new THREE.Mesh(mergeGeometries(fGeos), fl)); chassis.add(new THREE.Mesh(mergeGeometries(rGeos), rl));
  // headlight pool on the ground
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.2, 9), poolMat); pool.rotation.x = -Math.PI / 2; pool.rotation.z = -Math.PI / 2; pool.position.set(front + 4.6, 0.04, 0); root.add(pool);
  // wheels: one instanced mesh per car
  const ax = pr.cargo ? [2.3, -0.6, -2.0] : [spec.len * 0.32, -spec.len * 0.32]; const wheelPos = []; for (let i = 0; i < ax.length; i++) for (const z of [-w / 2 + 0.05, w / 2 - 0.05]) wheelPos.push({ x: ax[i], z, front: i === 0 });
  const wheels = new THREE.InstancedMesh(wheelGeo(pr.wheel), propMat, wheelPos.length); wheels.castShadow = true; root.add(wheels);
  return { root, chassis, body, cabin, roof: pm, wheels, wheelPos, bar, rearMat: rl, frontMat: fl, wheelR: pr.wheel, bodyMat, pool };
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
let nextId = 1;
export class Vehicle {
  constructor(type, color, x, z, heading) {
    this.id = nextId++; this.type = type; this.spec = VEHICLES[type]; this.color = color ?? CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    if (type === 'taxi') this.color = 0xffd034; if (type === 'police') this.color = 0xf2f2f4; if (type === 'swat') this.color = 0x1d2026; if (type === 'limo') this.color = Math.random() < 0.7 ? 0x0c0c10 : 0xf4f4f4;
    this.model = buildVehicleModel(type, this.color); this.mesh = this.model.root;
    this.x = x; this.z = z; this.y = 0; this.heading = heading; this.vx = 0; this.vz = 0; this.steer = 0; this.yawKick = 0; this.hp = this.spec.hp; this.maxHp = this.spec.hp;
    this.driver = null; this.ai = null; this.siren = false; this.wrecked = false; this.spin = 0; this.prevVf = 0; this.roll = 0; this.pitch = 0; this.braking = false; this.hornT = 0; this.lastImpact = 0; this.special = null; this.lightsOn = true; this.parked = false;
    this.input = { throttle: 0, steer: 0, brake: false, handbrake: false };
    this.syncMesh();
  }
  get fx() { return Math.cos(this.heading); } get fz() { return -Math.sin(this.heading); }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get forwardSpeed() { return this.vx * this.fx + this.vz * this.fz; }
  step(dt) {
    if (this.wrecked) { this.vx *= 0.9; this.vz *= 0.9; this.x += this.vx * dt; this.z += this.vz * dt; return; }
    const s = this.spec, inp = this.input; const fx = this.fx, fz = this.fz, rx = -fz, rz = fx;
    let vf = this.vx * fx + this.vz * fz, vr = this.vx * rx + this.vz * rz; const speed = Math.abs(vf);
    const dmg = 0.55 + 0.45 * (this.hp / this.maxHp); // damaged engines lose power
    if (inp.throttle > 0) vf += s.accel * dmg * inp.throttle * Math.max(0, 1 - vf / (s.maxSpeed * dmg)) * dt;
    if (inp.throttle < 0) { if (vf > 0.5) vf -= s.brake * dt; else vf -= s.accel * 0.45 * dt * Math.max(0, 1 + vf / 12); }
    this.braking = inp.brake || (inp.throttle < 0 && vf > 0.5);
    if (inp.brake) vf -= Math.sign(vf) * Math.min(Math.abs(vf), s.brake * 1.1 * dt);
    vf -= vf * 0.010 * speed * dt; if (!inp.throttle) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 1.3 * dt);
    const grip = inp.handbrake ? s.grip * 0.16 : s.grip; vr -= vr * Math.min(1, grip * dt);
    const steerLimit = s.steer / (1 + speed / 24); this.steer = damp(this.steer, inp.steer * steerLimit, 10, dt);
    const wheelbase = s.len * 0.62; let yawRate = (vf / wheelbase) * Math.tan(this.steer); if (inp.handbrake && speed > 4) yawRate *= 1.7;
    this.yawKick *= Math.max(0, 1 - 4 * dt); this.heading += (yawRate + this.yawKick) * dt;
    this.vx = fx * vf + rx * vr; this.vz = fz * vf + rz * vr; this.x += this.vx * dt; this.z += this.vz * dt;
    this.slip = Math.abs(vr);
    const accel = (vf - this.prevVf) / Math.max(dt, 1e-3); this.prevVf = vf;
    this.roll = damp(this.roll, clamp(yawRate * vf * 0.012, -0.09, 0.09), 8, dt); this.pitch = damp(this.pitch, clamp(-accel * 0.005, -0.05, 0.06), 8, dt);
    this.spin += vf / this.model.wheelR * dt;
    if (this.hornT > 0) this.hornT -= dt;
  }
  // collide with static world grid. returns impact magnitude (m/s) of the strongest hit this step
  collideStatic(grid, tmp) {
    const s = this.spec, hw = s.wid * 0.5, r = hw * 0.98, d = Math.max(0.3, s.len * 0.5 - hw); let worst = 0;
    for (const off of [d, -d]) {
      const px = this.x + this.fx * off, pz = this.z + this.fz * off; const hit = grid.circleHit(px, pz, r, tmp); if (!hit) continue;
      this.x += hit.nx * hit.depth; this.z += hit.nz * hit.depth;
      const vn = this.vx * hit.nx + this.vz * hit.nz;
      if (vn < 0) { const e = 0.25; this.vx -= (1 + e) * vn * hit.nx; this.vz -= (1 + e) * vn * hit.nz; const impact = -vn; worst = Math.max(worst, impact);
        this.yawKick += off * (this.fx * hit.nz - this.fz * hit.nx) * impact * 0.35;
        if (impact > 4) this.damage(impact * (hit.box.type === 'pole' ? 1.2 : 2.2), 'crash'); }
    }
    return worst;
  }
  damage(n, source) { if (this.wrecked) return; this.hp -= n; this.lastImpact = performance.now(); if (this.hp <= 0) this.wreck(); }
  wreck() { if (this.wrecked) return; this.wrecked = true; this.hp = 0; this.siren = false; this.model.body.material = wreckMat; this.model.roof.material = wreckMat; this.model.cabin.material = wreckMat; this.model.frontMat.color.setHex(0x222222); this.model.rearMat.color.setHex(0x220000); this.model.wheels.material = wreckMat; this.model.pool.visible = false; if (this.model.bar) { this.model.bar.userData.red.material.color.setHex(0x111111); this.model.bar.userData.blue.material.color.setHex(0x111111); } this.onWreck?.(this); }
  repair() { this.hp = this.maxHp; }
  syncMesh(t = 0) {
    const m = this.mesh; m.position.set(this.x, this.y, this.z); m.rotation.y = this.heading; this.model.chassis.rotation.x = this.roll; this.model.chassis.rotation.z = this.pitch;
    const wm = this.model.wheels, wp = this.model.wheelPos; for (let i = 0; i < wp.length; i++) { _q.setFromEuler(_e.set(0, wp[i].front ? this.steer : 0, -this.spin)); _m.compose(_v.set(wp[i].x, this.model.wheelR, wp[i].z), _q, _one); wm.setMatrixAt(i, _m); } wm.instanceMatrix.needsUpdate = true;
    if (!this.wrecked) this.model.rearMat.color.setHex(this.braking ? 0xff2a2a : (this.lightsOn ? 0xa01818 : 0x4a0d0d));
    if (this.model.bar && !this.wrecked) { const on = this.siren; const ph = Math.floor(t * 6) % 2; this.model.bar.userData.red.material.color.setHex(on && ph === 0 ? 0xff2020 : 0x550000); this.model.bar.userData.blue.material.color.setHex(on && ph === 1 ? 0x2a60ff : 0x000055); }
  }
  // OBB-ish test: is world point (x,z) inside the car footprint (+margin)?
  contains(x, z, margin = 0) { const dx = x - this.x, dz = z - this.z; const lf = dx * this.fx + dz * this.fz, lr = dx * -this.fz + dz * this.fx; return Math.abs(lf) < this.spec.len / 2 + margin && Math.abs(lr) < this.spec.wid / 2 + margin; }
  seatPosition(side = 1) { const rx = -this.fz, rz = this.fx; return { x: this.x + rx * side * (this.spec.wid / 2 + 0.9) - this.fx * 0.3, z: this.z + rz * side * (this.spec.wid / 2 + 0.9) - this.fz * 0.3 }; }
}

// pairwise vehicle collisions (two circles per car)
const _pts = [];
export function collideVehicles(list) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j]; if (a.parked && b.parked && a.speed < 0.05 && b.speed < 0.05) continue; const dx = b.x - a.x, dz = b.z - a.z; const rr = (a.spec.len + b.spec.len) * 0.5 + 0.5; if (dx * dx + dz * dz > rr * rr) continue;
    const ra = a.spec.wid * 0.5, rb = b.spec.wid * 0.5, da = Math.max(0.3, a.spec.len * 0.5 - ra), db = Math.max(0.3, b.spec.len * 0.5 - rb);
    for (const oa of [da, -da]) for (const ob of [db, -db]) {
      const ax = a.x + a.fx * oa, az = a.z + a.fz * oa, bx = b.x + b.fx * ob, bz = b.z + b.fz * ob; let nx = bx - ax, nz = bz - az; const d = Math.hypot(nx, nz), min = ra + rb; if (d >= min || d < 1e-5) continue;
      nx /= d; nz /= d; const pen = min - d; const ma = a.spec.mass * (a.parked ? 4 : 1), mb = b.spec.mass * (b.parked ? 4 : 1), tot = ma + mb;
      a.x -= nx * pen * (mb / tot); a.z -= nz * pen * (mb / tot); b.x += nx * pen * (ma / tot); b.z += nz * pen * (ma / tot);
      const rvx = b.vx - a.vx, rvz = b.vz - a.vz, vn = rvx * nx + rvz * nz; if (vn > 0) continue;
      const e = 0.3, jn = -(1 + e) * vn / (1 / ma + 1 / mb); a.vx -= jn * nx / ma; a.vz -= jn * nz / ma; b.vx += jn * nx / mb; b.vz += jn * nz / mb;
      const impact = -vn; a.yawKick += oa * (a.fx * nz - a.fz * nx) * -impact * 0.25; b.yawKick += ob * (b.fx * nz - b.fz * nx) * impact * 0.25;
      if (impact > 3) { a.damage(impact * 1.6 * (mb / ma), 'car'); b.damage(impact * 1.6 * (ma / mb), 'car'); a.hit?.(b, impact); b.hit?.(a, impact); }
      a.disturbed = b.disturbed = 1.5;
    }
  }
}

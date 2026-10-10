import { Vehicle } from './vehicle.js';
import { TRAFFIC, CAR_COLORS } from './config.js';
import { clamp, wrapAngle, dist, pick } from './utils.js';

const TYPE_WEIGHTS = [['sedan', 34], ['suv', 18], ['sport', 11], ['taxi', 12], ['truck', 8], ['muscle', 9], ['police', 6]];
export function randomType(noPolice) { const list = noPolice ? TYPE_WEIGHTS.filter(t => t[0] !== 'police') : TYPE_WEIGHTS; const tot = list.reduce((s, t) => s + t[1], 0); let r = Math.random() * tot; for (const t of list) { r -= t[1]; if (r <= 0) return t[0]; } return 'sedan'; }

// Generic point-steering used by traffic and police.
export function steerToward(v, tx, tz, targetSpeed, dt, opts = {}) {
  const dx = tx - v.x, dz = tz - v.z; const want = Math.atan2(-dz, dx); const err = wrapAngle(want - v.heading); const vf = v.forwardSpeed; const d = Math.hypot(dx, dz);
  let steer = clamp(err * 2.2, -1, 1), throttle, brake = false;
  const reverse = opts.allowReverse && ((Math.abs(err) > 2.0 && d < 14) || opts.forceReverse);
  if (reverse) { steer = -Math.sign(err || 1); throttle = -1; }
  else { const sp = targetSpeed * (1 - Math.min(1, Math.abs(err) * 1.1) * 0.7); throttle = clamp((sp - vf) * 0.45, -1, 1); if (targetSpeed < 0.5 && vf > 0.3) { throttle = 0; brake = true; } if (vf < -0.5 && targetSpeed > 0) { steer = clamp(err * 2.2, -1, 1); } }
  v.input.steer = steer; v.input.throttle = throttle; v.input.brake = brake; v.input.handbrake = false;
}
export function acquireLane(v, W) {
  const n = W.nearestLane(v.x, v.z); v.ai.seg = n.seg; v.ai.dir = n.dir; v.ai.lane = n.lane; v.ai.L = n.L; planNext(v, W);
}
function planNext(v, W) {
  const ai = v.ai, L = ai.L, from = L.from, node = L.to; const opts = node.out.filter(o => o.to !== from); const list = opts.length ? opts : node.out;
  let best = null, tot = 0; const weighted = list.map(o => { const straight = (o.to.x - node.x) * L.fx + (o.to.z - node.z) * L.fz > 0.5; const w = straight ? 3 : 1; tot += w; return { o, w }; });
  let r = Math.random() * tot; for (const { o, w } of weighted) { r -= w; if (r <= 0) { best = o; break; } } best = best || list[0];
  ai.nextSeg = best.seg; ai.nextDir = best.dir; ai.next = W.lane(best.seg, best.dir, ai.lane);
}
function obstacleAhead(v, game) {
  let best = null; const fx = v.fx, fz = v.fz, rx = -fz, rz = fx; const range = 9 + v.speed * 1.3;
  for (const o of game.vehicles) {
    if (o === v) continue; const dx = o.x - v.x, dz = o.z - v.z; if (Math.abs(dx) > range + 6 || Math.abs(dz) > range + 6) continue;
    const f = dx * fx + dz * fz, r = dx * rx + dz * rz; if (f < 0 || f > range) continue; if (Math.abs(r) > 2.2 + o.spec.wid * 0.5) continue;
    const d = Math.max(0, f - (o.spec.len + v.spec.len) * 0.5); if (!best || d < best.d) best = { d, speed: o.forwardSpeed * (o.fx * fx + o.fz * fz), stationary: o.speed < 0.6, obj: o };
  }
  const pedCheck = (px, pz, who) => { const dx = px - v.x, dz = pz - v.z; const f = dx * fx + dz * fz, r = dx * rx + dz * rz; if (f < 0 || f > range * 0.8 || Math.abs(r) > 2.3) return; const d = Math.max(0, f - v.spec.len * 0.5); if (!best || d < best.d) best = { d, speed: 0, stationary: true, ped: who }; };
  for (const p of game.peds) { if (p.dead || p.ragdoll) continue; if (Math.abs(p.x - v.x) > range || Math.abs(p.z - v.z) > range) continue; pedCheck(p.x, p.z, p); }
  const P = game.player; if (!P.vehicle && !P.dead) pedCheck(P.x, P.z, P);
  return best;
}
export function laneFollow(v, game, dt) {
  const W = game.world, ai = v.ai; if (!ai.L) acquireLane(v, W);
  let L = ai.L; let s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz;
  if (s > L.len - 1.0) { ai.seg = ai.nextSeg; ai.dir = ai.nextDir; ai.L = ai.next; planNext(v, W); L = ai.L; s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz; }
  const look = 5 + v.speed * 0.5; const ts = s + look; let tx, tz;
  if (ts <= L.len) { tx = L.sx + L.fx * ts; tz = L.sz + L.fz * ts; } else { const N = ai.next, t2 = clamp(ts - L.len - 2, 0, N.len); tx = N.sx + N.fx * t2; tz = N.sz + N.fz * t2; }
  let target = ai.panic > 0 ? ai.cruise * 1.9 : ai.cruise; const distEnd = L.len - s; const turning = ai.next.fx !== L.fx || ai.next.fz !== L.fz;
  if (turning && distEnd < 20) target = Math.min(target, 7.5);
  if (ai.panic <= 0) { const light = W.lightState(L.to, L.fx ? 'ew' : 'ns', game.time); if (light !== 'g' && distEnd < 17 && distEnd > -1 && !(light === 'y' && distEnd < 6 && v.speed > 5)) target = distEnd < 3.2 ? 0 : Math.min(target, Math.max(0, distEnd - 2.5) * 0.9); }
  const ob = obstacleAhead(v, game);
  if (ob) { if (ob.d < 6.5) { target = 0; if (ob.stationary) ai.blocked += dt; if (ob.ped && ob.d < 7 && v.hornT <= 0 && Math.random() < 0.4) { v.hornT = 2.5 + Math.random() * 3; game.audio.horn(dist(v.x, v.z, game.player.x, game.player.z)); } } else target = Math.min(target, Math.max(0, ob.speed) + (ob.d - 6.5) * 0.7); }
  else ai.blocked = 0;
  if (ai.blocked > 3.5) { ai.blocked = 0; ai.lane = 1 - ai.lane; ai.L = W.lane(ai.seg, ai.dir, ai.lane); ai.next = W.lane(ai.nextSeg, ai.nextDir, ai.lane); if (v.hornT <= 0) { v.hornT = 4; game.audio.horn(dist(v.x, v.z, game.player.x, game.player.z)); } }
  if (ai.panic > 0) ai.panic -= dt;
  steerToward(v, tx, tz, target, dt);
}

// Pursuit driving along the road network: at every intersection pick the exit closest to the target; ram directly when the line is clear.
function planNextToward(v, W, tx, tz) {
  const ai = v.ai, L = ai.L, from = L.from, node = L.to; const opts = node.out.filter(o => o.to !== from); const list = opts.length ? opts : node.out;
  let best = null, bd = Infinity; for (const o of list) { const d = Math.hypot(o.to.x - tx, o.to.z - tz) + Math.random() * 6; if (d < bd) { bd = d; best = o; } }
  ai.nextSeg = best.seg; ai.nextDir = best.dir; ai.next = W.lane(best.seg, best.dir, ai.lane);
}
export function pursue(v, game, dt, tx, tz, speed = 40) {
  const W = game.world, ai = v.ai; const d = Math.hypot(tx - v.x, tz - v.z) || 0.001;
  const clear = d < 48 && game.grid.raycast(v.x, 1, v.z, (tx - v.x) / d, 0, (tz - v.z) / d, d) >= d - 0.5;
  if (clear || d < 14) { ai.direct = true; steerToward(v, tx, tz, speed, dt, { allowReverse: true }); return; }
  if (ai.direct || !ai.L || !ai.next) { ai.direct = false; acquireLane(v, W); planNextToward(v, W, tx, tz); }
  let L = ai.L; let s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz;
  if (s > L.len - 1.0) { ai.seg = ai.nextSeg; ai.dir = ai.nextDir; ai.L = ai.next; ai.lane = ai.lane; planNextToward(v, W, tx, tz); L = ai.L; s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz; }
  if (Math.abs(s) > L.len + 30 || Math.abs((v.x - L.sx) * -L.fz + (v.z - L.sz) * L.fx) > 12) { acquireLane(v, W); planNextToward(v, W, tx, tz); L = ai.L; s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz; }
  const look = 6 + v.speed * 0.45; const ts = s + look; let px, pz;
  if (ts <= L.len) { px = L.sx + L.fx * ts; pz = L.sz + L.fz * ts; } else { const N = ai.next, t2 = clamp(ts - L.len - 2, 0, N.len); px = N.sx + N.fx * t2; pz = N.sz + N.fz * t2; }
  let target = speed * 0.9; const distEnd = L.len - s; const turning = ai.next.fx !== L.fx || ai.next.fz !== L.fz; if (turning && distEnd < 14) target = Math.min(target, 13);
  const ob = obstacleAhead(v, game); if (ob && !ob.ped && ob.obj !== game.player.vehicle) { if (ob.d < 5) target = Math.min(target, 4); else target = Math.min(target, Math.max(6, ob.speed + ob.d)); }
  steerToward(v, px, pz, target, dt);
}

export class Traffic {
  constructor(game) { this.game = game; this.spawnT = 0; }
  init() {
    const G = this.game, W = G.world;
    for (const s of W.parkingSpots) { if (Math.random() > 0.4) continue; const v = new Vehicle(randomType(true), pick(CAR_COLORS), s.x, s.z, s.heading); v.parked = true; G.addVehicle(v); }
    const d = W.pois.dealer; if (d) for (let i = 0; i < 3; i++) { const v = new Vehicle(['sport', 'muscle', 'suv'][i], [0xff4fa3, 0x3ce8f5, 0xf2f2f2][i], d.x + 4 + i * 6, d.z - 5.5, Math.PI / 2); v.parked = true; v.locked = true; G.addVehicle(v); }
    for (let i = 0; i < 18; i++) this.spawn(true);
  }
  spawn(initial = false) {
    const G = this.game, W = G.world, P = G.player; const camF = G.cameraForward();
    for (let tries = 0; tries < 12; tries++) {
      const p = W.randomLanePoint(); const d = dist(p.x, p.z, P.x, P.z); if (d < (initial ? 30 : TRAFFIC.spawnMin) || d > TRAFFIC.spawnMax) continue;
      if (!initial && ((p.x - P.x) * camF.x + (p.z - P.z) * camF.z) / d > 0.35 && d < 150) continue;
      let ok = true; for (const o of G.vehicles) if (dist(o.x, o.z, p.x, p.z) < 14) { ok = false; break; } if (!ok) continue;
      const type = randomType(G.police.level > 0); const v = new Vehicle(type, pick(CAR_COLORS), p.x, p.z, p.heading);
      v.ai = { mode: type === 'police' ? 'patrol' : 'traffic', seg: p.seg, dir: p.dir, lane: p.lane, L: p.L, cruise: 11 + Math.random() * 6, blocked: 0, panic: 0 }; planNext(v, W);
      v.vx = v.fx * 8; v.vz = v.fz * 8; if (type === 'police') v.lightsOn = true; G.addVehicle(v); return v;
    }
    return null;
  }
  update(dt) {
    const G = this.game, P = G.player; let count = 0;
    for (const v of G.vehicles) if (v.ai && !v.wrecked && v.ai.mode !== 'police' && v.ai.mode !== 'deployed') count++;
    this.spawnT -= dt; if (count < TRAFFIC.cars && this.spawnT <= 0) { this.spawnT = 0.35; this.spawn(); }
    for (let i = G.vehicles.length - 1; i >= 0; i--) {
      const v = G.vehicles[i]; if (v === P.vehicle || (v.special && !v.ai)) continue; const d = dist(v.x, v.z, P.x, P.z);
      if ((v.ai || v.wrecked) && !v.parked && d > TRAFFIC.despawn) { G.removeVehicle(v); continue; }
      if (v.wrecked && d > 120 && Math.random() < 0.01) { G.removeVehicle(v); continue; }
      if (!v.ai || v.wrecked) continue; if (v.ai.mode === 'police' || v.ai.mode === 'deployed') continue;
      if (v.disturbed > 0) { v.disturbed -= dt; v.input.throttle = 0; v.input.brake = true; v.input.steer = 0; if (v.disturbed <= 0) acquireLane(v, G.world); continue; }
      if (d > 320) continue; laneFollow(v, G, dt);
    }
  }
}

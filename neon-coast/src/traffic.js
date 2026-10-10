import { Vehicle } from './vehicle.js';
import { TRAFFIC, CAR_COLORS, CITY } from './config.js';
import { clamp, wrapAngle, dist, pick, damp } from './utils.js';

const TYPE_WEIGHTS = [['sedan', 34], ['suv', 18], ['sport', 11], ['taxi', 12], ['truck', 8], ['muscle', 9], ['police', 6]];
export function randomType(noPolice) { const list = noPolice ? TYPE_WEIGHTS.filter(t => t[0] !== 'police') : TYPE_WEIGHTS; const tot = list.reduce((s, t) => s + t[1], 0); let r = Math.random() * tot; for (const t of list) { r -= t[1]; if (r <= 0) return t[0]; } return 'sedan'; }

// ---------- flow tunables ----------
// Following keeps a bumper gap of FOLLOW_GAP + FOLLOW_TIME * own speed to a car that moves or queues. Something that will not clear by itself (wreck, parked car, the
// player's car, a pedestrian) gets a bigger stand-off, which also leaves room to steer around it.
const FOLLOW_GAP = 2.2, FOLLOW_TIME = 0.55, FOLLOW_GAIN = 0.9, STAND_OFF = 6, PED_STAND_OFF = 5;
// Blocked behind something stationary: announce a lane change after LC_SIGNAL_AT s, try it from LC_AT s on, honk only after HONK_AT s.
const LC_SIGNAL_AT = 2.6, LC_AT = 3.5, HONK_AT = 6, LC_RETRY = 0.4, LC_COOL = 2;
// Lane change: the steer target glides across at LC_RATE (1/s); the target lane must be free within +-GAP_LAT m sideways and -GAP_BACK..GAP_FWD m along the lane.
const PASS_SPEED = 3.5; // m/s while a lane change swings round the car that blocked the old lane
const LC_RATE = 1.6, GAP_LAT = 1.8, GAP_BACK = 9, GAP_FWD = 14;
// Two cars that block each other (crossing or oncoming, typically skewed inside a junction) never resolve by themselves: after BACKOFF_MIN + a per-car random
// spread of seconds blocked, one of them reverses for BACKOFF_TIME s, which opens the other one's way. The cars never reverse into something.
const BACKOFF_MIN = 5, BACKOFF_SPREAD = 4, BACKOFF_TIME = 1.4, BACKOFF_SPEED = 1.8, BACKOFF_PAUSE = 1.5;
// A chain of cars that wait for each other is treated as waiting for at most this long (so a gridlock cycle cannot hold for ever).
const WAIT_MAX = 45;
// Last resort for a jam that the back-off cannot dissolve (a queue standing behind a skewed car in a junction): a traffic car blocked this long leaves the world and the spawner
// replaces it. Unseen by the camera it goes after JAM_HIDDEN s, otherwise after JAM_VISIBLE s, and never closer than JAM_MIN_DIST m to the player.
const JAM_HIDDEN = 30, JAM_VISIBLE = 90, JAM_MIN_DIST = 25;

// Generic point-steering used by traffic and police.
export function steerToward(v, tx, tz, targetSpeed, dt, opts = {}) {
  const dx = tx - v.x, dz = tz - v.z; const want = Math.atan2(-dz, dx); const err = wrapAngle(want - v.heading); const vf = v.forwardSpeed; const d = Math.hypot(dx, dz);
  let steer = clamp(err * 2.2, -1, 1), throttle, brake = false;
  const reverse = opts.allowReverse && ((Math.abs(err) > 2.0 && d < 14) || opts.forceReverse);
  if (reverse) { steer = -Math.sign(err || 1); throttle = -1; }
  // A target below 0.5 m/s means "stop": brake while rolling and keep the brake held at standstill, so the brake lights stay on while waiting and the car cannot creep.
  else { const sp = targetSpeed * (1 - Math.min(1, Math.abs(err) * 1.1) * 0.7); throttle = clamp((sp - vf) * 0.45, -1, 1); if (targetSpeed < 0.5 && vf > -0.3) { throttle = 0; brake = true; } if (vf < -0.5 && targetSpeed > 0) { steer = clamp(err * 2.2, -1, 1); } }
  v.input.steer = steer; v.input.throttle = throttle; v.input.brake = brake; v.input.handbrake = false;
}
// Puts the car on the lane that suits it best. (hx, hz) is the direction the car should be heading; it defaults to the car's own heading, so a car that was
// spun round by a collision picks the lane that runs the way it is facing. The result is stored in v.ai and the lane-change state is reset.
export function acquireLane(v, W, hx = v.fx, hz = v.fz) {
  const n = W.nearestLane(v.x, v.z, hx, hz), ai = v.ai; ai.seg = n.seg; ai.dir = n.dir; ai.lane = n.lane; ai.L = n.L; ai.latOff = 0; ai.waiting = false; ai.waitT = 0; ai.lcT = 0; ai.passT = 0; ai.appr = 0; planNext(v, W);
}
function planNext(v, W) {
  const ai = v.ai, L = ai.L, from = L.from, node = L.to; const opts = node.out.filter(o => o.to !== from); const list = opts.length ? opts : node.out;
  let best = null, tot = 0; const weighted = list.map(o => { const straight = (o.to.x - node.x) * L.fx + (o.to.z - node.z) * L.fz > 0.5; const w = straight ? 3 : 1; tot += w; return { o, w }; });
  let r = Math.random() * tot; for (const { o, w } of weighted) { r -= w; if (r <= 0) { best = o; break; } } best = best || list[0];
  ai.nextSeg = best.seg; ai.nextDir = best.dir; ai.next = W.lane(best.seg, best.dir, ai.lane);
}
// True for a car that is held up by a red light (or by a car that is) and will move again by itself. Wrecks and disturbed cars never count.
const isWaiting = o => !!(o.ai && o.ai.waiting && !o.wrecked && !(o.disturbed > 0));

// Nearest thing in front of a car, in a shared scratch record (read it before the next call). lat = the car's sideways distance from the lane centre-line while it glides into the next
// lane (+ = right of it): the corridor then follows its intended path, so the car that blocked the old lane stops being an obstacle once the path has cleared it.
const OB = { d: 0, speed: 0, stationary: false, obj: null, ped: null }; let _obD = Infinity;
function obSet(d, speed, stationary, obj, ped) { if (d >= _obD) return; _obD = d; OB.d = d; OB.speed = speed; OB.stationary = stationary; OB.obj = obj; OB.ped = ped; }
function pedCheck(v, px, pz, who, fx, fz, range, lat, sp) {
  const dx = px - v.x, dz = pz - v.z, f = dx * fx + dz * fz; if (f < 0 || f > range * 0.8) return;
  let r = dx * -fz + dz * fx, lim = 2.3; if (lat !== 0) { r += lat * (1 - Math.exp(-LC_RATE * f / sp)); lim = 1.5; } if (Math.abs(r) > lim) return;
  obSet(Math.max(0, f - v.spec.len * 0.5), 0, true, null, who);
}
function obstacleAhead(v, game, lat = 0) {
  _obD = Infinity; const fx = v.fx, fz = v.fz, rx = -fz, rz = fx, range = 13 + v.speed * 1.3, sp = Math.max(v.speed, 2.5); // range: centre distance, it has to cover the stand-off plus both half lengths
  for (const o of game.vehicles) {
    if (o === v) continue; const dx = o.x - v.x, dz = o.z - v.z; if (Math.abs(dx) > range + 6 || Math.abs(dz) > range + 6) continue;
    const f = dx * fx + dz * fz; if (f < 0 || f > range) continue;
    // sideways reach of the other car's body: a car lying across or at an angle to the lane takes more room than its width
    const still = o.speed < 0.6, reach = still ? Math.abs(o.fx * rx + o.fz * rz) * o.spec.len * 0.5 + Math.abs(o.fx * fx + o.fz * fz) * o.spec.wid * 0.5 : o.spec.wid * 0.5;
    let r = dx * rx + dz * rz, lim = (still ? v.spec.wid * 0.5 + 1.1 : 2.2) + reach; if (lat !== 0) { r += lat * (1 - Math.exp(-LC_RATE * f / sp)); lim = v.spec.wid * 0.5 + reach + 0.3; } if (Math.abs(r) > lim) continue;
    obSet(Math.max(0, f - (o.spec.len + v.spec.len) * 0.5), o.forwardSpeed * (o.fx * fx + o.fz * fz), still, o, null);
  }
  for (const p of game.peds) { if (p.dead || p.ragdoll) continue; if (Math.abs(p.x - v.x) > range || Math.abs(p.z - v.z) > range) continue; pedCheck(v, p.x, p.z, p, fx, fz, range, lat, sp); }
  const P = game.player; if (!P.vehicle && !P.dead) pedCheck(v, P.x, P.z, P, fx, fz, range, lat, sp);
  return _obD < Infinity ? OB : null;
}
// Is the stretch behind the car (len m beyond its rear bumper, its own width wide) free of vehicles?
function clearBehind(v, game, len) {
  const bx = -v.fx, bz = -v.fz, rx = -v.fz, rz = v.fx;
  for (const o of game.vehicles) {
    if (o === v) continue; const dx = o.x - v.x, dz = o.z - v.z; if (Math.abs(dx) > 14 || Math.abs(dz) > 14) continue;
    const f = dx * bx + dz * bz, r = dx * rx + dz * rz; if (f > 0 && f < len + (o.spec.len + v.spec.len) * 0.5 && Math.abs(r) < (o.spec.wid + v.spec.wid) * 0.5 + 0.4) return false;
  }
  return true;
}
// A car about to turn left gives way to oncoming traffic that reaches the junction within YIELD_TTC s (oncoming cars that turn left themselves do not conflict).
const YIELD_TTC = 3.5, YIELD_MAX = 9; // ... but never longer than YIELD_MAX s (dense oncoming traffic must not starve the turn)
function oncomingConflict(v, game, L, node) {
  for (const o of game.vehicles) {
    if (o === v || o.wrecked) continue; const dx = o.x - node.x, dz = o.z - node.z; if (Math.abs(dx) > 48 || Math.abs(dz) > 48) continue;
    const toward = -(o.vx * L.fx + o.vz * L.fz); if (toward < 1.5 || o.fx * L.fx + o.fz * L.fz > -0.7) continue; // moving towards us along the lane's axis
    const rel = dx * L.fx + dz * L.fz, side = dx * L.rx + dz * L.rz; if (rel < -8 || Math.abs(side) > 7) continue;
    if (Math.max(0, rel - 2) / toward > YIELD_TTC) continue;
    const oa = o.ai; if (oa && oa.next && oa.L && oa.L.fx * oa.next.fz - oa.L.fz * oa.next.fx < 0 && (oa.next.fx !== oa.L.fx || oa.next.fz !== oa.L.fz)) continue; // it turns left too
    return true;
  }
  return false;
}
// Moves an AI car to the other lane of its road (0 = inner, 1 = outer) if that lane is free: no vehicle within +-1.8 m sideways of the target lane centre and
// -9..+14 m along it (the window grows with the closing speed), and no waiting car (a queue) within 40 m ahead in the car's own lane. The lane index changes at once, but the steer target stays on the old line (ai.latOff = old offset - new
// offset, +-3.5 m) and glides over at LC_RATE, so the car swings across instead of snapping. Refused while the car waits for a light, is still gliding from a previous
// change or is about to enter a junction. Returns true when the change started.
export function tryLaneChange(v, game, lane) {
  const ai = v.ai, W = game.world; if (!ai || !ai.L || !W) return false;
  if ((lane !== 0 && lane !== 1) || lane === ai.lane || ai.waiting) return false;
  if (Math.abs(ai.latOff || 0) > 0.6) return false;
  // only from a settled position: on the lane (not skewed in a junction), pointing along it, and far enough from the next junction
  const L = ai.L, s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz; if (s < 6 || L.len - s < (ai.blocked > 8 ? 6 : Math.max(10, 6 + v.speed * 1.5))) return false;
  if (v.fx * L.fx + v.fz * L.fz < 0.985 || Math.abs((v.x - L.sx) * L.rx + (v.z - L.sz) * L.rz) > 1.2) return false;
  const dl = lane - ai.lane, shift = dl * CITY.lane, vl = v.vx * L.fx + v.vz * L.fz;
  for (const o of game.vehicles) {
    if (o === v) continue; const dx = o.x - v.x, dz = o.z - v.z; if (Math.abs(dx) > 45 || Math.abs(dz) > 45) continue;
    const lon = dx * L.fx + dz * L.fz, side = (o.x - L.sx) * L.rx + (o.z - L.sz) * L.rz, lat = side - shift;
    if (isWaiting(o) && o.fx * L.fx + o.fz * L.fz > 0.7) { // a queue ahead in this lane (along the lane, or along the car's own heading): no weaving past it
      if (lon > 0 && lon < 40 && Math.abs(side) < 2.4) return false;
      const hf = dx * v.fx + dz * v.fz, hr = dx * -v.fz + dz * v.fx; if (hf > 0 && hf < 30 && Math.abs(hr) < 2.4) return false;
    }
    if (Math.abs(lat) > GAP_LAT + Math.abs(o.fx * L.rx + o.fz * L.rz) * o.spec.len * 0.5) continue; // a skewed car reaches further sideways
    const rel = o.vx * L.fx + o.vz * L.fz - vl; // rel > 0: the other car is faster than this one along the lane
    if (lon > -(GAP_BACK + Math.max(0, rel)) && lon < GAP_FWD + Math.max(0, -rel) * 0.8) return false;
  }
  ai.latOff = (ai.latOff || 0) - shift; ai.lane = lane; ai.L = W.lane(ai.seg, ai.dir, lane); if (ai.nextSeg) ai.next = W.lane(ai.nextSeg, ai.nextDir, lane);
  ai.blocked = 0; ai.appr = 0; ai.lcT = LC_COOL; ai.passT = 5; ai.sigT = 2.2; ai.sigDir = dl > 0 ? 1 : -1; // lane 1 lies to the right of lane 0
  return true;
}
export function laneFollow(v, game, dt) {
  const W = game.world, ai = v.ai; if (!ai.L) acquireLane(v, W);
  // Backing out of a mutual block: a slow straight reverse (aborted when something is behind), then a short pause so the other car can use the room.
  if (ai.rev > 0) {
    ai.rev -= dt; ai.waiting = false; v.signal = 0; v.input.steer = 0; v.input.brake = false; v.input.handbrake = false; v.input.throttle = clamp((-BACKOFF_SPEED - v.forwardSpeed) * 0.5, -0.6, 0.3);
    if (ai.rev <= 0 || !clearBehind(v, game, 0.8)) { ai.rev = 0; ai.pause = BACKOFF_PAUSE; ai.blocked = 0; ai.waitT = 0; }
    return;
  }
  if (ai.pause > 0) { ai.pause -= dt; ai.waiting = false; v.signal = 0; steerToward(v, v.x + v.fx * 5, v.z + v.fz * 5, 0, dt); return; }
  let L = ai.L; let s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz;
  if (s > L.len - 1.0) {
    if (v.signal !== 0 && !(ai.sigT > 0)) { ai.sigT = 2; ai.sigDir = v.signal; } /* keep signalling while the car crosses the junction */
    const ofx = L.fx, ofz = L.fz; ai.seg = ai.nextSeg; ai.dir = ai.nextDir; ai.L = ai.next; planNext(v, W); L = ai.L; if (L.fx !== ofx || L.fz !== ofz) { ai.latOff = 0; ai.passT = 0; } // a turn ends the glide
    s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz;
  }
  // For 5 s after a lane change the obstacle corridor follows the car's real position (off = sideways distance from the lane centre-line, see obstacleAhead).
  const lat = ai.latOff || 0; let off = 0; if (ai.passT > 0) ai.passT -= dt;
  if (lat !== 0 || ai.passT > 0) { off = (v.x - L.sx) * L.rx + (v.z - L.sz) * L.rz; if (Math.abs(off) < 0.4) off = 0; }
  // A slow car that swings across looks a shorter way ahead, so it closes the sideways gap within a few metres.
  const look = off !== 0 && v.speed < 6 ? 3 + v.speed * 0.3 : 5 + v.speed * 0.5; const ts = s + look; let tx, tz;
  if (ts <= L.len) { tx = L.sx + L.fx * ts; tz = L.sz + L.fz * ts; } else { const N = ai.next, t2 = clamp(ts - L.len - 2, 0, N.len); tx = N.sx + N.fx * t2; tz = N.sz + N.fz * t2; }
  const distEnd = L.len - s; const turning = ai.next.fx !== L.fx || ai.next.fz !== L.fz;
  // Lane change in progress: the steer target sits latOff m to the side of the lane centre-line and glides to it. The glide runs at full rate from 4 m/s up and
  // slows down with the car, so a car that is still waiting for room keeps its target on the old line.
  if (lat !== 0) { if (ts <= L.len || !turning) { tx += L.rx * lat; tz += L.rz * lat; } ai.latOff = Math.abs(lat) < 0.02 ? 0 : damp(lat, 0, LC_RATE * clamp(v.speed / 4, 0.12, 1), dt); }
  let target = ai.panic > 0 ? ai.cruise * 1.9 : ai.cruise;
  if (turning && distEnd < 20) target = Math.min(target, 7.5);
  let lightWait = false;
  if (turning && distEnd < 14) { // left turn: wait for oncoming traffic
    if (ai.panic <= 0 && (ai.yieldT || 0) < YIELD_MAX && L.fx * ai.next.fz - L.fz * ai.next.fx < 0 && oncomingConflict(v, game, L, L.to)) { lightWait = true; ai.yieldT = (ai.yieldT || 0) + dt; target = distEnd < 3.2 ? 0 : Math.min(target, Math.max(0, distEnd - 2.5) * 0.9); }
  } else ai.yieldT = 0;
  if (ai.panic <= 0) { const light = W.lightState(L.to, L.fx ? 'ew' : 'ns', game.time); if (light !== 'g' && distEnd < 17 && distEnd > -1 && !(light === 'y' && distEnd < 6 && v.speed > 5)) { lightWait = true; target = distEnd < 3.2 ? 0 : Math.min(target, Math.max(0, distEnd - 2.5) * 0.9); } }
  // Time-headway following: target speed = the leader's speed + 0.9 * (bumper gap - desired gap); at or inside the desired gap it falls to a stop.
  const ob = obstacleAhead(v, game, off); let obWait = false, blockedNow = false, hold = false; const obObj = ob ? ob.obj : null, obStat = ob ? ob.stationary : false, obD = ob ? ob.d : Infinity, obPed = ob ? ob.ped : null; // copies: the scratch record is reused by the next obstacleAhead call
  if (ob) {
    // only a car ahead in the same direction passes its waiting on (a crossing or oncoming car could wait for us in turn, and two cars would then hold each other for ever)
    obWait = !!ob.obj && isWaiting(ob.obj) && ob.obj.fx * v.fx + ob.obj.fz * v.fz > 0.7; hold = ob.stationary && !obWait;
    const gap = (ob.ped ? PED_STAND_OFF : hold ? STAND_OFF : FOLLOW_GAP) + v.speed * FOLLOW_TIME;
    target = ob.d < 1 ? 0 : Math.min(target, Math.max(0, ob.speed + (ob.d - gap) * FOLLOW_GAIN));
    blockedNow = hold && ob.d < gap + 1.5 && v.speed < 2.5;
  }
  // Swinging round something that stands in the old lane: creep past it, the clearance is only about a car width.
  if (off !== 0) { const old = obstacleAhead(v, game, 0); if (old && old.stationary && old.d < 16) target = Math.min(target, PASS_SPEED); }
  // A wreck, a parked car or the player's stopped car ahead will not clear by itself: change lane while still rolling instead of stopping behind it first.
  ai.appr = hold && !off && obD < 26 && !obPed && (!obObj || !obObj.ai || obObj.wrecked) ? (ai.appr || 0) + dt : 0;
  // Swinging out needs room in front: about 5.5 m from a standstill plus 0.8 s of travel.
  const room = obD >= 5.5 + v.speed * 0.8;
  // Only a car held up by something that will not clear by itself counts as blocked. A queue at a red light is waiting, not blocked.
  if (blockedNow) ai.blocked += dt; else if (!ob || !obStat || obWait) ai.blocked = 0;
  const raw = lightWait || obWait; ai.waitT = raw ? (ai.waitT || 0) + dt : 0; ai.waiting = raw && ai.waitT < WAIT_MAX;
  if (ai.lcT > 0) ai.lcT -= dt;
  if ((ai.blocked > 0 || ai.appr > 0) && !ai.waiting) {
    if ((ai.blocked > LC_SIGNAL_AT || ai.appr > 0.2) && !(ai.sigT > 0)) { ai.sigT = 0.9; ai.sigDir = ai.lane === 0 ? 1 : -1; } // announce the lane change before making it
    if ((ai.blocked > LC_AT || ai.appr > 0.5) && room && !(ai.lcT > 0)) { ai.lcT = LC_RETRY; tryLaneChange(v, game, 1 - ai.lane); }
    if (ai.blocked > HONK_AT && v.hornT <= 0) { v.hornT = 4 + Math.random() * 3; game.audio.horn(dist(v.x, v.z, game.player.x, game.player.z)); }
    const bo = obObj; if (ai.boT === undefined) ai.boT = BACKOFF_MIN + Math.random() * BACKOFF_SPREAD;
    if (ai.blocked > ai.boT && bo && bo.ai && !bo.wrecked && bo.ai.blocked > 1 && v.fx * bo.fx + v.fz * bo.fz < 0.7 && v.speed < 0.5) {
      if (clearBehind(v, game, 5)) { ai.rev = BACKOFF_TIME; ai.boT = BACKOFF_MIN + Math.random() * BACKOFF_SPREAD; } else ai.boT += 1;
    }
  }
  // Indicators (+1 = right, -1 = left, in the car's own frame). Lane 1 lies further to the right of the road centre than lane 0, so a lane change signals
  // by the lane index. Otherwise the car signals for the last 30 m before a turn: the next lane's heading projected on this lane's right
  // vector (-L.fz, L.fx) is positive for a right turn (a U-turn has no component and signals left).
  if (ai.sigT > 0) { ai.sigT -= dt; v.signal = ai.sigDir; }
  else { const cross = L.fx * ai.next.fz - L.fz * ai.next.fx; v.signal = turning && distEnd < 30 ? (cross > 0 ? 1 : -1) : 0; }
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
  const W = game.world, ai = v.ai; const d = Math.hypot(tx - v.x, tz - v.z) || 0.001; const ux = (tx - v.x) / d, uz = (tz - v.z) / d;
  const clear = d < 48 && game.grid.raycast(v.x, 1, v.z, ux, 0, uz, d) >= d - 0.5;
  if (clear || d < 14) { ai.direct = true; steerToward(v, tx, tz, speed, dt, { allowReverse: true }); return; }
  // Back on the road network: take the lane that runs towards the target (not necessarily the way the car happens to face).
  if (ai.direct || !ai.L || !ai.next) { ai.direct = false; acquireLane(v, W, ux, uz); planNextToward(v, W, tx, tz); }
  let L = ai.L; let s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz;
  if (s > L.len - 1.0) { ai.seg = ai.nextSeg; ai.dir = ai.nextDir; ai.L = ai.next; ai.lane = ai.lane; planNextToward(v, W, tx, tz); L = ai.L; s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz; }
  if (Math.abs(s) > L.len + 30 || Math.abs((v.x - L.sx) * -L.fz + (v.z - L.sz) * L.fx) > 12) { acquireLane(v, W, ux, uz); planNextToward(v, W, tx, tz); L = ai.L; s = (v.x - L.sx) * L.fx + (v.z - L.sz) * L.fz; }
  const look = 6 + v.speed * 0.45; const ts = s + look; let px, pz;
  if (ts <= L.len) { px = L.sx + L.fx * ts; pz = L.sz + L.fz * ts; } else { const N = ai.next, t2 = clamp(ts - L.len - 2, 0, N.len); px = N.sx + N.fx * t2; pz = N.sz + N.fz * t2; }
  let target = speed * 0.9; const distEnd = L.len - s; const turning = ai.next.fx !== L.fx || ai.next.fz !== L.fz; if (turning && distEnd < 14) target = Math.min(target, 13);
  const ob = obstacleAhead(v, game); if (ob && !ob.ped && ob.obj !== game.player.vehicle) { if (ob.d < 5) target = Math.min(target, 4); else target = Math.min(target, Math.max(6, ob.speed + ob.d)); }
  steerToward(v, px, pz, target, dt);
}

// ---------- population bubble ----------
// Cars appear at 35-200 m from the player while they are hidden from the camera (or at 140 m and more when they are not) and only disappear again beyond 200 m while
// hidden, or beyond 300 m whatever the camera sees. Everything is tunable through TRAFFIC.bubble; these are the defaults.
const BUBBLE = { hiddenMin: 35, hiddenMax: 200, visibleMin: 140, initialMin: 30, despawnHidden: 200, despawnHard: 300, segRadius: 220 };
const tune = k => TRAFFIC.bubble?.[k] ?? BUBBLE[k];

export class Traffic {
  constructor(game) { this.game = game; this.spawnT = 0; this.near = []; this.cand = []; this.mid = null; this.nearT = 0; this.nearX = 0; this.nearZ = 0; }
  // Number of AI cars allowed at once for the current quality tier.
  budget() { const q = this.game.settings?.quality; return TRAFFIC.tier?.[q]?.cars ?? TRAFFIC.cars; }
  count() { let n = 0; for (const v of this.game.vehicles) if (v.ai && !v.wrecked && v.ai.mode !== 'police' && v.ai.mode !== 'deployed') n++; return n; }
  init() {
    const G = this.game, W = G.world;
    for (const s of W.parkingSpots) { if (Math.random() > 0.4) continue; const v = new Vehicle(randomType(true), pick(CAR_COLORS), s.x, s.z, s.heading); v.parked = true; G.addVehicle(v); }
    const d = W.pois.dealer; if (d) for (let i = 0; i < 3; i++) { const v = new Vehicle(['sport', 'muscle', 'suv'][i], [0xff4fa3, 0x3ce8f5, 0xf2f2f2][i], d.x + 4 + i * 6, d.z - 5.5, Math.PI / 2); v.parked = true; v.locked = true; G.addVehicle(v); }
    const n = Math.min(this.budget(), 26); for (let i = 0; i < n; i++) this.spawn(true);
  }
  // Segments whose midpoint lies within 220 m of the player, refreshed every 2 s (and at once after a teleport), so spawning draws from a short list.
  nearSegments() {
    const P = this.game.player;
    if (this.nearT <= 0 || !this.near.length || (P.x - this.nearX) ** 2 + (P.z - this.nearZ) ** 2 > 1600) this.refreshNear();
    return this.near;
  }
  refreshNear() {
    const segs = this.game.world.segments, P = this.game.player;
    if (!this.mid || this.mid.length !== segs.length * 2) { this.mid = new Float32Array(segs.length * 2); for (let i = 0; i < segs.length; i++) { this.mid[i * 2] = (segs[i].a.x + segs[i].b.x) * 0.5; this.mid[i * 2 + 1] = (segs[i].a.z + segs[i].b.z) * 0.5; } }
    const r = tune('segRadius'), r2 = r * r, near = this.near; near.length = 0;
    for (let i = 0; i < segs.length; i++) { const dx = this.mid[i * 2] - P.x, dz = this.mid[i * 2 + 1] - P.z; if (dx * dx + dz * dz < r2) near.push(segs[i]); }
    this.nearT = 2; this.nearX = P.x; this.nearZ = P.z;
  }
  // Is the point (x, z) out of the player's view? Uses Game.isHiddenFromCamera when it exists, otherwise the camera-cone test (the cone is 69 degrees either side).
  hiddenFrom(x, z, d) {
    const G = this.game, P = G.player; if (typeof G.isHiddenFromCamera === 'function') return !!G.isHiddenFromCamera(x, 1.2, z);
    return ((x - P.x) * Math.sin(P.camYaw) + (z - P.z) * Math.cos(P.camYaw)) / (d || 1) <= 0.35;
  }
  // Spawns one AI car on a lane point of a nearby segment and returns it (null when no free point was found this time). initial = world build: no view test, 30 m minimum.
  // o.ring = [min, max] overrides the distance band, o.noViewTest skips the visibility test (Game.populate under a loading / respawn overlay).
  spawn(initial = false, o = {}) {
    const G = this.game, W = G.world, P = G.player; const noView = initial || !!o.noViewTest;
    const rMin = o.ring ? o.ring[0] : (initial ? tune('initialMin') : tune('hiddenMin')), rMax = o.ring ? o.ring[1] : tune('hiddenMax'), visMin = Math.max(rMin, tune('visibleMin'));
    // draw from the cached segments that can reach the distance band (a lane point lies at most half a segment, 40 m, from the segment midpoint)
    const near = this.nearSegments(), segs = this.cand; segs.length = 0;
    for (let i = 0; i < near.length; i++) { const sg = near[i], md = dist((sg.a.x + sg.b.x) * 0.5, (sg.a.z + sg.b.z) * 0.5, P.x, P.z); if (md + 40 >= rMin && md - 40 <= rMax) segs.push(sg); }
    if (!segs.length) return null;
    // Of the first two usable lane points take the closer one: the bubble gets denser near the player.
    let bSeg = null, bDir = 1, bLane = 0, bL = null, bx = 0, bz = 0, bd = Infinity, found = 0;
    for (let tries = 0; tries < 16 && found < 2; tries++) {
      const seg = segs[Math.floor(Math.random() * segs.length)], dir = Math.random() < 0.5 ? 1 : -1, lane = Math.random() < 0.6 ? 0 : 1, t = 0.1 + Math.random() * 0.8;
      const L = W.lane(seg, dir, lane), x = L.sx + L.fx * t * L.len, z = L.sz + L.fz * t * L.len, d = dist(x, z, P.x, P.z);
      if (d < rMin || d > rMax) continue;
      if (!noView && d < visMin && !this.hiddenFrom(x, z, d)) continue; // in view: only far away, where the car has time to be seen coming
      let ok = true; for (const w of G.vehicles) if (Math.abs(w.x - x) < 14 && Math.abs(w.z - z) < 14 && dist(w.x, w.z, x, z) < 14) { ok = false; break; } if (!ok) continue;
      found++; if (d < bd) { bd = d; bSeg = seg; bDir = dir; bLane = lane; bL = L; bx = x; bz = z; }
    }
    if (!bSeg) return null;
    const type = randomType(G.police.level > 0); const v = new Vehicle(type, pick(CAR_COLORS), bx, bz, Math.atan2(-bL.fz, bL.fx));
    v.ai = { mode: type === 'police' ? 'patrol' : 'traffic', seg: bSeg, dir: bDir, lane: bLane, L: bL, cruise: 11 + Math.random() * 6, blocked: 0, panic: 0, sigT: 0, sigDir: 0, latOff: 0, waiting: false, waitT: 0, lcT: 0 }; planNext(v, W);
    v.vx = v.fx * 8; v.vz = v.fz * 8; if (type === 'police') v.lightsOn = true; G.addVehicle(v); return v;
  }
  // Spawns up to n cars (default: until the tier budget is reached) without the view test. For Game.populate during loading and respawn overlays.
  fill(n = Infinity, o = {}) {
    const cap = this.budget(); let count = this.count(), made = 0;
    for (let i = 0; i < 80 && made < n && count < cap; i++) if (this.spawn(false, { noViewTest: true, ...o })) { made++; count++; }
    return made;
  }
  // After a switch to a lower quality tier: remove the farthest hidden traffic car (one per call).
  trim() {
    const G = this.game, P = G.player; let far = null, fd = 60;
    for (const v of G.vehicles) { if (!v.ai || v.ai.mode !== 'traffic' || v.wrecked || v.parked || v.special || v === P.vehicle) continue; const d = dist(v.x, v.z, P.x, P.z); if (d > fd && this.hiddenFrom(v.x, v.z, d)) { fd = d; far = v; } }
    if (far) G.removeVehicle(far);
  }
  // Out of the bubble? Beyond 300 m always, beyond 200 m only while hidden from the camera (checked every 0.4 s per car).
  gone(v, d, dt) {
    if (d > tune('despawnHard')) return true; if (d <= tune('despawnHidden')) return false;
    const ai = v.ai; ai.hidT = (ai.hidT || 0) - dt; if (ai.hidT > 0) return false; ai.hidT = 0.4; return this.hiddenFrom(v.x, v.z, d);
  }
  update(dt) {
    const G = this.game, P = G.player; const cap = this.budget(); const count = this.count();
    this.nearT -= dt; this.spawnT -= dt;
    if (this.spawnT <= 0) { if (count < cap) { this.spawnT = count < cap * 0.5 ? 0.12 : 0.35; this.spawn(); } else if (count > cap + 1) { this.spawnT = 0.5; this.trim(); } }
    for (let i = G.vehicles.length - 1; i >= 0; i--) {
      const v = G.vehicles[i]; if (v === P.vehicle) { v.signal = 0; continue; } if (v.special && !v.ai) continue; const d = dist(v.x, v.z, P.x, P.z);
      if (v.wrecked) { if (!v.parked && d > TRAFFIC.despawn) { G.removeVehicle(v); continue; } if (d > 120 && Math.random() < 0.01) { G.removeVehicle(v); continue; } continue; }
      if (!v.ai) continue;
      if (!v.parked && (v.special ? d > TRAFFIC.despawn : this.gone(v, d, dt))) { G.removeVehicle(v); continue; }
      if (v.ai.mode === 'police' || v.ai.mode === 'deployed') { v.signal = 0; continue; }
      if (v.disturbed > 0) { v.disturbed -= dt; v.signal = 0; v.ai.waiting = false; v.ai.rev = 0; v.ai.pause = 0; v.input.throttle = 0; v.input.brake = true; v.input.steer = 0; if (v.disturbed <= 0) acquireLane(v, G.world); continue; }
      if (v.ai.mode === 'traffic' && !v.special && v.ai.blocked > JAM_HIDDEN && d > JAM_MIN_DIST && (v.ai.blocked > JAM_VISIBLE || this.hiddenFrom(v.x, v.z, d))) { G.removeVehicle(v); continue; }
      if (d > 320) continue; laneFollow(v, G, dt);
    }
  }
}

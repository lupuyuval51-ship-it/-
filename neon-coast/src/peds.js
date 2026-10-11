import * as THREE from '../vendor/three.module.min.js';
import { CITY, WEAPONS, TIME } from './config.js';
import { makeCharacter, randomLook, crewLook, uniformLook } from './character.js';
import { clamp, damp, wrapAngle, angleLerp, dist } from './utils.js';

// =====================================================================================================================
// PEOPLE (release 3, P4). Two things live here: Ped, one person with a body, a state machine and a brain, and Crowd (game.crowd), the director that gives the city a social life.
//
// Civilians that are "free" (no mission, no vip, no weapon, not owned by another system) walk the sidewalk graph or wander an area, and in between they live: stop and take a call, text, smoke, look around, sit on a bench,
// lie on a towel, queue at a burger bar, walk into a shop and come out with a bag, wait at a bus stop, shelter under an awning, dance at the beach club, walk in groups of two to four or stand talking in a circle.
// They react to what happens: gunfire and blasts (cower, run, scream), a body, an accident, a fight or a helicopter (stop, watch, film, point), a gun aimed at them (hands up), a punch (a few hit back). A witness who sees
// the player commit a crime phones the police a few seconds later; shoot the witness first and nobody calls.
//
// Crowd (one per game, created by the first Ped) owns what several people share: the venues (door, queue, awning of every shop), benches and bus stops (found in the street furniture), the events people react to, the
// neighbour list for steering, the staff that stand at doors (guards at the bank and casino, a vendor at each burger bar, a mechanic, nurses), the population mix, witnesses and the crowd murmur. It ticks itself from the first
// Ped.update of every frame, so it needs no wiring; Game.alert is wrapped once so that events carry their type (Crowd.alertIn is what integration may call directly instead).
// Ped.setInjured(flag) lies a person down hurt (the paramedic job), Ped.pickUp() / putDown() hide and show a carried person.
// =====================================================================================================================
const HALF = CITY.road / 2, WALK = 1.5, RUN = 5.6;
const _tmp = [];
let pedId = 1;
// the civilian brain asks for movement through this scratch record (nothing is allocated per frame)
const _mv = { go: false, x: 0, z: 0, spd: 0 };
// zones: the places the director knows by name (cached once the world has its points of interest)
function zones(game) { if (game._zn) return game._zn; const P = game.world?.pois; if (!P || !P.bank) return {}; const g = id => P[id] ? { x: P[id].x, z: P[id].z } : null; return (game._zn = { bank: g('bank'), casino: g('casino'), club: g('club'), docks: g('docks') }); }
function districtAt(game, x, z) {
  const Z = zones(game), near = (p, r) => !!p && (x - p.x) ** 2 + (z - p.z) ** 2 < r * r;
  if (near(Z.club, 95) || near(Z.casino, 60)) return 'nightlife'; if (near(Z.bank, 115)) return 'financial'; if (near(Z.docks, 80)) return 'port';
  if (x < CITY.minX + 130) return 'industrial'; if (Math.abs(x) < 170 && Math.abs(z) < 160) return 'downtown'; return '';
}
function weekendNow(game) { const m = (TIME.start || 0) + (game.time || 0) * (TIME.minutesPerSecond || 0.5); return Math.floor(m / 1440) % 7 >= 5; }
// wardrobe context of a new civilian: the beach zone, the district, the hour, the weekday, rain, and a share of people dressed for the cold of the night or the heat of noon
function lookContext(game, x, z) {
  const hour = Number.isFinite(game.clock) ? (game.clock / 60) % 24 : 12, night = hour >= 21 || hour < 6;
  return { zone: x > CITY.beachX - 1 ? 'beach' : 'city', district: districtAt(game, x, z), hour, rain: (game.rainLevel || 0) > 0.25 || game.weather === 'rain', weekend: weekendNow(game), cold: night && Math.random() < 0.55, hot: !night && hour >= 11 && hour < 18 && Math.random() < 0.45 };
}
// a role a new civilian can be born into: clubbers near the beach club at night, joggers at dawn and dusk, tourists on the beach by day
function pickTrait(game, x, z, c, area) {
  const Z = zones(game), hr = c.hour, night = hr >= 20.5 || hr < 4.5, r = Math.random();
  if (Z.club && night && (x - Z.club.x) ** 2 + (z - Z.club.z) ** 2 < 100 * 100 && r < 0.5) return 'clubber';
  if (!c.rain && ((hr >= 5 && hr < 8.5) || (hr >= 17 && hr < 20)) && r < (area ? 0.2 : 0.11)) return 'jogger';
  if (c.zone === 'beach' && !c.rain && hr >= 8 && hr < 19 && r < 0.2) return 'tourist';
  return null;
}
// which surface a footstep lands on (the same four the audio has recipes for)
function surfaceAt(game, x, z) {
  const W = game.world, pier = W.pier; if (pier && x > pier.x0 - 1 && x < pier.x1 && Math.abs(z - pier.z) < 4.6) return 'wood'; if (x > CITY.beachX && x < CITY.oceanX) return 'sand';
  const parks = W.parks; if (parks) for (let i = 0; i < parks.length; i++) { const p = parks[i]; if (p && x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return 'grass'; }
  return 'concrete';
}
// ---------- venues: the doors, queues and awnings of the shops; benches and bus stops ----------
// How much people want to go inside (weight per kind) and who stands guard at the door. A post is relative to the door (dx), faces the street (yaw PI = towards -z) and cycles through `acts`.
const SHOP_W = { burger: 3, clothes: 2.4, casino: 1.2, bank: 1, dealer: 0.6, guns: 0.5, hospital: 0.4, safehouse: 0.3 };
const STAFF = {
  bank: [{ k: 'guard', dx: -3.1, acts: [null, 'lookAround', null] }, { k: 'guard', dx: 3.3, acts: ['lookAround', null] }],
  casino: [{ k: 'guard', dx: -2.7, acts: [null, 'lookAround'] }, { k: 'guard', dx: 2.7, acts: ['lookAround', null, null] }],
  burger: [{ k: 'cashier', dx: 3.7, acts: ['talk', 'wave', 'talk'], role: 'vendor' }],
  spray: [{ k: 'mechanic', dx: -4.4, acts: ['smoke'] }],
  hospital: [{ k: 'nurse', dx: 3.6, acts: ['smoke', 'phone'] }, { k: 'paramedic', dx: -3.6, acts: ['phone', null, 'lookAround'] }],
};
function buildVenues(game) {
  const out = [], P = game.world.pois;
  for (const id in P) {
    const p = P[id]; if (!p || !(p.bx0 < p.bx1) || p.bz0 === undefined || !p.type) continue; const door = p.interior && p.interior.door, x = door ? door.x : (p.bx0 + p.bx1) / 2, z = p.bz0, w = (p.bx1 - p.bx0) / 2;
    const v = { id, type: p.type, x, z, ox: x, oz: z - 1.15, w, weight: SHOP_W[p.type] || 0, inside: 0, cap: p.type === 'casino' ? 6 : 3, q: [], qdir: 0, posts: [], shelter: [], slots: [], club: false };
    for (const s of STAFF[p.type] || []) v.posts.push({ k: s.k, role: s.role || s.k, x: x + s.dx, z: z - 1.05, yaw: Math.PI, acts: s.acts, ped: null, cool: 0 });
    for (const dx of [-2.3, 2.3, -4.3, 4.3]) if (Math.abs(dx) < w - 1.4) v.shelter.push({ x: x + dx, z: z - 0.75, n: 0 });
    out.push(v);
  }
  const c = P.club; if (c) { // the beach club: two doormen at the entrance, a dance floor in front of it
    const v = { id: 'club', type: 'club', x: c.x, z: c.z, ox: c.x, oz: c.z, w: 8, weight: 0, inside: 0, cap: 0, q: [], qdir: 0, posts: [], shelter: [], slots: [], club: true, dance: { x: c.x - 5.5, z: c.z, r: 5.5 } };
    for (const dz of [-3.2, 3.2]) v.posts.push({ k: 'guard', role: 'guard', x: c.x + 2.2, z: c.z + dz, yaw: -Math.PI / 2, acts: [null, 'lookAround'], ped: null, cool: 0 });
    out.push(v);
  }
  return out;
}
// benches and bus shelters are instanced meshes of the street furniture (world.js); they are found by the size of their geometry, so no list has to be shared
function scanSpots(game) {
  const out = { benches: [], stops: [] }, M = new THREE.Matrix4(), S = new THREE.Vector3();
  for (const o of game.scene.children) {
    if (!o.isInstancedMesh || !o.geometry) continue; const geo = o.geometry; if (!geo.boundingBox) geo.computeBoundingBox(); geo.boundingBox.getSize(S);
    const bench = S.x > 1.5 && S.x < 2.3 && S.y > 0.55 && S.y < 1.05 && S.z > 0.3 && S.z < 0.8, stop = S.x > 2.8 && S.x < 3.6 && S.y > 2.2 && S.y < 3 && S.z > 1 && S.z < 1.8; if (!bench && !stop) continue;
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); const e = M.elements; (bench ? out.benches : out.stops).push({ x: e[12], z: e[14], fx: e[8], fz: e[10], rx: e[0], rz: e[2], yaw: Math.atan2(e[8], e[10]), occ: [null, null] }); } // local +z (e[8], e[10]) is the side the seat faces, local +x (e[0], e[2]) runs along the bench
  }
  return out;
}
const TOWEL_COL = [0xff9ad5, 0x9ad0ff, 0xfff1c8, 0xff6f91, 0x7be0c8, 0xf5c542], _towels = { geo: null, mats: null };
function makeTowel(i) { if (!_towels.geo) { _towels.geo = new THREE.BoxGeometry(1.0, 0.03, 1.9); _towels.mats = TOWEL_COL.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 })); } const m = new THREE.Mesh(_towels.geo, _towels.mats[i % _towels.mats.length]); m.receiveShadow = true; return m; }
// a state that makes a person stay out of the way of events and other requests: they are busy with something that matters more
const BUSY = new Set(['flee', 'cower', 'handsup', 'call', 'help', 'fight', 'brawl', 'hurt', 'shopin', 'shopgo', 'shopout', 'dead', 'ragdoll', 'carried']);
// weighted random choice from [[value, weight], ...] without allocating (the list is a module scratch)
function wpick(list) { let t = 0; for (let i = 0; i < list.length; i += 2) t += list[i + 1]; if (t <= 0) return null; let r = Math.random() * t; for (let i = 0; i < list.length; i += 2) { r -= list[i + 1]; if (r <= 0) return list[i]; } return list[0]; }
// pose requests handed to Character.animate: module-level scratch objects, nothing is allocated per frame
const _anim = { v: 0, grounded: true, vy: 0, moveYaw: 0, yaw: 0, yawRate: 0, aiming: false, aimPitch: 0, long: false, punch: 0, melee: 'fist', reload: -1, lookAt: null };
const _look = { x: 0, z: 0 }, _dead = { dead: true, deadDir: 1 }, _rag = { dead: false, rag: 1, getUp: 0 };
// Launch ragdoll: the body is one rigid capsule from the feet to the head (1.75 m, radius 0.16) integrated in steps of at most 1/60 s. Both ends are tested against World.groundY;
// a contact pushes out, bounces with restitution 0.25 and slides with Coulomb friction 0.6 (impulses with a scalar inertia, so a hit at one end makes the body tumble).
const GRAV = 14, CAP_R = 0.16, CAP_CM = 0.875, REST_E = 0.25, FRICTION = 0.6, INERTIA = 0.26, GETUP_T = 0.9;
const _qa = new THREE.Quaternion(), _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _vc = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
// squared distance from the player beyond which a person's pose is refreshed every 2nd / 4th / 8th frame, per quality tier
const ANIM_LOD = { high: [3600, 12100, 28900], med: [2025, 8100, 19600], low: [900, 4900, 12100] };
const LIE_T = [0.3, 1.3, 4]; // a lying body is fitted to the ground three times: when the pose has arrived, when it has settled, and once more after its slow shifting

export class Ped {
  constructor(game, o) {
    this.game = game; this.id = pedId++; this.kind = o.kind || 'civ'; this.team = o.team || null; // 'cop' | 'swat' | 'gang'
    const D = game.crowd || new Crowd(game); // the director of the crowd exists as soon as there is somebody to direct
    // a civilian born into the world: the wardrobe follows district, hour, weekday and weather, and some people have a role (clubber, jogger, tourist) that decides how they behave
    if (o.look) { this.look = crewLook(o.look); this.trait = o.trait || null; }
    else { const c = Object.assign(lookContext(game, o.x, o.z), o.ctx); this.trait = o.trait !== undefined ? o.trait : (this.kind === 'civ' && !o.noDespawn && !o.mission && !o.vip ? pickTrait(game, o.x, o.z, c, o.area) : null); this.look = this.trait ? uniformLook(this.trait) : randomLook(c); }
    this.char = makeCharacter(this.look); this.mesh = this.char.group; game.scene.add(this.mesh);
    this.x = o.x; this.z = o.z; this.y = this.groundAt(o.x, o.z); this.yInit = false; this.vy = 0; this.yaw = o.yaw ?? Math.random() * 6.28; this.hp = o.hp ?? 100; this.maxHp = this.hp; this.dead = false; this.ragdoll = null; this.deadT = 0;
    this.state = o.state || 'walk'; this.stateT = 0; this.wp = null; this.prevWp = null; this.fleeFrom = null; this.speed = 0; this.moveDir = 0;
    this.weapon = o.weapon ? WEAPONS.find(w => w.id === o.weapon) : null; if (this.weapon) this.char.setGun(true, this.weapon.id === 'rifle' || this.weapon.id === 'shotgun' || this.weapon.id === 'sniper' ? 'long' : 'pistol');
    this.shootT = 1 + Math.random(); this.accuracy = o.accuracy ?? 0.5; this.hostile = !!o.hostile; this.stationX = o.x; this.stationZ = o.z; this.aggroRange = o.aggroRange ?? 45; this.bustT = 0; this.blockedT = 0;
    this.punchT = 0; this.mission = o.mission || null; this.noDespawn = !!o.noDespawn; this.fromVehicle = o.fromVehicle || null; this.station = !!o.station; this.vip = !!o.vip;
    this.area = this.kind === 'civ' && o.area ? o.area : null; // {x0, z0, x1, z1}: civilians that wander inside a rectangle (beach, parks) instead of walking the sidewalk graph
    this.animAcc = 0; this.animSkip = 9; this.animYaw = this.yaw;
    const arch = this.look.archetype, pace = this.look.elder ? 0.72 : arch === 'business' || arch === 'sporty' ? 1.12 : arch === 'tourist' ? 0.85 : 1;
    this.walkSpeed = WALK * pace * (0.78 + Math.random() * 0.5); if (this.trait === 'jogger') this.walkSpeed = 3.1 + Math.random() * 1.0; // strollers 1.2 m/s, commuters 1.9, joggers 3-4
    this.aimT = 0; this.deadDir = 1; this.deadDirX = 0; this.deadDirZ = 0; this.lift = 0; this.liftTo = 0; this.liftStage = 0; // a body lying on the ground is lifted so that its lowest vertex rests on the ground
    // social life (see Crowd): what the person is doing besides walking
    this.staff = o.staff || null; this.act = ''; this.actUntil = 0; this.pend = null; this.pendT = 0; this.bt = 0; this.bs = 0; this.thinkT = Math.random() * 0.4; this.age = 0; this.hidden = false; this.pinned = false; this.lying = false; this.lyT = 0;
    this.injured = false; this.pickedUp = false; this.mate = null; this.grp = null; this.gi = 0; this.venue = null; this.spot = null; this.ev = null; this.wv = { x: 0, z: 0 }; this.lk = 0; this.witness = null; this.towel = null;
    this.mode = ''; this.wait = false; this.qw = 0; this.pt = 0; this.slot = 0; this.actMode = undefined; this.removed = false; this.rt = 0; this.rainE = -1; this.umb = false; this.shopT = 2 + Math.random() * 4; this.runK = 0.88 + Math.random() * 0.26; this.fleeRot = 0; this.stepK = this.char.steps; this.alertT = 0; this.tx = 0; this.tz = 0; this.bagT = 0; this.cd = 0;
    this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw;
    if (this.kind === 'civ') { if (this.staff) this.state = 'post'; else this.pickWaypoint(); if (!this.staff && this.state === 'walk') D.fresh.push(this); }
  }
  // a civilian that nobody else drives: it follows its own brain (missions, jobs, keepers, cops and the vip keep their own scripts)
  get free() { return this.kind === 'civ' && !this.mission && !this.vip && !this.weapon && (!this.noDespawn || !!this.staff); }
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
  // The block corners nearest to the person (only the blocks around them are looked at); area wanderers pick a random spot inside their rectangle instead.
  pickWaypoint() {
    if (this.area) { this.pickAreaTarget(); return; }
    const W = this.game.world, P = CITY.pitch; let best = null, bd = Infinity;
    const b0 = clamp(Math.floor((this.x - CITY.roadX(0)) / P), 0, CITY.gridX - 1), c0 = clamp(Math.floor((this.z - CITY.roadZ(0)) / P), 0, CITY.gridZ - 1);
    for (let bj = Math.max(0, c0 - 1); bj <= Math.min(CITY.gridZ - 1, c0 + 1); bj++) for (let bi = Math.max(0, b0 - 1); bi <= Math.min(CITY.gridX - 1, b0 + 1); bi++) for (let k = 0; k < 4; k++) {
      const cx = k & 1, cz = k >> 1, p = W.sidewalkCorner(bi, bj, cx, cz), d = (p.x - this.x) ** 2 + (p.z - this.z) ** 2; if (d < bd) { bd = d; best = { bi, bj, cx, cz, x: p.x, z: p.z }; }
    }
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
  // head: true for a head shot (combat.js passes best.head). A hit that does not kill makes the person flinch and stagger 0.15 m along the hit direction; a civilian then runs, and now and then hits back.
  hit(dmg, dirx, dirz, source, head) {
    if (this.dead) return; this.hp -= dmg; const G = this.game, D = G.crowd; G.fx.blood(this.x, 1.1, this.z, 6);
    if (this.hp <= 0) { this.die(dirx, dirz, source, head); return; }
    if (!this.ragdoll) { const l = Math.hypot(dirx, dirz) || 1; this.char.flinch(dirx, dirz, !!head); this.x += dirx / l * 0.15; this.z += dirz / l * 0.15; }
    if (this.kind !== 'civ') this.shootT = Math.max(this.shootT, 0.3 + dmg / 100); // being shot interrupts the next shot
    if (this.kind === 'civ') {
      if (source === 'player') D.crime('assault', this.x, this.z, this);
      if (this.free && !this.ragdoll && source === 'player' && dmg <= 40 && this.hp > 40 && !this.look.elder && !this.injured && Math.random() < 0.12) { this.startFight(G.player); return; } // a few hit back
      D.voice(this, 'ugh'); this.flee(this.x - dirx * 5, this.z - dirz * 5, 8);
    } else if (!this.hostile) { this.hostile = true; }
  }
  // (dirx, dirz) is the direction the killing hit travelled; the body falls that way. A ragdoll in flight (car, explosion) keeps flying and settles by itself.
  die(dirx = 0, dirz = 0, source, head) {
    if (this.dead) return; const G = this.game, D = G.crowd; this.unengage(); this.injured = false; this.lying = false; this.lift = 0; this.liftTo = 0; this.liftStage = 0; this.dead = true; this.deadT = 0; this.state = 'dead';
    const hl = Math.hypot(dirx, dirz); this.deadDirX = hl > 1e-3 ? dirx / hl : 0; this.deadDirZ = hl > 1e-3 ? dirz / hl : 0;
    this.deadDir = this.deadDirX * Math.cos(this.yaw) - this.deadDirZ * Math.sin(this.yaw) > 0 ? 1 : -1; // side of the body the hit came from (no random)
    const r = this.ragdoll;
    if (!r) this.char.fall(this.deadDirX, this.deadDirZ, head);
    else if (r.phase === 'up') { // shot while getting up: the body gives way and drops again
      r.phase = 'fly'; r.still = 0; r.t = 0; this.initBody(r); r.wx = (Math.random() - 0.5) * 4; r.wz = (Math.random() - 0.5) * 4;
    }
    if (this.vehicle) { this.vehicle = null; }
    if (source === 'player' || source === 'playercar') { D.crime('murder', this.x, this.z, this); G.stats.kills++; if (source === 'player') { if (this.team === 'cop' || this.team === 'swat') G.police.reportCrime('killcop', this.x, this.z); else if (this.kind === 'civ') G.police.reportCrime('kill', this.x, this.z); } }
    if (this.kind === 'civ' && Math.random() < 0.55) G.addPickup({ type: 'cash', amount: 10 + Math.floor(Math.random() * 90), x: this.x + (Math.random() - 0.5), z: this.z + (Math.random() - 0.5) });
    if ((this.team === 'cop' || this.team === 'gang') && Math.random() < 0.6) G.addPickup({ type: 'ammo', weapon: this.weapon?.id || 'pistol', amount: 12, x: this.x + (Math.random() - 0.5), z: this.z + (Math.random() - 0.5) });
    G.alert(this.x, this.z, 18, 'death'); this.onDeath?.(this);
  }
  // Throws the body (hitByCar, Game.explode). The velocity is kept outward by at least 2.2 m/s; the spin is (up x v) * |v| * 0.55 plus a random 3 rad/s, so a body tumbles in the
  // direction it travels. Bodies that are lying dead are not thrown again.
  launch(vx, vy, vz) {
    if (this.dead && !this.ragdoll) return; this.unengage(); this.injured = false;
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
    const D = G.crowd; D.event('accident', this.x, this.z, { reach: 34, ttl: 22 }); if (v.driver === G.player) D.crime('runover', this.x, this.z, this); D.voice(this, 'whoa'); G.audio.impact(sp, dist(this.x, this.z, G.player.x, G.player.z)); v.damage(1, 'ped'); return true;
  }
  // The person runs from a point. People the world scripts (missions, jobs, the vip) use this as before; free people also drop whatever they were doing first.
  flee(fx, fz, t = 7) {
    if (this.dead || this.kind !== 'civ' || this.injured || this.pickedUp || this.hidden) return; this.unengage(); this.state = 'flee'; this.stateT = t; this.bt = 0; this.fleeRot = 0;
    const f = this.fleeFrom || (this.fleeFrom = { x: 0, z: 0 }); f.x = fx; f.z = fz;
  }
  // Game.alert reaches everybody; free people have already answered in Crowd.react (it knows what happened and who is who), the rest run from the spot as before.
  scare(x, z, r) {
    if (this.kind !== 'civ' || this.dead || this.hidden || this.injured || this.pickedUp) return;
    if (dist(x, z, this.x, this.z) < r) { if (this.free && this.game.crowd.cur) return; this.flee(x, z, 6 + Math.random() * 4); }
  }
  // ---------- state helpers ----------
  setState(s) { this.state = s; this.bt = 0; this.bs = 0; }
  // Starts an activity of the character rig (null ends it). The name is remembered so that nothing is sent twice.
  setAct(name, opts) { name = name || ''; if (name === this.act && !(opts && opts.force)) return; this.act = name; this.actMode = opts && opts.mode; if (this.char.setActivity) this.char.setActivity(name || null, opts || undefined); }
  // stand and do something for a while: act (an activity name or null), opts, secs, delay (the activity starts after a ringtone, say)
  idleAct(name, opts, secs, delay) {
    this.setState('idle'); this.stateT = secs + (delay || 0); this.pend = null; this.pendT = 0; this.actUntil = 0;
    if (delay) { this.setAct(null); this.pend = { name, opts }; this.pendT = delay; } else this.setAct(name, opts);
  }
  go(M, x, z, spd) { M.go = true; M.x = x; M.z = z; M.spd = spd; return Math.hypot(x - this.x, z - this.z); }
  // Drops whatever the person was in the middle of (queue, bench, towel, call, shop, group): before fleeing, fighting, being carried or dying.
  unengage() {
    const D = this.game.crowd; if (this.hidden) this.reveal(); D.forget(this); if (this.act && this.act !== 'umbrella') this.setAct(null); this.pend = null; this.pendT = 0; this.pinned = false; this.lying = false; this.lk = 0; this.actUntil = 0;
  }
  // comes out of a shop (or is revealed when something forces them out)
  reveal() { const v = this.venue; this.hidden = false; this.mesh.visible = true; if (v) v.inside = Math.max(0, v.inside - 1); this.y = this.groundAt(this.x, this.z); this.yInit = true; }
  abort() { this.unengage(); this.resume(); }
  // back to the sidewalk: staff return to their post, everybody else walks to the nearest corner
  resume() { this.pinned = false; this.lying = false; this.spot = null; if (this.staff) { this.setState('post'); return; } this.setState('walk'); this.pickWaypoint(); }
  ungroup() { const D = this.game.crowd; if (this.grp) D.leave(this); }
  // ---------- the injured, the carried ----------
  // Lies down hurt (the paramedic job): the 'injured' activity, no walking, no fleeing, no reactions; false gets the person back on their feet.
  setInjured(flag = true) {
    if (this.dead) return this;
    if (flag) {
      if (this.injured) return this; this.unengage(); this.injured = true; this.pickedUp = false; this.mesh.visible = true; this.setState('hurt'); this.speed = 0; this.lying = true; this.lyT = 0; this.lift = 0; this.liftTo = 0; this.liftStage = 0;
      this.setAct('injured', { side: Math.random() < 0.5 ? 1 : -1, instant: true }); this.cd = 0.8 + Math.random() * 1.2;
    } else if (this.injured) { this.injured = false; this.lying = false; this.setAct(null); if (this.kind === 'civ') this.resume(); else this.setState('walk'); }
    return this;
  }
  // the hurt lie still and bleed quietly; a civilian calls for help every few seconds (heard within 44 m)
  hurtTick(dt, D) { this.speed = damp(this.speed, 0, 10, dt); if (this.kind !== 'civ') return; this.cd -= dt; if (this.cd <= 0) { this.cd = 4 + Math.random() * 5; D.voice(this, 'help'); } }
  // A person carried off (into an ambulance): invisible, out of every list of targets; putDown shows them again where they were set down.
  pickUp() { if (this.dead) return this; this.unengage(); this.pickedUp = true; this.setState('carried'); this.mesh.visible = false; this.speed = 0; return this; }
  putDown(x, z) {
    if (!this.pickedUp) return this; this.pickedUp = false; if (x !== undefined) { this.x = x; this.z = z; } this.mesh.visible = true; this.y = this.groundAt(this.x, this.z);
    if (this.injured) { this.setState('hurt'); this.lying = true; this.lyT = 0; this.liftStage = 0; } else this.resume(); return this;
  }
  // ---------- the brain of a free civilian ----------
  // Each state fills _mv (where to go, how fast) or stands still. bt is the time in the state, bs the stage inside it, stateT a countdown.
  brain(dt, D) {
    const M = _mv; M.go = false; this.bt += dt; this.cd -= dt; this.lk = 0;
    if (this.pendT > 0 && (this.pendT -= dt) <= 0 && this.pend) { const p = this.pend; this.pend = null; this.setAct(p.name, p.opts); }
    switch (this.state) {
      case 'walk': this.sWalk(dt, M, D); break;
      case 'idle': this.sIdle(dt, M, D); break;
      case 'flee': this.sFlee(dt, M, D); break;
      case 'cower': this.sCower(dt, M, D); break;
      case 'handsup': this.sHandsUp(dt, M, D); break;
      case 'gawk': this.sGawk(dt, M, D); break;
      case 'gosit': this.sGoSit(dt, M, D); break;
      case 'sit': this.sSit(dt, M, D); break;
      case 'gosun': this.sGoSun(dt, M, D); break;
      case 'sun': this.sSun(dt, M, D); break;
      case 'talk': this.sTalk(dt, M, D); break;
      case 'queue': this.sQueue(dt, M, D); break;
      case 'shopgo': this.sShopGo(dt, M, D); break;
      case 'shopout': this.sShopOut(dt, M, D); break;
      case 'godance': this.sGoDance(dt, M, D); break;
      case 'dance': this.sDance(dt, M, D); break;
      case 'post': this.sPost(dt, M, D); break;
      case 'call': this.sCall(dt, M, D); break;
      case 'help': this.sHelp(dt, M, D); break;
      case 'fight': this.sFight(dt, M, D); break;
      case 'brawl': this.sBrawl(dt, M, D); break;
      case 'hurt': this.speed = 0; this.lying = true; break;
      case 'shelter': this.sShelter(dt, M, D); break;
      case 'carried': break;
      default: this.sWalk(dt, M, D); // 'leave' (a cop who went off duty) and anything unknown simply walks
    }
  }
  // ----- walking -----
  sWalk(dt, M, D) {
    if (!this.wp) this.pickWaypoint();
    this.thinkT -= dt; if (this.thinkT <= 0) { this.thinkT = 0.3 + Math.random() * 0.25; if (this.walkThink(D)) return; }
    const g = this.grp; if (g && g.kind === 'walk' && g.leader !== this) { this.sFollow(dt, M, D); return; }
    if (dist(this.x, this.z, this.wp.x, this.wp.z) < (this.area ? 1 : 1.2) && this.arrive(D)) return;
    this.go(M, this.wp.x, this.wp.z, this.cruise(D));
  }
  cruise(D) { let s = this.walkSpeed; if (this.act === 'phone' && this.actMode === 'read') s *= 0.82; else if (D.raining && !this.umb) s *= 1.2; return s; }
  // at a waypoint: pick the next one, and now and then stop for a while (a runner or a member of a group never does)
  arrive(D) {
    this.nextWaypoint(); if (this.trait === 'jogger' || (this.grp && this.grp.leader !== this)) return false;
    if (Math.random() < (this.area ? 0.4 : 0.17)) { this.startIdle(D); return this.state !== 'walk'; }
    return false;
  }
  // Four times a second while walking, near the player only: the weather, events worth a look, a phone call, a shop, a queue, a bench, the club.
  walkThink(D) {
    const G = this.game, P = G.player, now = G.time, d2 = (this.x - P.x) ** 2 + (this.z - P.z) ** 2; if (d2 > 6400 || !this.free) return false; // out of sight, out of mind
    if (this.actUntil && now > this.actUntil) { this.setAct(null); this.actUntil = 0; }
    else if (!this.actUntil && !this.act && !this.pend && this.char.activity && this.char.activity !== 'umbrella') this.actUntil = now + 4; // an activity somebody else started (a job) is let go after a few seconds
    if (this.grp && this.grp.leader !== this) return false; // followers copy their leader
    if (D.raining) {
      if (this.rainE !== D.rainEpoch) { this.rainE = D.rainEpoch; const r = Math.random(); if (r < 0.62) { this.setAct('umbrella'); this.umb = true; this.actUntil = 0; } else if (r < 0.84 && D.goShelter(this)) return true; }
    } else if (this.umb) { this.umb = false; if (this.act === 'umbrella') this.setAct(null); }
    if (D.evs.length) { const ev = D.curious(this); if (ev && this.startGawk(ev)) return true; }
    if (this.staff || this.trait === 'jogger') return false;
    // a call or a text on the move
    if (!this.act && !D.raining && !this.pend && Math.random() < (this.look.archetype === 'business' ? 0.022 : 0.012)) { const read = Math.random() < 0.45, hand = Math.random() < 0.85 ? 'R' : 'L'; if (read) this.setAct('phone', { mode: 'read', hand }); else { D.ring(this); this.pend = { name: 'phone', opts: { mode: 'ear', hand } }; this.pendT = 1.1; } this.actUntil = now + 8 + Math.random() * 16 + (read ? 0 : 1.1); }
    this.shopT -= 0.35; if (this.shopT <= 0) { this.shopT = 2 + Math.random() * 3; if (!this.grp && !this.act && D.consider(this)) return true; }
    return false;
  }
  // a member of a walking group keeps its slot beside or behind the leader and matches the pace; when the leader stops they wait, chatting
  sFollow(dt, M, D) {
    const g = this.grp, L = g.leader; if (!L || L.dead || L.removed || L.hidden) { this.ungroup(); return; }
    if (L.state !== 'walk') { if (!this.act) this.setAct('talk', { energy: 0.45 }); this.faceTo(L.x, L.z, dt, 4); return; }
    if (this.act === 'talk') this.setAct(null);
    const h = L.yaw, sx = Math.sin(h), sz = Math.cos(h), rx = -sz, rz = sx, i = this.gi, lat = i === 1 ? 0.85 : i === 2 ? -0.85 : 0, back = i === 3 ? -1.1 : -0.15 - 0.1 * (i & 1);
    const tx = L.x + rx * lat + sx * back, tz = L.z + rz * lat + sz * back, lag = (tx - this.x) * sx + (tz - this.z) * sz, d = Math.hypot(tx - this.x, tz - this.z), ls = Math.max(L.speed, 0.25);
    this.go(M, tx + sx * 0.8, tz + sz * 0.8, clamp(ls + lag * 1.8 + (d > 0.4 ? 0.4 : 0), 0.15, d > 5 ? RUN * 0.7 : ls * 1.7 + 0.5));
  }
  // ----- standing around -----
  // Chooses what to do at a stop: look around, text, take a call, smoke, chat with somebody near, sit on a bench, lie on the beach, take photographs.
  startIdle(D) {
    const G = this.game, P = G.player, rain = D.raining, night = (G.night || 0) > 0.5, beach = !!this.area && this.area.x0 >= CITY.beachX - 1, hr = (G.clock / 60) % 24, near = (this.x - P.x) ** 2 + (this.z - P.z) ** 2 < 8100;
    const bench = near && !rain ? D.freeBench(this, 24) : null, sunny = beach && !rain && hr >= 8 && hr < 19 && D.sunners.length < 14, tourist = this.trait === 'tourist', biz = this.look.archetype === 'business'; // office people in the financial district stand on the phone a lot
    const kind = wpick(['look', 3, 'phone', rain ? 0 : biz ? 2.2 : 1.2, 'call', rain ? 0 : biz ? 1.6 : 0.8, 'smoke', rain ? 0 : night ? 1.1 : 0.55, 'talk', 1.1, 'bench', bench ? (night ? 1.6 : 2.6) : 0, 'sun', sunny ? 4 : 0, 'photo', tourist ? 2.5 : 0.1]);
    switch (kind) {
      case 'bench': if (bench) { this.goSit(bench, bench.slot); return; } break;
      case 'sun': { const s = D.sunSpot(this); if (s) { this.goSun(s); return; } break; }
      case 'talk': { const m = D.findMate(this); if (m) { this.startTalkWith(m); return; } break; }
      case 'phone': this.idleAct('phone', { mode: 'read', hand: Math.random() < 0.85 ? 'R' : 'L' }, 5 + Math.random() * 10); return;
      case 'call': D.ring(this); this.idleAct('phone', { mode: 'ear', hand: Math.random() < 0.85 ? 'R' : 'L' }, 6 + Math.random() * 16, 1.1); return;
      case 'smoke': this.idleAct('smoke', null, 8 + Math.random() * 12); return;
      case 'photo': this.idleAct('phone', { mode: 'read' }, 6 + Math.random() * 8); this.cd = 0.8 + Math.random() * 1.5; return;
    }
    this.idleAct(Math.random() < 0.55 ? 'lookAround' : null, null, 2 + Math.random() * 5);
  }
  sIdle(dt, M, D) {
    this.stateT -= dt; if (this.act === 'phone' && this.actMode === 'read' && this.cd > -9 && this.cd <= 0 && this.trait === 'tourist') { this.cd = 2 + Math.random() * 3; D.shutter(this); } // a tourist photographs everything
    if (this.stateT <= 0) { if (this.act !== 'umbrella') this.setAct(null); this.pend = null; this.pendT = 0; this.setState('walk'); }
  }
  // ----- running away, cowering, hands up -----
  sFlee(dt, M, D) {
    this.stateT -= dt; const f = this.fleeFrom, dx = this.x - f.x, dz = this.z - f.z, d = Math.hypot(dx, dz) || 1; if (this.blockedT > 0.4) { this.fleeRot = this.fleeRot ? -this.fleeRot : (Math.random() < 0.5 ? 1 : -1) * 1.15; this.blockedT = 0; }
    const c = Math.cos(this.fleeRot), s = Math.sin(this.fleeRot); this.go(M, this.x + (dx * c - dz * s) / d * 10, this.z + (dx * s + dz * c) / d * 10, RUN * this.runK);
    if (this.stateT <= 0 || d > 60) { this.stateT = 0; this.resume(); }
  }
  startCower(ev) {
    this.unengage(); this.setState('cower'); this.stateT = 1.2 + Math.random() * 2.8; this.setAct('cower'); const f = this.fleeFrom || (this.fleeFrom = { x: 0, z: 0 }); f.x = ev.x; f.z = ev.z;
  }
  sCower(dt) { this.stateT -= dt; this.speed = 0; this.faceTo(this.fleeFrom.x, this.fleeFrom.z, dt, 3); if (this.stateT <= 0) this.flee(this.fleeFrom.x, this.fleeFrom.z, 5 + Math.random() * 4); }
  startHandsUp() { this.unengage(); this.setState('handsup'); this.stateT = 2.5 + Math.random() * 2.5; this.setAct('handsUp'); this.game.crowd.voice(this, 'oh'); }
  sHandsUp(dt) { const P = this.game.player; this.speed = 0; this.faceTo(P.x, P.z, dt, 6); if (P.aiming && !P.dead) this.stateT = Math.max(this.stateT, 1.4); this.stateT -= dt; if (this.stateT <= 0) this.flee(P.x, P.z, 7); }
  // ----- watching: an accident, a body, a fight, a gunman far away -----
  startGawk(ev) {
    if (!ev || ev.n >= ev.max || BUSY.has(this.state) || this.hidden) return false; const D = this.game.crowd; this.unengage(); ev.n++; this.ev = ev; D.gawkSpot(this, ev); this.setState('gawk'); this.stateT = 9 + Math.random() * 16;
    const r = Math.random(); this.mode = r < 0.42 ? 'stare' : r < 0.78 ? 'film' : r < 0.9 ? 'point' : 'talk'; return true;
  }
  sGawk(dt, M, D) {
    const ev = this.ev; if (!ev) { this.resume(); return; }
    if (this.bs === 0) { if (this.go(M, this.tx, this.tz, 1.6 + (this.runK - 0.88)) < 0.5 || this.bt > 12) { this.bs = 1; this.bt = 0; this.speed = 0; const m = this.mode; if (m === 'film') { this.setAct('phone', { mode: 'read' }); this.cd = 0.4 + Math.random(); } else if (m === 'point') this.setAct('point', { target: ev.pos || ev }); else if (m === 'talk') this.setAct('talk', { energy: 0.9 }); } }
    else {
      this.faceTo(ev.x, ev.z, dt, 4); this.wv.x = ev.x; this.wv.z = ev.z; if (this.mode === 'stare' || this.mode === 'talk') this.lk = 1;
      if (this.mode === 'film' && this.cd <= 0) { this.cd = 2 + Math.random() * 4; D.shutter(this); }
      this.stateT -= dt; if (this.stateT <= 0 || this.game.time > ev.t1 + 5) this.endGawk();
    }
  }
  endGawk() { const ev = this.ev; if (ev && ev.n > 0) ev.n--; this.ev = null; this.setAct(null); this.resume(); }
  // runs over to a body or a crash and phones for help
  startHelp(x, z) { this.unengage(); const a = Math.atan2(this.x - x, this.z - z); this.tx = x + Math.sin(a) * 1.4; this.tz = z + Math.cos(a) * 1.4; this.wv.x = x; this.wv.z = z; this.setState('help'); }
  sHelp(dt, M, D) {
    if (this.bs === 0) { if (this.go(M, this.tx, this.tz, RUN * 0.5) < 0.5 || this.bt > 14) { this.bs = 1; this.bt = 0; this.speed = 0; D.ring(this, true); this.setAct('phone', { mode: 'ear' }); this.stateT = 7 + Math.random() * 5; } }
    else { this.faceTo(this.wv.x, this.wv.z, dt, 4); this.stateT -= dt; if (this.stateT <= 0) { this.setAct(null); this.resume(); } }
  }
  // ----- the witness: phones the police a few seconds after the crime, unless something happens to them first (Crowd.forget cancels the call) -----
  startCall(w) { this.unengage(); this.witness = w; this.setState('call'); this.setAct('phone', { mode: 'ear', hand: 'R' }); this.game.crowd.voice(this, 'oh'); }
  sCall(dt, M, D) {
    const w = this.witness; if (!w) { this.setAct(null); this.resume(); return; } this.speed = 0; this.faceTo(w.x, w.z, dt, 3); w.t -= dt;
    if (w.t <= 0) { D.report(this); this.witness = null; this.setAct(null); this.flee(w.x, w.z, 6); }
  }
  // ----- fighting -----
  startFight(P) { this.unengage(); this.setState('fight'); this.game.crowd.voice(this, 'angry'); this.cd = 0.3; }
  sFight(dt, M, D) {
    const G = this.game, P = G.player, d = dist(this.x, this.z, P.x, P.z);
    if (P.dead || P.vehicle || this.hp < 40 || this.bt > 16 || d > 32) { this.flee(P.x, P.z, 7); return; }
    if (d > 1.35) this.go(M, P.x, P.z, RUN * 0.78); else { this.faceTo(P.x, P.z, dt, 10); if (this.punchT <= 0 && this.cd <= 0) { this.punchT = 0.8; this.cd = 1.1; P.damage(6, this.x, this.z); G.audio.shot('punch', d); } }
  }
  startBrawl(o) { this.unengage(); this.mate = o; this.setState('brawl'); this.cd = 0.5 + Math.random() * 0.5; this.pt = 0; }
  sBrawl(dt, M, D) {
    const o = this.mate; if (!o || o.dead || o.removed || o.state !== 'brawl' || o.mate !== this) { this.mate = null; this.resume(); return; }
    const d = dist(this.x, this.z, o.x, o.z);
    if (d > 1.15) { this.go(M, o.x, o.z, 1.9); if (this.bt > 14) { this.mate = null; this.resume(); } return; }
    this.faceTo(o.x, o.z, dt, 9); if (this.bs === 0) { this.bs = 1; this.stateT = 8 + Math.random() * 8; } this.stateT -= dt; this.cd -= dt;
    if (this.pt > 0 && (this.pt -= dt) <= 0) D.brawlHit(this, o);
    if (this.cd <= 0 && this.punchT <= 0) { this.cd = 0.85 + Math.random() * 0.5; this.punchT = 0.8; this.pt = 0.25; }
    if (this.stateT <= 0) { this.mate = null; this.flee(o.x, o.z, 8); } // the one who tires first runs; the other sees it and walks on
  }
  // ----- benches -----
  goSit(b, slot) { this.unengage(); this.spot = b; this.slot = slot; b.occ[slot] = this; this.setState('gosit'); }
  sGoSit(dt, M, D) {
    const b = this.spot, lx = (this.slot ? 1 : -1) * 0.42, sx = b.x + b.rx * lx - b.fx * 0.06, sz = b.z + b.rz * lx - b.fz * 0.06; // the seat: the pelvis a little behind the middle of the bench
    if (this.bt > 30 || b.occ[this.slot] !== this) { this.abort(); return; }
    if (this.bs === 0) { if (this.go(M, b.x + b.rx * lx + b.fx * 1.35, b.z + b.rz * lx + b.fz * 1.35, 1.35) < 0.5) { this.bs = 1; this.pinned = true; } return; } // first to the front of the seat
    this.pinned = true; const d = Math.hypot(sx - this.x, sz - this.z);
    if (d > 0.55) { this.go(M, sx, sz, 1.0); return; }
    this.x = damp(this.x, sx, 6, dt); this.z = damp(this.z, sz, 6, dt); this.yaw = angleLerp(this.yaw, b.yaw, Math.min(1, dt * 7)); this.speed = damp(this.speed, 0, 10, dt);
    if (Math.abs(wrapAngle(this.yaw - b.yaw)) < 0.2 && d < 0.07) { this.x = sx; this.z = sz; this.yaw = b.yaw; this.speed = 0; this.setAct('sit', { h: 0.46, back: true }); this.setState('sit'); this.pinned = true; this.stateT = 25 + Math.random() * 60; }
  }
  sSit(dt, M, D) {
    const b = this.spot; this.pinned = true; this.speed = 0; if (!b) { this.abort(); return; }
    if (this.bs === 0) { this.stateT -= dt; if (this.stateT <= 0 || (D.raining && this.bt > 2)) { this.setAct(null); this.bs = 1; this.bt = 0; } return; }
    if (this.bt > 0.45) { const lx = (this.slot ? 1 : -1) * 0.42, fx = b.x + b.rx * lx + b.fx * 1.4, fz = b.z + b.rz * lx + b.fz * 1.4; if (this.go(M, fx, fz, 1.1) < 0.35 || this.bt > 3.5) { b.occ[this.slot] = null; this.spot = null; this.resume(); } } // stands up and steps off the bench
  }
  // ----- the beach -----
  goSun(s) { this.unengage(); this.spot = s; s.p = this; this.setState('gosun'); }
  sGoSun(dt, M, D) {
    const s = this.spot; if (!s || this.bt > 40) { this.abort(); return; }
    if (this.bs === 0) { if (this.go(M, s.x, s.z, 1.3) < 0.4) { this.bs = 1; this.pinned = true; } return; }
    this.pinned = true; this.x = damp(this.x, s.x, 5, dt); this.z = damp(this.z, s.z, 5, dt); this.yaw = angleLerp(this.yaw, s.yaw, Math.min(1, dt * 6)); this.speed = damp(this.speed, 0, 10, dt);
    if (Math.abs(wrapAngle(this.yaw - s.yaw)) < 0.12) { this.x = s.x; this.z = s.z; this.yaw = s.yaw; this.speed = 0; this.lying = true; this.lyT = 0; this.liftStage = 0; this.setAct('sunbathe', { pose: s.pose, center: true }); D.placeTowel(this); this.setState('sun'); this.pinned = true; this.stateT = 40 + Math.random() * 100; }
  }
  sSun(dt, M, D) {
    this.pinned = true; this.lying = true; this.speed = 0; this.stateT -= dt;
    if (this.stateT <= 0 || (D.raining && this.bt > 3)) { this.setAct(null); this.lying = false; D.forget(this); this.resume(); }
  }
  // ----- two people talking -----
  startTalkWith(m) {
    const dx = m.x - this.x, dz = m.z - this.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, cx = (this.x + m.x) / 2, cz = (this.z + m.z) / 2, T = 8 + Math.random() * 22;
    this.pairUp(m, cx - ux * 0.7, cz - uz * 0.7, T); m.pairUp(this, cx + ux * 0.7, cz + uz * 0.7, T);
  }
  pairUp(m, x, z, T) { this.unengage(); this.mate = m; this.tx = x; this.tz = z; this.stateT = T; this.setState('talk'); }
  sTalk(dt, M, D) {
    const m = this.mate, f = this.wv; if (m) { if (m.dead || m.removed || m.state !== 'talk') { this.endTalk(); return; } f.x = m.x; f.z = m.z; } else if (!this.grp) { this.endTalk(); return; } // the partner is gone
    if (this.bs === 0) { if (this.go(M, this.tx, this.tz, 1.35) < 0.3 || this.bt > 14) { this.bs = 1; this.speed = 0; } return; }
    this.faceTo(f.x, f.z, dt, 5); if (this.act !== 'talk') this.setAct('talk', { energy: 0.45 + Math.random() * 0.5 });
    this.stateT -= dt; if (this.stateT <= 0) this.endTalk();
  }
  endTalk() { const m = this.mate; this.mate = null; if (m && m.mate === this) m.mate = null; this.setAct(null); if (this.grp && this.grp.kind === 'talk') this.grp.kind = 'walk'; this.resume(); }
  // ----- queue, shop -----
  joinQueue(v) { if (v.q.length >= 5 || v.q.includes(this)) return false; this.unengage(); if (!v.qdir) v.qdir = this.x < v.x ? -1 : 1; v.q.push(this); this.venue = v; this.setState('queue'); this.qw = 0; return true; }
  sQueue(dt, M, D) {
    const v = this.venue, i = v ? v.q.indexOf(this) : -1; if (i < 0) { this.abort(); return; }
    const d = this.go(M, v.ox + v.qdir * 0.95 * i, v.oz, 1.4);
    if (d < 0.25) {
      M.go = false; this.speed = damp(this.speed, 0, 10, dt); this.yaw = angleLerp(this.yaw, i === 0 ? 0 : -v.qdir * Math.PI / 2, Math.min(1, dt * 5)); this.qw += dt;
      if (!this.act && Math.random() < dt * 0.05) this.setAct('phone', { mode: 'read' }); else if (this.act === 'phone' && Math.random() < dt * 0.08) this.setAct(null);
      if (i === 0 && this.qw > 5 + this.id % 4) { v.q.shift(); this.setAct(null); this.goShop(v); } else if (this.qw > 70) { this.abort(); }
    }
  }
  goShop(v) { this.unengage(); this.venue = v; this.setState('shopgo'); }
  sShopGo(dt, M, D) {
    const v = this.venue; if (!v || this.bt > 30 || (v.inside >= v.cap && this.bs === 0)) { this.abort(); return; }
    if (this.bs === 0) { if (this.go(M, v.ox, v.oz, 1.6) < 0.4) this.bs = 1; return; }
    this.go(M, v.x, v.z + 0.6, 1.2); this.yaw = angleLerp(this.yaw, 0, Math.min(1, dt * 5)); if (this.z > v.z + 0.05) this.enterShop(D);
  }
  // across the threshold: the person disappears into the doorway (their record stays under the world until they come out again)
  enterShop(D) { const v = this.venue; this.hidden = true; this.mesh.visible = false; v.inside++; this.y = -60; this.speed = 0; this.setAct(null); this.setState('shopin'); this.stateT = D.stay(v); D.chime(this, v); }
  sShopIn(dt) {
    this.stateT -= dt; if (this.stateT > 0) return; const v = this.venue, D = this.game.crowd; this.hidden = false; v.inside = Math.max(0, v.inside - 1); this.x = v.x; this.z = v.oz + 0.3; this.y = this.groundAt(this.x, this.z); this.yInit = true; this.yaw = Math.PI; this.speed = 0;
    this.mesh.visible = true; this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw; this.setState('shopout'); this.animSkip = 9; D.chime(this, v); this.tx = v.ox + (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random()); this.tz = v.oz;
    if (v.type === 'clothes' || v.type === 'dealer' || v.type === 'burger' || v.type === 'guns' || Math.random() < 0.25) { this.setAct('carry', { kind: 'bag' }); this.actUntil = this.game.time + 25 + Math.random() * 40; }
  }
  sShopOut(dt, M) { if (this.go(M, this.tx, this.tz, 1.4) < 0.5 || this.bt > 6) this.resume(); }
  // ----- the beach club -----
  goDance(spot) { this.unengage(); this.tx = spot.x; this.tz = spot.z; this.setState('godance'); this.game.crowd.dancing.push(this); }
  sGoDance(dt, M, D) { if (this.go(M, this.tx, this.tz, 1.7) < 0.35 || this.bt > 25) { this.speed = 0; this.setAct('dance', { style: Math.floor(Math.random() * 3), bpm: 112 + Math.floor(Math.random() * 20) }); this.yaw = Math.PI / 2 + (Math.random() - 0.5) * 1.2; this.setState('dance'); this.stateT = 25 + Math.random() * 50; } }
  sDance(dt, M, D) { this.speed = 0; this.stateT -= dt; if (this.stateT <= 0) { this.setAct(null); this.resume(); } }
  // ----- staff at their post -----
  sPost(dt, M, D) {
    const s = this.staff; if (!s) { this.resume(); return; } const G = this.game, P = G.player, d = this.go(M, s.x, s.z, 1.4);
    if (d > 0.7) { if (d > 1.6 && (this.act === 'smoke' || this.act === 'talk')) this.setAct(null); return; }
    M.go = false; this.speed = damp(this.speed, 0, 10, dt); this.yaw = angleLerp(this.yaw, s.yaw, Math.min(1, dt * 3)); this.thinkT -= dt;
    if (s.role === 'vendor' && this.cd <= 0 && (this.x - P.x) ** 2 + (this.z - P.z) ** 2 < 49) { this.cd = 14 + Math.random() * 10; this.setAct('wave', { hand: 'R' }); this.pend = { name: 'talk', opts: { energy: 0.8 } }; this.pendT = 2.6; D.voice(this, 'hey'); }
    else if (this.thinkT <= 0 && this.pendT <= 0) { this.thinkT = 6 + Math.random() * 8; const a = s.acts[Math.floor(Math.random() * s.acts.length)]; this.setAct(a, a === 'talk' ? { energy: 0.8 } : a === 'phone' ? { mode: 'ear' } : null); }
  }
  // ----- shelter from the rain, waiting at a bus stop -----
  sShelter(dt, M, D) {
    const s = this.spot; if (!s || this.bt > 120) { this.abort(); return; }
    if (this.bs === 0) { if (this.go(M, s.x, s.z, 1.8) < 0.35 || this.bt > 20) { this.bs = 1; this.bt = 0; this.speed = 0; this.rt = 0; } return; }
    this.speed = damp(this.speed, 0, 10, dt); this.yaw = angleLerp(this.yaw, s.yaw === undefined ? Math.PI : s.yaw, Math.min(1, dt * 4)); if (!this.act && Math.random() < dt * 0.15) this.setAct(Math.random() < 0.5 ? 'lookAround' : 'phone', { mode: 'read' });
    if (!D.raining) this.rt += dt; if ((this.wait ? this.bt > 20 + this.id % 30 : this.rt > 3) || this.bt > 90) { s.n = Math.max(0, (s.n || 0) - 1); this.wait = false; this.setAct(null); this.resume(); }
  }
  // This person has noticed an event d metres away. What they do depends on who they are and on what it is (see Crowd.event for the kinds).
  hear(ev, d) {
    if (BUSY.has(this.state) || this.hidden || this.injured || this.pickedUp) return; const D = this.game.crowd, P = this.game.player, r = Math.random(), el = !!this.look.elder, st = this.staff;
    if (st && st.role === 'guard') { this.alertT = 4; if (ev.type === 'gunfire' && d < 9) this.startCower(ev); return; } // guards hold their post
    switch (ev.type) {
      case 'gunfire': case 'explosion': {
        const big = ev.type === 'explosion';
        if (r < (big ? 0.5 : 0.36)) { this.flee(ev.x, ev.z, 6 + Math.random() * 5); if (d < 34 && D.shoutBudget-- > 0) D.voice(this, Math.random() < 0.55 ? 'scream' : 'help'); }
        else if (r < (big ? 0.82 : 0.74) || el) { this.startCower(ev); if (d < 30 && D.shoutBudget-- > 0 && Math.random() < 0.6) D.voice(this, 'oh'); }
        else if (!(d > 14 && r < 0.93 && this.startGawk(ev))) this.flee(ev.x, ev.z, 6 + Math.random() * 4);
        break;
      }
      case 'death': if (d < 1.2) return; if (r < 0.38) { if (!this.startGawk(ev)) this.flee(ev.x, ev.z, 5 + Math.random() * 4); } else if (r < 0.62) this.flee(ev.x, ev.z, 5 + Math.random() * 4); else if (r < 0.74) this.startCower(ev); else if (r < 0.86 && d < 18) this.startHelp(ev.x, ev.z); break;
      case 'fight': if (r < 0.5) this.startGawk(ev); else if (r < 0.7) this.flee(ev.x, ev.z, 6); else if (r < 0.74 && !el && d < 9 && ev.culprit === P) this.startFight(P); break;
      case 'accident': if (r < 0.55) this.startGawk(ev); else if (r < 0.65 && d < 22) this.startHelp(ev.x, ev.z); else if (r < 0.72) this.flee(ev.x, ev.z, 5); break;
      case 'brawl': if (r < 0.6) this.startGawk(ev); else if (r < 0.74) this.flee(ev.x, ev.z, 5); break;
      case 'heli': if (r < 0.18 && !this.act && ev.pos) this.idleAct('point', { target: ev.pos }, 4 + Math.random() * 3); break;
    }
  }
  // ---------- update ----------
  update(dt) {
    const G = this.game, P = G.player, D = G.crowd; D.tick(dt);
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
    if (this.pickedUp) return;
    if (this.hidden) { this.sShopIn(dt); return; } // inside a shop: nothing to move, nothing to draw
    this.age += dt; this.punchT = Math.max(0, this.punchT - dt);
    let tx = null, tz = null, spd = 0;
    if (this.injured) this.hurtTick(dt, D); // lies hurt: no AI, no walking, no reactions (setInjured), for civilians and armed people alike
    else if (this.kind === 'civ') {
      if (this.free) { this.brain(dt, D); if (_mv.go) { tx = _mv.x; tz = _mv.z; spd = _mv.spd; } }
      else { // a civilian that missions, jobs or the vip script drive: the plain wander
        if (this.state === 'flee') { this.stateT -= dt; if (this.vip) { const f = this.fleeFrom || (this.fleeFrom = { x: 0, z: 0 }); f.x = P.x; f.z = P.z; } const dx = this.x - this.fleeFrom.x, dz = this.z - this.fleeFrom.z, d = Math.hypot(dx, dz) || 1; tx = this.x + dx / d * 10; tz = this.z + dz / d * 10; spd = this.vip ? RUN * 1.15 : RUN; if (this.stateT <= 0 || d > (this.vip ? 90 : 60)) { this.state = 'walk'; this.pickWaypoint(); } }
        else if (this.state === 'idle') { this.stateT -= dt; if (this.stateT <= 0) this.state = 'walk'; }
        else { if (this.vip && dist(this.x, this.z, P.x, P.z) < 32) { this.flee(P.x, P.z, 10); } if (!this.wp) this.pickWaypoint(); const area = this.area, d = dist(this.x, this.z, this.wp.x, this.wp.z); if (d < (area ? 1 : 1.2)) { if (Math.random() < (area ? 0.35 : 0.12)) { this.state = 'idle'; this.stateT = area ? 3 + Math.random() * 7 : 2 + Math.random() * 5; } this.nextWaypoint(); } tx = this.wp.x; tz = this.wp.z; spd = this.walkSpeed; }
      }
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
    // steering + movement: free people steer round each other (separation, passing on the right, slowing behind somebody) while the player is within 60 m
    const px0 = this.x - P.x, pz0 = this.z - P.z, near = px0 * px0 + pz0 * pz0, aware = this.free && !this.pinned && near < 3600;
    if (tx !== null) {
      const dx = tx - this.x, dz = tz - this.z, l = Math.hypot(dx, dz);
      if (l > 0.05) { let hx = dx / l, hz = dz / l, sp = spd; if (aware && l > 0.25) { D.steer(this, hx, hz); hx = D.sx; hz = D.sz; sp *= D.sf; } this.yaw = angleLerp(this.yaw, Math.atan2(hx, hz), Math.min(1, dt * 10)); this.speed = damp(this.speed, sp, 8, dt); this.x += Math.sin(this.yaw) * this.speed * dt; this.z += Math.cos(this.yaw) * this.speed * dt; }
      else this.speed = damp(this.speed, 0, 10, dt);
    } else this.speed = damp(this.speed, 0, 10, dt);
    if (!this.pinned) { this.collideStatic(); this.collideVehicles(); if (aware) D.separate(this); } // somebody on a bench or a towel is inside the collision box of the thing they sit on
    const B = G.world.bounds; this.x = clamp(this.x, B.minX, B.maxX); this.z = clamp(this.z, B.minZ, B.maxZ);
    // real ground height: 0.15 m sidewalks, lots, beach, pier ramp; the first update snaps, later steps ease so a kerb is a quick step instead of a pop
    const gy = this.groundAt(this.x, this.z);
    if (!this.yInit) { this.yInit = true; this.y = gy; } else this.y = damp(this.y, gy, 25, dt);
    // a person lying down (sunbathing, hurt) is lifted so that the lowest vertex rests on the ground: measured when the pose has arrived, when it has settled, and once more after its slow shifting
    if (this.lying) { this.lyT += dt; if (this.liftStage < LIE_T.length && this.lyT >= LIE_T[this.liftStage] && (this.char.activityWeight === undefined || this.char.activityWeight > 0.9)) { this.mesh.position.set(this.x, this.y + this.lift, this.z); this.mesh.rotation.y = this.yaw; this.measureLift(); } }
    this.lift = damp(this.lift, this.lying ? this.liftTo : 0, 8, dt);
    this.mesh.position.set(this.x, this.y + this.lift, this.z); this.mesh.rotation.y = this.yaw;
    // pose: people far from the player refresh it every 2nd / 4th / 8th frame (quality tier decides how far), with the time they skipped
    const lod = ANIM_LOD[G.settings?.quality] || ANIM_LOD.high; this.animAcc += dt;
    if (++this.animSkip >= (near > lod[2] ? 8 : near > lod[1] ? 4 : near > lod[0] ? 2 : 1)) {
      const A = _anim, adt = this.animAcc; this.animSkip = 0; this.animAcc = 0;
      A.v = this.speed; A.moveYaw = this.yaw; A.yaw = this.yaw; A.yawRate = adt > 1e-5 ? clamp(wrapAngle(this.yaw - this.animYaw) / adt, -8, 8) : 0; this.animYaw = this.yaw;
      A.aiming = !!(this.weapon && this.kind !== 'civ' && this.aimT > 0); A.aimPitch = 0;
      A.long = !!this.weapon && (this.weapon.id === 'rifle' || this.weapon.id === 'shotgun' || this.weapon.id === 'sniper');
      A.punch = this.punchT > 0 ? 1 - this.punchT / 0.8 : 0;
      if (this.lk) A.lookAt = this.wv; else if (this.kind === 'civ' && this.state === 'idle' && near < 64 && !this.act) { _look.x = P.x; _look.z = P.z; A.lookAt = _look; } else A.lookAt = null; // idle civilians glance at a player within 8 m; people watching an event look at it
      this.char.animate(adt, A);
      const st = this.char.steps; if (st !== this.stepK) { this.stepK = st; if (this.speed > 0.4 && near < 400 && !this.lying) D.footstep(this, near); } // somebody else's footsteps, heard within 18 m
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
    if (this.kind === 'civ') { this.state = 'flee'; this.stateT = 6; const f = this.fleeFrom || (this.fleeFrom = { x: 0, z: 0 }); f.x = P.x; f.z = P.z; } else this.state = 'walk';
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
  collideStatic() { const h = this.game.grid.circleHit(this.x, this.z, 0.36, _tmp); if (h) { this.x += h.nx * h.depth; this.z += h.nz * h.depth; this.blockedT += 0.016; if (this.blockedT > 2.5 && this.kind === 'civ' && !this.staff) { this.blockedT = 0; this.nextWaypoint(); } /* staff keep their post: they have no route to re-plan (wp is null) */ } else this.blockedT = Math.max(0, this.blockedT - 0.016); }
  collideVehicles() {
    for (const v of this.game.vehiclesNear(this.x, this.z)) {
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
  dispose() { this.removed = true; const D = this.game.crowd; if (D) D.forget(this); this.game.scene.remove(this.mesh); this.char.dispose(); } // frees the person's own geometry and bone texture, and everything they held in the crowd; never the shared materials or gun geometry
}

// =====================================================================================================================
// CROWD: the director. game.crowd exists from the first Ped on and ticks from Ped.update (once per frame), so nothing has to call it.
//   events    gunfire, explosion, death, fight, accident, brawl, heli: { type, x, z, t0, t1, reach, n (watchers), max, culprit }. Game.alert (wrapped once) and Ped.die / hitByCar / the wreck scan feed them; every free civilian within reach answers
//             with Ped.hear (flee, cower, watch, film, help, point, now and then fight back)
//   crime     what the player does in front of people (shooting, killing, hitting, running somebody over): the nearest civilian who can see it becomes a witness and phones the police 3.5-6 s later (police.reportCrime('witness'));
//             any violence done to the witness first cancels the call
//   venues    doors, queues, awnings and staff posts of every shop; benches and bus stops come from the street furniture
//   steering  the neighbour list of the frame, used for separation and for passing on the right
// =====================================================================================================================
const EV = { gunfire: { reach: 32, ttl: 14, max: 6 }, explosion: { reach: 45, ttl: 25, max: 14 }, death: { reach: 24, ttl: 22, max: 7 }, fight: { reach: 16, ttl: 14, max: 8 }, accident: { reach: 40, ttl: 30, max: 14 }, brawl: { reach: 28, ttl: 20, max: 10 }, heli: { reach: 80, ttl: 10, max: 0 } };
const STAY = { burger: [25, 35], clothes: [40, 70], casino: [60, 140], bank: [30, 50], dealer: [30, 40], guns: [25, 35], hospital: [40, 80], safehouse: [60, 140] };
export class Crowd {
  constructor(game) {
    this.g = game; game.crowd = this; this.time = -1; this.L = []; this.n = 0; this.nCiv = 0; this.evs = []; this.fresh = []; this.venues = null; this.spots = null; this.spotT = 1; this.slowT = 0; this.raining = false; this.rainEpoch = 0;
    this.cur = null; this.curo = { x: 0, z: 0, type: '' }; this.calls = 0; this.callCool = 0; this.shoutBudget = 0; this.voiceT = 0; this.sunners = []; this.dancing = []; this.sx = 0; this.sz = 1; this.sf = 1; this.ds = { x: 0, z: 0 };
    this.brawlT = 40 + Math.random() * 60; this.heliT = 0; this.wreckT = 0; this.staffT = 0; this.aimId = 0; this.aimWas = false; this.laughT = 8; this.scans = 0; this.hook();
  }
  // Game.alert is wrapped once: events get their type before the plain alert (which would only make everybody run) reaches the people
  hook() {
    const G = this.g, orig = G.alert, D = this; if (orig.__crowd) return;
    const w = function (x, z, r, type, src) { D.alertIn(x, z, r, type, src); try { return orig.call(this, x, z, r, type, src); } finally { D.cur = null; } }; w.__crowd = true; G.alert = w;
  }
  // type is 'gunfire' | 'death' | 'fight' as Game.alert sends them; r >= 38 is a blast
  alertIn(x, z, r, type, src) {
    const G = this.g, c = this.curo;
    if (type === 'gunfire') { c.x = x; c.z = z; c.type = type; this.cur = c; this.event('gunfire', x, z, { culprit: src }); if (src === G.player) this.crime('gunfire', x, z, null); }
    else if (type === 'death') { c.x = x; c.z = z; c.type = type; this.cur = c; this.event(r >= 38 ? 'explosion' : 'death', x, z, null); }
    else if (type === 'fight') { c.x = x; c.z = z; c.type = type; this.cur = c; this.event('fight', x, z, { culprit: src || G.player }); }
  }
  // ---------- the frame ----------
  tick(dt) {
    const G = this.g, now = G.time; if (now === this.time) return; if (now < this.time - 1) { this.evs.length = 0; this.calls = 0; this.callCool = 0; this.fresh.length = 0; this.brawlT = 40 + Math.random() * 60; } this.time = now; // a new game starts the clock again: old events and calls are forgotten
    const L = this.L; let n = 0, civ = 0; for (const p of G.peds) { if (p.kind !== 'civ' || p.dead || p.ragdoll || p.hidden || p.pickedUp) continue; L[n++] = p; if (p.free) civ++; } L.length = n; this.n = n; this.nCiv = civ;
    this.slowT -= dt; if (this.slowT <= 0) { this.slowT = 0.25; this.slow(0.25); }
  }
  slow(dt) {
    const G = this.g, P = G.player, W = G.world; if (!W || !W.pois || !W.pois.bank) return;
    if (!this.venues) this.venues = buildVenues(G);
    // street furniture is scanned once the world is up (a second after the first slow tick); if the scan finds no benches it is retried once a second, four times at most
    if (!this.spots || (!this.spots.benches.length && this.scans < 4)) { this.spotT -= dt; if (this.spotT <= 0) { this.spotT = 1; this.scans++; this.spots = scanSpots(G); const S = this.spots; S.wait = []; for (const s of S.stops) for (const k of [-0.9, 0.9]) S.wait.push({ x: s.x + s.rx * k + s.fx * 0.3, z: s.z + s.rz * k + s.fz * 0.3, yaw: s.yaw, n: 0 }); } } // wait: the bus-shelter spots that somebody can wait at under the rain
    const rain = (G.rainLevel || 0) > 0.28; if (rain !== this.raining) { this.raining = rain; if (rain) this.rainEpoch++; }
    this.staffT -= dt; if (this.staffT <= 0) { this.staffT = 1; this.staffUpkeep(); }
    this.wreckT -= dt; if (this.wreckT <= 0) { this.wreckT = 0.8; this.scanWrecks(); }
    this.groupFresh(); this.aimCheck(); this.brawlCheck(dt); this.heliCheck(dt); this.murmurTick(); this.laughTick(dt);
    for (let i = this.evs.length - 1; i >= 0; i--) if (G.time > this.evs[i].t1) this.evs.splice(i, 1);
  }
  // ---------- events ----------
  // x, z: where; o: { reach, ttl, culprit, pos }. The same kind of event within 10 m of a live one is the same event (a gunfight is one event, not forty).
  event(type, x, z, o) {
    const G = this.g, now = G.time, K = EV[type]; if (!K) return null; const reach = o && o.reach || K.reach, ttl = o && o.ttl || K.ttl;
    for (const e of this.evs) if (e.type === type && now < e.t1 && (e.x - x) ** 2 + (e.z - z) ** 2 < 100) { e.t1 = Math.max(e.t1, now + Math.min(ttl, 8)); e.x = x; e.z = z; if (now - e.rt > 4) { e.rt = now; this.shoutBudget = 3; this.react(e); } return e; }
    const ev = { type, x, z, t0: now, t1: now + ttl, rt: now, reach, n: 0, max: K.max, culprit: o && o.culprit || null, pos: o && o.pos || null };
    if (this.evs.length >= 10) this.evs.shift(); this.evs.push(ev); this.shoutBudget = 3; this.react(ev); return ev;
  }
  react(ev) {
    const G = this.g, vis = ev.type === 'death' || ev.type === 'fight' || ev.type === 'accident' || ev.type === 'brawl';
    for (const p of G.peds) {
      if (p.kind !== 'civ' || p.dead || p.ragdoll || !p.free || p === ev.culprit) continue; const d = Math.hypot(p.x - ev.x, p.z - ev.z); if (d > ev.reach) continue;
      if (vis && d > 12 && !p.hasLOS(ev.x, 1.0, ev.z)) continue; p.hear(ev, d);
    }
  }
  // something people are still looking at, for a walker who comes by (not for gunfire or blasts: those make people run, which Ped.hear has already handled)
  curious(p) {
    const now = this.g.time; for (const e of this.evs) { if (now > e.t1 || e.n >= e.max || e.type === 'heli' || e.type === 'gunfire' || e.type === 'explosion') continue; const d = Math.hypot(p.x - e.x, p.z - e.z); if (d < e.reach * 0.8 && d > 3 && Math.random() < 0.09) return e; }
    return null;
  }
  // where a watcher stands: on the way to the event but not on the road and not inside anything, 5-9 m away from it
  gawkSpot(p, ev) {
    const G = this.g, W = G.world, dx = ev.x - p.x, dz = ev.z - p.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, want = Math.max(0, d - (ev.type === 'accident' || ev.type === 'death' ? 6 + Math.random() * 3 : 5 + Math.random() * 3));
    for (let k = 10; k >= 0; k--) {
      const t = want * k / 10, x = p.x + ux * t - uz * (Math.random() - 0.5) * 1.2, z = p.z + uz * t + ux * (Math.random() - 0.5) * 1.2; if (!p.area && W.isRoad && W.isRoad(x, z)) continue; if (G.grid.circleHit(x, z, 0.5, _tmp)) continue; p.tx = x; p.tz = z; return;
    }
    p.tx = p.x; p.tz = p.z;
  }
  // ---------- crimes and witnesses ----------
  crime(type, x, z, victim) {
    const G = this.g, pol = G.police; if (!pol || G.time < this.callCool || this.calls > 0 || pol.level >= 3) return;
    let best = null, bd = type === 'gunfire' ? 26 : 22; bd *= bd;
    for (const p of G.peds) {
      if (!p.free || p === victim || p.dead || p.ragdoll || p.hidden || p.injured || p.pickedUp || p.witness || p.staff) continue; const d2 = (p.x - x) ** 2 + (p.z - z) ** 2; if (d2 > bd) continue;
      if (d2 > 100 && !p.hasLOS(x, 1.2, z)) continue; bd = d2; best = p;
    }
    if (best) { best.startCall({ t: 3.5 + Math.random() * 2.5, x, z, type }); this.calls++; }
  }
  report(p) { const G = this.g, w = p.witness; this.calls = Math.max(0, this.calls - 1); this.callCool = G.time + 12; if (w && G.police) G.police.reportCrime('witness', w.x, w.z); }
  // ---------- sound (all of it guarded: the audio may not have a method yet) ----------
  pan(x, z) { const c = this.g.camera, e = c.matrixWorld.elements, dx = x - c.position.x, dz = z - c.position.z, d = Math.hypot(dx, dz) || 1; return clamp((dx * e[0] + dz * e[2]) / d, -1, 1) * 0.9; }
  voice(p, kind) {
    const G = this.g, A = G.audio; if (!A || G.time < this.voiceT) return; const P = G.player, d = dist(p.x, p.z, P.x, P.z); if (d > 44) return;
    this.voiceT = G.time + 0.25; A.shout(kind, d, this.pan(p.x, p.z), !!p.look.female);
  }
  ring(p, quiet) { const G = this.g, A = G.audio; if (!A || quiet) return; const P = G.player, d = dist(p.x, p.z, P.x, P.z); if (d < 30) A.phoneRing(d, this.pan(p.x, p.z)); }
  shutter(p) { const G = this.g, A = G.audio; if (!A) return; const P = G.player, d = dist(p.x, p.z, P.x, P.z); if (d < 28) A.shutter(d, this.pan(p.x, p.z)); }
  chime(p, v) {
    const G = this.g, A = G.audio; if (!A) return; const P = G.player, d = dist(p.x, p.z, P.x, P.z); if (d > 30) return; A.chime(Math.max(0.8, d));
    if (p.state === 'shopout' && (v.type === 'burger' || v.type === 'clothes' || v.type === 'dealer') && Math.random() < 0.5 ) A.register(Math.max(0.8, d + 1));
  }
  footstep(p, d2) { const G = this.g, A = G.audio; if (!A) return; A.pedStep(surfaceAt(G, p.x, p.z), Math.sqrt(d2), this.pan(p.x, p.z), clamp(p.speed / 5.6, 0.2, 1), (G.rainLevel || 0) > 0.3); }
  // how crowded it is around the player: people within 32 m weigh in by closeness (talking, queueing and watching ones count more), the club at night and the beach by day add some
  murmurTick() {
    const G = this.g, A = G.audio; if (!A) return; const P = G.player; let s = 0;
    for (let i = 0; i < this.n; i++) { const p = this.L[i], d2 = (p.x - P.x) ** 2 + (p.z - P.z) ** 2; if (d2 > 1024) continue; s += Math.pow(1 - Math.sqrt(d2) / 32, 1.3) * (p.state === 'talk' || p.state === 'queue' || p.state === 'gawk' || p.state === 'dance' ? 1.7 : 1); }
    const Z = zones(G), hr = (G.clock / 60) % 24; if (Z.club && (hr >= 21 || hr < 4) && Math.hypot(P.x - Z.club.x, P.z - Z.club.z) < 55) s += 2; if (P.x > CITY.beachX && hr >= 9 && hr < 18) s += 0.8;
    A.murmur(clamp(s / 6.5, 0, 1) * (G.state === 'playing' || G.state === 'dead' ? 1 : 0));
  }
  // somebody who talks now and then laughs
  laughTick(dt) {
    this.laughT -= dt; if (this.laughT > 0) return; this.laughT = 7 + Math.random() * 12; const G = this.g, A = G.audio, P = G.player; if (!A) return;
    for (let i = 0; i < this.n; i++) { const p = this.L[i]; if (p.state !== 'talk' || p.bs !== 1) continue; const d = dist(p.x, p.z, P.x, P.z); if (d > 30) continue; A.laugh(d, this.pan(p.x, p.z), !!p.look.female); p.char.setExpression('laugh', 1.6); if (p.mate) p.mate.char.setExpression('smile', 2); return; }
  }
  // ---------- steering ----------
  // The heading for p when it wants to go (dx, dz): pushed away from everybody within 2.2 m (the closer, the more), nudged to the right when somebody comes towards it, slowed when somebody is right in front.
  // Result in sx, sz (a unit vector) and sf (the speed factor).
  steer(p, dx, dz) {
    let ax = 0, az = 0, sf = 1; const L = this.L, n = this.n, g = p.grp;
    for (let i = 0; i < n; i++) {
      const q = L[i]; if (q === p) continue; const rx = p.x - q.x, rz = p.z - q.z; if (rx > 2.2 || rx < -2.2 || rz > 2.2 || rz < -2.2) continue;
      const d2 = rx * rx + rz * rz; if (d2 > 4.84 || d2 < 1e-4) continue; const d = Math.sqrt(d2), ahead = -(rx * dx + rz * dz) / d; // > 0: q is in front of p
      if (ahead < -0.25 && d > 0.9) continue; const same = g && q.grp === g, w = (2.2 - d) / 2.2 * (same ? 0.35 : 1);
      ax += rx / d * w * 1.5; az += rz / d * w * 1.5;
      if (ahead > 0.3 && !same) { ax -= dz * w; az += dx * w; if (d < 1.4 && ahead > 0.7) sf = Math.min(sf, 0.4 + 0.4 * Math.max(0, d - 0.6)); } // the right-hand side of the heading is (-dz, dx)
    }
    const P = this.g.player; if (!P.vehicle && !P.dead) { const rx = p.x - P.x, rz = p.z - P.z, d2 = rx * rx + rz * rz; if (d2 < 3.6 && d2 > 1e-4) { const d = Math.sqrt(d2), w = (1.9 - d) / 1.9; if (w > 0) { ax += rx / d * w * 1.5; az += rz / d * w * 1.5; } } }
    const hx = dx + ax, hz = dz + az, l = Math.hypot(hx, hz) || 1; this.sx = hx / l; this.sz = hz / l; this.sf = sf;
  }
  // nobody walks through anybody: what is still closer than 0.55 m is pushed apart (a sitting or standing person is pushed less)
  separate(p) {
    const L = this.L, n = this.n;
    for (let i = 0; i < n; i++) {
      const q = L[i]; if (q === p) continue; const rx = p.x - q.x; if (rx > 0.55 || rx < -0.55) continue; const rz = p.z - q.z; if (rz > 0.55 || rz < -0.55) continue; const d2 = rx * rx + rz * rz;
      if (d2 >= 0.3025) continue; if (d2 < 1e-6) { p.x += 0.03; continue; } const d = Math.sqrt(d2), k = (0.55 - d) * (q.pinned || q.speed < 0.2 ? 0.8 : 0.5); p.x += rx / d * k; p.z += rz / d * k;
    }
  }
  // ---------- things people use ----------
  // true when walking straight from (x0, z0) to (x1, z1) does not cross a street (people cross only at the corners of the sidewalk graph)
  clear(x0, z0, x1, z1) {
    const W = this.g.world, n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2));
    for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; if (x < CITY.beachX - 1 && W.isRoad(x, z)) return false; }
    return true;
  }
  freeBench(p, r) {
    const S = this.spots; if (!S) return null; let best = null, bd = r * r;
    for (const b of S.benches) { const d = (b.x - p.x) ** 2 + (b.z - p.z) ** 2; if (d >= bd) continue; const slot = b.occ[0] === null ? 0 : b.occ[1] === null ? 1 : -1; if (slot < 0 || !this.clear(p.x, p.z, b.x + b.fx * 1.35, b.z + b.fz * 1.35)) continue; bd = d; best = b; best.slot = slot; }
    return best;
  }
  // a patch of sand for a towel: on the beach strip near the person, 3+ m from the next sunbather, off the pier and out of anything solid
  sunSpot(p) {
    const G = this.g, x0 = CITY.beachX + 9, x1 = CITY.oceanX - 14, pier = G.world.pier;
    for (let k = 0; k < 8; k++) {
      const x = x0 + Math.random() * (x1 - x0), z = clamp(p.z + (Math.random() * 2 - 1) * 30, CITY.minZ + 8, CITY.maxZ - 8); if (G.grid.circleHit(x, z, 1.3, _tmp)) continue; if (pier && x > pier.x0 - 8 && Math.abs(z - pier.z) < 7) continue;
      let ok = true; for (const s of this.sunners) if ((s.x - x) ** 2 + (s.z - z) ** 2 < 10) { ok = false; break; } if (!ok) continue;
      const belly = Math.random() < 0.4, s = { x, z, yaw: (belly ? -Math.PI / 2 : Math.PI / 2) + (Math.random() - 0.5) * 0.5, pose: belly ? 'belly' : 'back', p, towel: null }; this.sunners.push(s); return s; // the head points to the land, the feet to the sea
    }
    return null;
  }
  placeTowel(p) { const s = p.spot, G = this.g; if (!s || s.towel) return; const m = s.towel = makeTowel(p.id); m.position.set(s.x, G.world.groundY(s.x, s.z) + 0.02, s.z); m.rotation.y = s.yaw; G.scene.add(m); }
  unsun(s) { const i = this.sunners.indexOf(s); if (i >= 0) this.sunners.splice(i, 1); if (s.towel) { this.g.scene.remove(s.towel); s.towel = null; } }
  // somebody idle or walking slowly within 9 m who is free to chat
  findMate(p) {
    let best = null, bd = 81; const L = this.L;
    for (let i = 0; i < this.n; i++) { const q = L[i]; if (q === p || !q.free || q.mate || q.grp || q.staff || (q.state !== 'idle' && !(q.state === 'walk' && !q.act)) || q.trait === 'jogger') continue; const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (d < bd && d > 4 && this.clear(p.x, p.z, q.x, q.z)) { bd = d; best = q; } }
    return best;
  }
  // the nearest dry spot: an awning in front of a shop or a bus shelter
  goShelter(p) {
    let best = null, bd = 2025; const V = this.venues, S = this.spots;
    if (V) for (const v of V) for (const s of v.shelter) { if (s.n >= 1) continue; const d = (s.x - p.x) ** 2 + (s.z - p.z) ** 2; if (d < bd && this.clear(p.x, p.z, s.x, s.z)) { bd = d; best = s; } }
    if (S && S.wait) for (const s of S.wait) { if (s.n >= 1) continue; const d = (s.x - p.x) ** 2 + (s.z - p.z) ** 2; if (d < bd && this.clear(p.x, p.z, s.x, s.z)) { bd = d; best = s; } }
    if (!best) return false; p.unengage(); best.n++; p.spot = best; p.wait = false; p.setState('shelter'); return true;
  }
  // every few seconds, for a walker near a shop: go in, stand in the queue of a burger bar, go to the beach club at night, wait at a bus stop
  consider(p) {
    const G = this.g, V = this.venues; if (!V) return false; const hr = (G.clock / 60) % 24, night = hr >= 20 || hr < 5, rain = this.raining;
    for (const v of V) {
      if (v.club) { if (night && this.dancing.length < 9 && Math.hypot(p.x - v.x, p.z - v.z) < 90 && Math.random() < (p.trait === 'clubber' ? 0.5 : 0.07) && this.clear(p.x, p.z, v.dance.x, v.dance.z)) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * v.dance.r, s = this.ds; s.x = v.dance.x + Math.cos(a) * r; s.z = v.dance.z + Math.sin(a) * r; for (const o of this.dancing) if ((o.tx - s.x) ** 2 + (o.tz - s.z) ** 2 < 1.2) return false; p.goDance(s); return true; } continue; }
      if (!v.weight || v.inside >= v.cap) continue; const d = Math.hypot(p.x - v.ox, p.z - v.oz); if (d > 18 || d < 1.5) continue;
      const f = v.type === 'burger' ? (hr >= 11 && hr < 14 ? 2 : hr >= 17 || hr < 2 ? 1.6 : 0.7) : v.type === 'casino' ? (night ? 2.2 : 0.25) : (hr >= 9 && hr < 19 ? 1 : 0.08);
      if (Math.random() > 0.018 * v.weight * f * (rain ? 1.5 : 1) || !this.clear(p.x, p.z, v.ox, v.oz)) continue;
      if (v.type === 'burger' && Math.random() < 0.6 && p.joinQueue(v)) return true; p.goShop(v); return true;
    }
    const S = this.spots; if (!rain && S && S.wait && Math.random() < 0.03) for (const s of S.wait) { if (s.n >= 1 || (s.x - p.x) ** 2 + (s.z - p.z) ** 2 > 400 || !this.clear(p.x, p.z, s.x, s.z)) continue; p.unengage(); s.n++; p.spot = s; p.wait = true; p.setState('shelter'); return true; }
    return false;
  }
  stay(v) { const s = STAY[v.type] || [25, 40]; return s[0] + Math.random() * s[1]; }
  // ---------- forgetting a person: everything they held is let go ----------
  forget(p) {
    const v = p.venue; if (v) { const i = v.q.indexOf(p); if (i >= 0) v.q.splice(i, 1); if (p.hidden) v.inside = Math.max(0, v.inside - 1); }
    const sp = p.spot; if (sp) { if (sp.occ) { for (let i = 0; i < 2; i++) if (sp.occ[i] === p) sp.occ[i] = null; } else if (sp.towel !== undefined) this.unsun(sp); else if (sp.n !== undefined && p.state === 'shelter') sp.n = Math.max(0, sp.n - 1); p.spot = null; }
    if (p.mate) { const o = p.mate; p.mate = null; if (o.mate === p) o.mate = null; }
    if (p.grp) this.leave(p);
    if (p.witness) { p.witness = null; this.calls = Math.max(0, this.calls - 1); }
    if (p.ev) { if (p.ev.n > 0) p.ev.n--; p.ev = null; }
    const i = this.dancing.indexOf(p); if (i >= 0) this.dancing.splice(i, 1); p.venue = null;
  }
  leave(p) {
    const g = p.grp; if (!g) return; p.grp = null; const i = g.members.indexOf(p); if (i >= 0) g.members.splice(i, 1); if (g.leader === p) g.leader = g.members[0] || null;
    if (g.members.length < 2) { for (const m of g.members) m.grp = null; g.members.length = 0; g.leader = null; }
  }
  // ---------- staff: guards at the bank and casino, a vendor at each burger bar, a mechanic, nurses ----------
  staffUpkeep() {
    const G = this.g, P = G.player, V = this.venues; if (!V || G.state === 'title') return;
    for (const v of V) {
      if (!v.posts.length) continue; const dv = dist(v.x, v.z, P.x, P.z);
      for (const s of v.posts) {
        if (s.ped && (s.ped.removed || s.ped.dead)) { if (s.ped.dead) s.cool = G.time + 150; s.ped = null; }
        if (s.ped) { if (dv > 190) { G.removePed(s.ped); s.ped = null; } continue; }
        if (dv > 105 || G.time < s.cool) continue; if (dv < 60 && !G.isHiddenFromCamera(s.x, 1, s.z)) continue;
        s.ped = this.spawnStaff(s);
      }
    }
  }
  spawnStaff(s) {
    const G = this.g; if (G.grid.circleHit(s.x, s.z, 0.4)) { s.cool = G.time + 600; return null; } // a post that a planter, bench or pole now stands on stays empty for a while
    const p = new Ped(G, { kind: 'civ', look: uniformLook(s.k), x: s.x, z: s.z, yaw: s.yaw, state: 'post', noDespawn: true, staff: s, trait: null }); G.addPed(p); return p;
  }
  // a wreck is an accident for as long as people care to look
  scanWrecks() { const G = this.g, P = G.player; for (const v of G.vehicles) { if (!v.wrecked || v._cw) continue; v._cw = true; if (Math.hypot(v.x - P.x, v.z - P.z) < 170) this.event('accident', v.x, v.z, null); } }
  heliCheck(dt) {
    const G = this.g, h = G.police && G.police.heli; if (!h || !h.group) return; this.heliT -= dt; if (this.heliT > 0) return; this.heliT = 8; const p = h.group.position; if (Math.hypot(p.x - G.player.x, p.z - G.player.z) < 90) this.event('heli', p.x, p.z, { pos: p });
  }
  // a gun aimed at somebody within 14 m, in front of the player: hands up (or a dash for it)
  aimCheck() {
    const G = this.g, P = G.player; if (!(P.aiming && !P.dead && !P.vehicle && P.weapon && !P.weapon.melee)) { this.aimWas = false; return; } if (!this.aimWas) { this.aimWas = true; this.aimId++; }
    const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
    for (let i = 0; i < this.n; i++) {
      const p = this.L[i]; if (!p.free || p.aimId === this.aimId || BUSY.has(p.state)) continue; const dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz); if (d > 14 || d < 1 || (dx * fx + dz * fz) / d < 0.82) continue;
      if (d > 5 && !p.hasLOS(P.x, 1.3, P.z)) continue; p.aimId = this.aimId; if (p.staff && p.staff.role === 'guard') continue; if (Math.random() < 0.6) p.startHandsUp(); else p.flee(P.x, P.z, 7);
    }
  }
  // ---------- groups ----------
  // People who have just appeared on the sidewalk sometimes have company: a walking group of two to four (one pace, side by side) or a few people standing in a circle talking.
  groupFresh() {
    const G = this.g, hr = (G.clock / 60) % 24, pG = hr >= 9 && hr < 19 ? 0.5 : 0.3; // by day more people walk in company
    const F = this.fresh; for (let i = F.length - 1; i >= 0; i--) { const p = F[i]; if (p.removed) { F.splice(i, 1); continue; } if (p.age < 0.15) continue; F.splice(i, 1); if (p.free && !p.dead && p.state === 'walk' && !p.grp && !p.trait && Math.random() < pG) this.formGroup(p); }
  }
  formGroup(p) {
    const G = this.g, cap = G.pedBudget(), room = cap + 1 - this.nCiv; if (room < 1) return;
    const talk = Math.random() < 0.38, k = Math.min(room, Math.random() < 0.62 ? 1 : Math.random() < 0.65 ? 2 : 3), grp = { kind: talk ? 'talk' : 'walk', leader: p, members: [p] }; p.grp = grp; p.gi = 0;
    for (let i = 1; i <= k; i++) { let a = null; for (let t = 0; t < 8 && a === null; t++) { const c = Math.random() * 6.28; if (!G.grid.circleHit(p.x + Math.cos(c) * 0.9, p.z + Math.sin(c) * 0.9, 0.4)) a = c; } if (a === null) continue; // a member is born on a free spot beside the leader, or not at all
      const q = new Ped(G, { kind: 'civ', x: p.x + Math.cos(a) * 0.9, z: p.z + Math.sin(a) * 0.9, area: p.area || undefined, yaw: p.yaw, trait: null }); q.grp = grp; q.gi = i; q.walkSpeed = p.walkSpeed; grp.members.push(q); G.addPed(q); }
    if (!talk) { p.walkSpeed *= 0.92; for (const m of grp.members) m.walkSpeed = p.walkSpeed; return; }
    const n = grp.members.length, T = 12 + Math.random() * 30; // a circle of talkers, 0.85 m from the middle
    grp.members.forEach((m, i) => { const a = i / n * 6.283 + p.yaw; m.x = p.x + Math.sin(a) * 0.85; m.z = p.z + Math.cos(a) * 0.85; m.wv.x = p.x; m.wv.z = p.z; m.mate = null; m.setState('talk'); m.bs = 1; m.stateT = T; m.tx = m.x; m.tz = m.z; });
  }
  // ---------- brawls: now and then two people at the end of their patience (more at night); everybody around stops to watch ----------
  brawlCheck(dt) {
    this.brawlT -= dt; if (this.brawlT > 0) return; this.brawlT = 40 + Math.random() * 70; const G = this.g, P = G.player; if (Math.random() > ((G.night || 0) > 0.4 ? 0.5 : 0.18)) return; const L = this.L, ok = p => p.free && (p.state === 'walk' || p.state === 'idle') && !p.grp && !p.staff && !p.look.elder && !p.act;
    for (let i = 0; i < this.n; i++) {
      const a = L[i]; if (!ok(a)) continue; const da = dist(a.x, a.z, P.x, P.z); if (da < 22 || da > 75) continue;
      for (let j = i + 1; j < this.n; j++) { const b = L[j]; if (!ok(b)) continue; const d = dist(a.x, a.z, b.x, b.z); if (d > 12 || d < 1.5) continue; a.startBrawl(b); b.startBrawl(a); this.event('brawl', (a.x + b.x) / 2, (a.z + b.z) / 2, null); return; }
    }
  }
  brawlHit(a, b) {
    const G = this.g, A = G.audio, P = G.player, d = dist(b.x, b.z, P.x, P.z); b.char.flinch(b.x - a.x, b.z - a.z, false); if (A && d < 40) A.meleeHit('fist', d);
    if (Math.random() < 0.2) this.voice(a, 'angry'); else if (Math.random() < 0.15) this.voice(b, 'ugh');
  }
}

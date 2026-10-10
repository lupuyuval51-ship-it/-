import * as THREE from '../vendor/three.module.min.js';
import { raySphere, dist } from './utils.js';
import { T } from './i18n.js';

// Hitscan shooting shared by the player and armed NPCs.
export function fireWeapon(game, ox, oy, oz, dx, dy, dz, w, shooter) {
  const pellets = w.pellets || 1; let hits = [];
  for (let k = 0; k < pellets; k++) {
    let ddx = dx + (Math.random() - 0.5) * w.spread * 2, ddy = dy + (Math.random() - 0.5) * w.spread * 2, ddz = dz + (Math.random() - 0.5) * w.spread * 2; const l = Math.hypot(ddx, ddy, ddz); ddx /= l; ddy /= l; ddz /= l;
    let best = { t: game.grid.raycast(ox, oy, oz, ddx, ddy, ddz, w.range), type: 'world' };
    const tg = ddy < -1e-4 ? -oy / ddy : Infinity; if (tg < best.t) best = { t: tg, type: 'ground' };
    for (const p of game.peds) {
      if (p.dead || p === shooter) continue; if (Math.abs(p.x - ox) > w.range || Math.abs(p.z - oz) > w.range) continue;
      const th = raySphere(ox, oy, oz, ddx, ddy, ddz, p.x, p.y + 1.6, p.z, 0.24); if (th !== null && th < best.t) { best = { t: th, type: 'ped', ped: p, head: true }; continue; }
      const tb = raySphere(ox, oy, oz, ddx, ddy, ddz, p.x, p.y + 0.95, p.z, 0.5); if (tb !== null && tb < best.t) best = { t: tb, type: 'ped', ped: p };
    }
    const P = game.player; if (shooter !== 'player' && shooter !== P && !P.dead && !P.vehicle) { const tb = raySphere(ox, oy, oz, ddx, ddy, ddz, P.x, P.y + 0.95, P.z, 0.5); if (tb !== null && tb < best.t) best = { t: tb, type: 'player' }; }
    for (const v of game.vehicles) {
      if (v === (shooter?.vehicle) || v === P.vehicle && shooter === 'player') continue; const r = v.spec.len * 0.55; if (Math.abs(v.x - ox) > w.range + r || Math.abs(v.z - oz) > w.range + r) continue;
      const ts = raySphere(ox, oy, oz, ddx, ddy, ddz, v.x, 0.9, v.z, r); if (ts === null || ts > best.t) continue;
      for (let s = ts; s < ts + r * 2 && s < best.t; s += 0.35) { const px = ox + ddx * s, py = oy + ddy * s, pz = oz + ddz * s; if (py < 2.4 && py > 0 && v.contains(px, pz, 0.15)) { best = { t: s, type: 'vehicle', vehicle: v }; break; } }
    }
    const hx = ox + ddx * best.t, hy = oy + ddy * best.t, hz = oz + ddz * best.t;
    game.fx.tracer(ox, oy, oz, hx, hy, hz);
    if (best.type === 'ped') { best.ped.hit(w.dmg * (best.head ? 2.5 : 1), ddx, ddz, shooter === 'player' ? 'player' : shooter, !!best.head); if (shooter === 'player' && (best.ped.team === 'cop' || best.ped.team === 'swat') && !best.ped.dead) game.police.reportCrime('hitcop', hx, hz); }
    else if (best.type === 'vehicle') { const v = best.vehicle; v.damage(w.dmg * 0.55, 'gun'); game.fx.sparks(hx, hy, hz, 5, 4); if (v.ai && v.ai.mode === 'traffic') v.ai.panic = 8; if (shooter === 'player') { if (v.type === 'police') game.police.reportCrime('hitcop', hx, hz); else game.police.reportCrime('shootcar', hx, hz); } }
    else if (best.type === 'player') { game.player.damage(w.dmg, ox, oz); }
    else if (best.t < w.range) { game.fx.sparks(hx, hy, hz, 4, 3); game.fx.dust(hx, hy, hz, 2); }
    // bullet-impact sound for the first two pellets only (a shotgun blast must not stack eight of them); a shot that reached max range hit nothing
    if (k < 2) { const it = best.type === 'vehicle' ? 'vehicle' : best.type === 'ped' || best.type === 'player' ? 'ped' : best.t < w.range ? 'world' : null; if (it) game.audio.bulletImpact(it, dist(hx, hz, game.player.x, game.player.z)); }
    hits.push(best);
  }
  game.fx.muzzle(ox, oy, oz, dx, dy, dz); game.audio.shot(w.id, dist(ox, oz, game.player.x, game.player.z));
  return hits;
}

// ---------------- pickups & collectibles ----------------
const geo = { cash: new THREE.BoxGeometry(0.45, 0.3, 0.3), ammo: new THREE.BoxGeometry(0.4, 0.28, 0.5), health: new THREE.BoxGeometry(0.5, 0.4, 0.5), armor: new THREE.BoxGeometry(0.55, 0.5, 0.25), weapon: new THREE.BoxGeometry(0.12, 0.28, 0.7), token: new THREE.OctahedronGeometry(0.42, 0), package: new THREE.BoxGeometry(0.6, 0.45, 0.6) };
const mats = { cash: new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x1a7a3a, emissiveIntensity: 0.6 }), ammo: new THREE.MeshStandardMaterial({ color: 0x8a8f9a, emissive: 0x333944, emissiveIntensity: 0.5 }), health: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff3b3b, emissiveIntensity: 0.6 }), armor: new THREE.MeshStandardMaterial({ color: 0x3b6cff, emissive: 0x1a3aa0, emissiveIntensity: 0.6 }), weapon: new THREE.MeshStandardMaterial({ color: 0x222831, emissive: 0x4a5566, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.3 }), token: new THREE.MeshStandardMaterial({ color: 0xff4fa3, emissive: 0xff2a8a, emissiveIntensity: 1.2, metalness: 0.5, roughness: 0.2 }), package: new THREE.MeshStandardMaterial({ color: 0xc8843a, emissive: 0x7a4a10, emissiveIntensity: 0.5 }) };
const ringGeo = new THREE.RingGeometry(0.7, 0.95, 24); ringGeo.rotateX(-Math.PI / 2);
export class Pickups {
  constructor(game) { this.game = game; this.list = []; }
  add(o) {
    const m = new THREE.Mesh(geo[o.type], mats[o.type]); m.position.set(o.x, (o.y || 0) + 0.6, o.z); m.castShadow = true; this.game.scene.add(m);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: o.type === 'token' ? 0xff4fa3 : o.type === 'cash' ? 0x7cff8a : 0xffffff, transparent: true, opacity: 0.55 })); ring.position.set(o.x, (o.y || 0) + 0.06, o.z); this.game.scene.add(ring);
    const p = { ...o, mesh: m, ring, t: Math.random() * 6, ttl: o.ttl ?? (o.type === 'cash' || o.type === 'ammo' ? 60 : Infinity) }; this.list.push(p); return p;
  }
  remove(p) { this.game.scene.remove(p.mesh); this.game.scene.remove(p.ring); this.list.splice(this.list.indexOf(p), 1); }
  update(dt) {
    const G = this.game, P = G.player;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.t += dt; p.ttl -= dt; p.mesh.rotation.y += dt * 2; p.mesh.position.y = (p.y || 0) + 0.6 + Math.sin(p.t * 3) * 0.12; if (p.ttl <= 0) { this.remove(p); continue; }
      if (P.dead) continue; const d = dist(p.x, p.z, P.x, P.z); if (d < 1.4 && Math.abs((p.y || 0) - P.y) < 2.5) { this.collect(p); }
    }
  }
  collect(p) {
    const G = this.game, P = G.player;
    if (p.type === 'cash') { G.addMoney(p.amount); G.audio.cash(); }
    else if (p.type === 'ammo') { P.giveAmmo(p.weapon, p.amount); G.audio.pickup(); }
    else if (p.type === 'health') { P.health = 100; G.audio.pickup(); G.hud.notify(T.healDone); }
    else if (p.type === 'armor') { P.armor = 100; G.audio.pickup(); }
    else if (p.type === 'weapon') { P.giveWeapon(p.weapon, p.amount || 30); G.audio.pickup(); G.hud.notify(T.weapon[p.weapon]); }
    else if (p.type === 'package') { G.audio.pickup(); }
    else if (p.type === 'token') { G.stats.tokens++; G.collected.add(p.id); G.addMoney(250); G.audio.cash(); G.hud.notify(`${T.collected} (${G.stats.tokens}/20)`); if (G.stats.tokens === 20) { G.hud.notify(T.collectedAll); G.addMoney(5000); } }
    p.onCollect?.(p); this.remove(p);
  }
}

// ---------------- thrown grenades ----------------
const _g = [];
export class Grenades {
  constructor(game) { this.game = game; this.list = []; this.geo = new THREE.SphereGeometry(0.14, 8, 6); this.mat = new THREE.MeshStandardMaterial({ color: 0x2f4a2a, roughness: 0.55, metalness: 0.35 }); }
  clear() { for (const g of this.list) this.game.scene.remove(g.mesh); this.list.length = 0; }
  throw(x, y, z, dx, dy, dz, speed, source = 'player') { const m = new THREE.Mesh(this.geo, this.mat); m.castShadow = true; m.position.set(x, y, z); this.game.scene.add(m); this.list.push({ x, y, z, vx: dx * speed, vy: dy * speed, vz: dz * speed, t: 2.4, mesh: m, source }); }
  update(dt) {
    const G = this.game;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const g = this.list[i]; g.t -= dt; g.vy -= 14 * dt; let nx = g.x + g.vx * dt, ny = g.y + g.vy * dt, nz = g.z + g.vz * dt, clank = 0; // clank = impact speed of the hardest bounce this frame
      if (ny < 0.14) { ny = 0.14; clank = Math.abs(g.vy); g.vy = -g.vy * 0.4; g.vx *= 0.75; g.vz *= 0.75; }
      const h = G.grid.circleHit(nx, nz, 0.16, _g); if (h) { nx += h.nx * h.depth; nz += h.nz * h.depth; const vn = g.vx * h.nx + g.vz * h.nz; if (vn < 0) { if (-vn > clank) clank = -vn; g.vx -= 1.6 * vn * h.nx; g.vz -= 1.6 * vn * h.nz; } }
      if (clank > 2) G.audio.clank(clank); // a resting grenade only creeps at ~0.2 m/s, so it never rattles
      g.x = nx; g.y = ny; g.z = nz; g.mesh.position.set(nx, ny, nz); g.mesh.rotation.x += dt * 8;
      if (g.t <= 0) { G.scene.remove(g.mesh); this.list.splice(i, 1); G.explode(g.x, Math.max(0.2, g.y - 0.2), g.z, g.source); }
    }
  }
}

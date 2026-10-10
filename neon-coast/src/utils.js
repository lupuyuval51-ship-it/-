import * as THREE from '../vendor/three.module.min.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const dist2 = (ax, az, bx, bz) => (ax - bx) ** 2 + (az - bz) ** 2;
export const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
export const wrapAngle = a => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
export const angleLerp = (a, b, t) => a + wrapAngle(b - a) * t;
export const fmtMoney = n => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Seeded RNG so the city looks the same each run.
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- Geometry building helpers ----------
export class GeoBuilder {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.col = []; this.hasColor = false; }
  quad(a, b, c, d, n, uvs, color) {
    // a,b,c,d counter-clockwise when viewed from the normal side
    const P = [a, b, c, a, c, d];
    const U = uvs ? [uvs[0], uvs[1], uvs[2], uvs[0], uvs[2], uvs[3]] : [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
    for (let i = 0; i < 6; i++) { this.pos.push(P[i][0], P[i][1], P[i][2]); this.nor.push(n[0], n[1], n[2]); this.uv.push(U[i][0], U[i][1]); if (color) { this.hasColor = true; this.col.push(color.r, color.g, color.b); } }
  }
  // axis-aligned box from min to max. uvScale: units per texture repeat for sides, roof uv region handled by caller via material groups
  box(x0, y0, z0, x1, y1, z1, opts = {}) {
    const su = opts.uvU || 1, sv = opts.uvV || 1, c = opts.color;
    const rep = (w, h) => [[0, 0], [w / su, 0], [w / su, h / sv], [0, h / sv]];
    if (opts.sides !== false) {
      this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], rep(z1 - z0, y1 - y0), c);
      this.quad([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [-1, 0, 0], rep(z1 - z0, y1 - y0), c);
      this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], rep(x1 - x0, y1 - y0), c);
      this.quad([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [0, 0, 1], rep(x1 - x0, y1 - y0), c);
    }
    if (opts.top !== false) this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], rep(x1 - x0, z1 - z0), c);
    if (opts.bottom) this.quad([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0], rep(x1 - x0, z1 - z0), c);
  }
  plane(x0, z0, x1, z1, y, uvScale = 1, color) {
    this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], [[0, 0], [(x1 - x0) / uvScale, 0], [(x1 - x0) / uvScale, (z1 - z0) / uvScale], [0, (z1 - z0) / uvScale]], color);
  }
  // rotated flat rectangle on the ground (for road markings) – cx,cz centre, len along dir angle, wid across
  strip(cx, cz, angle, len, wid, y, color) {
    const c = Math.cos(angle), s = Math.sin(angle), fx = c * len / 2, fz = -s * len / 2, rx = s * wid / 2, rz = c * wid / 2;
    this.quad([cx - fx - rx, y, cz - fz - rz], [cx + fx - rx, y, cz + fz - rz], [cx + fx + rx, y, cz + fz + rz], [cx - fx + rx, y, cz - fz + rz], [0, 1, 0], null, color);
  }
  tri(a, b, c, n = [0, 1, 0], color) { for (const P of [a, b, c]) { this.pos.push(P[0], P[1], P[2]); this.nor.push(n[0], n[1], n[2]); this.uv.push(0, 0); if (color) { this.hasColor = true; this.col.push(color.r, color.g, color.b); } } }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.hasColor) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
  get count() { return this.pos.length / 3; }
}

export function mergeGeometries(geos) {
  let total = 0; for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  const hasColor = geos.every(g => g.attributes.color); const col = hasColor ? new Float32Array(total * 3) : null;
  let o = 0;
  for (const g of geos) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    if (col) col.set(g.attributes.color.array, o * 3);
    o += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

// Non-indexed transformed copy of a geometry with optional flat vertex colour
export function xform(geo, m, color) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(m);
  if (color) { const n = g.attributes.position.count, arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) { arr[i * 3] = color.r; arr[i * 3 + 1] = color.g; arr[i * 3 + 2] = color.b; } g.setAttribute('color', new THREE.BufferAttribute(arr, 3)); }
  return g;
}
export const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

// ---------- Spatial hash for static AABB colliders ----------
export class StaticGrid {
  constructor(cell = 24) { this.cell = cell; this.map = new Map(); this.boxes = []; }
  key(cx, cz) { return cx * 100003 + cz; }
  add(box) { // {x0,z0,x1,z1,y1,type}
    this.boxes.push(box);
    const c = this.cell;
    for (let cx = Math.floor(box.x0 / c); cx <= Math.floor(box.x1 / c); cx++) for (let cz = Math.floor(box.z0 / c); cz <= Math.floor(box.z1 / c); cz++) {
      const k = this.key(cx, cz); let arr = this.map.get(k); if (!arr) { arr = []; this.map.set(k, arr); } arr.push(box);
    }
  }
  query(x, z, r, out = []) {
    out.length = 0; const c = this.cell;
    for (let cx = Math.floor((x - r) / c); cx <= Math.floor((x + r) / c); cx++) for (let cz = Math.floor((z - r) / c); cz <= Math.floor((z + r) / c); cz++) {
      const arr = this.map.get(this.key(cx, cz)); if (arr) for (const b of arr) if (!out.includes(b)) out.push(b);
    }
    return out;
  }
  // circle vs boxes: returns {nx,nz,depth} of the deepest penetration, or null
  circleHit(x, z, r, tmp = []) {
    const list = this.query(x, z, r, tmp); let best = null;
    for (const b of list) {
      if (b.y0 > 3.2) continue; // overhead boxes (blade signs) stop bullets and the camera ray, but people and cars pass under them
      const px = clamp(x, b.x0, b.x1), pz = clamp(z, b.z0, b.z1);
      let dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
      if (d < r) {
        let nx, nz, depth;
        if (d > 1e-4) { nx = dx / d; nz = dz / d; depth = r - d; }
        else { // centre inside the box – push out through nearest face
          const l = x - b.x0, rr = b.x1 - x, t = z - b.z0, bb = b.z1 - z; const m = Math.min(l, rr, t, bb);
          if (m === l) { nx = -1; nz = 0; } else if (m === rr) { nx = 1; nz = 0; } else if (m === t) { nx = 0; nz = -1; } else { nx = 0; nz = 1; }
          depth = m + r;
        }
        if (!best || depth > best.depth) best = { nx, nz, depth, box: b };
      }
    }
    return best;
  }
  // ray (xz plane, from origin along dir, up to maxT). returns nearest t or Infinity
  raycast(ox, oy, oz, dx, dy, dz, maxT) {
    let bestT = maxT; const c = this.cell; const steps = Math.ceil(maxT / c) + 1; const seen = new Set();
    for (let i = 0; i <= steps; i++) {
      const t = Math.min(maxT, i * c), x = ox + dx * t, z = oz + dz * t;
      for (let cx = Math.floor(x / c) - 1; cx <= Math.floor(x / c) + 1; cx++) for (let cz = Math.floor(z / c) - 1; cz <= Math.floor(z / c) + 1; cz++) {
        const arr = this.map.get(this.key(cx, cz)); if (!arr) continue;
        for (const b of arr) {
          if (seen.has(b)) continue; seen.add(b);
          const t0 = rayBox(ox, oy, oz, dx, dy, dz, b);
          if (t0 !== null && t0 < bestT) bestT = t0;
        }
      }
      if (bestT < t) break;
    }
    return bestT;
  }
}
export function rayBox(ox, oy, oz, dx, dy, dz, b) {
  let tmin = 0, tmax = Infinity;
  const axes = [[ox, dx, b.x0, b.x1], [oy, dy, b.y0 ?? -1, b.y1 ?? 100], [oz, dz, b.z0, b.z1]];
  for (const [o, d, lo, hi] of axes) {
    if (Math.abs(d) < 1e-8) { if (o < lo || o > hi) return null; continue; }
    let t1 = (lo - o) / d, t2 = (hi - o) / d; if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return null;
  }
  return tmin;
}
// Frees the GPU geometry of a per-instance object tree (characters build their own geometry).
export function disposeGeometries(obj) { obj.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
export function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r) {
  const lx = cx - ox, ly = cy - oy, lz = cz - oz; const tca = lx * dx + ly * dy + lz * dz; if (tca < 0) return null;
  const d2 = lx * lx + ly * ly + lz * lz - tca * tca; if (d2 > r * r) return null; return tca - Math.sqrt(r * r - d2);
}

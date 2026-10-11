import * as THREE from '../vendor/three.module.min.js';
import { CITY } from './config.js';
import { mulberry, clamp, lerp } from './utils.js';
import { FACADES, detailAtlas, ATLAS } from './textures.js';

// ======================================================================================
// Buildings (release 3): silhouettes, roofs, facade relief, distant skyline.
//  - plan(): picks an archetype per lot (box, stepped, podium + tower, chamfered, L, U-court, tapered crown, parking structure) from the district and the lot size.
//  - emit(): the walls go into the facade builders of world.js (same UV rules as GeoBuilder.box: u = distance from the end of the edge / 8, v = y / 14, so the
//    per-window night shader keeps working), roof surfaces into the roof builder, solid masses into the collision grid.
//  - decorate(): everything small is merged into per-chunk meshes that share ONE material (detail atlas + vertex colours + night glow): `far` (roof clutter, shutters,
//    crowns; drawn up to ~260 m), `rel` (fins, ledges, pilasters, cornices, balconies, canopies; ~150 m) and `fine` (fire escapes, AC units, plants, graffiti; ~62 m).
//  - Far skyline: one fogged ring of silhouettes beyond the city, one draw call, own haze so it survives the scene fog.
// Collision: every solid that can be reached has a grid box; anything that overhangs a walkway starts above 3.3 m (the grid ignores those for movement).
// ======================================================================================
const FLOOR = 3.5, SIDEW = CITY.sidewalk, PITCH = CITY.pitch, TAU = Math.PI * 2;
const _col = new Map();
const K = hex => { let c = _col.get(hex); if (!c) _col.set(hex, c = new THREE.Color(hex)); return c; };
const mixc = (a, b, t) => K(a).clone().lerp(K(b), t);
const PAL = { // trim colours per facade id: trim (ledges, cornices), fin (pilasters, fins), cap (parapet, crown), accent (neon lines)
  glass: { trim: 0x1a2232, fin: 0x2c3850, cap: 0x12161e, accent: 0x3ce8f5, look: 'glass' }, tower: { trim: 0x0f131c, fin: 0x1e2638, cap: 0x0b0e15, accent: 0xff4fa3, look: 'glass' },
  deco: { trim: 0xf6ead8, fin: 0xe9d3bd, cap: 0xd7b79e, accent: 0xff9ad5, look: 'deco' }, mint: { trim: 0xf2fffa, fin: 0xb8e2d2, cap: 0x8fc9b6, accent: 0x3ce8f5, look: 'deco' },
  pink: { trim: 0xfff5f7, fin: 0xeaadbf, cap: 0xd98aa2, accent: 0xffd34e, look: 'deco' }, white: { trim: 0xf1efe8, fin: 0xd8d4c8, cap: 0xbab5a8, accent: 0xff5a5a, look: 'deco' },
  concrete: { trim: 0xb2aea8, fin: 0x908c87, cap: 0x7a7773, accent: 0xffb347, look: 'conc' }, brick: { trim: 0xd2c4ae, fin: 0xb59f86, cap: 0x8f7d6a, accent: 0xffcf80, look: 'brick' },
};
const STYLE_POOL = { downtown: [['glass', 4], ['tower', 3], ['white', 2], ['concrete', 1], ['deco', 1]], beach: [['deco', 3], ['mint', 3], ['pink', 3], ['white', 2]], old: [['brick', 6], ['concrete', 1], ['deco', 1], ['mint', 1]], industrial: [['concrete', 5], ['brick', 3], ['white', 1]] };
const wpick = (list, r) => { let t = 0; for (const e of list) t += e[1]; let x = r * t; for (const e of list) { x -= e[1]; if (x <= 0) return e[0]; } return list[0][0]; };

// ---------- detail geometry builder (typed arrays, grows on demand) ----------
// Quads are wound automatically so that they face along the normal given, which removes a whole class of winding mistakes.
class DB {
  constructor() { this.cap = 1536; this.n = 0; this.P = new Float32Array(this.cap * 3); this.N = new Float32Array(this.cap * 3); this.U = new Float32Array(this.cap * 2); this.C = new Float32Array(this.cap * 3); this.G = new Float32Array(this.cap); }
  grow() { const c = this.cap * 2, g = (a, k) => { const b = new Float32Array(c * k); b.set(a); return b; }; this.P = g(this.P, 3); this.N = g(this.N, 3); this.U = g(this.U, 2); this.C = g(this.C, 3); this.G = g(this.G, 1); this.cap = c; }
  v(p, n, u, w, c, gl) { if (this.n >= this.cap) this.grow(); const i = this.n++; this.P[i * 3] = p[0]; this.P[i * 3 + 1] = p[1]; this.P[i * 3 + 2] = p[2]; this.N[i * 3] = n[0]; this.N[i * 3 + 1] = n[1]; this.N[i * 3 + 2] = n[2]; this.U[i * 2] = u; this.U[i * 2 + 1] = w; this.C[i * 3] = c.r; this.C[i * 3 + 1] = c.g; this.C[i * 3 + 2] = c.b; this.G[i] = gl; }
  // a, b, c, d: corners (a bottom-left, b bottom-right, c top-right, d top-left of the picture rc = [u0, v0, u1, v1])
  quad(a, b, c, d, n, rc, col, gl = 0) {
    const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2], e2x = c[0] - a[0], e2y = c[1] - a[1], e2z = c[2] - a[2];
    const cx = e1y * e2z - e1z * e2y, cy = e1z * e2x - e1x * e2z, cz = e1x * e2y - e1y * e2x; if (cx * cx + cy * cy + cz * cz < 1e-10) return;
    const fl = cx * n[0] + cy * n[1] + cz * n[2] < 0, [u0, v0, u1, v1] = rc; const A = [a, u0, v0], B = [b, u1, v0], C = [c, u1, v1], D = [d, u0, v1];
    const o = fl ? [A, D, C, B] : [A, B, C, D]; for (const i of [0, 1, 2, 0, 2, 3]) this.v(o[i][0], n, o[i][1], o[i][2], col, gl);
  }
  tri(a, b, c, n, rc, col, gl = 0) {
    const cx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), cy = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), cz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const o = cx * n[0] + cy * n[1] + cz * n[2] < 0 ? [a, c, b] : [a, b, c], uu = [rc[0], rc[2], (rc[0] + rc[2]) / 2], vv = [rc[1], rc[1], rc[3]]; for (let i = 0; i < 3; i++) this.v(o[i], n, uu[i], vv[i], col, gl);
  }
  // axis-aligned box; f = bit mask of faces: 1 +x, 2 -x, 4 -z, 8 +z, 16 top, 32 bottom
  box(x0, y0, z0, x1, y1, z1, col, rc = ATLAS.solid, gl = 0, f = 31) {
    if (f & 1) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], rc, col, gl);
    if (f & 2) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], rc, col, gl);
    if (f & 4) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], rc, col, gl);
    if (f & 8) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], rc, col, gl);
    if (f & 16) this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], rc, col, gl);
    if (f & 32) this.quad([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0], rc, col, gl);
  }
  // box with local axes a = (ax, az) and b = (-az, ax); half sizes ha, hb; f: 1 +a, 2 -a, 4 +b, 8 -b, 16 top, 32 bottom
  obox(cx, cz, ax, az, ha, hb, y0, y1, col, rc = ATLAS.solid, gl = 0, f = 31) {
    const bx = -az, bz = ax, p = (i, j) => [cx + ax * ha * i + bx * hb * j, cz + az * ha * i + bz * hb * j], Y = (q, y) => [q[0], y, q[1]];
    const side = (q0, q1, n) => this.quad(Y(q0, y0), Y(q1, y0), Y(q1, y1), Y(q0, y1), n, rc, col, gl);
    if (f & 1) side(p(1, -1), p(1, 1), [ax, 0, az]); if (f & 2) side(p(-1, 1), p(-1, -1), [-ax, 0, -az]); if (f & 4) side(p(1, 1), p(-1, 1), [bx, 0, bz]); if (f & 8) side(p(-1, -1), p(1, -1), [-bx, 0, -bz]);
    if (f & 16) this.quad(Y(p(-1, -1), y1), Y(p(-1, 1), y1), Y(p(1, 1), y1), Y(p(1, -1), y1), [0, 1, 0], rc, col, gl); if (f & 32) this.quad(Y(p(-1, -1), y0), Y(p(1, -1), y0), Y(p(1, 1), y0), Y(p(-1, 1), y0), [0, -1, 0], rc, col, gl);
  }
  // (truncated) cone / cylinder with smooth normals; caps: top disc
  cyl(cx, cz, r0, r1, y0, y1, seg, col, rc = ATLAS.solid, gl = 0, caps = false) {
    const sl = (r0 - r1) / Math.max(1e-3, y1 - y0), il = 1 / Math.hypot(1, sl), uu = [rc[0], rc[2], (rc[0] + rc[2]) / 2], vv = [rc[1], rc[3]];
    for (let k = 0; k < seg; k++) {
      const a0 = k / seg * TAU, a1 = (k + 1) / seg * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const P = [[cx + c0 * r0, y0, cz + s0 * r0], [cx + c1 * r0, y0, cz + s1 * r0], [cx + c1 * r1, y1, cz + s1 * r1], [cx + c0 * r1, y1, cz + s0 * r1]], N = [[c0 * il, sl * il, s0 * il], [c1 * il, sl * il, s1 * il], [c1 * il, sl * il, s1 * il], [c0 * il, sl * il, s0 * il]];
      const ex = (P[1][1] - P[0][1]) * (P[2][2] - P[0][2]) - (P[1][2] - P[0][2]) * (P[2][1] - P[0][1]), ey = (P[1][2] - P[0][2]) * (P[2][0] - P[0][0]) - (P[1][0] - P[0][0]) * (P[2][2] - P[0][2]), ez = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[0][0]);
      const fl = ex * (N[0][0] + N[1][0]) + ey * (N[0][1] + N[1][1]) + ez * (N[0][2] + N[1][2]) < 0, o = fl ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3];
      for (const i of o) this.v(P[i], N[i], uu[i === 1 || i === 2 ? 1 : 0], vv[i > 1 ? 1 : 0], col, gl);
      if (caps && r1 > 1e-3) this.tri([cx, y1, cz], [cx + c0 * r1, y1, cz + s0 * r1], [cx + c1 * r1, y1, cz + s1 * r1], [0, 1, 0], rc, col, gl);
    }
  }
  // flat convex polygon facing up (or down with ny = -1)
  poly(pts, y, col, rc = ATLAS.solid, gl = 0, ny = 1) { for (let i = 1; i < pts.length - 1; i++) this.tri([pts[0][0], y, pts[0][1]], [pts[i][0], y, pts[i][1]], [pts[i + 1][0], y, pts[i + 1][1]], [0, ny, 0], rc, col, gl); }
  build() {
    const g = new THREE.BufferGeometry(), n = this.n; g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(this.N.slice(0, n * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(this.U.slice(0, n * 2), 2)); g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, n * 3), 3)); g.setAttribute('aGlow', new THREE.BufferAttribute(this.G.slice(0, n), 1));
    g.computeBoundingSphere(); g.computeBoundingBox(); return g;
  }
}

// ---------- footprints ----------
// A footprint is { loops (outer CCW, holes CW, seen with x to the right and z up: the material is on the left of every directed edge, so the outward normal is
// (dz, -dx)), roofs (convex polygons), boxes (solid masses [x0,z0,x1,z1]), bb, spans: straight stretches of the outer wall per side [a0, a1, face] }.
function mkFp(loops, roofs, boxes, spans, bb) { return { loops, roofs, boxes, spans, bb }; }
const rectPts = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const rectFp = (x0, z0, x1, z1) => mkFp([rectPts(x0, z0, x1, z1)], [rectPts(x0, z0, x1, z1)], [[x0, z0, x1, z1]], { S: [x0, x1, z0], N: [x0, x1, z1], W: [z0, z1, x0], E: [z0, z1, x1] }, [x0, z0, x1, z1]);
function chamferFp(x0, z0, x1, z1, c) { // c = cuts at [SW, SE, NE, NW]; the collision is a stack of slabs that follows the diagonals within about 0.2 m
  const [a, b, d, e] = c, pts = [];
  if (a) pts.push([x0, z0 + a], [x0 + a, z0]); else pts.push([x0, z0]); if (b) pts.push([x1 - b, z0], [x1, z0 + b]); else pts.push([x1, z0]);
  if (d) pts.push([x1, z1 - d], [x1 - d, z1]); else pts.push([x1, z1]); if (e) pts.push([x0 + e, z1], [x0, z1 - e]); else pts.push([x0, z1]);
  const lo = Math.max(a, b), hi = Math.max(d, e), zs = [z0]; for (let z = z0 + 0.8; z < z0 + lo - 0.01; z += 0.8) zs.push(z); zs.push(z0 + lo, z1 - hi); for (let z = z1 - hi + 0.8; z < z1 - 0.01; z += 0.8) zs.push(z); zs.push(z1);
  zs.sort((p, q) => p - q); const boxes = [];
  for (let i = 0; i + 1 < zs.length; i++) { const za = zs[i], zb = zs[i + 1]; if (zb - za < 1e-3) continue; const zm = (za + zb) / 2, xa = x0 + Math.max(0, a - (zm - z0), e - (z1 - zm)), xb = x1 - Math.max(0, b - (zm - z0), d - (z1 - zm)), L = boxes[boxes.length - 1]; if (L && Math.abs(L[0] - xa) < 1e-6 && Math.abs(L[2] - xb) < 1e-6) L[3] = zb; else boxes.push([xa, za, xb, zb]); }
  return mkFp([pts], [pts], boxes, { S: [x0 + a, x1 - b, z0], N: [x0 + e, x1 - d, z1], W: [z0 + a, z1 - e, x0], E: [z0 + b, z1 - d, x1] }, [x0, z0, x1, z1]);
}
function lFp(x0, z0, x1, z1, k, nw, nd) { // rectangle with the corner k ('SW' 'SE' 'NE' 'NW') cut away
  const P = { SW: [[x0, z0 + nd], [x0 + nw, z0 + nd], [x0 + nw, z0]], SE: [[x1 - nw, z0], [x1 - nw, z0 + nd], [x1, z0 + nd]], NE: [[x1, z1 - nd], [x1 - nw, z1 - nd], [x1 - nw, z1]], NW: [[x0 + nw, z1], [x0 + nw, z1 - nd], [x0, z1 - nd]] }, pts = [];
  for (const [key, cor] of [['SW', [x0, z0]], ['SE', [x1, z0]], ['NE', [x1, z1]], ['NW', [x0, z1]]]) { if (key === k) pts.push(...P[key]); else pts.push(cor); }
  const R = { NE: [[x0, z0, x1, z1 - nd], [x0, z1 - nd, x1 - nw, z1]], NW: [[x0, z0, x1, z1 - nd], [x0 + nw, z1 - nd, x1, z1]], SE: [[x0, z0 + nd, x1, z1], [x0, z0, x1 - nw, z0 + nd]], SW: [[x0, z0 + nd, x1, z1], [x0 + nw, z0, x1, z0 + nd]] }[k];
  const sp = { S: [x0, x1, z0], N: [x0, x1, z1], W: [z0, z1, x0], E: [z0, z1, x1] };
  if (k === 'NE') { sp.N = [x0, x1 - nw, z1]; sp.E = [z0, z1 - nd, x1]; } else if (k === 'NW') { sp.N = [x0 + nw, x1, z1]; sp.W = [z0, z1 - nd, x0]; } else if (k === 'SE') { sp.S = [x0, x1 - nw, z0]; sp.E = [z0 + nd, z1, x1]; } else { sp.S = [x0 + nw, x1, z0]; sp.W = [z0 + nd, z1, x0]; }
  return mkFp([pts], R.map(r => rectPts(...r)), R, sp, [x0, z0, x1, z1]);
}
function uFp(x0, z0, x1, z1, open, ww, wd) { // U-shaped block around a courtyard that is open towards `open` ('S' 'N' 'W' 'E'); ww = wing width, wd = back wing depth
  const Wd = open === 'S' || open === 'N' ? x1 - x0 : z1 - z0, Dp = open === 'S' || open === 'N' ? z1 - z0 : x1 - x0;
  const loc = [[0, 0], [ww, 0], [ww, Dp - wd], [Wd - ww, Dp - wd], [Wd - ww, 0], [Wd, 0], [Wd, Dp], [0, Dp]];
  const T = open === 'S' ? (u, v) => [x0 + u, z0 + v] : open === 'N' ? (u, v) => [x1 - u, z1 - v] : open === 'W' ? (u, v) => [x0 + v, z1 - u] : (u, v) => [x1 - v, z0 + u];
  const pts = loc.map(p => T(p[0], p[1])), rr = [[[0, 0], [ww, Dp]], [[Wd - ww, 0], [Wd, Dp]], [[ww, Dp - wd], [Wd - ww, Dp]]].map(([a, b]) => { const p = T(a[0], a[1]), q = T(b[0], b[1]); return [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])]; });
  const sp = { S: [x0, x1, z0], N: [x0, x1, z1], W: [z0, z1, x0], E: [z0, z1, x1] }; // the open side has two short wing faces: signs keep to the first wing
  sp[open] = open === 'S' ? [x0, x0 + ww, z0] : open === 'N' ? [x1 - ww, x1, z1] : open === 'W' ? [z1 - ww, z1, x0] : [z0, z0 + ww, x1];
  return mkFp([pts], rr.map(r => rectPts(...r)), rr, sp, [x0, z0, x1, z1]);
}
const inPoly = (poly, x, z, m = 0) => { for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz) || 1; if ((dx * (z - p[1]) - dz * (x - p[0])) / L < m) return false; } return true; }; // convex CCW polygon: every point must be on the left of every edge by margin m
const inFp = (fp, x, z, m = 0) => fp.roofs.some(p => inPoly(p, x, z, m));

// outline edge frame: P -> Q, unit tangent t, outward normal n = (tz, -tx); `us` of a point at distance s from P is L - s (the facade u runs from Q)
function edgesOf(fp) { const out = []; fp.loops.forEach((loop, li) => { for (let i = 0; i < loop.length; i++) { const P = loop[i], Q = loop[(i + 1) % loop.length], dx = Q[0] - P[0], dz = Q[1] - P[1], L = Math.hypot(dx, dz); if (L < 0.4) continue; out.push({ li, i, P, Q, L, tx: dx / L, tz: dz / L, nx: dz / L, nz: -dx / L, occ: [] }); } }); return out; }

const SIDE_OF = e => Math.abs(e.tz) < 1e-6 ? (e.nz < 0 ? 'S' : 'N') : Math.abs(e.tx) < 1e-6 ? (e.nx < 0 ? 'W' : 'E') : null;
// roof surface (roof texture, world uv / 4 m) as a fan of up-facing triangles in a GeoBuilder
function roofFan(g, poly, y) { for (let i = 1; i < poly.length - 1; i++) { let a = poly[0], b = poly[i], c = poly[i + 1]; if ((b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]) < 0) { const t = b; b = c; c = t; } for (const p of [a, b, c]) { g.pos.push(p[0], y, p[1]); g.nor.push(0, 1, 0); g.uv.push(p[0] / 4, p[1] / 4); } } }
// a sloped or vertical quad with its normal worked out and flipped to face `up` (+1 outward/up); uv = world metres / 4
function roofQuad(g, a, b, c, d, wantN) {
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
  const fl = n[0] * wantN[0] + n[1] * wantN[1] + n[2] * wantN[2] < 0; if (fl) n = n.map(v => -v); const o = fl ? [a, d, c, b] : [a, b, c, d];
  for (const i of [0, 1, 2, 0, 2, 3]) { const p = o[i]; g.pos.push(p[0], p[1], p[2]); g.nor.push(n[0], n[1], n[2]); g.uv.push((p[0] + p[2]) / 4, p[1] / 4); }
}
function roofTri(g, a, b, c, wantN) { const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(...n) || 1; n = n.map(v => v / l); const fl = n[0] * wantN[0] + n[1] * wantN[1] + n[2] * wantN[2] < 0; if (fl) n = n.map(v => -v); const o = fl ? [a, c, b] : [a, b, c]; for (const p of o) { g.pos.push(p[0], p[1], p[2]); g.nor.push(n[0], n[1], n[2]); g.uv.push((p[0] + p[2]) / 4, p[1] / 4); } }

const S_ = ATLAS.solid, PL = ATLAS.plaster, CO = ATLAS.concrete, ME = ATLAS.metal;

// ---------- the Buildings system ----------
const SIDES = ['S', 'N', 'W', 'E'];
const DIST = { high: { far: 185, rel: 120, fine: 56 }, med: { far: 150, rel: 90, fine: 42 }, low: { far: 130, rel: 0, fine: 0 } }; // draw distance (m) of the chunk tiers per quality tier
const area = fp => fp.roofs.reduce((s, p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return s + Math.abs(a) / 2; }, 0);
export class Buildings {
  constructor(world) {
    this.w = world; this.q = world.quality; this.recs = []; this.chunks = new Map(); this.sil = new DB(); this.beacons = []; this.recent = []; this.meshes = []; this.relBuilt = false; this.relOn = this.q !== 'low'; this.hooked = false; this.cam = new THREE.Vector3(1e6, 0, 1e6);
    this.U = { night: { value: 0 }, time: { value: 0 } }; this.mat = null; this.far = null; this.garages = 0; this.markers = []; // markers of the points of interest (world.js), posts keep 2.2 m off them
  }
  // ---- district and style ----
  district(bi, bj, d) { if (bi >= CITY.gridX - 3) return 'beach'; if (d < 0.36) return 'downtown'; if (bi <= 2 && bj <= 3) return 'old'; if (bi <= 3 && bj >= 4) return 'industrial'; return 'mixed'; }
  pickStyle(dist, style, bi, bj, r, c) { const pool = STYLE_POOL[dist]; if (!pool) return style; const rr = mulberry(bi * 7919 + bj * 104729 + r * 31 + c * 7 + 17); return FACADES.find(f => f.id === wpick(pool, rr())) || style; }
  // ---- chunks ----
  dbAt(tier, x, z) { const size = tier === 'far' ? PITCH * 2 : PITCH, ix = Math.floor((x - CITY.minX) / size), iz = Math.floor((z - CITY.minZ) / size), key = tier + ':' + ix + ',' + iz; let c = this.chunks.get(key); if (!c) this.chunks.set(key, c = { tier, db: new DB(), mesh: null }); return c.db; }
  // ---- planning: one record per building ----
  plan(o) {
    const rec = { ...o, W: o.x1 - o.x0, D: o.z1 - o.z0, F: o.floors, pal: PAL[o.style.id], look: PAL[o.style.id].look, rng: mulberry(o.bi * 1009 + o.bj * 9176 + o.r * 313 + o.c * 71 + 5), parts: [], occ: [], beacons: [], items: [] };
    rec.street = { S: o.r === 0, N: o.r === o.rows - 1, W: o.c === 0, E: o.c === o.cols - 1 }; rec.cx = (o.x0 + o.x1) / 2; rec.cz = (o.z0 + o.z1) / 2; rec.id = this.recs.length;
    this.makeParts(rec); this.recs.push(rec); return rec;
  }
  pickArch(rec) {
    const { W, D, F, dist } = rec, big = W >= 22 && D >= 22, med = W >= 15 && D >= 15, c = [], R = rec.rng, bad = this.recent.slice(-3);
    const add = (n, w) => { if (w > 0 && !bad.includes(n)) c.push([n, w]); };
    if (dist === 'downtown') { if (F >= 24) { add('tapered', 3); add('step', 4); add('podium', 4); add('box', 2); } else if (F >= 12) { add('podium', 4); add('step', 3); add('chamfer', 3); add('box', 2); med && add('L', 2); add('tapered', 1); } else { add('chamfer', 3); med && add('L', 3); add('box', 3); F >= 6 && add('podium', 2); big && add('court', 2); } }
    else if (dist === 'beach') { F >= 5 ? add('step', 5) : add('box', 3); add('chamfer', 4); med && add('L', 2); big && add('court', 2); add('box', 2); }
    else if (dist === 'old') { add('box', 5); add('chamfer', 2); med && add('L', 2); big && add('court', 3); F >= 7 && add('step', 2); }
    else if (dist === 'industrial') { add('box', 5); med && add('L', 3); big && add('court', 1); add('chamfer', 1); }
    else { add('box', 3); add('chamfer', 3); F >= 8 && add('step', 3); F >= 10 && add('podium', 3); med && F <= 26 && add('L', 2); big && F <= 9 && add('court', 2); F >= 14 && add('tapered', 2); }
    if (!c.length) c.push(['box', 1]); const a = wpick(c, R()); this.recent.push(a); if (this.recent.length > 8) this.recent.shift(); return a;
  }
  makeParts(rec) {
    const { x0, z0, x1, z1, W, D, F, dist, look, poi } = rec, R = rec.rng, parts = rec.parts, R4 = () => 2 + R() * 2.5;
    const sd = k => new THREE.Color((rec.seed.r + 0.137 * k) % 1, rec.seed.g, rec.seed.b);
    const add = (fp, f0, f1, roof, k = 0, extra) => { const p = { fp, y0: f0 * FLOOR, y1: f1 * FLOOR, f0, f1, roof, seed: k ? sd(k) : rec.seed, ...extra }; parts.push(p); return p; };
    const inset = (r, iS, iN, iW, iE) => [r[0] + iW, r[1] + iS, r[2] - iE, r[3] - iN];
    let arch = poi ? 'poi' : this.pickArch(rec);
    if ((arch === 'step' && F < 6) || (arch === 'podium' && F < 8) || (arch === 'tapered' && F < 14) || (arch === 'court' && (F > 9 || W < 22 || D < 22)) || (arch === 'L' && (W < 15 || D < 15))) arch = 'box';
    rec.arch = arch; const R0 = [x0, z0, x1, z1], mn = Math.min(W, D);
    if (arch === 'poi' || arch === 'box') {
      let roof = 'flat'; if (!poi) { if ((look === 'brick' || (dist === 'old' && look === 'deco')) && F <= 6 && W >= 12 && D >= 12 && R() < 0.7) roof = 'hip'; else if (F >= 4 && F <= 9 && mn >= 13 && (dist === 'old' || look === 'deco') && R() < 0.4) roof = 'mansard'; else if (dist === 'industrial' && F <= 5 && W >= 14 && D >= 14 && R() < 0.85) roof = 'saw'; }
      add(rectFp(x0, z0, x1, z1), 0, F, roof, 0, poi ? { poi: true } : null);
      if (poi) { // points of interest keep their exact box (shops.js owns the walls and the ground floor); a crown is added on top
        if (F >= 6 && mn >= 18 && poi.type !== 'hospital' && poi.type !== 'police') { const r1 = inset(R0, 3, 3, 3.5, 3.5); add(rectFp(...r1), F, F + 2, 'flat', 1); const r2 = inset(r1, 2, 2, 2.5, 2.5); add(rectFp(...r2), F + 2, F + 4, 'pyramid', 2); }
        else if (F >= 6 && F <= 9 && poi.type === 'hospital') rec.helipad = true;
        else if (poi.type === 'hospital') rec.helipad = true;
      } else if (F >= 16 && mn >= 14 && R() < 0.65) { const r1 = inset(R0, R4(), R4(), R4(), R4()); add(rectFp(...r1), F, F + 2 + Math.floor(R() * 3), 'flat', 1); }
    } else if (arch === 'step') {
      const n = F >= 22 ? 3 : (dist === 'beach' && F >= 7 ? 3 : 2), fr = n === 3 ? [0.5, 0.78, 1] : [0.62, 1], deco = dist === 'beach' || look === 'deco', big = deco ? 1.5 : 2.4; let r = R0, f0 = 0;
      for (let k = 0; k < n; k++) {
        const f1 = k === n - 1 ? F : Math.max(f0 + 2, Math.round(F * fr[k])); let fp = rectFp(...r);
        if (k === 0 && deco && R() < 0.5 && Math.min(r[2] - r[0], r[3] - r[1]) > 16) { const c = clamp(2.5 + R() * 1.5, 2, 4.5); fp = chamferFp(...r, [R() < 0.7 ? c : 0, R() < 0.7 ? c : 0, R() < 0.7 ? c : 0, R() < 0.7 ? c : 0]); }
        add(fp, f0, f1, 'flat', k); if (k === n - 1) break;
        const wd = r[2] - r[0], dp = r[3] - r[1], m = deco ? 1.6 + R() * 1.2 : big + R() * 2.2, ins = [R() < 0.85 ? m : 0, R() < 0.6 ? m : 0, R() < 0.8 ? m : 0, R() < 0.8 ? m : 0]; if (ins.reduce((s, v) => s + (v > 0), 0) < 2) { ins[0] = m; ins[2] = m; }
        const nw = wd - ins[2] - ins[3], nd = dp - ins[0] - ins[1]; if (nw < 8 || nd < 8) { ins.fill(Math.max(0, Math.min(m, (Math.min(wd, dp) - 9) / 2))); } r = inset(r, ...ins); f0 = f1;
      }
    } else if (arch === 'podium') {
      const hp = clamp(Math.round(2 + R() * 2), 2, 4), p0 = add(rectFp(...R0), 0, hp, 'flat', 0); p0.terrace = true;
      let iS = 3 + R() * 5, iN = R() < 0.45 ? 0 : 2 + R() * 4, iW = 2 + R() * 6, iE = 2 + R() * 6; if (W - iW - iE < 11) { iW = iE = Math.max(1.5, (W - 11) / 2); } if (D - iS - iN < 11) { iS = Math.max(2, (D - 11) / 2 + (iN ? 0 : 0)); iN = 0; }
      const r1 = inset(R0, iS, iN, iW, iE), top = Math.max(hp + 4, F), f1 = F > hp + 12 && R() < 0.55 ? hp + Math.round((F - hp) * 0.62) : top; add(rectFp(...r1), hp, f1, 'flat', 1);
      if (f1 < top) { const r2 = inset(r1, R4(), R4(), R4(), R4()); add(rectFp(...r2), f1, top, 'flat', 2); }
    } else if (arch === 'tapered') {
      const f1 = Math.round(F * 0.78), f2 = f1 + Math.max(3, Math.round(F * 0.1)), ins = clamp(mn * 0.2, 2.5, 5.5), r1 = inset(R0, ins, ins, ins, ins);
      add(rectFp(...R0), 0, f1, 'none', 0); add(rectFp(...R0), f1, f2, 'none', 1, { frustum: r1 }); add(rectFp(...r1), f2, F, R() < 0.5 ? 'pyramid' : 'flat', 2); rec.taperTop = true;
    } else if (arch === 'chamfer') {
      const st = rec.street, cc = [st.S && st.W, st.S && st.E, st.N && st.E, st.N && st.W], c = clamp(3 + R() * 3.2, 3, 0.22 * mn), cuts = cc.map(b => (b ? R() < 0.85 : R() < 0.12) ? c : 0);
      if (!cuts.some(v => v)) cuts[Math.floor(R() * 4)] = c; rec.cuts = cuts; add(chamferFp(x0, z0, x1, z1, cuts), 0, F, 'flat', 0);
      if (F >= 14 && mn >= 16 && R() < 0.5) { const r1 = inset(R0, R4() + 1, R4() + 1, R4() + 1, R4() + 1); add(rectFp(...r1), F, F + 2 + Math.floor(R() * 2), 'flat', 1); }
    } else if (arch === 'L') {
      const st = rec.street, cnt = { SW: st.S + st.W, SE: st.S + st.E, NE: st.N + st.E, NW: st.N + st.W }, ks = Object.keys(cnt).sort((a, b) => cnt[a] - cnt[b] || R() - 0.5), k = ks[0];
      add(lFp(x0, z0, x1, z1, k, W * (0.34 + R() * 0.1), D * (0.34 + R() * 0.1)), 0, F, 'flat', 0); rec.notch = k;
    } else if (arch === 'court') {
      const st = rec.street, opts = SIDES.filter(s => st[s]), open = opts.length ? opts[Math.floor(R() * opts.length)] : SIDES[Math.floor(R() * 4)], ww = 6.5 + R() * 1.5, wd = 7 + R() * 2;
      add(uFp(x0, z0, x1, z1, open, ww, wd), 0, F, 'flat', 0); rec.court = open;
    }
    const p0 = parts[0]; rec.fp0 = p0.fp; rec.hGround = p0.y1; rec.h = parts[parts.length - 1].y1; rec.top = parts[parts.length - 1];
    rec.front = {}; for (const s of SIDES) { const sp = p0.fp.spans[s]; rec.front[s] = { a0: sp[0], a1: sp[1], face: sp[2], hMax: p0.y1 }; }
  }
  // ---- emission into the world builders ----
  // fb: facade GeoBuilder of the style; roofB: roof GeoBuilder. Returns nothing; registers collision, contact shadow and world.buildings.
  emit(rec, fb, roofB) {
    const w = this.w, db = this.dbAt('far', rec.cx, rec.cz), pal = rec.pal, capC = K(pal.cap);
    rec.parts.forEach((p, pi) => {
      const fp = p.fp, noWalls = p.poi && pi === 0;
      if (!noWalls) { if (p.frustum) this.frustum(fb, fp.bb, p.frustum, p.y0, p.y1, p.seed); else this.walls(fb, fp, p.y0, p.y1, p.seed); }
      if (!noWalls) for (const b of fp.boxes) w.grid.add({ src: 'bld', x0: b[0], z0: b[1], x1: b[2], z1: b[3], y0: p.y0, y1: p.y1, type: 'building' });
      else if (p.poi) { /* shops.js added the boxes of the hollow ground floor and the solid mass above it */ }
      const y = p.y1, top = pi === rec.parts.length - 1;
      if (p.roof === 'flat') { for (const poly of fp.roofs) roofFan(roofB, poly, y + 0.3); this.parapet(db, fp, y, capC, rec); }
      else if (p.roof === 'hip') { const r = fp.bb, rise = clamp(Math.min(r[2] - r[0], r[3] - r[1]) * 0.27, 2.4, 4.6); this.hip(roofB, r, y, rise, 0.4); rec.hipTop = { r, y, rise }; }
      else if (p.roof === 'pyramid') { const r = fp.bb, rise = clamp(Math.min(r[2] - r[0], r[3] - r[1]) * 0.9, 3.5, 11); this.hip(roofB, r, y, rise, 0.25); rec.pyr = { r, y, rise }; }
      else if (p.roof === 'mansard') this.mansard(roofB, db, fp.bb, y, rec);
      else if (p.roof === 'saw') this.saw(roofB, db, fp.bb, y, rec);
      if (top) rec.topY = y + 0.3;
    });
    const p0 = rec.parts[0];
    for (const b of p0.fp.boxes) w.buildings.push({ x0: b[0], z0: b[1], x1: b[2], z1: b[3], h: p0.y1, rec });
    for (const e of edgesOf(p0.fp)) this.contact(e);
  }
  walls(fb, fp, y0, y1, seed) {
    const v0 = y0 / 14, v1 = y1 / 14;
    for (const loop of fp.loops) for (let i = 0; i < loop.length; i++) {
      const P = loop[i], Q = loop[(i + 1) % loop.length], dx = Q[0] - P[0], dz = Q[1] - P[1], L = Math.hypot(dx, dz); if (L < 0.05) continue;
      const n = [dz / L, 0, -dx / L], u = L / 8, A = [Q[0], y0, Q[1]], B = [P[0], y0, P[1]], C = [P[0], y1, P[1]], D = [Q[0], y1, Q[1]];
      fb.quad(A, B, C, D, n, [[0, v0], [u, v0], [u, v1], [0, v1]], seed);
    }
  }
  frustum(fb, r0, r1, y0, y1, seed) { // four sloped faces from the rectangle r0 at y0 to the smaller r1 at y1
    const [x0, z0, x1, z1] = r0, [a0, b0, a1, b1] = r1, v0 = y0 / 14, v1 = y1 / 14, H = y1 - y0;
    const face = (P0, Q0, P1, Q1, L0, ins, nx, nz, k) => { const s = ins / 8, u = L0 / 8; fb.quad([Q0[0], y0, Q0[1]], [P0[0], y0, P0[1]], [P1[0], y1, P1[1]], [Q1[0], y1, Q1[1]], [nx, k, nz], [[0, v0], [u, v0], [u - s, v1], [s, v1]], seed); };
    const iS = b0 - z0, iN = z1 - b1, iW = a0 - x0, iE = x1 - a1, nrm = (d, ins) => { const l = Math.hypot(1, ins / H); return [d / l, (ins / H) / l]; };
    let n = nrm(1, iS); face([x0, z0], [x1, z0], [a0, b0], [a1, b0], x1 - x0, (iW + iE) / 2, 0, -n[0], n[1]);
    n = nrm(1, iN); face([x1, z1], [x0, z1], [a1, b1], [a0, b1], x1 - x0, (iW + iE) / 2, 0, n[0], n[1]);
    n = nrm(1, iW); face([x0, z1], [x0, z0], [a0, b1], [a0, b0], z1 - z0, (iS + iN) / 2, -n[0], 0, n[1]);
    n = nrm(1, iE); face([x1, z0], [x1, z1], [a1, b0], [a1, b1], z1 - z0, (iS + iN) / 2, n[0], 0, n[1]);
  }
  parapet(db, fp, y, col, rec) { // 0.55 m parapet round every outline edge (also round courtyards and notches), 0.12 m proud of the wall
    let k = 0; for (const e of edgesOf(fp)) { const cx = (e.P[0] + e.Q[0]) / 2 - e.nx * 0.09, cz = (e.P[1] + e.Q[1]) / 2 - e.nz * 0.09; db.obox(cx, cz, e.tx, e.tz, e.L / 2 + 0.12, 0.21, y, y + 0.55 + (k++ % 2) * 0.004, col, CO, 0, 4 | 8 | 16); }
  }
  contact(e) { const w = this.w, y = 0.16, ww = 1.6, q = (a, b, c, d) => w.shadowB.quad(a, b, c, d, [0, 1, 0], [[1, 0], [1, 1], [0, 1], [0, 0]]); // soft dark strip on the pavement along a wall
    const P = e.P, Q = e.Q, o = ww; q([P[0], y, P[1]], [Q[0], y, Q[1]], [Q[0] + e.nx * o, y, Q[1] + e.nz * o], [P[0] + e.nx * o, y, P[1] + e.nz * o]); }
  // hip roof over the rectangle r: ridge along the longer side, eaves overhang o, soffit underneath
  hip(g, r, y, rise, o) {
    const [x0, z0, x1, z1] = r, W = x1 - x0, D = z1 - z0, xa = x0 - o, xb = x1 + o, za = z0 - o, zb = z1 + o, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, yt = y + rise;
    roofQuad(g, [xa, y - 0.02, za], [xb, y - 0.02, za], [xb, y - 0.02, zb], [xa, y - 0.02, zb], [0, -1, 0]);
    if (W >= D) { const r0 = x0 + D / 2, r1 = x1 - D / 2; roofQuad(g, [xa, y, za], [xb, y, za], [r1, yt, zc], [r0, yt, zc], [0, 0.6, -1]); roofQuad(g, [xb, y, zb], [xa, y, zb], [r0, yt, zc], [r1, yt, zc], [0, 0.6, 1]); roofTri(g, [xa, y, zb], [xa, y, za], [r0, yt, zc], [-1, 0.6, 0]); roofTri(g, [xb, y, za], [xb, y, zb], [r1, yt, zc], [1, 0.6, 0]); }
    else { const r0 = z0 + W / 2, r1 = z1 - W / 2; roofQuad(g, [xa, y, za], [xa, y, zb], [xc, yt, r1], [xc, yt, r0], [-1, 0.6, 0]); roofQuad(g, [xb, y, zb], [xb, y, za], [xc, yt, r0], [xc, yt, r1], [1, 0.6, 0]); roofTri(g, [xb, y, za], [xa, y, za], [xc, yt, r0], [0, 0.6, -1]); roofTri(g, [xa, y, zb], [xb, y, zb], [xc, yt, r1], [0, 0.6, 1]); }
  }
  // mansard: steep lower slope 1.9 m in over 2.6 m, flat top, lit dormer windows along the slope
  mansard(g, db, r, y, rec) {
    const [x0, z0, x1, z1] = r, I = 1.9, H = 2.6, y2 = y + H, R = rec.rng, slate = mixc(rec.pal.cap, 0x3a3f4a, 0.6);
    roofQuad(g, [x0, y, z0], [x1, y, z0], [x1 - I, y2, z0 + I], [x0 + I, y2, z0 + I], [0, 0.6, -1]); roofQuad(g, [x1, y, z1], [x0, y, z1], [x0 + I, y2, z1 - I], [x1 - I, y2, z1 - I], [0, 0.6, 1]);
    roofQuad(g, [x0, y, z1], [x0, y, z0], [x0 + I, y2, z0 + I], [x0 + I, y2, z1 - I], [-1, 0.6, 0]); roofQuad(g, [x1, y, z0], [x1, y, z1], [x1 - I, y2, z1 - I], [x1 - I, y2, z0 + I], [1, 0.6, 0]);
    roofFan(g, rectPts(x0 + I, z0 + I, x1 - I, z1 - I), y2 + 0.02); rec.mansard = { r, y, y2 };
    for (const e of edgesOf(rect_(r))) { // dormers
      const n = Math.floor((e.L - 3.5) / 3.4); for (let k = 0; k < n; k++) {
        const s = e.L / 2 + (k - (n - 1) / 2) * 3.4, px = e.P[0] + e.tx * s, pz = e.P[1] + e.tz * s, out = I * 0.28, cx = px - e.nx * out, cz = pz - e.nz * out, cy = y + H * 0.28;
        db.obox(cx, cz, e.tx, e.tz, 0.62, 0.5, cy, cy + 1.45, slate, CO, 0, 1 | 2 | 4 | 8 | 16);
        const fx = cx + e.nx * 0.51, fz = cz + e.nz * 0.51; db.quad([fx - e.tx * 0.4, cy + 0.2, fz - e.tz * 0.4], [fx + e.tx * 0.4, cy + 0.2, fz + e.tz * 0.4], [fx + e.tx * 0.4, cy + 1.25, fz + e.tz * 0.4], [fx - e.tx * 0.4, cy + 1.25, fz - e.tz * 0.4], [e.nx, 0, e.nz], S_, K(R() < 0.5 ? 0xffd9a0 : 0x3a4a66), 0.55);
        db.obox(cx, cz, e.tx, e.tz, 0.7, 0.58, cy + 1.45, cy + 1.6, K(rec.pal.trim), CO, 0, 31);
      }
    }
  }
  // sawtooth roof (industrial): north-lit glazed risers, sloped solid backs
  saw(g, db, r, y, rec) {
    const [x0, z0, x1, z1] = r, D = z1 - z0, n = Math.max(2, Math.floor(D / 6.5)), tz = D / n, rise = 2.2, Y = y + 0.3, glass = K(0x6f88a6);
    for (let i = 0; i < n; i++) {
      const za = z0 + i * tz, zb = za + tz;
      roofQuad(g, [x0, Y, za], [x1, Y, za], [x1, Y + rise, zb], [x0, Y + rise, zb], [0, 1, -0.4]);
      roofTri(g, [x0, Y, za], [x0, Y, zb], [x0, Y + rise, zb], [-1, 0, 0]); roofTri(g, [x1, Y, za], [x1, Y, zb], [x1, Y + rise, zb], [1, 0, 0]);
      db.quad([x0 + 0.1, Y, zb + 0.02], [x1 - 0.1, Y, zb + 0.02], [x1 - 0.1, Y + rise, zb + 0.02], [x0 + 0.1, Y + rise, zb + 0.02], [0, 0, 1], S_, glass, 0.35);
    }
    roofFan(g, rectPts(x0, z0, x1, z1), Y - 0.05); rec.saw = true;
  }
  // ---- bookkeeping after the signs and shop fronts of a lot exist ----
  billboardOk(rec) { return rec.parts.length === 1 && rec.top.roof === 'flat' && inFp(rec.fp0, rec.cx, rec.cz, 5.5); }
  noteBillboard(rec, bb) { rec.billboard = bb; }
  // everything that already hangs on the walls of this building, as rectangles in wall coordinates: relief keeps clear of it
  finishLot(rec, signs, stores) {
    for (const g of signs) {
      if (g.kind === 'wall') rec.occ.push({ alongX: g.alongX, face: g.face, dir: g.dir, a0: g.a - g.w / 2 - 0.3, a1: g.a + g.w / 2 + 0.3, y0: g.y - g.hh / 2 - 0.35, y1: g.y + g.hh / 2 + 0.35 });
      else rec.occ.push({ alongX: g.alongX, face: g.face, dir: g.dir, a0: g.a - 0.9, a1: g.a + 0.9, y0: g.yb - 0.3, y1: g.yb + g.H + 0.3 });
    }
    for (const s of stores) rec.occ.push({ alongX: s.alongX, face: s.alongX ? s.z : s.x, dir: s.dir, a0: s.a0 - 0.4, a1: s.a1 + 0.4, y0: 0, y1: 4.8, store: true });
    if (rec.poi) { const gf = this.w.shops?.byId?.[rec.poi.id]?.gf ?? 3.5; rec.occ.push({ alongX: true, face: rec.z0, dir: -1, a0: rec.x0 - 1, a1: rec.x1 + 1, y0: 0, y1: gf + 0.6, store: true }); rec.gf = gf;
      if (rec.poi.cross) rec.occ.push({ alongX: true, face: rec.z0, dir: -1, a0: rec.cx - 2.4, a1: rec.cx + 2.4, y0: rec.parts[0].y1 - 5.4, y1: rec.parts[0].y1 - 0.6 }); } // the red cross panel of a hospital
  }
  // closed shops: a roller shutter replaces the shop-front slab (decided here, drawn into the `far` tier so it never pops out). (x0, x1) along the wall, z = wall plane.
  wantShutter(rec, x0, x1, z, side, alongX) {
    if (!rec || rec.poi) return false; const R = rec.rng, p = { industrial: 0.5, old: 0.28, mixed: 0.16, downtown: 0.08, beach: 0.05 }[rec.dist] ?? 0.12; if (R() > p) return false;
    const db = this.dbAt('far', rec.cx, rec.cz), a0 = x0 + 0.3, a1 = x1 - 0.3, L = a1 - a0, n = Math.max(1, Math.round(L / 2.8)), step = L / n, dir = side === 'south' || side === 'west' ? -1 : 1;
    const col = K([0x9a9ea6, 0xb8bcc2, 0x8a7a68, 0x6f8f8a][Math.floor(R() * 4)]), tag = R() < 0.55 ? ATLAS.tag[Math.floor(R() * 4)] : null, f = z + dir * 0.1, nrm = alongX ? [0, 0, dir] : [dir, 0, 0];
    const P = (al, y, off = 0) => alongX ? [al, y, f + dir * off] : [f + dir * off, y, al];
    for (let i = 0; i < n; i++) {
      const s0 = a0 + i * step, s1 = s0 + step; db.quad(P(s0, 0.15), P(s1, 0.15), P(s1, 4.3), P(s0, 4.3), nrm, ATLAS.shutter, col);
      if (tag && i === (n >> 1)) { const m = (s0 + s1) / 2; db.quad(P(m - 1.0, 0.6, 0.015), P(m + 1.0, 0.6, 0.015), P(m + 1.0, 2.4, 0.015), P(m - 1.0, 2.4, 0.015), nrm, tag, K(0xffffff)); }
    }
    const o0 = Math.min(z, z + dir * 0.26), o1 = Math.max(z, z + dir * 0.26); // housing of the rolled-up shutter above the opening
    if (alongX) db.box(a0, 4.3, o0, a1, 4.55, o1, K(0x6c7078), ME, 0, 31); else db.box(o0, 4.3, a0, o1, 4.55, a1, K(0x6c7078), ME, 0, 31);
    rec.occ.push({ alongX, face: z, dir, a0: a0 - 0.4, a1: a1 + 0.4, y0: 0, y1: 4.8, store: true }); rec.shutters = (rec.shutters || 0) + 1; return true;
  }
  // ---- rooftops ----
  roofStuff(rec) {
    const R = rec.rng, db = this.dbAt('far', rec.cx, rec.cz), parts = rec.parts, pal = rec.pal, last = parts.length - 1, lowQ = this.q === 'low', F = rec.F;
    const metal = K(0x8e929a), dark = K(0x3b3e45), conc = mixc(pal.cap, 0xc4c4c4, 0.45), tankC = [0x7a6650, 0x6d7a82, 0x8a8f96][Math.floor(R() * 3)];
    parts.forEach((p, pi) => {
      const y = p.y1 + 0.3, top = pi === last, a = area(p.fp);
      if (p.roof === 'hip') { if (rec.look === 'brick' || R() < 0.4) chimney(db, rec, p, y, R); return; }
      if (p.roof === 'mansard') { const m = rec.mansard, inner = rectFp(m.r[0] + 1.9, m.r[1] + 1.9, m.r[2] - 1.9, m.r[3] - 1.9); this.rooftop(rec, db, { ...p, fp: inner }, m.y2 + 0.05, true, a, R, { metal, dark, conc, tankC }, lowQ); return; }
      if (p.roof !== 'flat') return;
      this.rooftop(rec, db, p, y, top, a, R, { metal, dark, conc, tankC }, lowQ);
    });
    // crowns on the very top: spire, mast, open frame; red aircraft-warning lights from 16 floors up
    const tp = rec.top, ty = rec.pyr ? rec.pyr.y + rec.pyr.rise : (tp.roof === 'hip' ? rec.hipTop.y + rec.hipTop.rise : tp.y1 + 0.3), cx = (tp.fp.bb[0] + tp.fp.bb[2]) / 2, cz = (tp.fp.bb[1] + tp.fp.bb[3]) / 2;
    const tall = F >= 16, big = Math.min(tp.fp.bb[2] - tp.fp.bb[0], tp.fp.bb[3] - tp.fp.bb[1]);
    if (rec.pyr) { const h = 6 + R() * 10; spire(this.sil, cx, cz, rec.pyr.y + rec.pyr.rise - 0.2, h, 0.55, pal); if (tall) this.beacons.push([cx, rec.pyr.y + rec.pyr.rise + h + 0.3, cz, R()]); }
    else if (tp.roof === 'flat' && (tall && big > 9 || (F >= 9 && R() < 0.4))) {
      const ok = inPoly(tp.fp.roofs[0], cx, cz, 2.5) || tp.fp.roofs.some(r => inPoly(r, cx, cz, 2.5)); if (ok && !(rec.billboard && F <= 6)) {
        const h = 7 + R() * 14; if (rec.look === 'glass' && tall && R() < 0.5 && big > 14) crownFrame(this.sil, tp.fp.bb, ty, rec, R, this.beacons); else { mast(this.sil, cx, cz, ty, h, rec); if (tall) this.beacons.push([cx, ty + h + 0.3, cz, R()]); }
      }
    } else if (tall && tp.roof === 'flat') { const bb = tp.fp.bb; for (const [i, j] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { const x = lerp(bb[0], bb[2], i) + (i ? -1.2 : 1.2), z = lerp(bb[1], bb[3], j) + (j ? -1.2 : 1.2); if (inFp(tp.fp, x, z, 0.4)) this.beacons.push([x, ty + 0.3, z, R()]); } }
  }
  rooftop(rec, db, p, y, top, a, R, C, lowQ) {
    const used = [], fp = p.fp, bb = fp.bb, pi = rec.parts.indexOf(p), pal = rec.pal, F = rec.F, nxt = pi >= 0 && pi < rec.parts.length - 1 ? rec.parts[pi + 1] : null;
    if (nxt) { const nb = nxt.fp.bb; used.push([nb[0] - 1.5, nb[1] - 1.5, nb[2] + 1.5, nb[3] + 1.5]); } if (top && rec.billboard) { const b = rec.billboard; used.push([b.x - 5.4, b.z - 5.4, b.x + 5.4, b.z + 5.4]); }
    const place = (w, d, tries = 14) => { for (let t = 0; t < tries; t++) { const sw = R() < 0.5, ww = sw ? d : w, dd = sw ? w : d, x = bb[0] + 1.3 + ww / 2 + R() * Math.max(0, bb[2] - bb[0] - 2.6 - ww), z = bb[1] + 1.3 + dd / 2 + R() * Math.max(0, bb[3] - bb[1] - 2.6 - dd), hw = ww / 2 + 0.5, hd = dd / 2 + 0.5;
        if (![[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([i, j]) => inFp(fp, x + i * hw, z + j * hd, 0.85))) continue; if (used.some(u => x - hw < u[2] && x + hw > u[0] && z - hd < u[3] && z + hd > u[1])) continue; used.push([x - hw, z - hd, x + hw, z + hd]); return [x, z, ww, dd]; } return null; };
    if (rec.helipad && top && !rec.padDone) { const c = this.padSpot(fp); if (c) { rec.padDone = true; helipad(db, c[0], c[1], y, R); used.push([c[0] - 7, c[1] - 7, c[0] + 7, c[1] + 7]); } }
    else if (top && !rec.padDone && F >= 14 && a > 360 && Math.min(bb[2] - bb[0], bb[3] - bb[1]) >= 17 && R() < 0.18 && !lowQ) { const c = this.padSpot(fp); if (c) { rec.padDone = true; helipad(db, c[0], c[1], y, R); used.push([c[0] - 7, c[1] - 7, c[0] + 7, c[1] + 7]); } }
    const stair = (top || p.terrace) && F >= 3 ? 1 + (a > 700 ? 1 : 0) : 0;
    for (let i = 0; i < stair; i++) { const s = place(3.2, 3.0); if (s) stairBox(db, s[0], s[1], s[2], s[3], y, 2.6, mixc(pal.cap, 0xd8d4cc, 0.45), R); }
    if (top && F >= 10) { const s = place(4.6, 3.8); if (s) stairBox(db, s[0], s[1], s[2], s[3], y, 3.4, mixc(pal.cap, 0xc8c8c8, 0.35), R); }
    const nAC = Math.min(lowQ ? 1 : 3, 1 + Math.floor(a / 330 * (0.5 + R()))); for (let i = 0; i < nAC; i++) { const n = 2 + Math.floor(R() * 3), s = place(n * 1.7, 1.3); if (s) acRow(db, s[0], s[1], s[2], s[3], y, n, C.metal, R); }
    const nV = Math.min(lowQ ? 1 : 4, 1 + Math.floor(a / 260)); for (let i = 0; i < nV; i++) { const s = place(0.9, 0.9, 8); if (s) ventPipe(db, s[0], s[1], y, R, C.metal); }
    if (top && (rec.look !== 'glass') && a > 150 && R() < (rec.dist === 'beach' ? 0.15 : 0.5)) { const s = place(4.6, 4.6, 10); if (s) waterTank(db, s[0], s[1], y, 1.5 + R() * 0.8, C.tankC, R); }
    if (!lowQ && top && a > 200 && (rec.dist === 'beach' || rec.look === 'conc' || rec.look === 'deco') && R() < 0.38) { const s = place(6, 4); if (s) solarArray(db, s[0], s[1], s[2], s[3], y, R); }
    if (!lowQ && top && R() < 0.35) { const s = place(2, 2, 8); if (s) dish(db, s[0], s[1], y, R, C.metal); }
    if (!lowQ && top && (rec.dist === 'industrial' || rec.dist === 'mixed') && R() < 0.4) { const s = place(2.4, 1.6, 8); if (s) skylight(db, s[0], s[1], s[2], s[3], y, R); }
    if (!lowQ && (top || p.terrace) && (rec.dist === 'beach' || rec.dist === 'downtown' && p.terrace) && R() < 0.55 && a > 140) { const s = place(6.2, 5, 12); if (s) lounge(db, s[0], s[1], s[2], s[3], y, R, rec); }
    if (!lowQ && p.terrace) { const e = edgesOf(fp).filter(e => SIDE_OF(e) && rec.street[SIDE_OF(e)]); for (const ed of e) { const n = Math.floor((ed.L - 4) / 3.2); for (let k = 0; k < n; k++) { if (R() < 0.4) continue; const s = ed.L / 2 + (k - (n - 1) / 2) * 3.2, x = ed.P[0] + ed.tx * s - ed.nx * 0.75, z = ed.P[1] + ed.tz * s - ed.nz * 0.75; planter(db, x, z, y, ed, R); } } }
  }
  padSpot(fp) { for (const poly of fp.roofs) { let sx = 0, sz = 0; for (const q of poly) { sx += q[0]; sz += q[1]; } sx /= poly.length; sz /= poly.length; if ([[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([i, j]) => inFp(fp, sx + i * 6.6, sz + j * 6.6, 0.8))) return [sx, sz]; } return null; }
  // ---- parking structures (instead of some surface lots): the shell (slabs, parapet bands, dark core) is in the always-drawn silhouette mesh, columns, cars and lights in `far` ----
  garage(bi, bj, r, c, lx0, lz0, lx1, lz1, dist) {
    const R = mulberry(bi * 733 + bj * 1931 + r * 17 + c * 5 + 99); if (lx1 - lx0 < 17 || lz1 - lz0 < 17 || (dist !== 'industrial' && dist !== 'mixed' && dist !== 'downtown') || R() > 0.3) return false;
    const w = this.w, x0 = lx0 + 1.5, z0 = lz0 + 1.5, x1 = lx1 - 1.5, z1 = lz1 - 1.5, n = 4 + Math.floor(R() * 3), DH = 3.1, H = n * DH + 0.4, sh = this.sil, db = this.dbAt('far', (x0 + x1) / 2, (z0 + z1) / 2), lowQ = this.q === 'low';
    const conc = K(0xaaa7a1), concD = K(0x8e8b86), void_ = K(0x16181d), glowC = K(0xcfe4ff), B4 = 1 | 2 | 4 | 8; this.garages++;
    sh.box(x0 + 0.5, 0, z0 + 0.5, x1 - 0.5, H, z1 - 0.5, void_, CO, 0, B4);                                  // the dark inside seen through the open decks
    for (let k = 0; k <= n; k++) sh.box(x0, k * DH, z0, x1, k * DH + 0.3, z1, k === n ? concD : conc, CO, 0, k === n ? 16 | B4 : B4 | 32);   // deck slabs
    for (let k = 0; k < n; k++) { // perimeter parapet band, columns, cars, light strips
      const y = k * DH + 0.3, hb = 0.95, F4 = B4 | 16;
      sh.box(x0, y, z0, x1, y + hb, z0 + 0.3, conc, CO, 0, F4); sh.box(x0, y, z1 - 0.3, x1, y + hb, z1, conc, CO, 0, F4); sh.box(x0, y, z0 + 0.3, x0 + 0.3, y + hb, z1 - 0.3, conc, CO, 0, F4); sh.box(x1 - 0.3, y, z0 + 0.3, x1, y + hb, z1 - 0.3, conc, CO, 0, F4);
      for (let x = x0 + 3; x < x1 - 1; x += 6) { db.box(x - 0.22, y, z0 + 0.1, x + 0.22, y + DH - 0.3, z0 + 0.55, concD, CO, 0, B4); db.box(x - 0.22, y, z1 - 0.55, x + 0.22, y + DH - 0.3, z1 - 0.1, concD, CO, 0, B4); }
      for (let z = z0 + 3; z < z1 - 1; z += 6) { db.box(x0 + 0.1, y, z - 0.22, x0 + 0.55, y + DH - 0.3, z + 0.22, concD, CO, 0, B4); db.box(x1 - 0.55, y, z - 0.22, x1 - 0.1, y + DH - 0.3, z + 0.22, concD, CO, 0, B4); }
      for (const [xa, za, xb, zb] of [[x0 + 0.6, z0 + 0.6, x1 - 0.6, z0 + 0.7], [x0 + 0.6, z1 - 0.7, x1 - 0.6, z1 - 0.6]]) db.box(xa, y + DH - 0.45, za, xb, y + DH - 0.33, zb, glowC, S_, 0.9, 8 | 4 | 32);
      if (!lowQ) for (let i = 0; i < 4; i++) { const along = x0 + 3 + R() * (x1 - x0 - 6), zc = i & 1 ? z1 - 3.4 : z0 + 3.4, cc = K([0x2b2f3a, 0xb8bcc4, 0x7a1f26, 0x1f3a6a, 0xd8d8d0, 0x2f5f3a][Math.floor(R() * 6)]); db.box(along - 2.2, y, zc - 0.9, along + 2.2, y + 1.05, zc + 0.9, cc, S_, 0, 15 | 16); }
    }
    for (let k = 0; k < 3; k++) { const px = x0 + 3 + R() * (x1 - x0 - 6), pz = z0 + 3 + R() * (z1 - z0 - 6); db.box(px - 0.08, H + 0.3, pz - 0.08, px + 0.08, H + 4.2, pz + 0.08, K(0x45484f), ME, 0, B4); db.box(px - 0.35, H + 4.1, pz - 0.12, px + 0.35, H + 4.25, pz + 0.12, glowC, S_, 1.2, 16 | 32); } // roof-deck light poles
    const sx = R() < 0.5 ? x0 : x1 - 4.6, sz = R() < 0.5 ? z0 : z1 - 4.2; sh.box(sx, H + 0.3, sz, sx + 4.6, H + 3.3, sz + 4.2, conc, CO, 0, B4); sh.box(sx - 0.2, H + 3.3, sz - 0.2, sx + 4.8, H + 3.5, sz + 4.4, concD, CO, 0, 31); // stair tower
    const P = K(0x2b6bff), pxx = (x0 + x1) / 2; for (const [a, b, c2, d] of [[-0.9, 0, -0.5, 2.8], [-0.5, 2.3, 0.7, 2.8], [0.7, 1.3, 1.1, 2.8], [-0.5, 1.3, 0.7, 1.7]]) db.box(pxx + a, H - 3.3 + b, z0 - 0.35, pxx + c2, H - 3.3 + d, z0 - 0.05, P, S_, 1.3, 1 | 2 | 4 | 8 | 16); // lit "P" over the south side
    w.grid.add({ src: 'bld', x0, z0, x1, z1, y0: 0, y1: H, type: 'building' }); w.buildings.push({ x0, z0, x1, z1, h: H, rec: null }); (this.garageList ||= []).push({ x0, z0, x1, z1, h: H });
    for (const e of edgesOf(rectFp(x0, z0, x1, z1))) this.contact(e); return true;
  }
  // ---- beach club (built by World.buildBeach): same pipeline as any other building ----
  club(x0, z0, x1, z1, h, style, signs) {
    const rec = { x0, z0, x1, z1, W: x1 - x0, D: z1 - z0, F: 2, floors: 2, style, pal: PAL[style.id], look: PAL[style.id].look, rng: mulberry(4711), parts: [], occ: [], beacons: [], items: [], street: { S: false, N: false, W: true, E: false }, dist: 'beach', bi: -1, bj: -1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, id: this.recs.length, club: true };
    const fp = rectFp(x0, z0, x1, z1); rec.parts.push({ fp, y0: 0, y1: h, f0: 0, f1: 2, roof: 'flat', seed: new THREE.Color(0.43, 2 / 60, 2 / 8), club: true }); rec.fp0 = fp; rec.hGround = h; rec.h = h; rec.top = rec.parts[0]; rec.front = {}; rec.arch = 'club'; rec.topY = h + 0.3;
    this.finishLot(rec, signs, []); this.parapet(this.dbAt('far', rec.cx, rec.cz), fp, h, K(PAL[style.id].cap), rec); this.recs.push(rec); this.roofStuff(rec); if (this.relBuilt) relief(this, rec);
  }
  decorateAll() { for (const rec of this.recs) this.roofStuff(rec); if (this.relOn) this.buildRelief(); }
  buildRelief() { if (this.relBuilt) return; this.relBuilt = true; for (const rec of this.recs) relief(this, rec); }
  // ---- meshes, culling, per-frame ----
  makeMat() {
    const mat = new THREE.MeshStandardMaterial({ map: detailAtlas(), vertexColors: true, alphaTest: 0.5, roughness: 0.84, metalness: 0.02 }), U = this.U;
    mat.onBeforeCompile = sh => {
      sh.uniforms.uNight = U.night;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', () => '#include <common>\nattribute float aGlow; varying float vGlow;').replace('#include <begin_vertex>', () => '#include <begin_vertex>\n  vGlow = aGlow;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', () => '#include <common>\nvarying float vGlow; uniform float uNight;').replace('#include <emissivemap_fragment>', () => '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * vGlow * uNight * 2.4;'); // lamps, lobbies, neon lines: lit only at night
    };
    mat.customProgramCacheKey = () => 'bld-detail'; return mat;
  }
  flush() { // turn every filled chunk builder into a mesh (also used when relief is built late after a quality change)
    for (const c of this.chunks.values()) {
      if (c.mesh || !c.db.n) continue; const geo = c.db.build(), m = new THREE.Mesh(geo, this.mat); m.receiveShadow = true; m.castShadow = false; this.w.scene.add(m); c.mesh = m; c.db = null; const bb = geo.boundingBox;
      this.meshes.push({ m, tier: c.tier, x0: bb.min.x, z0: bb.min.z, x1: bb.max.x, z1: bb.max.z });
    }
  }
  finalize() {
    if (this.fin) return; this.fin = true; this.mat = this.makeMat(); this.flush();
    if (this.sil.n) { const m = this.silMesh = new THREE.Mesh(this.sil.build(), this.mat); m.receiveShadow = true; this.w.scene.add(m); } this.sil = new DB(); this.buildBeacons(); this.buildSkyline();
    const sc = this.w.scene, prev = sc.onBeforeRender, self = this; sc.onBeforeRender = function (r, s, cam, ...rest) { if (prev) prev.call(this, r, s, cam, ...rest); if (cam.isPerspectiveCamera) self.cull(cam.position); }; // distance tiers need the camera of the frame about to be drawn
  }
  cull(p) {
    const D = DIST[this.q] || DIST.high;
    for (const e of this.meshes) { const dx = Math.max(e.x0 - p.x, 0, p.x - e.x1), dz = Math.max(e.z0 - p.z, 0, p.z - e.z1); e.m.visible = dx * dx + dz * dz < D[e.tier] * D[e.tier]; }
  }
  buildBeacons() {
    const L = this.beacons; for (const r of this.recs) for (const b of r.beacons) L.push(b); if (!L.length) return;
    const geo = new THREE.IcosahedronGeometry(0.45, 0); geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(L.map(b => b[3])), 1));
    const mat = new THREE.MeshBasicMaterial({ color: 0xff2418 }), U = this.U;
    mat.onBeforeCompile = sh => { sh.uniforms.uT = U.time; sh.uniforms.uN = U.night;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', () => '#include <common>\nattribute float aPh; varying float vPh;').replace('#include <begin_vertex>', () => '#include <begin_vertex>\n  vPh = aPh;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', () => '#include <common>\nvarying float vPh; uniform float uT, uN;').replace('#include <color_fragment>', () => '#include <color_fragment>\n  { float ph = fract(uT * 0.72 + vPh); float on = max(smoothstep(0.0, 0.03, ph) * (1.0 - smoothstep(0.1, 0.16, ph)), smoothstep(0.24, 0.27, ph) * (1.0 - smoothstep(0.34, 0.4, ph))); diffuseColor.rgb *= mix(0.1, 1.0, on) * mix(1.4, 3.6, uN); }'); };
    mat.customProgramCacheKey = () => 'bld-beacon';
    const mesh = this.beaconMesh = new THREE.InstancedMesh(geo, mat, L.length), m = new THREE.Matrix4(); L.forEach((b, i) => { m.makeTranslation(b[0], b[1], b[2]); mesh.setMatrixAt(i, m); }); mesh.frustumCulled = false; this.w.scene.add(mesh);
  }
  // distant skyline: silhouettes of towers beyond the city, one mesh, own haze (the scene fog would turn them into nothing beyond 720 m)
  buildSkyline() {
    const R = mulberry(8128), P = [], N = [], UV = [], HZ = [], low = this.q === 'low', count = low ? 150 : 240;
    const quad = (a, b, c, d, n, u, h0, h1) => { for (const i of [0, 1, 2, 0, 2, 3]) { const q = [a, b, c, d][i]; P.push(q[0], q[1], q[2]); N.push(n[0], n[1], n[2]); UV.push(i === 1 || i === 2 ? u : 0, q[1] / 5); HZ.push(q[1] < 0 ? Math.min(1, h0 + 0.3) : h1); } };
    const box = (x, z, w, d, y0, y1, hz) => { const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2; quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], w / 6, hz, hz); quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], w / 6, hz, hz); quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], d / 6, hz, hz); quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], d / 6, hz, hz); quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], 0, hz, hz); };
    for (let i = 0; i < count; i++) {
      const a = R() * TAU, rr = 340 + Math.pow(R(), 0.8) * 760, x = Math.cos(a) * (400 + rr), z = Math.sin(a) * (320 + rr); if (x > CITY.maxX - 80 && Math.abs(z) < 620) continue; // the ocean side stays empty
      const cl = 0.5 + 0.5 * Math.sin(a * 3.1 + 1.3) * Math.sin(a * 5.3 + 0.4), hz = clamp(0.42 + (rr - 340) / 760 * 0.46, 0.42, 0.92), H = 28 + Math.pow(R(), 2.1) * (70 + 190 * cl), w = 20 + R() * 36, d = 20 + R() * 36, tiers = H > 90 ? 3 : H > 55 ? 2 : 1;
      let y = -40, ww = w, dd = d; for (let k = 0; k < tiers; k++) { const hk = k === tiers - 1 ? H : H * (0.55 + 0.2 * k); box(x, z, ww, dd, y, hk, hz); y = hk; ww *= 0.68; dd *= 0.68; }
      if (H > 120 && R() < 0.6) box(x, z, 1.4, 1.4, H, H + 18 + R() * 25, hz);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aHaze', new THREE.Float32BufferAttribute(HZ, 1)); g.computeBoundingSphere();
    const mat = new THREE.ShaderMaterial({ uniforms: { uFog: { value: new THREE.Color(0xbfe4fa) }, uSky: { value: new THREE.Color(0x4a86d8) }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color(1, 1, 1) }, uNight: { value: 0 } },
      vertexShader: 'attribute float aHaze; varying float vHaze; varying vec3 vN; varying vec2 vUv; varying float vD; void main(){ vHaze = aHaze; vN = normal; vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform vec3 uFog, uSky, uSun, uSunC; uniform float uNight; varying float vHaze; varying vec3 vN; varying vec2 vUv; varying float vD;
        float hs(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){ vec3 n = normalize(vN); float lam = max(dot(n, normalize(uSun)), 0.0), top = step(0.5, n.y), day = 1.0 - uNight;
          vec3 base = mix(vec3(0.12, 0.14, 0.2), uFog * 0.55, 0.4); vec3 col = base * (0.5 + 0.9 * lam * day) + uSky * 0.05 + uSunC * lam * day * 0.06; col = mix(col, uFog * (0.9 + top * 0.4), 0.12);
          vec2 c = floor(vUv); vec2 f = fract(vUv); float on = step(0.7, hs(c + vec2(3.0, 7.0))), win = step(0.18, f.x) * step(f.x, 0.82) * step(0.22, f.y) * step(f.y, 0.78) * (1.0 - top);
          float far = smoothstep(380.0, 900.0, vD); vec3 warm = vec3(1.0, 0.78, 0.5);
          col += warm * uNight * (1.0 - vHaze * 0.85) * (win * on * (1.0 - far) * 1.5 + (1.0 - top) * far * 0.22 * (0.4 + 0.6 * hs(c))); col = mix(col, uFog, vHaze); gl_FragColor = vec4(col, 1.0); }` });
    this.sk = new THREE.Mesh(g, mat); this.sk.frustumCulled = false; this.w.scene.add(this.sk);
  }
  update(dt, t) { this.U.time.value = t % 600; }
  setNight(f, sunDir, skyColor, fogColor, fogNear, fogFar, sunColor, rain) {
    this.U.night.value = f; const u = this.sk?.material.uniforms; if (u) { u.uNight.value = f; u.uFog.value.copy(fogColor); u.uSky.value.copy(skyColor); u.uSun.value.copy(sunDir); u.uSunC.value.copy(sunColor); }
  }
  setQuality(q) { this.q = q; this.relOn = q !== 'low'; if (this.relOn && !this.relBuilt && this.fin) { this.buildRelief(); this.flush(); } }
}
const rect_ = r => rectFp(r[0], r[1], r[2], r[3]);

// ---------- rooftop furniture (all merged into the `far` tier of the chunk) ----------
const jit = (c, R, a = 0.08) => c.clone().multiplyScalar(1 - a + R() * 2 * a);
const ALL = 31;
function leafCard(db, x, y, z, s, cell, tint, R) { // two crossed double-sided cards and a flat top card
  const a0 = R() * 3; for (const a of [a0, a0 + 1.5708]) { const c = Math.cos(a) * s / 2, sn = Math.sin(a) * s / 2, n = [-Math.sin(a), 0, Math.cos(a)]; for (const k of [1, -1]) db.quad([x - c, y, z - sn], [x + c, y, z + sn], [x + c, y + s * 0.8, z + sn], [x - c, y + s * 0.8, z - sn], [n[0] * k, 0, n[2] * k], cell, tint); }
  for (const k of [1, -1]) db.quad([x - s * 0.45, y + s * 0.62, z - s * 0.45], [x + s * 0.45, y + s * 0.62, z - s * 0.45], [x + s * 0.45, y + s * 0.62, z + s * 0.45], [x - s * 0.45, y + s * 0.62, z + s * 0.45], [0, k, 0], cell, tint);
}
function chimney(db, rec, p, y, R) {
  const ht = rec.hipTop; if (!ht) return; const [x0, z0, x1, z1] = ht.r, W = x1 - x0, D = z1 - z0, brick = mixc(0x8b4a3b, 0x6a6a6a, R() * 0.4);
  for (let k = 0; k < 1 + (R() < 0.4 ? 1 : 0); k++) { const t = 0.25 + R() * 0.5, x = W >= D ? lerp(x0 + D / 2, x1 - D / 2, t) : (x0 + x1) / 2 + (R() - 0.5), z = W >= D ? (z0 + z1) / 2 + (R() - 0.5) : lerp(z0 + W / 2, z1 - W / 2, t); db.box(x - 0.45, y + ht.rise * 0.35, z - 0.45, x + 0.45, y + ht.rise + 1.3, z + 0.45, brick, ATLAS.brick); db.box(x - 0.6, y + ht.rise + 1.3, z - 0.6, x + 0.6, y + ht.rise + 1.5, z + 0.6, K(0x7d7a76), CO); db.box(x - 0.3, y + ht.rise + 1.5, z - 0.3, x + 0.3, y + ht.rise + 1.62, z + 0.3, K(0x1a1a1c), S_, 0, 16); }
}
function spire(db, x, z, y, h, r, pal) {
  db.cyl(x, z, r * 1.9, r * 1.5, y, y + 0.9, 10, K(pal.cap), CO, 0, true); db.cyl(x, z, r, 0.07, y + 0.9, y + h, 10, mixc(pal.fin, 0xc0c4cc, 0.5), ME, 0, false);
  for (const t of [0.35, 0.6]) db.cyl(x, z, r * (1 - t) + 0.28, r * (1 - t) + 0.28, y + h * t, y + h * t + 0.14, 10, K(pal.accent), S_, 0.8, true);
}
function mast(db, x, z, y, h, rec) {
  const R = rec.rng, m = K(0x9aa0aa); db.box(x - 0.7, y, z - 0.7, x + 0.7, y + 0.8, z + 0.7, K(0x7e7c78), CO); db.cyl(x, z, 0.2, 0.07, y + 0.8, y + h, 8, m, ME, 0, false);
  for (const t of [0.5, 0.72, 0.88]) { const yy = y + h * t, w = 2.6 * (1.1 - t); db.box(x - w / 2, yy, z - 0.04, x + w / 2, yy + 0.08, z + 0.04, m, ME); if (R() < 0.6) db.box(x - 0.04, yy, z - w / 2, x + 0.04, yy + 0.08, z + w / 2, m, ME); }
  if (R() < 0.5) db.cyl(x + 0.25, z, 0.5, 0.5, y + h * 0.4, y + h * 0.4 + 0.5, 8, K(0xe8e8e8), S_, 0, true);
}
function crownFrame(db, bb, y, rec, R, beacons) { // open steel frame with a glowing line, four warning lights on the corners
  const g = 1.6, x0 = bb[0] + g, x1 = bb[2] - g, z0 = bb[1] + g, z1 = bb[3] - g, H = 5 + R() * 4, c = K(rec.pal.fin), ac = K(rec.pal.accent);
  for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) { db.box(x - 0.2, y, z - 0.2, x + 0.2, y + H, z + 0.2, c, ME); beacons.push([x, y + H + 0.3, z, R()]); }
  for (const [a, b, c2, d] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]]) { db.box(Math.min(a, c2) - 0.2, y + H - 0.1, Math.min(b, d) - 0.2, Math.max(a, c2) + 0.2, y + H + 0.1, Math.max(b, d) + 0.2, c, ME); db.box(Math.min(a, c2), y + H * 0.55, Math.min(b, d), Math.max(a, c2), y + H * 0.55 + 0.12, Math.max(b, d), ac, S_, 1.5); }
  for (const [a, b, c2, d] of [[x0, z0, x1, z1]]) db.box(a, y, b, c2, y + 0.3, d, K(0x20242c), ME);
}
function helipad(db, x, z, y, R) {
  db.cyl(x, z, 6.2, 6.2, y, y + 0.1, 28, K(0x2c3038), CO, 0, true); db.cyl(x, z, 5.5, 5.5, y + 0.1, y + 0.13, 28, K(0xeeeeee), S_, 0, true); db.cyl(x, z, 5.0, 5.0, y + 0.13, y + 0.16, 28, K(0x2c3038), CO, 0, true);
  const w = K(0xffffff); db.box(x - 1.5, y + 0.16, z - 1.7, x - 1.0, y + 0.19, z + 1.7, w, S_); db.box(x + 1.0, y + 0.16, z - 1.7, x + 1.5, y + 0.19, z + 1.7, w, S_); db.box(x - 1.5, y + 0.16, z - 0.25, x + 1.5, y + 0.19, z + 0.25, w, S_);
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, lx = x + Math.cos(a) * 6.0, lz = z + Math.sin(a) * 6.0; db.box(lx - 0.13, y + 0.1, lz - 0.13, lx + 0.13, y + 0.32, lz + 0.13, K(i % 5 === 0 ? 0xffd34e : 0x6dffb0), S_, 1.6); }
}
function stairBox(db, x, z, w, d, y, h, col, R) {
  db.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, col, CO); db.box(x - w / 2 - 0.15, y + h, z - d / 2 - 0.15, x + w / 2 + 0.15, y + h + 0.2, z + d / 2 + 0.15, K(0x585b62), CO);
  const s = Math.floor(R() * 4), nx = s === 0 ? 1 : s === 1 ? -1 : 0, nz = s === 2 ? 1 : s === 3 ? -1 : 0, px = x + nx * (w / 2 + 0.02), pz = z + nz * (d / 2 + 0.02), tx = nz ? 1 : 0, tz = nx ? 1 : 0;
  db.quad([px - tx * 0.5, y, pz - tz * 0.5], [px + tx * 0.5, y, pz + tz * 0.5], [px + tx * 0.5, y + 2.1, pz + tz * 0.5], [px - tx * 0.5, y + 2.1, pz - tz * 0.5], [nx, 0, nz], S_, K(0x2a2d33));
  db.box(px + nx * 0.1 - 0.1 + tx * 0.7, y + 2.3, pz + nz * 0.1 - 0.1 + tz * 0.7, px + nx * 0.1 + 0.1 + tx * 0.7, y + 2.5, pz + nz * 0.1 + 0.1 + tz * 0.7, K(0xffe2b0), S_, 1.2);
}
function acRow(db, x, z, w, d, y, n, metal, R) {
  const along = w >= d, L = (along ? w : d) - 1, u = L / n, c = jit(K(0xb9bdc4), R, 0.12);
  for (let i = 0; i < n; i++) { const o = -L / 2 + u * (i + 0.5), cx = along ? x + o : x, cz = along ? z : z + o, hx = along ? u * 0.42 : d * 0.38, hz = along ? d * 0.38 : u * 0.42; db.box(cx - hx, y + 0.1, cz - hz, cx + hx, y + 1.2, cz + hz, c, ME, 0, 15); db.quad([cx - hx, y + 1.21, cz + hz], [cx + hx, y + 1.21, cz + hz], [cx + hx, y + 1.21, cz - hz], [cx - hx, y + 1.21, cz - hz], [0, 1, 0], ATLAS.vent, K(0xd8dade)); }
}
function ventPipe(db, x, z, y, R, metal) { const h = 1.2 + R() * 1.4, r = 0.17 + R() * 0.07; db.cyl(x, z, r, r, y, y + h, 6, metal, ME, 0, false); db.cyl(x, z, r * 2.3, 0.02, y + h, y + h + 0.45, 6, K(0x777b83), ME, 0, false); }
function waterTank(db, x, z, y, r, col, R) {
  const lg = r * 0.68, tc = jit(K(col), R, 0.1), H = r * 1.8; for (const [i, j] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) db.box(x + i * lg - 0.07, y, z + j * lg - 0.07, x + i * lg + 0.07, y + 1.9, z + j * lg + 0.07, K(0x3d3f45), ME);
  for (const hh of [0.5, 1.2]) for (const [a, b, c2, d] of [[-lg, -lg, lg, -lg], [-lg, lg, lg, lg], [-lg, -lg, -lg, lg], [lg, -lg, lg, lg]]) db.box(x + Math.min(a, c2) - 0.03, y + hh, z + Math.min(b, d) - 0.03, x + Math.max(a, c2) + 0.03, y + hh + 0.06, z + Math.max(b, d) + 0.03, K(0x3d3f45), ME, 0, 15);
  db.cyl(x, z, r + 0.15, r + 0.15, y + 1.9, y + 2.0, 12, K(0x3d3f45), ME, 0, true); db.cyl(x, z, r, r, y + 2.0, y + 2.0 + H, 14, tc, ATLAS.metal, 0, false);
  for (const t of [0.25, 0.7]) db.cyl(x, z, r + 0.05, r + 0.05, y + 2.0 + H * t, y + 2.0 + H * t + 0.1, 14, K(0x2f3136), ME, 0, false);
  db.cyl(x, z, r * 1.04, 0.05, y + 2.0 + H, y + 2.0 + H + r * 0.55, 14, mixc(col, 0x303236, 0.5), ATLAS.metal, 0, false); db.box(x + r + 0.02, y + 2.0, z - 0.2, x + r + 0.1, y + 2.0 + H, z + 0.2, K(0x44464c), ME);
}
function solarArray(db, x, z, w, d, y, R) {
  const rows = Math.max(1, Math.min(3, Math.floor(d / 1.9))), pw = Math.min(w, 6) - 0.4, x0 = x - pw / 2, x1 = x + pw / 2, rd = 1.15;
  for (let k = 0; k < rows; k++) { const zf = z - d / 2 + 0.6 + k * 1.8, zb = zf + rd, y0 = y + 0.35, y1 = y + 0.35 + 0.62; db.quad([x0, y0, zf], [x1, y0, zf], [x1, y1, zb], [x0, y1, zb], [0, 0.88, -0.47], ATLAS.solar, K(0xdfe6ff)); db.box(x0, y, zf, x0 + 0.06, y0, zf + 0.06, K(0x8b8f97), ME); db.box(x1 - 0.06, y, zf, x1, y0, zf + 0.06, K(0x8b8f97), ME); db.box(x0, y, zb, x0 + 0.06, y1, zb + 0.06, K(0x8b8f97), ME); db.box(x1 - 0.06, y, zb, x1, y1, zb + 0.06, K(0x8b8f97), ME); }
}
function dish(db, x, z, y, R, metal) { db.box(x - 0.07, y, z - 0.07, x + 0.07, y + 1.5, z + 0.07, metal, ME); db.cyl(x, z, 0.08, 0.8, y + 1.45, y + 1.85, 12, K(0xe9ebee), ATLAS.metal, 0, true); db.box(x - 0.04, y + 1.85, z - 0.04, x + 0.04, y + 2.5, z + 0.04, K(0x555960), ME); }
function skylight(db, x, z, w, d, y, R) { const gl = K(R() < 0.5 ? 0xd8ecff : 0xffe2b0); db.box(x - w / 2, y, z - d / 2, x + w / 2, y + 0.35, z + d / 2, K(0x6a6d74), CO); db.box(x - w / 2 + 0.12, y + 0.35, z - d / 2 + 0.12, x + w / 2 - 0.12, y + 0.7, z + d / 2 - 0.12, gl, S_, 0.55); }
function lounge(db, x, z, w, d, y, R, rec) {
  const hw = w / 2 - 0.3, hd = d / 2 - 0.3, wood = K(0xb08a5a), cream = K(0xf3ead8); db.box(x - w / 2, y, z - d / 2, x + w / 2, y + 0.12, z + d / 2, wood, ATLAS.plaster);
  for (const [i, j] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) db.box(x + i * hw - 0.07, y + 0.12, z + j * hd - 0.07, x + i * hw + 0.07, y + 2.5, z + j * hd + 0.07, cream, CO);
  for (const j of [-1, 1]) db.box(x - hw - 0.2, y + 2.5, z + j * hd - 0.08, x + hw + 0.2, y + 2.64, z + j * hd + 0.08, cream, CO);
  for (let k = 0; k < 7; k++) db.box(x - hw - 0.2 + k * (2 * hw + 0.4) / 6 - 0.05, y + 2.64, z - hd, x - hw - 0.2 + k * (2 * hw + 0.4) / 6 + 0.05, y + 2.72, z + hd, cream, CO);
  const um = [0xff4fa3, 0x3ce8f5, 0xffd34e, 0xffffff]; for (let k = 0; k < 2; k++) { const ux = x + (k ? 1 : -1) * hw * 0.35, uz = z + (R() - 0.5) * hd; db.cyl(ux, uz, 0.04, 0.04, y + 0.12, y + 2.6, 6, K(0xeeeeee), S_, 0, false); db.cyl(ux, uz, 1.5, 0.05, y + 2.15, y + 2.75, 10, K(um[Math.floor(R() * 4)]), S_, 0, false); }
  for (let k = 0; k < 3; k++) { const lx = x - hw + 0.9 + k * 1.0, lz = z + hd - 1.0; db.box(lx - 0.3, y + 0.12, lz - 0.9, lx + 0.3, y + 0.42, lz + 0.9, cream, S_); db.box(lx - 0.3, y + 0.42, lz + 0.35, lx + 0.3, y + 0.85, lz + 0.9, cream, S_); }
  leafCard(db, x + hw * 0.7, y + 0.12, z - hd * 0.7, 1.7, ATLAS.leaf, K(0xa8d890), R);
}
function planter(db, x, z, y, ed, R) { db.obox(x, z, ed.tx, ed.tz, 0.45, 0.28, y, y + 0.5, jit(K(0xb9b3a8), R, 0.1), CO, 0, ALL); leafCard(db, x, y + 0.45, z, 1.1 + R() * 0.5, R() < 0.35 ? ATLAS.flower : ATLAS.leaf, K(0xffffff), R); }
// ---------- facade relief ----------
// Everything is placed in the window grid of the wall it hangs on: the facade texture repeats every 2 m (one window cell) with u measured from the END (Q) of the edge, so a
// pilaster at us = 2 k sits exactly between two windows. Elements keep clear of signs, shop fronts and doors through e.occ (rectangles in edge coordinates s / y).
const FH = 1 | 2 | 8 | 16 | 32, FV = 1 | 2 | 8, FB = 1 | 2 | 8 | 16;
function relief(B, rec) {
  const R = rec.rng, pal = rec.pal, look = rec.look, hi = B.q === 'high', Qd = hi ? 1 : 0.6, relDB = B.dbAt('rel', rec.cx, rec.cz), fineDB = B.dbAt('fine', rec.cx, rec.cz), grid = B.w.grid, st = rec.style;
  const trim = K(pal.trim), fin = K(pal.fin), cap = K(pal.cap), acc = K(pal.accent), ys = FLOOR * (0.45 - st.winH / 2), yh = FLOOR * (0.45 + st.winH / 2), sillC = mixc(pal.trim, 0xffffff, 0.15), dark = K(0x2d3036);
  const neonLine = !rec.club && (rec.dist === 'beach' || rec.dist === 'downtown') && R() < 0.3, escapeSide = look === 'brick' || (look === 'conc' && R() < 0.3) ? SIDES[Math.floor(R() * 4)] : null, escDone = { v: false };
  const n0 = relDB.n, f0n = fineDB.n; rec.relTris = 0;
  rec.parts.forEach((p, pi) => {
    if (p.frustum) return; const nF = p.f1 - p.f0, y0 = p.y0, y1 = p.y1, fp = p.fp, first = pi === 0;
    for (const e of edgesOf(fp)) {
      if (e.L < 2.6) continue; const side = SIDE_OF(e), L = e.L, axisAligned = !!side;
      // ---- frame of this edge ----
      const T = s => [e.P[0] + e.tx * s, e.P[1] + e.tz * s];
      const bx = (sa, sb, ya, yb, o0, o1, col, rc = S_, gl = 0, f = FH, db = relDB) => { const c = T((sa + sb) / 2), on = (o0 + o1) / 2; db.obox(c[0] + e.nx * on, c[1] + e.nz * on, e.tx, e.tz, (sb - sa) / 2, (o1 - o0) / 2, ya, yb, col, rc, gl, f); };
      const wq = (sa, sb, ya, yb, o, rc, col, gl = 0, db = relDB, both = false) => { const a = T(sa), b = T(sb), n = [e.nx, 0, e.nz]; for (const k of both ? [1, -1] : [1]) db.quad([a[0] + e.nx * o, ya, a[1] + e.nz * o], [b[0] + e.nx * o, ya, b[1] + e.nz * o], [b[0] + e.nx * o, yb, b[1] + e.nz * o], [a[0] + e.nx * o, yb, a[1] + e.nz * o], [n[0] * k, 0, n[2] * k], rc, col, gl); }; // flat picture on the wall plane + o
      // occupancy in edge coordinates
      e.occ = []; if (axisAligned) for (const o of rec.occ) { const ax = side === 'S' || side === 'N'; if (o.alongX !== ax) continue; if (Math.abs((ax ? e.P[1] : e.P[0]) - o.face) > 0.2 || o.dir !== (ax ? Math.sign(e.nz) : Math.sign(e.nx))) continue; const a0 = ax ? e.P[0] : e.P[1], sg = ax ? Math.sign(e.tx) : Math.sign(e.tz), s0 = (o.a0 - a0) * sg, s1 = (o.a1 - a0) * sg; e.occ.push([Math.min(s0, s1), Math.max(s0, s1), o.y0, o.y1, o.store ? 1 : 0]); }
      const overlap = (sa, sb, ya, yb) => e.occ.some(o => !(o[1] <= sa || o[0] >= sb || o[3] <= ya || o[2] >= yb));
      const sruns = (sa, sb, ya, yb) => { let out = [[sa, sb]]; for (const o of e.occ) { if (o[3] <= ya || o[2] >= yb) continue; const nx = []; for (const r of out) { if (o[1] <= r[0] || o[0] >= r[1]) nx.push(r); else { if (o[0] > r[0]) nx.push([r[0], o[0]]); if (o[1] < r[1]) nx.push([o[1], r[1]]); } } out = nx; } return out.filter(r => r[1] - r[0] > 0.35); };
      const yruns = (sa, sb, ya, yb) => { let out = [[ya, yb]]; for (const o of e.occ) { if (o[1] <= sa || o[0] >= sb) continue; const nx = []; for (const r of out) { if (o[3] <= r[0] || o[2] >= r[1]) nx.push(r); else { if (o[2] > r[0]) nx.push([r[0], o[2]]); if (o[3] < r[1]) nx.push([o[3], r[1]]); } } out = nx; } return out.filter(r => r[1] - r[0] > 0.4); };
      const strip = (ya, yb, out, col, rc = PL, sa = 0, sb = L, gl = 0) => { for (const r of sruns(sa, sb, ya, yb)) bx(r[0], r[1], ya, yb, -0.05, out, col, rc, gl, 8 | 32 | (out > 0.25 || ya < 2 ? 16 : 0)); };
      const vstrip = (us, w, out, col, ya = y0, yb = y1, rc = PL, f = FV) => { const s = L - us; if (s - w / 2 < 0 || s + w / 2 > L) return; for (const r of yruns(s - w / 2, s + w / 2, ya, yb)) bx(s - w / 2, s + w / 2, Math.max(r[0], 0.15), r[1], -0.05, out, col, rc, 0, f); };
      // room in front of the wall (to the lot boundary and to the rest of this building)
      let room = 0; if (axisAligned) { const c = side === 'S' || side === 'N' ? e.P[1] : e.P[0], dl = side === 'S' ? c - rec.z0 : side === 'N' ? rec.z1 - c : side === 'W' ? c - rec.x0 : rec.x1 - c, m = T(L / 2); room = dl + (rec.street[side] ? 4.5 : (rec.gap ?? 1.5) + 1.0); for (let d = 0.6; d < 7; d += 0.6) if (inFp(fp, m[0] + e.nx * d, m[1] + e.nz * d)) { room = Math.min(room, d); break; } } else room = 0.3;
      const onPlane = axisAligned && Math.abs(fp.spans[side] ? fp.spans[side][2] - (side === 'S' || side === 'N' ? e.P[1] : e.P[0]) : 9) < 0.05, street = onPlane && rec.street[side], vis = !axisAligned || rec.street[side]; // vis: this wall is seen from a street (alley walls only get the cornice and the corner strips)
      const nCells = Math.floor(L / 2), cells = (k0, k1, fn) => { for (let k = k0; k < k1; k++) fn(k, L - (2 * k + 1)); };  // s of the centre of window column k
      // ---- ground floor of the first part: shop-front frames, entrances, base course ----
      if (first) {
        for (const o of e.occ.filter(o => o[4] && o[2] === 0 && !(rec.poi && side === 'S'))) { // between the shop front slab and the corners: pilasters and a lintel
          const sa = o[0] + 0.4, sb = o[1] - 0.4; if (sb - sa < 2) continue;
          for (const sx of [sa - 0.1, sb + 0.1]) bx(sx - 0.3, sx + 0.3, 0.15, 4.45, -0.05, 0.36, fin, PL, 0, FV, relDB);
          bx(sa - 0.4, sb + 0.4, 4.4, 4.66, -0.05, 0.4, trim, PL, 0, FH, relDB);
        }
        const entrance = (dc, dw, dep, posts) => { // lobby door with a glowing glass leaf, a canopy with a lit underside, wall lamps; centred on s = dc
          const sa = dc - dw / 2, sb = dc + dw / 2, warm = K(R() < 0.7 ? 0xffe2b0 : 0xd8ecff);
          bx(sa - 0.12, sa, 0.15, 2.55, -0.05, 0.12, dark, ME, 0, FV); bx(sb, sb + 0.12, 0.15, 2.55, -0.05, 0.12, dark, ME, 0, FV); bx(sa - 0.12, sb + 0.12, 2.55, 2.7, -0.05, 0.12, dark, ME, 0, FH); wq(sa, sb, 0.15, 2.55, 0.05, ATLAS.door, warm, 0.85);
          bx(sa - 0.5, sb + 0.5, 0.15, 0.27, 0, 0.7, K(0x8d8a85), CO, 0, FH); // threshold
          bx(sa - 0.7, sb + 0.7, 3.3, 3.5, -0.05, dep, trim, PL, 0, FH); bx(sa - 0.7, sb + 0.7, 3.5, 3.6, 0.0, dep - 0.05, K(0x55575d), CO, 0, 16); bx(sa - 0.55, sb + 0.55, 3.27, 3.3, 0.05, dep - 0.1, warm, S_, 1.3, 32); // slab, roof cap, light strip underneath
          if (posts) for (const sx of [sa - 0.6, sb + 0.6]) { const c = T(sx), px = c[0] + e.nx * (dep - 0.13), pz = c[1] + e.nz * (dep - 0.13); if (B.markers.some(m => Math.hypot(m.x - px, m.z - pz) < 2.2)) continue; bx(sx - 0.07, sx + 0.07, 0.15, 3.3, dep - 0.2, dep - 0.06, dark, ME, 0, FB); grid.add({ src: 'bld', x0: px - 0.14, x1: px + 0.14, z0: pz - 0.14, z1: pz + 0.14, y0: 0, y1: 3.3, type: 'pole' }); }
          for (const sx of [sa - 0.45, sb + 0.45]) bx(sx - 0.07, sx + 0.07, 2.2, 2.4, 0.0, 0.2, warm, S_, 1.5, FB); // wall lamps beside the door
          const c0 = T(sa - 0.7), c1 = T(sb + 0.7), xs = [c0[0], c1[0], c0[0] + e.nx * dep, c1[0] + e.nx * dep], zs = [c0[1], c1[1], c0[1] + e.nz * dep, c1[1] + e.nz * dep];
          grid.add({ src: 'bld', x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: 3.3, y1: 3.6, type: 'prop' }); e.occ.push([sa - 1.0, sb + 1.0, 0, 3.8, 0]);
        };
        if (hi && !rec.poi && street && !e.occ.some(o => o[4]) && R() < 0.55) {
          const free = sruns(1.6, L - 1.6, 0.1, 3.8), seg = free.find(r => r[1] - r[0] >= 4.2), dep = Math.min(2.2, SIDEW + (rec.gap ?? 1) - 2.9);
          if (seg && room > 3.4 && dep >= 1.05) entrance(lerp(seg[0] + 1.55, seg[1] - 1.55, R()), 1.9, dep, true); // the posts must leave the pavement strip along the kerb free
        } else if (hi && !rec.poi && !axisAligned && L > 3.2) entrance(L / 2, 1.9, 1.2, false); // the door of a chamfered corner sits on the diagonal
        if (!(rec.poi && side === 'S')) strip(0.15, 0.78, 0.09, mixc(pal.fin, 0x777777, 0.3), CO, 0, L); // base course
      }
      // ---- look specific ----
      const hOf = f => p.y0 + f * FLOOR; // base of floor f of this part (0 = first floor of the part)
      if (look === 'glass') {
        const step = hi ? 1 : 2, fc = st.id === 'tower' ? fin : mixc(pal.fin, 0x88a0c0, 0.3);
        if (vis) { for (let k = 1; k < nCells; k += step) vstrip(2 * k, 0.1, 0.26, fc, y0 + (first ? 0 : 0.1), y1 - 0.7, ME, FV); for (let f = 0; f < nF; f++) { const yb = hOf(f) + FLOOR; if (yb > y1 - 0.6) break; strip(yb - 0.17, yb + 0.17, 0.2, trim, ME); } }
        vstrip(0.3, 0.6, 0.36, trim, y0, y1, ME); vstrip(L - 0.3, 0.6, 0.36, trim, y0, y1, ME);
        strip(y1 - 0.8, y1, 0.42, cap, ME); strip(y1 - 0.9, y1 - 0.8, 0.34, mixc(pal.accent, 0x20242c, 0.7), S_, 0, L, 0.35);
      } else if (look === 'deco') {
        if (vis) for (let k = 2; k < nCells - 1; k += 2) vstrip(2 * k, 0.5, 0.2, fin, y0, y1 - 1.0);
        vstrip(0.28, 0.56, 0.12, fin); vstrip(L - 0.28, 0.56, 0.12, fin);
        if (vis) { for (let f = 0; f < nF; f++) strip(hOf(f) + ys - 0.11, hOf(f) + ys, 0.15, sillC); // window sills, one continuous ledge per floor
          for (let f = first ? 1 : 0; f < nF; f += (f === 0 && first) ? 1 : 4) { const yb = hOf(f); if (yb > y0 + 0.1 && yb < y1 - 2) strip(yb - 0.15, yb + 0.15, 0.24, trim); } } // string courses
        strip(y1 - 0.95, y1 - 0.6, 0.2, trim); strip(y1 - 0.6, y1 - 0.28, 0.5, trim); strip(y1 - 0.28, y1, 0.72, mixc(pal.trim, pal.cap, 0.45));
        if (neonLine && street) strip(y1 + 0.55, y1 + 0.62, 0.0, acc, S_, 0, L, 1.8);
      } else if (look === 'brick') {
        if (vis) { for (let f = 0; f < nF; f++) { const yb = hOf(f); strip(yb + ys - 0.12, yb + ys, 0.13, sillC); strip(yb + yh, yb + yh + 0.2, 0.1, trim); }
          for (let f = first ? 1 : 0; f < nF; f += (f === 0 && first) ? 1 : 3) { const yb = hOf(f); if (yb > y0 + 0.1 && yb < y1 - 2) strip(yb - 0.14, yb + 0.14, 0.2, trim); } }
        vstrip(0.3, 0.6, 0.1, trim); vstrip(L - 0.3, 0.6, 0.1, trim);
        strip(y1 - 0.8, y1 - 0.5, 0.2, trim); strip(y1 - 0.5, y1 - 0.2, 0.4, trim); strip(y1 - 0.2, y1, 0.58, mixc(pal.trim, pal.cap, 0.5));
      } else { // concrete / modern
        if (vis) for (let k = 2; k < nCells; k += 2) vstrip(2 * k, 0.4, 0.22, fin, y0, y1, CO);
        vstrip(0.3, 0.6, 0.28, fin, y0, y1, CO); vstrip(L - 0.3, 0.6, 0.28, fin, y0, y1, CO);
        if (vis) { for (let f = 0; f < nF; f++) { const yb = hOf(f) + FLOOR; if (yb < y1 - 0.2) strip(yb - 0.22, yb, 0.2, trim, CO); }
          if (hi && R() < 0.6) for (let f = 0; f < nF; f++) strip(hOf(f) + yh + 0.08, hOf(f) + yh + 0.15, 0.62, trim, CO); } // sun-shade blades above the windows
        strip(y1 - 0.5, y1, 0.32, cap, CO);
      }
      // ---- balconies (art-deco / beach and mid-rise white blocks, street faces only) ----
      if (hi && look === 'deco' && street && nF >= 3 && room >= 2.8 && p.y1 <= 36 && R() < 0.85 && !e.noBalc) {
        const wC = R() < 0.55 ? 1 : 2, stride = wC + 1 + (R() < 0.4 ? 1 : 0), fl0 = Math.max(first ? 1 : 0, 0), stepF = R() < 0.5 ? 1 : 2, dep = Math.min(1.3, room - 2.0), railC = mixc(pal.trim, 0xffffff, 0.4);
        for (let k = 1 + Math.floor(R() * 2); k + wC <= nCells - 1; k += stride) {
          const sb = L - (2 * k + 0.15), sa = L - (2 * (k + wC) - 0.15); let n = 0, ytop = 0, yfirst = 0; if (R() < 0.18) continue;
          for (let f = fl0; f < nF - 1; f += stepF) { const yb = hOf(f); if (overlap(sa, sb, yb, yb + 1.4)) continue; n++; yfirst = yfirst || yb + 0.1; ytop = yb + 1.3;
            bx(sa, sb, yb + 0.1, yb + 0.28, -0.05, dep, trim, PL, 0, FH); bx(sa, sb, yb + 0.28, yb + 0.3, dep - 0.06, dep - 0.02, trim, ME, 0, 16);
            for (const sx of [sa + 0.3, sb - 0.3]) bx(sx - 0.09, sx + 0.09, yb - 0.1, yb + 0.1, -0.05, dep * 0.6, trim, PL, 0, FH); // corbel brackets carry each slab from below
            wq(sa, sb, yb + 0.3, yb + 1.3, dep - 0.03, ATLAS.rail, railC, 0, relDB, true);
            for (const sx of [sa, sb]) { const a = T(sx), n2 = [e.tx, 0, e.tz]; for (const kk of [1, -1]) relDB.quad([a[0], yb + 0.3, a[1]], [a[0] + e.nx * dep, yb + 0.3, a[1] + e.nz * dep], [a[0] + e.nx * dep, yb + 1.3, a[1] + e.nz * dep], [a[0], yb + 1.3, a[1]], [n2[0] * kk, 0, n2[2] * kk], ATLAS.rail, railC); }
            if (hi && R() < 0.5) { const c = T((sa + sb) / 2 + (R() - 0.5) * (sb - sa) * 0.5); leafCard(fineDB, c[0] + e.nx * (dep * 0.6), yb + 0.28, c[1] + e.nz * (dep * 0.6), 0.8 + R() * 0.4, R() < 0.5 ? ATLAS.flower : ATLAS.leaf, K(0xffffff), R); }
          }
          if (n) { if (R() < 0.3) bx((sa + sb) / 2 - 0.12, (sa + sb) / 2 + 0.12, yfirst - 0.2, yfirst - 0.02, 0.2, 0.44, K(0xffd9a0), S_, 1.4, FB);
            const c0 = T(sa), c1 = T(sb), ex = [c0[0], c1[0], c0[0] + e.nx * dep, c1[0] + e.nx * dep], ez = [c0[1], c1[1], c0[1] + e.nz * dep, c1[1] + e.nz * dep]; grid.add({ src: 'bld', x0: Math.min(...ex), x1: Math.max(...ex), z0: Math.min(...ez), z1: Math.max(...ez), y0: Math.max(3.4, yfirst), y1: ytop, type: 'prop' }); }
        }
      }
      // ---- brick and deco: bay windows (lit, independent of the facade shader) on street faces ----
      if (hi && (look === 'brick' || (look === 'deco' && st.id !== 'white')) && street && nF >= 4 && room >= 3.4 && !e.noBay && R() < 0.5) {
        const n = Math.min(3, Math.max(1, Math.floor((L - 4) / 7))), f0 = Math.max(p.f0 === 0 ? 2 : 0, Math.floor(R() * 2) + (p.f0 === 0 ? 2 : 0)); let placed = 0;
        for (let i = 0; i < n; i++) { const bs = L * (i + 0.5) / n + (R() - 0.5) * 1.0, hw = 1.6, f1 = Math.min(p.f1 - 1, f0 + 2 + Math.floor(R() * 2)); if (f1 <= f0 || bs - hw < 0.8 || bs + hw > L - 0.8) continue;
          const ya = hOf(f0), yb = hOf(f1); if (overlap(bs - hw, bs + hw, ya, yb)) continue; placed++; bay(B, rec, e, bs, hw, ya, yb, 0.95, T, relDB, R, trim, hOf, f0, f1, grid); }
        if (placed) e.noBalc = true;
      }
      // ---- fine tier: wall clutter ----
      if (hi || B.q === 'med') {
        if (!escDone.v && first && escapeSide === side && onPlane && nF >= 3 && room >= 2.0 && L >= 8 && !(rec.poi)) { // fire escape (ground-based: its drop ladder reaches down to the first floor)
          for (let tries = 0; tries < 6 && !escDone.v; tries++) { const w = 3.2, sc = lerp(2.2 + w / 2, L - 2.2 - w / 2, R()), sa = sc - w / 2, sb = sc + w / 2; if (overlap(sa, sb, 3.2, y1)) continue; escDone.v = true; fireEscape(B, rec, e, sa, sb, nF, p, T, fineDB, R, grid, first); e.occ.push([sa - 0.3, sb + 0.3, 3.2, y1, 0]); }
        }
        if (look !== 'glass') for (let f = first ? 1 : 0; f < nF; f++) {
          cells(1, nCells - 1, (k, s) => { // window clutter: AC units, flower boxes
            const yb = hOf(f); if (overlap(s - 0.6, s + 0.6, yb, yb + 2.8)) return; const r = R();
            if ((look === 'brick' || look === 'conc' || look === 'deco') && r < 0.065 * Qd && room > 1.2 && rec.dist !== 'downtown') { const dy = yb + 0.3; bx(s - 0.35, s + 0.35, dy, dy + 0.42, -0.02, 0.32, K(0xd6d8dc), ATLAS.vent, 0, FB, fineDB); bx(s - 0.4, s + 0.4, dy - 0.04, dy, 0.0, 0.34, K(0x6b6e75), ME, 0, 16 | 32, fineDB); }
            else if ((look === 'brick' || look === 'deco') && r < 0.11 && street && f <= 3 && room > 1.3) { const dy = yb + ys - 0.34; bx(s - 0.5, s + 0.5, dy, dy + 0.22, 0.02, 0.26, K(0x7a5a3c), PL, 0, FB | 16, fineDB); for (const o of [-0.3, 0, 0.3]) { const c = T(s + o); leafCard(fineDB, c[0] + e.nx * 0.14, dy + 0.18, c[1] + e.nz * 0.14, 0.5, ATLAS.flower, K(0xffffff), R); } }
          });
        }
        if (first && L >= 6 && (look !== 'glass' || R() < 0.3)) { // drainpipes at the ends of the wall
          // the metal atlas cell is already mid-grey and multiplies the vertex colour, so a near-black pipe went black on cream walls: pipes are tinted from the facade's fin colour instead
          const pipeC = mixc(pal.fin, 0x6b6f78, 0.45), clampC = mixc(pal.fin, 0x3a3d45, 0.6);
          for (const us of [0.34, L - 0.34]) if (R() < 0.7 && !overlap(L - us - 0.1, L - us + 0.1, 0.2, y1)) { bx(L - us - 0.06, L - us + 0.06, 0.15, y1 - 0.3, 0.1, 0.22, pipeC, ME, 0, FB, fineDB); for (let y = 1.5; y < y1 - 0.5; y += 3.6) bx(L - us - 0.09, L - us + 0.09, y, y + 0.1, 0.05, 0.25, clampC, ME, 0, FB, fineDB); }
        }
        if (first && !rec.poi && (look === 'brick' || look === 'conc' || rec.dist === 'industrial' || !street)) { // graffiti and posters on the lower wall
          const n = street ? (R() < 0.25 ? 1 : 0) : (R() < 0.8 ? 1 + (R() < 0.4 ? 1 : 0) : 0);
          for (let i = 0; i < n; i++) { const w = 1.6 + R() * 1.6, sa = 1.2 + R() * Math.max(0.1, L - 2.4 - w), ya = 0.55 + R() * 0.5; if (sa + w > L - 0.8 || overlap(sa - 0.2, sa + w + 0.2, ya, ya + 1.8)) continue; const mural = R() < 0.3; wq(sa, sa + w, ya, ya + w * 0.55, 0.025, mural ? ATLAS.tag[3] : ATLAS.tag[Math.floor(R() * 3)], K(0xffffff), 0, fineDB); e.occ.push([sa - 0.2, sa + w + 0.2, ya, ya + w * 0.55 + 0.2, 0]); }
          if (R() < 0.45) { const np = 2 + Math.floor(R() * 3), sa = 1.2 + R() * Math.max(0.1, L - 2.4 - np * 0.75); if (sa + np * 0.75 < L - 0.8 && !overlap(sa, sa + np * 0.75, 1.0, 2.4)) for (let i = 0; i < np; i++) wq(sa + i * 0.75, sa + i * 0.75 + 0.62, 1.2 + R() * 0.3, 2.2 + R() * 0.2, 0.02, ATLAS.poster[Math.floor(R() * 4)], K(0xffffff), 0, fineDB); }
        }
        if (first && rec.dist === 'industrial' && !street && R() < 0.5 && L > 9) { // loading dock door and a pipe run
          const w = 3.2, sa = lerp(1.5, L - 1.5 - w, R()); if (!overlap(sa, sa + w, 0, 3.8)) { bx(sa - 0.15, sa + w + 0.15, 0.15, 3.65, -0.05, 0.1, dark, ME, 0, FH, fineDB); wq(sa, sa + w, 0.15, 3.5, 0.06, ATLAS.shutter, K(0xb8b2a4), 0, fineDB); bx(sa - 0.2, sa + w + 0.2, 3.65, 3.8, 0, 0.35, K(0xd9b43a), S_, 0, FH, fineDB); e.occ.push([sa - 0.3, sa + w + 0.3, 0, 3.9, 0]); }
          for (const yy of [4.6, 5.0]) strip(yy, yy + 0.14, 0.34, K(0x6f7075), ME, 0, L, 0);
        }
      }
    }
  });
  rec.relTris = (relDB.n - n0) / 3; rec.fineTris = (fineDB.n - f0n) / 3;
}

// canted bay window: three lit window panels per floor, spandrels, a slab on top and underneath; one collision box (it starts above 3.4 m, people pass under)
function bay(B, rec, e, bs, hw, ya, yb, dep, T, db, R, trim, hOf, f0, f1, grid) {
  const fw = hw * 0.55, pan = [[bs - hw, bs - fw, 0, dep], [bs - fw, bs + fw, dep, dep], [bs + fw, bs + hw, dep, 0]], lit = R() < 0.55 ? K(R() < 0.6 ? 0xffd9a0 : 0xd8ecff) : null, unlit = K(0x56677f), sp = mixc(rec.pal.fin, 0xffffff, 0.15);
  const Pt = (s, o, y) => { const c = T(s); return [c[0] + e.nx * o, y, c[1] + e.nz * o]; };
  for (let f = f0; f < f1; f++) { const y = hOf(f);
    for (const [s0, s1, o0, o1] of pan) { const A = Pt(s0, o0, y + 0.45), Bp = Pt(s1, o1, y + 0.45), C = Pt(s1, o1, y + 2.75), D = Pt(s0, o0, y + 2.75), vx = Bp[0] - A[0], vz = Bp[2] - A[2], l = Math.hypot(vx, vz), n = [vz / l, 0, -vx / l];
      db.quad(A, Bp, C, D, n, ATLAS.win, lit && ((f + Math.floor(s0)) & 1) === 0 || (lit && R() < 0.5) ? lit : unlit, lit ? 0.9 : 0);
      db.quad(Pt(s0, o0, y), Pt(s1, o1, y), Pt(s1, o1, y + 0.45), Pt(s0, o0, y + 0.45), n, S_, sp); db.quad(Pt(s0, o0, y + 2.75), Pt(s1, o1, y + 2.75), Pt(s1, o1, y + FLOOR), Pt(s0, o0, y + FLOOR), n, S_, sp);
    }
  }
  const outline = pan.map(q => { const c = T(q[0]); return [c[0] + e.nx * q[2], c[1] + e.nz * q[2]]; }); const c3 = T(pan[2][1]); outline.push([c3[0] + e.nx * pan[2][3], c3[1] + e.nz * pan[2][3]]);
  const topC = mixc(rec.pal.cap, 0x55585e, 0.4); db.poly(outline, yb + FLOOR + 0.05, topC, CO, 0, 1); db.poly(outline, ya, trim, PL, 0, -1);
  const xs = outline.map(q => q[0]), zs = outline.map(q => q[1]); grid.add({ src: 'bld', x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: Math.max(ya, 3.4), y1: yb + FLOOR + 0.05, type: 'prop' });
}
// zig-zag fire escape: grated landings with rails, stair flights between them, a drop ladder; steel colour, merged into the fine tier
function fireEscape(B, rec, e, sa, sb, nF, p, T, db, R, grid, first) {
  const dep = 0.95, steel = K(0x33373d), n3 = [e.nx, 0, e.nz], base = p.y0, mid = (sa + sb) / 2, W = sb - sa, levels = [];
  const Pt = (s, o, y) => { const c = T(s); return [c[0] + e.nx * o, y, c[1] + e.nz * o]; };
  for (let f = first ? 1 : 0; f < nF; f++) levels.push(base + f * FLOOR + 0.4); if (!levels.length) return;
  levels.forEach((y, i) => {
    for (const k of [1, -1]) db.quad(Pt(sa, 0.02, y), Pt(sb, 0.02, y), Pt(sb, dep, y), Pt(sa, dep, y), [0, k, 0], ATLAS.grate, steel);
    const c = T(mid); db.obox(c[0] + e.nx * dep, c[1] + e.nz * dep, e.tx, e.tz, W / 2, 0.03, y - 0.08, y + 0.03, steel, ME, 0, 31);
    for (const k of [1, -1]) { db.quad(Pt(sa, dep, y + 0.03), Pt(sb, dep, y + 0.03), Pt(sb, dep, y + 1.05), Pt(sa, dep, y + 1.05), [n3[0] * k, 0, n3[2] * k], ATLAS.rail, steel); for (const s of [sa, sb]) { const a = T(s); db.quad([a[0], y + 0.03, a[1]], [a[0] + e.nx * dep, y + 0.03, a[1] + e.nz * dep], [a[0] + e.nx * dep, y + 1.05, a[1] + e.nz * dep], [a[0], y + 1.05, a[1]], [e.tx * k, 0, e.tz * k], ATLAS.rail, steel); } }
    if (i + 1 < levels.length) { const up = levels[i + 1], left = i % 2 === 0, s0 = left ? sa + 0.15 : sb - 0.15, s1 = left ? sb - 0.15 : sa + 0.15;
      for (const k of [1, -1]) { db.quad(Pt(s0, dep - 0.7, y), Pt(s0, dep - 0.08, y), Pt(s1, dep - 0.08, up), Pt(s1, dep - 0.7, up), [0, k, 0], ATLAS.grate, steel); db.quad(Pt(s0, dep, y), Pt(s1, dep, up), Pt(s1, dep, up + 1.0), Pt(s0, dep, y + 1.0), [n3[0] * k, 0, n3[2] * k], ATLAS.rail, steel); }
    }
  });
  const y0 = levels[0], lc = T(sa + 0.55); // drop ladder: two rails and rungs from the lowest landing down to 3.3 m
  for (const o of [-0.22, 0.22]) { const c = T(sa + 0.55 + o); db.box(c[0] + e.nx * 0.16 - 0.025, 3.3, c[1] + e.nz * 0.16 - 0.025, c[0] + e.nx * 0.16 + 0.025, y0, c[1] + e.nz * 0.16 + 0.025, steel, ME, 0, 15); }
  for (let y = 3.5; y < y0; y += 0.3) db.obox(lc[0] + e.nx * 0.16, lc[1] + e.nz * 0.16, e.tx, e.tz, 0.22, 0.02, y, y + 0.03, steel, ME, 0, 8 | 16);
  const a = T(sa), b = T(sb), xs = [a[0], b[0], a[0] + e.nx * dep, b[0] + e.nx * dep], zs = [a[1], b[1], a[1] + e.nz * dep, b[1] + e.nz * dep];
  grid.add({ src: 'bld', x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: 3.3, y1: levels[levels.length - 1] + 1.1, type: 'prop' });
}

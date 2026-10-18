import * as THREE from '../vendor/three.module.min.js';
import { CITY } from './config.js';
import { mulberry, clamp } from './utils.js';

// Neon Coast, plants and street lamps (release 3, W1). Two systems live here so that world.js only has to call them:
//  Flora: every tree, palm, shrub, hedge, flower bed, tuft of grass, pot and wall vine. One 2048 px procedural atlas, ONE shared material (wind sway,
//         sun backlight, wet gloss and a dithered far fade are patched into it), chunked InstancedMeshes, placement by rules with a seeded RNG.
//  Lamps: cobra LED heads, sodium heads, classic double lanterns, mast lights, bollards, string lights and neon tubes. Every light source owns one
//         texel of a state texture (colour x level); lens glow, halo sprites, ground pools, volumetric cones and wet-road streaks all read that texel,
//         so a lamp switches on, warms up, flickers or stays dark in exactly one place and the PointLight count of the scene never changes.
const { road, pitch, gridX, gridZ } = CITY;
const HALF = road / 2;
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color(), _c2 = new THREE.Color();
// a point of interest's frontage: the storefront span plus 3 m either side, from the facade out to 7 m (trees and lamps keep off it, so no trunk or post cuts a sign)
const frontOf = p => [p.bx0 - 3, p.bx1 + 3, p.bz0 - 7, p.bz0 + 1];
const inFront = (fr, x, z, m = 0) => x > fr[0] - m && x < fr[1] + m && z > fr[2] - m && z < fr[3] + m;
const hash2 = (x, z) => { let h = Math.imul(Math.floor(x * 7.31) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(Math.floor(z * 5.17) + 0x1234567, 0xc2b2ae35); h ^= h >>> 13; h = Math.imul(h, 0x27d4eb2f); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
const vnoise = (x, z, cell) => { const fx = x / cell, fz = z / cell, ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz, sx = tx * tx * (3 - 2 * tx), sz = tz * tz * (3 - 2 * tz); return lerp(lerp(hash2(ix, iz), hash2(ix + 1, iz), sx), lerp(hash2(ix, iz + 1), hash2(ix + 1, iz + 1), sx), sz); }; // smooth 0..1 noise on a lattice of `cell` metres: clumps and bare patches
const parseCol = s => { const n = parseInt(s.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixCol = (a, b, t) => { const A = parseCol(a), B = parseCol(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; };
const lin = hex => { _c.setHex(hex); return [_c.r, _c.g, _c.b]; }; // sRGB hex -> linear rgb (vertex colours are linear)

// ======================================================================================
//  Plant atlas
// ======================================================================================
// [id, width, height, colour of the transparent texels]. Bark cells wrap around a trunk (u) and run up it (v); leaf cells are alpha cut-outs.
const CELLS = [
  ['bCoco', 128, 768], ['bRoyal', 128, 768], ['bFan', 128, 768], ['bDate', 128, 768], ['bFicus', 128, 768], ['bPlane', 128, 768], ['bJac', 128, 768], ['bBamboo', 128, 768],
  ['frCoco', 256, 512, '#5f8f2c'], ['frRoyal', 256, 512, '#2f6a2a'], ['frDate', 192, 512, '#7b9a72'], ['frDead', 256, 512, '#8a6c40'], ['reed', 128, 512, '#7a9a40'],
  ['fan', 256, 256, '#5a8f30'], ['ficus', 256, 256, '#245a2b'], ['plane', 256, 256, '#5f9a35'], ['jacFol', 256, 256, '#3a7a3a'], ['jacBloom', 256, 256, '#6a55b0'],
  ['shGreen', 256, 256, '#245a28'], ['shHib', 256, 256, '#2d6a2c'], ['shBou', 256, 256, '#a01860'], ['shOle', 256, 256, '#3a7a3a'], ['shWhite', 256, 256, '#2f6a30'], ['shYel', 256, 256, '#3a7a30'],
  ['seaGrape', 256, 256, '#2f6a34'], ['bambooL', 256, 256, '#4f8a35'], ['ivy', 256, 256, '#2e6a30'], ['grass', 128, 256, '#4f8a2c'], ['grassDry', 128, 256, '#6e7a34'], ['grassDeep', 128, 256, '#244a1e'], ['dune', 128, 256, '#b0b060'],
  ['hedge', 128, 128], ['flRed', 128, 128], ['flYel', 128, 128], ['flPink', 128, 128], ['flWhite', 128, 128], ['flPurple', 128, 128], ['flOrange', 128, 128], ['petal', 64, 64, '#8a63d2'], ['solid', 16, 16],
];
function packCells() { // first-fit shelf packing in a 2048 square, tallest first
  const items = CELLS.map(([id, w, h, bg]) => ({ id, w, h, bg })).sort((a, b) => b.h - a.h), rows = [];
  for (const it of items) {
    let row = rows.find(r => it.h <= r.h && r.x + it.w <= 2048);
    if (!row) { const y = rows.length ? rows[rows.length - 1].y + rows[rows.length - 1].h + 4 : 0; row = { y, h: it.h, x: 0 }; rows.push(row); }
    it.x = row.x; it.y = row.y; row.x += it.w + 4;
  }
  return items;
}
function tile(ctx, W, seed, fn) { for (const dx of [-W, 0, W]) { ctx.save(); ctx.translate(dx, 0); fn(mulberry(seed)); ctx.restore(); } } // the same strokes three times, shifted: the cell wraps around a trunk
function leafPath(ctx, len, wid) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(wid * 0.6, -len * 0.2, wid * 0.7, -len * 0.7, 0, -len); ctx.bezierCurveTo(-wid * 0.7, -len * 0.7, -wid * 0.6, -len * 0.2, 0, 0); ctx.closePath(); }
function oneLeaf(ctx, x, y, rot, len, wid, c0, c1, rib, shine) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); leafPath(ctx, len, wid);
  const g = ctx.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fill();
  if (shine) { ctx.fillStyle = shine; ctx.beginPath(); ctx.ellipse(wid * 0.22, -len * 0.55, wid * 0.14, len * 0.3, 0.1, 0, TAU); ctx.fill(); }
  if (rib) { ctx.strokeStyle = rib; ctx.lineWidth = Math.max(0.7, len * 0.035); ctx.beginPath(); ctx.moveTo(0, -len * 0.04); ctx.lineTo(0, -len * 0.9); ctx.stroke(); }
  ctx.restore();
}
function flower5(ctx, x, y, rad, col, centre) { // five round petals around a centre dot
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * rad * 0.55, y + Math.sin(a) * rad * 0.55, rad * 0.5, rad * 0.42, a, 0, TAU); ctx.fill(); }
  ctx.fillStyle = centre; ctx.beginPath(); ctx.arc(x, y, rad * 0.25, 0, TAU); ctx.fill();
}
// scatter of leaves inside a disc: darker ones first, a few pale ones on top. mk(i) -> [len, wid, c0, c1] is the leaf recipe.
function leafDisc(ctx, r, cx, cy, R, n, rot0, rotSpread, mk, rib, shine) {
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = R * Math.pow(r(), 0.62), [len, wid, c0, c1] = mk(i / n); oneLeaf(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.95, rot0 + (r() - 0.5) * rotSpread + (r() < 0.5 ? 0 : Math.PI * 0.15), len, wid, c0, c1, rib, shine); }
}
function drawFrond(ctx, W, H, r, o) { // pinnate frond: rachis up the middle, leaflets in pairs. Canvas bottom is the base, canvas top the tip.
  const cx = W / 2, base = H - 3, top = 6, rx = t => cx + (o.bend || 0) * t * t;
  ctx.lineCap = 'round'; ctx.strokeStyle = o.rib; ctx.lineWidth = o.ribW; ctx.beginPath(); ctx.moveTo(cx, base);
  for (let k = 1; k <= 12; k++) { const t = k / 12; ctx.lineTo(rx(t), base - t * (base - top)); } ctx.stroke();
  for (let i = 0; i < o.n; i++) for (const side of [-1, 1]) {
    if (o.skip && r() < o.skip) continue;
    const t = clamp(o.t0 + (1 - o.t0) * (i + 0.5 + (r() - 0.5) * 0.7) / o.n, 0, 1), x = rx(t), y = base - t * (base - top);
    const L = o.len * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * t)), o.pow) * (0.86 + r() * 0.28) * (t > 0.96 ? 0.55 : 1);
    const ang = (o.a0 + (o.a1 - o.a0) * t + (r() - 0.5) * 9) * Math.PI / 180, sx = side * Math.sin(ang), sy = -Math.cos(ang);
    const ex = x + sx * L, ey = y + sy * L, mx = x + sx * L * (0.5 + o.curl), my = y + sy * L * (0.5 - o.curl * 0.6), w = o.w0 * (1 - 0.5 * t) * (0.8 + r() * 0.4);
    ctx.fillStyle = mixCol(o.c0, o.c1, clamp(t * 0.75 + r() * 0.3, 0, 1));
    ctx.beginPath(); ctx.moveTo(x, y - w * 0.45); ctx.quadraticCurveTo(mx, my - w * 0.5, ex, ey); ctx.quadraticCurveTo(mx, my + w * 0.5, x, y + w * 0.45); ctx.fill();
  }
}
function drawFan(ctx, W, H, r) { // fan palm blade: pleated wedges with split tips, hub at the bottom centre
  const cx = W / 2, cy = H - 12, R = H - 26, n = 34;
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + (-1.0 + 2.0 * i / n) * 1.05, a1 = -Math.PI / 2 + (-1.0 + 2.0 * (i + 1) / n) * 1.05, am = (a0 + a1) / 2, rr = R * (0.88 + r() * 0.12);
    const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(am) * rr, cy + Math.sin(am) * rr); g.addColorStop(0, i % 2 ? '#7aa83a' : '#5f9230'); g.addColorStop(0.6, i % 2 ? '#4f8f2c' : '#3f7a28'); g.addColorStop(1, i % 2 ? '#8db640' : '#6a9a35');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx + Math.cos(am) * 6, cy + Math.sin(am) * 6);
    ctx.lineTo(cx + Math.cos(a0) * rr * 0.97, cy + Math.sin(a0) * rr * 0.97); ctx.lineTo(cx + Math.cos(am) * rr * 0.86, cy + Math.sin(am) * rr * 0.86); ctx.lineTo(cx + Math.cos(a1) * rr * 0.97, cy + Math.sin(a1) * rr * 0.97); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,55,12,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * 10, cy + Math.sin(a0) * 10); ctx.lineTo(cx + Math.cos(a0) * rr * 0.95, cy + Math.sin(a0) * rr * 0.95); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,225,140,0.5)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(cx + Math.cos(am) * 14, cy + Math.sin(am) * 14); ctx.lineTo(cx + Math.cos(am) * rr * 0.8, cy + Math.sin(am) * rr * 0.8); ctx.stroke();
    for (let k = 0; k < 3; k++) { const ta = a0 + (a1 - a0) * (0.2 + k * 0.3); ctx.strokeStyle = 'rgba(150,190,80,0.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ta) * rr * 0.86, cy + Math.sin(ta) * rr * 0.86); ctx.lineTo(cx + Math.cos(ta + (r() - 0.5) * 0.1) * rr * (1.0 + r() * 0.06), cy + Math.sin(ta) * rr * (1.0 + r() * 0.06)); ctx.stroke(); }
  }
  ctx.fillStyle = '#c8d98a'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill();
}
function spray(ctx, x, y, rot, len, r, c0, c1) { // fern-like spray of tiny leaflets (jacaranda)
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = c0; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();
  const n = Math.floor(len / 6);
  for (let i = 1; i <= n; i++) { const t = i / n, l = 14 * (1 - t * 0.55); for (const s of [-1, 1]) { ctx.fillStyle = r() < 0.5 ? c0 : c1; ctx.beginPath(); ctx.ellipse(s * l * 0.5, -t * len, l * 0.5, 2.6, s * -0.5 + (r() - 0.5) * 0.3, 0, TAU); ctx.fill(); } }
  ctx.restore();
}
function drawBloom(ctx, r, cx, cy, R, n, cols) { // small trumpet blossoms in clusters
  for (let k = 0; k < n; k++) { const a = r() * TAU, d = R * Math.pow(r(), 0.7), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, col = cols[Math.floor(r() * cols.length)], rot = r() * TAU; ctx.fillStyle = col; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(-2, -1, 3.5, 1.6, 0, 0, TAU); ctx.fill(); ctx.restore(); }
}
function drawGrass(ctx, W, H, r, n, hMin, hMax, w0, c0, c1, lean) { // a fan of curved blades from the bottom centre
  for (let i = 0; i < n; i++) {
    const x0 = W / 2 + (r() - 0.5) * W * 0.34, h = hMin + (hMax - hMin) * r(), dx = ((i / n) - 0.5) * W * lean + (r() - 0.5) * 16, w = w0 * (0.7 + r() * 0.6);
    const g = ctx.createLinearGradient(0, H, 0, H - h); g.addColorStop(0, c0); g.addColorStop(1, mixCol(c1, r() < 0.2 ? '#d8d070' : c1, r()));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - w, H); ctx.quadraticCurveTo(x0 + dx * 0.25, H - h * 0.55, x0 + dx, H - h); ctx.quadraticCurveTo(x0 + dx * 0.25 + w * 0.5, H - h * 0.5, x0 + w, H); ctx.closePath(); ctx.fill();
  }
}
function lobed(ctx, x, y, rot, s, c0, c1) { // five-lobed (plane tree) leaf
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const g = ctx.createLinearGradient(0, 0, 0, -s); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0);
  const R = [0.72, 0.95, 1.12, 0.95, 0.72], A = [-1.15, -0.62, 0, 0.62, 1.15];
  for (let k = 0; k < 5; k++) { const a = A[k], rr = R[k] * s, px = Math.sin(a) * rr, py = -Math.cos(a) * rr, am = k < 4 ? (A[k] + A[k + 1]) / 2 : a; ctx.lineTo(px * 0.55, py * 0.55 * 0.85); ctx.lineTo(px, py); ctx.lineTo(Math.sin(am + 0.3) * s * 0.42, -Math.cos(am + 0.3) * s * 0.42); }
  ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(210,235,150,0.55)'; ctx.lineWidth = 0.9; for (const a of A) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * s * 0.85, -Math.cos(a) * s * 0.85); ctx.stroke(); } ctx.restore();
}

let ATLAS_DET = 1; const DN = n => Math.max(1, Math.round(n * ATLAS_DET)); // the low tier draws half the leaves, blades and flecks per cell: the atlas is a large part of its load time
const BARKS = {
  bCoco(ctx, W, H) { // ringed, fibrous, sun-bleached towards the top
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#c4ae88'); g.addColorStop(1, '#8c7858'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    tile(ctx, W, 11, r => { for (let k = 0; k < DN(360); k++) { const x = r() * W, y = r() * H, l = 12 + r() * 60; ctx.strokeStyle = r() < 0.5 ? 'rgba(40,28,18,0.2)' : 'rgba(225,205,165,0.16)'; ctx.lineWidth = 1 + r() * 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 3, y + l); ctx.stroke(); }
      for (let y = 4; y < H; y += 7 + r() * 3) { ctx.strokeStyle = 'rgba(46,32,20,0.6)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-4, y); for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, y + (r() - 0.5) * 2.4); ctx.stroke(); ctx.strokeStyle = 'rgba(236,216,172,0.3)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-4, y + 2.6); for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, y + 2.6 + (r() - 0.5) * 2); ctx.stroke(); } });
  },
  bRoyal(ctx, W, H) { // smooth pale grey with faint rings and a darker swollen base
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#cfc9ba'); g.addColorStop(0.7, '#bdb6a6'); g.addColorStop(1, '#8f8878'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    tile(ctx, W, 21, r => { for (let y = 10; y < H; y += 34 + r() * 8) { const gg = ctx.createLinearGradient(0, y - 5, 0, y + 6); gg.addColorStop(0, 'rgba(90,84,68,0)'); gg.addColorStop(0.45, 'rgba(90,84,68,0.5)'); gg.addColorStop(1, 'rgba(90,84,68,0)'); ctx.fillStyle = gg; ctx.fillRect(-2, y - 5, W + 4, 11); }
      for (let k = 0; k < DN(140); k++) { const x = r() * W, y = r() * H; ctx.strokeStyle = r() < 0.5 ? 'rgba(80,74,60,0.12)' : 'rgba(255,255,245,0.14)'; ctx.lineWidth = 1 + r(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 2, y + 20 + r() * 50); ctx.stroke(); } });
  },
  bFan(ctx, W, H) { // dense vertical fibres with the scars of old fronds
    ctx.fillStyle = '#a08a70'; ctx.fillRect(0, 0, W, H);
    tile(ctx, W, 31, r => { for (let k = 0; k < DN(420); k++) { const x = r() * W, y = r() * H; ctx.strokeStyle = ['rgba(40,30,22,0.3)', 'rgba(150,130,104,0.3)', 'rgba(95,80,64,0.35)'][k % 3]; ctx.lineWidth = 1 + r() * 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 4, y + 30 + r() * 120); ctx.stroke(); }
      for (let y = 14; y < H; y += 30 + r() * 10) { ctx.strokeStyle = 'rgba(30,22,16,0.5)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-4, y); ctx.quadraticCurveTo(W / 2, y + 7 + r() * 5, W + 4, y); ctx.stroke(); } });
  },
  bDate(ctx, W, H) { // diamond lattice of leaf bases
    ctx.fillStyle = '#6a4e30'; ctx.fillRect(0, 0, W, H);
    tile(ctx, W, 41, r => { const cw = 32, ch = 36; for (let row = -1; row * ch < H + ch; row++) for (let col = -1; col < 6; col++) { const x = col * cw + (row % 2 ? cw / 2 : 0), y = row * ch; const g = ctx.createLinearGradient(x, y - ch / 2, x + cw / 2, y + ch / 2); g.addColorStop(0, mixCol('#d0b484', '#a88a5c', r())); g.addColorStop(1, '#8a6c46'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - ch * 0.5 + 2); ctx.lineTo(x + cw * 0.5 - 2, y); ctx.lineTo(x, y + ch * 0.5 - 2); ctx.lineTo(x - cw * 0.5 + 2, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,20,12,0.55)'; ctx.lineWidth = 1.5; ctx.stroke(); } });
  },
  bFicus(ctx, W, H) { // smooth mottled grey-brown with lichen
    ctx.fillStyle = '#a89d8a'; ctx.fillRect(0, 0, W, H);
    tile(ctx, W, 51, r => { for (let k = 0; k < DN(150); k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(54,46,36,0.2)' : 'rgba(190,180,158,0.2)'; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 5 + r() * 14, 10 + r() * 34, 0, 0, TAU); ctx.fill(); }
      for (let k = 0; k < DN(160); k++) { const x = r() * W, y = r() * H; ctx.strokeStyle = 'rgba(40,34,26,0.22)'; ctx.lineWidth = 1 + r() * 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 6, y + 20 + r() * 60); ctx.stroke(); }
      for (let k = 0; k < DN(40); k++) { ctx.fillStyle = 'rgba(128,156,92,0.28)'; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 3 + r() * 6, 3 + r() * 7, 0, 0, TAU); ctx.fill(); } });
  },
  bPlane(ctx, W, H) { // camouflage of flaking bark: cream, olive and grey patches
    ctx.fillStyle = '#b8b194'; ctx.fillRect(0, 0, W, H);
    tile(ctx, W, 61, r => { const cols = ['#d9d3b8', '#7b8559', '#a9a591', '#6b5a45', '#c9c2a4', '#8c9468']; for (let k = 0; k < DN(190); k++) { ctx.fillStyle = cols[Math.floor(r() * cols.length)]; ctx.globalAlpha = 0.8; ctx.save(); ctx.translate(r() * W, r() * H); ctx.rotate((r() - 0.5) * 0.8); ctx.beginPath(); ctx.ellipse(0, 0, 6 + r() * 16, 8 + r() * 22, 0, 0, TAU); ctx.fill(); ctx.restore(); } ctx.globalAlpha = 1;
      for (let k = 0; k < DN(90); k++) { const x = r() * W, y = r() * H; ctx.strokeStyle = 'rgba(40,34,24,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 8, y + 10 + r() * 30); ctx.stroke(); } });
  },
  bJac(ctx, W, H) { // dark furrowed bark
    ctx.fillStyle = '#85715f'; ctx.fillRect(0, 0, W, H);
    tile(ctx, W, 71, r => { for (let k = 0; k < DN(34); k++) { const x = r() * W; ctx.strokeStyle = 'rgba(26,19,14,0.75)'; ctx.lineWidth = 2.5 + r() * 3; ctx.beginPath(); ctx.moveTo(x, -4); for (let y = 0; y <= H + 20; y += 24) ctx.lineTo(x + Math.sin(y * 0.05 + k) * 4 + (r() - 0.5) * 3, y); ctx.stroke(); ctx.strokeStyle = 'rgba(150,128,106,0.3)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 4, -4); for (let y = 0; y <= H + 20; y += 24) ctx.lineTo(x + 4 + Math.sin(y * 0.05 + k) * 4, y); ctx.stroke(); } });
  },
  bBamboo(ctx, W, H) { // green culm with pale nodes
    for (let y = 0, i = 0; y < H; y += 64, i++) { const g = ctx.createLinearGradient(0, y, 0, y + 64); g.addColorStop(0, '#9aae3e'); g.addColorStop(0.5, '#7fa23a'); g.addColorStop(1, '#8aa63c'); ctx.fillStyle = g; ctx.fillRect(0, y, W, 64); ctx.fillStyle = '#3e5016'; ctx.fillRect(0, y, W, 3); ctx.fillStyle = 'rgba(240,240,170,0.55)'; ctx.fillRect(0, y + 3, W, 4); }
    tile(ctx, W, 81, r => { for (let k = 0; k < DN(90); k++) { const x = r() * W, y = r() * H; ctx.strokeStyle = r() < 0.5 ? 'rgba(40,70,20,0.3)' : 'rgba(255,255,200,0.2)'; ctx.lineWidth = 1 + r() * 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 10 + r() * 40); ctx.stroke(); } });
  },
};
const FLOWER_COLS = { flRed: ['#e0243a', '#ff4458', '#b3122a'], flYel: ['#ffd23a', '#ffe66b', '#f2b705'], flPink: ['#ff6fa5', '#ff9fc4', '#e63b86'], flWhite: ['#ffffff', '#f1efe6', '#dcd6c7'], flPurple: ['#8e5be0', '#b392f0', '#6a3fc2'], flOrange: ['#ff8a1f', '#ffb347', '#e8590c'] };
const LEAVES = { // id -> painter(ctx, W, H, r)
  frCoco: (c, W, H, r) => drawFrond(c, W, H, r, { n: 66, len: W * 0.47, pow: 0.6, a0: 64, a1: 40, curl: 0.12, w0: 9.5, t0: 0.12, c0: '#356b24', c1: '#a2c44c', rib: '#bcc06e', ribW: 3.2, bend: 5 }),
  frRoyal: (c, W, H, r) => drawFrond(c, W, H, r, { n: 80, len: W * 0.45, pow: 0.55, a0: 52, a1: 28, curl: 0.06, w0: 8, t0: 0.1, c0: '#1d5a22', c1: '#58a038', rib: '#a8b868', ribW: 3.4, bend: -4 }),
  frDate: (c, W, H, r) => drawFrond(c, W, H, r, { n: 70, len: W * 0.43, pow: 0.5, a0: 42, a1: 22, curl: 0.0, w0: 7, t0: 0.1, c0: '#587f5e', c1: '#aac4a0', rib: '#cfcb9c', ribW: 4, bend: 0 }),
  frDead: (c, W, H, r) => drawFrond(c, W, H, r, { n: 40, len: W * 0.42, pow: 0.7, a0: 72, a1: 54, curl: 0.2, w0: 8.5, t0: 0.08, c0: '#6a5436', c1: '#bba062', rib: '#8a7048', ribW: 3.4, bend: 8, skip: 0.22 }),
  fan: (c, W, H, r) => drawFan(c, W, H, r),
  ficus(c, W, H, r) { leafDisc(c, r, W / 2, H / 2, W * 0.4, 96, -1.57, 6.28, k => [40 + r() * 12, 21 + r() * 5, mixCol('#1c4f26', '#2c7a36', k), mixCol('#3f8f3e', '#76bb55', k)], 'rgba(200,230,150,0.55)', 'rgba(220,255,200,0.25)'); },
  plane(c, W, H, r) { for (let i = 0; i < DN(64); i++) { const a = r() * TAU, d = W * 0.4 * Math.pow(r(), 0.62), k = r(); lobed(c, W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, r() * TAU, 30 + r() * 12, mixCol('#4a8a2c', '#6aa838', k), mixCol('#8cc23e', '#b9d255', k)); } },
  jacFol(c, W, H, r) { for (let i = 0; i < DN(22); i++) { const a = r() * TAU, d = W * 0.3 * r(); spray(c, W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d + 30, a + Math.PI / 2 + (r() - 0.5), 60 + r() * 40, r, '#2c6e34', '#58a448'); } },
  jacBloom(c, W, H, r) { for (let i = 0; i < DN(12); i++) { const a = r() * TAU, d = W * 0.3 * r(); spray(c, W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d + 30, a + Math.PI / 2 + (r() - 0.5), 50 + r() * 40, r, '#2c6e34', '#58a448'); } for (let i = 0; i < DN(20); i++) { const a = r() * TAU, d = W * 0.36 * Math.sqrt(r()); drawBloom(c, r, W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, 20, 9, ['#8e6bd6', '#a98be8', '#6f4fc0', '#b9a0f0']); } },
  shGreen(c, W, H, r) { leafDisc(c, r, W / 2, H / 2, W * 0.4, 150, -1.57, 6.28, k => [24 + r() * 8, 13 + r() * 4, mixCol('#16401c', '#245a28', k), mixCol('#3a8a38', '#6aac48', k)], 'rgba(190,225,150,0.4)'); },
  shHib(c, W, H, r) { leafDisc(c, r, W / 2, H / 2, W * 0.4, 110, -1.57, 6.28, k => [30 + r() * 8, 17 + r() * 4, mixCol('#16401c', '#25602c', k), mixCol('#3a8a38', '#5aa646', k)], 'rgba(190,225,150,0.4)'); for (let i = 0; i < DN(12); i++) { const a = r() * TAU, d = W * 0.34 * Math.sqrt(r()); const x = W / 2 + Math.cos(a) * d, y = H / 2 + Math.sin(a) * d; flower5(c, x, y, 16 + r() * 5, mixCol('#d4142c', '#ff3a52', r()), '#ffd23a'); } },
  shBou(c, W, H, r) { leafDisc(c, r, W / 2, H / 2, W * 0.4, 50, -1.57, 6.28, k => [28, 15, '#1c4a22', '#3f8a3a'], null); for (let i = 0; i < DN(190); i++) { const a = r() * TAU, d = W * 0.42 * Math.pow(r(), 0.6), x = W / 2 + Math.cos(a) * d, y = H / 2 + Math.sin(a) * d, s = 7 + r() * 5; c.fillStyle = ['#d81b72', '#ff2f92', '#b5106a', '#ff5cae'][Math.floor(r() * 4)]; c.save(); c.translate(x, y); c.rotate(r() * TAU); c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 1.1, -s * 0.2, s * 0.5, s * 0.8); c.quadraticCurveTo(0, s * 0.3, -s * 0.5, s * 0.8); c.quadraticCurveTo(-s * 1.1, -s * 0.2, 0, -s); c.fill(); c.restore(); } },
  shOle(c, W, H, r) { leafDisc(c, r, W / 2, H / 2, W * 0.4, 90, -1.57, 6.28, k => [46 + r() * 10, 9 + r() * 2, mixCol('#1c4a22', '#2c6a30', k), mixCol('#4a9a40', '#7ab852', k)], 'rgba(210,235,170,0.5)'); for (let i = 0; i < 8; i++) { const a = r() * TAU, d = W * 0.3 * Math.sqrt(r()), x = W / 2 + Math.cos(a) * d, y = H / 2 + Math.sin(a) * d; for (let k = 0; k < 6; k++) flower5(c, x + (r() - 0.5) * 30, y + (r() - 0.5) * 26, 9 + r() * 3, ['#ff7fb0', '#ff5c9a', '#ffb3cf'][k % 3], '#fff0a0'); } },
  shWhite(c, W, H, r) { leafDisc(c, r, W / 2, H / 2, W * 0.4, 110, -1.57, 6.28, k => [28 + r() * 8, 14 + r() * 4, mixCol('#16401c', '#25602c', k), mixCol('#3a8a38', '#62ae4c', k)], 'rgba(190,225,150,0.4)', 'rgba(220,255,200,0.2)'); for (let i = 0; i < DN(26); i++) { const a = r() * TAU, d = W * 0.36 * Math.sqrt(r()); flower5(c, W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, 10 + r() * 4, r() < 0.5 ? '#ffffff' : '#fff3d8', '#f2c230'); } },
  shYel(c, W, H, r) { leafDisc(c, r, W / 2, H / 2, W * 0.4, 100, -1.57, 6.28, k => [26 + r() * 8, 15 + r() * 4, mixCol('#16401c', '#2a6a2c', k), mixCol('#3f8f3a', '#6aac48', k)], 'rgba(190,225,150,0.4)'); for (let i = 0; i < DN(14); i++) { const a = r() * TAU, d = W * 0.34 * Math.sqrt(r()), x = W / 2 + Math.cos(a) * d, y = H / 2 + Math.sin(a) * d; for (let k = 0; k < DN(14); k++) { c.fillStyle = mixCol('#ff8a1f', '#ffe14a', r()); c.beginPath(); c.arc(x + (r() - 0.5) * 24, y + (r() - 0.5) * 20, 3 + r() * 2.2, 0, TAU); c.fill(); } } },
  seaGrape(c, W, H, r) { for (let i = 0; i < DN(48); i++) { const a = r() * TAU, d = W * 0.38 * Math.pow(r(), 0.6), x = W / 2 + Math.cos(a) * d, y = H / 2 + Math.sin(a) * d, s = 24 + r() * 14, red = r() < 0.12; c.save(); c.translate(x, y); c.rotate(r() * TAU); const g = c.createRadialGradient(0, -s * 0.3, 2, 0, -s * 0.3, s); g.addColorStop(0, red ? '#b8503a' : '#5aa044'); g.addColorStop(1, red ? '#7a2418' : '#2a6a30'); c.fillStyle = g; c.beginPath(); c.ellipse(0, -s * 0.45, s * 0.52, s * 0.5, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(225,240,170,0.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.9); for (let k = -1; k <= 1; k += 2) { c.moveTo(0, -s * 0.35); c.lineTo(k * s * 0.3, -s * 0.6); } c.stroke(); c.restore(); } },
  bambooL(c, W, H, r) { for (let i = 0; i < DN(15); i++) { const x = r() * W, y = H * (0.25 + r() * 0.6), rot = (r() - 0.5) * 2.6; c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = '#6a8a30'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -52); c.stroke(); for (let k = 0; k < 5; k++) { const yy = -8 - k * 9, a = (k % 2 ? 1 : -1) * (0.5 + r() * 0.35); oneLeaf(c, 0, yy, a, 46 + r() * 14, 7 + r() * 2, '#2f6e2a', '#7ab648', 'rgba(220,240,160,0.4)'); } oneLeaf(c, 0, -52, 0, 40, 7, '#2f6e2a', '#7ab648', null); c.restore(); } },
  ivy(c, W, H, r) { for (let i = 0; i < DN(70); i++) { const a = r() * TAU, d = W * 0.42 * Math.pow(r(), 0.55), k = r(); lobed(c, W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d * 0.95, r() * TAU, 22 + r() * 14, mixCol('#1c4a22', '#2c6a30', k), mixCol('#3f8f3a', '#74b552', k)); } },
  reed(c, W, H, r) { drawGrass(c, W, H, r, 10, H * 0.55, H * 0.94, 6.5, '#4a6a22', '#a8bc58', 0.55); for (let i = 0; i < 3; i++) { const x = W * (0.3 + 0.2 * i) + (r() - 0.5) * 8, y = H * (0.05 + r() * 0.08); c.fillStyle = '#8a6a44'; c.beginPath(); c.ellipse(x, y + 16, 6, 18, (i - 1) * 0.2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(200,170,120,0.8)'; c.lineWidth = 1; for (let k = 0; k < DN(12); k++) { c.beginPath(); c.moveTo(x, y + 30); c.lineTo(x + (r() - 0.5) * 18, y + 2 + r() * 10); c.stroke(); } } },
  grass: (c, W, H, r) => drawGrass(c, W, H, r, 34, H * 0.4, H * 0.97, 6.5, '#2c5a1c', '#6fa032', 0.8), // darker, olive tips: the lime ones read as a flat neon lawn
  grassDry: (c, W, H, r) => drawGrass(c, W, H, r, 30, H * 0.4, H * 0.95, 6.5, '#5e5f24', '#b9a456', 0.8), // dry-yellow clumps (a sub-variant of the same cell size)
  grassDeep: (c, W, H, r) => drawGrass(c, W, H, r, 36, H * 0.45, H * 0.97, 6.5, '#1d4418', '#4a7f2a', 0.8), // deep shaded green
  dune: (c, W, H, r) => drawGrass(c, W, H, r, 16, H * 0.6, H * 0.98, 5.5, '#7a8a38', '#e0d890', 1.1),
  hedge(c, W, H, r) { c.fillStyle = '#17401c'; c.fillRect(0, 0, W, H); for (let i = 0; i < DN(520); i++) { const k = r(); oneLeaf(c, r() * W, r() * H, r() * TAU, 11 + r() * 6, 6 + r() * 3, mixCol('#16401c', '#2a6a2c', k), mixCol('#3f8f3a', '#7ab852', k), null); } },
  petal(c, W, H, r) { for (let i = 0; i < DN(26); i++) { c.fillStyle = ['#8e6bd6', '#a98be8', '#7a58c8'][i % 3]; c.save(); c.translate(r() * W, r() * H); c.rotate(r() * TAU); c.beginPath(); c.ellipse(0, 0, 4.5, 2.2, 0, 0, TAU); c.fill(); c.restore(); } },
  solid(c, W, H) { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); },
};
for (const id of Object.keys(FLOWER_COLS)) LEAVES[id] = (c, W, H, r) => { c.fillStyle = '#1a421f'; c.fillRect(0, 0, W, H); for (let i = 0; i < DN(80); i++) { const k = r(); oneLeaf(c, r() * W, r() * H, r() * TAU, 14 + r() * 8, 6 + r() * 3, mixCol('#16401c', '#2a6a2c', k), mixCol('#3f8f3a', '#6aac48', k), null); } const cols = FLOWER_COLS[id]; for (let i = 0; i < DN(120); i++) { const x = r() * W, y = r() * H, s = 3 + r() * 2.6; c.fillStyle = cols[Math.floor(r() * 3)]; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(x - s * 0.3, y - s * 0.3, s * 0.35, 0, TAU); c.fill(); } };

const _atlases = new Map(); // size -> atlas: at most two (1024 low, 2048 med / high), so a quality switch never redraws the cells again
// The plant atlas. size 2048 (high / med) or 1024 (low): the same drawing, scaled. Transparent texels get the cell's mid colour so bilinear / mip filtering never drags black into the leaf edges.
function plantAtlas(size) {
  if (_atlases.has(size)) return _atlases.get(size);
  ATLAS_DET = size < 2048 ? 0.5 : 1;
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const ctx = cv.getContext('2d'), k = size / 2048, cells = packCells(), byId = {};
  ctx.scale(k, k);
  for (const c of cells) {
    byId[c.id] = c; ctx.save(); ctx.translate(c.x, c.y); ctx.beginPath(); ctx.rect(0, 0, c.w, c.h); ctx.clip();
    if (BARKS[c.id]) BARKS[c.id](ctx, c.w, c.h); else LEAVES[c.id](ctx, c.w, c.h, mulberry([...c.id].reduce((h, ch) => Math.imul(h, 31) + ch.charCodeAt(0) | 0, 7)));
    ctx.restore();
  }
  const img = ctx.getImageData(0, 0, size, size), d = img.data;
  for (const c of cells) if (c.bg) { // fill the fully transparent texels with the cell colour (premultiplied canvases lose their RGB at alpha 0)
    const [r, g, b] = parseCol(c.bg), x0 = Math.floor(c.x * k), y0 = Math.floor(c.y * k), x1 = Math.min(size, Math.ceil((c.x + c.w) * k)), y1 = Math.min(size, Math.ceil((c.y + c.h) * k));
    for (let y = y0; y < y1; y++) for (let x = x0, o = (y * size + x0) * 4; x < x1; x++, o += 4) if (d[o + 3] === 0) { d[o] = r; d[o + 1] = g; d[o + 2] = b; }
  }
  const tex = new THREE.DataTexture(new Uint8Array(d.buffer.slice(0)), size, size, THREE.RGBAFormat); // rows top-first, so v = y / size (no flip)
  tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 8; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.flipY = false; tex.needsUpdate = true;
  const A = { size, tex, cell: id => { const c = byId[id], e = id[0] === 'b' && id.length > 3 && BARKS[id] ? 1.5 : 0; return { u0: (c.x + e) / 2048, u1: (c.x + c.w - e) / 2048, v0: c.y / 2048, v1: (c.y + c.h) / 2048 }; } };
  _atlases.set(size, A); return A;
}

// ======================================================================================
//  Plant material: ONE MeshStandardMaterial for the whole flora (atlas + vertex colours + instance tint)
// ======================================================================================
// aSway = (bend metres, flutter metres, kind, far multiplier). kind 0 bark / solid, 1 leaf, 2 grass, 3 petal. The sway is applied in WORLD space after the
// instance matrix, so a rotated instance still bends downwind. All plants share the FU uniforms (written by Flora.update / Flora.setEnv).
const FU = { fTime: { value: 0 }, fWind: { value: 0.4 }, fWindDir: { value: new THREE.Vector2(0.86, 0.51) }, fWet: { value: 0 }, fGlow: { value: 0 }, fSunDir: { value: new THREE.Vector3(0, 1, 0) }, fSunCol: { value: new THREE.Color(0, 0, 0) }, fFar: { value: 280 } };
function plantMaterial(tex) {
  const mat = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, alphaTest: 0.46, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, FU);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', () => `#include <common>
attribute vec4 aSway; attribute vec2 iUV; uniform float fTime, fWind, fFar; uniform vec2 fWindDir; varying float vKind; varying vec3 vWP; varying float vFar;`)
      .replace('#include <uv_vertex>', () => '#include <uv_vertex>\n#ifdef USE_MAP\n  vMapUv += iUV * step(0.5, aSway.z); // per-instance colour variant: shift to another atlas cell of the same size (leaf kinds only)\n#endif')
      .replace('#include <project_vertex>', () => `
vec4 mvPosition = vec4(transformed, 1.0); vec3 io = vec3(0.0); float isc = 1.0;
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition; io = vec3(instanceMatrix[3]); isc = length(vec3(instanceMatrix[0]));
#endif
float gust = 0.5 + 0.5 * sin(fTime * 0.55 - dot(io.xz, fWindDir) * 0.035 + sin(io.x * 0.011) * 2.0);
float amp = fWind * (0.45 + 0.75 * gust), ph = io.x * 0.37 + io.z * 0.23;
vec3 off = vec3(fWindDir.x, 0.0, fWindDir.y) * (aSway.x * amp * (1.0 + 0.3 * sin(fTime * 1.9 + ph)) * isc) + vec3(-fWindDir.y, 0.0, fWindDir.x) * (aSway.x * amp * 0.3 * sin(fTime * 1.3 + ph * 1.7) * isc);
float fl = aSway.y * (0.3 + amp) * isc;
off += fl * vec3(sin(fTime * 6.3 + ph * 3.0 + position.x * 5.1 + position.y * 2.1), 0.7 * sin(fTime * 8.1 + position.z * 4.7 + ph), cos(fTime * 7.2 + position.y * 3.7 + position.x * 2.9 + ph * 2.0));
mvPosition.xyz += off; vWP = mvPosition.xyz; vKind = aSway.z;
mvPosition = modelViewMatrix * mvPosition; vFar = smoothstep(fFar * aSway.w * 0.8, fFar * aSway.w, -mvPosition.z);
gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', () => `#include <common>
uniform float fWet, fGlow; uniform vec3 fSunDir; uniform vec3 fSunCol; varying float vKind; varying vec3 vWP; varying float vFar;`)
      .replace('#include <clipping_planes_fragment>', () => `#include <clipping_planes_fragment>
if (vFar > 0.002 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < vFar) discard; // dithered far fade`)
      .replace('#include <map_fragment>', () => `vec4 sampledDiffuseColor = texture2D(map, vMapUv, -1.0); // a mip bias keeps thin leaflets and blades above the alpha test at a distance
diffuseColor *= sampledDiffuseColor;`)
      .replace('#include <color_fragment>', () => `#include <color_fragment>
float leafK = step(0.5, vKind); diffuseColor.rgb *= 1.0 - fWet * 0.34 * (0.4 + 0.6 * leafK); // wet leaves and bark are darker`)
      .replace('#include <normal_fragment_begin>', () => `#include <normal_fragment_begin>
normal = normalize(vNormal); // authored normals (soft, outward) must not flip on the back of a card`)
      .replace('#include <roughnessmap_fragment>', () => `#include <roughnessmap_fragment>
roughnessFactor = mix(0.93, 0.82, leafK) * (1.0 - 0.55 * fWet); // and shinier`)
      .replace('#include <lights_fragment_end>', () => `#include <lights_fragment_end>
{ vec3 vdir = normalize(vWP - cameraPosition); float tr = pow(max(dot(vdir, fSunDir), 0.0), 2.4); float thin = leafK * (1.0 + 0.6 * step(1.5, vKind));
  reflectedLight.directDiffuse += diffuseColor.rgb * vec3(1.0, 1.1, 0.42) * fSunCol * tr * thin * 0.9; } // light through the leaf when you look towards the sun
vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); float under = clamp(0.55 - 0.45 * dot(normal, upV), 0.0, 1.0);
reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(1.0, 0.66, 0.36) * fGlow * (0.3 + 0.7 * under); // the glow of the city lights from below at night`);
  };
  mat.customProgramCacheKey = () => 'flora-v2';
  return mat;
}

// ======================================================================================
//  Geometry builder
// ======================================================================================
class PB { // indexed geometry with the extra aSway attribute
  constructor(H, K) { this.H = H; this.K = K; this.p = []; this.n = []; this.u = []; this.c = []; this.s = []; this.i = []; this.nv = 0; }
  bend(y) { const f = clamp(y / this.H, 0, 1); return f * f * this.H * this.K; }
  v(x, y, z, nx, ny, nz, u, v, col, fl, kind, far = 1) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.u.push(u, v); this.c.push(col[0], col[1], col[2]); this.s.push(this.bend(y), fl, kind, far); return this.nv++; }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.s, 4)); g.setIndex(new THREE.BufferAttribute(this.nv > 65535 ? new Uint32Array(this.i) : new Uint16Array(this.i), 1));
    g.computeBoundingSphere(); return g;
  }
}
const uvAt = (c, s, t) => [c.u0 + (c.u1 - c.u0) * s, c.v1 - (c.v1 - c.v0) * t];
const nrm3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
const rg = (r, a, b) => a + (b - a) * r();
// tapered tube along pts; the cell is painted for vMeters of tube length
function tube(pb, pts, rad, segs, cell, vMeters, col0, col1, fl = 0, kind = 0, far = 1) {
  const n = pts.length, rings = []; let len = 0;
  const a0 = pts[0], b0 = pts[n - 1]; let ax = b0[0] - a0[0], ay = b0[1] - a0[1], az = b0[2] - a0[2]; const al = Math.hypot(ax, ay, az) || 1; ay /= al; const rx = Math.abs(ay) > 0.9 ? 1 : 0, ry = Math.abs(ay) > 0.9 ? 0 : 1;
  for (let k = 0; k < n; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], p = pts[k];
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let e1x = ty * 0 - tz * ry, e1y = tz * rx - tx * 0, e1z = tx * ry - ty * rx; const el = Math.hypot(e1x, e1y, e1z) || 1; e1x /= el; e1y /= el; e1z /= el;
    const e2x = ty * e1z - tz * e1y, e2y = tz * e1x - tx * e1z, e2z = tx * e1y - ty * e1x;
    if (k > 0) len += Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1], p[2] - pts[k - 1][2]);
    const r = Array.isArray(rad) ? rad[k] : rad, t = k / (n - 1), col = [lerp(col0[0], col1[0], t), lerp(col0[1], col1[1], t), lerp(col0[2], col1[2], t)], ring = [];
    for (let j = 0; j <= segs; j++) {
      const q = j / segs * TAU, cs = Math.cos(q), sn = Math.sin(q), nx = e1x * cs + e2x * sn, ny = e1y * cs + e2y * sn, nz = e1z * cs + e2z * sn, [u, v] = uvAt(cell, j / segs, Math.min(1, len / vMeters));
      ring.push(pb.v(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, u, v, col, fl, kind, far));
    }
    rings.push(ring);
  }
  for (let k = 0; k < n - 1; k++) for (let j = 0; j < segs; j++) pb.quad(rings[k][j], rings[k + 1][j], rings[k + 1][j + 1], rings[k][j + 1]);
}
// curved, folded, double-sided frond strip: ring 0 is the base. pitch = angle above the horizon at the base, droop = how far the angle falls along the length.
function frond(pb, ox, oy, oz, yaw, pitch, L, W, droop, fold, roll, cell, cA, cB, segs = 7, fl = 0.16, kind = 1, far = 1) {
  const dx = Math.cos(yaw), dz = Math.sin(yaw), ds = L / segs; let px = ox, py = oy, pz = oz; const rings = [];
  for (let k = 0; k <= segs; k++) {
    const t = k / segs, a = pitch - droop * t * t - droop * 0.15 * t, ch = Math.cos(a), sh = Math.sin(a), tx = dx * ch, ty = sh, tz = dz * ch;
    const wx = -dz, wz = dx, cx_ = -tz * 0 + ty * wz, cy_ = tz * wx - tx * wz, cz_ = tx * 0 - ty * wx, rr = roll * t, c = Math.cos(rr), s = Math.sin(rr); // w = horizontal perpendicular rolled about the tangent
    const w2x = wx * c + cx_ * s, w2y = cy_ * s, w2z = wz * c + cz_ * s, half = W * 0.5;
    let n = nrm3(ty * w2z - tz * w2y, tz * w2x - tx * w2z, tx * w2y - ty * w2x); if (n[1] < 0) n = [-n[0], -n[1], -n[2]]; n = nrm3(n[0], n[1] + 0.55, n[2]);
    const col = [lerp(cA[0], cB[0], t), lerp(cA[1], cB[1], t), lerp(cA[2], cB[2], t)], row = [];
    for (let j = 0; j < 3; j++) { const sd = (j - 1), drop = Math.abs(sd) * fold * half; const [u, v] = uvAt(cell, j / 2, t); row.push(pb.v(px + w2x * half * sd, py + w2y * half * sd - drop, pz + w2z * half * sd, n[0], n[1], n[2], u, v, col, fl * t, kind, far)); }
    rings.push(row); px += tx * ds; py += ty * ds; pz += tz * ds;
  }
  for (let k = 0; k < segs; k++) for (let j = 0; j < 2; j++) pb.quad(rings[k][j], rings[k][j + 1], rings[k + 1][j + 1], rings[k + 1][j]);
}
// one flat card (centre c, half-axes a and b). With o.ctr the normals bend towards "away from ctr" (soft spherical shading of a crown); o.shade(x,y,z) multiplies the colour.
function card(pb, c, a, b, cell, col, o = {}) {
  const P = [[c[0] - a[0] - b[0], c[1] - a[1] - b[1], c[2] - a[2] - b[2]], [c[0] + a[0] - b[0], c[1] + a[1] - b[1], c[2] + a[2] - b[2]], [c[0] + a[0] + b[0], c[1] + a[1] + b[1], c[2] + a[2] + b[2]], [c[0] - a[0] + b[0], c[1] - a[1] + b[1], c[2] - a[2] + b[2]]];
  let fn = nrm3(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]); if (fn[1] < 0) fn = [-fn[0], -fn[1], -fn[2]];
  const fl = o.flip || 0, UV = [[0, 0], [1, 0], [1, 1], [0, 1]], ids = [];
  for (let i = 0; i < 4; i++) {
    let n = fn; const p = P[i];
    if (o.ctr) { const out = nrm3(p[0] - o.ctr[0], p[1] - o.ctr[1], p[2] - o.ctr[2]), sg = fn[0] * out[0] + fn[1] * out[1] + fn[2] * out[2] < 0 ? -1 : 1, w = o.sph ?? 0.75; n = nrm3(fn[0] * sg * (1 - w) + out[0] * w, fn[1] * sg * (1 - w) + out[1] * w, fn[2] * sg * (1 - w) + out[2] * w); } else n = nrm3(fn[0], fn[1] + (o.up ?? 0.5), fn[2]);
    const sh = o.shade ? o.shade(p[0], p[1], p[2]) : 1; let s = UV[(i + (fl & 3)) & 3][0], t = UV[(i + (fl & 3)) & 3][1]; if (fl & 4) s = 1 - s;
    const [u, v] = uvAt(cell, s, t); ids.push(pb.v(p[0], p[1], p[2], n[0], n[1], n[2], u, v, [col[0] * sh, col[1] * sh, col[2] * sh], o.fl ?? 0.08, o.kind ?? 1, o.far ?? 1));
  }
  pb.quad(ids[0], ids[1], ids[2], ids[3]);
}
function boxPB(pb, x0, y0, z0, x1, y1, z1, col, cell, far = 1, kind = 0) { // solid-colour box (cell 'solid' keeps the texel white so the vertex colour is the paint)
  const [u, v] = uvAt(cell, 0.5, 0.5), F = (nx, ny, nz, a, b, c, d) => { const ids = [a, b, c, d].map(p => pb.v(p[0], p[1], p[2], nx, ny, nz, u, v, col, 0, kind, far)); pb.quad(ids[0], ids[1], ids[2], ids[3]); };
  F(0, 1, 0, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]); F(0, 0, 1, [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1]); F(0, 0, -1, [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
  F(1, 0, 0, [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]); F(-1, 0, 0, [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]);
}
function lathe(pb, prof, segs, col, cell, far = 1, kind = 0, ox = 0, oy = 0, oz = 0) { // surface of revolution: prof = [[radius, y], ...] from the bottom up
  const [u, v] = uvAt(cell, 0.5, 0.5), rings = [];
  for (let k = 0; k < prof.length; k++) {
    const a = prof[Math.max(0, k - 1)], b = prof[Math.min(prof.length - 1, k + 1)], dr = b[0] - a[0], dy = b[1] - a[1], nl = Math.hypot(dr, dy) || 1, nr = dy / nl, ny = -dr / nl, ring = [];
    const sh = 0.85 + 0.15 * k / (prof.length - 1);
    for (let j = 0; j <= segs; j++) { const q = j / segs * TAU, cs = Math.cos(q), sn = Math.sin(q); ring.push(pb.v(ox + cs * prof[k][0], oy + prof[k][1], oz + sn * prof[k][0], cs * nr, ny, sn * nr, u, v, [col[0] * sh, col[1] * sh, col[2] * sh], 0, kind, far)); }
    rings.push(ring);
  }
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < segs; j++) pb.quad(rings[k][j], rings[k][j + 1], rings[k + 1][j + 1], rings[k + 1][j]);
}
function blob(pb, cx, cy, cz, rx, ry, rz, col, cell, segs = 6, far = 1, kind = 0) { // small low-poly ellipsoid (coconuts, dates, topiary)
  const [u, v] = uvAt(cell, 0.5, 0.5), rings = [];
  for (let k = 0; k <= segs - 2; k++) { const a = k / (segs - 2) * Math.PI, y = Math.cos(a), rr = Math.sin(a), ring = []; for (let j = 0; j <= segs; j++) { const q = j / segs * TAU, nx = Math.cos(q) * rr, nz = Math.sin(q) * rr; ring.push(pb.v(cx + nx * rx, cy + y * ry, cz + nz * rz, nx, y, nz, u, v, [col[0] * (0.75 + 0.25 * y), col[1] * (0.75 + 0.25 * y), col[2] * (0.75 + 0.25 * y)], 0, kind, far)); } rings.push(ring); }
  for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < segs; j++) pb.quad(rings[k][j], rings[k][j + 1], rings[k + 1][j + 1], rings[k + 1][j]);
}
function mound(pb, sx, sz, hh, cell, n = 6, far = 0.5) { // dome of flowers: planar uv over the whole cell
  const ids = [];
  for (let a = 0; a <= n; a++) for (let b = 0; b <= n; b++) {
    const s = a / n, t = b / n, x = (s - 0.5) * sx, z = (t - 0.5) * sz, e = Math.max(0, 1 - Math.pow(Math.abs(s - 0.5) * 2, 3)) * Math.max(0, 1 - Math.pow(Math.abs(t - 0.5) * 2, 3)), y = 0.04 + hh * Math.pow(e, 0.6);
    const gx = e > 0 ? (s - 0.5) * 2 * hh * 2.2 : 0, gz = e > 0 ? (t - 0.5) * 2 * hh * 2.2 : 0, n3 = nrm3(gx, 1, gz); const [u, v] = uvAt(cell, s, 1 - t);
    ids.push(pb.v(x, y, z, n3[0], n3[1], n3[2], u, v, [0.5 + 0.5 * e + 0.12, 0.5 + 0.5 * e + 0.12, 0.5 + 0.5 * e + 0.12], 0.012 * e, 1, far));
  }
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) pb.quad(ids[a * (n + 1) + b], ids[a * (n + 1) + b + 1], ids[(a + 1) * (n + 1) + b + 1], ids[(a + 1) * (n + 1) + b]);
}

// ======================================================================================
//  Species
// ======================================================================================
const GREEN = [1, 1, 1];
const PALMS = {
  coco: { h: [8.5, 11.5], k: 0.034, lean: 1.7, bow: 0.5, bark: 'bCoco', rad: t => 0.15 + 0.17 * Math.pow(1 - Math.min(1, t * 2.4), 2), nF: 19, pHi: 1.0, pLo: -0.3, len: [3.4, 4.4], w: 1.5, droop: 1.65, fold: 0.5, frond: 'frCoco' },
  royal: { h: [11.5, 14.5], k: 0.026, lean: 0.5, bow: 0.2, bark: 'bRoyal', rad: t => 0.2 + 0.18 * Math.pow(1 - Math.min(1, t * 2.2), 1.5) + 0.08 * Math.exp(-Math.pow((t - 0.2) / 0.1, 2)), nF: 16, pHi: 1.3, pLo: 0.12, len: [4.5, 5.6], w: 1.55, droop: 1.35, fold: 0.34, frond: 'frRoyal' },
  fan: { h: [9, 12.5], k: 0.03, lean: 1.0, bow: 0.3, bark: 'bFan', rad: t => 0.2 + 0.09 * (1 - Math.min(1, t * 3.5)), nF: 18, pHi: 0.85, pLo: -0.45, len: [1.5, 2.2], w: 2.1, droop: 0.9, fold: 0.34, frond: 'fan' },
  date: { h: [5.2, 7.4], k: 0.04, lean: 0.6, bow: 0.15, bark: 'bDate', rad: t => 0.36 - 0.06 * t + 0.1 * Math.max(0, 0.18 - t) / 0.18, nF: 30, pHi: 1.25, pLo: -0.1, len: [2.9, 3.7], w: 1.15, droop: 0.95, fold: 0.6, frond: 'frDate' },
};
function buildPalm(kind, seed, A, D) {
  const S = PALMS[kind], r = mulberry(seed), H = rg(r, S.h[0], S.h[1]), pb = new PB(H, S.k), N = 10, ang = r() * TAU, lean = (r() - 0.5) * 2 * S.lean, lx = Math.cos(ang) * lean, lz = Math.sin(ang) * lean, bowA = ang + 1.3;
  const pts = [], rad = []; for (let k = 0; k <= N; k++) { const t = k / N, bow = Math.sin(t * Math.PI) * S.bow; pts.push([lx * t * t + Math.cos(bowA) * bow, H * t, lz * t * t + Math.sin(bowA) * bow]); rad.push(S.rad(t)); }
  const bark = A.cell(S.bark), solid = A.cell('solid'), top = pts[N], fr = A.cell(S.frond), nF = Math.max(7, Math.round(S.nF * (0.55 + 0.45 * D)));
  tube(pb, pts, rad, 8, bark, H * 1.03, [0.8, 0.78, 0.76], [1, 1, 1], 0, 0, 1);
  if (kind === 'royal') { const cs = []; for (let k = 0; k <= 4; k++) { const y = H - 1.6 + k * 0.4; cs.push([top[0] + (pts[N - 1][0] - top[0]) * (4 - k) / 14, y, top[2] + (pts[N - 1][2] - top[2]) * (4 - k) / 14]); } tube(pb, cs, [0.25, 0.26, 0.27, 0.27, 0.24], 8, bark, H, [0.42, 0.6, 0.22], [0.5, 0.7, 0.26], 0, 0, 1); }
  for (let i = 0; i < nF; i++) {
    const f = (i + r() * 0.4) / nF, yaw = i * 2.39996 + r() * 0.35, pitch = lerp(S.pHi, S.pLo, Math.pow(f, 0.85)) + (r() - 0.5) * 0.14, L = rg(r, S.len[0], S.len[1]) * (0.82 + 0.18 * (1 - f));
    const ox = top[0] + Math.cos(yaw) * 0.13, oy = top[1] - 0.04 - f * 0.3, oz = top[2] + Math.sin(yaw) * 0.13, dr = S.droop * (0.55 + 0.45 * (1 - f)) * rg(r, 0.85, 1.15), sh = 0.78 + 0.22 * (1 - f);
    if (kind === 'fan') { // long bare petiole, then the pleated blade
      const pl = L * 0.75, pa = pitch, ex = ox + Math.cos(yaw) * Math.cos(pa) * pl, ey = oy + Math.sin(pa) * pl, ez = oz + Math.sin(yaw) * Math.cos(pa) * pl;
      tube(pb, [[ox, oy, oz], [(ox + ex) / 2, (oy + ey) / 2 + 0.06, (oz + ez) / 2], [ex, ey, ez]], [0.045, 0.035, 0.03], 4, solid, 1, [0.4, 0.46, 0.2], [0.34, 0.42, 0.16], 0.02, 0, 1);
      frond(pb, ex, ey, ez, yaw, pa * 0.7 - 0.1, S.w * 0.9, S.w, dr * 0.55, S.fold, (r() - 0.5) * 0.4, fr, [sh * 0.85, sh * 0.9, sh * 0.7], [1, 1, 0.95], 4, 0.14, 1, 1);
    } else frond(pb, ox, oy, oz, yaw, pitch, L, S.w * rg(r, 0.9, 1.08), dr, S.fold, (r() - 0.5) * 0.5, fr, [sh * 0.7, sh * 0.78, sh * 0.62], [1, 1, 0.95], Math.max(4, Math.round(5 * (0.6 + 0.4 * D))), 0.17, 1, 1);
  }
  const at = y => { const f = clamp(y / H, 0, 1) * N, k = Math.min(N - 1, Math.floor(f)), t = f - k; return [lerp(pts[k][0], pts[k + 1][0], t), lerp(pts[k][2], pts[k + 1][2], t)]; };
  if (kind === 'fan') { const dead = A.cell('frDead'), nd = Math.round(16 * (0.5 + 0.5 * D)); for (let i = 0; i < nd; i++) { const yaw = i * 2.39996 + r() * 0.3, y = H - 0.5 - (i / nd) * 3.0, rd = S.rad(1 - (H - y) / H) + 0.05; frond(pb, at(y)[0] + Math.cos(yaw) * rd, y, at(y)[1] + Math.sin(yaw) * rd, yaw, -1.3, rg(r, 1.6, 2.6), 0.95, 0.35, 0.25, 0.2, dead, [0.6, 0.55, 0.5], [0.95, 0.9, 0.85], 3, 0.1, 1, 1); } }
  if (kind === 'coco') for (let i = 0; i < 6; i++) { const a = i * 1.05 + r(), cr = 0.2 + r() * 0.1; blob(pb, top[0] + Math.cos(a) * cr, top[1] - 0.25 - r() * 0.25, top[2] + Math.sin(a) * cr, 0.14, 0.17, 0.14, i % 3 ? [0.32, 0.4, 0.14] : [0.3, 0.2, 0.1], solid, 4);
  }
  if (kind === 'date') for (let b = 0; b < 2; b++) { const a = b * 3.1 + r(); for (let i = 0; i < 5; i++) blob(pb, top[0] + Math.cos(a) * 0.6 + (r() - 0.5) * 0.3, top[1] - 0.45 - i * 0.03 - r() * 0.2, top[2] + Math.sin(a) * 0.6 + (r() - 0.5) * 0.3, 0.07, 0.09, 0.07, [0.75, 0.32, 0.06], solid, 4); }
  return pb.build();
}
const TREES = {
  ficus: { h: [8.6, 10.4], k: 0.012, bark: 'bFicus', trunkH: 2.6, trunkR: 0.42, cy: 6.0, rx: 3.8, ry: 2.9, limbs: 5, n: 52, size: [1.0, 1.5], cells: ['ficus'], tint: [1.0, 1.12, 0.92] },
  plane: { h: [11, 13], k: 0.014, bark: 'bPlane', trunkH: 4.6, trunkR: 0.28, cy: 8.6, rx: 3.1, ry: 3.4, limbs: 4, n: 48, size: [1.0, 1.5], cells: ['plane'], tint: [1.05, 1.1, 0.9] },
  jac: { h: [8.6, 10.4], k: 0.014, bark: 'bJac', trunkH: 2.4, trunkR: 0.24, cy: 6.3, rx: 4.5, ry: 2.2, limbs: 4, n: 50, size: [1.0, 1.5], cells: ['jacBloom', 'jacBloom', 'jacFol'], tint: [1.08, 1.08, 1.08] },
};
function buildTree(kind, seed, A, D) {
  const S = TREES[kind], r = mulberry(seed), H = rg(r, S.h[0], S.h[1]), pb = new PB(H, S.k), bark = A.cell(S.bark), solid = A.cell('solid'), cells = S.cells.map(c => A.cell(c));
  const cx = (r() - 0.5) * 0.5, cz = (r() - 0.5) * 0.5, cy = S.cy * H / ((S.h[0] + S.h[1]) / 2), N = 8, tp = [], tr = [];
  for (let k = 0; k <= N; k++) { const t = k / N; tp.push([cx * t * t + Math.sin(t * 3 + seed) * 0.08, S.trunkH * t, cz * t * t]); tr.push(S.trunkR * (1 + 0.55 * Math.pow(1 - Math.min(1, t * 3.2), 2)) * (1 - 0.18 * t)); }
  tube(pb, tp, tr, 10, bark, S.trunkH * 1.1, [0.75, 0.72, 0.7], [1, 1, 1], 0, 0, 1);
  const ctr = [cx, cy, cz], tips = [], nl = S.limbs;
  for (let i = 0; i < nl; i++) { // limbs: from the top of the trunk out to the crown, each ends in a cluster
    const a = i / nl * TAU + r() * 0.8, rr = 0.55 + 0.25 * r(), tx = cx + Math.cos(a) * S.rx * rr, tz = cz + Math.sin(a) * S.rx * rr, ty = cy + (r() - 0.3) * S.ry * 0.5, sy = S.trunkH - 0.2;
    const pts = [[cx, sy, cz], [cx + (tx - cx) * 0.3, sy + (ty - sy) * 0.45, cz + (tz - cz) * 0.3], [cx + (tx - cx) * 0.65, sy + (ty - sy) * 0.8, cz + (tz - cz) * 0.65], [tx, ty, tz]];
    tube(pb, pts, [S.trunkR * 0.62, S.trunkR * 0.46, S.trunkR * 0.3, S.trunkR * 0.16], 6, bark, 8, [0.8, 0.78, 0.76], [0.9, 0.88, 0.85], 0.0, 0, 1); tips.push([tx, ty, tz]);
  }
  const n = Math.round(S.n * (0.5 + 0.5 * D)), shade = (x, y, z) => { const dx = (x - cx) / S.rx, dy = (y - cy) / S.ry, dz = (z - cz) / S.rx, d = Math.hypot(dx, dy, dz); return 0.62 + 0.5 * sstep(0.1, 1.15, d) * (0.65 + 0.35 * sstep(-0.9, 0.9, dy)) + 0.04; };
  for (let i = 0; i < n; i++) {
    let p; if (i < tips.length * 2) { const t = tips[i % tips.length]; p = [t[0] + (r() - 0.5) * 1.6, t[1] + (r() - 0.2) * 1.2, t[2] + (r() - 0.5) * 1.6]; }
    else { const u = r() * 2 - 1, th = r() * TAU, sq = Math.sqrt(1 - u * u), q = 0.45 + 0.55 * Math.sqrt(r()); p = [cx + sq * Math.cos(th) * S.rx * q, cy + u * S.ry * q, cz + sq * Math.sin(th) * S.rx * q]; }
    if (p[1] < S.trunkH + 0.6) p[1] = S.trunkH + 0.6 + r() * 0.6;
    const sz = rg(r, S.size[0], S.size[1]), cell = cells[Math.floor(r() * cells.length)], tint = S.tint, yaw = r() * Math.PI, bright = 0.82 + r() * 0.3, col = [tint[0] * bright, tint[1] * bright, tint[2] * bright];
    const planes = [[yaw, 0.35 * (r() - 0.5)], [yaw + 1.05, 1.5 + 0.2 * (r() - 0.5)], [yaw + 2.1, 1.5 + 0.2 * (r() - 0.5)]];
    planes.forEach(([yw, tilt], k) => { // a horizontal-ish card plus two crossing vertical ones
      const ux = Math.cos(yw), uz = Math.sin(yw); let a, b;
      if (k === 0) { a = [ux * sz, 0, uz * sz]; b = [-uz * sz * Math.cos(tilt), Math.sin(tilt) * sz * 0.8, ux * sz * Math.cos(tilt)]; } else { a = [ux * sz, 0, uz * sz]; b = [0, sz * 0.95, 0]; }
      card(pb, p, a, b, cell, col, { ctr, sph: 0.78, shade, flip: Math.floor(r() * 8), fl: 0.07, kind: 1 });
    });
  }
  if (kind === 'jac') for (let i = 0; i < 7; i++) { const a = r() * TAU, d = r() * S.rx * 0.85; card(pb, [cx + Math.cos(a) * d, 0.04, cz + Math.sin(a) * d], [1.0, 0, 0], [0, 0, 1.0], A.cell('petal'), [1, 1, 1], { up: 4, flip: i, fl: 0, kind: 3 }); } // fallen blossoms under the crown
  return pb.build();
}
const SHRUB_CELLS = ['shGreen', 'shHib', 'shBou', 'shOle', 'shWhite', 'shYel', 'seaGrape'], FLOWER_CELLS = ['flRed', 'flYel', 'flPink', 'flWhite', 'flPurple', 'flOrange'];
function buildShrub(id, seed, A, D) {
  const R = 1.0, Hh = 0.9, r = mulberry(seed), pb = new PB(Hh, 0.05), cell = A.cell(id), ctr = [0, Hh * 0.35, 0], n = Math.max(4, Math.round(9 * (0.5 + 0.5 * D)));
  const shade = (x, y, z) => 0.5 + 0.5 * sstep(0.0, Hh, y) + 0.08;
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + r(), d = R * 0.62 * Math.sqrt(r()), y = 0.2 + Hh * 0.8 * Math.pow(r(), 0.8) * (1 - d / R * 0.5), p = [Math.cos(a) * d, y, Math.sin(a) * d], sz = rg(r, 0.55, 0.8), yaw = r() * Math.PI, br = 0.85 + r() * 0.25;
    [[yaw, 0], [yaw + 1.57, 1]].forEach(([yw, v]) => card(pb, p, [Math.cos(yw) * sz, 0, Math.sin(yw) * sz], v ? [0, sz * 0.9, 0] : [-Math.sin(yw) * sz * 0.7, 0.35 * sz, Math.cos(yw) * sz * 0.7], cell, [br, br, br], { ctr, sph: 0.7, shade, flip: Math.floor(r() * 8), fl: 0.06, kind: 1, far: 0.62 }));
  }
  return pb.build();
}
function buildHedge(A, D) { // 2 m of clipped hedge with a domed top, plus a few leaf cards for a ragged outline
  const pb = new PB(1.2, 0.02), cell = A.cell('hedge'), prof = [[-0.44, 0], [-0.44, 0.78], [-0.34, 1.0], [0.34, 1.0], [0.44, 0.78], [0.44, 0]], nn = [[-1, 0], [-1, 0.2], [-0.4, 1], [0.4, 1], [1, 0.2], [1, 0]], L = 1.1, r = mulberry(5);
  for (let k = 0; k < prof.length - 1; k++) {
    const a = prof[k], b = prof[k + 1], n0 = nrm3(nn[k][0], nn[k][1], 0), n1 = nrm3(nn[k + 1][0], nn[k + 1][1], 0), ids = [], sh0 = 0.55 + 0.45 * a[1], sh1 = 0.55 + 0.45 * b[1];
    for (const [pp, nn_, sh, tt] of [[a, n0, sh0, k / 5], [b, n1, sh1, (k + 1) / 5]]) for (const zz of [-1, 1]) { const [u, v] = uvAt(cell, zz > 0 ? 1 : 0, Math.min(1, pp[1])); ids.push(pb.v(zz * L, pp[1], pp[0], 0, nn_[1], nn_[0], u, v, [sh, sh, sh], 0.004, 1, 0.55)); }
    pb.quad(ids[0], ids[1], ids[3], ids[2]);
  }
  const top = A.cell('shGreen'); for (let i = 0; i < Math.round(5 * (0.4 + 0.6 * D)); i++) { const x = (i / 4 - 0.5) * 1.8 + (r() - 0.5) * 0.2, sz = 0.42; card(pb, [x, 1.0, (r() - 0.5) * 0.4], [Math.cos(i) * sz, 0, Math.sin(i) * sz], [0, 0.5 * sz, 0.6 * sz], top, [0.95, 0.95, 0.95], { up: 1.5, flip: i, fl: 0.03, kind: 1, far: 0.55 }); }
  return pb.build();
}
function buildGrass(id, seed, A, D, w, h, nc) { // crossed cards that lean a little, base darker than the tips
  const r = mulberry(seed), pb = new PB(h, 0.1), cell = A.cell(id);
  for (let i = 0; i < nc; i++) {
    const yw = i / nc * Math.PI + r() * 0.3, ux = Math.cos(yw) * w * 0.5, uz = Math.sin(yw) * w * 0.5, lean = (r() - 0.5) * h * 0.3, ids = [];
    for (const [s, t] of [[0, 0], [1, 0], [1, 0.55], [0, 0.55], [1, 1], [0, 1]]) { const sx = (s - 0.5) * 2, x = ux * sx + lean * t * t * Math.cos(yw + 1.57), z = uz * sx + lean * t * t * Math.sin(yw + 1.57), y = t * h, [u, v] = uvAt(cell, s, t), sh = 0.55 + 0.5 * t; ids.push(pb.v(x, y, z, 0, 1, 0, u, v, [sh, sh, sh], 0.16 * t * h, 2, 0.36)); }
    pb.quad(ids[0], ids[1], ids[2], ids[3]); pb.quad(ids[3], ids[2], ids[4], ids[5]);
  }
  return pb.build();
}
function buildBamboo(seed, A, D) {
  const r = mulberry(seed), H = 7.5, pb = new PB(H, 0.05), bark = A.cell('bBamboo'), lf = A.cell('bambooL'), n = Math.round(10 * (0.5 + 0.5 * D));
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 0.9, h = rg(r, 5.2, 8.2), lx = (r() - 0.5) * 0.9, lz = (r() - 0.5) * 0.9, bx = Math.cos(a) * d, bz = Math.sin(a) * d, pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([bx + lx * t * t, h * t, bz + lz * t * t]); }
    tube(pb, pts, [0.06, 0.055, 0.05, 0.045, 0.04, 0.035, 0.03], 5, bark, h * 0.9, [0.8, 0.85, 0.7], [0.9, 0.95, 0.8], 0, 0, 0.9);
    for (let k = 0; k < 3; k++) { const t = 0.6 + k * 0.16, p = [bx + lx * t * t, h * t, bz + lz * t * t], yw = r() * Math.PI, sz = rg(r, 0.9, 1.3); card(pb, p, [Math.cos(yw) * sz, 0.1, Math.sin(yw) * sz], [0, 0.8 * sz, 0], lf, [0.9, 0.95, 0.85], { ctr: [bx, h * 0.5, bz], sph: 0.5, flip: k, fl: 0.14, kind: 1, far: 0.9 }); }
  }
  return pb.build();
}
function buildReeds(seed, A, D) { const r = mulberry(seed), pb = new PB(2, 0.08), cell = A.cell('reed'), nc = Math.round(5 * (0.5 + 0.5 * D)); for (let i = 0; i < nc; i++) { const yw = i / nc * Math.PI + r() * 0.3, h = rg(r, 1.5, 2.1), w = 0.5, ux = Math.cos(yw) * w * 0.5, uz = Math.sin(yw) * w * 0.5, ox = (r() - 0.5) * 0.5, oz = (r() - 0.5) * 0.5, ids = []; for (const [s, t] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { const [u, v] = uvAt(cell, s, t), sh = 0.6 + 0.45 * t; ids.push(pb.v(ox + ux * (s - 0.5) * 2 + t * t * 0.2, t * h, oz + uz * (s - 0.5) * 2, 0, 1, 0, u, v, [sh, sh, sh], 0.2 * t * h, 2, 0.5)); } pb.quad(ids[0], ids[1], ids[2], ids[3]); } return pb.build(); }
function buildBed(id, seed, A, D, sx, sz) { const pb = new PB(0.5, 0.03); boxPB(pb, -sx * 0.52, 0, -sz * 0.52, sx * 0.52, 0.09, sz * 0.52, [0.22, 0.16, 0.1], A.cell('solid'), 0.5); mound(pb, sx, sz, 0.34, A.cell(id), 6, 0.5); return pb.build(); }
function buildPot(kind, seed, A, D) {
  const r = mulberry(seed), pb = new PB(1.6, 0.05), solid = A.cell('solid'), terra = [lin(0xb5602e), lin(0x9a4c28), lin(0xc9774a)][seed % 3];
  lathe(pb, [[0.19, 0], [0.27, 0.05], [0.33, 0.45], [0.36, 0.5], [0.36, 0.56], [0.31, 0.56], [0.3, 0.5]], 10, terra, solid, 0.5);
  if (kind === 'palm') { for (let i = 0; i < 7; i++) frond(pb, 0, 0.48, 0, i * 2.4 + r(), rg(r, 0.5, 1.3), rg(r, 0.9, 1.3), 0.5, 0.9, 0.4, 0.2, A.cell('frCoco'), [0.7, 0.78, 0.6], [1, 1, 0.95], 4, 0.1, 1, 0.5); }
  else if (kind === 'flower') { mound(pb, 0.58, 0.58, 0.2, A.cell('flRed'), 4, 0.5); }
  else { tube(pb, [[0, 0.5, 0], [0, 0.95, 0]], [0.03, 0.03], 4, solid, 1, [0.3, 0.2, 0.1], [0.3, 0.2, 0.1], 0, 0, 0.5); blob(pb, 0, 0.8, 0, 0.3, 0.26, 0.3, [0.35, 0.6, 0.3], A.cell('hedge'), 7, 0.5); blob(pb, 0, 1.15, 0, 0.21, 0.19, 0.21, [0.35, 0.62, 0.3], A.cell('hedge'), 7, 0.5); blob(pb, 0, 1.42, 0, 0.13, 0.13, 0.13, [0.4, 0.66, 0.34], A.cell('hedge'), 6, 0.5); }
  return pb.build();
}
function appendPB(dst, src, dx, dy, dz) { const off = dst.nv; for (let k = 0; k < src.nv; k++) dst.v(src.p[k * 3] + dx, src.p[k * 3 + 1] + dy, src.p[k * 3 + 2] + dz, src.n[k * 3], src.n[k * 3 + 1], src.n[k * 3 + 2], src.u[k * 2], src.u[k * 2 + 1], [src.c[k * 3], src.c[k * 3 + 1], src.c[k * 3 + 2]], src.s[k * 4 + 1], src.s[k * 4 + 2], src.s[k * 4 + 3]); for (const i of src.i) dst.i.push(i + off); }
function buildTrough(A, D, bay) { // concrete trough with soil, flower mounds and shrubs; bay = the longer coast-road median version
  const L = bay ? 5.6 : 1.5, Wd = bay ? 1.0 : 0.62, hh = bay ? 0.2 : 0.55, pb = new PB(1.4, 0.04), solid = A.cell('solid'), r = mulberry(bay ? 91 : 92), conc = lin(0x9c9a94);
  boxPB(pb, -L / 2, 0, -Wd / 2, L / 2, hh, Wd / 2, conc, solid, 0.5); boxPB(pb, -L / 2 + 0.07, hh - 0.01, -Wd / 2 + 0.07, L / 2 - 0.07, hh + 0.03, Wd / 2 - 0.07, [0.2, 0.14, 0.09], solid, 0.5);
  const fl = ['flRed', 'flYel', 'flPink', 'flWhite', 'flPurple', 'flOrange'], sh = ['shHib', 'shOle', 'shGreen', 'shYel', 'shWhite'], nb = bay ? 3 : 1;
  for (let i = 0; i < nb; i++) { const sub = new PB(1, 0.04); mound(sub, bay ? 1.3 : 0.62, Wd * 0.8, 0.2, A.cell(fl[Math.floor(r() * 6)]), 4, 0.5); appendPB(pb, sub, bay ? (i - 1) * 1.9 : 0.35, hh, 0); }
  const nsh = bay ? 4 : 2;
  for (let i = 0; i < nsh; i++) { const x = bay ? (i - 1.5) * 1.35 + 0.3 : -0.38 + i * 0.1, cell = A.cell(sh[i % sh.length]), z = (r() - 0.5) * 0.15, sz = bay ? 0.55 : 0.46, ctr = [x, hh + 0.2, z]; for (let k = 0; k < 2; k++) card(pb, [x, hh + 0.36, z], [Math.cos(k * 1.57 + 0.4) * sz, 0, Math.sin(k * 1.57 + 0.4) * sz], [0, sz * 0.8, 0], cell, [0.95, 0.95, 0.95], { ctr, sph: 0.7, flip: i + k, fl: 0.05, kind: 1, far: 0.55 }); }
  return pb.build();
}
function buildVine(id, seed, A, D) { // a 2.2 x 3.6 m curtain of leaves/blossom hanging flat on a wall (2 layers, a little ragged)
  const r = mulberry(seed), pb = new PB(4, 0.01), cell = A.cell(id);
  for (let layer = 0; layer < 2; layer++) for (let row = 0; row < 2; row++) for (let col = 0; col < 1; col++) {
    const w = 1.1 + layer * 0.05, h = 1.0 + 0.1 * r(), cx = (r() - 0.5) * 0.3, cy = 0.9 + row * 1.6 + layer * 0.35, z = 0.07 + layer * 0.09;
    card(pb, [cx, cy, z], [w, 0, 0], [0, h + 0.5, 0], cell, [0.85 + 0.2 * r(), 0.85 + 0.2 * r(), 0.85 + 0.2 * r()], { ctr: [cx, cy, z - 1.2], sph: 0.55, flip: Math.floor(r() * 8), fl: 0.05, kind: 1, far: 0.55 });
  }
  return pb.build();
}

// ======================================================================================
//  Flora: variants, placement rules, chunked instancing
// ======================================================================================
const CH_TREE = 96, CH_SMALL = 192;                                                     // chunk edge (m): trees and palms / everything small
const DIST = { low: 95, med: 135, high: 180 };                                         // tree draw distance per tier (m); smaller plants use a fraction
const DETAIL = { low: 0.55, med: 0.8, high: 1 };                                        // crown / frond / card counts
const DENS = { low: { tree: 1, shrub: 0.6, ground: 0.26, bed: 0.55, pot: 0.7 }, med: { tree: 1, shrub: 0.85, ground: 0.6, bed: 0.85, pot: 1 }, high: { tree: 1, shrub: 1, ground: 1, bed: 1, pot: 1 } };
const CLS_FAR = { tree: 1, shrub: 0.62, ground: 0.36, bed: 0.5, pot: 0.5, hedge: 0.55 };
// id -> { cls, shadow, mk(atlas, detail, variant), subs }. Trees come in two geometries per species (variant = chunk parity, so neighbouring chunks differ and a chunk still needs one mesh
// per species); `subs` lists atlas cells of equal size that an instance can pick (colour variants through the per-instance iUV offset).
const VAR = {};
const reg = (id, cls, shadow, mk, subs) => { VAR[id] = { cls, shadow, mk, subs }; };
['coco', 'royal', 'fan', 'date'].forEach((k, i) => reg(k, 'tree', true, (A, D, vi) => buildPalm(k, 100 + i * 17 + vi * 5, A, D)));
['ficus', 'plane', 'jac'].forEach((k, i) => reg(k, 'tree', true, (A, D, vi) => buildTree(k, 200 + i * 13 + vi * 7, A, D)));
reg('bamboo', 'tree', true, (A, D, vi) => buildBamboo(5 + vi, A, D));
reg('shrub', 'shrub', false, (A, D) => buildShrub('shGreen', 300, A, D), SHRUB_CELLS); reg('hedge', 'hedge', false, (A, D) => buildHedge(A, D));
// lawn tufts: four geometries (short, medium, tall, low dense mat) and three colours per cell size (subs[0] is the cell the geometry is built on)
const GRASS_SUBS = ['grass', 'grassDry', 'grassDeep'];
reg('grass0', 'ground', false, (A, D) => buildGrass('grass', 1, A, D, 0.55, 0.5, 3), GRASS_SUBS); reg('grass1', 'ground', false, (A, D) => buildGrass('grass', 2, A, D, 0.7, 0.8, 3), GRASS_SUBS);
reg('grass2', 'ground', false, (A, D) => buildGrass('grass', 4, A, D, 0.6, 1.0, 3), GRASS_SUBS); reg('grass3', 'ground', false, (A, D) => buildGrass('grass', 5, A, D, 0.95, 0.34, 4), GRASS_SUBS);
reg('dune0', 'ground', false, (A, D) => buildGrass('dune', 3, A, D, 0.9, 1.1, 3)); reg('reed0', 'shrub', false, (A, D) => buildReeds(4, A, D));
reg('bed', 'bed', false, (A, D) => buildBed('flRed', 1, A, D, 1.4, 1.4), FLOWER_CELLS); reg('bedL', 'bed', false, (A, D) => buildBed('flRed', 2, A, D, 2.6, 1.2), FLOWER_CELLS);
reg('potPalm', 'pot', false, (A, D) => buildPot('palm', 3, A, D)); reg('potFlower', 'pot', false, (A, D) => buildPot('flower', 4, A, D), FLOWER_CELLS); reg('potTop', 'pot', false, (A, D) => buildPot('top', 5, A, D));
reg('trough', 'pot', false, (A, D) => buildTrough(A, D, false)); reg('bay', 'hedge', false, (A, D) => buildTrough(A, D, true));
reg('vine', 'shrub', false, (A, D) => buildVine('ivy', 1, A, D), ['ivy', 'shBou', 'shWhite']);
const SHSUB = { shGreen: 0, shHib: 1, shBou: 2, shOle: 3, shWhite: 4, shYel: 5, seaGrape: 6 };
const CROWN = { plane: 3.1, ficus: 3.8, jac: 4.5, royal: 2.7, fan: 1.9, date: 2.7, coco: 2.6 };
const crownOf = id => CROWN[id] || 2.5;
const V_THEME = ['sparse', 'ficus', 'plane', 'jac', 'plane', 'palm', 'jac', 'plane', 'ficus', 'palm']; // by road column i (the coast road, column 10, has its own layout)
const H_THEME = ['sparse', 'ficus', 'plane', 'jac', 'palm', 'plane', 'ficus', 'jac', 'sparse'];            // by road row j
const POOL = { plane: ['plane'], ficus: ['ficus'], jac: ['jac'], palm: ['royal', 'royal', 'fan', 'fan', 'date', 'coco'], sparse: ['fan', 'fan', 'date'] };
const RING = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class Flora {
  constructor(world) {
    this.w = world; this.tier = world.quality || 'high'; this.chunks = new Map(); this.meshes = []; this.geos = {}; this.group = new THREE.Group(); this.group.name = 'flora'; world.scene.add(this.group);
    this.wind = 0.4; this.wetT = 0; this.wetV = 0; this.cam = new THREE.Vector3(0, 40, 0); this.rng = mulberry(5150); this.medians = []; this.mat = null; this.hash = new Map(); this.keep = []; this.fronts = []; this._q = [];
    this.U = FU; // exposed for tests and tuning
    const sc = world.scene, prev = sc.onBeforeRender; // distance culling of the chunks needs the camera: Scene.onBeforeRender runs before the render list is built, so the very first frame after a camera cut is right too
    sc.onBeforeRender = function (r, s, cam, ...rest) { prev.call(this, r, s, cam, ...rest); if (cam.isPerspectiveCamera) { self.cam.copy(cam.position); self.cull(); } };
    const self = this;
  }
  // ---------- API used by World ----------
  build() { this.collect(); this.layout(); this.commit(); }
  windAt(t) { return clamp(0.3 + 0.14 * Math.sin(t * 0.047) + 0.1 * Math.sin(t * 0.131 + 1.7) + 0.4 * Math.pow(Math.max(0, Math.sin(t * 0.021 + 0.6)), 6) + this.wetT * 0.55, 0.1, 1.8); }
  update(dt, t, wind) {
    this.wetV += (this.wetT - this.wetV) * Math.min(1, dt * (this.wetT > this.wetV ? 0.6 : 0.12)); FU.fWet.value = this.wetV;
    const w = wind ?? this.windAt(t); this.wind = w; FU.fWind.value = w; FU.fTime.value = t % 2000; const a = 0.6 + 0.5 * Math.sin(t * 0.011); FU.fWindDir.value.set(Math.cos(a), Math.sin(a));
  }
  setEnv(f, sunDir, sunColor, rain) { // night factor, sun direction and colour, rain 0..1
    this.wetT = rain || 0; FU.fGlow.value = f * 0.42 * (1 - (rain || 0) * 0.3); if (sunDir) FU.fSunDir.value.copy(sunDir); const day = clamp((sunDir ? sunDir.y : 1) * 3, 0, 1); if (sunColor) FU.fSunCol.value.copy(sunColor).multiplyScalar(day * (1 - (rain || 0) * 0.55) * 1.05);
  }
  setQuality(q) { if (q === this.tier) return; this.tier = q; this.clear(); this.commit(); } // commit swaps the atlas (and frees the one it replaces)
  cull() { const c = this.cam; for (const m of this.meshes) { const u = m.userData, d = Math.hypot(u.cx - c.x, u.cz - c.z); m.visible = d < u.lim; if (u.sh) m.castShadow = d < 130 + u.rad; } } // only chunks near the camera cast shadows (the sun's shadow map covers ~90 m)
  medianAt(x, z) { for (const m of this.medians) if (Math.abs(x - m[0]) < 0.55 && z > m[1] && z < m[2]) return 0.2; return 0; }
  clear() { for (const m of this.meshes) { this.group.remove(m); m.dispose?.(); m.geometry.dispose(); } this.meshes.length = 0; for (const k in this.geos) this.geos[k].dispose(); this.geos = {}; }
  // ---------- instancing ----------
  add(id, x, z, yaw = 0, s = 1, sy = s, tint = 1, y, sub = 0) { // one instance; chunked by class (trees 160 m, everything else 256 m)
    const ch_ = VAR[id].cls === 'tree' ? CH_TREE : CH_SMALL, kx = Math.floor(x / ch_), kz = Math.floor(z / ch_), key = (ch_ === CH_TREE ? 't' : 's') + kx + ',' + kz; let ch = this.chunks.get(key); if (!ch) this.chunks.set(key, ch = { kx, kz, lists: {} });
    (ch.lists[id] || (ch.lists[id] = [])).push(x, y ?? this.w.groundY(x, z), z, yaw, s, sy, tint, hash2(x, z), sub);
  }
  commit() {
    const tier = this.tier, D = DETAIL[tier], dens = DENS[tier], A = plantAtlas(tier === 'low' ? 1024 : 2048); this.A = A;
    if (!this.mat) this.mat = plantMaterial(A.tex); else if (this.mat.map !== A.tex) { const old = this.mat.map; this.mat.map = A.tex; this.mat.needsUpdate = true; old?.dispose(); }
    FU.fFar.value = DIST[tier];
    for (const ch of this.chunks.values()) for (const id in ch.lists) {
      const list = ch.lists[id], V = VAR[id], keep = []; for (let i = 0; i < list.length; i += 9) if (list[i + 7] < dens[V.cls === 'hedge' ? 'tree' : V.cls]) keep.push(i);
      if (!keep.length) continue;
      const vi = V.cls === 'tree' ? (ch.kx * 7 + ch.kz * 3) & 1 : 0, gk = id + vi, base = this.geos[gk] || (this.geos[gk] = V.mk(A, D, vi)), g = new THREE.BufferGeometry();
      for (const k in base.attributes) g.setAttribute(k, base.attributes[k]); g.setIndex(base.index); g.boundingSphere = base.boundingSphere; // a wrapper that shares the GPU buffers and owns the per-instance colour-variant offsets
      const off = V.subs ? V.subs.map(c => { const c0 = A.cell(V.subs[0]), c1 = A.cell(c); return [c1.u0 - c0.u0, c1.v0 - c0.v0]; }) : null, uv = new Float32Array(keep.length * 2);
      keep.forEach((o, k) => { if (off) { const f = off[list[o + 8]] || off[0]; uv[k * 2] = f[0]; uv[k * 2 + 1] = f[1]; } });
      g.setAttribute('iUV', new THREE.InstancedBufferAttribute(uv, 2));
      const mesh = new THREE.InstancedMesh(g, this.mat, keep.length);
      keep.forEach((o, k) => { _p.set(list[o], list[o + 1], list[o + 2]); _q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, list[o + 3]); _s.set(list[o + 4], list[o + 5], list[o + 4]); _m.compose(_p, _q, _s); mesh.setMatrixAt(k, _m); const t = list[o + 6]; _c.setRGB(t, t, t); mesh.setColorAt(k, _c); });
      mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 2.5; mesh.castShadow = V.shadow && tier !== 'low'; mesh.receiveShadow = V.cls === 'tree' && tier !== 'low';
      mesh.userData = { cx: mesh.boundingSphere.center.x, cz: mesh.boundingSphere.center.z, rad: mesh.boundingSphere.radius, sh: mesh.castShadow, lim: DIST[tier] * (CLS_FAR[V.cls] || 1) + mesh.boundingSphere.radius };
      this.group.add(mesh); this.meshes.push(mesh);
    }
    this.cull();
  }
  // ---------- placement helpers ----------
  collect() { // places that must stay clear: the door / marker of every POI, mission and pickup spots, parked cars
    const w = this.w; this.keep.length = 0;
    for (const id in w.pois) { const p = w.pois[id]; if (typeof p.x === 'number' && typeof p.z === 'number') this.keep.push([p.x, p.z, id === 'docks' || id === 'fixer' ? 5 : 4.4]); }
    this.fronts = []; for (const id in w.pois) { const p = w.pois[id]; if (typeof p.bx0 === 'number') this.fronts.push(frontOf(p)); }
    for (const pk of w.parks) this.keep.push([pk.cx, pk.cz + 8, 2.6], [pk.cx + 6, pk.cz + 6, 2.2], [pk.cx - 6, pk.cz - 6, 2.2], [pk.cx, pk.cz, 8.2]);
    this.keep.push([CITY.beachX + 36, 40, 2.5]); for (const p of w.parkingSpots) this.keep.push([p.x, p.z, 2.3]);
  }
  wallGap(x, z, cap = 9) { let g = cap; for (const b of this.w.grid.query(x, z, cap, this._q)) { if (b.type !== 'building') continue; g = Math.min(g, Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.z0 - z, 0, z - b.z1))); } return g; }
  claimed(x, z, r) { const hk = this.hash, cx = Math.floor(x / 6), cz = Math.floor(z / 6); for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) { const a = hk.get(i * 4096 + j); if (a) for (let k = 0; k < a.length; k += 3) if (Math.hypot(a[k] - x, a[k + 1] - z) < r + a[k + 2]) return true; } return false; }
  claim(x, z, r) { const key = Math.floor(x / 6) * 4096 + Math.floor(z / 6); let a = this.hash.get(key); if (!a) this.hash.set(key, a = []); a.push(x, z, r); }
  free(x, z, r, o = {}) {
    const w = this.w; if (w.interiorAt(x, z)) return false; // never grow through a shop interior (W2)
    if (!o.road && x > CITY.minX - 1 && x < CITY.maxX && z > CITY.minZ - 1 && z < CITY.maxZ + 1) for (const d of RING) if (w.isRoad(x + d[0] * r, z + d[1] * r)) return false;
    for (const b of w.grid.query(x, z, r + 2, this._q)) { if (b.type === 'wall' || b.y0 > 3.2) continue; if (Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.z0 - z, 0, z - b.z1)) < r + (o.margin ?? 0.35)) return false; }
    const pr = o.poi ?? 1; for (const k of this.keep) { const dx = k[0] - x, dz = k[1] - z, rr = k[2] * pr + r * 0.5; if (dx * dx + dz * dz < rr * rr) return false; }
    for (const f of this.fronts) if (inFront(f, x, z, r)) return false;
    if (!o.lot) for (const L of w.lots) if (x > L.x0 - 0.8 && x < L.x1 + 0.8 && z > L.z0 - 0.8 && z < L.z1 + 0.8) return false;
    return !this.claimed(x, z, r);
  }
  tree(id, x, z, s, sy = s) { // instance + trunk collider + treeSpots entry
    const w = this.w, r = Math.min(0.42, 0.24 + 0.1 * s); this.add(id, x, z, this.rng() * TAU, s, sy, 0.86 + this.rng() * 0.26); this.claim(x, z, r + 0.15);
    w.grid.add({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, y0: 0, y1: 6, type: 'pole' }); w.treeSpots.push({ x, z, s, kind: id });
  }
  shrub(name, x, z, s = 1) { this.add('shrub', x, z, this.rng() * TAU, s, s * (0.9 + this.rng() * 0.25), 0.85 + this.rng() * 0.3, undefined, SHSUB[name]); this.claim(x, z, 0.3 * s); }
  hedgeRun(axis, c, a0, a1, collide = true) { // hedge along x (axis 'x', at z = c) or along z; 2 m pieces
    const w = this.w, n = Math.floor((a1 - a0) / 2); if (n < 1) return; const used = n * 2, st = a0 + ((a1 - a0) - used) / 2;
    for (let i = 0; i < n; i++) { const t = st + i * 2 + 1, x = axis === 'x' ? t : c, z = axis === 'x' ? c : t; this.add('hedge', x, z, axis === 'x' ? 0 : Math.PI / 2, 1, 0.9 + 0.2 * hash2(x, z), 0.88 + 0.2 * hash2(z, x)); }
    const e = 0.5; if (collide) w.grid.add(axis === 'x' ? { x0: st, x1: st + used, z0: c - e, z1: c + e, y0: 0, y1: 1.1, type: 'prop' } : { x0: c - e, x1: c + e, z0: st, z1: st + used, y0: 0, y1: 1.1, type: 'prop' });
  }
  // ---------- the layout ----------
  layout() {
    this.streetTrees(); this.coastRoad(); this.beach(); this.parks(); this.planters(); this.shopPots(); this.frontHedges(); this.vines(); this.outskirts();
  }
  streetTrees() {
    const w = this.w, rng = mulberry(31337), inCity = (x, z) => x > CITY.minX + HALF && x < CITY.maxX - HALF && z > CITY.minZ + HALF && z < CITY.maxZ - HALF;
    for (const seg of w.segments) {
      const A = seg.a, B = seg.b, fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx; if (!seg.horizontal && A.i === gridX) continue;
      const theme = (seg.horizontal ? H_THEME[A.j] : V_THEME[A.i]) || 'sparse', downtown = Math.hypot((A.x + B.x) / 2 / 390, (A.z + B.z) / 2 / 312) < 0.4;
      for (const side of [1, -1]) {
        if (theme === 'ficus' && ((A.i + A.j + (side > 0 ? 1 : 0)) & 1)) continue;
        for (const s0 of (theme === 'sparse' ? [29] : [8, 29, 50])) {
          if (theme === 'sparse' && ((A.i + A.j + (side > 0 ? 1 : 0)) & 1)) continue;
          const s = s0 + (rng() - 0.5) * 3, d = 2.5 + rng() * 0.35, x = A.x + fx * (HALF + s) + rx * side * (HALF + d), z = A.z + fz * (HALF + s) + rz * side * (HALF + d);
          if (!inCity(x, z) || !this.free(x, z, 0.4)) continue;
          const gap = this.wallGap(x, z); let pool = POOL[theme]; if (rng() < 0.22 || (downtown && rng() < 0.5)) pool = POOL.palm;
          let id = pool[Math.floor(rng() * pool.length)], maxR = gap + 0.7, sxz = maxR / crownOf(id);
          if (sxz < 0.5) { id = rng() < 0.5 ? 'fan' : 'fan'; sxz = maxR / crownOf(id); }
          if (sxz < 0.55) continue;
          sxz = Math.min(1.12, sxz) * (0.92 + rng() * 0.12); this.tree(id, x, z, sxz, (0.88 + rng() * 0.3) * (sxz < 0.8 ? 1.1 : 1));
        }
      }
    }
  }
  coastRoad() { // a raised median of planters with fan palms, royal palms on the pavement, coconut palms on the sand
    const w = this.w, rng = mulberry(7007);
    for (const seg of w.segments) {
      if (seg.horizontal || seg.a.i !== gridX) continue;
      const A = seg.a, B = seg.b, z0 = Math.min(A.z, B.z) + HALF + 13, z1 = Math.max(A.z, B.z) - HALF - 13, cx = A.x;
      let bay = 0; for (let z = z0; z + 5.6 <= z1 + 0.01; z += 9, bay++) {
        this.add('bay', cx, z + 2.8, Math.PI / 2, 1, 1, 1, 0); this.medians.push([cx, z, z + 5.6]);
        if (bay % 2 === 0) { const x = cx, zz = z + 2.8; this.add(bay % 4 === 0 ? 'fan' : 'fan', x, zz, rng() * TAU, 0.8, 0.85, 0.95, 0.2); this.claim(x, zz, 0.5); w.grid.add({ x0: x - 0.25, x1: x + 0.25, z0: zz - 0.25, z1: zz + 0.25, y0: 0, y1: 6, type: 'pole' }); }
      }
      for (let s = 9; s < seg.len - road - 6; s += 15) {
        const z = A.z + Math.sign(B.z - A.z) * (HALF + s) + (rng() - 0.5) * 3;
        const xw = cx - HALF - 2.5, xe = cx + HALF + 2.6 + rng() * 1.5;
        if (this.free(xw, z, 0.4)) this.tree((s / 15 | 0) % 2 ? 'royal' : 'royal', xw, z, 0.85 + rng() * 0.2);
        if (this.free(xe, z + 6, 0.4, { road: true })) this.tree(rng() < 0.6 ? 'coco' : 'coco', xe, z + 6, 0.85 + rng() * 0.3);
      }
    }
  }
  beach() {
    const w = this.w, rng = mulberry(4711), bx = CITY.beachX, ox = CITY.oceanX, zA = CITY.minZ - 70, zB = CITY.maxZ + 70, P = ['coco', 'coco', 'coco', 'coco', 'royal', 'date', 'date', 'royal', 'fan'];
    for (let z = zA; z < zB; z += (z > CITY.minZ && z < CITY.maxZ) ? 11 : 24) { // the palm line along the dunes
      const x = bx + 5.6 + rng() * 2.4, zz = z + (rng() - 0.5) * 4, id = P[Math.floor(rng() * P.length)];
      if (this.free(x, zz, 0.4, { road: true, margin: 0.8 })) this.tree(id, x, zz, 0.85 + rng() * 0.45);
    }
    for (let i = 0; i < 34; i++) { // palm groves on the open sand: two to four palms leaning together, spread and size varied, a few of them royal or date
      const gx = bx + 20 + rng() * 22, gz = CITY.minZ + 15 + rng() * (CITY.maxZ - CITY.minZ - 30), n = 2 + Math.floor(rng() * 3), spread = 4 + rng() * 5;
      for (let k = 0; k < n; k++) { const x = gx + (rng() - 0.5) * spread, z = gz + (rng() - 0.5) * spread; if (this.free(x, z, 0.5, { road: true, margin: 1.2 })) this.tree(rng() < 0.7 ? 'coco' : rng() < 0.5 ? 'royal' : 'date', x, z, 0.7 + rng() * 0.5); }
    }
    for (let z = zA; z < zB; z += 5.5) { // dune grass, sea grape and the odd reed bed along the upper beach and the water's edge
      const jz = z + (rng() - 0.5) * 3, x = bx + 1.6 + rng() * 3.4;
      if (rng() < 0.7 && this.free(x, jz, 0.4, { road: true })) { this.add(rng() < 0.5 ? 'dune0' : 'dune0', x, jz, rng() * TAU, 0.8 + rng() * 0.7, 0.8 + rng() * 0.7, 0.85 + rng() * 0.3); }
      const fx = bx + 0.9 + rng() * 0.8; // low dune-grass fringe right behind the kerb of buildBeach, so the sand edge is not a bare line
      if (rng() < 0.5 && this.free(fx, jz + 1.7, 0.4, { road: true })) this.add('dune0', fx, jz + 1.7, rng() * TAU, 0.6 + rng() * 0.4, 0.6 + rng() * 0.4, 0.9);
      if (rng() < 0.22 && this.free(x + 2, jz, 0.8, { road: true })) this.shrub('seaGrape', x + 2, jz, 0.9 + rng() * 0.5);
      if (rng() < 0.2) { const rx = ox - 10 - rng() * 5; if (this.free(rx, jz, 0.5, { road: true })) { this.add('dune0', rx, jz, rng() * TAU, 1.2, 1.1, 1); this.add('reed0', rx + 1, jz + 1, rng() * TAU, 1, 1, 1); } }
    }
    // dune grass in noise-masked patches across the open sand: clumps with clear gaps between them (ground cover, not a collider, so the walk stays open)
    for (let x = bx + 8; x < ox - 10; x += 2.5) for (let z = CITY.minZ; z < CITY.maxZ; z += 2.5) {
      const jx = x + (rng() - 0.5) * 2.5, jz = z + (rng() - 0.5) * 2.5, m = vnoise(jx, jz, 14);
      if (m < 0.5 || rng() > 0.4 + m * 0.5 || !this.free(jx, jz, 0.4, { road: true, margin: 0.4 })) continue;
      if (rng() < 0.2) this.shrub('seaGrape', jx, jz, 0.8 + rng() * 0.4); // sea grape in the thicker clumps
      else this.add('dune0', jx, jz, rng() * TAU, 0.7 + rng() * 0.7, 0.8 + rng() * 0.6, 0.85 + rng() * 0.3);
    }
    for (let i = 0; i < 70; i++) { const x = bx + 12 + rng() * (ox - bx - 22), z = CITY.minZ + rng() * (CITY.maxZ - CITY.minZ); if (this.free(x, z, 0.4, { road: true, margin: 0.6 }) && rng() < 0.6) this.add('dune0', x, z, rng() * TAU, 0.8 + rng() * 0.6, 0.8 + rng() * 0.6, 0.9); }
  }
  parks() {
    const w = this.w, rng = mulberry(8080), big = [['plane', 'ficus', 'jac', 'ficus'], ['jac', 'plane', 'ficus', 'plane']], flowerCycle = [0, 1, 2, 3, 4, 5], shrubCycle = ['shHib', 'shBou', 'shOle', 'shWhite', 'shYel', 'shGreen'];
    w.parks.forEach((pk, pi) => {
      const { x0, z0, x1, z1, cx, cz } = pk, e = 3.4;
      for (const [axis, c, a0, a1] of [['x', z0 + e, x0 + 3.2, cx - 3.4], ['x', z0 + e, cx + 3.4, x1 - 3.2], ['x', z1 - e, x0 + 3.2, cx - 3.4], ['x', z1 - e, cx + 3.4, x1 - 3.2], ['z', x0 + e, z0 + 3.2, cz - 3.4], ['z', x0 + e, cz + 3.4, z1 - 3.2], ['z', x1 - e, z0 + 3.2, cz - 3.4], ['z', x1 - e, cz + 3.4, z1 - 3.2]]) this.hedgeRun(axis, c, a0, a1);
      [[x0 + 8.5, z0 + 8.5], [x1 - 8.5, z0 + 8.5], [x0 + 8.5, z1 - 8.5], [x1 - 8.5, z1 - 8.5]].forEach(([x, z], k) => { // bamboo groves in the corners
        if (k % 2 === pi % 2 || k === 2) { this.add('bamboo', x, z, rng() * TAU, 1, 1, 0.95); this.claim(x, z, 1.6); w.grid.add({ x0: x - 0.9, x1: x + 0.9, z0: z - 0.9, z1: z + 0.9, y0: 0, y1: 6, type: 'pole' }); }
        else { for (let i = 0; i < 4; i++) { const sx = x + (rng() - 0.5) * 3, sz = z + (rng() - 0.5) * 3; this.shrub(shrubCycle[(i + k) % 6], sx, sz, 1 + rng() * 0.3); } this.add('reed0', x + 1.4, z - 1.2, 0, 1.1, 1.1, 1); }
      });
      for (let q = 0; q < 4; q++) { // four quadrants: one big tree, companions, an understory ring of shrubs
        const qx = cx + (q & 1 ? 17 : -17), qz = cz + (q & 2 ? 17 : -17), main = big[pi][q];
        const mx = qx + (rng() - 0.5) * 5, mz = qz + (rng() - 0.5) * 5; this.tree(main, mx, mz, 1.0 + rng() * 0.15);
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + rng(), d = 3.6 + rng() * 1.2, x = mx + Math.cos(a) * d, z = mz + Math.sin(a) * d; if (Math.abs(x - cx) > 3.2 && Math.abs(z - cz) > 3.2 && this.free(x, z, 0.6, { margin: 0.2 })) this.shrub(shrubCycle[(k + q + pi) % 6], x, z, 0.95 + rng() * 0.4); }
        for (let k = 0; k < 4; k++) { const a = rng() * TAU, d = 6 + rng() * 6, x = mx + Math.cos(a) * d, z = mz + Math.sin(a) * d, id = ['coco', 'royal', 'date', 'fan', 'coco'][Math.floor(rng() * 5)]; if (Math.abs(x - cx) > 4 && Math.abs(z - cz) > 4 && x > x0 + 6 && x < x1 - 6 && z > z0 + 6 && z < z1 - 6 && this.free(x, z, 0.5, { margin: 0.5 })) this.tree(id, x, z, 0.85 + rng() * 0.3); }
      }
      for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, x = cx + Math.cos(a) * 11.5, z = cz + Math.sin(a) * 11.5; if (this.free(x, z, 0.5, { margin: 0.4 })) this.tree(k & 1 ? 'royal' : 'royal', x, z, 0.9 + rng() * 0.15); } // royal palms round the fountain
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, x = cx + Math.cos(a) * 7.9, z = cz + Math.sin(a) * 7.9; if (Math.abs(x - cx) < 2.6 || Math.abs(z - cz) < 2.6) continue; this.add('bed', x, z, a, 1, 1, 1, 0.15, flowerCycle[(k + pi) % 6]); } // flower ring
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + 0.2, x = cx + Math.cos(a) * 5.0, z = cz + Math.sin(a) * 5.0; if (Math.abs(x - cx) < 2.4 || Math.abs(z - cz) < 2.4) continue; this.add('reed0', x, z, rng() * TAU, 0.9, 0.9, 1, 0.15); } // reeds at the basin
      for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const d of [13, 20, 27]) for (const sd of [-1, 1]) { // beds along the paths
        const x = cx + ax * d + (az ? sd * 3.7 : 0), z = cz + az * d + (ax ? sd * 3.7 : 0); if (!this.claimed(x, z, 1.0) && x > x0 + 4 && x < x1 - 4 && z > z0 + 4 && z < z1 - 4 && this.free(x, z, 0.7, { margin: 0.2, poi: 0.4 })) { this.add(rng() < 0.4 ? 'bedL' : 'bed', x, z, az ? 0 : Math.PI / 2, 1, 1, 1, 0.15, Math.floor(rng() * 6)); this.claim(x, z, 0.9); }
      }
      // lawn: jittered tufts over the grass, thinned by a low-frequency noise mask so the lawn has clumps, dry and bare patches (the path cross, the fountain, trunks and the hedge strip stay bare)
      for (let x = x0 + 1; x < x1 - 1; x += 1.2) for (let z = z0 + 1; z < z1 - 1; z += 1.2) {
        const jx = x + (rng() - 0.5) * 1.2, jz = z + (rng() - 0.5) * 1.2, dx = Math.abs(jx - cx), dz = Math.abs(jz - cz);
        if (dx < 2.6 || dz < 2.6 || Math.hypot(dx, dz) < 8.6 || jx < x0 + 1.2 || jx > x1 - 1.2 || jz < z0 + 1.2 || jz > z1 - 1.2 || this.claimed(jx, jz, 0.2)) continue;
        const m = vnoise(jx, jz, 6); // patchiness, about 0.5 on average: the low patches are mostly bare
        if (rng() > clamp(0.62 + (m - 0.5) * 2.4, 0.08, 1)) continue;
        // per-tuft variety: geometry from a position hash (tall or low dense mats), colour from the noise (dry clumps in the bare-ish patches, deep green in the lush ones)
        const hv = hash2(jx, jz), big = rng() < 0.12 + 0.25 * m;
        const id = big ? (hv < 0.5 ? 'grass1' : 'grass2') : (hv < 0.55 ? 'grass0' : 'grass3'), sub = m < 0.45 && hv > 0.4 ? 1 : m > 0.6 && hv < 0.35 ? 2 : 0;
        this.add(id, jx, jz, rng() * TAU, (0.5 + rng() * 0.5) * (0.7 + 0.6 * m), (0.6 + rng() * 0.6) * (0.75 + 0.5 * m), (0.75 + rng() * 0.4) * (0.85 + 0.3 * m), 0.15, sub);
      }
    });
  }
  planters() { // trough planters along the pavements, in place of the old uniform ones
    const w = this.w, rng = mulberry(6006);
    for (const seg of w.segments) {
      const A = seg.a, B = seg.b, fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx; if (!seg.horizontal && A.i === gridX) continue;
      for (const side of [1, -1]) for (const s of [22, 36]) {
        if (rng() > 0.42) continue; const d = 2.35, x = A.x + fx * (HALF + s) + rx * side * (HALF + d), z = A.z + fz * (HALF + s) + rz * side * (HALF + d);
        if (x < CITY.minX + HALF || x > CITY.maxX - HALF || z < CITY.minZ + HALF || z > CITY.maxZ - HALF || !this.free(x, z, 0.8, { margin: 0.25 })) continue;
        this.add('trough', x, z, seg.horizontal ? 0 : Math.PI / 2, 1, 1, 1); this.claim(x, z, 0.8); const hx = seg.horizontal ? 0.8 : 0.35, hz = seg.horizontal ? 0.35 : 0.8; w.grid.add({ x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz, y0: 0, y1: 1, type: 'prop' });
      }
    }
  }
  shopPots() { // pots on both sides of a shop door, wherever a storefront was recorded
    const w = this.w, rng = mulberry(9009), ids = ['potPalm', 'potFlower', 'potTop'];
    for (const sp of w.storeSpill) {
      const a0 = sp.a0, a1 = sp.a1; if (a1 - a0 < 6.5) continue;
      for (let a = a0 + 5.85; a < a1 - 0.3; a += 6) {
        if (rng() > 0.5) continue; const o = 0.62, x = sp.alongX ? a : sp.face + sp.dir * o, z = sp.alongX ? sp.face + sp.dir * o : a;
        if (!this.free(x, z, 0.36, { margin: 0.15, poi: 0.9 })) continue; this.add(ids[Math.floor(rng() * 3)], x, z, rng() * TAU, 0.9 + rng() * 0.3, 0.9 + rng() * 0.3, 1, undefined, Math.floor(rng() * 6));
        this.claim(x, z, 0.4); w.grid.add({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, y0: 0, y1: 1, type: 'prop' });
      }
    }
  }
  frontHedges() { // hedges along parking lots and in front of a few low buildings that have no shop windows on that side
    const w = this.w, rng = mulberry(1212);
    for (const L of w.lots) { // the lot edge that faces a street (within 3.6 m of the block edge)
      const bx0 = Math.floor((L.x0 - (CITY.roadX(0) + HALF)) / pitch) * pitch + CITY.roadX(0) + HALF, bz0 = Math.floor((L.z0 - (CITY.roadZ(0) + HALF)) / pitch) * pitch + CITY.roadZ(0) + HALF, bx1 = bx0 + CITY.block, bz1 = bz0 + CITY.block;
      if (L.z0 - bz0 < 3.6) this.hedgeRun('x', L.z0 + 0.5, L.x0 + 1, L.x1 - 1); if (bz1 - L.z1 < 3.6) this.hedgeRun('x', L.z1 - 0.5, L.x0 + 1, L.x1 - 1);
      if (L.x0 - bx0 < 3.6) this.hedgeRun('z', L.x0 + 0.5, L.z0 + 1, L.z1 - 1); if (bx1 - L.x1 < 3.6) this.hedgeRun('z', L.x1 - 0.5, L.z0 + 1, L.z1 - 1);
    }
    const shopFace = (alongX, face, a) => w.storeSpill.some(s => s.alongX === alongX && Math.abs(s.face - face) < 0.6 && a > s.a0 - 2 && a < s.a1 + 2) || w.signs.some(g => g.kind === 'wall' && g.alongX === alongX && Math.abs(g.face - face) < 0.8 && Math.abs(g.a - a) < g.w / 2 + 2);
    for (const b of w.buildings) {
      if (b.h > 26 || rng() > 0.2) continue;
      for (const [alongX, face, dir, a0, a1] of [[true, b.z0, -1, b.x0, b.x1], [true, b.z1, 1, b.x0, b.x1], [false, b.x0, -1, b.z0, b.z1], [false, b.x1, 1, b.z0, b.z1]]) {
        if (a1 - a0 < 9) continue; const mid = (a0 + a1) / 2; if (shopFace(alongX, face, mid) || shopFace(alongX, face, a0 + 3) || shopFace(alongX, face, a1 - 3)) continue;
        const c = face + dir * 0.75, x = alongX ? mid : c, z = alongX ? c : mid; if (!this.free(x, z, 0.7, { margin: 0.2, poi: 1.1 })) continue; // needs the pavement to be wide enough in front of the wall
        const len = Math.min(a1 - a0 - 5, 10); this.hedgeRun(alongX ? 'x' : 'z', c, mid - len / 2, mid + len / 2); break;
      }
    }
  }
  vines() { // curtains of ivy and bougainvillea on walls without shop windows or signs
    const w = this.w, rng = mulberry(1818), ids = [0, 0, 1, 2]; // atlas cell of the vine: ivy, bougainvillea, jasmine
    const bad = (alongX, face, a) => w.storeSpill.some(s => s.alongX === alongX && Math.abs(s.face - face) < 0.6 && a > s.a0 - 1.5 && a < s.a1 + 1.5) || w.signs.some(g => g.kind === 'wall' && g.alongX === alongX && Math.abs(g.face - face) < 0.8 && Math.abs(g.a - a) < g.w / 2 + 1.5);
    for (const b of w.buildings) {
      if (b.h < 7 || rng() > 0.2) continue;
      const sides = [[true, b.z0, -1, b.x0, b.x1], [true, b.z1, 1, b.x0, b.x1], [false, b.x0, -1, b.z0, b.z1], [false, b.x1, 1, b.z0, b.z1]], sd = sides[Math.floor(rng() * 4)], [alongX, face, dir, a0, a1] = sd;
      const cols = 1 + Math.floor(rng() * 3), id = ids[Math.floor(rng() * ids.length)], top = Math.min(b.h - 1.2, 4 + rng() * 9);
      for (let c = 0; c < cols; c++) {
        const a = a0 + 2 + rng() * (a1 - a0 - 4); if (bad(alongX, face, a)) continue;
        for (let y = 0; y < top; y += 3.1) this.add('vine', alongX ? a : face, alongX ? face : a, alongX ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2), 1, 0.9 + 0.25 * rng(), 0.85 + rng() * 0.25, y + (y === 0 ? 0.15 : 0), id);
      }
    }
  }
  outskirts() { // trees along the three open edges of the city so the ring road does not end at bare ground
    const rng = mulberry(2024), P = ['plane', 'ficus', 'coco', 'royal', 'jac', 'date', 'fan', 'ficus'];
    const row = (x0, z0, x1, z1, n) => { for (let i = 0; i < n; i++) { const t = (i + rng() * 0.7) / n, x = lerp(x0, x1, t) + (rng() - 0.5) * 6, z = lerp(z0, z1, t) + (rng() - 0.5) * 6; this.tree(P[Math.floor(rng() * P.length)], x, z, 0.9 + rng() * 0.35); } };
    row(CITY.minX - 11, CITY.minZ - 12, CITY.minX - 11, CITY.maxZ + 12, 34); row(CITY.minX - 11, CITY.minZ - 12, CITY.maxX - 4, CITY.minZ - 12, 56); row(CITY.minX - 11, CITY.maxZ + 12, CITY.maxX - 4, CITY.maxZ + 12, 56);
  }
}

// ======================================================================================
//  Lamps
// ======================================================================================
const Z = { u0: 0, u1: 0, v0: 0, v1: 0 }; // lamp geometry has no texture
const STATE_W = 1024, STATE_H = 4;           // one texel (rgb = colour x level, a = level) per light source
const LU = { uT: { value: 0 } };
// col: sRGB of the light, gain: emissive multiplier of the lens (bloom threshold is 1.02), halo: sprite size (m), pool: ground pool edge (m), k: pool strength,
// thr: night level at which the lamp comes on (range over the family), rate: ramp speed (1/s)
const FAM = {
  led: { col: 0xd4e6ff, gain: 5.0, halo: 2.3, pool: 14, k: 0.45, thr: [0.1, 0.42], rate: 7 },
  sodium: { col: 0xff9a36, gain: 3.6, halo: 2.8, pool: 14, k: 0.62, thr: [0.16, 0.5], rate: 0.32, warm: true },
  classic: { col: 0xffbe72, gain: 3.4, halo: 1.5, pool: 10, k: 0.6, thr: [0.08, 0.36], rate: 2.2 },
  mast: { col: 0xe9f2ff, gain: 6.0, halo: 3.6, pool: 21, k: 0.42, thr: [0.12, 0.4], rate: 5 },
  globe: { col: 0xffc684, gain: 3.0, halo: 1.3, pool: 8, k: 0.55, thr: [0.12, 0.44], rate: 3 },
  bollard: { col: 0xffd9a0, gain: 3.0, halo: 0.75, pool: 4.4, k: 0.5, thr: [0.15, 0.46], rate: 3 },
  string: { col: 0xffcf86, gain: 2.7, halo: 0.5, pool: 0, k: 0, thr: [0.3, 0.3], rate: 1.6 },
  neonPink: { col: 0xff3fa4, gain: 4.5, halo: 1.3, pool: 0, k: 0, thr: [0.22, 0.22], rate: 6, flick: true },
  neonCyan: { col: 0x3ce8f5, gain: 4.5, halo: 1.1, pool: 0, k: 0, thr: [0.22, 0.22], rate: 6 },
  neonViolet: { col: 0xb27cff, gain: 4.2, halo: 1.2, pool: 0, k: 0, thr: [0.24, 0.24], rate: 6 },
};
function loft(pb, secs, segs, col, kind = 0) { // housing: superellipse sections along local x
  const rings = [];
  for (const s of secs) { const ring = []; for (let j = 0; j <= segs; j++) { const a = j / segs * TAU, c = Math.cos(a), sn = Math.sin(a), ex = Math.sign(c) * Math.pow(Math.abs(c), 0.5), ey = Math.sign(sn) * Math.pow(Math.abs(sn), 0.5), n = nrm3(0, ey / Math.max(s.hh, 0.02), ex / Math.max(s.hw, 0.02)), sh = 0.8 + 0.2 * ey; ring.push(pb.v(s.x, s.y + ey * s.hh, ex * s.hw, n[0], n[1], n[2], 0, 0, [col[0] * sh, col[1] * sh, col[2] * sh], 0, kind, 1)); } rings.push(ring); }
  for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < segs; j++) pb.quad(rings[k][j], rings[k][j + 1], rings[k + 1][j + 1], rings[k + 1][j]);
}
function boxTilt(pb, cx, cy, cz, hx, hy, hz, tilt, col, kindBottom = 0) { // box rotated about z, only its underside glows
  const c = Math.cos(tilt), s = Math.sin(tilt), R = (x, y, z) => [cx + x * c - y * s, cy + x * s + y * c, cz + z], N = (x, y) => [x * c - y * s, x * s + y * c, 0];
  const F = (n, pts, kind) => { const nn = N(n[0], n[1]); nn[2] = n[2]; const ids = pts.map(p => { const q = R(p[0], p[1], p[2]); return pb.v(q[0], q[1], q[2], nn[0], nn[1], nn[2], 0, 0, kind ? [0.08, 0.09, 0.1] : col, 0, kind, 1); }); pb.quad(ids[0], ids[1], ids[2], ids[3]); };
  F([0, 1, 0], [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], 0); F([0, -1, 0], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], kindBottom);
  F([1, 0, 0], [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], 0); F([-1, 0, 0], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], 0);
  F([0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], 0); F([0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], 0);
}
const bez = (p0, p1, p2, p3, n) => { const out = []; for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; out.push([0, 1, 2].map(i => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i])); } return out; };
function geoCobra(sodium) { // tapered pole on a plinth, a curved arm, a cobra-head housing with a glowing lens (flat for LED, drop bowl for sodium)
  const pb = new PB(1, 0), steel = lin(0x8a9099), dark = lin(0x2b2f36), hous = lin(0xb4bac2), F = FAM[sodium ? 'sodium' : 'led'];
  lathe(pb, [[0.21, 0], [0.21, 0.16], [0.16, 0.22], [0.16, 0.62], [0.125, 0.68]], 8, dark, Z); boxPB(pb, -0.17, 0.7, -0.07, -0.118, 1.35, 0.07, lin(0x3a3f47), Z);
  tube(pb, [[0, 0.62, 0], [0, 3.5, 0], [0, 7.5, 0]], [0.118, 0.095, 0.07], 8, Z, 1, steel, steel);
  const arm = bez([0, 7.4, 0], [0.2, 8.35, 0], [1.0, 8.55, 0], [2.05, 8.2, 0], 6); tube(pb, arm, arm.map((p, k) => 0.068 - 0.018 * k / 6), 6, Z, 1, steel, steel);
  loft(pb, [{ x: 1.9, y: 8.18, hw: 0.09, hh: 0.06 }, { x: 2.15, y: 8.17, hw: 0.17, hh: 0.085 }, { x: 2.55, y: 8.16, hw: 0.2, hh: 0.095 }, { x: 2.85, y: 8.16, hw: 0.17, hh: 0.08 }, { x: 3.05, y: 8.17, hw: 0.1, hh: 0.05 }], 8, hous);
  if (sodium) blob(pb, 2.5, 8.1, 0, 0.36, 0.1, 0.15, [0.8, 0.8, 0.8], Z, 6, 1, F.gain); else boxPB(pb, 2.12, 8.055, -0.14, 2.92, 8.075, 0.14, [0.8, 0.8, 0.8], Z, 1, F.gain);
  blob(pb, 2.02, 8.27, 0, 0.045, 0.03, 0.045, dark, Z, 5);
  return pb.build();
}
function geoClassic() { // cast-iron post with collars and two scrolled arms, each carrying a hexagonal glass lantern
  const pb = new PB(1, 0), iron = lin(0x1f2a26), gold = lin(0xc9a24a), F = FAM.classic;
  lathe(pb, [[0.3, 0], [0.3, 0.12], [0.22, 0.2], [0.2, 0.5], [0.26, 0.62], [0.2, 0.72], [0.14, 0.82]], 8, iron, Z);
  tube(pb, [[0, 0.8, 0], [0, 4.0, 0]], [0.1, 0.07], 8, Z, 1, iron, iron);
  for (const y of [1.0, 3.3]) lathe(pb, [[0.1, y], [0.14, y + 0.03], [0.14, y + 0.07], [0.1, y + 0.1]], 8, gold, Z); lathe(pb, [[0.09, 3.9], [0.13, 4.0], [0.08, 4.28], [0.02, 4.42]], 8, iron, Z);
  for (const sg of [-1, 1]) {
    tube(pb, bez([0, 3.98, 0], [0, 4.1, sg * 0.45], [0, 4.0, sg * 0.75], [0, 4.5, sg * 0.95], 4), 0.035, 4, Z, 1, iron, iron);
    const cx = 0, cy = 4.52, cz = sg * 0.95; boxPB(pb, cx - 0.14, cy, cz - 0.14, cx + 0.14, cy + 0.05, cz + 0.14, iron, Z);
    lathe(pb, [[0.13, 0.05], [0.2, 0.52]], 6, [0.85, 0.85, 0.8], Z, 1, F.gain, cx, cy, cz); lathe(pb, [[0.22, 0.5], [0.22, 0.58]], 6, iron, Z, 1, 0, cx, cy, cz); lathe(pb, [[0.27, 0.58], [0.14, 0.72], [0.03, 0.84]], 6, iron, Z, 1, 0, cx, cy, cz); blob(pb, cx, cy + 0.88, cz, 0.04, 0.05, 0.04, gold, Z, 4);
  }
  return pb.build();
}
function geoMast() { // 12 m galvanised mast with a head frame and three floodlights angled down towards the road (+x)
  const pb = new PB(1, 0), steel = lin(0x8a9099), dark = lin(0x30343b);
  lathe(pb, [[0.34, 0], [0.34, 0.5], [0.26, 0.62], [0.22, 0.75]], 8, dark, Z); boxPB(pb, -0.27, 0.8, -0.1, -0.21, 1.9, 0.1, lin(0x3a3f47), Z);
  tube(pb, [[0, 0.7, 0], [0, 12, 0]], [0.2, 0.09], 8, Z, 1, steel, steel);
  lathe(pb, [[0.1, 11.9], [0.55, 12.0], [0.55, 12.06], [0.1, 12.1]], 8, dark, Z);
  for (const z of [-0.5, 0, 0.5]) { tube(pb, [[0.05, 12.05, 0], [0.4, 12.2, z * 0.6]], 0.03, 4, Z, 1, steel, steel); boxTilt(pb, 0.62, 12.2, z * 0.95, 0.3, 0.1, 0.19, -0.5, lin(0xa4aab3), FAM.mast.gain); }
  blob(pb, 0, 12.2, 0, 0.05, 0.3, 0.05, steel, Z, 4); // lightning rod
  return pb.build();
}
function geoGlobe() { // 3.4 m park post with an opal globe
  const pb = new PB(1, 0), iron = lin(0x22302a);
  lathe(pb, [[0.2, 0], [0.2, 0.12], [0.12, 0.2], [0.1, 0.5]], 9, iron, Z); tube(pb, [[0, 0.45, 0], [0, 2.0, 0], [0, 3.0, 0]], [0.075, 0.062, 0.055], 8, Z, 1, iron, iron);
  lathe(pb, [[0.05, 2.95], [0.19, 3.05], [0.14, 3.12]], 9, iron, Z); blob(pb, 0, 3.38, 0, 0.23, 0.25, 0.23, [0.9, 0.9, 0.85], Z, 9, 1, FAM.globe.gain); lathe(pb, [[0.2, 3.58], [0.1, 3.68], [0.02, 3.72]], 9, iron, Z);
  return pb.build();
}
function geoBollard() { // 0.95 m bollard with a glowing band
  const pb = new PB(1, 0), body = lin(0x30353d);
  lathe(pb, [[0.12, 0], [0.12, 0.42], [0.105, 0.44]], 10, body, Z); lathe(pb, [[0.108, 0.44], [0.108, 0.62]], 10, [0.8, 0.8, 0.8], Z, 1, FAM.bollard.gain); lathe(pb, [[0.12, 0.62], [0.12, 0.84], [0.09, 0.9], [0.0, 0.93]], 10, body, Z);
  return pb.build();
}
const LAMP_GEO = { led: () => geoCobra(false), sodium: () => geoCobra(true), classic: geoClassic, mast: geoMast, globe: geoGlobe, bollard: geoBollard };
function festoon(pb, p0, p1, sag, gain, rnd, halos) { // wire on a catenary with a bulb every 0.55 m (6 % dead, the rest twinkles)
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), n = Math.max(3, Math.ceil(len / 0.7)), pts = [];
  for (let k = 0; k <= n; k++) { const t = k / n; pts.push([lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t) - sag * 4 * t * (1 - t), lerp(p0[2], p1[2], t)]); }
  tube(pb, pts, 0.009, 4, Z, 1, [0.04, 0.04, 0.04], [0.04, 0.04, 0.04]);
  const nb = Math.max(2, Math.floor(len / 0.55));
  for (let k = 0; k <= nb; k++) { const t = (k + 0.5) / (nb + 1), x = lerp(p0[0], p1[0], t), y = lerp(p0[1], p1[1], t) - sag * 4 * t * (1 - t), z = lerp(p0[2], p1[2], t), dead = rnd() < 0.06;
    blob(pb, x, y - 0.075, z, 0.04, 0.055, 0.04, dead ? [0.3, 0.28, 0.24] : [0.9, 0.9, 0.8], Z, 5, 1, dead ? 0 : (rnd() < 0.5 ? -gain : gain)); if (!dead && halos) halos.push([x, y - 0.075, z]); }
}
function lampMaterial(stateTex) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.45 });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uState = { value: stateTex }; sh.uniforms.uT = LU.uT; sh.uniforms.fGlow = FU.fGlow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', () => '#include <common>\nattribute vec4 aSway; attribute float iIdx; uniform sampler2D uState; uniform float uT; varying vec3 vGlow;')
      .replace('#include <begin_vertex>', () => `#include <begin_vertex>
vec4 st = texelFetch(uState, ivec2(int(iIdx) & 1023, int(iIdx) >> 10), 0); float gz = abs(aSway.z), tw = aSway.z < 0.0 ? 0.8 + 0.2 * sin(uT * 2.6 + position.x * 9.0 + position.z * 7.0) : 1.0; vGlow = st.rgb * gz * tw;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', () => '#include <common>\nvarying vec3 vGlow; uniform float fGlow;').replace('#include <emissivemap_fragment>', () => '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlow;')
      .replace('#include <lights_fragment_end>', () => '#include <lights_fragment_end>\nreflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(1.0, 0.72, 0.45) * fGlow * 0.8; // poles pick up the glow of the city instead of going pure black');
  };
  mat.customProgramCacheKey = () => 'lamp-v1'; return mat;
}
const HALO_VS = `attribute vec4 iPos; attribute float iIdx; uniform sampler2D uState; uniform float uRain, fogNear, fogFar; varying vec2 vUv; varying vec3 vC; varying float vA;
void main(){ vec4 st = texelFetch(uState, ivec2(int(iIdx) & 1023, int(iIdx) >> 10), 0); vec4 mv = viewMatrix * vec4(iPos.xyz, 1.0); float d = -mv.z;
  mv.xy += position.xy * iPos.w * (1.0 + d * 0.012 + uRain * 0.3); gl_Position = projectionMatrix * mv; vUv = uv; vC = st.rgb;
  vA = (1.0 - smoothstep(fogNear, fogFar, d)) * smoothstep(1.2, 6.0, d) * (1.0 + uRain * 0.25) * step(0.001, st.a); }`;
const HALO_FS = `varying vec2 vUv; varying vec3 vC; varying float vA;
void main(){ vec2 q = vUv * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard; float a = exp(-r2 * 22.0) + exp(-r2 * 6.0) * 0.38 + exp(-r2 * 2.2) * (1.0 - r2) * 0.16; gl_FragColor = vec4(vC * a * vA, 1.0); }`;
const STREAK_VS = `attribute vec4 iPos; attribute float iIdx; uniform sampler2D uState; varying vec2 vQ; varying vec3 vC; varying vec3 vW; varying float vA;
void main(){ vec4 st = texelFetch(uState, ivec2(int(iIdx) & 1023, int(iIdx) >> 10), 0); vec3 L = iPos.xyz, C = cameraPosition; vec2 d2 = C.xz - L.xz; float D = max(length(d2), 0.5); vec2 dir = d2 / D;
  float hr = L.y / (L.y + max(C.y, 0.4)); vec2 sp = L.xz + dir * D * hr; float len = clamp(1.2 + D * 0.25, 1.5, 12.0), wid = 0.4 + D * 0.016; vec2 perp = vec2(-dir.y, dir.x);
  vec2 xz = sp + perp * position.x * wid * 2.0 + dir * (position.y * len * 2.0 + len * 0.25); vW = vec3(xz.x, 0.035, xz.y); vQ = position.xy * 2.0; vC = st.rgb;
  vA = st.a * (1.0 - smoothstep(60.0, 130.0, D)) * smoothstep(3.0, 10.0, D) * iPos.w; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`;
const STREAK_FS = `uniform float uWet, uTime; uniform vec4 uRoad, uBounds; varying vec2 vQ; varying vec3 vC; varying vec3 vW; varying float vA;
float roadMask(vec2 p){ vec2 f = mod(p - uRoad.xy, uRoad.z); float r = max(1.0 - smoothstep(uRoad.w - 0.35, uRoad.w + 0.1, f.x), 1.0 - smoothstep(uRoad.w - 0.35, uRoad.w + 0.1, f.y)); return r * step(uBounds.x, p.x) * step(p.x, uBounds.y) * step(uBounds.z, p.y) * step(p.y, uBounds.w); }
void main(){ float s = vQ.y, a = vQ.x; float prof = exp(-a * a * 3.2) * pow(max(1.0 - abs(s - 0.1), 0.0), 1.7); float rip = 0.62 + 0.38 * sin(s * 30.0 + uTime * 5.0 + a * 3.0 + vW.x * 0.7);
  float k = prof * rip * vA * roadMask(vW.xz) * (0.04 + 0.6 * uWet * uWet); gl_FragColor = vec4(vC * k, 1.0); }`;

export class Lamps {
  constructor(world) {
    this.w = world; this.list = []; this.src = []; this.night = 0; this.rain = 0; this.wet = 0; this.seen = false; this.inst = {}; this.groups = []; this.halos = []; this.streaks = []; this.meshes = []; this.group = new THREE.Group(); this.group.name = 'lamps'; world.scene.add(this.group);
    this.stateData = new Float32Array(STATE_W * STATE_H * 4); this.stateTex = new THREE.DataTexture(this.stateData, STATE_W, STATE_H, THREE.RGBAFormat, THREE.FloatType); this.stateTex.minFilter = this.stateTex.magFilter = THREE.NearestFilter; this.stateTex.generateMipmaps = false; this.stateTex.needsUpdate = true;
    this.mat = lampMaterial(this.stateTex); this.rng = mulberry(424242); this.fogN = 100; this.fogF = 800; this.dirty = false; this.quality = world.quality; this.cam = new THREE.Vector3(0, 40, 0);
    const sc = world.scene, prev = sc.onBeforeRender, self = this; sc.onBeforeRender = function (r, s, cam, ...rest) { prev.call(this, r, s, cam, ...rest); if (cam.isPerspectiveCamera) { self.cam.copy(cam.position); self.cull(); } }; // lamp chunks beyond ~190 m are only seen as halos
  }
  cull() { const c = this.cam; for (const m of this.meshes) { const u = m.userData; m.visible = Math.hypot(u.cx - c.x, u.cz - c.z) < u.lim; } }
  // a new light source: returns its state index
  source(fam, x, z, o = {}) {
    const F = FAM[fam], i = this.src.length; if (i >= STATE_W * STATE_H) return STATE_W * STATE_H - 1; const rnd = this.rng, wave = 0.5 + 0.5 * Math.sin(x * 0.011 + z * 0.0137), u = 0.65 * rnd() + 0.35 * wave;
    const dead = o.dead ?? (rnd() < 0.045), sick = !dead && (o.flick ?? (F.flick || rnd() < 0.045)), late = !dead && !sick && rnd() < 0.03; _c.setHex(F.col);
    this.src.push({ fam, col: [_c.r, _c.g, _c.b], thr: lerp(F.thr[0], F.thr[1], u) + (late ? 0.4 : 0), on: false, level: 0, rate: F.rate, warm: !!F.warm, flick: sick, dead, t0: -9, id: i });
    return i;
  }
  // a street / park / pier lamp. (x, z): pole; rot: yaw so that the arm (+x) points to the road. Records the entry that World exposes as lampPositions.
  lamp(fam, x, z, rot, o = {}) {
    const F = FAM[fam], head = fam === 'led' || fam === 'sodium' ? 2.55 : fam === 'mast' ? 0.62 : 0, hy = { led: 8.1, sodium: 8.05, classic: 4.7, mast: 12.1, globe: 3.4, bollard: 0.7 }[fam], base = o.y ?? 0;
    const hx = x + Math.cos(rot) * head, hz = z - Math.sin(rot) * head, idx = this.source(fam, hx, hz, o), s = this.src[idx];
    const e = { x: hx, y: Math.min(hy, 8.4) + base, z: hz, px: x, pz: z, hy: hy + base, horizontal: o.horizontal, rc: o.rc, curb: o.curb, fam, idx, pool: s.dead ? 0 : (o.pool ?? F.pool), k: F.k, road: !!o.road, broken: s.dead, lit: 0, color: F.col, power: o.power ?? 1, rot };
    this.list.push(e); (this.inst[fam] || (this.inst[fam] = [])).push(x, base, z, rot, idx);
    this.w.grid.add({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15, y0: base, y1: base + Math.min(hy, 7), type: 'pole' });
    if (!s.dead && F.halo > 0) { if (fam === 'classic') for (const sg of [-1, 1]) this.halos.push(x + Math.sin(rot) * sg * 0.95, hy + base - 0.05, z + Math.cos(rot) * sg * 0.95, F.halo, idx); else this.halos.push(hx, hy + base - 0.1, hz, F.halo, idx); }
    if (!s.dead && o.road) this.streaks.push(hx, hy + base, hz, fam === 'mast' ? 1.2 : fam === 'classic' ? 0.7 : 1, idx);
    return e;
  }
  group_(fam, build) { // a hand-built static set (festoons, neon): one source, one merged mesh
    const idx = this.source(fam, 0, 0, { dead: false, flick: FAM[fam].flick }), pb = new PB(1, 0), halos = []; build(pb, halos); if (!pb.nv) return;
    const g = pb.build(); g.setAttribute('iIdx', new THREE.InstancedBufferAttribute(new Float32Array([idx]), 1)); const mesh = new THREE.InstancedMesh(g, this.mat, 1); mesh.setMatrixAt(0, _m.identity()); mesh.computeBoundingSphere(); mesh.frustumCulled = true; mesh.userData = { cx: mesh.boundingSphere.center.x, cz: mesh.boundingSphere.center.z, lim: 300 + mesh.boundingSphere.radius };
    this.group.add(mesh); this.meshes.push(mesh); for (const h of halos) this.halos.push(h[0], h[1], h[2], FAM[fam].halo, idx);
  }
  build() {
    const w = this.w, rng = mulberry(8128), P = Object.values(w.pois).filter(p => typeof p.x === 'number'); // a lamp never stands within 2.2 m of a point of interest (its marker is a 1.7 m disc)
    const nearPoi = (x, z) => P.some(p => Math.hypot(p.x - x, p.z - z) < 2.2 || (typeof p.bx0 === 'number' && inFront(frontOf(p), x, z))); // and never on a shop's frontage
    // street lamps along every segment: LED cobra heads, a quarter of the streets on sodium, classic lanterns downtown, masts on the beach side of the coast road
    for (const seg of w.segments) {
      const A = seg.a, B = seg.b, fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx, coast = !seg.horizontal && A.i === gridX, dm = Math.hypot((A.x + B.x) / 2 / 390, (A.z + B.z) / 2 / 312);
      const base = dm < 0.4 ? 'classic' : hash2(A.i * 13 + B.i * 7, A.j * 11 + B.j * 5) < 0.28 ? 'sodium' : 'led';
      for (const side of [1, -1]) {
        const fam = coast ? (side < 0 ? 'mast' : 'led') : base, list = fam === 'classic' ? [18, 39] : fam === 'mast' ? [12, 44] : [16, 42];
        for (const s of list) {
          const x = A.x + fx * (HALF + s) + rx * side * (HALF + 0.8), z = A.z + fz * (HALF + s) + rz * side * (HALF + 0.8), rot = Math.atan2(rz * side, -rx * side);
          if (nearPoi(x, z)) continue;
          this.lamp(fam, x, z, rot, { horizontal: seg.horizontal, rc: seg.horizontal ? A.z : A.x, curb: seg.horizontal ? A.z + rz * side * HALF : A.x + rx * side * HALF, road: true });
        }
      }
    }
    // parks: globe posts along the two paths, bollards round the fountain
    for (const pk of w.parks) {
      for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const d of [13, 21, 29]) for (const sd of [-1, 1]) { const x = pk.cx + ax * d + (az ? sd * 2.9 : 0), z = pk.cz + az * d + (ax ? sd * 2.9 : 0); if (d === 29 && sd > 0) continue; this.lamp('globe', x, z, 0, {}); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.39, x = pk.cx + Math.cos(a) * 5.9, z = pk.cz + Math.sin(a) * 5.9; this.lamp('bollard', x, z, 0, {}); }
    }
    // beach: bollards along the promenade, two masts flanking the beach club, festoons and a neon portal at its door
    const bx = CITY.beachX;
    for (let z = CITY.minZ + 20; z < CITY.maxZ - 10; z += 14) { if (Math.abs(z) < 24 || Math.abs(z + 200) < 12) continue; this.lamp('bollard', bx + 10.5, z, 0, {}); }
    this.lamp('mast', bx + 3.5, -20, Math.PI, { road: false, pool: 20 }); this.lamp('mast', bx + 3.5, 20, Math.PI, { road: false, pool: 20 });
    const club = w.pois.club, deck = bx + 34;
    this.group_('string', (pb, halos) => { // in front of the club and over its seaward deck
      const posts = [[bx + 1.2, -14], [bx + 1.2, -7], [bx + 1.2, 7], [bx + 1.2, 14], [deck, -12], [deck, -4], [deck, 4], [deck, 12]];
      for (const [x, z] of posts) { tube(pb, [[x, 0, z], [x, 4.7, z]], 0.045, 5, Z, 1, [0.1, 0.1, 0.11], [0.1, 0.1, 0.11]); w.grid.add({ x0: x - 0.1, x1: x + 0.1, z0: z - 0.1, z1: z + 0.1, y0: 0, y1: 4.7, type: 'pole' }); }
      const L = [[[bx + 1.2, 4.6, -14], [bx + 1.2, 4.6, -7], 0.5], [[bx + 1.2, 4.6, -7], [bx + 1.2, 4.6, 7], 1.1], [[bx + 1.2, 4.6, 7], [bx + 1.2, 4.6, 14], 0.5], [[bx + 1.2, 4.6, -14], [bx + 6, 5.4, -13], 0.4], [[bx + 1.2, 4.6, 14], [bx + 6, 5.4, 13], 0.4], [[bx + 1.2, 4.6, -7], [bx + 6, 5.4, -6], 0.3], [[bx + 1.2, 4.6, 7], [bx + 6, 5.4, 6], 0.3],
        [[deck, 4.7, -12], [deck, 4.7, -4], 0.5], [[deck, 4.7, -4], [deck, 4.7, 4], 0.5], [[deck, 4.7, 4], [deck, 4.7, 12], 0.5], [[deck, 4.7, -12], [bx + 30, 5.6, -12], 0.5], [[deck, 4.7, 12], [bx + 30, 5.6, 12], 0.5], [[deck, 4.7, -4], [bx + 30, 5.6, -4], 0.45], [[deck, 4.7, 4], [bx + 30, 5.6, 4], 0.45]];
      for (const [a, b, sag] of L) festoon(pb, a, b, sag, FAM.string.gain, rng, halos);
      for (const [a, b] of L) for (const p of [a, b]) { // a dark bracket where each wire is fixed to the club wall (west face at bx+6, east face at bx+30), so it reads as hung, not floating
        const west = Math.abs(p[0] - (bx + 6)) < 0.01, east = Math.abs(p[0] - (bx + 30)) < 0.01; if (!west && !east) continue;
        const out = west ? -0.15 : 0.15; // the wall stands on the far side of the anchor, the bracket sticks out towards the street or the deck
        boxPB(pb, Math.min(p[0], p[0] + out) - 0.02, p[1] - 0.09, p[2] - 0.09, Math.max(p[0], p[0] + out) + 0.02, p[1] + 0.09, p[2] + 0.09, lin(0x1d1d24), Z);
      }
    });
    this.group_('neonPink', (pb, halos) => { // a neon portal in front of the club door
      const x = bx + 4.7, h = 3.7, g = FAM.neonPink.gain; for (const z of [-3.2, 3.2]) { w.grid.add({ x0: x - 0.14, x1: x + 0.14, z0: z - 0.14, z1: z + 0.14, y0: 0, y1: h, type: 'pole' }); boxPB(pb, x - 0.12, 0, z - 0.12, x + 0.12, h + 0.2, z + 0.12, lin(0x1d1d24), Z); tube(pb, [[x + 0.16, 0.2, z], [x + 0.16, h, z]], 0.03, 6, Z, 1, [1, 1, 1], [1, 1, 1], 0, g); }
      tube(pb, bez([x + 0.16, h, -3.2], [x + 0.16, h + 1.1, -1.6], [x + 0.16, h + 1.1, 1.6], [x + 0.16, h, 3.2], 14), 0.035, 6, Z, 1, [1, 1, 1], [1, 1, 1], 0, g); halos.push([x + 0.2, h + 0.7, 0], [x + 0.2, 2, -3.2], [x + 0.2, 2, 3.2]);
    });
    // the pier: lantern posts down both rails, festoons between them, a cyan neon line along the rail tops
    const pr = w.pier;
    if (pr) {
      const zs = [pr.z - 4.15, pr.z + 4.15], xs = []; for (let x = pr.x0 + 8; x < pr.x1 - 12; x += 12) xs.push(x);
      for (const z of zs) for (const x of xs) this.lamp('classic', x, z, z < pr.z ? Math.PI / 2 : -Math.PI / 2, { y: pr.y, pool: 8 });
      this.group_('string', (pb, halos) => { for (const z of zs) for (let i = 0; i + 1 < xs.length; i++) festoon(pb, [xs[i], pr.y + 4.5, z], [xs[i + 1], pr.y + 4.5, z], 0.7, FAM.string.gain, rng, halos); });
      this.group_('neonCyan', (pb, halos) => { for (const z of [pr.z - 4.5, pr.z + 4.5]) { tube(pb, [[pr.x0, pr.y + 2.04, z], [(pr.x0 + pr.x1) / 2, pr.y + 2.04, z], [pr.x1, pr.y + 2.04, z]], 0.03, 6, Z, 1, [1, 1, 1], [1, 1, 1], 0, FAM.neonCyan.gain); for (let x = pr.x0 + 6; x < pr.x1; x += 12) halos.push([x, pr.y + 2.1, z]); } });
    }
    // wall-hung festoons over burger bars and the casino
    this.group_('string', (pb, halos) => {
      for (const id in w.pois) { const p = w.pois[id]; if (!(p.type === 'burger' || p.type === 'casino') || p.bx0 === undefined) continue; const z = p.bz0 - 0.2;
        for (const y of [3.75]) for (let x = p.bx0 + 1; x + 4 <= p.bx1 - 1 + 0.01; x += 4) festoon(pb, [x, y, z], [x + 4, y, z], 0.4, FAM.string.gain, rng, halos); }
    });
    this.group_('neonViolet', (pb, halos) => { // violet accent rails on the pier hut and the casino canopy line
      const p = w.pois.casino; if (p && p.bx0 !== undefined) { tube(pb, [[p.bx0 + 0.6, 3.4, p.bz0 - 0.25], [p.bx1 - 0.6, 3.4, p.bz0 - 0.25]], 0.03, 6, Z, 1, [1, 1, 1], [1, 1, 1], 0, FAM.neonViolet.gain); halos.push([(p.bx0 + p.bx1) / 2, 3.4, p.bz0 - 0.4]); }
    });
    this.commit();
  }
  commit() {
    const CHK = 96;
    for (const fam in this.inst) {
      const L = this.inst[fam], base = LAMP_GEO[fam](), chunks = new Map();
      for (let i = 0; i < L.length; i += 5) { const key = Math.floor(L[i] / CHK) * 1000 + Math.floor(L[i + 2] / CHK); let a = chunks.get(key); if (!a) chunks.set(key, a = []); a.push(i); }
      for (const ids of chunks.values()) {
        const g = new THREE.BufferGeometry(); for (const k in base.attributes) g.setAttribute(k, base.attributes[k]); g.setIndex(base.index);
        g.setAttribute('iIdx', new THREE.InstancedBufferAttribute(new Float32Array(ids.map(i => L[i + 4])), 1));
        const mesh = new THREE.InstancedMesh(g, this.mat, ids.length); ids.forEach((i, k) => { _p.set(L[i], L[i + 1], L[i + 2]); _q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, L[i + 3]); _s.set(1, 1, 1); _m.compose(_p, _q, _s); mesh.setMatrixAt(k, _m); });
        mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 1; mesh.castShadow = false; mesh.receiveShadow = false; mesh.userData = { cx: mesh.boundingSphere.center.x, cz: mesh.boundingSphere.center.z, lim: (fam === 'mast' ? 220 : fam === 'bollard' || fam === 'globe' ? 110 : 160) + mesh.boundingSphere.radius }; this.group.add(mesh); this.meshes.push(mesh);
      }
    }
    // halo sprites: one instanced quad per glowing head or bulb (additive, depth tested)
    const hn = this.halos.length / 5, hg = new THREE.InstancedBufferGeometry(), quad = new THREE.PlaneGeometry(1, 1); hg.setIndex(quad.index); hg.setAttribute('position', quad.attributes.position); hg.setAttribute('uv', quad.attributes.uv); hg.instanceCount = hn;
    const ip = new Float32Array(hn * 4), ii = new Float32Array(hn); for (let i = 0; i < hn; i++) { ip.set(this.halos.slice(i * 5, i * 5 + 4), i * 4); ii[i] = this.halos[i * 5 + 4]; } hg.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 4)); hg.setAttribute('iIdx', new THREE.InstancedBufferAttribute(ii, 1));
    this.haloU = { uState: { value: this.stateTex }, uRain: { value: 0 }, fogNear: { value: 100 }, fogFar: { value: 800 } };
    this.haloMesh = new THREE.Mesh(hg, new THREE.ShaderMaterial({ uniforms: this.haloU, vertexShader: HALO_VS, fragmentShader: HALO_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); this.haloMesh.frustumCulled = false; this.haloMesh.renderOrder = 6; this.haloMesh.visible = false; this.group.add(this.haloMesh);
    // wet-road reflection streaks under every street lamp: one ground quad per lamp, stretched towards the camera in the vertex shader
    const sn = this.streaks.length / 5, sg = new THREE.InstancedBufferGeometry(); sg.setIndex(quad.index); sg.setAttribute('position', quad.attributes.position); sg.setAttribute('uv', quad.attributes.uv); sg.instanceCount = sn;
    const sp = new Float32Array(sn * 4), si = new Float32Array(sn); for (let i = 0; i < sn; i++) { sp.set(this.streaks.slice(i * 5, i * 5 + 4), i * 4); si[i] = this.streaks[i * 5 + 4]; } sg.setAttribute('iPos', new THREE.InstancedBufferAttribute(sp, 4)); sg.setAttribute('iIdx', new THREE.InstancedBufferAttribute(si, 1));
    this.streakU = { uState: { value: this.stateTex }, uWet: { value: 0 }, uTime: { value: 0 }, uRoad: { value: new THREE.Vector4(CITY.roadX(0) - HALF, CITY.roadZ(0) - HALF, pitch, road) }, uBounds: { value: new THREE.Vector4(CITY.minX, CITY.maxX, CITY.minZ, CITY.maxZ) } };
    this.streakMesh = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: this.streakU, vertexShader: STREAK_VS, fragmentShader: STREAK_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.streakMesh.frustumCulled = false; this.streakMesh.renderOrder = 5; this.streakMesh.visible = false; this.group.add(this.streakMesh);
    this.lampList = this.list.filter(e => !e.broken && (e.fam === 'led' || e.fam === 'sodium' || e.fam === 'classic' || e.fam === 'mast')); // what the PointLight pool may pick from
  }
  setQuality(q) { this.quality = q; }
  // night factor 0..1 (sky), rain 0..1 and the scene fog range (the halo sprites fade with the fog)
  setNight(f, rain, fogNear, fogFar) {
    this.night = f; this.rain = rain || 0; this.haloU.fogNear.value = fogNear; this.haloU.fogFar.value = fogFar; this.haloU.uRain.value = this.rain;
    const any = f >= 0.04; this.haloMesh.visible = any; this.streakMesh.visible = any && this.quality !== 'low' && this.wet > 0.02;
    if (!this.seen) { this.seen = true; for (const s of this.src) { s.on = !s.dead && f >= s.thr; s.level = s.on ? 1 : 0; } this.dirty = true; this.write(); }
  }
  write() {
    const d = this.stateData; for (let i = 0; i < this.src.length; i++) { const s = this.src[i], L = s.level, o = i * 4; s.wl = L; let r = s.col[0], g = s.col[1], b = s.col[2];
      if (s.warm) { const k = sstep(0.3, 0.95, L); r = lerp(0.9, r, k); g = lerp(0.09, g, k); b = lerp(0.02, b, k); } // sodium warm-up: dim red-orange to full amber
      d[o] = r * L; d[o + 1] = g * L; d[o + 2] = b * L; d[o + 3] = L; }
    this.stateTex.needsUpdate = true; this.dirty = false;
  }
  update(dt, t) {
    LU.uT.value = t % 2000; this.streakU.uTime.value = t % 2000; this.wet += (this.rain - this.wet) * Math.min(1, dt * (this.rain > this.wet ? 0.6 : 0.15)); this.streakU.uWet.value = this.wet; this.streakMesh.visible = this.night >= 0.04 && this.quality !== 'low' && this.wet > 0.02;
    const f = this.night, S = this.src; let changed = this.dirty;
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; if (s.dead) continue; const want = s.on ? f >= s.thr - 0.05 : f >= s.thr; if (want !== s.on) { s.on = want; s.t0 = t; }
      let target = s.on ? 1 : 0;
      if (s.on && s.flick) { const burst = hash2(Math.floor(t * 0.3), i) < 0.55; if (burst) { const p = hash2(Math.floor(t * 14), i * 3 + 1); target = p < 0.25 ? 0.08 : p < 0.4 ? 0.55 : 1; } }
      else if (s.on && !s.warm && s.rate > 4 && t - s.t0 < 0.6) target = hash2(Math.floor((t - s.t0) * 22), i) > 0.45 ? 1 : 0.12; // LEDs stutter for a moment when they start
      const k = 1 - Math.exp(-dt * (target < s.level ? Math.max(5, s.rate * 3) : s.rate)), nl = s.level + (target - s.level) * k;
      // the level is integrated every frame (the ramp does not depend on the frame rate); the state texture is re-written once a level has moved 0.002 since its last write
      let v = nl; if (target === 0 && v < 0.003) v = 0; else if (target === 1 && v > 0.997) v = 1; s.level = v; const w = s.wl ?? -1; if (v !== w && (Math.abs(v - w) > 0.002 || v === 0 || v === 1)) changed = true;
    }
    if (changed) { this.write(); for (const e of this.list) e.lit = S[e.idx].level; }
  }
}

import * as THREE from '../vendor/three.module.min.js';
import { mulberry } from './utils.js';

const cache = new Map();
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 16; t.needsUpdate = true; return t;
}
const memo = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };

// Facade styles: one tile = 8 m wide x 4 floors (14 m). Returns {map, emissiveMap}
export const FACADES = [
  { id: 'glass',   wall: '#1d2a44', frame: '#0f1626', win: '#2f4f7d', lit: '#ffe6a8', winW: 0.86, winH: 0.72, glow: 0.55 },
  { id: 'deco',    wall: '#efd9c6', frame: '#c9a58a', win: '#31405a', lit: '#ffd88a', winW: 0.42, winH: 0.6, glow: 0.45, bands: '#e5b8a8' },
  { id: 'mint',    wall: '#bfe6d7', frame: '#ffffff', win: '#243a4d', lit: '#ffe2a8', winW: 0.5, winH: 0.62, glow: 0.4, bands: '#8fc9b6' },
  { id: 'pink',    wall: '#f2b9c8', frame: '#ffffff', win: '#2c3346', lit: '#ffe6b0', winW: 0.46, winH: 0.6, glow: 0.4, bands: '#d98aa2' },
  { id: 'concrete',wall: '#9a958f', frame: '#6e6a66', win: '#2a2f38', lit: '#ffdd99', winW: 0.6, winH: 0.55, glow: 0.35 },
  { id: 'brick',   wall: '#8b4a3b', frame: '#5c2f26', win: '#25303d', lit: '#ffcf80', winW: 0.4, winH: 0.58, glow: 0.35 },
  { id: 'tower',   wall: '#141824', frame: '#0b0e16', win: '#3a4a6a', lit: '#d8ecff', winW: 0.9, winH: 0.8, glow: 0.55 },
  { id: 'white',   wall: '#f4f1ea', frame: '#d8d2c6', win: '#2b3a4a', lit: '#ffe4a6', winW: 0.5, winH: 0.65, glow: 0.4, bands: '#dcd5c8' },
];

// emissiveMap is a MASK of every window (white, fading 1.0 -> 0.72 from the top of a pane to its bottom, a 5 px darker inner rim,
// black mullions). It carries no lit pattern at all: which panes glow, and in which colour, is decided per building in the facade
// shader that world.js patches in (see patchWindowShader), so no two buildings share a lit-window stamp.
export function facadeTextures(style, seed = 1) {
  return memo('facade' + style.id, () => {
    const W = 256, H = 448, cols = 4, rows = 4, cw = W / cols, ch = H / rows;
    const drawMask = ctx => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const ww = cw * style.winW, wh = ch * style.winH, x = c * cw + (cw - ww) / 2, y = r * ch + (ch - wh) / 2 + ch * 0.05;
        const g = ctx.createLinearGradient(0, y, 0, y + wh); g.addColorStop(0, 'rgb(255,255,255)'); g.addColorStop(1, 'rgb(184,184,184)'); // 1.0 -> 0.72
        ctx.fillStyle = g; ctx.fillRect(x, y, ww, wh);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 5; ctx.strokeRect(x + 2.5, y + 2.5, ww - 5, wh - 5); // darker inner rim
        ctx.fillStyle = '#000'; ctx.fillRect(x + ww / 2 - 1, y, 2, wh); ctx.fillRect(x, y + wh / 2 - 1, ww, 2); // mullions, like the diffuse map
      }
    };
    // The colour map is drawn at twice the resolution of the other maps (same uv layout): wall material per style (brick courses, concrete panels, stucco, curtain wall) around the windows.
    const drawColor = ctx => { ctx.scale(2, 2); drawWall(ctx, style, W, H, cols, rows, cw, ch, mulberry(seed * 7919 + style.id.length * 17 + style.id.charCodeAt(1))); };
    return { map: canvasTex(W * 2, H * 2, drawColor), emissiveMap: canvasTex(W, H, drawMask, { linear: true }), glow: style.glow }; // mask values are data: no sRGB decoding
  });
}
function drawWall(ctx, style, W, H, cols, rows, cw, ch, rng) {
  const id = style.id, glassy = id === 'glass' || id === 'tower';
  ctx.fillStyle = id === 'brick' ? '#a69887' : style.wall; ctx.fillRect(0, 0, W, H);
  const speck = (n, a, v0, v1, sz = 1) => { for (let i = 0; i < n; i++) { const v = Math.floor(v0 + rng() * (v1 - v0)); ctx.fillStyle = `rgba(${v},${v},${v},${rng() * a})`; ctx.fillRect(rng() * W, rng() * H, sz + rng() * sz, sz + rng() * sz); } };
  if (id === 'brick') { // running bond, per-brick tone, a few burnt and pale ones
    const bw = 7.4, bh = 2.8; for (let y = 0, row = 0; y < H; y += bh, row++) for (let x = -(row % 2 ? bw / 2 : 0); x < W; x += bw) { const v = (rng() - 0.5) * 44, k = rng(), tone = k < 0.04 ? -34 : k > 0.96 ? 30 : 0; ctx.fillStyle = `rgb(${Math.round(139 + v + tone)},${Math.round(76 + v * 0.62 + tone * 0.6)},${Math.round(60 + v * 0.5 + tone * 0.5)})`; ctx.fillRect(x + 0.3, y + 0.28, bw - 0.6, bh - 0.56); }
    speck(500, 0.16, 30, 110, 1);
  } else if (id === 'concrete') { // board-formed panels with seams and tie holes
    for (let x = 0; x < W; x += cw) { ctx.fillStyle = 'rgba(30,28,26,0.38)'; ctx.fillRect(x, 0, 1.2, H); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 1.2, 0, 1, H); }
    for (let r = 0; r < rows; r++) { const y = r * ch; ctx.fillStyle = 'rgba(30,28,26,0.4)'; ctx.fillRect(0, y, W, 1.2); for (let c = 0; c < cols; c++) for (const [tx, ty] of [[10, 12], [cw - 10, 12], [10, ch - 12], [cw - 10, ch - 12]]) { ctx.fillStyle = 'rgba(30,28,26,0.5)'; ctx.beginPath(); ctx.arc(c * cw + tx, y + ty, 1.1, 0, 6.28); ctx.fill(); } }
    speck(1400, 0.1, 60, 220, 1); for (let i = 0; i < 26; i++) { const x = rng() * W, w = 2 + rng() * 9, g = ctx.createLinearGradient(0, 0, 0, H); const y0 = rng() * H * 0.8; ctx.fillStyle = `rgba(48,44,40,${0.05 + rng() * 0.08})`; ctx.fillRect(x, y0, w, 30 + rng() * 150); void g; }
  } else if (!glassy) { // stucco: fine grain, soft vertical flutes at the window piers, floor reveals
    speck(1800, 0.09, 150, 255, 1); speck(900, 0.08, 40, 120, 1);
    for (let c = 0; c < cols; c++) { const x = c * cw; ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(x, 0, 1.5, H); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x + 1.5, 0, 1.2, H); }
    for (let i = 0; i < 22; i++) { const x = rng() * W, w = 2 + rng() * 7; ctx.fillStyle = `rgba(70,55,40,${0.03 + rng() * 0.05})`; ctx.fillRect(x, rng() * H * 0.7, w, 30 + rng() * 120); }
  } else { // curtain wall spandrels: dark metal panels with a seam
    speck(700, 0.07, 80, 200, 1); for (let r = 0; r < rows; r++) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, r * ch + ch - 7, W, 1); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, r * ch + ch - 6, W, 1.5); }
  }
  if (style.bands) { ctx.fillStyle = style.bands; for (let r = 0; r < rows; r++) ctx.fillRect(0, r * ch + ch - 6, W, 6); }
  if (id === 'brick') { for (let r = 0; r < rows; r++) { ctx.fillStyle = '#c8b99f'; ctx.fillRect(0, r * ch + ch - 3.2, W, 3.2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, r * ch + ch - 3.2, W, 0.7); } }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const ww = cw * style.winW, wh = ch * style.winH, x = c * cw + (cw - ww) / 2, y = r * ch + (ch - wh) / 2 + ch * 0.05;
    if (id === 'brick') { ctx.fillStyle = '#cdbfa8'; ctx.fillRect(x - 5, y - 7, ww + 10, 4.5); ctx.fillRect(x - 6, y + wh + 2, ww + 12, 4.5); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x - 6, y + wh + 6.5, ww + 12, 1.2); ctx.fillStyle = '#9d8d76'; for (let k = 0; k < 6; k++) ctx.fillRect(x - 5 + k * (ww + 10) / 6, y - 7, 0.8, 4.5); }
    else if (id === 'concrete') { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x - 5, y - 5, ww + 10, wh + 10); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x - 5, y + wh + 3, ww + 10, 1.5); }
    else if (!glassy) { ctx.fillStyle = style.frame; ctx.fillRect(x - 6, y - 6, ww + 12, wh + 12); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 6, y + wh + 3, ww + 12, 3); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x - 6, y - 6, ww + 12, 1.4); ctx.fillStyle = style.frame; ctx.fillRect(x - 9, y + wh + 6, ww + 18, 4); ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x + 4, y + wh + 12, ww - 8, 9); ctx.fillStyle = style.frame; ctx.fillRect(x + 6, y + wh + 14, ww - 12, 5); }
    ctx.fillStyle = style.frame; ctx.fillRect(x - 3, y - 3, ww + 6, wh + 6);
    ctx.fillStyle = style.win; ctx.fillRect(x, y, ww, wh);
    if (glassy) { const g = ctx.createLinearGradient(x, y, x, y + wh); g.addColorStop(0, 'rgba(150,200,255,0.36)'); g.addColorStop(0.45, 'rgba(60,100,170,0.12)'); g.addColorStop(1, 'rgba(10,20,50,0.3)'); ctx.fillStyle = g; ctx.fillRect(x, y, ww, wh); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(x + ww * 0.1, y + wh); ctx.lineTo(x + ww * 0.45, y); ctx.lineTo(x + ww * 0.62, y); ctx.lineTo(x + ww * 0.27, y + wh); ctx.fill(); }
    const g = ctx.createLinearGradient(x, y, x + ww, y + wh); g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(0.5, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(255,255,255,0.18)'); ctx.fillStyle = g; ctx.fillRect(x, y, ww, wh);
    ctx.fillStyle = style.frame; ctx.fillRect(x + ww / 2 - 1, y, 2, wh); ctx.fillRect(x, y + wh / 2 - 1, ww, 2);
    if (id === 'brick' || id === 'concrete') { ctx.fillStyle = 'rgba(40,34,30,0.18)'; const k = 4 + rng() * 8; ctx.fillRect(x + 2, y + wh + 7, ww - 4, k); }
  }
}

export const asphaltTex = () => memo('asphalt', () => canvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#34373e'; ctx.fillRect(0, 0, w, h); const rng = mulberry(11);
  for (let i = 0; i < 6000; i++) { const v = 30 + rng() * 40; ctx.fillStyle = `rgba(${v},${v},${v + 4},${0.25 + rng() * 0.5})`; ctx.fillRect(rng() * w, rng() * h, 2, 2); }
  for (let i = 0; i < 20; i++) { ctx.strokeStyle = `rgba(0,0,0,${0.08 + rng() * 0.12})`; ctx.lineWidth = 1 + rng() * 2; ctx.beginPath(); ctx.moveTo(rng() * w, rng() * h); ctx.lineTo(rng() * w, rng() * h); ctx.stroke(); }
}));
export const sidewalkTex = () => memo('sidewalk', () => canvasTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#b9b3a8'; ctx.fillRect(0, 0, w, h); const rng = mulberry(5);
  for (let i = 0; i < 1500; i++) { const v = 150 + rng() * 60; ctx.fillStyle = `rgba(${v},${v - 4},${v - 12},0.5)`; ctx.fillRect(rng() * w, rng() * h, 2, 2); }
  ctx.strokeStyle = 'rgba(70,65,60,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, w - 3, h - 3); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
}));
export const sandTex = () => memo('sand', () => canvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#e6d3a3'; ctx.fillRect(0, 0, w, h); const rng = mulberry(9);
  // low-frequency albedo: soft paler and darker drifts of sand, wrapped in 3x3 so the tile repeats without a seam
  for (let i = 0; i < 16; i++) { const x = rng() * w, y = rng() * h, r = 50 + rng() * 90, c = rng() < 0.5 ? '248,232,190' : '178,146,98'; for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { const px = x + dx, py = y + dy; if (px < -r || px > w + r || py < -r || py > h + r) continue; const g = ctx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${c},0.26)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2); } }
  for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${200 + rng() * 50},${180 + rng() * 40},${120 + rng() * 50},0.5)`; ctx.fillRect(rng() * w, rng() * h, 2, 2); }
}));
export const grassTex = () => memo('grass', () => canvasTex(512, 512, (ctx, w, h) => { // lawn: broad lush / dry / shaded patches, thousands of blades, a few daisies (tiles seamlessly)
  const rng = mulberry(3); ctx.fillStyle = '#3d6a33'; ctx.fillRect(0, 0, w, h);
  const patch = ['rgba(104,132,62,0.3)', 'rgba(32,86,36,0.4)', 'rgba(150,150,60,0.22)', 'rgba(60,110,44,0.35)'];
  for (let i = 0; i < 46; i++) { const x = rng() * w, y = rng() * h, r = (30 + rng() * 70) * (i % 5 === 0 ? 2 : 1), c = patch[i % 4]; for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { const px = x + dx, py = y + dy; if (px < -r || px > w + r || py < -r || py > h + r) continue; const g = ctx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, c); g.addColorStop(1, c.replace(/[\d.]+\)$/, '0)')); ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2); } }
  // dry-yellow clumps (wrapped like the patches above)
  for (let i = 0; i < 9; i++) { const x = rng() * w, y = rng() * h, r = 14 + rng() * 22; for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { const px = x + dx, py = y + dy; if (px < -r || px > w + r || py < -r || py > h + r) continue; const g = ctx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(176,160,74,0.3)'); g.addColorStop(1, 'rgba(176,160,74,0)'); ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2); } }
  // mown bands: strips a shade lighter and darker in 64 px steps (512 is a multiple, so the tile still repeats seamlessly)
  for (let y = 0; y < h; y += 64) { ctx.fillStyle = (y / 64) % 2 ? 'rgba(20,52,22,0.13)' : 'rgba(200,224,130,0.08)'; ctx.fillRect(0, y, w, 64); }
  for (let i = 0; i < 16000; i++) { const x = rng() * w, y = rng() * h, l = 4 + rng() * 6; ctx.strokeStyle = rng() < 0.5 ? `rgba(${30 + rng() * 40},${80 + rng() * 50},${24 + rng() * 30},0.55)` : `rgba(${90 + rng() * 60},${140 + rng() * 60},${40 + rng() * 40},0.5)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng() - 0.5) * 3, y - l); ctx.stroke(); }
  for (let i = 0; i < 70; i++) { ctx.fillStyle = rng() < 0.6 ? 'rgba(255,255,240,0.7)' : 'rgba(255,225,90,0.7)'; ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 1 + rng() * 0.8, 0, 6.28); ctx.fill(); }
}));

export const roofTex = () => memo('roof', () => canvasTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#3a3c42'; ctx.fillRect(0, 0, w, h); const rng = mulberry(21);
  for (let i = 0; i < 2500; i++) { const v = 45 + rng() * 40; ctx.fillStyle = `rgba(${v},${v},${v + 3},0.6)`; ctx.fillRect(rng() * w, rng() * h, 2, 2); }
}));
export const plankTex = () => memo('plank', () => canvasTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#8a6a44'; ctx.fillRect(0, 0, w, h); const rng = mulberry(31);
  for (let y = 0; y < h; y += 16) { ctx.fillStyle = `rgba(${90 + rng() * 40},${65 + rng() * 30},${35 + rng() * 25},0.9)`; ctx.fillRect(0, y, w, 15); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, y + 15, w, 1); }
  for (let i = 0; i < 600; i++) { ctx.fillStyle = `rgba(0,0,0,${rng() * 0.15})`; ctx.fillRect(rng() * w, rng() * h, rng() * 12, 1); }
}));

// ---------- neon signage ----------
// All signs of the city live in ONE atlas (neonAtlas): 2048 x 2048 px of 512 x 128 cells. Only NEON_CELL.pad px inside every cell are
// drawn (and the draw is clipped to that area), so bilinear and mip filtering never read a neighbouring sign. The sign is transparent
// outside its strokes: the glow comes from the sign level in world.js (setNight) and from the bloom pass.
export const NEON_CELL = { w: 512, h: 128, pad: 4 };
export const NEON_ASPECT = (NEON_CELL.w - 2 * NEON_CELL.pad) / (NEON_CELL.h - 2 * NEON_CELL.pad); // width / height of the drawn area (4.2)
const hasHebrew = s => /[֐-׿]/.test(s);
// Heebo when it is already loaded, Arial otherwise. The canvas is drawn once, so a font that arrives later is not picked up.
function signFamily() { try { return document.fonts?.check?.('700 64px Heebo') ? 'Heebo, Arial' : 'Arial'; } catch (e) { return 'Arial'; } }
const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// '#rrggbb' -> 'rgb(...)' mixed towards white by wmix, then scaled by k
const shade = (hex, k, wmix = 0) => { const c = rgbOf(hex).map(v => Math.round(Math.min(255, (v + (255 - v) * wmix) * k))); return `rgb(${c[0]},${c[1]},${c[2]})`; };
function roundRectPath(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
// sets ctx.font so that `text` fits into maxW (the size only shrinks) and returns the size used
function fitFont(ctx, text, family, weight, size, maxW) {
  ctx.font = `${weight} ${size}px ${family}`; const w = ctx.measureText(text).width;
  if (w > maxW) { size = Math.max(16, Math.floor(size * maxW / w)); ctx.font = `${weight} ${size}px ${family}`; }
  return size;
}
// Glass tube lettering: a 6 px colour stroke around the glyphs with a shadowBlur halo and a 2 px white core on top. No fill.
function tubeText(ctx, str, cx, cy, fs, color) {
  const k = fs / 64;
  ctx.shadowColor = color; ctx.shadowBlur = 14 * k + 4; ctx.lineWidth = Math.max(3.5, 6 * k); ctx.strokeStyle = color; ctx.strokeText(str, cx, cy);
  ctx.shadowBlur = 0; ctx.lineWidth = Math.max(1.5, 2 * k); ctx.strokeStyle = '#ffffff'; ctx.strokeText(str, cx, cy);
}
// Number of letters (spaces dropped) a blade sign stacks, and how it uses the cell: the cell is drawn rotated by 90 degrees, so its 504 px
// length becomes the sign height. `used` is the part of it the stack needs (343..504 px = 4.0..5.9 m for a 1.4 m wide blade).
export const bladeLetters = text => Array.from(text).filter(ch => ch.trim() !== '');
export function bladeLayout(n) {
  const len = NEON_CELL.w - 2 * NEON_CELL.pad, pitch = Math.min(94, Math.floor((len - 24) / Math.max(1, n)));
  return { pitch, used: Math.min(len, Math.max(343, n * pitch + 24)), len };
}
// Draws one sign into the cell whose top-left corner is (x0, y0). style: 'tube' (glass tube letters), 'box' (lightbox with a gradient back)
// or 'blade' (tube letters stacked top to bottom for a vertical sign).
function drawNeonCell(ctx, x0, y0, text, color, style) {
  const { w, h, pad } = NEON_CELL, ix = x0 + pad, iy = y0 + pad, iw = w - 2 * pad, ih = h - 2 * pad, fam = signFamily();
  ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.miterLimit = 2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (style === 'blade') {
    // virtual canvas: ih wide, iw tall, rotated into the cell (x' runs up the cell, y' to the right); the quad in world.js undoes it with its uvs
    ctx.transform(0, -1, 1, 0, ix, iy + ih); ctx.direction = 'ltr';
    const letters = bladeLetters(text), { pitch, used } = bladeLayout(letters.length), fs = Math.min(78, Math.floor(pitch * 0.84)), top = (used - letters.length * pitch) / 2;
    ctx.font = `700 ${fs}px ${fam}`;
    letters.forEach((ch, i) => tubeText(ctx, ch, ih / 2, top + (i + 0.5) * pitch + fs * 0.04, fs, color));
  } else if (style === 'box') {
    ctx.direction = hasHebrew(text) ? 'rtl' : 'ltr';
    const g = ctx.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, shade(color, 0.62, 0.18)); g.addColorStop(1, shade(color, 0.92, 0.08));
    roundRectPath(ctx, ix + 3, iy + 3, iw - 6, ih - 6, 14); ctx.fillStyle = g; ctx.fill();
    roundRectPath(ctx, ix + 9, iy + 9, iw - 18, ih - 18, 9); ctx.lineWidth = 3; ctx.strokeStyle = shade(color, 1, 0.65); ctx.stroke();
    fitFont(ctx, text, fam, 800, 60, iw - 64);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2; ctx.fillStyle = '#fff8ec'; ctx.fillText(text, ix + iw / 2, iy + ih / 2 + 3);
  } else {
    ctx.direction = hasHebrew(text) ? 'rtl' : 'ltr';
    const fs = fitFont(ctx, text, fam, 700, 64, iw - 40);
    tubeText(ctx, text, ix + iw / 2, iy + ih / 2 + 3, fs, color);
  }
  ctx.restore();
}
export const neonKey = (text, color, style) => style + '|' + color + '|' + text;
// One sign on its own transparent 512 x 128 canvas (the atlas below is what the city uses).
export function neonSign(text, color, style = 'tube') {
  return memo('neon:' + neonKey(text, color, style), () => canvasTex(NEON_CELL.w, NEON_CELL.h, ctx => drawNeonCell(ctx, 0, 0, text, color, style), { clamp: true }));
}
// entries: [{ text, color, style }]. Every unique (text, color, style) gets one cell. Returns { texture, rect(key), count } where key is
// neonKey(text, color, style) or an entry object, and rect is { u0, u1, vB, vT, texel } (the drawn area of the cell in uv; vB is the
// bottom edge, vT the top edge, texel = 1 / atlas width). More than 64 signs cannot happen with the city's texts; if it ever did,
// the extra ones would show the first cell instead of failing.
export function neonAtlas(entries) {
  const W = 2048, H = 2048, { w, h, pad } = NEON_CELL, cols = Math.floor(W / w), cap = cols * Math.floor(H / h);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'); const rects = new Map(); let n = 0;
  for (const e of entries) {
    const key = neonKey(e.text, e.color, e.style); if (rects.has(key)) continue;
    if (n >= cap) { rects.set(key, rects.values().next().value); continue; }
    const x = (n % cols) * w, y = Math.floor(n / cols) * h; drawNeonCell(ctx, x, y, e.text, e.color, e.style);
    rects.set(key, { u0: (x + pad) / W, u1: (x + w - pad) / W, vT: 1 - (y + pad) / H, vB: 1 - (y + h - pad) / H, texel: 1 / W }); n++;
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
  return { texture: t, count: n, rect: k => rects.get(typeof k === 'string' ? k : neonKey(k.text, k.color, k.style)) };
}

// Billboard artwork: gradient, soft discs, a title and a subtitle, both shrunk to fit.
function drawBillboardCell(ctx, x, y, w, h, title, sub, c1, c2) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, y); const fam = signFamily();
  const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(w * 0.8 - i * 40, h * 0.3 + i * 20, 90 - i * 12, 0, Math.PI * 2); ctx.fill(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12;
  ctx.direction = hasHebrew(title) ? 'rtl' : 'ltr'; fitFont(ctx, title, fam, 900, 72, w - 48); ctx.fillText(title, w / 2, h * 0.4);
  ctx.direction = hasHebrew(sub) ? 'rtl' : 'ltr'; fitFont(ctx, sub, fam, 500, 34, w - 48); ctx.fillText(sub, w / 2, h * 0.72);
  ctx.restore();
}
export function billboard(title, sub, c1, c2) {
  return memo('bb:' + title + sub, () => canvasTex(512, 256, ctx => drawBillboardCell(ctx, 0, 0, 512, 256, title, sub, c1, c2), { clamp: true }));
}
// list: [[title, subtitle, colour1, colour2], ...] (at most 6). One 1024 x 768 atlas of 512 x 256 cells; rect(i) = { u0, u1, vB, vT } of cell i,
// inset by 2 px so filtering stays inside the cell.
export function billboardAtlas(list) {
  return memo('bbatlas', () => {
    const W = 1024, H = 768, cw = 512, ch = 256, pad = 2, c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'); const rects = [];
    list.slice(0, 6).forEach((b, i) => {
      const x = (i % 2) * cw, y = Math.floor(i / 2) * ch; drawBillboardCell(ctx, x, y, cw, ch, b[0], b[1], b[2], b[3]);
      rects.push({ u0: (x + pad) / W, u1: (x + cw - pad) / W, vT: 1 - (y + pad) / H, vB: 1 - (y + ch - pad) / H });
    });
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
    return { texture: t, rect: i => rects[i] };
  });
}
export const particleTex = () => memo('particle', () => canvasTex(64, 64, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}, { clamp: true }));
// Soft round light pool for the additive night lighting of world.js (street lamps, shop and sign spill): white, alpha 1.0 -> 0.
export const lightPoolTex = () => memo('lightpool', () => canvasTex(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(0.7, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}, { clamp: true }));
export const crossTex = () => memo('cross', () => canvasTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#e0312f'; ctx.fillRect(w * 0.4, h * 0.15, w * 0.2, h * 0.7); ctx.fillRect(w * 0.15, h * 0.4, w * 0.7, h * 0.2);
}, { clamp: true }));

// Ground-floor storefront band: big shop windows, pillars, a door and a striped awning. 1 tile = 6 m x 4.4 m
export const AWNINGS = ['#ff4fa3', '#3ce8f5', '#ffd34e', '#ff9a3c', '#7cff8a'];
export function storefrontTextures(variant) {
  return memo('store' + variant, () => {
    const W = 384, H = 256; const awn = AWNINGS[variant % AWNINGS.length];
    const draw = emissive => (ctx) => {
      ctx.fillStyle = emissive ? '#000' : '#2a2530'; ctx.fillRect(0, 0, W, H);
      // windows
      for (let i = 0; i < 3; i++) { const x = 16 + i * 124, y = 62, w = 100, h = 150; if (i === 2) { // door
          if (!emissive) { ctx.fillStyle = '#3a3340'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#7fb3d8'; ctx.fillRect(x + 12, y + 10, w - 24, h - 40); ctx.fillStyle = '#d0c090'; ctx.fillRect(x + w - 22, y + h / 2, 6, 6); } else { ctx.fillStyle = '#5a6a80'; ctx.fillRect(x + 12, y + 10, w - 24, h - 40); } continue; }
        if (!emissive) { ctx.fillStyle = '#3a3340'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8); const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#9fd2ee'); g.addColorStop(0.45, '#4d8bb0'); g.addColorStop(0.5, '#6aa6cc'); g.addColorStop(1, '#264a66'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 8, y + 8, 3, h - 16); ctx.fillStyle = '#2a2530'; ctx.fillRect(x, y + h - 30, w, 4); }
        else { ctx.fillStyle = '#ffd9a0'; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y + h * 0.55, w, h * 0.45); }
      }
      // awning stripes
      for (let x = 0; x < W; x += 24) { ctx.fillStyle = emissive ? '#000' : (Math.floor(x / 24) % 2 ? awn : '#f4f1ea'); ctx.fillRect(x, 20, 24, 36); }
      if (!emissive) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 50, W, 8); ctx.fillStyle = '#1e1a24'; ctx.fillRect(0, 0, W, 20); ctx.fillStyle = '#4a4452'; ctx.fillRect(0, H - 14, W, 14); }
    };
    return { map: canvasTex(W, H, draw(false)), emissiveMap: canvasTex(W, H, draw(true)) };
  });
}
export const shadowTex = () => memo('shadow', () => canvasTex(64, 4, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(0.35, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }, { clamp: true }));
export const cloudTex = () => memo('cloud', () => canvasTex(512, 512, (ctx, w, h) => {
  const rng = mulberry(99); const img = ctx.createImageData(w, h); const d = img.data; const noise = new Float32Array(w * h);
  for (let oct = 0; oct < 5; oct++) { const s = 8 << oct, amp = 1 / (oct + 1); const grid = []; const n = s + 1; for (let i = 0; i < n * n; i++) grid.push(rng());
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const fx = x / w * s, fy = y / h * s, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0; const sm = t => t * t * (3 - 2 * t); const g = (i, j) => grid[(j % s) * n + (i % s)]; const v = (g(x0, y0) * (1 - sm(tx)) + g(x0 + 1, y0) * sm(tx)) * (1 - sm(ty)) + (g(x0, y0 + 1) * (1 - sm(tx)) + g(x0 + 1, y0 + 1) * sm(tx)) * sm(ty); noise[y * w + x] += v * amp; } }
  // Alpha is the raw FBM, contrast-stretched (about +-1.7 sigma around a mean of 0.58 spans 0..1); the sky dome (sky.js) thresholds it with its own `cover`.
  // Every octave wraps (see g()), so the texture tiles seamlessly.
  let mean = 0; for (let i = 0; i < w * h; i++) mean += noise[i]; mean /= w * h;
  let varSum = 0; for (let i = 0; i < w * h; i++) varSum += (noise[i] - mean) ** 2; const sigma = Math.sqrt(varSum / (w * h)) || 1;
  for (let i = 0; i < w * h; i++) { const a = Math.max(0, Math.min(1, 0.58 + (noise[i] - mean) / (3.4 * sigma))); d[i * 4] = 255; d[i * 4 + 1] = 255; d[i * 4 + 2] = 255; d[i * 4 + 3] = Math.round(a * 255); }
  ctx.putImageData(img, 0, 0);
}));

// ---------- normal / roughness-metalness maps ----------
// Height is drawn into a canvas (red channel) and converted with a Sobel-style gradient.
function normalTex(key, w, h, drawHeight, strength = 2.5, clampTex = false) {
  return memo('n:' + key, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
    drawHeight(ctx, w, h);
    const src = ctx.getImageData(0, 0, w, h).data; const out = ctx.createImageData(w, h); const d = out.data;
    const H = (x, y) => { x = (x + w) % w; y = (y + h) % h; return src[(y * w + x) * 4] / 255; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      let nx = -dx, ny = dy, nz = 1; const l = Math.hypot(nx, ny, nz); const i = (y * w + x) * 4;
      d[i] = (nx / l * 0.5 + 0.5) * 255; d[i + 1] = (ny / l * 0.5 + 0.5) * 255; d[i + 2] = (nz / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = clampTex ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; return t;
  });
}
// Windows recess into the wall, frames stand proud of it.
function facadeHeight(style) {
  return (ctx, W, H) => {
    const cols = 4, rows = 4, cw = W / cols, ch = H / rows;
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
    if (style.id === 'brick') { ctx.fillStyle = '#5a5a5a'; for (let y = 0, row = 0; y < H; y += 2.8, row++) { ctx.fillRect(0, y, W, 0.7); for (let x = -(row % 2 ? 3.7 : 0); x < W; x += 7.4) ctx.fillRect(x, y, 0.7, 2.8); } }
    else if (style.id === 'concrete') { ctx.fillStyle = '#5c5c5c'; for (let x = 0; x < W; x += cw) ctx.fillRect(x, 0, 1.4, H); for (let r = 0; r < rows; r++) ctx.fillRect(0, r * ch, W, 1.4); }
    if (style.bands) { ctx.fillStyle = '#b4b4b4'; for (let r = 0; r < rows; r++) ctx.fillRect(0, r * ch + ch - 6, W, 6); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ww = cw * style.winW, wh = ch * style.winH, x = c * cw + (cw - ww) / 2, y = r * ch + (ch - wh) / 2 + ch * 0.05;
      ctx.fillStyle = '#c8c8c8'; ctx.fillRect(x - 4, y - 4, ww + 8, wh + 8);
      ctx.fillStyle = '#3c3c3c'; ctx.fillRect(x, y, ww, wh);
      ctx.fillStyle = '#5a5a5a'; ctx.fillRect(x + ww / 2 - 1, y, 2, wh); ctx.fillRect(x, y + wh / 2 - 1, ww, 2);
      ctx.fillStyle = '#d2d2d2'; ctx.fillRect(x - 5, y + wh + 2, ww + 10, 5);
    }
  };
}
export const facadeNormal = style => normalTex('fac' + style.id, 256, 448, facadeHeight(style), 3.0);
// Green = roughness, blue = metalness: glass panes turn mirror-like, walls stay matte.
export function facadeORM(style) {
  const glassy = style.id === 'glass' || style.id === 'tower';
  return memo('orm' + style.id, () => canvasTex(256, 448, (ctx, W, H) => {
    const cols = 4, rows = 4, cw = W / cols, ch = H / rows;
    ctx.fillStyle = `rgb(0,${Math.round((glassy ? 0.62 : 0.9) * 255)},0)`; ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ww = cw * style.winW, wh = ch * style.winH, x = c * cw + (cw - ww) / 2, y = r * ch + (ch - wh) / 2 + ch * 0.05;
      ctx.fillStyle = `rgb(0,${Math.round(0.55 * 255)},${Math.round(0.25 * 255)})`; ctx.fillRect(x - 4, y - 4, ww + 8, wh + 8);
      ctx.fillStyle = `rgb(0,${Math.round((glassy ? 0.06 : 0.12) * 255)},${Math.round((glassy ? 0.95 : 0.75) * 255)})`; ctx.fillRect(x, y, ww, wh);
    }
  }, { linear: true }));
}
export const storefrontNormal = variant => normalTex('store' + variant, 384, 256, (ctx, W, H) => {
  ctx.fillStyle = '#909090'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 3; i++) { const x = 16 + i * 124, y = 62, w = 100, h = 150;
    ctx.fillStyle = '#d0d0d0'; ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x, y, w, h);
    if (i === 2) { ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x + 10, y + 8, w - 20, h - 36); } }
  ctx.fillStyle = '#cccccc'; ctx.fillRect(0, 20, W, 36); ctx.fillStyle = '#4a4a4a'; ctx.fillRect(0, 56, W, 6);
  ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, W, 20); ctx.fillStyle = '#b8b8b8'; ctx.fillRect(0, H - 14, W, 14);
}, 2.4);
export function storefrontORM(variant) {
  return memo('sorm' + variant, () => canvasTex(384, 256, (ctx, W, H) => {
    ctx.fillStyle = `rgb(0,${Math.round(0.8 * 255)},0)`; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) { const x = 16 + i * 124, y = 62, w = 100, h = 150; ctx.fillStyle = `rgb(0,26,${Math.round(0.9 * 255)})`; ctx.fillRect(x, y, w, h); }
  }, { linear: true }));
}
export const asphaltNormal = () => normalTex('asphalt', 256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); const rng = mulberry(11);
  for (let i = 0; i < 4000; i++) { const v = 110 + rng() * 80; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(rng() * w, rng() * h, 2 + rng() * 2, 2 + rng() * 2); }
  for (let i = 0; i < 14; i++) { ctx.strokeStyle = 'rgba(40,40,40,0.6)'; ctx.lineWidth = 1 + rng() * 2; ctx.beginPath(); ctx.moveTo(rng() * w, rng() * h); ctx.lineTo(rng() * w, rng() * h); ctx.stroke(); }
}, 1.1);
export const sidewalkNormal = () => normalTex('sidewalk', 128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#9a9a9a'; ctx.fillRect(0, 0, w, h); const rng = mulberry(5);
  for (let i = 0; i < 900; i++) { const v = 130 + rng() * 60; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(rng() * w, rng() * h, 2, 2); }
  ctx.strokeStyle = '#2c2c2c'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
}, 2.2);
export const plankNormal = () => normalTex('plank', 128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#9a9a9a'; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) { ctx.fillStyle = '#a8a8a8'; ctx.fillRect(0, y, w, 15); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, y + 15, w, 1); }
}, 2.6);
export const sandNormal = () => normalTex('sand', 256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); const rng = mulberry(9);
  for (let i = 0; i < 2600; i++) { const v = 110 + rng() * 90; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 1 + rng() * 3, 0, 6.28); ctx.fill(); }
  // wind ripples: faint raised crests, a few per tile
  ctx.strokeStyle = 'rgba(176,176,176,0.5)'; ctx.lineWidth = 1.5; for (let i = 0; i < 26; i++) { const x = rng() * w, y = rng() * h, L = 18 + rng() * 26; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + L * 0.5, y - 4, x + L, y); ctx.stroke(); }
}, 1.4);

// ---------- building detail atlas (buildings.js) ----------
// One 1024 px atlas of 4 x 4 cells (256 px) for everything that is stuck onto a building: trim, grates, rails, roller shutters, vents, foliage cards, graffiti,
// posters, glass doors and solar panels. Neutral greys so vertex colours tint them; alpha-cut cells (grate, rail, leaf, flower, tags) are used with alphaTest.
const DETAIL_NAMES = ['solid', 'plaster', 'concrete', 'brick', 'metal', 'grate', 'rail', 'shutter', 'vent', 'leaf', 'flower', 'tags', 'win', 'posters', 'door', 'solar'];
// ATLAS[name] = [u0, v0, u1, v1] (v0 = bottom edge); tags / posters hold four sub-rects each (a 2 x 2 sheet): ATLAS.tag[i], ATLAS.poster[i]
export const ATLAS = (() => {
  const o = {}, ins = 3 / 1024; DETAIL_NAMES.forEach((n, i) => { const cx = (i % 4) * 0.25, cy = 1 - Math.floor(i / 4) * 0.25; o[n] = [cx + ins, cy - 0.25 + ins, cx + 0.25 - ins, cy - ins]; });
  const sub = n => { const [u0, v0, u1, v1] = o[n], um = (u0 + u1) / 2, vm = (v0 + v1) / 2, e = 2 / 1024; return [[u0, vm + e, um - e, v1], [um + e, vm + e, u1, v1], [u0, v0, um - e, vm - e], [um + e, v0, u1, vm - e]]; };
  o.tag = sub('tags'); o.poster = sub('posters'); return o;
})();
export function detailAtlas() {
  return memo('detail', () => canvasTex(1024, 1024, (ctx) => {
    const rng = mulberry(404), S = 256;
    const cell = (i, fn) => { ctx.save(); ctx.translate((i % 4) * S, Math.floor(i / 4) * S); ctx.beginPath(); ctx.rect(0, 0, S, S); ctx.clip(); fn(); ctx.restore(); };
    const speckle = (n, a0, a1, v0, v1, sz = 2) => { for (let i = 0; i < n; i++) { const v = Math.floor(v0 + rng() * (v1 - v0)); ctx.fillStyle = `rgba(${v},${v},${v},${a0 + rng() * (a1 - a0)})`; ctx.fillRect(rng() * S, rng() * S, sz, sz); } };
    cell(0, () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S); });
    cell(1, () => { ctx.fillStyle = '#e4e1dc'; ctx.fillRect(0, 0, S, S); speckle(2600, 0.1, 0.3, 190, 255); speckle(900, 0.1, 0.25, 140, 190, 3); const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,50,40,0.18)'); ctx.fillStyle = g; ctx.fillRect(0, 0, S, S); });
    cell(2, () => { ctx.fillStyle = '#c4c2bd'; ctx.fillRect(0, 0, S, S); speckle(3200, 0.12, 0.3, 150, 235); ctx.fillStyle = 'rgba(40,40,40,0.5)'; ctx.fillRect(0, 126, S, 3); ctx.fillRect(126, 0, 3, S); for (const [x, y] of [[32, 32], [96, 32], [160, 32], [224, 32], [32, 160], [96, 160], [160, 160], [224, 160]]) { ctx.fillStyle = 'rgba(30,30,30,0.5)'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.28); ctx.fill(); } for (let i = 0; i < 12; i++) { const x = rng() * S, w = 4 + rng() * 14, g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, 'rgba(50,45,40,0.16)'); g.addColorStop(1, 'rgba(50,45,40,0)'); ctx.fillStyle = g; ctx.fillRect(x, 0, w, 40 + rng() * 140); } });
    cell(3, () => { ctx.fillStyle = '#9a948c'; ctx.fillRect(0, 0, S, S); for (let r = 0; r < 16; r++) for (let c = -1; c < 8; c++) { const v = 150 + rng() * 80, x = c * 32 + (r % 2 ? 16 : 0), y = r * 16; ctx.fillStyle = `rgb(${v},${v - 6},${v - 14})`; ctx.fillRect(x + 1, y + 1, 30, 14); } speckle(900, 0.1, 0.3, 80, 160); });
    cell(4, () => { ctx.fillStyle = '#a3a7ae'; ctx.fillRect(0, 0, S, S); for (let i = 0; i < 220; i++) { const v = 130 + rng() * 100; ctx.fillStyle = `rgba(${v},${v},${v + 4},0.5)`; ctx.fillRect(0, rng() * S, S, 1); } });
    cell(5, () => { ctx.fillStyle = 'rgba(90,92,98,0.004)'; ctx.fillRect(0, 0, S, S); ctx.fillStyle = '#7d8088'; for (let x = 0; x < S; x += 16) ctx.fillRect(x, 0, 4, S); for (let y = 0; y < S; y += 16) ctx.fillRect(0, y, S, 4); ctx.fillStyle = '#a2a5ad'; ctx.fillRect(0, 0, S, 6); ctx.fillRect(0, S - 6, S, 6); });
    cell(6, () => { ctx.fillStyle = 'rgba(160,165,172,0.004)'; ctx.fillRect(0, 0, S, S); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(0, 16, S, 22); ctx.fillStyle = '#aeb2b9'; ctx.fillRect(0, 212, S, 14); for (let x = 8; x < S; x += 26) ctx.fillRect(x, 38, 8, 176); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 16, S, 4); });
    cell(7, () => { for (let y = 0; y < S - 24; y += 14) { const g = ctx.createLinearGradient(0, y, 0, y + 14); g.addColorStop(0, '#d2d3d6'); g.addColorStop(0.55, '#a6a8ae'); g.addColorStop(1, '#63666d'); ctx.fillStyle = g; ctx.fillRect(0, y, S, 14); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, y + 13, S, 1); } ctx.fillStyle = '#74777e'; ctx.fillRect(0, S - 26, S, 26); ctx.fillStyle = '#2a2c30'; ctx.fillRect(S / 2 - 14, S - 18, 28, 8); ctx.fillStyle = '#d6b94a'; ctx.fillRect(S / 2 - 3, S - 17, 6, 6); speckle(800, 0.08, 0.3, 60, 200); });
    cell(8, () => { ctx.fillStyle = '#b4b7bd'; ctx.fillRect(0, 0, S, S); ctx.fillStyle = '#4a4d54'; ctx.beginPath(); ctx.arc(S * 0.5, S * 0.5, S * 0.4, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#d0d2d6'; ctx.lineWidth = 3; for (let r = 14; r < S * 0.4; r += 18) { ctx.beginPath(); ctx.arc(S * 0.5, S * 0.5, r, 0, 6.28); ctx.stroke(); } for (let a = 0; a < 6.28; a += 0.52) { ctx.beginPath(); ctx.moveTo(S * 0.5, S * 0.5); ctx.lineTo(S * 0.5 + Math.cos(a) * S * 0.4, S * 0.5 + Math.sin(a) * S * 0.4); ctx.stroke(); } ctx.fillStyle = '#d0d2d6'; ctx.beginPath(); ctx.arc(S * 0.5, S * 0.5, 14, 0, 6.28); ctx.fill(); });
    const leaves = (hues, n, flowers) => { ctx.fillStyle = 'rgba(40,90,40,0.004)'; ctx.fillRect(0, 0, S, S); for (let i = 0; i < n; i++) { const a = rng() * 6.28, d = Math.pow(rng(), 0.6) * S * 0.46, x = S / 2 + Math.cos(a) * d, y = S * 0.58 + Math.sin(a) * d * 0.8, h = hues[Math.floor(rng() * hues.length)]; ctx.fillStyle = `hsl(${h[0]},${h[1]}%,${h[2] + rng() * 14}%)`; ctx.save(); ctx.translate(x, y); ctx.rotate(rng() * 6.28); ctx.beginPath(); ctx.ellipse(0, 0, 9 + rng() * 9, 4 + rng() * 4, 0, 0, 6.28); ctx.fill(); ctx.restore(); } if (flowers) for (let i = 0; i < 46; i++) { const a = rng() * 6.28, d = Math.pow(rng(), 0.7) * S * 0.42, x = S / 2 + Math.cos(a) * d, y = S * 0.55 + Math.sin(a) * d * 0.75; ctx.fillStyle = flowers[Math.floor(rng() * flowers.length)]; ctx.beginPath(); ctx.arc(x, y, 4 + rng() * 4, 0, 6.28); ctx.fill(); } };
    cell(9, () => leaves([[108, 45, 26], [96, 50, 32], [120, 40, 22], [84, 45, 30]], 190));
    cell(10, () => leaves([[110, 42, 24], [100, 46, 28]], 110, ['#ff4f6d', '#ff9ad5', '#ffd34e', '#ffffff', '#ff7a3c']));
    cell(11, () => { ctx.fillStyle = 'rgba(0,0,0,0)'; const words = [['NEON', '#ff4fa3', '#1b1030'], ['ZED', '#3ce8f5', '#0b2a3a'], ['ACID', '#b6ff3c', '#142a10'], ['KAOS', '#ffd34e', '#3a1c0a']]; words.forEach((w, k) => { const x = (k % 2) * 128, y = Math.floor(k / 2) * 128; ctx.save(); ctx.translate(x + 64, y + 66); ctx.rotate(-0.12 + (k % 3) * 0.08); ctx.font = 'italic 900 58px Impact, "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 11; ctx.strokeStyle = w[2]; ctx.strokeText(w[0], 0, 0); ctx.fillStyle = w[1]; ctx.fillText(w[0], 0, 0); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.strokeText(w[0], -2, -2); ctx.fillStyle = w[1]; for (let d = 0; d < 3; d++) ctx.fillRect(-40 + d * 32 + rng() * 10, 26, 3, 14 + rng() * 22); ctx.restore(); }); });
    cell(12, () => { ctx.fillStyle = '#7d828b'; ctx.fillRect(0, 0, S, S); for (const [x, y] of [[20, 20], [134, 20], [20, 134], [134, 134]]) { const g = ctx.createLinearGradient(x, y, x + 102, y + 102); g.addColorStop(0, '#f6f9fc'); g.addColorStop(0.5, '#c4cad4'); g.addColorStop(1, '#e4e9f0'); ctx.fillStyle = g; ctx.fillRect(x, y, 102, 102); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(x + 6, y + 96); ctx.lineTo(x + 52, y + 6); ctx.lineTo(x + 70, y + 6); ctx.lineTo(x + 24, y + 96); ctx.fill(); } ctx.fillStyle = '#5b6068'; ctx.fillRect(0, 0, S, 8); ctx.fillRect(0, S - 8, S, 8); ctx.fillRect(0, 0, 8, S); ctx.fillRect(S - 8, 0, 8, S); });
    cell(13, () => { const papers = ['#f4efe2', '#ffe9a8', '#d9ecff', '#ffd6e6'], accents = ['#e0312f', '#2b4fa8', '#101018', '#ff4fa3']; for (let k = 0; k < 4; k++) { const x = (k % 2) * 128 + 6, y = Math.floor(k / 2) * 128 + 6, w = 116, h = 116; ctx.fillStyle = papers[k]; ctx.fillRect(x, y, w, h); ctx.fillStyle = accents[k]; ctx.fillRect(x + 8, y + 10, w - 16, 28); ctx.fillStyle = '#fff'; ctx.fillRect(x + 14, y + 18, w - 40, 6); ctx.fillStyle = '#222'; for (let l = 0; l < 6; l++) ctx.fillRect(x + 10, y + 50 + l * 10, 30 + rng() * (w - 50), 4); ctx.fillStyle = accents[(k + 1) % 4]; ctx.beginPath(); ctx.arc(x + w - 28, y + h - 28, 16, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y + h - 12, w, 12); for (let t = 0; t < 40; t++) { ctx.fillStyle = `rgba(0,0,0,${rng() * 0.12})`; ctx.fillRect(x + rng() * w, y + rng() * h, 3, 3); } } });
    cell(14, () => { ctx.fillStyle = '#4b4f58'; ctx.fillRect(0, 0, S, S); for (const x of [14, 134]) { const g = ctx.createLinearGradient(x, 14, x + 108, 242); g.addColorStop(0, '#f2f6fa'); g.addColorStop(0.5, '#cfd8e2'); g.addColorStop(1, '#aeb9c6'); ctx.fillStyle = g; ctx.fillRect(x, 14, 108, 228); ctx.fillStyle = '#4b4f58'; ctx.fillRect(x, 120, 108, 6); ctx.fillStyle = '#d8dce2'; ctx.fillRect(x + (x < 100 ? 92 : 8), 110, 6, 40); } });
    cell(15, () => { ctx.fillStyle = '#a9aeb8'; ctx.fillRect(0, 0, S, S); for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const g = ctx.createLinearGradient(0, r * 40, 0, r * 40 + 40); g.addColorStop(0, '#6f86c4'); g.addColorStop(1, '#2c3d78'); ctx.fillStyle = g; ctx.fillRect(c * 62 + 6, r * 40 + 6, 56, 34); } ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(0, 0, S, 90); });
  }, { clamp: true }));
}

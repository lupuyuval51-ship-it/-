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

export function facadeTextures(style, seed = 1) {
  return memo('facade' + style.id, () => {
    const W = 256, H = 448, cols = 4, rows = 4, cw = W / cols, ch = H / rows; const rng = mulberry(seed * 7919 + style.id.length);
    const lit = []; for (let i = 0; i < cols * rows; i++) lit.push(rng() < 0.45);
    const draw = (emissive) => (ctx) => {
      ctx.fillStyle = emissive ? '#000' : style.wall; ctx.fillRect(0, 0, W, H);
      if (!emissive) { // subtle grime
        for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(0,0,0,${rng() * 0.06})`; ctx.fillRect(rng() * W, rng() * H, rng() * 6 + 1, rng() * 6 + 1); }
        if (style.bands) { ctx.fillStyle = style.bands; for (let r = 0; r < rows; r++) ctx.fillRect(0, r * ch + ch - 6, W, 6); }
      }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const ww = cw * style.winW, wh = ch * style.winH, x = c * cw + (cw - ww) / 2, y = r * ch + (ch - wh) / 2 + ch * 0.05; const isLit = lit[r * cols + c];
        if (emissive) { if (isLit) { ctx.fillStyle = style.lit; ctx.fillRect(x, y, ww, wh); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + wh * 0.5, ww, wh * 0.1); } continue; }
        ctx.fillStyle = style.frame; ctx.fillRect(x - 3, y - 3, ww + 6, wh + 6);
        ctx.fillStyle = style.win; ctx.fillRect(x, y, ww, wh);
        const g = ctx.createLinearGradient(x, y, x + ww, y + wh); g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(0.5, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(255,255,255,0.18)'); ctx.fillStyle = g; ctx.fillRect(x, y, ww, wh);
        ctx.fillStyle = style.frame; ctx.fillRect(x + ww / 2 - 1, y, 2, wh); ctx.fillRect(x, y + wh / 2 - 1, ww, 2);
      }
    };
    return { map: canvasTex(W, H, draw(false)), emissiveMap: canvasTex(W, H, draw(true)), glow: style.glow };
  });
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
  for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${200 + rng() * 50},${180 + rng() * 40},${120 + rng() * 50},0.5)`; ctx.fillRect(rng() * w, rng() * h, 2, 2); }
}));
export const grassTex = () => memo('grass', () => canvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#4c8a3c'; ctx.fillRect(0, 0, w, h); const rng = mulberry(3);
  for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${40 + rng() * 60},${110 + rng() * 70},${30 + rng() * 40},0.6)`; ctx.fillRect(rng() * w, rng() * h, 2, 3); }
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

// Neon signs: text rendered in a glowing colour on black; used as emissive+map on a plane
export function neonSign(text, color, font = '900 64px Heebo, Arial') {
  return memo('neon:' + text + color, () => canvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#07070c'; ctx.fillRect(0, 0, w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = 28; ctx.fillStyle = color; ctx.fillText(text, w / 2, h / 2 + 4);
    ctx.shadowBlur = 8; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.85; ctx.fillText(text, w / 2, h / 2 + 4); ctx.globalAlpha = 1;
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = 0.6; ctx.strokeRect(10, 10, w - 20, h - 20);
  }, { clamp: true }));
}
export function billboard(title, sub, c1, c2) {
  return memo('bb:' + title + sub, () => canvasTex(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(w * 0.8 - i * 40, h * 0.3 + i * 20, 90 - i * 12, 0, Math.PI * 2); ctx.fill(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = '900 72px Heebo, Arial'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.fillText(title, w / 2, h * 0.4);
    ctx.font = '500 34px Heebo, Arial'; ctx.fillText(sub, w / 2, h * 0.72);
  }, { clamp: true }));
}
export const particleTex = () => memo('particle', () => canvasTex(64, 64, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
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
  for (let i = 0; i < w * h; i++) { const v = noise[i] / 2.28; const a = Math.max(0, Math.min(1, (v - 0.52) * 3.2)); d[i * 4] = 255; d[i * 4 + 1] = 255; d[i * 4 + 2] = 255; d[i * 4 + 3] = a * 255; }
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
}, 1.4);

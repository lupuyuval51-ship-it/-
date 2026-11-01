#!/usr/bin/env tsx
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';

const root = resolve(import.meta.dirname, '..');
GlobalFonts.registerFromPath(join(root, 'client/public/fonts/barlow-condensed-latin-700-normal.woff2'), 'Barlow Condensed');
const C = { bg: '#0B0B0D', text: '#F5F5F5', orange: '#FF6A00', muted: '#A3A3A8' };
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const jit = (a: number) => (rnd() - 0.5) * 2 * a;

/** A hand-drawn marker stroke: tapered, wobbly edges, rough ends, slight tilt. */
function scratch(ctx: SKRSContext2D, x1: number, y1: number, x2: number, y2: number, w: number, col: string): void {
  const n = 14; const dx = x2 - x1; const dy = y2 - y1; const len = Math.hypot(dx, dy); const nx = -dy / len; const ny = dx / len;
  const L: [number, number][] = []; const R: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; const taper = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05));
    const wob = jit(w * 0.09); const half = (w * taper) / 2;
    const cx = x1 + dx * t + nx * jit(w * 0.05); const cy = y1 + dy * t + ny * jit(w * 0.05);
    L.push([cx + nx * (half + wob), cy + ny * (half + wob)]); R.push([cx - nx * (half + jit(w * 0.09)), cy - ny * (half + jit(w * 0.09))]);
  }
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(...(L[0] as [number, number]));
  for (const p of L) ctx.lineTo(...p); for (const p of [...R].reverse()) ctx.lineTo(...p); ctx.closePath(); ctx.fill();
}
/** Dry-marker grain: knocks tiny specks out of the strokes so they read as ink, not vector. */
function grain(ctx: SKRSContext2D, w: number, h: number, amount: number): void {
  ctx.fillStyle = C.bg;
  for (let i = 0; i < amount; i++) { ctx.globalAlpha = 0.35 + rnd() * 0.5; const s = 1 + rnd() * 2.2; ctx.fillRect(rnd() * w, rnd() * h, s, s * (0.6 + rnd())); }
  ctx.globalAlpha = 1;
}
function optionA(ctx: SKRSContext2D, ox: number, oy: number, s: number): void {
  const xs = [0.14, 0.35, 0.57, 0.78]; const lens = [1, 0.94, 1.03, 0.97];
  xs.forEach((x, i) => { const tilt = jit(0.05); scratch(ctx, ox + s * (x + tilt), oy + s * (0.1 + jit(0.02)), ox + s * (x - tilt * 0.6 + jit(0.01)), oy + s * (0.1 + 0.62 * (lens[i] as number)), s * 0.1, C.text); });
  scratch(ctx, ox - s * 0.04, oy + s * 0.64, ox + s * 1.0, oy + s * 0.2, s * 0.115, C.orange);
}
function optionB(ctx: SKRSContext2D, cx: number, cy: number, s: number): void {
  const half: [number, number][] = [[0, -0.42], [0.3, -0.58], [0.72, -1.0], [0.9, -0.12], [0.74, 0.36], [0.36, 0.58], [0.2, 0.92], [0, 1.0]];
  const pts = [...half, ...[...half].reverse().slice(1, -1).map(([x, y]) => [-x, y] as [number, number])];
  ctx.fillStyle = C.text; ctx.beginPath(); pts.forEach(([x, y], i) => { const px = cx + x * s * 0.5; const py = cy + y * s * 0.5; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.orange; for (const m of [1, -1]) { ctx.beginPath(); ctx.moveTo(cx + m * s * 0.5 * 0.14, cy - s * 0.5 * 0.02); ctx.lineTo(cx + m * s * 0.5 * 0.56, cy - s * 0.5 * 0.22); ctx.lineTo(cx + m * s * 0.5 * 0.5, cy + s * 0.5 * 0.04); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = C.bg; ctx.beginPath(); ctx.moveTo(cx - s * 0.5 * 0.12, cy + s * 0.5 * 0.72); ctx.lineTo(cx + s * 0.5 * 0.12, cy + s * 0.5 * 0.72); ctx.lineTo(cx, cy + s * 0.5 * 0.9); ctx.closePath(); ctx.fill();
}
function optionC(ctx: SKRSContext2D, ox: number, oy: number, s: number): void {
  scratch(ctx, ox + s * 0.2, oy + s * 0.05, ox + s * 0.19, oy + s * 0.78, s * 0.14, C.text);
  scratch(ctx, ox + s * 0.18, oy + s * 0.8, ox + s * 0.86, oy + s * 0.78, s * 0.14, C.text);
  scratch(ctx, ox + s * 0.4, oy + s * 0.12, ox + s * 0.39, oy + s * 0.62, s * 0.09, C.text);
  scratch(ctx, ox + s * 0.58, oy + s * 0.1, ox + s * 0.57, oy + s * 0.62, s * 0.09, C.text);
  scratch(ctx, ox + s * 0.76, oy + s * 0.12, ox + s * 0.75, oy + s * 0.62, s * 0.09, C.text);
  scratch(ctx, ox + s * 0.28, oy + s * 0.66, ox + s * 0.9, oy + s * 0.2, s * 0.1, C.orange);
}
const W = 1500; const H = 560; const cv = createCanvas(W, H); const ctx = cv.getContext('2d');
ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
const labels = ['A  hand-marked tally', 'B  angular wolf head', 'C  L made of tally marks'];
[0, 1, 2].forEach((i) => {
  const x = 40 + i * 490; ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 2; ctx.strokeRect(x, 40, 450, 440);
  if (i === 0) optionA(ctx, x + 80, 90, 290); if (i === 1) optionB(ctx, x + 225, 260, 330); if (i === 2) optionC(ctx, x + 80, 90, 290);
  ctx.font = '700 64px "Barlow Condensed"'; ctx.textAlign = 'center'; const t = 'LUPU'; const w1 = ctx.measureText(t).width; const w2 = ctx.measureText('-').width; const w3 = ctx.measureText('FIT').width; let sx = x + 225 - (w1 + w2 + w3) / 2; ctx.textAlign = 'left';
  for (const [p, col] of [['LUPU', C.text], ['-', C.orange], ['FIT', C.text]] as const) { ctx.fillStyle = col; ctx.fillText(p, sx, 440); sx += ctx.measureText(p).width; }
  ctx.font = '500 24px sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.fillText(labels[i] as string, x + 225, 520);
});
grain(ctx, W, H, 9000);
writeFileSync(join(root, 'store-assets/logo-options.png'), cv.toBuffer('image/png'));
console.log('ok');

#!/usr/bin/env tsx
/** Generates the brand/app-store images in code (no external assets): icons, maskable, adaptive layers, splash, feature graphic, OG. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';

const root = resolve(import.meta.dirname, '..');
const fonts = join(root, 'client/public/fonts');
GlobalFonts.registerFromPath(join(fonts, 'barlow-condensed-latin-700-normal.woff2'), 'Barlow Condensed');
const C = { bg: '#0B0B0D', surface: '#1A1A1D', text: '#F5F5F5', muted: '#A3A3A8', orange: '#FF6A00', border: '#6B6B72' };

let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const jit = (a: number) => (rnd() - 0.5) * 2 * a;
/** A hand-drawn marker stroke: tapered, wobbly edges, rough ends, slight tilt. */
function scratch(ctx: SKRSContext2D, x1: number, y1: number, x2: number, y2: number, w: number, col: string): void {
  const n = 14; const dx = x2 - x1; const dy = y2 - y1; const len = Math.hypot(dx, dy); const nx = -dy / len; const ny = dx / len;
  const L: [number, number][] = []; const R: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; const taper = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05)); const half = (w * taper) / 2;
    const cx = x1 + dx * t + nx * jit(w * 0.05); const cy = y1 + dy * t + ny * jit(w * 0.05);
    L.push([cx + nx * (half + jit(w * 0.09)), cy + ny * (half + jit(w * 0.09))]); R.push([cx - nx * (half + jit(w * 0.09)), cy - ny * (half + jit(w * 0.09))]);
  }
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(...(L[0] as [number, number]));
  for (const p of L) ctx.lineTo(...p); for (const p of [...R].reverse()) ctx.lineTo(...p); ctx.closePath(); ctx.fill();
}
/** Dry-marker grain. `erase` knocks specks out of transparent layers; otherwise paints the background colour. */
function grain(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, amount: number, erase: boolean, unit: number): void {
  ctx.save(); if (erase) ctx.globalCompositeOperation = 'destination-out'; else ctx.fillStyle = C.bg;
  if (erase) ctx.fillStyle = '#000';
  for (let i = 0; i < amount; i++) { ctx.globalAlpha = 0.35 + rnd() * 0.5; const sz = unit * (1 + rnd() * 2.2); ctx.fillRect(x + rnd() * w, y + rnd() * h, sz, sz * (0.6 + rnd())); }
  ctx.restore();
}
/** The mark: four hand-marked tally strokes crossed by the orange slash, with marker grain. size = width of the mark. */
function mark(ctx: SKRSContext2D, cx: number, cy: number, size: number, o: { mono?: boolean; erase?: boolean; grain?: boolean } = {}): void {
  seed = 7; const s = size; const ox = cx - s / 2; const oy = cy - s * 0.38;
  const white = o.mono ? '#FFFFFF' : C.text; const orange = o.mono ? '#FFFFFF' : C.orange;
  const xs = [0.14, 0.35, 0.57, 0.78]; const lens = [1, 0.94, 1.03, 0.97];
  xs.forEach((x, i) => { const tilt = jit(0.05); scratch(ctx, ox + s * (x + tilt), oy + s * (0.1 + jit(0.02)), ox + s * (x - tilt * 0.6 + jit(0.01)), oy + s * (0.1 + 0.62 * (lens[i] as number)), s * 0.1, white); });
  scratch(ctx, ox - s * 0.04, oy + s * 0.64, ox + s * 1.0, oy + s * 0.2, s * 0.115, orange);
  if (o.grain !== false && s >= 150 && !o.mono) grain(ctx, ox - s * 0.06, oy, s * 1.1, s * 0.8, Math.round(s * 1.3), !!o.erase, Math.max(1, s / 250));
}
function png(name: string, w: number, h: number, draw: (c: SKRSContext2D) => void, dir = 'client/public/icons'): void {
  const cv = createCanvas(w, h); const ctx = cv.getContext('2d'); draw(ctx);
  const d = join(root, dir); mkdirSync(d, { recursive: true }); writeFileSync(join(d, name), cv.toBuffer('image/png'));
}
const fill = (c: SKRSContext2D, w: number, h: number, col = C.bg) => { c.fillStyle = col; c.fillRect(0, 0, w, h); };
const word = (c: SKRSContext2D, x: number, y: number, size: number, align: 'center' | 'left' = 'center') => {
  c.font = `700 ${size}px "Barlow Condensed"`; c.textAlign = align; c.textBaseline = 'alphabetic';
  const full = 'LUPU-FIT'; const wTot = c.measureText(full).width; let sx = align === 'center' ? x - wTot / 2 : x;
  c.textAlign = 'left';
  for (const part of ['LUPU', '-', 'FIT']) { c.fillStyle = part === '-' ? C.orange : C.text; c.fillText(part, sx, y); sx += c.measureText(part).width; }
};

for (const s of [192, 512, 1024]) png(`icon-${s}.png`, s, s, (c) => { fill(c, s, s); mark(c, s / 2, s / 2, s * 0.58); });
png('icon-maskable-512.png', 512, 512, (c) => { fill(c, 512, 512); mark(c, 256, 256, 512 * 0.42); }); // inside the 80% safe zone
png('apple-touch-icon.png', 180, 180, (c) => { fill(c, 180, 180); mark(c, 90, 90, 180 * 0.56); });
png('favicon-32.png', 32, 32, (c) => { fill(c, 32, 32); mark(c, 16, 16, 20); });
// Android adaptive icon layers (108dp canvas, 66dp safe zone): background plate + foreground mark + monochrome
png('adaptive-background-432.png', 432, 432, (c) => fill(c, 432, 432));
png('adaptive-foreground-432.png', 432, 432, (c) => { c.clearRect(0, 0, 432, 432); mark(c, 216, 216, 432 * 0.40, { erase: true }); });
png('adaptive-monochrome-432.png', 432, 432, (c) => { c.clearRect(0, 0, 432, 432); mark(c, 216, 216, 432 * 0.40, { mono: true }); });
// Play Store assets
png('play-icon-512.png', 512, 512, (c) => { fill(c, 512, 512); mark(c, 256, 256, 512 * 0.56); }, 'store-assets');
png('feature-graphic-1024x500.png', 1024, 500, (c) => {
  fill(c, 1024, 500); c.fillStyle = C.surface; c.fillRect(0, 440, 1024, 60);
  mark(c, 235, 250, 270);
  word(c, 420, 262, 150, 'left');
  c.font = '500 34px sans-serif'; c.fillStyle = C.muted; c.textAlign = 'left'; c.fillText('Know exactly what to train today.', 424, 322);
  c.fillStyle = C.orange; c.fillRect(424, 345, 120, 6);
}, 'store-assets');
png('splash-2732.png', 2732, 2732, (c) => { fill(c, 2732, 2732); mark(c, 1366, 1250, 720); word(c, 1366, 1830, 260); }, 'store-assets');
png('og-image-1200x630.png', 1200, 630, (c) => { fill(c, 1200, 630); mark(c, 260, 315, 300); word(c, 460, 350, 170, 'left'); c.fillStyle = C.orange; c.fillRect(464, 390, 140, 8); }, 'store-assets');
console.log('brand assets written');

// favicon.svg wraps the rendered mark so it stays identical to the app icon
import { readFileSync } from 'node:fs';
const b64 = readFileSync(join(root, 'client/public/icons/icon-192.png')).toString('base64');
writeFileSync(join(root, 'client/public/icons/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><image width="192" height="192" href="data:image/png;base64,${b64}"/></svg>`);

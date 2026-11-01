#!/usr/bin/env tsx
/** Generates the brand/app-store images in code (no external assets): icons, maskable, adaptive layers, splash, feature graphic, OG. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';

const root = resolve(import.meta.dirname, '..');
const fonts = join(root, 'client/public/fonts');
GlobalFonts.registerFromPath(join(fonts, 'barlow-condensed-latin-700-normal.woff2'), 'Barlow Condensed');
const C = { bg: '#0B0B0D', surface: '#1A1A1D', text: '#F5F5F5', muted: '#A3A3A8', orange: '#FF6A00', border: '#6B6B72' };

/** The mark: a training tally (four strokes + the orange slash), the app's signature motif. */
function mark(ctx: SKRSContext2D, cx: number, cy: number, size: number, bg?: string): void {
  const w = size; const h = size * 0.72; const x0 = cx - w / 2; const y0 = cy - h / 2;
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(x0 - w * 0.2, y0 - h * 0.25, w * 1.4, h * 1.5); }
  ctx.lineCap = 'round'; ctx.lineWidth = size * 0.1;
  ctx.strokeStyle = C.text;
  for (let i = 0; i < 4; i++) { const x = x0 + w * (0.12 + i * 0.25); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke(); }
  ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(x0 - w * 0.04, y0 + h * 0.82); ctx.lineTo(x0 + w * 1.02, y0 + h * 0.16); ctx.stroke();
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

for (const s of [192, 512, 1024]) png(`icon-${s}.png`, s, s, (c) => { fill(c, s, s); mark(c, s / 2, s / 2, s * 0.56); });
png('icon-maskable-512.png', 512, 512, (c) => { fill(c, 512, 512); mark(c, 256, 256, 512 * 0.42); }); // inside the 80% safe zone
png('apple-touch-icon.png', 180, 180, (c) => { fill(c, 180, 180); mark(c, 90, 90, 180 * 0.56); });
png('favicon-32.png', 32, 32, (c) => { fill(c, 32, 32); mark(c, 16, 16, 20); });
// Android adaptive icon layers (108dp canvas, 66dp safe zone): background plate + foreground mark + monochrome
png('adaptive-background-432.png', 432, 432, (c) => fill(c, 432, 432));
png('adaptive-foreground-432.png', 432, 432, (c) => { c.clearRect(0, 0, 432, 432); mark(c, 216, 216, 432 * 0.40); });
png('adaptive-monochrome-432.png', 432, 432, (c) => { c.clearRect(0, 0, 432, 432); c.lineCap = 'round'; c.lineWidth = 432 * 0.04; c.strokeStyle = '#FFFFFF'; const w = 432 * 0.4; const h = w * 0.72; const x0 = 216 - w / 2; const y0 = 216 - h / 2; for (let i = 0; i < 4; i++) { const x = x0 + w * (0.12 + i * 0.25); c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 + h); c.stroke(); } c.beginPath(); c.moveTo(x0 - w * 0.04, y0 + h * 0.82); c.lineTo(x0 + w * 1.02, y0 + h * 0.16); c.stroke(); });
// Play Store assets
png('play-icon-512.png', 512, 512, (c) => { fill(c, 512, 512); mark(c, 256, 256, 512 * 0.56); }, 'store-assets');
png('feature-graphic-1024x500.png', 1024, 500, (c) => {
  fill(c, 1024, 500); c.fillStyle = C.surface; c.fillRect(0, 440, 1024, 60);
  mark(c, 230, 235, 250);
  word(c, 420, 262, 150, 'left');
  c.font = '500 34px sans-serif'; c.fillStyle = C.muted; c.textAlign = 'left'; c.fillText('Know exactly what to train today.', 424, 322);
  c.fillStyle = C.orange; c.fillRect(424, 345, 120, 6);
}, 'store-assets');
png('splash-2732.png', 2732, 2732, (c) => { fill(c, 2732, 2732); mark(c, 1366, 1250, 720); word(c, 1366, 1830, 260); }, 'store-assets');
png('og-image-1200x630.png', 1200, 630, (c) => { fill(c, 1200, 630); mark(c, 260, 315, 300); word(c, 460, 350, 170, 'left'); c.fillStyle = C.orange; c.fillRect(464, 390, 140, 8); }, 'store-assets');
console.log('brand assets written');

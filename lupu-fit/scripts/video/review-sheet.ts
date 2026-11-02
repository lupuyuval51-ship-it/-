#!/usr/bin/env tsx
/**
 * Review contact sheets built from the ENCODED mp4 files (what users see).
 *   tsx scripts/video/review-sheet.ts [outDir=/tmp/vid-review] [idFilterCsv] [--per 16]
 * Frames at 0, 0.5, 1.0, 1.5 s (start / mid-concentric / end / mid-return of a 2 s rep) per clip.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const DIR = resolve(import.meta.dirname, '../../client/public/media/exercises');
const out = process.argv[2] ?? '/tmp/vid-review';
const filt = process.argv[3]?.split(',').filter(Boolean);
const perArg = process.argv.indexOf('--per'); const per = perArg > -1 ? Number(process.argv[perArg + 1]) : 16;
mkdirSync(out, { recursive: true });
const manifest = JSON.parse(readFileSync(join(DIR, 'media-manifest.json'), 'utf8')) as { items: { id: string; fidelity: string }[] };
const ids = readdirSync(DIR).filter((f) => f.endsWith('.mp4')).map((f) => f.slice(0, -4)).filter((id) => !filt || filt.some((k) => id.includes(k))).sort();
const fid = new Map(manifest.items.map((i) => [i.id, i.fidelity]));
const T = 150; const cols = 2; const rowsPer = per / cols; const rowH = T + 16;
let page = 0;
for (let p = 0; p < ids.length; p += per) {
  const slice = ids.slice(p, p + per);
  const sh = createCanvas(cols * 4 * T, rowsPer * rowH); const c = sh.getContext('2d');
  c.fillStyle = '#222'; c.fillRect(0, 0, sh.width, sh.height);
  for (let i = 0; i < slice.length; i++) {
    const id = slice[i]!;
    const png = join(out, `.tmp-${id}.png`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(DIR, `${id}.mp4`), '-vf', `select='eq(n\\,0)+eq(n\\,15)+eq(n\\,30)+eq(n\\,45)',scale=${T}:${T},tile=4x1`, '-frames:v', '1', '-vsync', '0', png]);
    const img = await loadImage(png);
    const x = (i % cols) * 4 * T; const y = Math.floor(i / cols) * rowH;
    c.drawImage(img, x, y);
    c.fillStyle = fid.get(id) === 'specific' ? '#9f9' : '#fd6'; c.font = '12px sans-serif'; c.fillText(`${id} [${fid.get(id)?.slice(0, 4)}]`, x + 3, y + T + 12);
  }
  writeFileSync(join(out, `sheet-${String(page).padStart(2, '0')}.png`), sh.toBuffer('image/png'));
  page++;
}
execFileSync('sh', ['-c', `rm -f ${out}/.tmp-*.png`]);
console.log(`${ids.length} clips, ${page} pages -> ${out}`);

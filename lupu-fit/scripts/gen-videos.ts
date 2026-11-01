#!/usr/bin/env tsx
/**
 * Generates procedural technique clips + posters for every exercise.
 *   npm run gen:videos                 all exercises, 3 worker processes
 *   npm run gen:videos -- --only a,b   specific ids
 *   npm run gen:videos -- --workers 1
 * Output: client/public/media/exercises/<id>.mp4 + <id>.jpg and media-manifest.json (generated, not committed).
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { EXERCISES_ALL } from '../shared/src/content/sources.ts';
import { validateMp4 } from '../server/src/media/mp4Validator.ts';
import { classify } from './video/classify.ts';
import { buildClip, FRAMES } from './video/clip.ts';
import { encodeMp4 } from './video/encode.ts';
import { drawFrame, fitCamera, makeCanvas } from './video/render.ts';

const ROOT = resolve(import.meta.dirname, '..');
export const OUT = join(ROOT, 'client/public/media/exercises');
const arg = (n: string): string | undefined => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
const only = arg('--only')?.split(',');
const workers = Number(arg('--workers') ?? 3);
const shard = arg('--shard');

interface Entry { id: string; file: string; poster: string; sha256: string; sizeBytes: number; posterBytes: number; durationSec: number; width: number; height: number; rule: string; fidelity: string; mode: string; generator: string; reviewed: false }

async function renderOne(id: string): Promise<Entry> {
  const ex = EXERCISES_ALL.find((e) => e.id === id);
  if (!ex) throw new Error(`unknown exercise ${id}`);
  const plan = classify(ex);
  const clip = buildClip(plan, ex.unilateral);
  const cam = fitCamera([...clip.frames, ...clip.ghosts]);
  const { canvas, ctx } = makeCanvas();
  const mp4 = join(OUT, `${id}.mp4`); const jpg = join(OUT, `${id}.jpg`);
  await encodeMp4(mp4, FRAMES, ctx, (i) => drawFrame(ctx, cam, clip.frames[i]!, ex.primary, clip.ghosts));
  drawFrame(ctx, cam, clip.poster, ex.primary, clip.ghosts);
  let q = 80; let buf = canvas.toBuffer('image/jpeg', q);
  while (buf.length > 58_000 && q > 30) { q -= 8; buf = canvas.toBuffer('image/jpeg', q); }
  writeFileSync(jpg, buf);
  const bytes = readFileSync(mp4);
  const rep = validateMp4(new Uint8Array(bytes));
  if (!rep.ok) throw new Error(`${id}: invalid mp4: ${rep.errors.join('; ')}`);
  return {
    id, file: `/media/exercises/${id}.mp4`, poster: `/media/exercises/${id}.jpg`, sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeBytes: bytes.length, posterBytes: buf.length, durationSec: rep.durationSec ?? 0, width: rep.width ?? 0, height: rep.height ?? 0,
    rule: plan.rule, fidelity: plan.fidelity, mode: plan.mode, generator: 'procedural-schematic-v1', reviewed: false,
  };
}

async function worker(ids: string[], out: string): Promise<void> {
  const entries: Entry[] = [];
  for (const id of ids) { entries.push(await renderOne(id)); process.stdout.write('.'); }
  writeFileSync(out, JSON.stringify(entries));
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const ids = (only ?? EXERCISES_ALL.map((e) => e.id));
  if (shard) { // child process: shard "i/n"
    const [i, n] = shard.split('/').map(Number) as [number, number];
    await worker(ids.filter((_, k) => k % n === i), join(OUT, `.shard-${i}.json`));
    return;
  }
  const t0 = performance.now();
  const n = Math.max(1, Math.min(workers, ids.length));
  await Promise.all(Array.from({ length: n }, (_, i) => new Promise<void>((res, rej) => {
    const args = [...process.argv.slice(1).filter((a, k, all) => a !== '--workers' && all[k - 1] !== '--workers'), '--shard', `${i}/${n}`];
    const p = spawn(process.execPath, ['--import', 'tsx', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`worker ${i} exited ${c}`))));
  })));
  const entries: Entry[] = [];
  for (let i = 0; i < n; i++) entries.push(...(JSON.parse(readFileSync(join(OUT, `.shard-${i}.json`), 'utf8')) as Entry[]));
  if (only) { // partial run: merge into the existing manifest instead of replacing it
    try { const prev = JSON.parse(readFileSync(join(OUT, 'media-manifest.json'), 'utf8')) as { items: Entry[] }; const fresh = new Set(entries.map((e) => e.id)); entries.push(...prev.items.filter((e) => !fresh.has(e.id))); } catch { /* first run */ }
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));
  const manifest = { generator: 'procedural-schematic-v1', priorityA: EXERCISES_ALL.filter((e) => e.videoPriority === 'A').map((e) => e.id), note: 'Schematic stick-figure animations generated in code; not filmed footage. Not human-reviewed.', count: entries.length, items: entries };
  writeFileSync(join(OUT, 'media-manifest.json'), JSON.stringify(manifest, null, 1));
  const total = entries.reduce((a, e) => a + e.sizeBytes, 0);
  const by = (k: 'fidelity') => entries.reduce<Record<string, number>>((m, e) => ({ ...m, [e[k]]: (m[e[k]] ?? 0) + 1 }), {});
  console.log(`\n${entries.length} clips, ${(total / 1e6).toFixed(1)} MB total, ${((performance.now() - t0) / 1000).toFixed(0)}s, fidelity ${JSON.stringify(by('fidelity'))}`);
  void statSync;
}
await main();

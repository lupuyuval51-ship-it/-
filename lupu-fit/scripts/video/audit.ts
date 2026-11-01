#!/usr/bin/env tsx
/** Lists how every exercise is mapped to a motion (fidelity report) and writes contact sheets of poster frames. */
import { readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import type { ExerciseContent } from '../../shared/src/content/types.ts';
import { classify } from './classify.ts';
import { buildClip } from './clip.ts';
import { drawFrame, fitCamera, makeCanvas } from './render.ts';

const dir = resolve(import.meta.dirname, '../../shared/src/content/data/exercises');
const all: ExerciseContent[] = [];
for (const f of readdirSync(dir)) { try { const m = (await import(pathToFileURL(join(dir, f)).href)) as Record<string, ExerciseContent[]>; all.push(...(Object.values(m).find(Array.isArray) ?? [])); } catch { console.log('skip', f); } }
const out = process.argv[2] ?? '.';
const filter = process.argv[3];
const rows = all.map((e) => ({ e, p: classify(e) }));
const count = (k: string) => rows.filter((r) => r.p.fidelity === k).length;
console.log(`total ${rows.length}: specific ${count('specific')}, approximate ${count('approximate')}, generic ${count('generic')}`);
for (const r of rows.filter((r) => r.p.fidelity === 'generic')) console.log('GENERIC', r.e.id, r.e.pattern, r.p.rule);
const pick = rows.filter((r) => !filter || (filter === 'generic' ? r.p.fidelity === 'generic' : filter === 'approx' ? r.p.fidelity === 'approximate' : r.e.id.startsWith(filter)));
const cols = 6; const cell = 220; const per = 30;
const { canvas, ctx } = makeCanvas();
for (let page = 0; page * per < pick.length; page++) {
  const slice = pick.slice(page * per, page * per + per);
  const rowsN = Math.ceil(slice.length / cols);
  const sh = createCanvas(cols * cell, rowsN * (cell + 16)); const sctx = sh.getContext('2d');
  sctx.fillStyle = '#000'; sctx.fillRect(0, 0, sh.width, sh.height);
  slice.forEach(({ e, p }, i) => {
    const clip = buildClip(p, e.unilateral); const cam = fitCamera([...clip.frames, ...clip.ghosts]);
    drawFrame(ctx, cam, clip.poster, e.primary, clip.ghosts);
    const x = (i % cols) * cell; const y = Math.floor(i / cols) * (cell + 16);
    sctx.drawImage(canvas, x, y, cell, cell); sctx.fillStyle = p.fidelity === 'specific' ? '#9f9' : p.fidelity === 'approximate' ? '#fd6' : '#f88'; sctx.font = '11px sans-serif'; sctx.fillText(e.id.slice(0, 34), x + 3, y + cell + 12);
  });
  writeFileSync(join(out, `audit-${filter ?? 'all'}-${page}.png`), sh.toBuffer('image/png'));
}
console.log('pages', Math.ceil(pick.length / per));

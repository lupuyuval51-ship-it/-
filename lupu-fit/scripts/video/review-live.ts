#!/usr/bin/env tsx
/**
 * Fast visual iteration without encoding: renders frames straight from the motion programs.
 *   tsx scripts/video/review-live.ts <out.png> <idSubstringCsv> [--per 12] [--cols 6]
 * Columns: 4 frames per clip at 0%, 17%, 30%, 50% of a rep window.
 */
import { writeFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { EXERCISES_ALL } from '../../shared/src/content/sources.ts';
import { classify } from './classify.ts';
import { buildClip, FRAMES, repsFor } from './clip.ts';
import { drawFrame, fitCamera, makeCanvas } from './render.ts';

const out = process.argv[2]!; const ids = process.argv[3]!.split(',');
const T = 190;
const picks = ids.flatMap((k) => EXERCISES_ALL.filter((e) => (k.startsWith('=') ? e.id === k.slice(1) : e.id.includes(k)))).filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i);
const sh = createCanvas(4 * T * 2, Math.ceil(picks.length / 2) * (T + 16)); const c = sh.getContext('2d'); c.fillStyle = '#222'; c.fillRect(0, 0, sh.width, sh.height);
const { canvas, ctx } = makeCanvas();
picks.forEach((e, i) => {
  const plan = classify(e); const clip = buildClip(plan, e.unilateral); const cam = fitCamera([...clip.frames, ...clip.ghosts]);
  const per = FRAMES / (plan.mode === 'rep' ? repsFor('rep', e.unilateral) : plan.mode === 'cycle' ? 4 : 1);
  const at = plan.mode === 'rep' ? [0, 0.23, 0.5, 0.78] : plan.mode === 'cycle' ? [0, 0.25, 0.5, 0.75] : [0, 0.25, 0.5, 0.75];
  at.forEach((p, k) => {
    drawFrame(ctx, cam, clip.frames[Math.floor(p * per) % FRAMES]!, e.primary, clip.ghosts, clip.trail);
    const x = (i % 2) * 4 * T + k * T; const y = Math.floor(i / 2) * (T + 16);
    c.drawImage(canvas, x, y, T, T);
  });
  const x = (i % 2) * 4 * T; const y = Math.floor(i / 2) * (T + 16);
  c.fillStyle = plan.fidelity === 'specific' ? '#9f9' : '#fd6'; c.font = '12px sans-serif'; c.fillText(`${e.id} [${plan.fidelity.slice(0, 4)}] ${plan.rule}`, x + 3, y + T + 12);
});
writeFileSync(out, sh.toBuffer('image/png'));
console.log(picks.length, 'clips ->', out);

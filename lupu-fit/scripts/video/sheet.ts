#!/usr/bin/env tsx
/** Contact sheet: renders named motions at several phases into one PNG for visual review. */
import { writeFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import type { Muscle } from '../../shared/src/enums.ts';
import { drawFrame, fitCamera, makeCanvas, SIZE } from './render.ts';
import type { Motion } from './motions.ts';

export function sheet(items: { name: string; motion: Motion; primary?: Muscle[] }[], out: string, cols = 4, phases = [0, 0.5, 1]): void {
  const cell = 240; const rows = Math.ceil((items.length * phases.length) / cols);
  const sh = createCanvas(cols * cell, rows * (cell + 18)); const sctx = sh.getContext('2d');
  sctx.fillStyle = '#000'; sctx.fillRect(0, 0, sh.width, sh.height);
  const { canvas, ctx } = makeCanvas();
  let i = 0;
  for (const it of items) {
    const frames = [0, 0.25, 0.5, 0.75, 1].map((s) => it.motion({ s, u: s, side: 0 }));
    const cam = fitCamera(frames);
    const ghosts = [it.motion({ s: 0, u: 0, side: 0 }), it.motion({ s: 1, u: 0.5, side: 0 })];
    for (const s of phases) {
      drawFrame(ctx, cam, it.motion({ s, u: s, side: 0 }), it.primary ?? [], ghosts);
      const x = (i % cols) * cell; const y = Math.floor(i / cols) * (cell + 18);
      sctx.drawImage(canvas, x, y, cell, cell);
      sctx.fillStyle = '#fff'; sctx.font = '13px sans-serif'; sctx.fillText(`${it.name} s=${s}`, x + 6, y + cell + 13);
      i++;
    }
  }
  writeFileSync(out, sh.toBuffer('image/png'));
  void SIZE;
}

/**
 * Renders contact sheets (PNG) of exercise animations for visual review.
 * Usage: tsx scripts/render-animations.ts [--group=legs] [--ids=a,b] [--out=/tmp/anim] [--frames=6]
 * Each row = one exercise; columns = evenly spaced loop times (0 … 1).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { animationFrameSvg } from '../shared/animation/svg';
import { ANIMATIONS } from '../shared/animation/data/index';
import { EXERCISE_LIBRARY } from '../server/src/data/exercises/index';

const args = new Map(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k ?? '', v ?? ''] as const; }));
const out = args.get('out') || '/tmp/anim';
const frames = Number(args.get('frames') || 6);
const ids = args.get('ids')?.split(',').filter(Boolean);
const group = args.get('group');

async function main() {
  let list = [...ANIMATIONS.values()];
  if (ids?.length) list = list.filter((a) => ids.includes(a.id));
  if (group) {
    const mod = (await import(`../shared/animation/data/${group}.ts`)) as { animations: { id: string }[] };
    const gIds = new Set(mod.animations.map((a) => a.id));
    list = list.filter((a) => gIds.has(a.id));
  }
  if (!list.length) throw new Error('no animations matched');
  fs.mkdirSync(out, { recursive: true });
  const byId = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 200 * frames + 40, height: 800 } });
  const written: string[] = [];
  for (let i = 0; i < list.length; i += 6) {
    const chunk = list.slice(i, i + 6);
    const rows = chunk
      .map((a) => {
        const ex = byId.get(a.id);
        const cells = Array.from({ length: frames }, (_, k) => animationFrameSvg(a, k / frames, ex?.primaryMuscles ?? [], 190)).join('');
        return `<div class="row"><div class="lbl">${a.id} — ${ex?.name.en ?? '?'} (${a.durationSec}s, ${a.view ?? 'side'})</div><div class="cells">${cells}</div></div>`;
      })
      .join('');
    await page.setContent(`<html><body style="margin:10px;background:#020617;color:#e2e8f0;font:12px sans-serif"><style>.cells{display:flex;gap:6px}.row{margin-bottom:10px}.lbl{margin:2px 0}</style>${rows}</body></html>`);
    const file = path.join(out, `${group ?? 'sheet'}-${Math.floor(i / 6) + 1}.png`);
    await page.screenshot({ path: file, fullPage: true });
    written.push(file);
  }
  await browser.close();
  console.log(written.join('\n'));
}
main().catch((e) => { console.error(e); process.exit(1); });

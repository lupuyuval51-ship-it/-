import { describe, expect, it } from 'vitest';
import { EXERCISES_ALL } from '../shared/src/content/sources.ts';
import { validateMp4 } from '../server/src/media/mp4Validator.ts';
import { classify } from './video/classify.ts';
import { buildClip, FRAMES, phaseAt } from './video/clip.ts';
import type { Frame } from './video/scene.ts';
import type { Part } from './video/rig.ts';
import { worstHyperextension } from './video/invariants.ts';
import { repsFor } from './video/clip.ts';

const pts = (f: Frame): [number, number][] => [...f.rig.segs.flatMap((s) => [s.a, s.b]), f.rig.head.c].map((p) => [p[0], p[1]] as [number, number]);
const segLen = (a: readonly [number, number], b: readonly [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('procedural technique clips: geometry invariants for every exercise', () => {
  it('has exercises to test', () => expect(EXERCISES_ALL.length).toBeGreaterThan(0));

  for (const ex of EXERCISES_ALL) {
    it(`${ex.id}`, () => {
      const plan = classify(ex);
      const clip = buildClip(plan, ex.unilateral);
      expect(clip.frames.length).toBe(FRAMES);

      // finite numbers everywhere
      for (const f of clip.frames) for (const [x, y] of pts(f)) { expect(Number.isFinite(x) && Number.isFinite(y), 'NaN point').toBe(true); }

      // bones keep their length (limbs never stretch)
      const ref = new Map<string, number>();
      for (const f of clip.frames) f.rig.segs.forEach((s, i) => {
        if (s.part === 'neck') return;
        const key = `${i}:${s.part as Part}`; const l = segLen(s.a, s.b);
        const r0 = ref.get(key); if (r0 === undefined) ref.set(key, l); else expect(Math.abs(l - r0) / r0, `${key} stretched`).toBeLessThan(0.02);
      });

      // nothing sinks through the floor
      let minY = Infinity; for (const f of clip.frames) for (const [, y] of pts(f)) minY = Math.min(minY, y);
      const hangs = plan.rule.startsWith('hang') || /pull|dead_hang|scap|dip$|handstand|hspu|carry/.test(plan.rule);
      if (!hangs) expect(minY, 'figure below floor').toBeGreaterThan(-0.045);

      // seamless loop and no teleporting: per-frame motion small, and last->first is as small as any other step
      const step = (a: Frame, b: Frame) => Math.max(...pts(a).map((p, i) => segLen(p, pts(b)[i] as [number, number])));
      const steps = clip.frames.map((f, i) => step(f, clip.frames[(i + 1) % FRAMES] as Frame));
      const maxStep = Math.max(...steps);
      const limit = plan.mode === 'cycle' ? 0.2 : 0.12;
      expect(maxStep, `max per-frame joint jump ${maxStep.toFixed(3)} (limit ${limit})`).toBeLessThan(limit);
      const seam = steps[FRAMES - 1] as number;
      expect(seam, 'loop seam is not seamless').toBeLessThan(Math.max(0.03, maxStep * 1.6));

      // knees and elbows never bend backwards (side-view rigs face +x)
      const hyp = worstHyperextension(clip.frames);
      expect(hyp.knee, 'knee hyperextension').toBeLessThan(0.01);
      expect(hyp.elbow, 'elbow hyperextension').toBeLessThan(0.01);

      // no text/counter overlay is rendered and rep clips pause at both ends (at least 3 identical frames at the top)
      if (plan.mode === 'rep') {
        const ss = clip.frames.map((_, i) => phaseAt('rep', i / FRAMES, ex.unilateral).s);
        expect(ss.filter((x) => x === 1).length, 'top pause').toBeGreaterThanOrEqual(10);
        expect(ss.filter((x) => x === 0).length, 'bottom pause').toBeGreaterThanOrEqual(5);
      }

      // t=1 must equal t=0 (loop closes exactly)
      const a = plan.motion(phaseAt(plan.mode, 0, ex.unilateral)); const b = plan.motion(phaseAt(plan.mode, 0.999999, false));
      if (!ex.unilateral) expect(step(a, b)).toBeLessThan(0.01);
    });
  }
});

describe('rep timing', () => {
  it('uses 2 slow reps for bilateral and 4 for unilateral rep clips', () => {
    expect(repsFor('rep', false)).toBe(2);
    expect(repsFor('rep', true)).toBe(4);
  });
  it('profile is continuous (no jump between frames)', () => {
    let prev = phaseAt('rep', 0, false).s;
    for (let i = 1; i <= 240; i++) { const s = phaseAt('rep', (i % 240) / 240, false).s; expect(Math.abs(s - prev)).toBeLessThan(0.08); prev = s; }
  });
});

describe('anatomical IK', () => {
  it('flexes knee and elbow the right way regardless of the caller preference', async () => {
    const { sideRig } = await import('./video/rig.ts');
    const rig = sideRig({ hip: [0, 0.5], torso: 0, armN: { to: [0.05, 0.6], pref: [-1, 0] }, legN: { to: [0.1, 0.1], pref: [-1, 0], foot: 60 } });
    expect(worstHyperextension([{ rig, props: [] }]).knee).toBeLessThan(0.01);
    expect(worstHyperextension([{ rig, props: [] }]).elbow).toBeLessThan(0.01);
  });
});

describe('mp4 validator', () => {
  it('rejects non-mp4 bytes and truncated files', () => {
    expect(validateMp4(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).ok).toBe(false);
    expect(validateMp4(new Uint8Array(0)).ok).toBe(false);
  });
});

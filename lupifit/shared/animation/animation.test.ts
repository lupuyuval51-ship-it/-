import { describe, expect, it } from 'vitest';
import { EXERCISE_LIBRARY } from '../../server/src/data/exercises/index';
import { ANIMATIONS } from './data/index';
import { computeFrame, loopTravel, validateAnimation } from './engine';
import { allManifestEntries, getManifestEntry } from './manifest';
import { SIMILARITY_LIMIT, analyzeAnimation, motionSignature, similarPairs, similarity, visualSignature } from './qa';
import { QA_EXCEPTIONS } from './qa-exceptions';

describe('exercise animations', () => {
  it('every library exercise has a demonstration animation', () => {
    const missing = EXERCISE_LIBRARY.filter((e) => !ANIMATIONS.has(e.id)).map((e) => e.id);
    expect(missing).toEqual([]);
    const unknown = [...ANIMATIONS.keys()].filter((id) => !EXERCISE_LIBRARY.some((e) => e.id === id));
    expect(unknown).toEqual([]);
  });

  it('every animation loops, stays above the floor and produces finite geometry', () => {
    for (const anim of ANIMATIONS.values()) expect(validateAnimation(anim), anim.id).toEqual([]);
  });

  it('loops seamlessly (first and last frames match)', () => {
    for (const anim of ANIMATIONS.values()) {
      const a = computeFrame(anim, 0).joints;
      const b = computeFrame(anim, 0.99999).joints;
      // Travelling movements (follow camera) may advance horizontally by exactly the loop travel.
      const travel = anim.camera?.followX ? loopTravel(anim) : 0;
      expect(Math.abs(a.hip[0] + travel - b.hip[0]) + Math.abs(a.hip[1] - b.hip[1]), anim.id).toBeLessThan(1);
      if (!anim.camera?.followX) expect(Math.abs(loopTravel(anim)), anim.id).toBeLessThan(1);
    }
  });
});

describe('animation QA and manifest', () => {
  it('every verified exercise passes the QA with only documented exceptions', () => {
    for (const anim of ANIMATIONS.values()) {
      const entry = getManifestEntry(anim.id)!;
      const qa = analyzeAnimation(anim, QA_EXCEPTIONS[anim.id] ?? []);
      if (entry.status === 'verified') expect(qa.issues.map((i) => i.detail), anim.id).toEqual([]);
    }
  });

  it('has a manifest entry with phases and tempo for every animation and never claims more than it verified', () => {
    const entries = allManifestEntries();
    expect(entries).toHaveLength(ANIMATIONS.size);
    for (const e of entries) {
      expect(e.phases[0]?.t, e.animationId).toBe(0);
      expect(e.phases.every((p, i) => i === 0 || p.t > e.phases[i - 1]!.t), e.animationId).toBe(true);
      expect('holdSec' in e.tempo || e.tempo.ecc + e.tempo.con > 0, e.animationId).toBe(true);
      if (e.status === 'verified') expect(e.reviewedAt, e.animationId).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (e.status === 'blocked') expect(e.blockedReason, e.animationId).toBeTruthy();
    }
  });

  it('exceptions only reference animations that exist and carry a reason', () => {
    for (const [id, list] of Object.entries(QA_EXCEPTIONS)) {
      expect(ANIMATIONS.has(id), id).toBe(true);
      for (const e of list) expect(e.reason.length, `${id} ${e.key}`).toBeGreaterThan(20);
    }
  });

  it('no two exercises share (near-)identical motion unless declared with a visibly different element', () => {
    const anims = [...ANIMATIONS.values()];
    for (const pair of similarPairs(anims)) {
      const a = ANIMATIONS.get(pair.a)!;
      const b = ANIMATIONS.get(pair.b)!;
      const declared = a.sharedMotionWith?.id === b.id || b.sharedMotionWith?.id === a.id;
      expect(declared && visualSignature(a) !== visualSignature(b), `${pair.a} / ${pair.b}`).toBe(true);
    }
  });

  it('the five curl variants differ in motion (grip, path or view)', () => {
    const ids = ['barbell_curl', 'dumbbell_curl', 'hammer_curl', 'cable_biceps_curl', 'band_biceps_curl'];
    const sigs = ids.map((id) => motionSignature(ANIMATIONS.get(id)!));
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) expect(similarity(sigs[i]!, sigs[j]!), `${ids[i]} / ${ids[j]}`).toBeLessThan(SIMILARITY_LIMIT);
  });

  it('keeps speed through keyframes: no velocity stop mid-stroke in a lat pulldown', () => {
    const anim = ANIMATIONS.get('lat_pulldown')!;
    // The pull stroke passes its midpoint without stopping (the wrist is still moving there).
    const j = (t: number) => computeFrame(anim, t).joints.wristNear;
    const speed = (t: number) => Math.hypot(j(t + 0.002)[0] - j(t)[0], j(t + 0.002)[1] - j(t)[1]);
    expect(speed(0.2)).toBeGreaterThan(0.2);
  });
});

describe('shoulder rise (shrug)', () => {
  it('raises the shoulder joints and the held dumbbells while the head stays put', () => {
    const anim = ANIMATIONS.get('dumbbell_shrug')!;
    const down = computeFrame(anim, 0);
    const up = computeFrame(anim, 0.5);
    expect(down.joints.shoulderNear[1] - up.joints.shoulderNear[1]).toBeGreaterThan(5);
    expect(down.joints.handNear[1] - up.joints.handNear[1]).toBeGreaterThan(5);
    expect(Math.abs(down.head.c[1] - up.head.c[1])).toBeLessThan(0.5);
  });
});

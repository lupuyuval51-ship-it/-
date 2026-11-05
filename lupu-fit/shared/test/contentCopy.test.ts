import { describe, expect, it } from 'vitest';
import { FINISHERS, READY_WORKOUTS } from '../src/content/index.js';
import { TIERS } from '../src/content/workoutGenerator.js';

// The finisher card already shows the "general physical preparation, not sport-skill training" note
// (workouts.detail.finisherNote), so the content must not repeat it in every description.
describe('finisher copy', () => {
  it('does not repeat the UI disclaimer inside descriptions', () => {
    for (const f of FINISHERS) {
      expect(f.descriptionHe, f.id).not.toMatch(/הכנה גופנית כללית/);
      expect(f.descriptionEn, f.id).not.toMatch(/general (physical )?preparation/i);
    }
  });

  it('uses the same Hebrew terms as the sport labels and exercise names', () => {
    const he = FINISHERS.map((f) => `${f.nameHe} ${f.descriptionHe}`).join('\n');
    for (const bad of ['קליסתניקס', 'אגרוף', 'סקווט גביע', 'גב החזה', 'גב חזה', 'רוטציה', 'סקילים', 'הכתפיים בריאות']) {
      expect(he, bad).not.toContain(bad);
    }
  });
});

describe('ready workout tier labels', () => {
  it('name equipment with the same words as the equipment filter', () => {
    for (const t of TIERS) {
      expect(t.labelHe, t.id).not.toMatch(/בנץ׳|מתחים/);
    }
    expect(READY_WORKOUTS.some((w) => w.nameHe.includes('בנץ׳') || w.nameHe.includes('מתחים'))).toBe(false);
  });
});

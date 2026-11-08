/**
 * Library-level checks for the curated content: every episode validates, the
 * library covers the hard-constraint space, branches really diverge, and the
 * matching engine never violates a constraint across all preference combos.
 */
import { describe, expect, it } from 'vitest';
import { LIBRARY } from '../src/content/library.ts';
import { matchAdventures } from '../src/engine/matching.ts';
import { validateAdventure, fitsPrefs } from '../shared/validate.ts';
import { enumeratePaths } from '../shared/graph.ts';
import { screenAdventure } from '../server/safety.ts';
import { BUDGET_OPTIONS, COMPANY_OPTIONS, KINDS, MINUTES_OPTIONS, MOOD_OPTIONS, SETTING_OPTIONS, WEIRDNESS_OPTIONS } from '../shared/constants.ts';
import type { Prefs } from '../shared/types.ts';

describe('curated library', () => {
  it('has at least 12 adventures with unique ids and titles', () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(12);
    expect(new Set(LIBRARY.map((a) => a.id)).size).toBe(LIBRARY.length);
    expect(new Set(LIBRARY.map((a) => a.title.toLowerCase())).size).toBe(LIBRARY.length);
  });

  it.each(LIBRARY.map((a) => [a.id, a] as const))('%s is valid, curated and passes the safety screen', (_id, adv) => {
    const r = validateAdventure(adv);
    expect(r.errors).toEqual([]);
    expect(adv.source).toBe('curated');
    expect(screenAdventure(adv)).toEqual([]);
  });

  it('serves the chosen audience: most episodes work solo', () => {
    const solo = LIBRARY.filter((a) => a.company.includes('solo')).length;
    expect(solo / LIBRARY.length).toBeGreaterThanOrEqual(0.75);
  });

  it('covers a useful range of settings, budgets, durations, moods, weirdness and kinds', () => {
    for (const s of SETTING_OPTIONS) expect(LIBRARY.filter((a) => a.settings.includes(s)).length).toBeGreaterThanOrEqual(5);
    for (const m of MOOD_OPTIONS) expect(LIBRARY.filter((a) => a.moods.includes(m)).length).toBeGreaterThanOrEqual(3);
    for (const w of WEIRDNESS_OPTIONS) expect(LIBRARY.filter((a) => a.weirdness === w).length).toBeGreaterThanOrEqual(3);
    expect(new Set(LIBRARY.map((a) => a.kind)).size).toBeGreaterThanOrEqual(5);
    expect(LIBRARY.some((a) => a.cost.max > 30)).toBe(true); // something that uses a ₪100 budget
    expect(LIBRARY.some((a) => a.cost.max > 0 && a.cost.max <= 30)).toBe(true);
    expect(LIBRARY.some((a) => a.minutes > 60)).toBe(true);
    expect(LIBRARY.filter((a) => a.minutes <= 15).length).toBeGreaterThanOrEqual(4);
    expect(KINDS.length).toBeGreaterThan(0);
  });

  it('every first choice leads to different later content and different endings', () => {
    for (const adv of LIBRARY) {
      const paths = enumeratePaths(adv);
      const first = adv.nodes.find((n) => n.id === adv.start)!;
      expect(first.choice, `${adv.id} should branch after stage 1`).toBeTruthy();
      const byOption = new Map<string, Set<string>>();
      for (const p of paths) {
        const opt = p.choices.find((c) => c.nodeId === first.id)?.optionId ?? '';
        const set = byOption.get(opt) ?? new Set<string>();
        set.add(p.ending.id);
        byOption.set(opt, set);
        // stage-2 content differs per option
      }
      const stage2 = first.choice!.options.map((o) => adv.nodes.find((n) => n.id === o.next)!);
      expect(new Set(stage2.map((n) => n.action)).size, adv.id).toBe(stage2.length);
      const endingSets = [...byOption.values()].map((s) => [...s].sort().join('|'));
      expect(new Set(endingSets).size, `${adv.id}: options must reach different endings`).toBe(endingSets.length);
    }
  });

  it('always has at least three envelopes for every solo combination and two for groups', () => {
    for (const setting of SETTING_OPTIONS) {
      for (const company of COMPANY_OPTIONS) {
        // The tightest combo: 15 minutes, free. Every looser combo is a superset.
        const prefs: Prefs = { minutes: 15, budget: 0, setting, company, mood: 'curious', weirdness: 2 };
        const valid = LIBRARY.filter((a) => fitsPrefs(a, prefs)).length;
        expect(valid, `${setting}/${company}`).toBeGreaterThanOrEqual(company === 'solo' ? 3 : 2);
      }
    }
  });
});

describe('matching over the real library', () => {
  it('never violates a hard constraint, for every preference combination', () => {
    let combos = 0;
    for (const minutes of MINUTES_OPTIONS)
      for (const budget of BUDGET_OPTIONS)
        for (const setting of SETTING_OPTIONS)
          for (const company of COMPANY_OPTIONS)
            for (const mood of MOOD_OPTIONS)
              for (const weirdness of WEIRDNESS_OPTIONS) {
                const prefs: Prefs = { minutes, budget, setting, company, mood, weirdness };
                const r = matchAdventures(LIBRARY, prefs, { count: 3, seed: combos });
                for (const pick of r.picks) expect(fitsPrefs(pick.adventure, prefs)).toBe(true);
                expect(r.picks.length).toBeGreaterThanOrEqual(Math.min(3, r.validCount));
                expect(new Set(r.picks.map((p) => p.adventure.id)).size).toBe(r.picks.length);
                combos++;
              }
    expect(combos).toBe(4 * 3 * 2 * 2 * 4 * 3);
  });

  it('ranks mood and weirdness matches first when constraints allow', () => {
    const prefs: Prefs = { minutes: 120, budget: 100, setting: 'outside', company: 'solo', mood: 'creative', weirdness: 3 };
    const top = matchAdventures(LIBRARY, prefs, { count: 1, seed: 1 }).picks[0].adventure;
    expect(top.moods).toContain('creative');
  });

  it('avoids immediately repeating the most recent episode when alternatives exist', () => {
    const prefs: Prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };
    const first = matchAdventures(LIBRARY, prefs, { count: 1, seed: 3 }).picks[0].adventure;
    const again = matchAdventures(LIBRARY, prefs, { count: 3, seed: 3, history: [{ adventureId: first.id, completedAt: Date.now() }] });
    expect(again.picks.map((p) => p.adventure.id)).not.toContain(first.id);
  });
});

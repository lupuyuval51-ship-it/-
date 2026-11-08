import { describe, expect, it } from 'vitest';
import { LEVEL_THRESHOLDS, TRAITS, TRAIT_TITLES } from '../shared/constants.ts';
import type { Adventure } from '../shared/types.ts';
import exemplar from '../src/content/adventures/undercover-tourist.ts';
import { addTraits, computeAward, emptyTraits, levelFor, seriesStats, totalTraits } from '../src/engine/progression.ts';
import type { CompletedEpisode, PathStepSummary } from '../src/engine/types.ts';

const observe = [{ nodeId: 'arrive', optionId: 'observe' }];
const legend = [{ nodeId: 'arrive', optionId: 'legend' }];

function episode(id: string, overrides: Partial<CompletedEpisode> = {}): CompletedEpisode {
  const award = computeAward(exemplar, observe, 'quiet-detective');
  const step = (usedAlternative: boolean, stage: 1 | 2 | 3): PathStepSummary => ({
    stage,
    nodeId: `n${stage}`,
    title: 'Stage',
    action: 'Do the thing',
    usedAlternative,
  });
  return {
    id,
    episodeNumber: 1,
    adventureId: exemplar.id,
    source: 'curated',
    title: exemplar.title,
    tagline: exemplar.tagline,
    kind: exemplar.kind,
    palette: exemplar.palette,
    motif: exemplar.motif,
    weirdness: exemplar.weirdness,
    minutesEstimate: exemplar.minutes,
    prefs: { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 },
    startedAt: 0,
    completedAt: 1,
    elapsedMs: 25 * 60_000,
    steps: [step(false, 1), step(true, 2), step(false, 3)],
    endingId: 'quiet-detective',
    endingTitle: 'The Quiet Detective',
    twist: 'Plot twist.',
    closingLine: 'Closing.',
    notes: {},
    award,
    journal: '',
    posterSeed: 1,
    ...overrides,
  };
}

describe('computeAward', () => {
  it('adds base, choice and ending traits for the observational branch', () => {
    const award = computeAward(exemplar, observe, 'quiet-detective');
    expect(award.points).toEqual({ curiosity: 4, creativity: 0, boldness: 1, connection: 0 });
    expect(award.lines).toEqual([
      { trait: 'curiosity', points: 2, source: 'episode', label: 'Completed the episode' },
      { trait: 'boldness', points: 1, source: 'episode', label: 'Completed the episode' },
      { trait: 'curiosity', points: 1, source: 'choice', label: 'Chose: Follow the details' },
      { trait: 'curiosity', points: 1, source: 'ending', label: 'Ending: The Quiet Detective' },
    ]);
  });

  it('awards the creative branch differently', () => {
    const award = computeAward(exemplar, legend, 'unofficial-historian');
    expect(award.points).toEqual({ curiosity: 2, creativity: 2, boldness: 2, connection: 0 });
    expect(award.lines.map((l) => l.label)).toEqual([
      'Completed the episode',
      'Completed the episode',
      'Chose: Invent the legend',
      'Ending: The Unofficial Historian',
      'Ending: The Unofficial Historian',
    ]);
  });

  it('keeps the points equal to the sum of the lines', () => {
    const award = computeAward(exemplar, legend, 'unofficial-historian');
    const fromLines = emptyTraits();
    for (const line of award.lines) fromLines[line.trait] += line.points;
    expect(award.points).toEqual(fromLines);
  });

  it('ignores unknown nodes, options and endings', () => {
    const award = computeAward(exemplar, [{ nodeId: 'nowhere', optionId: 'x' }, { nodeId: 'arrive', optionId: 'nope' }], 'missing');
    expect(award.points).toEqual({ curiosity: 2, creativity: 0, boldness: 1, connection: 0 });
    expect(award.lines.every((l) => l.source === 'episode')).toBe(true);
  });

  it('skips zero-point traits and handles options or endings without traits', () => {
    const adv: Adventure = structuredClone(exemplar);
    adv.traits = { curiosity: 1, connection: 0 };
    delete adv.nodes[0].choice!.options[0].traits;
    delete adv.endings[0].traits;
    const award = computeAward(adv, observe, 'quiet-detective');
    expect(award.lines).toEqual([{ trait: 'curiosity', points: 1, source: 'episode', label: 'Completed the episode' }]);
    expect(award.points).toEqual({ curiosity: 1, creativity: 0, boldness: 0, connection: 0 });
  });
});

describe('trait arithmetic', () => {
  it('starts from zero for every trait', () => {
    expect(emptyTraits()).toEqual({ curiosity: 0, creativity: 0, boldness: 0, connection: 0 });
    expect(emptyTraits()).not.toBe(emptyTraits());
  });

  it('adds partial boosts without mutating either side', () => {
    const a = Object.freeze({ curiosity: 1, creativity: 2, boldness: 3, connection: 4 });
    const b = Object.freeze({ boldness: 2 });
    expect(addTraits(a, b)).toEqual({ curiosity: 1, creativity: 2, boldness: 5, connection: 4 });
    expect(addTraits(a, {})).toEqual(a);
    expect(addTraits(a, { curiosity: Number.NaN })).toEqual(a);
  });

  it('totals awards across the collection', () => {
    const first = episode('a');
    const second = episode('b', { award: computeAward(exemplar, legend, 'unofficial-historian') });
    expect(totalTraits([first, second])).toEqual({ curiosity: 6, creativity: 2, boldness: 3, connection: 0 });
    expect(totalTraits([])).toEqual(emptyTraits());
  });
});

describe('levelFor', () => {
  it('starts at level 1 with the first title', () => {
    expect(levelFor('curiosity', 0)).toEqual({
      trait: 'curiosity',
      points: 0,
      level: 1,
      title: 'Noticer',
      floor: 0,
      next: 4,
      progress: 0,
    });
  });

  it('levels up exactly at each threshold', () => {
    for (const trait of TRAITS) {
      LEVEL_THRESHOLDS.forEach((threshold, i) => {
        const at = levelFor(trait, threshold);
        expect(at.level).toBe(i + 1);
        expect(at.title).toBe(TRAIT_TITLES[trait][i]);
        expect(at.floor).toBe(threshold);
        if (i > 0) expect(levelFor(trait, threshold - 1).level).toBe(i);
      });
    }
  });

  it('reports progress toward the next level', () => {
    const l = levelFor('creativity', 7);
    expect(l).toMatchObject({ level: 2, title: 'Tinkerer', floor: 4, next: 10 });
    expect(l.progress).toBeCloseTo(0.5);
  });

  it('caps at the top level', () => {
    const top = levelFor('boldness', 1000);
    expect(top).toMatchObject({ level: LEVEL_THRESHOLDS.length, title: 'Myth', floor: 40, next: null, progress: 1 });
    expect(levelFor('connection', 40)).toMatchObject({ level: 6, title: 'Lighthouse', next: null, progress: 1 });
  });

  it('treats negative or non-finite points as zero', () => {
    expect(levelFor('curiosity', -5)).toMatchObject({ points: 0, level: 1, progress: 0 });
    expect(levelFor('curiosity', Number.NaN)).toMatchObject({ points: 0, level: 1 });
  });
});

describe('seriesStats', () => {
  it('counts episodes, rounded minutes, distinct endings and alternates', () => {
    const stats = seriesStats([
      episode('a', { elapsedMs: 20 * 60_000 + 20_000 }),
      episode('b', { elapsedMs: 10 * 60_000 + 15_000 }), // same ending as a
      episode('c', { endingId: 'unofficial-historian', elapsedMs: 0, steps: [] }),
      // Ending ids repeat across adventures (AI episodes all use end-a / end-b): they are distinct endings.
      episode('d', { adventureId: 'ai-one', endingId: 'end-a', elapsedMs: 60_000 }),
      episode('e', { adventureId: 'ai-two', endingId: 'end-a', elapsedMs: 60_000 }),
    ]);
    expect(stats).toEqual({ episodes: 5, minutes: 33, endings: 4, alternates: 4 });
  });

  it('is all zeros for an empty collection', () => {
    expect(seriesStats([])).toEqual({ episodes: 0, minutes: 0, endings: 0, alternates: 0 });
  });
});

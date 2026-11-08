import { describe, expect, it } from 'vitest';
import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  KINDS,
  MINUTES_OPTIONS,
  MOOD_OPTIONS,
  SETTING_OPTIONS,
  WEIRDNESS_OPTIONS,
} from '../shared/constants.ts';
import type { Adventure, Company, Kind, Mood, Prefs, Setting, Weirdness } from '../shared/types.ts';
import { fitsPrefs, validateAdventure } from '../shared/validate.ts';
import exemplar from '../src/content/adventures/undercover-tourist.ts';
import {
  RECENT_WINDOW_MS,
  SCORE_WEIGHTS,
  describeConflict,
  filterValid,
  matchAdventures,
  scoreAdventure,
  suggestRelaxations,
} from '../src/engine/matching.ts';
import { mulberry32, pick, shuffle } from '../src/engine/random.ts';
import type { HistoryEntry, MatchResult, Relaxation } from '../src/engine/types.ts';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 10, 8, 12);
/** Longest path through the exemplar: 8 + 12 + 8 stage minutes. */
const EXEMPLAR_PATH_MINUTES = 28;

const PREFS: Prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };

interface VariantSpec {
  minutes?: number;
  costMax?: number;
  settings?: Setting[];
  company?: Company[];
  moods?: Mood[];
  weirdness?: Weirdness;
  kind?: Kind;
}

/** A clone of the exemplar with different matching attributes — still a valid adventure. */
function variant(id: string, spec: VariantSpec = {}): Adventure {
  const adv = structuredClone(exemplar);
  adv.id = id;
  if (spec.minutes !== undefined) {
    adv.minutes = spec.minutes;
    // Scale stage minutes so every path still fits the stated duration.
    for (const node of adv.nodes) node.minutes = Math.max(1, Math.floor((node.minutes * spec.minutes) / EXEMPLAR_PATH_MINUTES));
  }
  if (spec.costMax !== undefined) adv.cost = { min: 0, max: spec.costMax };
  if (spec.settings) adv.settings = [...spec.settings];
  if (spec.company) adv.company = [...spec.company];
  if (spec.moods) adv.moods = [...spec.moods];
  if (spec.weirdness) adv.weirdness = spec.weirdness;
  if (spec.kind) adv.kind = spec.kind;
  return adv;
}

/** A 30-minute, free, outside, solo-or-group, curious, weirdness-2 detective episode unless overridden. */
function base(id: string, spec: VariantSpec = {}): Adventure {
  return variant(id, {
    minutes: 30,
    costMax: 0,
    settings: ['outside'],
    company: ['solo', 'group'],
    moods: ['curious'],
    weirdness: 2,
    kind: 'detective',
    ...spec,
  });
}

const ids = (result: MatchResult) => result.picks.map((p) => p.adventure.id);
const seeds = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('fixtures', () => {
  it('are valid adventures, so the matcher is tested on realistic content', () => {
    const samples = [
      ...syntheticLibrary(3, 30),
      ...MINUTES_OPTIONS.map((minutes) => variant(`m-${minutes}`, { minutes })),
      base('base'),
    ];
    for (const adv of samples) expect(validateAdventure(adv).errors).toEqual([]);
  });
});

describe('filterValid', () => {
  it('applies every hard constraint, inclusive at the limits', () => {
    const lib = [
      base('fits'),
      base('too-long', { minutes: 45 }),
      base('too-pricey', { costMax: 10 }),
      base('indoors', { settings: ['home'] }),
      base('crew-only', { company: ['group'] }),
    ];
    expect(filterValid(lib, PREFS).map((a) => a.id)).toEqual(['fits']);
    expect(filterValid(lib, { ...PREFS, minutes: 60, budget: 30 }).map((a) => a.id)).toEqual(['fits', 'too-long', 'too-pricey']);
    expect(filterValid([base('exact', { minutes: 30, costMax: 30 })], { ...PREFS, budget: 30 })).toHaveLength(1);
  });
});

describe('scoreAdventure', () => {
  it('explains a strong match', () => {
    const { reasons } = scoreAdventure(exemplar, PREFS);
    expect(reasons).toContain('matches your curious mood');
    expect(reasons).toContain('the weirdness you asked for (Surprise me)');
    expect(reasons).toContain('fills your 30 min');
  });

  it('ranks primary mood above secondary above none', () => {
    const primary = scoreAdventure(base('a', { moods: ['curious', 'social'] }), PREFS).score;
    const secondary = scoreAdventure(base('b', { moods: ['social', 'curious'] }), PREFS).score;
    const none = scoreAdventure(base('c', { moods: ['social'] }), PREFS).score;
    expect(primary).toBeGreaterThan(secondary);
    expect(secondary).toBeGreaterThan(none);
    expect(scoreAdventure(base('b', { moods: ['social', 'curious'] }), PREFS).reasons).toContain('also suits your curious mood');
  });

  it('rewards weirdness proximity', () => {
    const prefs = { ...PREFS, weirdness: 1 as const };
    const exact = scoreAdventure(base('a', { weirdness: 1 }), prefs).score;
    const near = scoreAdventure(base('b', { weirdness: 2 }), prefs).score;
    const far = scoreAdventure(base('c', { weirdness: 3 }), prefs).score;
    expect(exact).toBeGreaterThan(near);
    expect(near).toBeGreaterThan(far);
  });

  it('prefers episodes that use more of the available time', () => {
    const prefs = { ...PREFS, minutes: 60 as const };
    for (const seed of seeds(20)) {
      const full = scoreAdventure(base('full', { minutes: 60 }), prefs, { seed }).score;
      const half = scoreAdventure(base('half', { minutes: 30 }), prefs, { seed }).score;
      expect(full).toBeGreaterThan(half);
    }
  });

  it('gives a small bonus only when a paid budget is actually used', () => {
    const paidPrefs = { ...PREFS, budget: 30 as const };
    const paid = scoreAdventure(base('paid', { costMax: 25 }), paidPrefs);
    const free = scoreAdventure(base('free', { costMax: 0 }), paidPrefs);
    expect(paid.score).toBeGreaterThan(free.score);
    expect(paid.reasons).toContain('puts your ₪30 to use');
    expect(free.reasons.some((r) => r.includes('₪'))).toBe(false);
  });

  it('gives a small bonus to episodes designed only for the chosen company', () => {
    const soloOnly = scoreAdventure(base('solo-only', { company: ['solo'] }), PREFS);
    const either = scoreAdventure(base('either', { company: ['solo', 'group'] }), PREFS);
    expect(soloOnly.score).toBeGreaterThan(either.score);
    expect(soloOnly.reasons).toContain('made for solo play');
    const crew = scoreAdventure(base('crew', { company: ['group'] }), { ...PREFS, company: 'group' });
    expect(crew.reasons).toContain('made for groups');
  });

  it('keeps the seeded jitter small and reproducible', () => {
    const a = base('twin-a');
    const b = base('twin-b');
    for (const seed of seeds(50)) {
      const sa = scoreAdventure(a, PREFS, { seed }).score;
      expect(scoreAdventure(a, PREFS, { seed }).score).toBe(sa);
      expect(Math.abs(sa - scoreAdventure(b, PREFS, { seed }).score)).toBeLessThan(SCORE_WEIGHTS.jitter);
    }
  });

  it('penalizes recent completions far more than old ones', () => {
    const adv = base('fav');
    const fresh = scoreAdventure(adv, PREFS, { now: NOW }).score;
    const history = (completedAt: number, others = 0): HistoryEntry[] => [
      { adventureId: 'fav', completedAt },
      ...Array.from({ length: others }, (_, i) => ({ adventureId: `other-${i}`, completedAt: completedAt + (i + 1) * HOUR })),
    ];
    const recent = scoreAdventure(adv, PREFS, { now: NOW, history: history(NOW - 2 * DAY) });
    const lastFewButOld = scoreAdventure(adv, PREFS, { now: NOW, history: history(NOW - 30 * DAY, 2) }).score;
    const old = scoreAdventure(adv, PREFS, { now: NOW, history: history(NOW - 30 * DAY, 3) });
    expect(recent.score).toBeCloseTo(fresh - SCORE_WEIGHTS.recentPenalty);
    expect(recent.reasons).toContain('you played this recently');
    expect(lastFewButOld).toBeCloseTo(fresh - SCORE_WEIGHTS.recentPenalty);
    expect(old.score).toBeCloseTo(fresh - SCORE_WEIGHTS.playedBeforePenalty);
    expect(old.reasons).toContain('you have played this before');
  });
});

describe('matchAdventures', () => {
  it('returns up to `count` picks, three by default', () => {
    const lib = KINDS.map((kind, i) => base(`k-${i}`, { kind }));
    expect(matchAdventures(lib, PREFS).picks).toHaveLength(3);
    expect(matchAdventures(lib, PREFS, { count: 1 }).picks).toHaveLength(1);
    expect(matchAdventures(lib, PREFS, { count: 10 }).picks).toHaveLength(lib.length);
    expect(matchAdventures(lib, PREFS, { count: 0 }).picks).toEqual([]);
    expect(matchAdventures(lib, PREFS).validCount).toBe(lib.length);
  });

  it('ranks mood matches first whatever the seed', () => {
    const lib = [
      base('none', { moods: ['social'], kind: 'maker' }),
      base('second', { moods: ['social', 'curious'], kind: 'wanderer' }),
      base('primary', { moods: ['curious', 'social'], kind: 'game' }),
    ];
    for (const seed of seeds(50)) expect(ids(matchAdventures(lib, PREFS, { seed }))).toEqual(['primary', 'second', 'none']);
  });

  it('ranks weirdness matches first whatever the seed', () => {
    const prefs = { ...PREFS, weirdness: 3 as const };
    const lib = [
      base('chill', { weirdness: 1, kind: 'ritual' }),
      base('bold', { weirdness: 3, kind: 'social' }),
      base('middle', { weirdness: 2, kind: 'maker' }),
    ];
    for (const seed of seeds(50)) expect(ids(matchAdventures(lib, prefs, { seed }))).toEqual(['bold', 'middle', 'chill']);
  });

  it('lets different seeds reorder near-ties, reproducibly', () => {
    const lib = KINDS.map((kind, i) => base(`twin-${i}`, { kind }));
    const winners = new Set(seeds(40).map((seed) => matchAdventures(lib, PREFS, { seed, count: 1 }).picks[0].adventure.id));
    expect(winners.size).toBeGreaterThan(1);
    expect(matchAdventures(lib, PREFS, { seed: 7 })).toEqual(matchAdventures(lib, PREFS, { seed: 7 }));
  });

  it('never picks excluded ids, but still counts them as valid', () => {
    const lib = [base('best', { moods: ['curious'] }), base('ok', { moods: ['social', 'curious'], kind: 'maker' })];
    for (const seed of seeds(20)) {
      const result = matchAdventures(lib, PREFS, { seed, exclude: ['best'] });
      expect(ids(result)).toEqual(['ok']);
      expect(result.validCount).toBe(2);
    }
    const allShown = matchAdventures(lib, PREFS, { exclude: ['best', 'ok'] });
    expect(allShown.picks).toEqual([]);
    expect(allShown.conflict).toBeNull();
  });

  it('draws a fresh set on reshuffle when enough episodes exist', () => {
    const lib = Array.from({ length: 9 }, (_, i) => base(`ep-${i}`, { kind: KINDS[i % KINDS.length] }));
    const first = ids(matchAdventures(lib, PREFS, { seed: 1 }));
    const second = ids(matchAdventures(lib, PREFS, { seed: 2, exclude: first }));
    expect(second).toHaveLength(3);
    expect(second.filter((id) => first.includes(id))).toEqual([]);
  });

  it('diversifies by kind when an alternative exists', () => {
    const lib = [
      base('det-a', { kind: 'detective' }),
      base('det-b', { kind: 'detective' }),
      base('maker', { kind: 'maker', moods: ['social', 'curious'] }),
    ];
    for (const seed of seeds(30)) {
      const picks = matchAdventures(lib, PREFS, { seed, count: 2 }).picks;
      expect(picks.map((p) => p.adventure.kind)).toEqual(['detective', 'maker']);
    }
    // Without an alternative, repeating a kind is fine.
    expect(matchAdventures(lib.slice(0, 2), PREFS, { count: 2 }).picks).toHaveLength(2);
  });

  it('softly avoids repeating the primary mood, without overriding a clearly better match', () => {
    const lead = base('lead', { kind: 'detective', moods: ['curious'] });
    const sameMood = base('same-mood', { kind: 'maker', moods: ['curious'], weirdness: 1 });
    const otherMood = base('other-mood', { kind: 'wanderer', moods: ['social', 'curious'] });
    const strong = base('strong', { kind: 'game', moods: ['curious'] });
    for (const seed of seeds(30)) {
      expect(ids(matchAdventures([lead, sameMood, otherMood], PREFS, { seed, count: 2 }))).toEqual(['lead', 'other-mood']);
      // `strong` ties with `lead` (jitter decides the order); both beat the softer other-mood match.
      expect(ids(matchAdventures([lead, strong, otherMood], PREFS, { seed, count: 2 })).sort()).toEqual(['lead', 'strong']);
    }
  });

  it('reports picks in non-increasing score order', () => {
    const lib = syntheticLibrary(9, 40);
    for (const seed of seeds(10)) {
      const picks = matchAdventures(lib, { ...PREFS, minutes: 120, budget: 100 }, { seed, count: 6 }).picks;
      for (let i = 1; i < picks.length; i++) expect(picks[i].score).toBeLessThanOrEqual(picks[i - 1].score);
    }
  });

  it('avoids the most recent completion when alternatives exist', () => {
    const fav = base('fav');
    const other = base('other', { moods: ['social'], kind: 'maker' });
    const history: HistoryEntry[] = [{ adventureId: 'fav', completedAt: NOW - HOUR }];
    for (const seed of seeds(20)) {
      expect(ids(matchAdventures([fav, other], PREFS, { seed, history, now: NOW, count: 1 }))).toEqual(['other']);
    }
  });

  it('still offers the most recent completion when it is the only valid one', () => {
    const fav = base('fav');
    const history: HistoryEntry[] = [{ adventureId: 'fav', completedAt: NOW - HOUR }];
    expect(ids(matchAdventures([fav], PREFS, { history, now: NOW, count: 1 }))).toEqual(['fav']);
    // …or when the draw would otherwise come up short (it goes last).
    const other = base('other', { moods: ['social'], kind: 'maker' });
    expect(ids(matchAdventures([fav, other], PREFS, { history, now: NOW, count: 3 }))).toEqual(['other', 'fav']);
    expect(ids(matchAdventures([fav, other], PREFS, { history, now: NOW, exclude: ['other'], count: 1 }))).toEqual(['fav']);
  });

  it('pushes recently played episodes below unplayed alternatives', () => {
    const fav = base('fav');
    const plain = base('plain', { moods: ['social', 'curious'], kind: 'maker' });
    const history: HistoryEntry[] = [
      { adventureId: 'elsewhere', completedAt: NOW - HOUR }, // most recent, not in this library
      { adventureId: 'fav', completedAt: NOW - 2 * DAY },
    ];
    for (const seed of seeds(20)) {
      expect(ids(matchAdventures([fav, plain], PREFS, { seed, history, now: NOW }))).toEqual(['plain', 'fav']);
    }
    // Long ago, and not among the last three: only a mild penalty, so the better match wins again.
    const longAgo: HistoryEntry[] = [
      { adventureId: 'fav', completedAt: NOW - RECENT_WINDOW_MS - DAY },
      { adventureId: 'x', completedAt: NOW - 3 * HOUR },
      { adventureId: 'y', completedAt: NOW - 2 * HOUR },
      { adventureId: 'z', completedAt: NOW - HOUR },
    ];
    for (const seed of seeds(20)) {
      expect(ids(matchAdventures([fav, plain], PREFS, { seed, history: longAgo, now: NOW }))).toEqual(['fav', 'plain']);
    }
  });

  it('never returns the same adventure twice, even if the library repeats an id', () => {
    const lib = [base('dup'), base('dup'), base('solo-one', { kind: 'maker' })];
    expect(ids(matchAdventures(lib, PREFS))).toEqual(expect.arrayContaining(['dup', 'solo-one']));
    expect(matchAdventures(lib, PREFS).picks).toHaveLength(2);
  });

  it('returns the conflict explanation when nothing fits', () => {
    const lib = [base('indoors', { settings: ['home'] })];
    const result = matchAdventures(lib, PREFS);
    expect(result.picks).toEqual([]);
    expect(result.validCount).toBe(0);
    expect(result.conflict).toEqual(describeConflict(lib, PREFS));
    expect(matchAdventures([base('ok')], PREFS).conflict).toBeNull();
  });
});

describe('conflicts and relaxations', () => {
  const clash: Prefs = { minutes: 15, budget: 0, setting: 'outside', company: 'group', mood: 'curious', weirdness: 2 };
  const clashLibrary = [
    variant('longer', { minutes: 30, costMax: 0, settings: ['outside'], company: ['group'] }),
    variant('indoors-1', { minutes: 15, costMax: 0, settings: ['home'], company: ['group'] }),
    variant('indoors-2', { minutes: 15, costMax: 0, settings: ['home'], company: ['solo', 'group'] }),
    variant('solo', { minutes: 15, costMax: 0, settings: ['outside'], company: ['solo'] }),
    variant('paid', { minutes: 15, costMax: 30, settings: ['outside'], company: ['group'] }),
    variant('nope', { minutes: 120, costMax: 100, settings: ['home'], company: ['solo'] }),
  ];

  it('explains which constraints clash and lists single fixes sorted by gain', () => {
    const { reason, relaxations } = describeConflict(clashLibrary, clash);
    expect(reason).toBe('Nothing fits 15 minutes, outside, with others on a ₪0 budget.');
    expect(relaxations).toEqual<Relaxation[]>([
      { constraint: 'setting', value: 'home', label: 'Stay in', gain: 2 },
      { constraint: 'minutes', value: 30, label: 'Give it 30 min', gain: 1 },
      { constraint: 'budget', value: 30, label: 'Allow up to ₪30', gain: 1 },
      { constraint: 'company', value: 'solo', label: 'Go solo', gain: 1 },
    ]);
  });

  it('names only the constraint that is actually impossible', () => {
    const lib = [variant('a', { minutes: 30, settings: ['outside'], company: ['group'] }), variant('b', { minutes: 60 })];
    const { reason, relaxations } = describeConflict(lib, clash);
    expect(reason).toBe('Nothing fits 15 minutes.');
    expect(relaxations).toEqual([{ constraint: 'minutes', value: 30, label: 'Give it 30 min', gain: 1 }]);
  });

  it.each<[string, VariantSpec[], Partial<Prefs>, string]>([
    ['budget', [{ minutes: 15, costMax: 30, settings: ['outside'], company: ['group'] }], {}, 'Nothing fits a ₪0 budget.'],
    ['setting', [{ minutes: 15, costMax: 0, settings: ['outside'], company: ['group'] }], { setting: 'home' }, 'Nothing fits at home.'],
    ['company (group)', [{ minutes: 15, costMax: 0, settings: ['outside'], company: ['solo'] }], {}, 'Nothing fits a group.'],
    ['company (solo)', [{ minutes: 15, costMax: 0, settings: ['outside'], company: ['group'] }], { company: 'solo' }, 'Nothing fits solo play.'],
    ['setting + budget', [{ minutes: 15, costMax: 30, settings: ['outside'], company: ['group'] }, { minutes: 15, costMax: 0, settings: ['home'], company: ['group'] }], {}, 'Nothing fits outside on a ₪0 budget.'],
  ])('phrases a %s clash in plain words', (_name, specs, overrides, expected) => {
    const lib = specs.map((spec, i) => variant(`v-${i}`, spec));
    expect(describeConflict(lib, { ...clash, ...overrides }).reason).toBe(expected);
  });

  it('names every constraint involved even when no single change helps', () => {
    const lib = [
      variant('paid-crew', { minutes: 30, costMax: 30, settings: ['outside'], company: ['group'] }),
      variant('free-solo', { minutes: 30, costMax: 0, settings: ['outside'], company: ['solo'] }),
      variant('paid-solo', { minutes: 60, costMax: 30, settings: ['outside'], company: ['solo'] }),
    ];
    const { reason, relaxations } = describeConflict(lib, clash);
    expect(reason).toBe('Nothing fits 15 minutes, with others on a ₪0 budget.');
    expect(relaxations).toEqual([]);
  });

  it('relaxes minutes and budget to the smallest larger option that helps', () => {
    const lib = [variant('hour', { minutes: 60, costMax: 0, settings: ['outside'], company: ['group'] })];
    expect(suggestRelaxations(lib, clash)).toEqual([{ constraint: 'minutes', value: 60, label: 'Make it 1 hour', gain: 1 }]);
    const pricey = [variant('pricey', { minutes: 15, costMax: 80, settings: ['outside'], company: ['group'] })];
    expect(suggestRelaxations(pricey, clash)).toEqual([{ constraint: 'budget', value: 100, label: 'Allow up to ₪100', gain: 1 }]);
  });

  it('uses the remaining labels for the other directions', () => {
    const prefs: Prefs = { minutes: 60, budget: 30, setting: 'home', company: 'solo', mood: 'creative', weirdness: 1 };
    const lib = [
      variant('long', { minutes: 120, costMax: 30, settings: ['home'], company: ['solo'] }),
      variant('out', { minutes: 60, costMax: 30, settings: ['outside'], company: ['solo'] }),
      variant('crew', { minutes: 60, costMax: 30, settings: ['home'], company: ['group'] }),
      variant('dear', { minutes: 60, costMax: 100, settings: ['home'], company: ['solo'] }),
    ];
    expect(suggestRelaxations(lib, prefs).map((r) => r.label)).toEqual(['Make it 2 hours', 'Allow up to ₪100', 'Head outside', 'Bring others']);
  });

  it('handles an empty library and non-conflicting prefs', () => {
    expect(describeConflict([], clash)).toEqual({ reason: 'There are no episodes to choose from yet.', relaxations: [] });
    expect(matchAdventures([], clash).conflict?.reason).toBe('There are no episodes to choose from yet.');
    const fits = [variant('fits', { minutes: 15, costMax: 0, settings: ['outside'], company: ['group'] })];
    expect(describeConflict(fits, clash).reason).toBe('');
  });
});

// ── property-style: every hard-constraint combination ────────────────

function syntheticLibrary(seed: number, size: number): Adventure[] {
  const rng = mulberry32(seed);
  const settings: Setting[][] = [['home'], ['outside'], ['home', 'outside']];
  const company: Company[][] = [['solo'], ['group'], ['solo', 'group']];
  return Array.from({ length: size }, (_, i) =>
    variant(`syn-${seed}-${i}`, {
      minutes: pick(rng, [15, 20, 30, 45, 60, 90, 120]),
      costMax: pick(rng, [0, 0, 0, 10, 30, 60, 100]),
      settings: pick(rng, settings),
      company: pick(rng, company),
      moods: shuffle(rng, MOOD_OPTIONS).slice(0, 1 + Math.floor(rng() * 3)),
      weirdness: pick(rng, WEIRDNESS_OPTIONS),
      kind: pick(rng, KINDS),
    }),
  );
}

const HARD_COMBOS = MINUTES_OPTIONS.flatMap((minutes) =>
  BUDGET_OPTIONS.flatMap((budget) =>
    SETTING_OPTIONS.flatMap((setting) => COMPANY_OPTIONS.map((company) => ({ minutes, budget, setting, company }))),
  ),
);

const RELAXATION_LABELS = [
  'Give it 30 min',
  'Make it 1 hour',
  'Make it 2 hours',
  'Allow up to ₪30',
  'Allow up to ₪100',
  'Stay in',
  'Head outside',
  'Go solo',
  'Bring others',
];

/** How each constraint shows up in a conflict reason. */
const REASON_MENTIONS: Record<Relaxation['constraint'], RegExp> = {
  minutes: /\d+ minutes|1 hour|2 hours/,
  budget: /₪\d+ budget/,
  setting: /at home|outside/,
  company: /solo|with others|a group/,
};

const relax = (prefs: Prefs, r: Pick<Relaxation, 'constraint' | 'value'>): Prefs => ({ ...prefs, [r.constraint]: r.value });

function expectSoundConflict(lib: readonly Adventure[], prefs: Prefs, result: MatchResult) {
  expect(result.conflict).not.toBeNull();
  const { reason, relaxations } = result.conflict ?? { reason: '', relaxations: [] };
  expect(reason).toMatch(/^Nothing fits .+\.$/);
  const gains = relaxations.map((r) => r.gain);
  expect(gains).toEqual([...gains].sort((a, b) => b - a));
  for (const r of relaxations) {
    expect(r.gain).toBeGreaterThan(0);
    expect(RELAXATION_LABELS).toContain(r.label);
    expect(filterValid(lib, relax(prefs, r))).toHaveLength(r.gain);
    // A constraint whose change produces matches is part of every clash, so it must be named.
    expect(reason).toMatch(REASON_MENTIONS[r.constraint]);
  }
  // Completeness: any helpful flip or larger option is offered (the smallest one for ordered constraints).
  const flips: Array<Pick<Relaxation, 'constraint' | 'value'>> = [
    { constraint: 'setting', value: prefs.setting === 'home' ? 'outside' : 'home' },
    { constraint: 'company', value: prefs.company === 'solo' ? 'group' : 'solo' },
  ];
  for (const flip of flips) {
    const helps = filterValid(lib, relax(prefs, flip)).length > 0;
    expect(relaxations.some((r) => r.constraint === flip.constraint)).toBe(helps);
  }
  const smallestHelpful = (constraint: 'minutes' | 'budget', options: readonly number[], current: number) =>
    options.filter((v) => v > current).find((value) => filterValid(lib, relax(prefs, { constraint, value })).length > 0);
  expect(relaxations.find((r) => r.constraint === 'minutes')?.value).toBe(smallestHelpful('minutes', MINUTES_OPTIONS, prefs.minutes));
  expect(relaxations.find((r) => r.constraint === 'budget')?.value).toBe(smallestHelpful('budget', BUDGET_OPTIONS, prefs.budget));
}

function expectSound(lib: readonly Adventure[], prefs: Prefs, result: MatchResult, exclude: readonly string[], count: number) {
  const valid = lib.filter((a) => fitsPrefs(a, prefs));
  expect(result.validCount).toBe(valid.length);
  const picked = ids(result);
  expect(new Set(picked).size).toBe(picked.length);
  for (const p of result.picks) {
    expect(fitsPrefs(p.adventure, prefs)).toBe(true);
    expect(exclude).not.toContain(p.adventure.id);
  }
  const available = valid.filter((a) => !exclude.includes(a.id)).length;
  expect(result.picks).toHaveLength(Math.min(count, available));
  if (valid.length === 0) expectSoundConflict(lib, prefs, result);
  else expect(result.conflict).toBeNull();
}

describe('matching properties', () => {
  it('covers all 4×3×2×2 hard-constraint combinations', () => {
    expect(HARD_COMBOS).toHaveLength(48);
  });

  it('never violates a hard constraint, for any combination, mood, weirdness, history or exclusion', () => {
    let conflicts = 0;
    let draws = 0;
    for (const [libSeed, size] of [
      [1, 4],
      [2, 10],
      [3, 30],
      [4, 60],
    ]) {
      const lib = syntheticLibrary(libSeed, size);
      HARD_COMBOS.forEach((hard, i) => {
        for (const mood of MOOD_OPTIONS) {
          for (const weirdness of WEIRDNESS_OPTIONS) {
            const rng = mulberry32(libSeed * 10_000 + i * 100 + weirdness * 10 + MOOD_OPTIONS.indexOf(mood));
            const prefs: Prefs = { ...hard, mood, weirdness };
            const history = Array.from({ length: Math.floor(rng() * 4) }, () => ({
              adventureId: pick(rng, lib).id,
              completedAt: NOW - Math.floor(rng() * 30 * DAY),
            }));
            const exclude = rng() < 0.3 ? [pick(rng, lib).id] : [];
            const count = 1 + Math.floor(rng() * 4);
            const result = matchAdventures(lib, prefs, { seed: i, history, exclude, count, now: NOW });
            expectSound(lib, prefs, result, exclude, count);
            if (result.validCount === 0) conflicts++;
            else draws++;
          }
        }
      });
    }
    // The sweep must exercise both outcomes to mean anything.
    expect(conflicts).toBeGreaterThan(50);
    expect(draws).toBeGreaterThan(50);
  });
});

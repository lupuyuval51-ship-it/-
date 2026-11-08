/**
 * Envelope matching: hard-constraint filtering, ranking, recency avoidance,
 * kind diversity and — when nothing fits — a plain-words conflict with
 * single-constraint fixes.
 */
import { BUDGET_OPTIONS, MINUTES_LABEL, MINUTES_OPTIONS, WEIRDNESS_LABEL } from '../../shared/constants.ts';
import { fitsPrefs } from '../../shared/validate.ts';
import type { Adventure, Company, Kind, Minutes, Mood, Prefs, Setting } from '../../shared/types.ts';
import { hashSeed } from './random.ts';
import type { HistoryEntry, MatchOptions, MatchResult, Relaxation, RelaxableConstraint, ScoredAdventure } from './types.ts';

/**
 * Ranking weights. Mood dominates, weirdness is next; time fit, budget use and
 * company design break ties among good matches; jitter only reorders near-ties.
 */
export const SCORE_WEIGHTS = {
  /** By the position of the user's mood in `adventure.moods` (strongest first). */
  moodByPosition: [30, 18, 10],
  /** By |adventure.weirdness − prefs.weirdness|. */
  weirdnessByDistance: [20, 8, 0],
  /** × adventure.minutes / prefs.minutes (0..1). */
  timeFit: 12,
  /** A paid budget is chosen and the episode actually spends some of it. */
  budgetUse: 4,
  /** The episode supports only the chosen company (made for solo play / for groups). */
  companyDesign: 4,
  /** Max seeded jitter. */
  jitter: 3,
  /** One of the last RECENT_COMPLETIONS distinct episodes, or completed within RECENT_WINDOW_MS. */
  recentPenalty: 50,
  /** Played before, but not recently. */
  playedBeforePenalty: 6,
  /** Per already-picked envelope of the same kind. */
  kindRepeatPenalty: 25,
  /** Per already-picked envelope with the same primary mood. */
  moodRepeatPenalty: 6,
} as const;

export const RECENT_COMPLETIONS = 3;
export const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_COUNT = 3;
const W = SCORE_WEIGHTS;

const MOOD_PHRASE: Record<Mood, string> = {
  curious: 'curious mood',
  creative: 'creative mood',
  social: 'social mood',
  change: 'appetite for a change',
};

/** Mirrors `fitsPrefs` one constraint at a time — only used to explain conflicts. */
const CONSTRAINT_FITS: Record<RelaxableConstraint, (adv: Adventure, prefs: Prefs) => boolean> = {
  minutes: (adv, prefs) => adv.minutes <= prefs.minutes,
  budget: (adv, prefs) => adv.cost.max <= prefs.budget,
  setting: (adv, prefs) => adv.settings.includes(prefs.setting),
  company: (adv, prefs) => adv.company.includes(prefs.company),
};
const CONSTRAINTS: readonly RelaxableConstraint[] = ['minutes', 'budget', 'setting', 'company'];

// ── filtering & scoring ──────────────────────────────────────────────

export function filterValid(library: readonly Adventure[], prefs: Prefs): Adventure[] {
  return library.filter((adv) => fitsPrefs(adv, prefs));
}

interface Recency {
  /** 0 = the most recently completed distinct adventure. */
  rank: number;
  completedAt: number;
}

interface ScoringContext {
  prefs: Prefs;
  seed: number;
  now: number;
  recency: Map<string, Recency>;
  mostRecentId: string | null;
}

function buildRecency(history: readonly HistoryEntry[]): Map<string, Recency> {
  const newestFirst = history.filter((h) => Number.isFinite(h.completedAt)).sort((a, b) => b.completedAt - a.completedAt);
  const recency = new Map<string, Recency>();
  for (const h of newestFirst) {
    if (!recency.has(h.adventureId)) recency.set(h.adventureId, { rank: recency.size, completedAt: h.completedAt });
  }
  return recency;
}

function buildContext(prefs: Prefs, opts: MatchOptions): ScoringContext {
  const recency = buildRecency(opts.history ?? []);
  const [mostRecentId = null] = recency.keys();
  return { prefs, seed: opts.seed ?? 0, now: opts.now ?? Date.now(), recency, mostRecentId };
}

function isRecent(seen: Recency, now: number): boolean {
  return seen.rank < RECENT_COMPLETIONS || now - seen.completedAt < RECENT_WINDOW_MS;
}

function scoreInContext(adv: Adventure, ctx: ScoringContext): ScoredAdventure {
  const { prefs } = ctx;
  const reasons: string[] = [];
  let score = 0;

  const moodIndex = adv.moods.indexOf(prefs.mood);
  if (moodIndex >= 0) {
    score += W.moodByPosition[Math.min(moodIndex, W.moodByPosition.length - 1)];
    reasons.push(`${moodIndex === 0 ? 'matches' : 'also suits'} your ${MOOD_PHRASE[prefs.mood]}`);
  }

  const distance = Math.min(Math.abs(adv.weirdness - prefs.weirdness), W.weirdnessByDistance.length - 1);
  score += W.weirdnessByDistance[distance];
  if (distance === 0) reasons.push(`the weirdness you asked for (${WEIRDNESS_LABEL[prefs.weirdness]})`);
  else if (distance === 1) reasons.push('close to the weirdness you asked for');

  const fill = adv.minutes <= prefs.minutes ? adv.minutes / prefs.minutes : 0;
  score += W.timeFit * fill;
  if (fill >= 0.75) reasons.push(`fills your ${MINUTES_LABEL[prefs.minutes]}`);

  if (prefs.budget > 0 && adv.cost.max > 0 && adv.cost.max <= prefs.budget) {
    score += W.budgetUse;
    reasons.push(`puts your ₪${prefs.budget} to use`);
  }

  if (adv.company.length === 1 && adv.company[0] === prefs.company) {
    score += W.companyDesign;
    reasons.push(prefs.company === 'solo' ? 'made for solo play' : 'made for groups');
  }

  score += W.jitter * (hashSeed(ctx.seed, adv.id) / 4294967296);

  const seen = ctx.recency.get(adv.id);
  if (seen && isRecent(seen, ctx.now)) {
    score -= W.recentPenalty;
    reasons.push('you played this recently');
  } else if (seen) {
    score -= W.playedBeforePenalty;
    reasons.push('you have played this before');
  }

  return { adventure: adv, score, reasons };
}

/** Ranking score for one adventure (hard constraints are not checked here — see `filterValid`). */
export function scoreAdventure(adv: Adventure, prefs: Prefs, opts: MatchOptions = {}): ScoredAdventure {
  return scoreInContext(adv, buildContext(prefs, opts));
}

// ── picking ──────────────────────────────────────────────────────────

function normalizeCount(count: number | undefined): number {
  return typeof count === 'number' && !Number.isNaN(count) ? Math.max(0, Math.floor(count)) : DEFAULT_COUNT;
}

function uniqueById(adventures: readonly Adventure[]): Adventure[] {
  const seen = new Set<string>();
  const out: Adventure[] = [];
  for (const adv of adventures) {
    if (seen.has(adv.id)) continue;
    seen.add(adv.id);
    out.push(adv);
  }
  return out;
}

/** Never offer the episode just played, unless the draw would otherwise come up short. */
function avoidMostRecent(candidates: Adventure[], mostRecentId: string | null, count: number): Adventure[] {
  if (mostRecentId === null) return candidates;
  const others = candidates.filter((a) => a.id !== mostRecentId);
  return others.length >= count ? others : candidates;
}

/**
 * Greedy by score, penalizing kinds (and, softer, primary moods) already picked.
 * Each pick's `score` is the adjusted score it was chosen with, so picks are
 * in non-increasing score order.
 */
function pickDiverse(scored: readonly ScoredAdventure[], count: number): ScoredAdventure[] {
  const remaining = [...scored];
  const picks: ScoredAdventure[] = [];
  const kinds = new Map<Kind, number>();
  const moods = new Map<Mood, number>();
  const adjusted = (s: ScoredAdventure) =>
    s.score -
    W.kindRepeatPenalty * (kinds.get(s.adventure.kind) ?? 0) -
    W.moodRepeatPenalty * (moods.get(s.adventure.moods[0]) ?? 0);

  while (picks.length < count && remaining.length > 0) {
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      const diff = adjusted(remaining[i]) - adjusted(remaining[best]);
      if (diff > 0 || (diff === 0 && remaining[i].adventure.id < remaining[best].adventure.id)) best = i;
    }
    const [chosen] = remaining.splice(best, 1);
    picks.push({ ...chosen, score: adjusted(chosen) });
    kinds.set(chosen.adventure.kind, (kinds.get(chosen.adventure.kind) ?? 0) + 1);
    moods.set(chosen.adventure.moods[0], (moods.get(chosen.adventure.moods[0]) ?? 0) + 1);
  }
  return picks;
}

export function matchAdventures(library: readonly Adventure[], prefs: Prefs, opts: MatchOptions = {}): MatchResult {
  const valid = filterValid(library, prefs);
  if (valid.length === 0) return { picks: [], validCount: 0, conflict: describeConflict(library, prefs) };

  const ctx = buildContext(prefs, opts);
  const count = normalizeCount(opts.count);
  const excluded = new Set(opts.exclude ?? []);
  const candidates = avoidMostRecent(uniqueById(valid.filter((a) => !excluded.has(a.id))), ctx.mostRecentId, count);
  const picks = pickDiverse(candidates.map((a) => scoreInContext(a, ctx)), count);
  return { picks, validCount: valid.length, conflict: null };
}

// ── conflicts & relaxations ──────────────────────────────────────────

function minutesLabel(minutes: Minutes): string {
  return minutes < 60 ? `Give it ${MINUTES_LABEL[minutes]}` : `Make it ${MINUTES_LABEL[minutes]}`;
}

const SETTING_RELAX_LABEL: Record<Setting, string> = { home: 'Stay in', outside: 'Head outside' };
const COMPANY_RELAX_LABEL: Record<Company, string> = { solo: 'Go solo', group: 'Bring others' };

/**
 * Single-constraint changes that would make more adventures valid, best gain
 * first. Minutes and budget move to the smallest larger option that helps;
 * setting and company flip.
 */
export function suggestRelaxations(library: readonly Adventure[], prefs: Prefs): Relaxation[] {
  const baseline = filterValid(library, prefs).length;
  const gainWith = (changed: Prefs) => filterValid(library, changed).length - baseline;
  const out: Relaxation[] = [];

  for (const minutes of MINUTES_OPTIONS.filter((m) => m > prefs.minutes)) {
    const gain = gainWith({ ...prefs, minutes });
    if (gain > 0) {
      out.push({ constraint: 'minutes', value: minutes, label: minutesLabel(minutes), gain });
      break;
    }
  }
  for (const budget of BUDGET_OPTIONS.filter((b) => b > prefs.budget)) {
    const gain = gainWith({ ...prefs, budget });
    if (gain > 0) {
      out.push({ constraint: 'budget', value: budget, label: `Allow up to ₪${budget}`, gain });
      break;
    }
  }
  const setting: Setting = prefs.setting === 'home' ? 'outside' : 'home';
  const settingGain = gainWith({ ...prefs, setting });
  if (settingGain > 0) out.push({ constraint: 'setting', value: setting, label: SETTING_RELAX_LABEL[setting], gain: settingGain });

  const company: Company = prefs.company === 'solo' ? 'group' : 'solo';
  const companyGain = gainWith({ ...prefs, company });
  if (companyGain > 0) out.push({ constraint: 'company', value: company, label: COMPANY_RELAX_LABEL[company], gain: companyGain });

  // Stable sort: ties keep the minutes → budget → setting → company order.
  return out.sort((a, b) => b.gain - a.gain);
}

/** Every subset of the hard constraints, smallest first. */
const CONSTRAINT_SUBSETS: readonly RelaxableConstraint[][] = Array.from({ length: 1 << CONSTRAINTS.length }, (_, mask) =>
  CONSTRAINTS.filter((_, i) => (mask & (1 << i)) !== 0),
).sort((a, b) => a.length - b.length);

/**
 * The constraints that take part in a clash: the union of every minimal set of
 * the user's constraints that no adventure satisfies together. Naming only
 * these tells people what actually needs to give.
 */
function clashingConstraints(library: readonly Adventure[], prefs: Prefs): RelaxableConstraint[] {
  const minimal: RelaxableConstraint[][] = [];
  for (const subset of CONSTRAINT_SUBSETS) {
    if (minimal.some((m) => m.every((c) => subset.includes(c)))) continue;
    const satisfiable = library.some((adv) => subset.every((c) => CONSTRAINT_FITS[c](adv, prefs)));
    if (!satisfiable) minimal.push(subset);
  }
  return CONSTRAINTS.filter((c) => minimal.some((m) => m.includes(c)));
}

function minutesPhrase(minutes: Minutes): string {
  if (minutes < 60) return `${minutes} minutes`;
  return minutes === 60 ? '1 hour' : `${minutes / 60} hours`;
}

/** e.g. "15 minutes, outside, with others on a ₪0 budget". */
function describeConstraints(prefs: Prefs, constraints: readonly RelaxableConstraint[]): string {
  const parts: string[] = [];
  if (constraints.includes('minutes')) parts.push(minutesPhrase(prefs.minutes));
  if (constraints.includes('setting')) parts.push(prefs.setting === 'home' ? 'at home' : 'outside');
  if (constraints.includes('company')) {
    const alone = parts.length === 0;
    if (prefs.company === 'solo') parts.push(alone ? 'solo play' : 'solo');
    else parts.push(alone ? 'a group' : 'with others');
  }
  const list = parts.join(', ');
  if (!constraints.includes('budget')) return list;
  const budget = `a ₪${prefs.budget} budget`;
  return list ? `${list} on ${budget}` : budget;
}

/**
 * Why nothing fits, plus the single-constraint fixes. `reason` is '' when some
 * adventure does fit (relaxations then only list ways to get more options).
 */
export function describeConflict(library: readonly Adventure[], prefs: Prefs): { reason: string; relaxations: Relaxation[] } {
  const relaxations = suggestRelaxations(library, prefs);
  if (library.length === 0) return { reason: 'There are no episodes to choose from yet.', relaxations };
  const clashing = clashingConstraints(library, prefs);
  const reason = clashing.length === 0 ? '' : `Nothing fits ${describeConstraints(prefs, clashing)}.`;
  return { reason, relaxations };
}

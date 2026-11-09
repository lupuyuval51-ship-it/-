/**
 * Dealing curated envelopes for a draw (pure; no React).
 */
import { matchAdventures } from '../engine/matching.ts';
import type { MatchResult, ScoredAdventure } from '../engine/types.ts';
import type { Adventure, Prefs } from '../../shared/types.ts';
import type { Draw } from './types.ts';

export function samePrefs(a: Prefs, b: Prefs): boolean {
  return (
    a.minutes === b.minutes &&
    a.budget === b.budget &&
    a.setting === b.setting &&
    a.company === b.company &&
    a.mood === b.mood &&
    a.weirdness === b.weirdness
  );
}

/**
 * Curated picks for a draw. Unseen episodes come first; when fewer than
 * `count` are left, the unseen ones are kept and the rest is topped up —
 * preferring episodes that were not on the previous table — and a new cycle
 * starts from what is dealt now.
 */
export function dealCurated(
  library: readonly Adventure[],
  prefs: Prefs,
  opts: { history: { adventureId: string; completedAt: number }[]; previous: Draw | null; count: number; seed: number },
): { match: MatchResult; picks: ScoredAdventure[]; shownIds: string[] } {
  const { history, previous, count, seed } = opts;
  const shown = previous && samePrefs(previous.prefs, prefs) ? previous.shownIds : [];
  const match = matchAdventures(library, prefs, { history, exclude: shown, count, seed });
  if (match.picks.length >= count || shown.length === 0) {
    return { match, picks: match.picks, shownIds: Array.from(new Set([...shown, ...match.picks.map((p) => p.adventure.id)])) };
  }
  const picks = [...match.picks];
  const ids = () => picks.map((p) => p.adventure.id);
  const lastTable = previous ? previous.envelopes.flatMap((e) => (e.source === 'curated' && e.adventure ? [e.adventure.id] : [])) : [];
  for (const exclude of [[...ids(), ...lastTable], ids()]) {
    if (picks.length >= count) break;
    const more = matchAdventures(library, prefs, { history, exclude: Array.from(new Set(exclude)), count: count - picks.length, seed: seed + 3 });
    picks.push(...more.picks);
  }
  return { match: { ...match, picks }, picks, shownIds: ids() };
}

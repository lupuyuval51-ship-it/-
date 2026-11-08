/**
 * Trait progression: what an episode awards, how points add up across the
 * series, and which level/title a trait has reached.
 */
import { LEVEL_THRESHOLDS, TRAITS, TRAIT_TITLES } from '../../shared/constants.ts';
import { getEnding, getNode } from '../../shared/graph.ts';
import type { Adventure, Trait, TraitBoost, TraitPoints } from '../../shared/types.ts';
import type { Award, AwardLine, CompletedEpisode, SeriesStats, TraitLevel } from './types.ts';

const MINUTE_MS = 60_000;

export function emptyTraits(): TraitPoints {
  return { curiosity: 0, creativity: 0, boldness: 0, connection: 0 };
}

const finiteOrZero = (value: number | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

/** Returns a new TraitPoints; missing or non-finite entries in `b` count as 0. */
export function addTraits(a: TraitPoints, b: Partial<TraitPoints>): TraitPoints {
  const out = emptyTraits();
  for (const trait of TRAITS) out[trait] = finiteOrZero(a[trait]) + finiteOrZero(b[trait]);
  return out;
}

/** One line per trait with points > 0, in canonical trait order. */
function boostLines(boost: TraitBoost | undefined, source: AwardLine['source'], label: string): AwardLine[] {
  if (!boost) return [];
  return TRAITS.flatMap((trait) => {
    const points = finiteOrZero(boost[trait]);
    return points > 0 ? [{ trait, points, source, label }] : [];
  });
}

/**
 * Award = the adventure's base traits ("Completed the episode")
 *       + each chosen option's traits ("Chose: <label>")
 *       + the ending's traits ("Ending: <title>").
 * Unknown nodes, options or endings contribute nothing.
 */
export function computeAward(adv: Adventure, choices: { nodeId: string; optionId: string }[], endingId: string): Award {
  const lines: AwardLine[] = boostLines(adv.traits, 'episode', 'Completed the episode');
  for (const { nodeId, optionId } of choices) {
    const option = getNode(adv, nodeId)?.choice?.options.find((o) => o.id === optionId);
    if (option) lines.push(...boostLines(option.traits, 'choice', `Chose: ${option.label}`));
  }
  const ending = getEnding(adv, endingId);
  if (ending) lines.push(...boostLines(ending.traits, 'ending', `Ending: ${ending.title}`));

  const points = emptyTraits();
  for (const line of lines) points[line.trait] += line.points;
  return { points, lines };
}

export function totalTraits(completed: readonly CompletedEpisode[]): TraitPoints {
  return completed.reduce((sum, ep) => addTraits(sum, ep.award.points), emptyTraits());
}

export function levelFor(trait: Trait, points: number): TraitLevel {
  const safePoints = Number.isFinite(points) ? Math.max(0, points) : 0;
  let index = 0;
  while (index + 1 < LEVEL_THRESHOLDS.length && safePoints >= LEVEL_THRESHOLDS[index + 1]) index++;
  const floor = LEVEL_THRESHOLDS[index];
  const next = index + 1 < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[index + 1] : null;
  const titles = TRAIT_TITLES[trait];
  return {
    trait,
    points: safePoints,
    level: index + 1,
    title: titles[Math.min(index, titles.length - 1)],
    floor,
    next,
    progress: next === null ? 1 : (safePoints - floor) / (next - floor),
  };
}

export function seriesStats(completed: readonly CompletedEpisode[]): SeriesStats {
  // Ending ids are only unique within an adventure (every AI episode has "end-a"/"end-b").
  const endings = new Set(completed.map((ep) => `${ep.adventureId}/${ep.endingId}`));
  const totalMs = completed.reduce((sum, ep) => sum + Math.max(0, finiteOrZero(ep.elapsedMs)), 0);
  const alternates = completed.reduce((sum, ep) => sum + ep.steps.filter((s) => s.usedAlternative).length, 0);
  return {
    episodes: completed.length,
    minutes: Math.round(totalMs / MINUTE_MS),
    endings: endings.size,
    alternates,
  };
}

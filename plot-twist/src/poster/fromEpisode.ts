import { cleanNote } from '../../shared/template.ts';
import type { Adventure } from '../../shared/types.ts';
import { getCuratedAdventure } from '../content/library.ts';
import type { CompletedEpisode, PathStepSummary } from '../engine/types.ts';
import type { PosterInput } from './types.ts';

const MAX_NOTES = 4;

/** Local calendar date, YYYY-MM-DD. */
export function localDateISO(ms: number): string {
  const d = new Date(Number.isFinite(ms) ? ms : 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Non-empty, cleaned, de-duplicated field notes in path order (steps first, then any others), ≤ 4. */
export function episodeNotes(ep: Pick<CompletedEpisode, 'steps' | 'notes'>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string | undefined) => {
    const note = cleanNote(raw);
    const key = note.toLowerCase();
    if (!note || seen.has(key) || out.length >= MAX_NOTES) return;
    seen.add(key);
    out.push(note);
  };
  for (const step of ep.steps ?? []) add(step.note);
  for (const value of Object.values(ep.notes ?? {})) add(value);
  return out;
}

/**
 * Index of the option taken at the first choice (0, 1, 2).
 *
 * The CompletedEpisode records the chosen label and the node played next, so
 * the index is recovered from the adventure: an explicit one, the curated
 * library, or the AI Director's fixed topology (stage-2 ids `s2-a` / `s2-b`).
 * Unknown → 0. Pure function of stable data, so re-renders never change.
 */
export function firstChoiceIndexOf(ep: Pick<CompletedEpisode, 'steps' | 'adventureId' | 'source'>, adventure?: Adventure | null): number {
  const steps: PathStepSummary[] = ep.steps ?? [];
  const at = steps.findIndex((s) => typeof s.choiceLabel === 'string' && s.choiceLabel.length > 0);
  if (at < 0) return 0;
  const step = steps[at];
  const nextNodeId = steps[at + 1]?.nodeId;

  const adv = adventure ?? (ep.source === 'curated' ? safeCurated(ep.adventureId) : undefined);
  const options = adv?.nodes.find((n) => n.id === step.nodeId)?.choice?.options;
  if (options?.length) {
    let idx = nextNodeId ? options.findIndex((o) => o.next === nextNodeId) : -1;
    if (idx < 0) idx = options.findIndex((o) => o.label === step.choiceLabel);
    if (idx >= 0) return Math.min(2, idx);
  }
  const ai = nextNodeId ? /^s2-([a-c])$/.exec(nextNodeId) : null;
  if (ai) return ai[1].charCodeAt(0) - 97;
  return 0;
}

function safeCurated(id: string): Adventure | undefined {
  try {
    return getCuratedAdventure(id);
  } catch {
    return undefined;
  }
}

/** Maps a finished episode (plus the user's series name) to everything the poster renderer needs. */
export function posterInputFromEpisode(ep: CompletedEpisode, seriesName: string | null, adventure?: Adventure | null): PosterInput {
  const series = (seriesName ?? '').replace(/\s+/g, ' ').trim();
  const input: PosterInput = {
    title: ep.title,
    episodeNumber: ep.episodeNumber,
    dateISO: localDateISO(ep.completedAt),
    seriesName: series || null,
    palette: ep.palette,
    motif: ep.motif,
    seed: ep.posterSeed >>> 0,
    // The user's chosen weirdness (the dial) shapes the poster, not just the episode's natural level.
    weirdness: ep.prefs?.weirdness ?? ep.weirdness,
    kind: ep.kind,
    endingTitle: ep.endingTitle,
    closingLine: ep.closingLine,
    notes: episodeNotes(ep),
    choiceLabels: (ep.steps ?? []).flatMap((s) => (s.choiceLabel ? [s.choiceLabel] : [])),
    firstChoiceIndex: firstChoiceIndexOf(ep, adventure),
    alternatesUsed: (ep.steps ?? []).filter((s) => s.usedAlternative).length,
    minutes: Math.max(1, Math.round((Number.isFinite(ep.elapsedMs) ? ep.elapsedMs : 0) / 60000)),
    source: ep.source,
  };
  if (ep.narrator) input.narrator = ep.narrator;
  return input;
}

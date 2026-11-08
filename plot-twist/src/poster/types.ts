import type { AdventureSource, Kind, Motif, PaletteName, Weirdness } from '../../shared/types.ts';

/** Everything the poster renderer needs. Built from a CompletedEpisode by `posterInputFromEpisode`. */
export interface PosterInput {
  title: string;
  episodeNumber: number;
  /** Completion date, YYYY-MM-DD (local). */
  dateISO: string;
  seriesName: string | null;
  palette: PaletteName;
  motif: Motif;
  /** Deterministic seed — same input, same poster. */
  seed: number;
  weirdness: Weirdness;
  kind: Kind;
  endingTitle: string;
  /** Rendered closing line (already includes the user's notes). */
  closingLine: string;
  /** User field notes (cleaned, ≤ 4), shown like evidence labels. */
  notes: string[];
  /** Labels of the branching choices made, in order. Influences composition. */
  choiceLabels: string[];
  /** Index of the option taken at the first choice (0, 1, 2) — influences composition. */
  firstChoiceIndex: number;
  /** How many stages used the alternative challenge. */
  alternatesUsed: number;
  /** Actual minutes spent (rounded, ≥ 1). */
  minutes: number;
  source: AdventureSource;
  narrator?: string;
}

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1620;

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'unsupported' | 'failed';

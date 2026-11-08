/**
 * Engine contracts (pure, framework-free). Implementations live next to this file:
 *   random.ts · matching.ts · progression.ts · run.ts
 */
import type {
  Adventure,
  AdventureSource,
  Company,
  Kind,
  Motif,
  PaletteName,
  Prefs,
  Setting,
  StageNode,
  Trait,
  TraitPoints,
  Weirdness,
} from '../../shared/types.ts';

// ── matching ──────────────────────────────────────────────────────────

export interface HistoryEntry {
  adventureId: string;
  completedAt: number;
}

export interface MatchOptions {
  /** Completed episodes, any order. Used to avoid immediate repeats. */
  history?: HistoryEntry[];
  /** Adventure ids that must not be picked (e.g. envelopes already shown in this draw). */
  exclude?: string[];
  /** How many envelopes to pick. Default 3. */
  count?: number;
  /** Seed for tie-breaking jitter, so a reshuffle produces a different but reproducible draw. */
  seed?: number;
  /** Clock for recency maths. Default Date.now(). */
  now?: number;
}

export interface ScoredAdventure {
  adventure: Adventure;
  score: number;
  /** Short human-readable reasons, e.g. "matches your curious mood" (for debugging / tooltips). */
  reasons: string[];
}

export type RelaxableConstraint = 'minutes' | 'budget' | 'setting' | 'company';

export interface Relaxation {
  constraint: RelaxableConstraint;
  /** The new value for that single constraint. */
  value: number | Setting | Company;
  /** Button copy, e.g. "Give it 30 min", "Allow up to ₪30", "Head outside", "Go solo". */
  label: string;
  /** How many more adventures become valid with this one change. */
  gain: number;
}

export interface MatchResult {
  /** Up to `count` picks, best first, diverse by kind where possible. */
  picks: ScoredAdventure[];
  /** Number of library adventures that satisfy all hard constraints. */
  validCount: number;
  /** Set when validCount === 0: why, plus single-constraint fixes. */
  conflict: null | { reason: string; relaxations: Relaxation[] };
}

// ── runs (an episode in progress) ────────────────────────────────────

export interface StepRecord {
  nodeId: string;
  stage: 1 | 2 | 3;
  usedAlternative: boolean;
  completedAt: number;
  /** Set when the node had a choice and the user picked an option. */
  optionId?: string;
}

export type RunPhase = 'action' | 'choice';

export interface Run {
  id: string;
  episodeNumber: number;
  /** Full snapshot — AI episodes exist nowhere else, and curated ones may change between deploys. */
  adventure: Adventure;
  prefs: Prefs;
  startedAt: number;
  /** Accumulated running time, excluding the current running segment. */
  elapsedMs: number;
  /** Start of the current running segment, or null while paused / finished. */
  runningSince: number | null;
  /** Last time the app was known to be open — used to handle long absences after a reload. */
  lastSeenAt: number;
  /** Current stage node id (the last one once finished). */
  nodeId: string;
  /** 'action' = doing the stage; 'choice' = action done, waiting for a branching decision. */
  phase: RunPhase;
  /** Whether the current stage shows the alternative challenge. */
  usingAlternative: boolean;
  steps: StepRecord[];
  /** Field notes by capture key. */
  notes: Record<string, string>;
  endingId: string | null;
  finishedAt: number | null;
}

export interface PathStepSummary {
  stage: 1 | 2 | 3;
  nodeId: string;
  title: string;
  /** The action text the user actually did (main or alternative), templates rendered. */
  action: string;
  usedAlternative: boolean;
  choicePrompt?: string;
  choiceLabel?: string;
  noteLabel?: string;
  note?: string;
}

// ── progression ──────────────────────────────────────────────────────

export interface AwardLine {
  trait: Trait;
  points: number;
  source: 'episode' | 'choice' | 'ending';
  /** e.g. "Completed the episode", "Chose: Invent the legend", "Ending: The Quiet Detective" */
  label: string;
}

export interface Award {
  points: TraitPoints;
  lines: AwardLine[];
}

export interface TraitLevel {
  trait: Trait;
  points: number;
  /** 1-based */
  level: number;
  title: string;
  /** Points at which the current level started. */
  floor: number;
  /** Points needed for the next level, or null at max level. */
  next: number | null;
  /** 0..1 progress from floor to next (1 at max level). */
  progress: number;
}

export interface CompletedEpisode {
  id: string;
  episodeNumber: number;
  adventureId: string;
  source: AdventureSource;
  title: string;
  tagline: string;
  kind: Kind;
  palette: PaletteName;
  motif: Motif;
  weirdness: Weirdness;
  narrator?: string;
  /** Estimated minutes from the adventure. */
  minutesEstimate: number;
  prefs: Prefs;
  startedAt: number;
  completedAt: number;
  /** Actual running time (paused time excluded). */
  elapsedMs: number;
  steps: PathStepSummary[];
  endingId: string;
  endingTitle: string;
  /** Rendered with the user's notes. */
  twist: string;
  closingLine: string;
  notes: Record<string, string>;
  award: Award;
  /** Optional one-sentence journal entry. */
  journal: string;
  posterSeed: number;
}

export interface SeriesStats {
  episodes: number;
  /** Total actual minutes adventured (rounded). */
  minutes: number;
  /** Distinct endings discovered. */
  endings: number;
  /** Stages where the user took the alternative challenge. */
  alternates: number;
}

export type { StageNode };

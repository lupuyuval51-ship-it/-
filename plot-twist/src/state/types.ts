import type { Adventure, AdventureSource, Prefs } from '../../shared/types.ts';
import type { CompletedEpisode, Run } from '../engine/types.ts';

export type EnvelopeStatus = 'ready' | 'writing' | 'failed';

export interface DrawEnvelope {
  /** 0, 1, 2 — position on screen */
  slot: number;
  status: EnvelopeStatus;
  source: AdventureSource;
  /** null while the AI Director is still writing (status 'writing'). */
  adventure: Adventure | null;
  opened: boolean;
  /** Optional short note shown on the envelope, e.g. "Written for you" or why it was swapped. */
  note?: string;
  /**
   * Names an AI envelope being written, so the tab writing it keeps at it when a re-deal with the
   * same scene (in any tab) carries it into the new draw.
   */
  genKey?: string;
}

export interface Draw {
  id: string;
  createdAt: number;
  prefs: Prefs;
  /** Seed used for the curated picks (reshuffles bump it). */
  seed: number;
  envelopes: DrawEnvelope[];
  /** Curated adventure ids shown so far in this session of reshuffles (avoid re-showing). */
  shownIds: string[];
  /** The optional detail the AI envelope was asked to use (kept for retries after a reload). */
  detail?: string;
}

export type MotionPreference = 'system' | 'reduce' | 'full';

/** Persisted sections that tabs merge one by one (completed episodes are a union). */
export const SECTIONS = ['prefs', 'draw', 'run', 'completed', 'series', 'settings'] as const;
export type Section = (typeof SECTIONS)[number];
/** When each section last changed in the tab that wrote it (ms since epoch). */
export type SectionStamps = Partial<Record<Section, number>>;

export interface PersistedState {
  version: 1;
  prefs: Prefs;
  draw: Draw | null;
  run: Run | null;
  completed: CompletedEpisode[];
  series: {
    name: string | null;
    /** True once the user has named the series or dismissed the prompt. */
    namePromptDone: boolean;
  };
  settings: {
    motion: MotionPreference;
  };
  updatedAt: number;
  /** Per-section change times, so concurrent edits in two tabs merge section by section. */
  stamps?: SectionStamps;
  /** Set by "Reset all": episodes and runs from before it never come back through a merge. */
  resetAt?: number;
}

export type LoadStatus = 'fresh' | 'loaded' | 'repaired' | 'reset-corrupt' | 'unavailable';

export interface LoadResult {
  state: PersistedState;
  status: LoadStatus;
  /** User-facing explanation when status is repaired / reset-corrupt / unavailable. */
  message?: string;
}

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'unknown' };

/** Minimal Storage subset so tests can inject a fake. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

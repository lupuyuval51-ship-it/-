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
}

export type MotionPreference = 'system' | 'reduce' | 'full';

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

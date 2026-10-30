/**
 * What the user last chose in the ready-workouts tab, kept on this device only, per signed-in user:
 * where they train, the gear they ticked (home and park), bodyweight or weights, and their sport.
 * Never the source of truth, never stored without a user id, and wiped on logout (shared devices).
 */
import { EQUIPMENT, LOCATIONS, SPORTS, TRAINING_MODES, type Equipment, type SportId, type TrainingLocation, type TrainingMode } from '@shared/constants';
import { storage } from '../../lib/storage';

export const READY_PREFS_PREFIX = 'fitai.ready.';

/** Places that ask which equipment the user has (the gym assumes everything). */
export type GearPlace = Exclude<TrainingLocation, 'gym'>;

export interface ReadyPrefs {
  /** `null` = not chosen yet (the profile's place is used). */
  location: TrainingLocation | null;
  /** Ticked equipment per place. A missing place uses the prefill (profile gear or the app default). */
  equipment: Partial<Record<GearPlace, Equipment[]>>;
  /** `null` = follow the default (weights at the gym, otherwise from the prefilled gear). */
  mode: TrainingMode | null;
  /** The sport asked for on the workout page, `null` = none. */
  sport: SportId | null;
}

export const EMPTY_READY_PREFS: ReadyPrefs = { location: null, equipment: {}, mode: null, sport: null };

interface StoredPrefs extends ReadyPrefs {
  v: 1;
}

export const readyPrefsKey = (userId: string) => `${READY_PREFS_PREFIX}${userId}`;

const pick = <T extends string>(list: readonly T[], value: unknown): T | null => list.find((x) => x === value) ?? null;

function cleanEquipment(value: unknown): Equipment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const valid = value.filter((x): x is Equipment => EQUIPMENT.some((q) => q === x));
  return Array.from(new Set(valid));
}

/** Whatever is in storage, reduced to valid values (a corrupted or old entry never breaks the tab). */
export function sanitizePrefs(raw: unknown): ReadyPrefs {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_READY_PREFS, equipment: {} };
  const r = raw as Record<string, unknown>;
  const eq = r.equipment && typeof r.equipment === 'object' ? (r.equipment as Record<string, unknown>) : {};
  const equipment: ReadyPrefs['equipment'] = {};
  const home = cleanEquipment(eq.home);
  const outdoor = cleanEquipment(eq.outdoor);
  if (home) equipment.home = home;
  if (outdoor) equipment.outdoor = outdoor;
  return {
    location: pick(LOCATIONS, r.location),
    equipment,
    mode: pick(TRAINING_MODES, r.mode),
    sport: pick(SPORTS, r.sport),
  };
}

export function readReadyPrefs(userId: string | null | undefined): ReadyPrefs {
  if (!userId) return { ...EMPTY_READY_PREFS, equipment: {} };
  return sanitizePrefs(storage.get<StoredPrefs>(readyPrefsKey(userId)));
}

/** Without a user id (signed out) nothing is stored. Returns false when nothing was written. */
export function writeReadyPrefs(userId: string | null | undefined, prefs: ReadyPrefs): boolean {
  if (!userId) return false;
  return storage.set(readyPrefsKey(userId), { v: 1, ...prefs } satisfies StoredPrefs);
}

/** Drops the ready-workout choices of every user on this device (logout). */
export function clearAllReadyPrefs(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(READY_PREFS_PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

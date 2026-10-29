import type { Locale, Theme, Units } from '../constants';
import type { ISODateTime } from './common';

/** Workout settings kept in the account (every field has a sensible default on the client). */
export interface WorkoutPrefsDTO {
  wakeLock: boolean;
  vibrate: boolean;
  autoAdvance: boolean;
  restSound: boolean;
}

export const DEFAULT_WORKOUT_PREFS: WorkoutPrefsDTO = { wakeLock: true, vibrate: true, autoAdvance: true, restSound: true };

export interface UserDTO {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  locale: Locale;
  theme: Theme;
  units: Units;
  timezone: string;
  onboardingCompleted: boolean;
  /** Null until the user changes one on some device. */
  workoutPrefs: WorkoutPrefsDTO | null;
  createdAt: ISODateTime;
}

export interface AuthResponse {
  user: UserDTO;
  csrfToken: string;
}

export interface MeResponse {
  user: UserDTO | null;
  csrfToken: string | null;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'ok' | 'error';
  version: string;
  ai: { configured: boolean; provider: string | null; model: string | null };
  time: ISODateTime;
}

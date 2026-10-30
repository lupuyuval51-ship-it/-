/**
 * Platform contract: what the app needs from where it runs (browser / installed web app, or the native
 * Android app). Web implementations live in ./web.ts; the Android app installs native ones at start-up
 * (`installPlatform` in ./index.ts). Features use only `platform` from ./index.ts, never Capacitor directly.
 */
import type { Locale } from '@shared/constants';
import type { ReminderSettings } from '@shared/types';

/** What happened to a file the app offered to save. */
export type SaveFileResult =
  /** Written (web: handed to the browser's download; Android: saved to the device). */
  | 'saved'
  /** Handed to the share sheet (Android: the person picked an app or location). */
  | 'shared'
  /** The person closed the dialog / share sheet without saving. */
  | 'cancelled';

export type NotificationPermission = 'granted' | 'denied' | 'prompt';

export interface ReminderSyncContext {
  locale: Locale;
  /** The user's local date, YYYY-MM-DD. */
  today: string;
  /** A workout was finished today (or one started today is still open): today's workout reminder is not needed. */
  workoutDoneToday: boolean;
  /** Meal times (HH:MM from the settings) already covered by a logged meal today. */
  loggedMealTimes: string[];
  /** IANA time zone the times and `today` are in (the account's). Default: the phone's own time zone. */
  timeZone?: string;
}

export interface Reminders {
  /** Phone (local) notifications are available here. Web: false (the in-app reminders stay as they are). */
  supported(): boolean;
  permission(): Promise<NotificationPermission>;
  /** Asks for permission. Call only from a user action (a tap). */
  request(): Promise<NotificationPermission>;
  /** Schedules the reminders for the coming days from the settings (replaces earlier ones). */
  sync(settings: ReminderSettings, ctx: ReminderSyncContext): Promise<void>;
}

/** The end of a live-workout rest as a phone notification (the Android app; the web build uses its own). */
export interface RestAlarm {
  /**
   * Shows "Rest over" at `at` (epoch ms, this phone's clock) even when the app is in the background or the
   * screen is off; replaces an earlier one. Does nothing without notification permission (never asks).
   */
  schedule(at: number, texts: { title: string; body: string }): Promise<void>;
  /** Cancels it (rest skipped, changed or finished) and removes it from the notification shade. */
  cancel(): Promise<void>;
}

export interface Platform {
  /** Saves a file the app produced (backup, export). */
  saveFile(fileName: string, mime: string, data: string | Blob | Uint8Array): Promise<SaveFileResult>;
  reminders: Reminders;
  /**
   * Calls `listener` whenever the app comes back to the foreground (web: the tab becomes visible again;
   * Android: the app is resumed). Returns the unsubscribe function.
   */
  onResume(listener: () => void): () => void;
  restAlarm: RestAlarm;
  /**
   * Deletes the files the app wrote for saving (Android: the last backup/export handed to the share sheet,
   * kept in the app's cache folder). Web: nothing to delete (downloads belong to the browser).
   */
  clearSavedFiles(): Promise<void>;
}

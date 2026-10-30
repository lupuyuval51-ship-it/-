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
  /** A workout was finished today: today's workout reminder is not needed. */
  workoutDoneToday: boolean;
  /** Meal times (HH:MM from the settings) already covered by a logged meal today. */
  loggedMealTimes: string[];
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

export interface Platform {
  /** Saves a file the app produced (backup, export). */
  saveFile(fileName: string, mime: string, data: string | Blob | Uint8Array): Promise<SaveFileResult>;
  reminders: Reminders;
}

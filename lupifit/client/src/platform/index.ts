/**
 * Where the app runs, and what that place can do (see ./types.ts).
 *
 * - `isDeviceMode`: the build where the server runs inside the app (`vite build --mode device`): no
 *   server, no database service, one hidden account, data only on this device. A build-time constant,
 *   so server-mode builds drop every device-only branch.
 * - `isNativeApp()`: running inside the Android app (Capacitor), not in a browser tab.
 * - `platform`: saving files, phone reminders and "the app came back" (`onResume`); web implementations
 *   unless the Android app installed its own (./native, loaded by features/device/start only inside the app).
 */
import { webPlatform } from './web';
import type { Platform } from './types';

export type { NotificationPermission, Platform, ReminderSyncContext, Reminders, SaveFileResult } from './types';

export const isDeviceMode: boolean = import.meta.env.MODE === 'device';

/**
 * The API is out of reach because this device has no network. Never in device mode: the server runs
 * inside the app, so saving works in airplane mode too (only the barcode lookup needs the internet).
 * Use this, not `navigator.onLine`, before deciding to queue or wait.
 */
export function apiOffline(): boolean {
  return !isDeviceMode && typeof navigator !== 'undefined' && navigator.onLine === false;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

export function isNativeApp(): boolean {
  const cap = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
  return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform() === true;
}

let current: Platform = webPlatform;

/** The platform in use. Read it at call time (the native app may install its own at start-up). */
export const platform: Platform = {
  saveFile: (fileName, mime, data) => current.saveFile(fileName, mime, data),
  reminders: {
    supported: () => current.reminders.supported(),
    permission: () => current.reminders.permission(),
    request: () => current.reminders.request(),
    sync: (settings, ctx) => current.reminders.sync(settings, ctx),
  },
  onResume: (listener) => current.onResume(listener),
};

/** The Android app calls this once at start-up with its native implementations (missing parts stay web). */
export function installPlatform(impl: Partial<Platform>): void {
  current = { ...current, ...impl, reminders: impl.reminders ?? current.reminders };
}

/** Tests: back to the web implementations. */
export function resetPlatform(): void {
  current = webPlatform;
}

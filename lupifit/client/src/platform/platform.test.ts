import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import type { ReminderSettings } from '@shared/types';
import { installPlatform, isDeviceMode, isNativeApp, platform, resetPlatform } from '.';
import { webPlatform } from './web';

/** jsdom's Blob has no text()/arrayBuffer(): read it the old way. */
function read(blob: Blob, as: 'text' | 'bytes'): Promise<string | Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(as === 'text' ? (reader.result as string) : new Uint8Array(reader.result as ArrayBuffer));
    if (as === 'text') reader.readAsText(blob);
    else reader.readAsArrayBuffer(blob);
  });
}

const SETTINGS: ReminderSettings = { enabled: true, workoutDays: [0, 2], workoutTime: '18:00', mealLogging: true, mealTimes: ['13:00'] };
const CTX = { locale: 'he' as const, today: '2026-10-30', workoutDoneToday: false, loggedMealTimes: [] };

afterEach(() => {
  resetPlatform();
  delete (globalThis as { Capacitor?: unknown }).Capacitor;
  vi.restoreAllMocks();
});

describe('where the app runs', () => {
  it('is not device mode in tests / server builds (a build-time constant)', () => {
    expect(isDeviceMode).toBe(false);
  });

  it('detects the native app only from Capacitor’s own answer', () => {
    expect(isNativeApp()).toBe(false);
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => false };
    expect(isNativeApp()).toBe(false);
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true };
    expect(isNativeApp()).toBe(true);
    (globalThis as { Capacitor?: unknown }).Capacitor = {};
    expect(isNativeApp()).toBe(false);
  });
});

describe('web platform', () => {
  it('saves a file as a download of an object URL, named as asked', async () => {
    const created: Blob[] = [];
    // jsdom has no object URLs.
    const url = URL as unknown as { createObjectURL?: unknown; revokeObjectURL?: unknown };
    const original = { create: url.createObjectURL, revoke: url.revokeObjectURL };
    url.createObjectURL = (b: Blob) => {
      created.push(b);
      return 'blob:test-1';
    };
    url.revokeObjectURL = () => undefined;
    onTestFinished(() => {
      url.createObjectURL = original.create;
      url.revokeObjectURL = original.revoke;
    });
    const clicks: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this);
    });
    await expect(platform.saveFile('lupufit-backup-2026-10-30.json', 'application/json', '{"a":1}')).resolves.toBe('saved');
    expect(clicks).toHaveLength(1);
    expect(clicks[0]!.download).toBe('lupufit-backup-2026-10-30.json');
    expect(clicks[0]!.href).toBe('blob:test-1');
    expect(clicks[0]!.isConnected).toBe(false); // removed again
    expect(created[0]!.type).toBe('application/json');
    expect(await read(created[0]!, 'text')).toBe('{"a":1}');
    await platform.saveFile('x.bin', 'application/octet-stream', new Uint8Array([1, 2, 3]));
    expect(await read(created[1]!, 'bytes')).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('has no phone reminders: the in-app reminders stay as they are', async () => {
    expect(platform.reminders.supported()).toBe(false);
    await expect(platform.reminders.permission()).resolves.toBe('denied');
    await expect(platform.reminders.request()).resolves.toBe('denied');
    await expect(platform.reminders.sync(SETTINGS, CTX)).resolves.toBeUndefined();
  });
});

describe('installPlatform', () => {
  it('lets the native app replace parts; the rest stays web', async () => {
    const sync = vi.fn(async () => undefined);
    installPlatform({ reminders: { supported: () => true, permission: async () => 'prompt', request: async () => 'granted', sync } });
    expect(platform.reminders.supported()).toBe(true);
    await expect(platform.reminders.request()).resolves.toBe('granted');
    await platform.reminders.sync(SETTINGS, CTX);
    expect(sync).toHaveBeenCalledWith(SETTINGS, CTX);
    installPlatform({ saveFile: async () => 'shared' });
    await expect(platform.saveFile('a', 'text/plain', 'x')).resolves.toBe('shared');
    expect(platform.reminders.supported()).toBe(true); // kept
    resetPlatform();
    expect(platform.reminders.supported()).toBe(webPlatform.reminders.supported());
  });
});

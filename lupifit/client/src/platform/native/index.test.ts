/**
 * The Android app's platform with every Capacitor plugin mocked: what gets installed and how the app
 * reacts to the back button, the app coming back, a tapped reminder and a theme change.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (data: never) => void;
const h = vi.hoisted(() => ({
  listeners: new Map<string, (data: unknown) => void>(),
  minimizeApp: vi.fn(async () => undefined),
  setStyle: vi.fn(async (_o: { style: string }) => undefined),
  checkPermissions: vi.fn(async () => ({ display: 'prompt' })),
  requestPermissions: vi.fn(async () => ({ display: 'granted' })),
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(async (event: string, fn: Listener) => {
      h.listeners.set(`app:${event}`, fn as (data: unknown) => void);
      return { remove: async () => undefined };
    }),
    minimizeApp: h.minimizeApp,
  },
}));
vi.mock('@capacitor/core', () => ({
  SystemBars: { setStyle: h.setStyle },
  SystemBarsStyle: { Dark: 'DARK', Light: 'LIGHT', Default: 'DEFAULT' },
}));
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { rmdir: vi.fn(async () => undefined), writeFile: vi.fn(async ({ path }: { path: string }) => ({ uri: `file:///cache/${path}` })) },
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}));
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn(async () => ({ activityType: 'x' })) } }));
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: h.checkPermissions,
    requestPermissions: h.requestPermissions,
    getPending: vi.fn(async () => ({ notifications: [] })),
    schedule: vi.fn(async () => ({ notifications: [] })),
    cancel: vi.fn(async () => undefined),
    getDeliveredNotifications: vi.fn(async () => ({ notifications: [] })),
    removeDeliveredNotifications: vi.fn(async () => undefined),
    createChannel: vi.fn(async () => undefined),
    addListener: vi.fn(async (event: string, fn: Listener) => {
      h.listeners.set(`ln:${event}`, fn as (data: unknown) => void);
      return { remove: async () => undefined };
    }),
  },
}));

const { platform, resetPlatform } = await import('../index');
const { installNativePlatform, reminderTexts, webViewMajor } = await import('./index');
const { Share } = await import('@capacitor/share');

const fire = (name: string, data: unknown = {}) => h.listeners.get(name)!(data);
const setUserAgent = (ua: string) => Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });

let navigate: ReturnType<typeof vi.fn>;
beforeEach(async () => {
  h.listeners.clear();
  vi.clearAllMocks();
  navigate = vi.fn();
  window.history.replaceState(null, '', '/');
  document.documentElement.dataset.theme = 'dark';
  setUserAgent('Mozilla/5.0 (Linux; Android 16; Pixel 7 Build/BP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/150.0.7000.0 Mobile Safari/537.36');
  await installNativePlatform({ navigate });
});
afterEach(() => {
  resetPlatform();
  document.body.innerHTML = '';
});

describe('installNativePlatform', () => {
  it('installs phone reminders and the share-sheet save', async () => {
    expect(platform.reminders.supported()).toBe(true);
    await expect(platform.reminders.permission()).resolves.toBe('prompt');
    expect(h.requestPermissions).not.toHaveBeenCalled(); // never on its own
    await expect(platform.reminders.request()).resolves.toBe('granted');
    await expect(platform.saveFile('backup.json', 'application/json', '{}')).resolves.toBe('shared');
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///cache/share/backup.json'] }));
  });

  it('tells resume listeners when the app comes back', () => {
    const listener = vi.fn();
    const off = platform.onResume(listener);
    fire('app:resume');
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    fire('app:resume');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('back button: leaves the app at the start page', () => {
    fire('app:backButton', { canGoBack: true });
    expect(h.minimizeApp).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('back button: goes back inside the app, or home without history', () => {
    window.history.replaceState(null, '', '/nutrition/log');
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    fire('app:backButton', { canGoBack: true });
    expect(back).toHaveBeenCalled();
    fire('app:backButton', { canGoBack: false });
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
    expect(h.minimizeApp).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it('back button: closes an open dialog first', () => {
    window.history.replaceState(null, '', '/profile');
    document.body.innerHTML = '<dialog open></dialog>';
    const dialog = document.querySelector('dialog')!;
    dialog.close = vi.fn(() => dialog.removeAttribute('open'));
    fire('app:backButton', { canGoBack: true });
    expect(dialog.close).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(h.minimizeApp).not.toHaveBeenCalled();
  });

  it('a tapped reminder opens its page; anything else is ignored', () => {
    fire('ln:localNotificationActionPerformed', { actionId: 'tap', notification: { id: 1, extra: { lupufit: 'reminder', path: '/nutrition/log' } } });
    expect(navigate).toHaveBeenCalledWith('/nutrition/log');
    fire('ln:localNotificationActionPerformed', { actionId: 'tap', notification: { id: 2, extra: { path: '/profile' } } });
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('bar icons follow the theme', async () => {
    expect(h.setStyle).toHaveBeenLastCalledWith({ style: 'DARK' });
    document.documentElement.dataset.theme = 'light';
    await vi.waitFor(() => expect(h.setStyle).toHaveBeenLastCalledWith({ style: 'LIGHT' }));
    document.documentElement.dataset.theme = 'dark';
    await vi.waitFor(() => expect(h.setStyle).toHaveBeenLastCalledWith({ style: 'DARK' }));
  });
});

describe('helpers', () => {
  it('reads the WebView version', () => {
    expect(webViewMajor('… Chrome/150.0.7000.0 Mobile Safari/537.36')).toBe(150);
    expect(webViewMajor('Mozilla/5.0 jsdom')).toBe(0);
  });

  it('writes reminder texts in both languages (same as the in-app reminders)', () => {
    expect(reminderTexts('he').workout.title).toBe('זמן להתאמן');
    expect(reminderTexts('en').meal.title).toBe('Time to log your meal');
    expect(reminderTexts('he').channel.name).toBe('תזכורות');
  });
});

describe('older WebView (cannot draw under the bars)', () => {
  it('keeps light icons on the black padding even in the light theme', async () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 10; wv) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36');
    h.setStyle.mockClear();
    document.documentElement.dataset.theme = 'light';
    await installNativePlatform({ navigate });
    expect(h.setStyle).toHaveBeenLastCalledWith({ style: 'DARK' });
  });
});

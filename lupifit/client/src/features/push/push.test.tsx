import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfileDTO, PushConfigResponse } from '@shared/types';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  apiGet: (...a: unknown[]) => apiGet(...a),
  apiPost: (...a: unknown[]) => apiPost(...a),
}));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

import { ApiError } from '../../api/client';
import { ToastProvider } from '../../components/ui';
import { I18nProvider } from '../../i18n';
import { RemindersSection } from '../../pages/settings/RemindersSection';
import { PushNotificationsControl } from './PushNotificationsControl';
import { PUSH_OWNER_KEY, base64UrlToBytes, isPushOnForUser, releasePushOnLogout, syncPushSubscription } from './push';

// A real-looking VAPID public key (65 bytes, base64url) and a second one for "rotated keys".
const KEY = `BA${'A'.repeat(84)}Q`;
const OTHER_KEY = `BB${'B'.repeat(84)}Q`;
const CONFIG: PushConfigResponse = { enabled: true, publicKey: KEY, devices: 1 };

interface FakeSub {
  endpoint: string;
  options: { applicationServerKey: ArrayBuffer };
  toJSON(): unknown;
  unsubscribe: ReturnType<typeof vi.fn>;
}

let current: FakeSub | null = null;
let notification: { permission: NotificationPermission; requestPermission: ReturnType<typeof vi.fn> };
let pushManager: { getSubscription: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };
let counter = 0;

function makeSub(key = KEY): FakeSub {
  const endpoint = `https://fcm.googleapis.com/fcm/send/device-${++counter}`;
  const sub: FakeSub = {
    endpoint,
    options: { applicationServerKey: base64UrlToBytes(key).buffer },
    toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh: 'p'.repeat(87), auth: 'a'.repeat(22) } }),
    unsubscribe: vi.fn(async () => {
      if (current === sub) current = null;
      return true;
    }),
  };
  return sub;
}

/** Installs a browser with the Push API; `answer` is what the permission prompt returns. */
function installBrowser({ permission = 'default', answer = 'granted' }: { permission?: NotificationPermission; answer?: NotificationPermission } = {}) {
  notification = {
    permission,
    requestPermission: vi.fn(async () => {
      notification.permission = answer;
      return answer;
    }),
  };
  pushManager = {
    getSubscription: vi.fn(async () => current),
    subscribe: vi.fn(async () => (current = makeSub())),
  };
  const registration = { pushManager };
  Object.defineProperty(window, 'Notification', { configurable: true, writable: true, value: notification });
  Object.defineProperty(window, 'PushManager', { configurable: true, writable: true, value: function PushManager() {} });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: vi.fn(async () => registration), ready: Promise.resolve(registration), addEventListener: vi.fn(), removeEventListener: vi.fn() },
  });
}

function removeBrowserPush() {
  for (const key of ['Notification', 'PushManager'] as const) Reflect.deleteProperty(window, key);
  Reflect.deleteProperty(navigator, 'serviceWorker');
}

function wrap(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nProvider locale="en">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </I18nProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  current = null;
  apiGet.mockReset();
  apiPost.mockReset().mockResolvedValue({ ok: true, devices: 1 });
  installBrowser();
});
afterEach(() => removeBrowserPush());

describe('PushNotificationsControl', () => {
  it('explains when the browser cannot receive push and shows the fallback', async () => {
    removeBrowserPush();
    wrap(<PushNotificationsControl config={CONFIG} remindersOn unsupportedExtra={<p>in-tab fallback</p>} />);
    expect(await screen.findByText(/can’t get notifications while LUPU-FIT is closed/)).toBeTruthy();
    expect(screen.getByText('in-tab fallback')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Turn on phone notifications' })).toBeNull();
  });

  it('explains how to unblock notifications when they were denied', async () => {
    installBrowser({ permission: 'denied' });
    wrap(<PushNotificationsControl config={CONFIG} remindersOn />);
    expect(await screen.findByText(/blocked for LUPU-FIT/)).toBeTruthy();
    expect(screen.getByText(/Android Settings → Apps → LUPU-FIT → Notifications/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Turn on phone notifications' })).toBeNull();
  });

  it('asks for permission only on the tap, then subscribes with the server key and registers the device', async () => {
    wrap(<PushNotificationsControl config={CONFIG} remindersOn />);
    const enable = await screen.findByRole('button', { name: 'Turn on phone notifications' });
    expect(enable.className).not.toContain('btn-primary');
    expect(notification.requestPermission).not.toHaveBeenCalled();

    fireEvent.click(enable);
    expect(await screen.findByRole('button', { name: 'Send a test notification' })).toBeTruthy();
    expect(notification.requestPermission).toHaveBeenCalledTimes(1);
    const [options] = pushManager.subscribe.mock.calls[0]!;
    expect(options.userVisibleOnly).toBe(true);
    expect(Array.from(options.applicationServerKey as Uint8Array)).toEqual(Array.from(base64UrlToBytes(KEY)));
    expect(apiPost).toHaveBeenCalledWith('/push/subscribe', { endpoint: current!.endpoint, expirationTime: null, keys: { p256dh: 'p'.repeat(87), auth: 'a'.repeat(22) } });
    expect(window.localStorage.getItem(PUSH_OWNER_KEY)).toBe(JSON.stringify('u1'));
    expect(screen.getByText(/Phone notifications are on for this device/)).toBeTruthy();
  });

  it('stays off (nothing stored) when the prompt is dismissed or refused', async () => {
    installBrowser({ answer: 'default' });
    wrap(<PushNotificationsControl config={CONFIG} remindersOn />);
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on phone notifications' }));
    expect(await screen.findByText('Notifications were not allowed')).toBeTruthy();
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(apiPost).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Turn on phone notifications' })).toBeTruthy();
  });

  it('shows an error and stays off when subscribing fails', async () => {
    pushManager.subscribe.mockRejectedValueOnce(new DOMException('push service error', 'AbortError'));
    wrap(<PushNotificationsControl config={CONFIG} remindersOn />);
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on phone notifications' }));
    expect(await screen.findByText(/could not be turned on/)).toBeTruthy();
    expect(window.localStorage.getItem(PUSH_OWNER_KEY)).toBeNull();
  });

  describe('when on for this device', () => {
    beforeEach(() => {
      installBrowser({ permission: 'granted' });
      current = makeSub();
      window.localStorage.setItem(PUSH_OWNER_KEY, JSON.stringify('u1'));
    });

    it('sends a test to this device', async () => {
      apiPost.mockResolvedValueOnce({ sent: 1, failed: 0, removed: 0 });
      wrap(<PushNotificationsControl config={{ ...CONFIG, devices: 2 }} remindersOn={false} />);
      expect(await screen.findByText('Your reminders go to 2 devices.')).toBeTruthy();
      expect(screen.getByText(/Reminders are switched off above/)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Send a test notification' }));
      expect(await screen.findByText(/Test notification sent/)).toBeTruthy();
      expect(apiPost).toHaveBeenCalledWith('/push/test', { endpoint: current!.endpoint });
    });

    it('re-registers the device once when the server no longer knows it', async () => {
      apiGet.mockResolvedValue(CONFIG);
      apiPost.mockImplementation(async (path: string) => {
        if (path === '/push/test' && apiPost.mock.calls.filter(([p]) => p === '/push/test').length === 1) throw new ApiError(404, 'push_subscription_not_found', 'x');
        return path === '/push/test' ? { sent: 1, failed: 0, removed: 0 } : { ok: true, devices: 1 };
      });
      wrap(<PushNotificationsControl config={CONFIG} remindersOn />);
      fireEvent.click(await screen.findByRole('button', { name: 'Send a test notification' }));
      expect(await screen.findByText(/Test notification sent/)).toBeTruthy();
      expect(apiPost.mock.calls.map(([p]) => p)).toEqual(['/push/test', '/push/subscribe', '/push/test']);
    });

    it('reports a test that could not be delivered', async () => {
      apiPost.mockResolvedValueOnce({ sent: 0, failed: 1, removed: 0 });
      wrap(<PushNotificationsControl config={CONFIG} remindersOn />);
      fireEvent.click(await screen.findByRole('button', { name: 'Send a test notification' }));
      expect(await screen.findByText(/could not be delivered/)).toBeTruthy();
    });

    it('turns off: server first, then the browser subscription', async () => {
      const sub = current!;
      wrap(<PushNotificationsControl config={CONFIG} remindersOn />);
      fireEvent.click(await screen.findByRole('button', { name: 'Turn off on this device' }));
      expect(await screen.findByRole('button', { name: 'Turn on phone notifications' })).toBeTruthy();
      expect(apiPost).toHaveBeenCalledWith('/push/unsubscribe', { endpoint: sub.endpoint });
      expect(sub.unsubscribe).toHaveBeenCalled();
      expect(window.localStorage.getItem(PUSH_OWNER_KEY)).toBeNull();
    });

    it('is off for another account signed in on the same device', async () => {
      window.localStorage.setItem(PUSH_OWNER_KEY, JSON.stringify('someone-else'));
      wrap(<PushNotificationsControl config={CONFIG} remindersOn />);
      expect(await screen.findByRole('button', { name: 'Turn on phone notifications' })).toBeTruthy();
      expect(isPushOnForUser('u1')).toBe(false);
      expect(isPushOnForUser('someone-else')).toBe(true);
    });
  });
});

describe('RemindersSection', () => {
  const profile = {
    reminders: { enabled: true, workoutDays: [1], workoutTime: '18:00', mealLogging: false, mealTimes: [] },
  } as unknown as ProfileDTO;

  it('hides phone notifications when the server has push disabled', async () => {
    apiGet.mockResolvedValue({ enabled: false, publicKey: null, devices: 0 });
    wrap(<RemindersSection profile={profile} />);
    expect(await screen.findByText(/Reminders appear only while LUPU-FIT is open/)).toBeTruthy();
    expect(screen.getByText('Browser notifications')).toBeTruthy();
    expect(screen.queryByText('Phone notifications')).toBeNull();
    expect(apiGet).toHaveBeenCalledWith('/push/public-key');
  });

  it('offers phone notifications when the server has push', async () => {
    apiGet.mockResolvedValue(CONFIG);
    wrap(<RemindersSection profile={profile} />);
    expect(await screen.findByText('Phone notifications')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Turn on phone notifications' })).toBeTruthy();
    expect(screen.queryByText(/Reminders appear only while LUPU-FIT is open/)).toBeNull();
  });
});

describe('push helpers', () => {
  it('decodes the VAPID key', () => {
    const bytes = base64UrlToBytes(KEY);
    expect(bytes).toHaveLength(65);
    expect(bytes[0]).toBe(4);
  });

  it('sync re-registers this user’s device and replaces a subscription made with an old key', async () => {
    installBrowser({ permission: 'granted' });
    const old = makeSub(OTHER_KEY);
    current = old;
    window.localStorage.setItem(PUSH_OWNER_KEY, JSON.stringify('u1'));
    apiGet.mockResolvedValue(CONFIG);
    await syncPushSubscription('u1');
    expect(old.unsubscribe).toHaveBeenCalled();
    expect(apiPost).toHaveBeenCalledWith('/push/unsubscribe', { endpoint: old.endpoint });
    expect(pushManager.subscribe).toHaveBeenCalledTimes(1);
    expect(apiPost).toHaveBeenLastCalledWith('/push/subscribe', expect.objectContaining({ endpoint: current!.endpoint }));
  });

  it('sync does nothing for another account, and forgets the device when notifications were blocked', async () => {
    window.localStorage.setItem(PUSH_OWNER_KEY, JSON.stringify('u1'));
    await syncPushSubscription('u2');
    expect(apiGet).not.toHaveBeenCalled();
    installBrowser({ permission: 'denied' });
    await syncPushSubscription('u1');
    expect(apiPost).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(PUSH_OWNER_KEY)).toBeNull();
  });

  it('logout stops this device on the server but remembers the owner for the next sign-in', async () => {
    installBrowser({ permission: 'granted' });
    current = makeSub();
    window.localStorage.setItem(PUSH_OWNER_KEY, JSON.stringify('u1'));
    await releasePushOnLogout('u1');
    expect(apiPost).toHaveBeenCalledWith('/push/unsubscribe', { endpoint: current.endpoint });
    expect(current.unsubscribe).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(PUSH_OWNER_KEY)).toBe(JSON.stringify('u1'));
    apiPost.mockClear();
    await releasePushOnLogout('someone-else');
    expect(apiPost).not.toHaveBeenCalled();
  });
});

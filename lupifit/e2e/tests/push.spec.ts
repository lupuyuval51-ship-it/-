import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

/**
 * Phone notifications without a real push service: the page's PushManager is replaced by a
 * stand-in that hands out a fake FCM subscription. Its key is not a real P-256 point, so the
 * server cannot encrypt for it and the test notification fails before any network request.
 */
async function fakePushService(page: Page) {
  await page.addInitScript(() => {
    const endpoint = `https://fcm.googleapis.com/fcm/send/e2e-${Math.random().toString(36).slice(2)}`;
    let current: PushSubscription | null = null;
    const make = () =>
      ({
        endpoint,
        expirationTime: null,
        options: { applicationServerKey: null, userVisibleOnly: true },
        toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh: `B${'A'.repeat(86)}`, auth: 'A'.repeat(22) } }),
        unsubscribe: async () => {
          current = null;
          return true;
        },
      }) as unknown as PushSubscription;
    PushManager.prototype.getSubscription = async function () {
      return current;
    };
    PushManager.prototype.subscribe = async function () {
      current = make();
      return current;
    };
  });
}

const devices = async (page: Page) => ((await (await page.request.get('/api/push/public-key')).json()) as { enabled: boolean; devices: number });

test('phone notifications: turn on, send a test and turn off', async ({ page, context }) => {
  await context.grantPermissions(['notifications']);
  await fakePushService(page);
  await useEnglish(page);
  await readyUser(page);
  expect((await devices(page)).enabled).toBe(true);

  await page.goto('/profile#settings-reminders');
  const reminders = page.locator('#settings-reminders');
  await expect(reminders.getByText('Phone notifications', { exact: true })).toBeVisible();
  await reminders.getByRole('button', { name: 'Turn on phone notifications' }).click();
  await expect(page.getByText('Phone notifications are on', { exact: true })).toBeVisible();
  await expect(reminders.getByText(/Phone notifications are on for this device/)).toBeVisible();
  // Reminders themselves are still off for a new account.
  await expect(reminders.getByText(/Reminders are switched off above/)).toBeVisible();
  expect((await devices(page)).devices).toBe(1);

  // The stand-in device cannot be reached, and the app says so instead of claiming success.
  await reminders.getByRole('button', { name: 'Send a test notification' }).click();
  await expect(page.getByText(/The test notification could not be delivered/)).toBeVisible();

  await reminders.getByRole('button', { name: 'Turn off on this device' }).click();
  await expect(page.getByText('Phone notifications are off on this device')).toBeVisible();
  await expect(reminders.getByRole('button', { name: 'Turn on phone notifications' })).toBeVisible();
  expect((await devices(page)).devices).toBe(0);
});

test('phone notifications: blocked notifications explain how to allow them again', async ({ page }) => {
  await fakePushService(page);
  await page.addInitScript(() => {
    Object.defineProperty(Notification, 'permission', { get: () => 'denied' });
  });
  await useEnglish(page);
  await readyUser(page);
  await page.goto('/profile#settings-reminders');
  const reminders = page.locator('#settings-reminders');
  await expect(reminders.getByText(/Notifications are blocked for LUPU-FIT/)).toBeVisible();
  await expect(reminders.getByText(/Android Settings → Apps → LUPU-FIT → Notifications/)).toBeVisible();
  await expect(reminders.getByRole('button', { name: 'Turn on phone notifications' })).toHaveCount(0);
});

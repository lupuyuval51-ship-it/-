import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const toast = (page: Page, text: string | RegExp) => page.locator('.toasts').getByText(text).first();
const outboxPill = (page: Page) => page.getByRole('button', { name: /changes? saved on this device/ });

test('food logged without a connection stays on the device, shows as not synced, and syncs when the connection returns', async ({ page, context }) => {
  test.setTimeout(120_000);
  await readyUser(page);
  await page.goto('/nutrition'); // loads the day once, so it can still be shown offline
  await expect(page.getByRole('heading', { name: 'Nutrition', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Log food' }).first().click();
  await page.getByRole('tab', { name: 'Quick add' }).click();

  await context.setOffline(true);
  await page.getByRole('textbox', { name: 'Description' }).fill('Offline soup');
  await page.getByLabel('Calories (kcal)').fill('250');
  await page.getByRole('button', { name: /^Add to / }).click();
  await expect(toast(page, /saved on this device/)).toBeVisible();
  await expect(outboxPill(page)).toBeVisible();

  // It is part of the day immediately, marked as not synced, and can still be removed.
  await page.getByRole('link', { name: 'Done' }).click();
  const entry = page.getByRole('listitem').filter({ hasText: 'Offline soup' });
  await expect(entry).toBeVisible();
  await expect(entry).toContainText('Not synced yet');
  await expect(page.getByRole('img', { name: /^250 of [\d,]+ kcal eaten$/ })).toBeVisible();

  await context.setOffline(false);
  await expect(outboxPill(page)).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText('Not synced yet')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('listitem').filter({ hasText: 'Offline soup' })).toBeVisible();
  await expect(page.getByRole('img', { name: /^250 of [\d,]+ kcal eaten$/ })).toBeVisible();
});

test('a weigh-in made offline waits in its own list and syncs later; an unsynced entry can be removed', async ({ page, context }) => {
  test.setTimeout(120_000);
  await readyUser(page);
  await page.goto('/progress');
  const card = page.getByRole('region', { name: 'Body weight' });
  await expect(card.getByRole('listitem').filter({ hasText: '80 kg' })).toBeVisible();
  const { today } = await (await page.request.get('/api/dashboard')).json();
  const back = (n: number) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };

  await context.setOffline(true);
  await card.getByLabel('Date').fill(back(2));
  await card.getByRole('textbox', { name: 'Weight', exact: true }).fill('79.4');
  await card.getByRole('button', { name: 'Save weight' }).click();
  await expect(toast(page, /saved on this device/)).toBeVisible();
  await expect(card.getByText('Waiting to sync')).toBeVisible();
  await expect(card.getByRole('listitem').filter({ hasText: '79.4 kg' })).toContainText('Not synced yet');

  // Remove one entry before it ever reaches the server.
  await card.getByLabel('Date').fill(back(3));
  await card.getByRole('textbox', { name: 'Weight', exact: true }).fill('99.9');
  await card.getByRole('button', { name: 'Save weight' }).click();
  await card.getByRole('listitem').filter({ hasText: '99.9 kg' }).getByRole('button', { name: 'Remove' }).click();
  await expect(card.getByRole('listitem').filter({ hasText: '99.9 kg' })).toHaveCount(0);

  await context.setOffline(false);
  await expect(outboxPill(page)).toHaveCount(0, { timeout: 30_000 });
  await expect(card.getByText('Waiting to sync')).toHaveCount(0);
  await expect(card.getByRole('listitem').filter({ hasText: '79.4 kg' })).toBeVisible();
  await expect(card.getByRole('listitem').filter({ hasText: '99.9 kg' })).toHaveCount(0);
});

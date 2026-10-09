import { expect, test, type Page } from '@playwright/test';
import { readyUser, useEnglish } from './helpers';

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const composer = (page: Page) => page.getByLabel('Message the coach');
const conversations = (page: Page) => page.getByRole('navigation', { name: 'Conversations' });
const lastReply = (page: Page) => page.locator('.coach-msg-assistant').last();

async function openCoach(page: Page) {
  await page.goto('/coach');
  await expect(page.getByRole('heading', { level: 1, name: 'AI coach' })).toBeVisible();
}

async function ask(page: Page, text: string) {
  await composer(page).fill(text);
  await composer(page).press('Enter');
  await expect(lastReply(page)).toContainText(`I received "${text}"`);
}

test('a suggested prompt gets an AI reply and becomes a titled conversation', async ({ page }) => {
  await readyUser(page);
  await openCoach(page);
  await expect(page.getByText('How can I help today?')).toBeVisible();
  await expect(page.getByText('No conversations yet')).toBeVisible();
  await expect(page.getByText('50 of 50 messages left today')).toBeVisible();
  await expect(page.getByText(/general fitness and nutrition guidance, not medical advice/)).toBeVisible();

  await page.getByRole('button', { name: 'How do I squat with good form?' }).click();
  await expect(page.locator('.coach-msg-user').last()).toContainText('How do I squat with good form?');
  await expect(lastReply(page)).toContainText('E2E coach reply: I received "How do I squat with good form?"');
  await expect(lastReply(page).getByText('AI', { exact: true })).toBeVisible();

  await expect(page).toHaveURL(/\/coach\?thread=[0-9a-f-]{36}/);
  await expect(page.getByRole('heading', { level: 2, name: 'How do I squat with good form?' })).toBeVisible();
  await expect(conversations(page).getByRole('button', { name: /How do I squat with good form\?/ })).toBeVisible();
  await expect(page.getByText('49 of 50 messages left today')).toBeVisible();

  // The conversation is still there after a reload.
  await page.reload();
  await expect(lastReply(page)).toContainText('E2E coach reply');
  await expect(page.locator('.coach-msg')).toHaveCount(2);
});

test('new conversation: Enter sends, Shift+Enter adds a new line', async ({ page }) => {
  await readyUser(page);
  await openCoach(page);
  await ask(page, 'First question');

  await page.getByRole('button', { name: 'New conversation' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'New conversation' })).toBeVisible();
  await expect(page.getByText('How can I help today?')).toBeVisible();
  await expect(page.locator('.coach-msg')).toHaveCount(0);

  await composer(page).click();
  await page.keyboard.type('Line one');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('Line two');
  await expect(composer(page)).toHaveValue('Line one\nLine two');
  await expect(page.locator('.coach-msg')).toHaveCount(0);
  await expect(page.getByText('17/2,000')).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(composer(page)).toHaveValue('');
  await expect(page.locator('.coach-msg-user').last()).toHaveText(/Line one\s*Line two/);
  await expect(lastReply(page)).toContainText('E2E coach reply: I received "Line one');
  await expect(conversations(page).getByRole('listitem')).toHaveCount(2);

  // Switching back to the first conversation shows its own messages.
  await conversations(page).getByRole('button', { name: /First question/ }).click();
  await expect(lastReply(page)).toContainText('I received "First question"');
  await expect(page.locator('.coach-msg')).toHaveCount(2);
});

test('rename and delete a conversation', async ({ page }) => {
  await readyUser(page);
  await openCoach(page);
  await ask(page, 'Plan question');

  await page.getByRole('button', { name: 'Rename conversation' }).click();
  const dialog = page.getByRole('dialog', { name: 'Rename conversation' });
  await dialog.getByLabel('Title').fill('   ');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByText('Required')).toBeVisible();
  await dialog.getByLabel('Title').fill('My squat notes');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Conversation renamed')).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { level: 2, name: 'My squat notes' })).toBeVisible();
  await expect(conversations(page).getByRole('button', { name: /My squat notes/ })).toBeVisible();

  await page.getByRole('button', { name: 'Delete conversation' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete this conversation?' });
  await expect(confirm).toContainText('My squat notes');
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Conversation deleted')).toBeVisible();
  await expect(conversations(page).getByRole('button', { name: /My squat notes/ })).toHaveCount(0);
  await expect(page.getByText('No conversations yet')).toBeVisible();
  await expect(page.getByText('How can I help today?')).toBeVisible();
});

test('/coach?q= pre-fills the composer without sending', async ({ page }) => {
  await readyUser(page);
  await openCoach(page);
  await ask(page, 'Earlier conversation');

  await page.goto(`/coach?q=${encodeURIComponent('How do I do a Romanian deadlift?')}`);
  await expect(composer(page)).toHaveValue('How do I do a Romanian deadlift?');
  await expect(page).not.toHaveURL(/[?&]q=/);
  // A fresh conversation is opened; nothing was sent.
  await expect(page.getByRole('heading', { level: 2, name: 'New conversation' })).toBeVisible();
  await expect(page.locator('.coach-msg')).toHaveCount(0);
  await expect(conversations(page).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('49 of 50 messages left today')).toBeVisible();

  await composer(page).press('Enter');
  await expect(lastReply(page)).toContainText('I received "How do I do a Romanian deadlift?"');
  await expect(conversations(page).getByRole('listitem')).toHaveCount(2);
});

test('a failed send can be retried with the same idempotency key', async ({ page }) => {
  await readyUser(page);
  await openCoach(page);
  const keys: string[] = [];
  await page.route('**/api/coach/threads/*/messages', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    keys.push(route.request().headers()['idempotency-key'] ?? '');
    if (keys.length === 1) return route.abort('failed');
    return route.continue();
  });
  await composer(page).fill('Retry me please');
  await composer(page).press('Enter');
  await expect(page.getByText('Your message was not sent.')).toBeVisible();
  await expect(page.getByText("Can't reach the server. Check your connection and try again.")).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(lastReply(page)).toContainText('I received "Retry me please"');
  await expect(page.getByText('Your message was not sent.')).toBeHidden();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
  await expect(page.locator('.coach-msg-user')).toHaveCount(1);
  await expect(conversations(page).getByRole('listitem')).toHaveCount(1);
});

test('mobile: conversations drawer @mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The conversations drawer is the mobile layout');
  await readyUser(page);
  await openCoach(page);
  await ask(page, 'Mobile question');

  await page.getByRole('button', { name: 'New conversation' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'New conversation' })).toBeVisible();
  await expect(page.locator('.coach-msg')).toHaveCount(0);

  await page.getByRole('button', { name: 'Conversations' }).click();
  const drawer = page.getByRole('dialog', { name: 'Conversations' });
  await drawer.getByRole('button', { name: /Mobile question/ }).click();
  await expect(drawer).toBeHidden();
  await expect(lastReply(page)).toContainText('I received "Mobile question"');
  await expect(page.getByLabel('Message the coach')).toBeVisible();
});

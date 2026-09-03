import { expect, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { gameMessages } from '../../src/components/game/messages';
import { questMessages } from '../../src/lib/quest-i18n';
import { type GameMode } from '../../src/lib/game';

export const localOrigin = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
export const gameHe = gameMessages.he;
const proofPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFJkAAAAASUVORK5CYII=', 'base64');

export async function post<T = Record<string, unknown>>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const response = await request.post(`${localOrigin}/api/${path}`, { headers: { origin: localOrigin }, data });
  const body = await response.json();
  expect(response.ok(), `${path}: ${JSON.stringify(body)}`).toBeTruthy();
  return body as T;
}

/** A fresh verified adult and one manually approved Demo order; shared learners stay untouched. */
export async function createBasicGameFixture(page: Page, browser: Browser, label: string) {
  const catalog = await page.request.get(`${localOrigin}/api/catalog`).then(response => response.json());
  expect(catalog.isDemo, 'Local Demo fixtures only: no real email, payment or AI service').toBe(true);
  await post(page.request, 'auth/guest', { displayName: `בדיקת משחק ${label}`.slice(0, 60) });
  await post(page.request, 'settings', { birthYear: 1995 });
  await post(page.request, 'enrollments', { pathId: 'website', skill: 'בניית אתר ראשון', level: 'beginner', dailyMinutes: 20, goal: 'תרגול משחק במסגרת בדיקה מבודדת', styles: ['games'] });
  await post(page.request, 'settings', { quality: 'low', effects: false, music: false });
  const { order } = await post<{ order: { id: string; amount: number } }>(page.request, 'orders', { plan: 'BASIC' });
  expect(order.amount).toBe(9);
  const proof = await page.request.post(`${localOrigin}/api/uploads`, { headers: { origin: localOrigin }, multipart: { purpose: 'payment', orderId: order.id, file: { name: 'game-demo-proof.png', mimeType: 'image/png', buffer: proofPng } } });
  expect(proof.ok()).toBeTruthy();
  const before = await page.request.get(`${localOrigin}/api/state`).then(response => response.json());
  expect(before.plan).toBe('FREE');
  const admin = await browser.newContext({ baseURL: localOrigin });
  try {
    await post(admin.request, 'auth/demo', { role: 'admin' });
    await post(admin.request, `admin/orders/${order.id}`, { action: 'approve', note: 'Game interaction E2E Demo only. No money was transferred.' });
  } finally { await admin.close(); }
  const state = await page.request.get(`${localOrigin}/api/state`).then(response => response.json());
  expect(state.plan).toBe('BASIC');
  expect(state.features.canPlayFull3DGames).toBe(true);
}

export async function startDailyMode(page: Page, mode: GameMode) {
  await page.goto('/quest');
  if (mode !== 'knowledge-arena') {
    await page.locator('.arena-more-modes summary').click();
    const loaded = page.waitForResponse(response => new URL(response.url()).pathname === '/api/games/daily' && new URL(response.url()).searchParams.get('mode') === mode);
    await page.getByRole('combobox', { name: questMessages.he.mode, exact: true }).selectOption(mode);
    expect((await loaded).ok()).toBeTruthy();
  }
  const started = page.waitForResponse(response => response.url().endsWith('/api/games/start') && response.request().method() === 'POST');
  await page.getByTestId('quest-start').click();
  const response = await started;
  const body = await response.json();
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  expect(body.game.gameMode).toBe(mode);
  const tutorial = page.getByRole('dialog');
  await expect(tutorial.getByRole('button', { name: gameHe.begin, exact: true })).toBeEnabled();
  await tutorial.getByRole('button', { name: gameHe.begin, exact: true }).click();
  await expect(page.locator('.quest-canvas canvas')).toBeVisible();
  return body as { attemptId: string; game: { questions: unknown[] } };
}

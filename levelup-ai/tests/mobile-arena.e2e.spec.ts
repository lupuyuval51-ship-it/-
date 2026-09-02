import { test, expect, type APIRequestContext, type Browser, type Locator, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { gameMessages } from '../src/components/game/messages';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const password = 'E2eArenaPassword2026!';
const proofPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFJkAAAAASUVORK5CYII=', 'base64');
const subject = 'מתמטיקה: חיבור וחיסור';
const he = gameMessages.he;

interface GeneratedArena {
  source: 'ai' | 'demo';
  sourceNotice: { he: string; en: string };
  game: {
    dailyGameId: string;
    gameMode: string;
    title?: { he: string; en: string };
    questions: Array<{ prompt: { he: string; en: string }; answer?: number }>;
    arena: { layout: string; enemyCount: number; obstacleCount: number; waveCount: number };
  };
}

async function post<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const response = await request.post(`${baseURL}/api/${path}`, { headers: { origin: baseURL }, data });
  const body = await response.json();
  expect(response.ok(), `${path}: ${JSON.stringify(body)}`).toBeTruthy();
  return body as T;
}

async function createLearner(page: Page, label: string) {
  const catalog = await page.request.get(`${baseURL}/api/catalog`).then(response => response.json());
  expect(catalog.isDemo, 'Only local, explicitly marked Demo fixtures are permitted').toBe(true);
  const email = `e2e-arena-${label}-${randomUUID().slice(0, 10)}@example.test`;
  const registered = await post<{ verification: { token: string } }>(page.request, 'auth/register', { email, password, displayName: `בדיקת זירה ${label}`, birthYear: 1995, consent: true });
  await post(page.request, 'auth/verify', { token: registered.verification.token });
  await post(page.request, 'auth/login', { email, password, remember: true });
  const generator = await page.request.get(`${baseURL}/api/games/custom`).then(response => response.json());
  expect(generator.generatorIsDemo, 'Arena E2E must not call a configured paid AI provider').toBe(true);
  await post(page.request, 'enrollments', { pathId: 'website', skill: 'בניית אתר ראשון', level: 'beginner', dailyMinutes: 20, goal: 'תרגול נגיש במסגרת בדיקה מבודדת', styles: ['games'] });
}

async function activateBasic(page: Page, browser: Browser) {
  const created = await post<{ order: { id: string; amount: number } }>(page.request, 'orders', { plan: 'BASIC' });
  expect(created.order.amount).toBe(9);
  const proof = await page.request.post(`${baseURL}/api/uploads`, {
    headers: { origin: baseURL },
    multipart: { purpose: 'payment', orderId: created.order.id, file: { name: 'arena-demo-proof.png', mimeType: 'image/png', buffer: proofPng } },
  });
  expect(proof.ok()).toBeTruthy();
  const before = await page.request.get(`${baseURL}/api/state`).then(response => response.json());
  expect(before.plan).toBe('FREE');
  const adminContext = await browser.newContext({ baseURL });
  try {
    // Approves this fixture only; never changes a shared learner or a real payment.
    await post(adminContext.request, 'auth/demo', { role: 'admin' });
    await post(adminContext.request, `admin/orders/${created.order.id}`, { action: 'approve', note: 'Mobile arena E2E Demo only. No money was transferred.' });
  } finally {
    await adminContext.close();
  }
  const state = await page.request.get(`${baseURL}/api/state`).then(response => response.json());
  expect(state.plan).toBe('BASIC');
  expect(state.features.canPlayFull3DGames).toBe(true);
}

async function createArena(page: Page): Promise<GeneratedArena> {
  await page.goto('/quest');
  await page.getByTestId('quest-tab-create').click();
  await page.getByTestId('arena-topic').fill(subject);
  for (const width of [320, 390, 320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await noHorizontalOverflow(page, width);
    await thumbTarget(page.getByTestId('arena-topic'), page);
    await thumbTarget(page.getByTestId('arena-generate'), page);
  }
  const generated = page.waitForResponse(response => response.url().endsWith('/api/games/generate') && response.request().method() === 'POST');
  await page.getByTestId('arena-generate').click();
  const response = await generated;
  const result = await response.json() as GeneratedArena;
  expect(response.ok(), JSON.stringify(result)).toBeTruthy();
  expect(result.source).toBe('demo');
  expect(result.sourceNotice.he).toContain('Demo');
  expect(result.game.gameMode).toBe('knowledge-arena');
  expect(result.game.questions).toHaveLength(8);
  expect(result.game.questions.every(question => question.answer === undefined)).toBe(true);
  expect(result.game.arena.waveCount).toBe(8);
  expect(result.game.arena.enemyCount).toBeGreaterThanOrEqual(2);
  expect(result.game.arena.enemyCount).toBeLessThanOrEqual(6);
  await expect(page.getByTestId('quest-selected-title')).toContainText(/מתמטיקה|חיבור|חיסור/);
  return result;
}

async function noHorizontalOverflow(page: Page, width: number) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), { message: `No horizontal overflow at ${width}px` }).toBe(true);
}

async function thumbTarget(locator: Locator, page: Page) {
  await expect(locator).toBeVisible();
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThanOrEqual(44);
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.y).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
}

test.describe('educational arena on phones', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('Basic learner creates a topic game, asks a scoped question, and plays with thumb controls', async ({ page, browser }, testInfo) => {
    await createLearner(page, 'basic');
    await activateBasic(page, browser);
    const generated = await createArena(page);
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await noHorizontalOverflow(page, width);
      await thumbTarget(page.getByTestId('quest-start'), page);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('quest-tab-ask').click();
    await page.getByTestId('game-question-input').fill('איך בודקים אם התוצאה של תרגיל חיסור נכונה?');
    const answered = page.waitForResponse(response => response.url().endsWith('/api/games/ask') && response.request().method() === 'POST');
    await page.getByTestId('game-question-send').click();
    const answerResponse = await answered;
    expect(answerResponse.ok()).toBeTruthy();
    expect(answerResponse.request().postDataJSON().gameId).toBe(generated.game.dailyGameId);
    const reply = await answerResponse.json() as { message: { content: string; isDemo: boolean }; remaining: number };
    expect(reply.message.content.length).toBeGreaterThan(20);
    expect(reply.message.isDemo).toBe(true);
    expect(reply.remaining).toBeGreaterThanOrEqual(0);
    await expect(page.getByTestId('game-conversation')).toContainText(reply.message.content);
    const savedConversation = await page.request.get(`${baseURL}/api/games/messages?gameId=${encodeURIComponent(generated.game.dailyGameId)}`).then(response => response.json());
    expect(savedConversation.messages.at(-1).content).toBe(reply.message.content);
    await noHorizontalOverflow(page, 390);
    await page.getByTestId('quest-tab-play').click();
    await page.getByTestId('quest-start').click();
    await expect(page.locator('.quest-player')).toBeVisible();
    const tutorial = page.getByRole('dialog');
    await expect(tutorial.getByRole('button', { name: he.begin, exact: true })).toBeEnabled();
    await tutorial.getByRole('button', { name: he.begin, exact: true }).click();
    await expect(page.locator('.quest-canvas canvas')).toBeVisible();

    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await noHorizontalOverflow(page, width);
      await thumbTarget(page.getByTestId('arena-fire'), page);
      await thumbTarget(page.getByTestId('arena-dash'), page);
      await thumbTarget(page.getByTestId('arena-joystick'), page);
      await testInfo.attach(`arena-${width}px`, { body: await page.screenshot(), contentType: 'image/png' });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const answers = page.getByRole('group', { name: he.chooser, exact: true }).getByRole('button');
    await expect(answers).toHaveCount(3);
    let scoringRequests = 0;
    page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/api/games/event')) scoringRequests++; });
    await answers.first().click();
    await expect(answers.first()).toHaveAttribute('aria-pressed', 'true');
    const questionToggle = page.getByTestId('quest-question-toggle');
    await thumbTarget(questionToggle, page);
    await questionToggle.click();
    await expect(questionToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(answers.first()).toBeHidden();
    await questionToggle.click();
    await expect(questionToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(answers.first()).toHaveAttribute('aria-pressed', 'true');
    expect(scoringRequests).toBe(0);
    const joystick = page.getByTestId('arena-joystick');
    const stickBounds = (await joystick.boundingBox())!;
    await page.mouse.move(stickBounds.x + stickBounds.width / 2 + 30, stickBounds.y + stickBounds.height / 2);
    await page.mouse.down();
    await expect(joystick.locator('span')).not.toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toContainText(he.paused);
    await expect(joystick).toHaveAttribute('aria-disabled', 'true');
    await expect(joystick.locator('span')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await expect(page.getByTestId('arena-fire')).toBeDisabled();
    await page.mouse.up();
    await page.getByRole('dialog').getByRole('button', { name: he.resume, exact: true }).click();
    await expect(answers.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('quest-run-progress')).toHaveAttribute('aria-valuenow', '0');
    // Hold the real fire control until a projectile reaches the selected target.
    // Enemies can intercept the first projectile; no direct scoring request is sent.
    const acceptedEvent = page.waitForResponse(response => response.url().endsWith('/api/games/event') && response.request().method() === 'POST', { timeout: 15_000 });
    const fire = (await page.getByTestId('arena-fire').boundingBox())!;
    await page.mouse.move(fire.x + fire.width / 2, fire.y + fire.height / 2);
    await page.mouse.down();
    try {
      const response = await acceptedEvent;
      const feedback = await response.json();
      expect(response.ok(), JSON.stringify(feedback)).toBeTruthy();
      expect(typeof feedback.correct).toBe('boolean');
      await expect(page.locator('.quest-feedback')).toContainText(feedback.explanation.he);
      await expect(page.getByTestId('quest-run-progress')).toHaveAttribute('aria-valuenow', '1');
      expect(scoringRequests).toBe(1);
    } finally {
      await page.mouse.up();
    }
    await page.locator('.quest-feedback').getByRole('button', { name: he.next, exact: true }).click();
    await expect(page.locator('.quest-feedback')).toHaveCount(0);
    await expect(page.getByTestId('arena-hud')).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await noHorizontalOverflow(page, 844);
    await thumbTarget(page.getByTestId('arena-fire'), page);
    await page.setViewportSize({ width: 390, height: 844 });
    await noHorizontalOverflow(page, 390);
    await thumbTarget(page.getByTestId('quest-ask-ingame'), page);
    await thumbTarget(page.getByTestId('arena-fire'), page);
    await expect(page.getByTestId('arena-fire')).toBeEnabled();
    await page.getByTestId('quest-ask-ingame').click();
    const inGameQuestion = page.getByRole('dialog');
    await expect(inGameQuestion.getByTestId('game-question-input')).toBeVisible();
    await inGameQuestion.getByTestId('game-question-input').fill('אפשר רמז לפתרון השאלה הבאה?');
    await expect(page.getByTestId('arena-fire')).toBeDisabled();
    await inGameQuestion.getByRole('button', { name: he.close, exact: true }).click();
    await expect(inGameQuestion).toHaveCount(0);
    await expect(page.getByTestId('quest-ask-ingame')).toBeFocused();
    await page.getByRole('button', { name: he.pause, exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText(he.paused);
  });

  test('Free learner can create a preview but cannot start a full arena', async ({ page }) => {
    await createLearner(page, 'free');
    const generated = await createArena(page);
    await page.setViewportSize({ width: 320, height: 740 });
    await noHorizontalOverflow(page, 320);
    await page.getByTestId('quest-start').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.quest-canvas canvas')).toHaveCount(0);
    const denied = await page.request.post(`${baseURL}/api/games/start`, { headers: { origin: baseURL }, data: { dailyGameId: generated.game.dailyGameId } });
    expect(denied.status()).toBe(403);
    const state = await page.request.get(`${baseURL}/api/state`).then(response => response.json());
    expect(state.plan).toBe('FREE');
    expect(state.features.canPlayFull3DGames).toBe(false);
  });
});

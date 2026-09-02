import { test, expect } from '@playwright/test';
import { createBasicGameFixture, gameHe as he, localOrigin, startDailyMode } from './helpers/game-fixtures';
import { questMessages } from '../src/lib/quest-i18n';

test('unselected arena can switch to 2D and keeps the final explanation until results are requested', async ({ page, browser }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createBasicGameFixture(page, browser, 'fallback');
  const run = await startDailyMode(page, 'knowledge-arena');
  const eventChoices: number[] = [];
  let finishRequests = 0;
  page.on('request', request => {
    if (request.method() !== 'POST') return;
    if (request.url().endsWith('/api/games/event')) eventChoices.push(request.postDataJSON().answer);
    if (request.url().endsWith('/api/games/finish')) finishRequests++;
  });
  const answers = page.getByRole('group', { name: he.chooser, exact: true }).getByRole('button');
  await expect(answers.first()).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: he.pause, exact: true }).click();
  const pauseMenu = page.getByRole('dialog');
  await pauseMenu.getByRole('checkbox', { name: he.music, exact: true }).check();
  await pauseMenu.getByRole('checkbox', { name: he.effects, exact: true }).check();
  await expect(pauseMenu.getByRole('checkbox', { name: he.music, exact: true })).toBeChecked();
  await expect(pauseMenu.getByRole('checkbox', { name: he.effects, exact: true })).toBeChecked();
  await pauseMenu.getByRole('checkbox', { name: he.music, exact: true }).uncheck();
  await pauseMenu.getByRole('checkbox', { name: he.effects, exact: true }).uncheck();
  await pauseMenu.getByRole('button', { name: he.fallbackSwitch, exact: true }).click();
  await expect(page.locator('.quest-canvas canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: he.fallbackAction, exact: true })).toBeDisabled();
  expect(eventChoices).toEqual([]);

  for (let index = 0; index < run.game.questions.length; index++) {
    await answers.first().click();
    await expect(answers.first()).toHaveAttribute('aria-pressed', 'true');
    const saved = page.waitForResponse(response => response.url().endsWith('/api/games/event') && response.request().method() === 'POST');
    await page.getByRole('button', { name: he.fallbackAction, exact: true }).click();
    const response = await saved;
    const feedback = await response.json();
    expect(response.ok(), JSON.stringify(feedback)).toBeTruthy();
    expect(feedback.index).toBe(index);
    await expect(page.locator('.quest-feedback')).toContainText(feedback.explanation.he);
    if (index < run.game.questions.length - 1) await page.locator('.quest-feedback').getByRole('button', { name: he.next, exact: true }).click();
  }
  expect(eventChoices).toEqual(Array.from({ length: run.game.questions.length }, () => 0));
  const state = await page.request.get(`${localOrigin}/api/state`).then(response => response.json());
  const attempt = state.attempts.find((item: { id: string }) => item.id === run.attemptId);
  expect(attempt).toBeTruthy();
  expect(attempt.status).toBe('playing');
  expect(finishRequests).toBe(0);
  await expect(page.locator('.quest-feedback')).toBeVisible();
  const completed = page.waitForResponse(response => response.url().endsWith('/api/games/finish') && response.request().method() === 'POST');
  await page.locator('.quest-feedback').getByRole('button', { name: he.seeResults, exact: true }).click();
  const response = await completed;
  const result = await response.json();
  expect(response.ok(), JSON.stringify(result)).toBeTruthy();
  expect(result.result.answered).toBe(run.game.questions.length);
  expect(result.result.totalQuestions).toBe(run.game.questions.length);
  expect(finishRequests).toBe(1);
  await expect(page.getByRole('heading', { name: questMessages.he.resultTitle, exact: true })).toBeVisible();
});

test('legacy Collect and Sort walks to the selected object and saves only after delivery', async ({ page, browser }) => {
  await createBasicGameFixture(page, browser, 'collect');
  const run = await startDailyMode(page, 'collect-sort');
  const events: number[] = [];
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/api/games/event')) events.push(request.postDataJSON().answer); });
  const answers = page.getByRole('group', { name: he.chooser, exact: true }).getByRole('button');
  await answers.first().click();
  await expect(answers.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.quest-instruction')).toHaveText(he.deliver);
  expect(events).toEqual([]);
  await page.getByRole('button', { name: he.pause, exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(he.paused);
  await page.getByRole('dialog').getByRole('button', { name: he.resume, exact: true }).click();
  const submitted = page.waitForResponse(response => response.url().endsWith('/api/games/event') && response.request().method() === 'POST');
  await page.locator('.quest-bottom-bar').getByRole('button', { name: he.deliverAction, exact: true }).click();
  const response = await submitted;
  const feedback = await response.json();
  expect(response.ok(), JSON.stringify(feedback)).toBeTruthy();
  expect(response.request().postDataJSON().attemptId).toBe(run.attemptId);
  expect(response.request().postDataJSON().answer).toBe(0);
  await expect(page.locator('.quest-feedback')).toContainText(feedback.explanation.he);
  expect(events).toEqual([0]);
  await page.locator('.quest-feedback').getByRole('button', { name: he.next, exact: true }).click();
  await expect(page.locator('.quest-instruction')).toHaveCount(0);
  await expect(page.locator('.quest-question-index')).toContainText('2');
});

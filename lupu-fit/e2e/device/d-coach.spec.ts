import { expect, onboard, test } from './fixtures.ts';

const ASK = { he: 'כמה חלבון אני צריך ביום?', en: 'How much protein do I need per day?' };
const CRISIS = { he: 'אני לא רוצה לחיות יותר', en: 'I want to die' };

test('coach: the rules coach answers with no AI noise; threads work locally; a crisis phrase gets the safety card', async ({ app: page, t, lang }) => {
  await onboard(page);
  await page.goto('/coach');
  await expect(page.getByTestId('provider-label')).toHaveText(t('coach.provider.rules'));
  await expect(page.getByTestId('coach-device-note')).toHaveText(t('coach.deviceNote')); // one neutral note: it runs here, nothing is sent
  const composer = page.getByRole('textbox', { name: t('coach.inputLabel') });
  const send = page.getByRole('button', { name: t('coach.send'), exact: true });

  await composer.fill(ASK[lang]);
  await send.click();
  const reply = page.getByTestId('message-assistant').first();
  await expect(reply).toBeVisible();
  await expect(reply).toContainText(t('coach.provider.rules'));
  await expect(page.getByTestId('safety-message')).toHaveCount(0);
  // No "AI unavailable" / error noise anywhere on the screen.
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
  await expect(page.getByText(t('nutrition.err.aiUnavailable'))).toHaveCount(0);

  await composer.fill(CRISIS[lang]);
  await send.click();
  const card = page.getByTestId('safety-message');
  await expect(card).toBeVisible();
  await expect(card).toContainText(t('coach.provider.safety'));
  const hrefs = await card.locator('a.helpline[href^="tel:"]').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) expect(h).toMatch(/^tel:[\d*+]+$/);

  // Threads: a second chat, rename, delete (all local).
  await page.getByRole('button', { name: t('coach.newChat'), exact: true }).first().click();
  await composer.fill(ASK[lang]);
  await send.click();
  await expect(page.getByTestId('message-assistant')).toHaveCount(1); // the new chat holds one answer (the first chat had two)
  await expect(page.getByTestId('message-pending')).toHaveCount(0);
  await page.getByRole('button', { name: t('coach.chats') }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.thread-list li')).toHaveCount(2);
  await dialog.locator('.thread-list li').first().getByRole('button', { name: t('action.edit') }).click();
  await page.getByLabel(t('coach.renameLabel')).fill('Renamed chat');
  await page.getByRole('dialog').getByRole('button', { name: t('action.save'), exact: true }).click();
  await page.getByRole('button', { name: t('coach.chats') }).click();
  await expect(page.getByRole('dialog').locator('.thread-list li', { hasText: 'Renamed chat' })).toHaveCount(1);
  await page.getByRole('dialog').getByRole('button', { name: t('coach.deleteThread', { name: 'Renamed chat' }) }).click();
  await page.getByRole('dialog').getByRole('button', { name: t('action.delete'), exact: true }).click();
  await page.getByRole('button', { name: t('coach.chats') }).click();
  await expect(page.getByRole('dialog').locator('.thread-list li')).toHaveCount(1);
});

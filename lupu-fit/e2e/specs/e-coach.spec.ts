import { expect, test } from '../fixtures.ts';

const ASK = { he: 'כמה חלבון אני צריך ביום?', en: 'How much protein do I need per day?' };
const CRISIS = { he: 'אני לא רוצה לחיות יותר', en: 'I want to die' };

test('coach: no AI configured -> rules reply; crisis phrase -> safety card with helplines, never AI', async ({ app: page, seed, t, lang }) => {
  await seed();
  await page.goto('/coach');
  const composer = page.getByRole('textbox', { name: t('coach.inputLabel') });
  const send = page.getByRole('button', { name: t('coach.send'), exact: true });
  const answers: { provider: string | null; safetyCategory: string | null }[] = [];
  page.on('response', async (r) => {
    if (r.request().method() === 'POST' && /\/api\/coach\/threads\/[^/]+\/messages$/.test(r.url())) {
      answers.push(((await r.json()) as { assistant: { provider: string | null; safetyCategory: string | null } }).assistant);
    }
  });

  await composer.fill(ASK[lang]);
  await send.click();
  const reply = page.getByTestId('message-assistant').first();
  await expect(reply).toBeVisible();
  await expect(reply).toContainText(t('coach.provider.rules'));
  await expect(page.getByTestId('safety-message')).toHaveCount(0);
  expect(answers[0]?.provider).toBe('rules');

  await composer.fill(CRISIS[lang]);
  await send.click();
  const card = page.getByTestId('safety-message');
  await expect(card).toBeVisible();
  await expect(card).toContainText(t('coach.provider.safety'));
  const links = card.locator('a.helpline[href^="tel:"]');
  expect(await links.count()).toBeGreaterThan(0);
  for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''))) expect(href).toMatch(/^tel:[\d*+]+$/);
  // The deterministic shield answers before any provider is consulted.
  expect(answers[1]).toMatchObject({ provider: 'safety', safetyCategory: 'self_harm' });
  expect(answers).toHaveLength(2);
});

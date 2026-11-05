// Definition-of-Done flow on the web build (Playwright, no test runner dependency).
// Register → onboarding → AI plan → edit section → roadmap → complete task → advisor chat →
// finance assumption → reload (persistence) → Hebrew/RTL screenshots.
// Env: BASE_URL (web build), ART (artifacts dir, default e2e/artifacts)
import { createRequire } from 'node:module';
// Playwright may be installed globally (CI image) or locally; resolve via CommonJS require.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const ART = process.env.ART ?? 'e2e/artifacts';
mkdirSync(ART, { recursive: true });

const results = [];
const email = `e2e+${Date.now()}@example.com`;
const password = 'Str0ngPass!';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await context.addInitScript(() => {
  if (!localStorage.getItem('businessai.pref.locale')) localStorage.setItem('businessai.pref.locale', 'en');
});
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(String(e)));

async function step(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log(`PASS ${name}`);
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - started, error: String(err).slice(0, 500) });
    console.log(`FAIL ${name}: ${String(err).slice(0, 300)}`);
  }
  await page.screenshot({ path: `${ART}/${String(results.length).padStart(2, '0')}-${name}.png` }).catch(() => {});
}
const btn = (name) => page.getByRole('button', { name, exact: false }).first();

await step('sign-up', async () => {
  await page.goto(BASE);
  await page.getByText('Create an account').first().click({ timeout: 20000 });
  await page.getByLabel('Name').first().fill('Dana Levi');
  await page.getByLabel('Email').first().fill(email);
  await page.getByLabel('Password', { exact: true }).first().fill(password);
  await btn('Create account').click();
  await page.getByText(/business|idea/i).first().waitFor({ timeout: 20000 });
});

await step('onboarding', async () => {
  const idea = page.getByRole('textbox').first();
  await idea.waitFor({ timeout: 15000 });
  await idea.fill('A neighbourhood bakery in Haifa selling sourdough bread and pastries, with weekly subscription boxes for offices.');
  await btn('Continue').click();
  // country
  const search = page.getByRole('textbox').first();
  await search.fill('Israel');
  await page.getByText('Israel', { exact: true }).first().click();
  await btn('Continue').click();
  // budget
  await page.getByRole('textbox').first().fill('40000');
  await btn('Continue').click();
  // remaining questions: skip until the review step appears
  for (let i = 0; i < 8; i += 1) {
    if (await btn('Create my business plan').isVisible().catch(() => false)) break;
    const before = await page.getByText(/Step \d of 8/).first().textContent().catch(() => '');
    await btn('Skip').click({ timeout: 10000 });
    await page.waitForFunction((prev) => !document.body.innerText.includes(prev || '§'), before, { timeout: 10000 }).catch(() => {});
  }
  await btn('Create my business plan').click({ timeout: 15000 });
});

await step('plan-generated', async () => {
  await page.getByText('Executive summary').first().waitFor({ timeout: 120000 });
});

await step('edit-section', async () => {
  await page.getByText('Executive summary').first().click();
  await btn('Edit').click({ timeout: 15000 });
  const field = page.getByRole('textbox').first();
  await field.fill('Edited by E2E: a focused sourdough bakery with office subscriptions.');
  await btn('Save').click();
  await page.getByText('Edited by E2E').first().waitFor({ timeout: 20000 });
});

await step('roadmap-complete-task', async () => {
  await page.goto(`${BASE}/roadmap`);
  const box = page.getByRole('checkbox').first();
  await box.waitFor({ timeout: 30000 });
  await box.click();
  await page.waitForTimeout(1500);
  const checked = await box.getAttribute('aria-checked');
  if (checked !== 'true') throw new Error(`task checkbox aria-checked=${checked}`);
});

await step('advisor-chat', async () => {
  await page.goto(`${BASE}/advisor/new?prompt=${encodeURIComponent('What should I do this week?')}`);
  await page.getByRole('textbox').first().waitFor({ timeout: 20000 });
  await btn('Send').click();
  await page.waitForFunction(() => document.body.innerText.length > 400, null, { timeout: 60000 });
  await page.waitForTimeout(3000);
});

await step('finance-add-revenue', async () => {
  await page.goto(`${BASE}/finance/line/revenue/new`);
  const boxes = page.getByRole('textbox');
  await boxes.first().waitFor({ timeout: 20000 });
  await boxes.nth(0).fill('Sourdough loaf');
  await boxes.nth(1).fill('28');
  await boxes.nth(2).fill('9');
  await boxes.nth(3).fill('600');
  await btn('Save').click();
  await page.goto(`${BASE}/finance`);
  await page.getByText(/break-even/i).first().waitFor({ timeout: 20000 });
});

await step('reload-persistence', async () => {
  await page.goto(`${BASE}/plan`);
  await page.reload();
  await page.getByText('Executive summary').first().waitFor({ timeout: 30000 });
});

// Hebrew / RTL screenshots of key screens
await step('hebrew-rtl', async () => {
  await page.goto(`${BASE}/settings`);
  await page.getByText('עברית').first().click({ timeout: 20000 });
  await btn('Switch and restart').click({ timeout: 10000 });
  await page.waitForTimeout(4000);
  for (const path of ['/', '/plan', '/roadmap', '/finance', '/advisor', '/workspace']) {
    await page.goto(`${BASE}${path}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${ART}/he${path.replace(/\//g, '_') || '_home'}.png` });
  }
  const dir = await page.evaluate(() => document.documentElement.dir);
  if (dir !== 'rtl') throw new Error(`document dir=${dir}`);
});

await step('dark-mode', async () => {
  const dark = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', storageState: await context.storageState() });
  const p = await dark.newPage();
  for (const path of ['/', '/plan']) {
    await p.goto(`${BASE}${path}`);
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${ART}/dark${path.replace(/\//g, '_') || '_home'}.png` });
  }
  await dark.close();
});

writeFileSync(`${ART}/results.json`, JSON.stringify({ email, results, consoleErrors: consoleErrors.slice(0, 50) }, null, 2));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} steps passed`);
process.exit(failed.length ? 1 : 0);

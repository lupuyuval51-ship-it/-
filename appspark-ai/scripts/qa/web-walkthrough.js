// Playwright walkthrough of the exported web build. Produces screenshots + a console/error log.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const base = process.argv[2] || 'http://localhost:4173';
const out = process.argv[3] || path.join(__dirname, 'shots');
fs.mkdirSync(out, { recursive: true });
const log = [];
const errors = [];

async function shot(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false });
  log.push(`shot ${name} @ ${page.url()}`);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'he-IL', colorScheme: 'dark' });
  const page = await context.newPage();
  page.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) log.push(`console.${msg.type()}: ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, '01-onboarding-welcome');
  await page.getByTestId('onboarding-next').click();
  await shot(page, '02-onboarding-interests');
  await page.getByTestId('interest-ai').click();
  await page.getByTestId('interest-games').click();
  await page.getByTestId('onboarding-next').click();
  await page.waitForTimeout(300);
  await page.getByTestId('onboarding-next').click();
  await page.waitForTimeout(300);
  await page.getByTestId('onboarding-next').click();
  await page.waitForTimeout(300);
  await page.getByTestId('onboarding-next').click();
  await page.waitForTimeout(300);
  await shot(page, '03-onboarding-finish');
  await page.getByTestId('onboarding-next').click();
  await page.waitForTimeout(1200);
  await shot(page, '04-discover');
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(600);
  await shot(page, '05-discover-scrolled');
  await page.mouse.wheel(0, -2000);
  await page.waitForTimeout(400);

  // open featured idea
  await page.getByTestId('featured-card').click();
  await page.waitForTimeout(1200);
  await shot(page, '06-idea');
  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(500);
  await shot(page, '07-idea-scrolled');
  // save it
  await page.locator('[data-testid="save-header"], [data-testid^="save-"]:visible').first().click();
  await page.waitForTimeout(600);
  await shot(page, '08-idea-saved-toast');
  await page.getByTestId('create-prompt').click();
  await page.waitForTimeout(1200);
  await shot(page, '09-prompt-studio');
  await page.getByTestId('scope-complete').click();
  await page.waitForTimeout(500);
  await page.getByTestId('copy-prompt').click();
  await page.waitForTimeout(500);
  await shot(page, '10-prompt-copied');
  await page.getByTestId('save-prompt').click();
  await page.waitForTimeout(500);
  await shot(page, '11-prompt-save-sheet');
  await page.getByTestId('confirm-save-prompt').click();
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, 2500);
  await page.waitForTimeout(500);
  await shot(page, '12-prompt-saved-list');

  // search
  await page.goto(base + '/search?category=games', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot(page, '13-search-category');
  await page.getByTestId('open-filters').click();
  await page.waitForTimeout(600);
  await shot(page, '14-search-filters');
  await page.keyboard.press('Escape');

  // tabs
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.getByTestId('tab-generate').click();
  await page.waitForTimeout(800);
  await shot(page, '15-generate');
  await page.getByTestId('generator-brief').fill('אני רוצה רעיון למשחק שאפשר לבנות לבד ושיש לו פוטנציאל להפוך לוויראלי.');
  await page.getByTestId('generate-button').click();
  await page.waitForTimeout(2500);
  await page.mouse.wheel(0, 2200);
  await page.waitForTimeout(600);
  await shot(page, '16-generate-results');
  await page.getByTestId('tab-saved').click();
  await page.waitForTimeout(800);
  await shot(page, '17-saved');
  await page.getByRole('tab', { name: /^פרויקטים/ }).click();
  await page.waitForTimeout(500);
  await shot(page, '18-saved-projects');
  await page.getByTestId('tab-profile').click();
  await page.waitForTimeout(800);
  await shot(page, '19-profile');

  // switch to English + light
  await page.getByText('English').first().click();
  await page.waitForTimeout(600);
  await page.getByText('Light').first().click();
  await page.waitForTimeout(600);
  await shot(page, '20-profile-en-light');
  await page.getByTestId('tab-index').click();
  await page.waitForTimeout(900);
  await shot(page, '21-discover-en-light');
  await page.getByTestId('featured-card').click();
  await page.waitForTimeout(900);
  await shot(page, '22-idea-en-light');

  // reload persistence check: saved idea should persist
  await page.goto(base + '/saved', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot(page, '23-saved-after-reload');

  fs.writeFileSync(path.join(out, 'log.txt'), [...log, ...errors].join('\n'));
  console.log(log.join('\n'));
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch((e) => { console.error('FAILED', e); fs.writeFileSync(path.join(out, 'log.txt'), [...log, ...errors, 'FAILED ' + e.message].join('\n')); process.exit(1); });

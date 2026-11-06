import { expect, onboard, test } from './fixtures.ts';

test('login / register / forgot routes never show a form: they go to welcome before setup and to Home after it; unknown routes go Home', async ({ app: page, t }) => {
  for (const r of ['/login', '/register', '/forgot-password']) {
    await page.goto(r);
    await expect(page).toHaveURL(/\/welcome$/); // not onboarded yet
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  }
  // First launch: the welcome page says where the data lives.
  await expect(page.getByText(t('welcome.deviceData'))).toBeVisible();
  await onboard(page);
  for (const r of ['/login', '/register', '/forgot-password', '/does-not-exist']) {
    await page.goto(r);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.hero-card')).toBeVisible();
  }
  // Welcome is only for first launch.
  await page.goto('/welcome');
  await expect(page).toHaveURL(/\/$/);
});

test('food log: no AI photo tile; barcode lookup is optional, calm offline and on failure, and never blocks manual logging', async ({ app: page, t, lang, allowOffOrigin }, info) => {
  void info;
  allowOffOrigin(/^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\/\d+\.json/); // the one deliberate internet use, blocked by this test's network cut
  await onboard(page);
  await page.goto('/nutrition/log');
  const tiles = page.locator('.nu-tile');
  await expect(tiles).toHaveCount(3);
  await expect(page.getByRole('button', { name: new RegExp(t('nutrition.log.mode.photo')) })).toHaveCount(0);

  await page.getByRole('button', { name: new RegExp(t('nutrition.log.mode.barcode')) }).click();
  // Phone offline: one calm sentence, the field and the button stay usable.
  await page.evaluate(() => { Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }); window.dispatchEvent(new Event('offline')); });
  await expect(page.getByTestId('barcode-offline')).toHaveText(t('nutrition.barcode.offlineNote'));
  await page.getByLabel(t('nutrition.barcode.number')).fill('7290000000001');
  const lookup = page.getByRole('button', { name: t('nutrition.barcode.lookup'), exact: true });
  await expect(lookup).toBeEnabled();
  // "Online" but the service is unreachable (blocked): the failure is explained once, as text, with the way forward.
  await page.evaluate(() => { Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true }); window.dispatchEvent(new Event('online')); });
  await lookup.click();
  await expect(page.getByTestId('barcode-error')).toHaveText(t('nutrition.err.lookupFailed'));
  await expect(page.getByTestId('barcode-offline')).toHaveCount(0);
  await expect(page.getByLabel(t('nutrition.barcode.number'))).toBeEnabled();

  // Manual add still works right there: "Quick add" logs without any network.
  await page.getByRole('button', { name: new RegExp(t('nutrition.log.mode.quick')) }).click();
  await page.getByLabel(t('nutrition.quick.name')).fill('Manual snack');
  await page.getByLabel(t('unit.kcal'), { exact: true }).fill('250');
  await page.getByRole('button', { name: t('nutrition.quick.add'), exact: true }).click();
  await expect(page.getByText(t('nutrition.log.added'))).toBeVisible();
  await page.goto('/nutrition');
  await expect(page.locator('.nu-entries li', { hasText: 'Manual snack' })).toHaveCount(1);
});

test('the built app has no runtime reference to any host except Open Food Facts (barcode) and namespace/documentation strings', async () => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const { join, extname } = await import('node:path');
  const dist = process.env['E2E_DEVICE_DIST'] ?? '/tmp/e2e-device-dist';
  const files: string[] = [];
  const walk = (d: string): void => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) { if (e !== 'media') walk(p); } else if (['.js', '.css', '.html', '.webmanifest', '.json', '.svg'].includes(extname(p))) files.push(p); } };
  walk(dist);
  expect(files.length).toBeGreaterThan(20);
  // Not network calls: XML/SVG namespaces, JSON-schema ids, React/Router error-message links, a polyfill comment, localhost in a bundled library.
  const NOT_A_REQUEST = [/^https?:\/\/www\.w3\.org\//, /^https?:\/\/json-schema\.org\//, /^https:\/\/react\.dev\//, /^https:\/\/reactrouter\.com\//, /^https:\/\/github\.com\/ungap\//, /^http:\/\/localhost$/, /^https?:\/\/\[\$\{/ /* a bundled URL helper's template for IPv6 hosts */];
  const OFF = /^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\//;
  const found = new Map<string, string>();
  for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)) { const u = m[0].replace(/[.,;]+$/, ''); if (!NOT_A_REQUEST.some((re) => re.test(u)) && !OFF.test(u)) found.set(u, f.replace(dist, '')); }
  expect([...found].map(([u, f]) => `${u} (${f})`)).toEqual([]);
  // The one allowed host is referenced exactly where the worker does the lookup.
  const worker = files.filter((f) => /deviceWorker/.test(f)).map((f) => readFileSync(f, 'utf8')).join('');
  expect(worker).toContain('world.openfoodfacts.org');
  // Fonts, icons, manifest and media are packaged files the page refers to by absolute path from its own origin.
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  expect(html).not.toMatch(/(?:src|href)="https?:/);
  expect(readFileSync(join(dist, 'sw.js'), 'utf8')).not.toMatch(/fetch\(\s*['"`]https?:/);
});

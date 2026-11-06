import { expect, freshContext, onboard, test } from './fixtures.ts';

/**
 * The Android export path, run in desktop Chromium with a FAKE native bridge. Capacitor decides it is on Android when `window.androidBridge`
 * exists, and routes every plugin call that has a header in `Capacitor.PluginHeaders` through `Capacitor.nativePromise` (normally installed
 * by the native bridge script). Here that function is a recorder: it sees exactly the plugin, method and options the Kotlin side would get,
 * and answers like the plugins do. What this proves: the app's code takes the native branch, calls Filesystem.writeFile and then
 * Share.share with the uri it got back, treats "Share canceled" as silence, and shows real errors. What it cannot prove: that the Kotlin
 * plugins, the FileProvider and the share sheet behave on a real device (see docs/ANDROID.md, manual test).
 */
interface Call { plugin: string; method: string; options: Record<string, unknown> }
declare global { interface Window { __calls: Call[]; __shareMode: 'ok' | 'cancel' | 'fail'; __writeFails: boolean; __files: Record<string, string>; __docs: boolean } }

function installFakeAndroid(): void {
  const w = window as unknown as Record<string, unknown> & Window;
  w.__calls = []; w.__shareMode = 'ok'; w.__writeFails = false; w.__files = {}; w.__docs = true;
  try { w.__docs = sessionStorage.getItem('fake-docs') !== '0'; } catch { /* about:blank has no storage */ } // survives a reload
  (w as unknown as { androidBridge: unknown }).androidBridge = { postMessage: () => undefined };
  const m = (...names: string[]) => names.map((name) => ({ name, rtype: 'promise' }));
  (w as unknown as { Capacitor: unknown }).Capacitor = {
    PluginHeaders: [
      { name: 'Filesystem', methods: m('writeFile', 'readdir', 'deleteFile', 'checkPermissions') },
      { name: 'Share', methods: m('share', 'canShare') },
    ],
    nativePromise: async (plugin: string, method: string, options: Record<string, unknown> = {}) => {
      w.__calls.push({ plugin, method, options: JSON.parse(JSON.stringify(options)) as Record<string, unknown> });
      if (plugin === 'Filesystem') {
        if (method === 'checkPermissions') return { publicStorage: w.__docs ? 'granted' : 'prompt' };
        if (method === 'readdir') return { files: [{ name: 'lupu-fit-backup-2020-01-01.json', type: 'file' }, { name: 'keep-me.txt', type: 'file' }] };
        if (method === 'deleteFile') return {};
        if (method === 'writeFile') {
          if (w.__writeFails) throw Object.assign(new Error('No space left on device'), { code: 'OS-PLUG-FILE-0013' });
          const dir = options['directory'] === 'DOCUMENTS' ? 'files/Documents' : 'cache';
          const uri = `file:///data/user/0/app.lupufit/${dir}/${String(options['path'])}`;
          w.__files[uri] = String(options['data']);
          return { uri };
        }
      }
      if (plugin === 'Share') {
        if (method === 'canShare') return { value: true };
        if (w.__shareMode === 'cancel') throw new Error('Share canceled');
        if (w.__shareMode === 'fail') throw new Error('No Activity found to handle Intent');
        return { activityType: 'com.google.android.apps.docs' };
      }
      return {};
    },
  };
}

test('Android app (fake native bridge): Export writes cache/backups/lupu-fit-backup-<date>.json, then opens the share sheet with that uri; cancel is silent; failures are explained; Documents copy is explicit', async ({ browser, t, lang }, info) => {
  test.setTimeout(240_000);
  const fresh = await freshContext(browser, info, lang, installFakeAndroid);
  const page = fresh.page;
  await onboard(page);
  await page.goto('/profile');

  // The app took the native branch: no browser Share row, no <a download>.
  await expect(page.getByRole('button', { name: new RegExp(`^${t('action.share')}`) })).toHaveCount(0);
  const downloads: string[] = [];
  page.on('download', (d) => downloads.push(d.suggestedFilename()));
  const calls = () => page.evaluate(() => window.__calls.filter((c) => c.plugin === 'Filesystem' || c.plugin === 'Share'));
  const clear = () => page.evaluate(() => { window.__calls.length = 0; });

  // 1) Export -> write then share, with that file's uri and nothing else.
  await clear();
  await page.getByRole('button', { name: new RegExp(`^${t('profile.backup.export')}`) }).click();
  await expect(page.getByText(t('profile.backup.sharedToast'))).toBeVisible();
  const c1 = await calls();
  const write = c1.find((c) => c.method === 'writeFile');
  const share = c1.find((c) => c.method === 'share');
  expect(write, 'writeFile called').toBeTruthy(); expect(share, 'share called').toBeTruthy();
  expect(c1.findIndex((c) => c.method === 'writeFile')).toBeLessThan(c1.findIndex((c) => c.method === 'share'));
  expect(String(write?.options['path'])).toMatch(/^backups\/lupu-fit-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(write?.options).toMatchObject({ directory: 'CACHE', encoding: 'utf8', recursive: true });
  const text = String(write?.options['data']);
  const parsed = JSON.parse(text) as { backup: { version: number; profile: unknown }; clientSettings?: unknown };
  expect(parsed.backup.version).toBe(2); expect(parsed.backup.profile).not.toBeNull(); expect(parsed.clientSettings).toBeTruthy();
  const uri = await page.evaluate(() => Object.keys(window.__files)[0]);
  expect(uri).toMatch(/^file:\/\/\/data\/user\/0\/app\.lupufit\/cache\/backups\/lupu-fit-backup-/);
  expect(share?.options['files']).toEqual([uri]);
  expect(Object.keys(share?.options ?? {}).sort()).toEqual(['dialogTitle', 'files', 'title']); // no url/text: one file, once
  // Older backup copies in the private cache are cleaned up; foreign files are not touched.
  await expect.poll(async () => (await calls()).filter((c) => c.method === 'deleteFile').map((c) => String(c.options['path']))).toEqual(['backups/lupu-fit-backup-2020-01-01.json']);
  expect(downloads).toEqual([]);
  await expect(page.getByRole('alert')).toHaveCount(0);

  // 2) The share sheet is closed without choosing: nothing is shown.
  await page.evaluate(() => { window.__shareMode = 'cancel'; });
  await clear();
  await page.getByRole('button', { name: new RegExp(`^${t('profile.backup.export')}`) }).click();
  await expect.poll(async () => (await calls()).some((c) => c.method === 'share')).toBe(true);
  await page.waitForTimeout(500);
  await expect(page.getByRole('alert')).toHaveCount(0);

  // 3) The share sheet cannot open: a plain-words error that names the reason.
  await page.evaluate(() => { window.__shareMode = 'fail'; });
  await page.getByRole('button', { name: new RegExp(`^${t('profile.backup.export')}`) }).click();
  await expect(page.getByRole('alert')).toContainText(t('profile.backup.errShare'));
  await expect(page.getByRole('alert')).toContainText('No Activity found to handle Intent');

  // 4) The file cannot be written (disk full): the share sheet is never opened.
  // (The export route allows 3 per minute per person, like the hosted one: wait out the window the three exports above used.)
  await page.waitForTimeout(61_000);
  await page.evaluate(() => { window.__shareMode = 'ok'; window.__writeFails = true; });
  await clear();
  await page.getByRole('button', { name: new RegExp(`^${t('profile.backup.export')}`) }).click();
  await expect(page.getByRole('alert')).toContainText(t('profile.backup.errWrite'));
  await expect(page.getByRole('alert')).toContainText('No space left on device');
  expect((await calls()).some((c) => c.method === 'share')).toBe(false);
  await page.evaluate(() => { window.__writeFails = false; });

  // 5) "Save to Documents" is a second, explicit button: Documents/LUPU-FIT/<name with time>, no share sheet, says where it went.
  await clear();
  await page.getByRole('button', { name: new RegExp(`^${t('profile.backup.saveDocs')}`) }).click();
  await expect(page.getByText(/Documents\/LUPU-FIT\/lupu-fit-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json/)).toBeVisible();
  const docs = (await calls()).find((c) => c.method === 'writeFile');
  expect(docs?.options).toMatchObject({ directory: 'DOCUMENTS', encoding: 'utf8', recursive: true });
  expect(String(docs?.options['path'])).toMatch(/^LUPU-FIT\/lupu-fit-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
  expect((await calls()).some((c) => c.method === 'share')).toBe(false);

  // 6) Without a permission-free Documents save the button is not offered, and the page says so.
  await page.evaluate(() => { sessionStorage.setItem('fake-docs', '0'); });
  await page.reload();
  await expect(page.getByText(t('profile.backup.noDocs'))).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(`^${t('profile.backup.saveDocs')}`) })).toHaveCount(0);

  fresh.watch.finish();
  await fresh.context.close();
});

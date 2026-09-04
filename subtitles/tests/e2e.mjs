/**
 * End-to-end check in a real browser.
 *
 * Loads the app, feeds it a media file, and verifies the produced subtitles.
 * Requires Playwright (`npm i -D playwright`, or an existing global install
 * pointed at by PLAYWRIGHT_PATH). Unlike `npm test` this downloads real models,
 * so expect it to take minutes on the first run.
 *
 *   node tests/e2e.mjs sample.mp4                 transcribe only
 *   node tests/e2e.mjs sample.mp4 he,es           also translate
 *   EXPECT=country node tests/e2e.mjs jfk.wav     assert a word in the transcript
 *   MODE=file node tests/e2e.mjs sample.mp4       open index.html straight from disk,
 *                                                 exercising the no-worker fallback
 *   CDN=http://localhost:8098/npm MODELS=http://localhost:8098/hf node tests/e2e.mjs ...
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sample = process.argv[2];
const targets = (process.argv[3] ?? '').split(',').filter(Boolean);
const model = process.env.MODEL ?? 'onnx-community/whisper-base';
const expect = process.env.EXPECT ?? '';
const port = Number(process.env.PORT ?? 8099);

if (!sample) {
  console.error('usage: node tests/e2e.mjs <media file> [target languages]');
  process.exit(2);
}

const playwright = await import(process.env.PLAYWRIGHT_PATH ?? 'playwright').catch(() => null);
if (!playwright) {
  console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}
const { chromium } = playwright.default ?? playwright;

const overrides = new URLSearchParams();
if (process.env.CDN) overrides.set('cdn', process.env.CDN);
if (process.env.MODELS) overrides.set('models', process.env.MODELS);

const fromDisk = process.env.MODE === 'file';
const server = fromDisk ? null : spawn('node', ['serve.js', String(port)], { cwd: root, stdio: 'ignore' });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
let failed = false;

try {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const page = await (await browser.newContext()).newPage();
  page.on('pageerror', (error) => console.log('[pageerror]', error.message));

  const target = fromDisk
    ? `file://${path.join(root, 'index.html')}?${overrides}`
    : `http://localhost:${port}/?${overrides}`;
  console.log('opening:', target);
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.setInputFiles('#file-input', path.resolve(sample));
  await page.waitForSelector('#file-card:not([hidden])');
  console.log('file:', await page.textContent('#file-info'));

  await page.selectOption('#model', model);
  await page.evaluate((wanted) => {
    for (const box of document.querySelectorAll('#target-list input[type=checkbox]')) {
      if (box.checked !== wanted.includes(box.value)) box.click();
    }
  }, targets);

  await page.click('#generate');
  const deadline = Date.now() + Number(process.env.TIMEOUT ?? 1800000);
  let previous = '';
  for (;;) {
    if (Date.now() > deadline) throw new Error('timed out');
    const status = await page.getAttribute('#status', 'class');
    const line = `${await page.textContent('#stage-label')} ${await page.textContent('#progress-percent')}`;
    if (line !== previous) {
      console.log('  ', line);
      previous = line;
    }
    if (status?.includes('done')) break;
    if (status?.includes('error')) throw new Error(await page.textContent('#status'));
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const tabs = await page.$$eval('#tabs .tab', (nodes) => nodes.map((node) => node.textContent));
  if (tabs.length !== targets.length + 1) {
    throw new Error(`expected ${targets.length + 1} subtitle tracks, got ${tabs.length}`);
  }

  for (let index = 0; index < tabs.length; index += 1) {
    await page.$$eval('#tabs .tab', (nodes, i) => nodes[i].click(), index);
    const cues = await page.$$eval('#cues textarea', (nodes) => nodes.map((node) => node.value));
    if (cues.length === 0) throw new Error(`track ${tabs[index]} is empty`);
    console.log(`\n[${tabs[index]}] ${cues.length} cues`);
    for (const cue of cues.slice(0, 5)) console.log('   ', cue);
    if (index === 0 && expect && !cues.join(' ').toLowerCase().includes(expect.toLowerCase())) {
      throw new Error(`transcript does not contain "${expect}"`);
    }
  }

  console.log('\nE2E PASS');
} catch (error) {
  failed = true;
  console.error('\nE2E FAIL:', error.message);
} finally {
  await browser.close();
  server?.kill();
}

process.exit(failed ? 1 : 0);

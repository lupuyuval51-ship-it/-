import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import test from 'node:test';

import { OUTPUT_PATH, buildPage } from '../build.js';

const built = await buildPage();
const committed = await fs.readFile(OUTPUT_PATH, 'utf8');

test('index.html is in sync with the sources', () => {
  assert.equal(
    committed,
    built,
    'index.html no longer matches src/ — run `node build.js` and commit the result',
  );
});

test('the markup pulls in no external files', () => {
  const markup = built.slice(0, built.indexOf('<script id="shared-source"'));
  const external = [...markup.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => !value.startsWith('data:') && !value.startsWith('#'));
  assert.deepEqual(external, [], `unexpected external references: ${external.join(', ')}`);
});

test('the page embeds the three script blocks it needs', () => {
  assert.ok(built.includes('<script id="shared-source" type="text/plain">'));
  assert.ok(built.includes('<script id="engine-source" type="text/plain">'));
  assert.ok(built.includes('<script type="module">'));
});

test('the shared module keeps its exports and the engine keeps createEngine', () => {
  assert.ok(built.includes('export function toSRT'), 'shared helpers stay a module');
  assert.ok(built.includes('export const LANGUAGES'), 'language table stays a module');
  assert.ok(
    built.includes('export function createEngine'),
    'the in-page fallback imports createEngine from the engine block',
  );
});

test('concatenated page code has no leftover module syntax', () => {
  const pageScript = built.slice(built.lastIndexOf('<script type="module">'));
  assert.ok(!/^import\s/m.test(pageScript), 'relative imports are stripped from the page bundle');
  assert.ok(!/^export\s/m.test(pageScript), 'exports are stripped from the page bundle');
});

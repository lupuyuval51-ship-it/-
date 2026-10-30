// Writes <build dir>/sw-assets.js: every built file the service worker should precache,
// plus a content hash that versions the cache (a new build replaces the old cache).
// Usage: node scripts/build-sw-assets.mjs [dist/client | dist/device]. The device build's list includes
// the PGlite WebAssembly files, so the app also starts offline in a browser.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, '..', process.argv[2] ?? path.join('dist', 'client'));
const skip = new Set(['sw.js', 'sw-assets.js', 'index.html']);
// Dish photos (~8 MB) are cached by the service worker when first viewed, not on install.
const lazyDirs = ['dishes/'];
const files = [];
(function walk(d) {
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (!skip.has(path.relative(dir, full)) && !entry.name.endsWith('.map') && !lazyDirs.some((d) => path.relative(dir, full).split(path.sep).join('/').startsWith(d))) files.push('/' + path.relative(dir, full).split(path.sep).join('/'));
  }
})(dir);
files.sort();
const hash = crypto.createHash('sha256');
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(dir, f)));
hash.update(fs.readFileSync(path.join(dir, 'index.html')));
const version = hash.digest('hex').slice(0, 12);
fs.writeFileSync(path.join(dir, 'sw-assets.js'), `self.__SW_VERSION__=${JSON.stringify(version)};\nself.__SW_ASSETS__=${JSON.stringify(files)};\n`);
console.log(`sw-assets: ${files.length} files, version ${version}`);

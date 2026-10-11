// Writes dist/client/sw-assets.js: every built file the service worker should precache,
// plus a content hash that versions the cache (a new build replaces the old cache).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, '..', 'dist', 'client');
const skip = new Set(['sw.js', 'sw-assets.js', 'index.html']);
const files = [];
(function walk(d) {
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (!skip.has(path.relative(dir, full)) && !entry.name.endsWith('.map')) files.push('/' + path.relative(dir, full).split(path.sep).join('/'));
  }
})(dir);
files.sort();
const hash = crypto.createHash('sha256');
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(dir, f)));
hash.update(fs.readFileSync(path.join(dir, 'index.html')));
const version = hash.digest('hex').slice(0, 12);
fs.writeFileSync(path.join(dir, 'sw-assets.js'), `self.__SW_VERSION__=${JSON.stringify(version)};\nself.__SW_ASSETS__=${JSON.stringify(files)};\n`);
console.log(`sw-assets: ${files.length} files, version ${version}`);

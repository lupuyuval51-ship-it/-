// Builds the two editions into dist/<edition>/ as ready-to-wrap web folders (for Capacitor or any static host).
//   fitness: general-fitness edition (flag off)       ninja: ninja-only edition (flag on)
// Usage: node tools/build-variants.mjs [fitness|ninja]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDITIONS = { fitness: { flag: 'false', cache: 'ninja-circuit' }, ninja: { flag: 'true', cache: 'ninja-only' } };
const MEDIA = ['icons', 'videos', 'ex', 'workouts', 'food'];
const want = process.argv[2] ? [process.argv[2]] : Object.keys(EDITIONS);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
if (!html.includes('/*@ninja-only*/false')) throw new Error('ninja-only flag placeholder not found in index.html');

for (const name of want) {
  const e = EDITIONS[name]; if (!e) throw new Error('unknown edition: ' + name);
  const out = path.join(root, 'dist', name);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), html.replace('/*@ninja-only*/false', '/*@ninja-only*/' + e.flag));
  const ver = (sw.match(/-v(\d+)'/) || [])[1] || '1';
  fs.writeFileSync(path.join(out, 'sw.js'), sw.replace(/const CACHE = '[^']*'/, `const CACHE = '${e.cache}-v${ver}'`));
  fs.copyFileSync(path.join(root, 'manifest.webmanifest'), path.join(out, 'manifest.webmanifest'));
  for (const d of MEDIA) if (fs.existsSync(path.join(root, d))) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
  console.log(name + ' -> ' + path.relative(root, out));
}

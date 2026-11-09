// Syntax gate for every first-party JavaScript module (the project has no compile step).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const roots = ['server.js', 'src', 'public', 'scripts', 'tests', 'tools'];
const skip = new Set([path.join('public', 'vendor')]);
const files = [];
function walk(p) {
  if (!fs.existsSync(p) || skip.has(p)) return;
  const st = fs.statSync(p);
  if (st.isDirectory()) for (const x of fs.readdirSync(p).sort()) walk(path.join(p, x));
  else if (/\.(js|mjs)$/.test(p)) files.push(p);
}
for (const r of roots) walk(r);
// One node process per batch keeps this fast as the module count grows.
for (let i = 0; i < files.length; i += 40) {
  for (const f of files.slice(i, i + 40)) {
    const r = spawnSync(process.execPath, ['--check', f], { stdio: 'inherit' });
    if (r.status) process.exit(r.status);
  }
}
console.log(`typecheck/syntax: ${files.length} modules OK`);

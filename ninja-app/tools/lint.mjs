// Extracts the app script from index.html and lints it. Usage: node tools/lint.mjs (needs eslint installed)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const blocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const app = blocks.reduce((a, b) => (b.length > a.length ? b : a), '');
const target = path.join(root, 'tools', 'lint-target.js');
fs.writeFileSync(target, app);
const r = spawnSync('npx', ['eslint', target], { cwd: root, stdio: 'inherit' });
fs.rmSync(target, { force: true });
process.exit(r.status ?? 1);

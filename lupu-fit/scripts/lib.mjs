import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(process.env.LINT_ROOT ?? join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const SKIP = new Set(['node_modules', 'dist', 'dist-device', 'dist-hosted', '.git', 'android', 'coverage', 'playwright-report', 'test-results', 'media']);

export function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

export const read = (p) => readFileSync(p, 'utf8');
export const rel = (p) => relative(REPO_ROOT, p);

export function report(tool, violations) {
  if (violations.length === 0) {
    console.log(`${tool}: 0 violations`);
    return 0;
  }
  for (const v of violations) console.error(`${tool}: ${v}`);
  console.error(`${tool}: ${violations.length} violation(s)`);
  return 1;
}

/** line number for an index in text */
export const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

#!/usr/bin/env node
/** Static security scan for server/, client/ and shared/ sources. */
import { join } from 'node:path';
import { REPO_ROOT, walk, read, rel, report, lineOf } from './lib.mjs';

const dirs = ['server', 'client', 'shared'].map((d) => join(REPO_ROOT, d));
const files = dirs.flatMap((d) => walk(d, ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.html']));
const v = [];

const RULES = [
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/g],
  ['eval()', /(?<![\w.])eval\s*\(/g],
  ['new Function()', /new\s+Function\s*\(/g],
  ['SQL string interpolation', /`[^`]*?\b(?:SELECT\s[^`]*?\sFROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b[^`]*?\$\{/gi],
  ['SQL string concatenation', /['"`]\s*(?:SELECT|INSERT|UPDATE|DELETE)\b[^'"`\n]*['"`]\s*\+/gi],
  ['auth token in web storage', /(?:local|session)Storage\s*\.\s*setItem\s*\(\s*[^,)]*(?:token|password|passwd|secret|session|csrf|credential)/gi],
  ['Google API key literal', /AIza[0-9A-Za-z_-]{35}/g],
  ['Gemini AQ key literal', /\bAQ\.[A-Za-z0-9_-]{20,}/g],
  ['Anthropic key literal', /sk-ant-[A-Za-z0-9_-]{20,}/g],
  ['AI key referenced in client code', /(?:GEMINI_API_KEY|ANTHROPIC_API_KEY)/g],
];

for (const f of files) {
  const text = read(f);
  const inClient = rel(f).startsWith('client');
  const isTest = /\.test\.|[\\/]test[\\/]|__fixtures__/.test(f);
  for (const [name, re] of RULES) {
    if (name === 'AI key referenced in client code' && !inClient) continue;
    if (isTest && !/literal/.test(name)) { /* tests may contain SQL fixtures */ }
    for (const m of text.matchAll(re)) {
      const line = text.split('\n')[lineOf(text, m.index) - 1] ?? '';
      if (line.includes('scan-ok')) continue;
      v.push(`${rel(f)}:${lineOf(text, m.index)} ${name}`);
    }
  }
}
process.exit(report('security-scan', v));

// Copy lock for the E2E suite: every static string an e2e spec looks up by role name, label, text,
// placeholder or test id must still exist in the app (English locale templates or source). Redesign
// work changes markup and copy a lot; this catches a renamed button before an 8-minute Playwright run.
// Strings that never matched (data typed by the test, server content) are tracked in a baseline that
// may only shrink. Run with --update after an intentional change that also updates the spec.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const baselineFile = path.join(root, 'scripts', 'e2e-strings-baseline.json');

const read = (p) => fs.readFileSync(p, 'utf8');
function files(dir, test) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') out.push(...files(p, test));
    } else if (test(e.name)) out.push(p);
  }
  return out;
}

// 1. Strings the specs look for.
const LOCATOR = /getBy(Role|Label|Text|Placeholder|TestId)\(\s*(?:'[^']*'\s*,\s*\{[^}]*?name:\s*)?(?:'((?:[^'\\]|\\.)*)'|`([^`$]*)`)/g;
const NAMED = /getByRole\(\s*'[^']*'\s*,\s*\{[^}]*?name:\s*(?:'((?:[^'\\]|\\.)*)'|`([^`$]*)`)/g;
const wanted = new Map();
for (const f of files(path.join(root, 'e2e'), (n) => n.endsWith('.ts'))) {
  const src = read(f);
  const add = (s) => {
    if (s && /\p{L}/u.test(s) && !wanted.has(s)) wanted.set(s, path.relative(root, f));
  };
  for (const m of src.matchAll(NAMED)) add((m[1] ?? m[2])?.replace(/\\'/g, "'"));
  for (const m of src.matchAll(LOCATOR)) if (m[1] !== 'Role') add((m[2] ?? m[3])?.replace(/\\'/g, "'"));
}

// 2. What the app can render: source text plus English message templates ({x} matches anything).
const corpus = [
  ...files(path.join(root, 'client', 'src'), (n) => /\.(tsx?|css)$/.test(n) && !/\.test\./.test(n)),
  ...files(path.join(root, 'shared'), (n) => n.endsWith('.ts') && !/\.test\./.test(n)),
  ...files(path.join(root, 'server', 'src'), (n) => /\.(ts|sql|json)$/.test(n) && !/\.test\./.test(n)),
]
  .map(read)
  .join('\n');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = [];
for (const f of files(path.join(root, 'client', 'src', 'i18n', 'locales', 'en'), (n) => n.endsWith('.ts'))) {
  for (const m of read(f).matchAll(/'((?:[^'\\]|\\.)*\{\w+\}(?:[^'\\]|\\.)*)'/g)) {
    const t = m[1].replace(/\\'/g, "'");
    templates.push(new RegExp(t.split(/\{\w+\}/).map(esc).join('.+?')));
  }
}
const found = (s) => corpus.includes(s) || templates.some((re) => re.test(s));

const missing = [...wanted.keys()].filter((s) => !found(s)).sort();
if (process.argv.includes('--update') || !fs.existsSync(baselineFile)) {
  fs.writeFileSync(baselineFile, JSON.stringify(missing, null, 2) + '\n');
  console.log(`e2e-strings: baseline written (${missing.length} strings not found in source; ${wanted.size} checked)`);
  process.exit(0);
}
const known = new Set(JSON.parse(read(baselineFile)));
const broken = missing.filter((s) => !known.has(s));
if (broken.length) {
  for (const s of broken) console.error(`${wanted.get(s)}: e2e looks for ${JSON.stringify(s)} but the app no longer contains it`);
  console.error(`e2e-strings: ${broken.length} string(s) disappeared; restore the copy or update the spec, then run with --update`);
  process.exit(1);
}
const fixed = [...known].filter((s) => !missing.includes(s)).length;
console.log(`e2e-strings: OK (${wanted.size} strings checked${fixed ? `, ${fixed} baseline entr${fixed === 1 ? 'y' : 'ies'} now resolved — run --update` : ''})`);

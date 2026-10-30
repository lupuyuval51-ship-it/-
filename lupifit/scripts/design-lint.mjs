// Design-system ratchet for client CSS (orange × black rules, see docs/PLAN.md §4).
// Counts generic-effect patterns per category; counts may only go down. Run with --update to
// lower the stored baseline after an improvement. Tokens in global.css are exempt where noted.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const baselineFile = path.join(root, 'scripts', 'design-lint-baseline.json');
const cssDirs = ['client/src'];

const categories = {
  gradient: { re: /\b(linear|radial|conic)-gradient\(/, msg: 'gradients are not part of the visual language' },
  backdrop: { re: /backdrop-filter\s*:/, msg: 'no glass/blur surfaces' },
  glow: { re: /(box-shadow|filter)\s*:[^;]*(var\(--(primary|success|warning|danger|info)|drop-shadow|rgb\((?!0 0 0))/, msg: 'colored shadows / glows' },
  shadow: { re: /box-shadow\s*:(?![^;]*(var\(--shadow-overlay\)|none|0 0 0 transparent))/, msg: 'shadows are for overlays only (use var(--shadow-overlay))' },
  pill: { re: /border-radius\s*:\s*(999px|9999px|50%)/, msg: 'pill/circle radius (only switch/avatar/dot are round)' },
  largeRadius: { re: /border-radius\s*:\s*(1[0-9]|[2-9][0-9])px/, msg: 'radius above 8px' },
  rawColor: { re: /#[0-9a-fA-F]{3,8}\b/, msg: 'raw hex color outside the token blocks' },
  pxFont: { re: /font-size\s*:\s*\d+px/, msg: 'font-size in px instead of a token' },
};

function collect() {
  const counts = Object.fromEntries(Object.keys(categories).map((k) => [k, 0]));
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.css')) scan(p);
    }
  };
  const scan = (file) => {
    const rel = path.relative(root, file);
    let inTokens = false;
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        // Theme token blocks in global.css define the palette; raw colors are expected there.
        if (rel.endsWith('global.css') && /^(:root|\[data-theme=)/.test(line)) inTokens = true;
        if (inTokens && line.startsWith('}')) {
          inTokens = false;
          return;
        }
        if (line.includes('design-lint-ignore')) return;
        for (const [k, c] of Object.entries(categories)) {
          if (inTokens && (k === 'rawColor' || k === 'pxFont' || k === 'shadow' || k === 'glow')) continue;
          if (c.re.test(line)) {
            counts[k]++;
            hits.push(`${rel}:${i + 1}: [${k}] ${c.msg}`);
          }
        }
      });
  };
  for (const d of cssDirs) walk(path.join(root, d));
  return { counts, hits };
}

const { counts, hits } = collect();
if (process.argv.includes('--update') || !fs.existsSync(baselineFile)) {
  fs.writeFileSync(baselineFile, JSON.stringify(counts, null, 2) + '\n');
  console.log('design-lint: baseline written', counts);
  process.exit(0);
}
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
const regressions = Object.keys(counts).filter((k) => counts[k] > (baseline[k] ?? 0));
if (process.argv.includes('--list')) console.log(hits.join('\n'));
if (regressions.length) {
  console.error(hits.filter((h) => regressions.some((k) => h.includes(`[${k}]`))).join('\n'));
  console.error(`design-lint: regressions in ${regressions.join(', ')} (now ${JSON.stringify(counts)}, baseline ${JSON.stringify(baseline)})`);
  process.exit(1);
}
const improved = Object.keys(counts).some((k) => counts[k] < (baseline[k] ?? 0));
console.log(`design-lint: OK ${JSON.stringify(counts)}${improved ? ' — improved; run `node scripts/design-lint.mjs --update` to lock it in' : ''}`);

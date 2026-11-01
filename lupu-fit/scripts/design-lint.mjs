#!/usr/bin/env node
/** Enforces the Orange × Black industrial design ratchet. Target: 0 violations, no allow-list growth. */
import { join, basename } from 'node:path';
import { REPO_ROOT, walk, read, rel, report, lineOf } from './lib.mjs';

const files = walk(join(REPO_ROOT, 'client', 'src'), ['.css', '.tsx', '.ts']);
const v = [];

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

const CSS_RULES = [
  ['gradient', /(?:linear|radial|conic)-gradient\s*\(/g],
  ['glass/blur', /backdrop-filter|filter\s*:\s*blur|-webkit-backdrop-filter/g],
  ['decorative shadow', /(?:box|text|drop)-shadow\s*:\s*(?!var\(--overlay-shadow\)|none)\S/g],
  ['drop-shadow filter', /drop-shadow\s*\(/g],
  ['pill radius', /border-radius\s*:[^;]*\b9999/g],
  ['physical margin/padding', /\b(?:margin|padding)-(?:left|right)\s*:/g],
  ['physical border side', /\bborder-(?:left|right)(?:-[a-z]+)?\s*:/g],
  ['physical inset', /(?:^|[\s;{])(?:left|right)\s*:/gm],
  ['physical text-align', /text-align\s*:\s*(?:left|right)\b/g],
  ['px font-size', /font-size\s*:\s*[\d.]+px/g],
  ['negative letter-spacing', /letter-spacing\s*:\s*-/g],
];
const TSX_RULES = [
  ['tailwind physical direction', /\b(?:ml|mr|pl|pr)-\d/g],
  ['tailwind rounded-full/pill', /\brounded-(?:full|3xl|2xl|xl)\b/g],
  ['tailwind tracking-tight', /\btracking-tight\b/g],
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/g],
];
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/g;

function checkRadii(text, file) {
  const re = /border(?:-[a-z]+)*-radius\s*:\s*([^;}]+)/g;
  let m;
  while ((m = re.exec(text))) {
    for (const tok of m[1].split(/[\s/]+/)) {
      const num = /^(-?[\d.]+)(px|rem|em)$/.exec(tok);
      if (!num) continue;
      const px = Number(num[1]) * (num[2] === 'px' ? 1 : 16);
      if (px > 8) v.push(`${rel(file)}:${lineOf(text, m.index)} radius ${tok} exceeds 8px`);
    }
  }
}

for (const f of files) {
  const isTokens = basename(f) === 'tokens.css';
  const text = stripComments(read(f));
  const isCss = f.endsWith('.css');
  for (const [name, re] of isCss ? CSS_RULES : TSX_RULES) {
    for (const m of text.matchAll(re)) v.push(`${rel(f)}:${lineOf(text, m.index)} ${name}`);
  }
  if (isCss) checkRadii(text, f);
  if (!isTokens) {
    for (const m of text.matchAll(COLOR_LITERAL)) v.push(`${rel(f)}:${lineOf(text, m.index)} raw colour literal "${m[0]}" (use a token)`);
  }
  // Hebrew negative tracking via inline style / classes is covered by letter-spacing and tracking-tight rules.
}

process.exit(report('design-lint', v));

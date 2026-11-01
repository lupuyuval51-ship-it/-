#!/usr/bin/env node
/** Parses tokens.css and proves WCAG contrast in Dark and Warm-Light themes. */
import { join } from 'node:path';
import { REPO_ROOT, read, report } from './lib.mjs';

const css = read(join(REPO_ROOT, 'client', 'src', 'styles', 'tokens.css'));

function vars(block) {
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}
/** Return the body of the first rule whose selector matches `sel`. */
function body(sel) {
  const i = css.indexOf(sel);
  if (i < 0) throw new Error(`selector not found: ${sel}`);
  const start = css.indexOf('{', i);
  let depth = 0;
  for (let j = start; j < css.length; j++) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}' && --depth === 0) return css.slice(start + 1, j);
  }
  throw new Error('unbalanced');
}

const dark = vars(body(':root {'));
const lightOverrides = vars(body(":root[data-theme='light']"));
const light = { ...dark, ...lightOverrides };
const autoLight = { ...dark, ...vars(body(':root:not([data-theme=\'dark\']):not([data-theme=\'light\'])')) };

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const v = [];
function check(theme, t) {
  const need = (fg, bg, min, why) => {
    const r = ratio(t[fg], t[bg]);
    const line = `${theme}: ${fg} ${t[fg]} on ${bg} ${t[bg]} = ${r.toFixed(2)}:1 (needs ${min}) ${why}`;
    if (r + 1e-9 < min) v.push(line);
    else if (process.env.VERBOSE) console.log(`ok ${line}`);
  };
  for (const bg of ['bg', 'surface', 'surface-2']) {
    need('text', bg, 4.5, 'body text');
    need('text-muted', bg, 4.5, 'secondary text');
    need('primary-text', bg, 4.5, 'orange text/links');
    for (const s of ['success', 'warning', 'danger']) need(s, bg, 4.5, 'status text');
  }
  for (const bg of ['bg', 'surface']) {
    need('border', bg, 3, 'UI border / tally remaining marks');
    need('tally-active', bg, 3, 'tally active mark');
    need('text', bg, 3, 'tally completed marks');
  }
  need('on-primary', 'primary', 7, 'black on orange CTA');
}
check('dark', dark);
check('light', light);
check('auto-light', autoLight);
process.exit(report('contrast-check', v));

#!/usr/bin/env tsx
/** he/en parity, Hebrew typography and zero hard-coded UI literals in .tsx. */
import { join } from 'node:path';
import { REPO_ROOT, walk, read, rel, report, lineOf } from './lib.mjs';
import { en } from '../shared/src/i18n/en.ts';
import { he } from '../shared/src/i18n/he.ts';

const v: string[] = [];

function flatten(o: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (typeof o === 'string') { out[prefix] = o; return out; }
  if (typeof o === 'object' && o !== null) for (const [k, val] of Object.entries(o)) flatten(val, prefix ? `${prefix}.${k}` : k, out);
  return out;
}
const fe = flatten(en); const fh = flatten(he);
for (const k of Object.keys(fe)) if (!(k in fh)) v.push(`missing he key: ${k}`);
for (const k of Object.keys(fh)) if (!(k in fe)) v.push(`extra he key (not in en): ${k}`);

const HEB = /[א-ת]/;
for (const [k, val] of Object.entries(fh)) {
  if (!HEB.test(val) && !/^[A-Z0-9 \-/]+$/i.test(val)) v.push(`he.${k} contains no Hebrew: "${val}"`);
  if (/[א-ת]"[א-ת]/.test(val)) v.push(`he.${k} uses ASCII " instead of gershayim ״: "${val}"`);
  if (/[א-ת]'(?![\w])/.test(val)) v.push(`he.${k} uses ASCII ' instead of geresh ׳: "${val}"`);
  if (/[א-ת]\/[א-ת]{1}\b/.test(val) && /(?:^|\s)\S+\/[יה]\b/.test(val)) v.push(`he.${k} uses a gendered slash form: "${val}"`);
}
if (fh['unit.kg'] !== 'ק״ג') v.push('he unit.kg must be ק״ג with U+05F4');
if (fh['unit.cm'] !== 'ס״מ') v.push('he unit.cm must be ס״מ with U+05F4');
if (fh['unit.kcal'] !== 'קק״ל') v.push('he unit.kcal must be קק״ל with U+05F4');
if (fh['unit.min'] !== 'דק׳') v.push('he unit.min must be דק׳ with U+05F3');
if (fh['unit.sec'] !== 'שנ׳') v.push('he unit.sec must be שנ׳ with U+05F3');

// Hard-coded literals in components
const tsx = walk(join(REPO_ROOT, 'client', 'src'), ['.tsx']);
const JSX_TEXT = /(?<![=\-])>\s*([^<>{}\n;()=&|?:]*[A-Za-z\u05D0-\u05EA]{2,}[^<>{}\n;()=&|?:]*)\s*</g;
const BRAND = new Set(['LUPU', 'FIT', 'LUPU-FIT', 'EN']);
const ATTR = /\b(?:aria-label|placeholder|title|alt)=("[^"{}]*[A-Za-zא-ת][^"{}]*")/g;
for (const f of tsx) {
  const text = read(f);
  for (const re of [JSX_TEXT, ATTR]) {
    for (const m of text.matchAll(re)) {
      const line = text.split('\n')[lineOf(text, m.index) - 1] ?? '';
      if (line.includes('copy-ok') || BRAND.has((m[1] ?? '').trim())) continue;
      v.push(`${rel(f)}:${lineOf(text, m.index)} hard-coded UI string ${JSON.stringify((m[1] ?? '').trim())}`);
    }
  }
}
process.exit(report('copy-lock', v));

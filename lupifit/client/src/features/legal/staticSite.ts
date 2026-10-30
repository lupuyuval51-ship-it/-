/**
 * The legal pages as static HTML files (Hebrew and English), for a public URL without a server.
 *
 * Google Play needs a public privacy-policy URL (and, for apps with accounts, a deletion URL) even when the
 * app itself needs no server. `npm run legal:static` (scripts/legal-static.mjs) writes these files to
 * dist/legal/; upload that folder to any free static host (see docs/device-mode.md). Same texts as the
 * in-app pages (./documents.ts), self-contained (inline CSS, no scripts, no fonts or images from elsewhere).
 *
 * Pure: no React, no DOM, no build-time constants, so it runs in Node through tsx and in the tests.
 */
import type { TKey, TParams } from '../../i18n';
import { en } from '../../i18n/locales/en';
import { he } from '../../i18n/locales/he';
import { LEGAL_UPDATED, legalDocument, splitPlaceholders, type LegalDoc, type LegalDocName, type LegalMode, type LegalText } from './documents';

export type StaticLocale = 'he' | 'en';

export interface StaticFile {
  /** Path inside the output folder ("privacy.html", "en/privacy.html", …). */
  path: string;
  html: string;
}

const DICTIONARIES: Record<StaticLocale, unknown> = { en, he };
const LOCALES: StaticLocale[] = ['he', 'en'];

/** The pages, in menu order, and their file names (the same paths as the app's routes). */
export const STATIC_PAGES: { name: LegalDocName; file: string }[] = [
  { name: 'privacy', file: 'privacy.html' },
  { name: 'terms', file: 'terms.html' },
  { name: 'deletion', file: 'account-deletion.html' },
];

function lookup(dict: unknown, key: string): unknown {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return node;
}

/** `t()` for these pages: same lookup and `{param}` interpolation as the app; a missing key is an error. */
export function translateStatic(locale: StaticLocale, key: TKey, params?: TParams): string {
  const value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES.en, key);
  if (typeof value !== 'string') throw new Error(`legal static pages: no text for ${key}`);
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = params[name];
    return v === undefined || v === null ? m : String(v);
  });
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

/** Text with its [placeholders] marked, as on the in-app pages. */
function rich(text: string): string {
  return splitPlaceholders(text)
    .map((part) => (part.placeholder ? `<mark>${escapeHtml(part.text)}</mark>` : escapeHtml(part.text)))
    .join('');
}

const pagePath = (locale: StaticLocale, file: string) => (locale === 'he' ? file : `en/${file}`);
/** Link from a page of `from` to `to` (Hebrew pages are at the top, English ones in en/). */
const href = (from: StaticLocale, to: StaticLocale, file: string) => (from === to ? file : from === 'he' ? `en/${file}` : `../${file}`);

const CSS = `
:root{color-scheme:light dark;--bg:#ffffff;--text:#151517;--muted:#56565c;--line:#d9d9de;--accent:#b34700;--mark:#ffe3c9}
@media (prefers-color-scheme:dark){:root{--bg:#0b0b0d;--text:#f2f2f3;--muted:#a9a9b0;--line:#2c2c31;--accent:#ff8a3d;--mark:#4d2a0d}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:1rem/1.65 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Hebrew",Arial,sans-serif;overflow-wrap:anywhere}
main{max-width:46rem;margin:0 auto;padding:1.25rem 1rem 3rem}
a{color:var(--accent)}
a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.top{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;justify-content:space-between;border-block-end:1px solid var(--line);padding-block-end:.75rem}
.top ul{display:flex;flex-wrap:wrap;gap:.25rem 1rem;list-style:none;margin:0;padding:0}
.brand{font-weight:700}
h1{font-size:1.75rem;line-height:1.25;margin:1.5rem 0 .25rem}
h2{font-size:1.2rem;margin:2rem 0 .5rem}
.updated{color:var(--muted);margin:0 0 1rem}
.note{border:1px solid var(--line);border-inline-start:4px solid var(--accent);border-radius:6px;padding:.75rem 1rem;margin:1rem 0}
.note p{margin:.25rem 0 0}
.toc{border:1px solid var(--line);border-radius:6px;padding:.75rem 1rem;margin:1rem 0}
.toc h2{margin:0 0 .25rem;font-size:1rem}
mark{background:var(--mark);color:inherit;border-radius:2px;padding:0 .15em}
li{margin:.35rem 0}
footer{color:var(--muted);border-block-start:1px solid var(--line);margin-block-start:2.5rem;padding-block-start:.75rem;font-size:.9rem}
`.trim();

function navLabel(name: LegalDocName, mode: LegalMode): TKey {
  if (name === 'privacy') return 'legal.nav.privacy';
  if (name === 'terms') return 'legal.nav.terms';
  return mode === 'device' ? 'legal.nav.deletionDevice' : 'legal.nav.deletion';
}

function shell(locale: StaticLocale, title: string, body: string): string {
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(title)} · LUPU-FIT</title>
<style>${CSS}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

function topNav(locale: StaticLocale, mode: LegalMode, current: string): string {
  const t = (key: TKey) => translateStatic(locale, key);
  const other: StaticLocale = locale === 'he' ? 'en' : 'he';
  const links = STATIC_PAGES.map(
    (p) => `<li><a href="${href(locale, locale, p.file)}"${p.file === current ? ' aria-current="page"' : ''}>${escapeHtml(t(navLabel(p.name, mode)))}</a></li>`,
  ).join('');
  const switchTo = current || 'index.html';
  return `<header class="top">
<span class="brand">LUPU-FIT</span>
<nav aria-label="${escapeHtml(t('legal.nav.label'))}"><ul>${links}</ul></nav>
<a href="${href(locale, other, switchTo)}" lang="${other}" hreflang="${other}">${escapeHtml(translateStatic(other, `common.language.${other}` as TKey))}</a>
</header>`;
}

function renderDocument(doc: LegalDoc, locale: StaticLocale, mode: LegalMode): string {
  const t = (key: TKey, params?: TParams) => translateStatic(locale, key, params);
  const text = (item: LegalText) => (typeof item === 'string' ? t(item) : t(item.key, item.params));
  const paragraphs = (items: LegalText[] | undefined) => (items ?? []).map((item) => `<p>${rich(text(item))}</p>`).join('\n');
  const date = new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${LEGAL_UPDATED[mode]}T00:00:00Z`),
  );
  const toc = doc.toc
    ? `<nav class="toc" aria-labelledby="toc-title"><h2 id="toc-title">${escapeHtml(t('legal.contents'))}</h2><ol>${doc.sections
        .map((s) => `<li><a href="#${s.id}">${escapeHtml(t(s.title))}</a></li>`)
        .join('')}</ol></nav>`
    : '';
  const sections = doc.sections
    .map((s) => {
      const tag = s.ordered ? 'ol' : 'ul';
      const list = s.list ? `<${tag}>${s.list.map((item) => `<li>${rich(text(item))}</li>`).join('\n')}</${tag}>` : '';
      return `<section id="${s.id}" aria-labelledby="${s.id}-title">
<h2 id="${s.id}-title">${escapeHtml(t(s.title))}</h2>
${paragraphs(s.body)}
${list}
${paragraphs(s.after)}
</section>`;
    })
    .join('\n');
  return `<article>
<h1>${escapeHtml(t(doc.title))}</h1>
<p class="updated">${escapeHtml(t('legal.updated', { date }))}</p>
<div class="note" role="note"><strong>${escapeHtml(t('legal.draft.title'))}</strong><p>${rich(t('legal.draft.body'))}</p></div>
<p>${rich(t(doc.intro))}</p>
${toc}
${sections}
</article>`;
}

function renderIndex(mode: LegalMode): string {
  const blocks = LOCALES.map((locale) => {
    const items = STATIC_PAGES.map((p) => `<li><a href="${pagePath(locale, p.file)}">${escapeHtml(translateStatic(locale, navLabel(p.name, mode)))}</a></li>`).join('');
    return `<section lang="${locale}" dir="${locale === 'he' ? 'rtl' : 'ltr'}"><h2>${escapeHtml(translateStatic(locale, `common.language.${locale}` as TKey))}</h2><ul>${items}</ul></section>`;
  }).join('\n');
  return shell('he', translateStatic('he', 'legal.nav.label'), `<h1>LUPU-FIT</h1>\n${blocks}`);
}

/** Every file of the static legal site for `mode` (device mode by default: the Android app's texts). */
export function renderLegalSite(mode: LegalMode = 'device'): StaticFile[] {
  const files: StaticFile[] = [{ path: 'index.html', html: renderIndex(mode) }];
  for (const locale of LOCALES) {
    const label = (key: TKey) => translateStatic(locale, key);
    for (const page of STATIC_PAGES) {
      const doc = legalDocument(page.name, mode, label);
      const body = `${topNav(locale, mode, page.file)}\n${renderDocument(doc, locale, mode)}\n<footer>LUPU-FIT</footer>`;
      files.push({ path: pagePath(locale, page.file), html: shell(locale, translateStatic(locale, doc.title), body) });
    }
  }
  return files;
}

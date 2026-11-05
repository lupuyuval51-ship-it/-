/**
 * Plan export: a typographically clean, direction-correct HTML document of one plan version,
 * printed to PDF (native: expo-print → share sheet; web: the browser's print dialog, where the
 * user can "Save as PDF").
 *
 * `buildPlanHtml` is pure (tested in __tests__/export.test.ts). All dynamic text is escaped;
 * only http(s) source links become anchors.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { BASIS_VALUES, PLAN_SECTION_KEYS, type Basis, type PlanSectionContent, type PlanSectionKey } from '@domain/plan';
import { formatDate } from '@/i18n/format';
import { translate, type TranslationKey } from '@/i18n/translate';
import { isRTLLocale, type Locale, type TranslateVars } from '@/i18n/types';
import { safeHttpUrl } from './logic';

export { safeHttpUrl };

export interface PlanExportInput {
  locale: Locale;
  businessName: string;
  versionNumber: number;
  sections: Partial<Record<PlanSectionKey, PlanSectionContent | null>>;
  /** Defaults to now. */
  generatedAt?: Date;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for HTML element content and quoted attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}


/** Escaped text with paragraphs (blank lines) and line breaks preserved. */
function paragraphs(text: string, className?: string): string {
  const cls = className ? ` class="${className}"` : '';
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
    .map((p) => `<p${cls}>${escapeHtml(p).replace(/\r?\n/g, '<br>')}</p>`)
    .join('');
}

function basisTag(t: (key: TranslationKey, vars?: TranslateVars) => string, basis: Basis, source: { title: string; url: string } | null | undefined): string {
  const label = escapeHtml(t(`common.basis.${basis}`));
  if (basis === 'verified' && source) {
    const url = safeHttpUrl(source.url);
    const title = escapeHtml(source.title);
    const sourceHtml = url ? `<a href="${escapeHtml(url)}">${title}</a>` : title;
    return `<p class="basis basis-${basis}">${label} · <bdi>${sourceHtml}</bdi></p>`;
  }
  return `<p class="basis basis-${basis}">${label}</p>`;
}

function styles(rtl: boolean): string {
  const fontStack = rtl
    ? `"Heebo", "Arial Hebrew", "Noto Sans Hebrew", "Segoe UI", "Helvetica Neue", Arial, sans-serif`
    : `"Inter", "Helvetica Neue", "Segoe UI", Arial, sans-serif`;
  return `
@page { size: A4; margin: 22mm 20mm 24mm; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; color: #181B18; background: #FFFFFF; font-family: ${fontStack}; font-size: 11pt; line-height: 1.6; font-variant-numeric: tabular-nums; }
main { max-width: 680px; margin: 0 auto; padding: 0 4px; }
h1, h2, h3 { font-weight: 600; line-height: 1.25; margin: 0; }
p { margin: 0 0 8pt; text-align: start; orphans: 3; widows: 3; }
a { color: #176B49; text-decoration: none; border-bottom: 0.5pt solid #9BC3AE; }
.title-page { min-height: 230mm; display: flex; flex-direction: column; justify-content: center; break-after: page; page-break-after: always; }
.overline { font-size: 9pt; letter-spacing: ${rtl ? '0' : '0.06em'}; ${rtl ? '' : 'text-transform: uppercase;'} color: #737970; margin-bottom: 10pt; }
.title-page h1 { font-size: 30pt; letter-spacing: ${rtl ? '0' : '-0.01em'}; margin-bottom: 14pt; }
.meta { color: #737970; font-size: 10pt; margin: 0 0 2pt; }
.notice { margin-top: 28pt; padding-top: 10pt; border-top: 0.5pt solid #D3D6CE; color: #4A4F49; font-size: 9.5pt; max-width: 120mm; }
.notice strong { display: block; font-weight: 600; color: #181B18; margin-bottom: 2pt; }
.toc h2, .legend h2 { font-size: 13pt; margin-bottom: 10pt; }
.toc ol { list-style: none; margin: 0 0 24pt; padding: 0; }
.toc li { display: flex; gap: 10pt; padding: 5pt 0; border-bottom: 0.5pt solid #E5E7E1; font-size: 10.5pt; }
.toc .num, .plan-section .num { color: #737970; min-width: 18pt; display: inline-block; }
.legend { break-after: page; page-break-after: always; }
.legend dl { margin: 0; }
.legend dt { font-weight: 600; font-size: 10pt; margin-top: 8pt; }
.legend dd { margin: 0; color: #4A4F49; font-size: 10pt; }
.plan-section { margin: 0 0 26pt; }
.plan-section h2 { font-size: 16pt; padding-bottom: 6pt; margin-bottom: 10pt; border-bottom: 0.5pt solid #D3D6CE; break-after: avoid; page-break-after: avoid; }
.lede { font-size: 12pt; color: #2D312C; margin-bottom: 12pt; }
.block { margin: 0 0 12pt; break-inside: avoid; page-break-inside: avoid; }
.block p { margin-bottom: 3pt; }
.basis { font-size: 8.5pt; color: #737970; margin: 0; }
.basis-verified { color: #176B49; }
footer { margin-top: 32pt; padding-top: 10pt; border-top: 0.5pt solid #D3D6CE; color: #737970; font-size: 9pt; }
`;
}

/** Builds the export document for one plan version. Sections render in display order; missing ones are skipped. */
export function buildPlanHtml(input: PlanExportInput): string {
  const { locale } = input;
  const t = (key: TranslationKey, vars?: TranslateVars) => translate(locale, key, vars);
  const rtl = isRTLLocale(locale);
  const dir = rtl ? 'rtl' : 'ltr';
  const generatedDate = formatDate(input.generatedAt ?? new Date(), locale, { style: 'long' });
  const docTitle = t('plan.export.documentTitle');
  const businessName = escapeHtml(input.businessName.trim() || docTitle);

  const keys = PLAN_SECTION_KEYS.filter((key) => {
    const content = input.sections[key];
    return content !== undefined && content !== null && content.blocks.length > 0;
  });

  const toc = keys
    .map((key, i) => `<li><span class="num">${i + 1}</span><a href="#section-${key}">${escapeHtml(t(`plan.sections.${key}`))}</a></li>`)
    .join('');

  const legend = BASIS_VALUES.map(
    (basis) => `<dt>${escapeHtml(t(`common.basis.${basis}`))}</dt><dd>${escapeHtml(t(`plan.legend.${basis}`))}</dd>`,
  ).join('');

  const sectionsHtml = keys
    .map((key, i) => {
      const content = input.sections[key] as PlanSectionContent;
      const lede = content.summary.trim() !== '' ? paragraphs(content.summary, 'lede') : '';
      const blocks = content.blocks
        .map((block) => `<div class="block">${paragraphs(block.text)}${basisTag(t, block.basis, block.source)}</div>`)
        .join('');
      return `<section class="plan-section" id="section-${key}"><h2><span class="num">${i + 1}</span> ${escapeHtml(t(`plan.sections.${key}`))}</h2>${lede}${blocks}</section>`;
    })
    .join('');

  const versionLine = escapeHtml(t('plan.export.versionLine', { number: input.versionNumber }));
  const generatedLine = escapeHtml(t('plan.export.generatedOn', { date: generatedDate }));
  const disclaimerTitle = escapeHtml(t('plan.export.disclaimerTitle'));
  const disclaimer = escapeHtml(t('plan.export.disclaimer'));

  return [
    '<!DOCTYPE html>',
    `<html lang="${locale}" dir="${dir}">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${businessName} · ${escapeHtml(docTitle)}</title>`,
    `<style>${styles(rtl)}</style>`,
    '</head>',
    `<body dir="${dir}">`,
    '<main>',
    `<section class="title-page"><p class="overline">${escapeHtml(docTitle)}</p><h1><bdi>${businessName}</bdi></h1><p class="meta">${versionLine}</p><p class="meta">${generatedLine}</p><div class="notice"><strong>${disclaimerTitle}</strong>${disclaimer}</div></section>`,
    `<nav class="toc"><h2>${escapeHtml(t('plan.export.contents'))}</h2><ol>${toc}</ol></nav>`,
    `<section class="legend"><h2>${escapeHtml(t('plan.export.legendTitle'))}</h2><dl>${legend}</dl></section>`,
    sectionsHtml,
    `<footer><p>${disclaimer}</p><p>${generatedLine} · ${versionLine}</p></footer>`,
    '</main>',
    '</body>',
    '</html>',
  ].join('\n');
}

export type PlanExportResult = 'shared' | 'printed';

/** A4 at 72 PPI. */
const A4 = { width: 595, height: 842 } as const;

/** Web: print the document from a hidden iframe (expo-print's web printAsync prints the app page itself). */
async function printHtmlOnWeb(html: string): Promise<void> {
  if (typeof document === 'undefined') {
    await Print.printAsync({ html });
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    const cleanup = () => setTimeout(() => frame.remove(), 1000);
    frame.onload = () => {
      try {
        const win = frame.contentWindow;
        if (!win) throw new Error('print frame unavailable');
        win.focus();
        win.print();
        cleanup();
        resolve();
      } catch (e) {
        cleanup();
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}

/**
 * Exports the plan as PDF. Native: renders a PDF and opens the share sheet (falls back to the
 * system print dialog when sharing is unavailable). Web: opens the browser print dialog.
 */
export async function exportPlanPdf(input: PlanExportInput): Promise<PlanExportResult> {
  const html = buildPlanHtml(input);
  if (Platform.OS === 'web') {
    await printHtmlOnWeb(html);
    return 'printed';
  }
  const { uri } = await Print.printToFileAsync({ html, width: A4.width, height: A4.height });
  if (!(await Sharing.isAvailableAsync())) {
    await Print.printAsync({ uri });
    return 'printed';
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: translate(input.locale, 'plan.export.shareDialogTitle'),
  });
  return 'shared';
}

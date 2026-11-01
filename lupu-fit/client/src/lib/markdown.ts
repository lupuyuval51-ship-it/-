/**
 * Minimal SAFE markdown: **bold**, "-"/"*"/"•" bullet lists, "1." numbered lists, line breaks, paragraphs.
 * Output is React nodes built with createElement; raw text is never interpreted as HTML.
 */
import { createElement, Fragment, type ReactNode } from 'react';

export interface Inline { text: string; bold: boolean }
export type Block = { type: 'p'; lines: Inline[][] } | { type: 'ul' | 'ol'; items: Inline[][] };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+?)\*\*|__([^_]+?)__/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), bold: false });
    out.push({ text: (m[1] ?? m[2]) as string, bold: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), bold: false });
  return out;
}

const BULLET = /^\s*(?:[-*•])\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of src.replace(/\r\n?/g, '\n').split('\n')) {
    if (raw.trim() === '') { blocks.push({ type: 'p', lines: [] }); continue; } // paragraph break marker
    const ul = BULLET.exec(raw); const ol = NUMBERED.exec(raw);
    const last = blocks[blocks.length - 1];
    if (ul || ol) {
      const type = ul ? 'ul' : 'ol'; const text = (ul ?? ol)![1] as string;
      if (last && last.type === type) last.items.push(parseInline(text)); else blocks.push({ type, items: [parseInline(text)] });
    } else if (last && last.type === 'p' && last.lines.length > 0) last.lines.push(parseInline(raw));
    else if (last && last.type === 'p' && last.lines.length === 0) { last.lines.push(parseInline(raw)); }
    else blocks.push({ type: 'p', lines: [parseInline(raw)] });
  }
  return blocks.filter((b) => (b.type === 'p' ? b.lines.length > 0 : b.items.length > 0));
}

const inlineNodes = (parts: Inline[], keyBase: string): ReactNode[] =>
  parts.map((p, i) => (p.bold ? createElement('strong', { key: `${keyBase}-${i}` }, p.text) : createElement(Fragment, { key: `${keyBase}-${i}` }, p.text)));

export function renderMarkdown(src: string): ReactNode[] {
  return parseMarkdown(src).map((b, bi) => {
    if (b.type === 'p') {
      const kids: ReactNode[] = [];
      b.lines.forEach((l, li) => { if (li > 0) kids.push(createElement('br', { key: `br-${bi}-${li}` })); kids.push(...inlineNodes(l, `p${bi}-${li}`)); });
      return createElement('p', { key: `b${bi}`, className: 'md-p' }, ...kids);
    }
    return createElement(b.type, { key: `b${bi}`, className: 'md-list' }, ...b.items.map((it, ii) => createElement('li', { key: `i${ii}` }, ...inlineNodes(it, `l${bi}-${ii}`))));
  });
}

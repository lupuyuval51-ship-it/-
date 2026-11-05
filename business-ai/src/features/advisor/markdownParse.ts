/**
 * A deliberately tiny, safe Markdown subset for advisor replies. Pure — the renderer lives in
 * ./markdown.tsx.
 *
 * Blocks: ATX headings (#, ##, ### — deeper levels render as level 3), paragraphs (soft line
 * breaks join with a space), bullet lists (-, *, +), numbered lists (1. / 1)), one nested level
 * (indent ≥ 2 spaces), fenced code blocks, horizontal rules, block quotes (rendered as plain
 * paragraphs).
 * Inline: **strong** / __strong__, `code`, *emphasis* / _emphasis_ (markers removed), backslash
 * escapes, and [label](url) which renders as plain text — nothing is ever a tappable link.
 *
 * Everything else is plain text: HTML is never interpreted, it shows as typed.
 * Unterminated markers (common while a reply is still streaming) stay literal.
 */

export type MdInline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: MdInline[] }
  | { type: 'em'; children: MdInline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; url: string };

export interface MdListItem {
  ordered: boolean;
  /** Number as written in the source (ordered items), else 0. */
  number: number;
  /** 0 = top level, 1 = nested. */
  depth: 0 | 1;
  children: MdInline[];
}

export type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3; children: MdInline[] }
  | { type: 'paragraph'; children: MdInline[] }
  | { type: 'list'; items: MdListItem[] }
  | { type: 'code'; text: string }
  | { type: 'rule' };

const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const EMPTY_HEADING = /^ {0,3}(#{1,6})[ \t]*$/;
const BULLET = /^([ \t]*)[-*+][ \t]+(.*)$/;
const ORDERED = /^([ \t]*)(\d{1,9})[.)][ \t]+(.*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}>[ \t]?(.*)$/;

function indentWidth(ws: string): number {
  let w = 0;
  for (const ch of ws) w += ch === '\t' ? 4 : 1;
  return w;
}

export function parseMarkdown(source: string): MdBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MdBlock[] = [];
  let paragraph: string[] = [];
  let list: MdListItem[] | null = null;
  /** Raw text of the list item being built (continuation lines append to it). */
  let itemText: string[] = [];
  let itemMeta: Omit<MdListItem, 'children'> | null = null;

  function flushItem() {
    if (itemMeta && list) list.push({ ...itemMeta, children: parseInline(itemText.join(' ')) });
    itemMeta = null;
    itemText = [];
  }
  function flushList() {
    flushItem();
    if (list && list.length > 0) blocks.push({ type: 'list', items: list });
    list = null;
  }
  function flushParagraph() {
    if (paragraph.length > 0) blocks.push({ type: 'paragraph', children: parseInline(paragraph.join(' ')) });
    paragraph = [];
  }
  function flushAll() {
    flushParagraph();
    flushList();
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const line = raw.replace(/[ \t]+$/, '');

    const fence = FENCE.exec(line);
    if (fence) {
      flushAll();
      const marker = fence[1]!;
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trimStart().startsWith(marker)) {
        body.push(lines[i]!);
        i++;
      }
      // i now points at the closing fence (or past the end while streaming).
      blocks.push({ type: 'code', text: body.join('\n') });
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      // A blank line inside a list ends the current item but keeps the list open.
      flushItem();
      continue;
    }

    const heading = HEADING.exec(line) ?? EMPTY_HEADING.exec(line);
    if (heading) {
      flushAll();
      const level = Math.min(heading[1]!.length, 3) as 1 | 2 | 3;
      const text = heading[2] ?? '';
      if (text.trim() !== '') blocks.push({ type: 'heading', level, children: parseInline(text) });
      continue;
    }

    if (RULE.test(line)) {
      flushAll();
      blocks.push({ type: 'rule' });
      continue;
    }

    const bullet = BULLET.exec(line);
    const ordered = bullet ? null : ORDERED.exec(line);
    if (bullet || ordered) {
      flushParagraph();
      flushItem();
      if (!list) list = [];
      const indent = indentWidth((bullet ? bullet[1] : ordered![1]) ?? '');
      itemMeta = {
        ordered: Boolean(ordered),
        number: ordered ? Number(ordered[2]) : 0,
        depth: indent >= 2 ? 1 : 0,
      };
      itemText = [(bullet ? bullet[2] : ordered![3]) ?? ''];
      continue;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      flushList();
      const text = quote[1] ?? '';
      if (text.trim() === '') flushParagraph();
      else paragraph.push(text.trim());
      continue;
    }

    // Continuation line: belongs to the open list item when indented (or lazily right after it).
    if (itemMeta && (/^[ \t]+/.test(line) || itemText.length > 0)) {
      itemText.push(line.trim());
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }
  flushAll();
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Inline                                                              */
/* ------------------------------------------------------------------ */

const ESCAPABLE = new Set('\\`*_[]()#+-.!>~|'.split(''));

function isSpace(ch: string | undefined): boolean {
  return ch === undefined || /\s/.test(ch);
}

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
}

/** Finds the closing `marker` starting at `from`, skipping escaped characters and code spans. */
function findClosing(text: string, marker: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        i = end;
        continue;
      }
    }
    if (text.startsWith(marker, i)) {
      // Closing marker must follow a non-space character.
      if (!isSpace(text[i - 1])) {
        // For single markers, don't match the first half of a double marker.
        if (marker.length === 1 && text[i + 1] === marker) {
          i++;
          continue;
        }
        return i;
      }
    }
  }
  return -1;
}

function pushText(out: MdInline[], text: string) {
  if (text === '') return;
  const last = out[out.length - 1];
  if (last && last.type === 'text') last.text += text;
  else out.push({ type: 'text', text });
}

export function parseInline(text: string, depth = 0): MdInline[] {
  const out: MdInline[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;

    if (ch === '\\' && i + 1 < text.length && ESCAPABLE.has(text[i + 1]!)) {
      pushText(out, text[i + 1]!);
      i += 2;
      continue;
    }

    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i + 1) {
        out.push({ type: 'code', text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (depth < 4 && (text.startsWith('**', i) || text.startsWith('__', i))) {
      const marker = text.slice(i, i + 2);
      const openOk = !isSpace(text[i + 2]) && (marker === '**' || !isWordChar(text[i - 1]));
      const close = openOk ? findClosing(text, marker, i + 2) : -1;
      if (close > i + 2 && (marker === '**' || !isWordChar(text[close + 2]))) {
        out.push({ type: 'strong', children: parseInline(text.slice(i + 2, close), depth + 1) });
        i = close + 2;
        continue;
      }
    }

    if (depth < 4 && (ch === '*' || ch === '_') && text[i + 1] !== ch) {
      const openOk = !isSpace(text[i + 1]) && (ch === '*' || !isWordChar(text[i - 1]));
      const close = openOk ? findClosing(text, ch, i + 1) : -1;
      if (close > i + 1 && (ch === '*' || !isWordChar(text[close + 1]))) {
        out.push({ type: 'em', children: parseInline(text.slice(i + 1, close), depth + 1) });
        i = close + 1;
        continue;
      }
    }

    if (ch === '[') {
      const m = /^\[([^\]\n]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(text.slice(i));
      if (m) {
        out.push({ type: 'link', text: m[1]!, url: m[2]! });
        i += m[0].length;
        continue;
      }
    }

    pushText(out, ch);
    i++;
  }
  return out;
}

/** Plain text of inline nodes (accessibility labels, previews). */
export function inlineToPlainText(nodes: MdInline[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case 'text':
        case 'code':
          return n.text;
        case 'link':
          return n.text;
        case 'strong':
        case 'em':
          return inlineToPlainText(n.children);
      }
    })
    .join('');
}

/** One-line plain-text preview of a Markdown reply (conversation list). */
export function markdownPreview(source: string, maxLength = 140): string {
  const parts: string[] = [];
  for (const block of parseMarkdown(source)) {
    if (block.type === 'heading' || block.type === 'paragraph') parts.push(inlineToPlainText(block.children));
    else if (block.type === 'list') parts.push(...block.items.map((item) => inlineToPlainText(item.children)));
    else if (block.type === 'code') parts.push(block.text);
    if (parts.join(' ').length > maxLength) break;
  }
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
